import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/anthropic'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import { rateLimit } from '@/lib/rateLimit'
import type { SessionContext } from '@/types'

export async function GET() {
  return Response.json({
    status: 'ok',
    groqKeyPresent: !!process.env.GROQ_API_KEY?.trim(),
  })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 30 AI answers per minute per user
    const rl = rateLimit(`answer:${session.user.id}`, 30, 60_000)
    if (!rl.allowed) {
      return Response.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }

    const body = await req.json()
    const {
      question,
      images,
      isDesiMode,
      interviewType,
      sessionContext,
      qaHistory,
    } = body as {
      question?: string
      images?: string[]
      isDesiMode?: boolean
      interviewType?: string
      language?: string
      sessionContext?: SessionContext | null
      qaHistory?: { question: string; answer: string }[]
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const hasImages = Array.isArray(images) && images.length > 0

    if (!hasImages && (!question || question.trim().length < 3)) {
      return Response.json({ error: 'Question too short' }, { status: 400 })
    }

    const sc = sessionContext
    const roleLabel = sc?.jobRole || 'this role'
    const resume = sc?.resumeText ? sanitizeReadableText(sc.resumeText, 2500) : ''
    const jd = sc?.jobDescription ? sanitizeReadableText(sc.jobDescription, 1500) : ''

    // Identity block — who the candidate is
    const identityLines: string[] = []
    if (roleLabel !== 'this role') identityLines.push(`Target role: ${roleLabel}`)
    if (jd) identityLines.push(`Job description:\n${jd}`)
    if (resume) identityLines.push(`My resume / background:\n${resume}`)
    const identityBlock = identityLines.join('\n\n')

    // Conversation history — last 4 Q&A pairs so AI handles follow-ups
    const recentHistory = (qaHistory ?? []).slice(-4)
    const historyBlock = recentHistory.length > 0
      ? '\n\nCONVERSATION SO FAR:\n' + recentHistory
          .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
          .join('\n\n')
      : ''

    // Classify question type
    const questionLower = (question ?? '').toLowerCase()
    const isBehavioral = /tell me about|describe a time|give me an example|walk me through|situation where|how did you|what did you do|greatest (strength|weakness)|why should|why do you want|biggest challenge/.test(questionLower)
    const isTechnical = /^(what is|explain|how does|difference between|when would you|implement|algorithm|complexity|debug|optimize)/.test(questionLower) || interviewType === 'technical' || interviewType === 'coding'
    const isFollowUp = /tell me more|elaborate|can you explain|go deeper|expand on|what do you mean|give me an example of that|say more/.test(questionLower)

    let strategyNote = ''
    if (isFollowUp) {
      strategyNote = 'This is a follow-up to the previous answer. Expand with more specific detail, a concrete example, or a metric/outcome not yet mentioned. Do NOT repeat what was already said.'
    } else if (isBehavioral) {
      strategyNote = 'Use the STAR format (Situation → Task → Action → Result). Reference a specific project or experience from the resume — mention real company names, tech, and outcomes.'
    } else if (isTechnical) {
      strategyNote = 'Give a clear, confident explanation with the correct definition, then mention how you have personally applied this in your work using details from the resume.'
    } else {
      strategyNote = 'Answer naturally and confidently. Reference specific experience from the resume where relevant.'
    }

    const baseRules = `
RULES:
- Answer in FIRST PERSON as "I" — you ARE the candidate, not a coach.
- ${strategyNote}
- ONLY use technologies, companies, and facts that are explicitly written in the resume above. If a technology (e.g. Redis, Docker, Kafka) is NOT in the resume, do NOT mention it — not even as an example.
- Do NOT invent, assume, or add anything beyond what the resume states.
- Sound confident and human — not like a textbook or template.
- Structure your answer in exactly 3 short parts separated by " | ":
  PART 1 (1 sentence): The direct answer / key point — say this first.
  PART 2 (2 sentences max): Specific details from actual experience — company names, tech from resume, real numbers.
  PART 3 (1 sentence): The concrete result or outcome that proves it.
- Every sentence must add new information. No filler, no restating what was already said.
- Keep the full answer under 130 words total.
- Never start with "Sure!", "Great question!", "Certainly!" or filler.
- Never output role labels like "Assistant:" or "User:".`

    const systemPrompt = isDesiMode
      ? `You are a job candidate answering interview questions in your own voice.

${identityBlock}${historyBlock}

Speak the way Indian professionals naturally talk — confident, direct, conversational.
${baseRules}`
      : `You are a job candidate answering interview questions in your own voice.

${identityBlock}${historyBlock}
${baseRules}`

    // Use vision model when screenshots are attached
    const model = hasImages
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile'

    const userContent = hasImages
      ? [
          {
            type: 'text' as const,
            text: question?.trim()
              ? `Interview question: "${question}"\n\nPlease analyze the attached screenshot(s) and provide a helpful answer.`
              : 'Please analyze the attached screenshot(s) and provide a helpful answer for this coding/technical interview question.',
          },
          ...images!.map(img => ({
            type: 'image_url' as const,
            image_url: { url: img },
          })),
        ]
      : (`Interview question: "${question ?? ''}"` as string)

    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: 650,
      temperature: 0.55,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('interview-answer error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}
