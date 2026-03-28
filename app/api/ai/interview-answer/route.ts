import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/anthropic'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import type { SessionContext } from '@/types'

export async function GET() {
  return Response.json({
    status: 'ok',
    groqKeyPresent: !!process.env.GROQ_API_KEY?.trim(),
  })
}

export async function POST(req: Request) {
  try {
    // Auth guard — prevent unauthenticated API abuse
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('API called, GROQ_API_KEY present:', !!process.env.GROQ_API_KEY?.trim())

    const body = await req.json()
    const {
      question,
      isDesiMode,
      interviewType,
      sessionContext,
    } = body as {
      question?: string
      isDesiMode?: boolean
      interviewType?: string
      language?: string
      sessionContext?: SessionContext | null
    }

    console.log('interview-answer called:', { question, isDesiMode, interviewType })

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    if (!question || question.trim().length < 3) {
      return Response.json({ error: 'Question too short' }, { status: 400 })
    }

    const sc = sessionContext
    const roleLabel = sc?.jobRole || 'this role'
    const resume = sc?.resumeText ? sanitizeReadableText(sc.resumeText, 2500) : ''
    const jd = sc?.jobDescription ? sanitizeReadableText(sc.jobDescription, 1500) : ''

    // Build a rich identity block so the AI truly answers AS the candidate
    const identityLines: string[] = []
    if (roleLabel !== 'this role') identityLines.push(`Target role: ${roleLabel}`)
    if (jd) identityLines.push(`Job description:\n${jd}`)
    if (resume) identityLines.push(`My resume / background:\n${resume}`)
    const identityBlock = identityLines.join('\n\n')

    // Classify question type to choose the right answer strategy
    const questionLower = question.toLowerCase()
    const isBehavioral = /tell me about|describe a time|give me an example|walk me through|situation where|how did you|what did you do|greatest (strength|weakness)|why should|why do you want|biggest challenge/.test(questionLower)
    const isTechnical = /^(what is|explain|how does|difference between|when would you|implement|algorithm|complexity|debug|optimize)/.test(questionLower) || interviewType === 'technical' || interviewType === 'coding'

    let strategyNote = ''
    if (isBehavioral) {
      strategyNote = 'This is a behavioral question. Use the STAR format (Situation → Task → Action → Result). Reference a specific project or experience from the resume above — mention real company names, tech, or outcomes.'
    } else if (isTechnical) {
      strategyNote = 'This is a technical question. Give a clear, confident explanation with the correct definition, then mention how you have personally applied this in your work if the resume shows relevant experience.'
    } else {
      strategyNote = 'Answer naturally and confidently. Reference specific experience from the resume where relevant.'
    }

    const systemPrompt = isDesiMode
      ? `You are a job candidate answering interview questions in your own voice.

${identityBlock}

RULES:
- Answer in FIRST PERSON as "I" — you ARE the candidate, not a coach.
- Speak the way Indian professionals naturally talk — confident, direct, conversational. Mix of professional and relatable.
- ${strategyNote}
- Use SPECIFIC details from the resume: company names, project names, technologies, numbers, and real outcomes.
- Do NOT give generic textbook answers. Make it sound like YOUR real experience.
- Do NOT add headers, bullet points, or labels. Just speak naturally.
- Keep it under 160 words.
- Never start with "Sure!", "Great question!", "Certainly!" or any filler opener.
- Never output "Assistant:", "User:", or any role labels.`
      : `You are a job candidate answering interview questions in your own voice.

${identityBlock}

RULES:
- Answer in FIRST PERSON as "I" — you ARE the candidate, not a coach.
- ${strategyNote}
- Use SPECIFIC details from the resume: company names, project names, technologies, metrics, and real outcomes. Do not make up details not in the resume, but do reference what is there.
- Sound confident and human — not like a textbook or a template.
- Do NOT use bullet points or section headers. Speak in flowing sentences.
- Keep it under 160 words.
- Never start with "Sure!", "Great question!", "Certainly!" or any filler opener.
- Never output "Assistant:", "User:", or any role labels.`

    const userContent = `Interview question: "${question}"`

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
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
