import { groq } from '@/lib/anthropic'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import type { SessionContext } from '@/types'

const COACH_RULES =
  'If the resume excerpt is missing, empty, or unclear, still give a strong, practical answer using the role and job description. Do not refuse or ask the user to reformat the resume unless there is truly no role or JD to work from. Never output role labels like "Assistant:" or "User:" — respond with the answer body only, in plain text.'

export async function GET() {
  return Response.json({
    status: 'ok',
    groqKeyPresent: !!process.env.GROQ_API_KEY?.trim(),
  })
}

export async function POST(req: Request) {
  try {
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
    let contextBlock = ''
    if (sc?.jobRole) {
      contextBlock += `The candidate is interviewing for: ${sc.jobRole}.\n`
    }
    const jd = sc?.jobDescription ? sanitizeReadableText(sc.jobDescription, 1500) : ''
    if (jd) {
      contextBlock += `Job Description: ${jd}\n`
    }
    const resume = sc?.resumeText ? sanitizeReadableText(sc.resumeText, 2000) : ''
    if (resume) {
      contextBlock += `Candidate Resume Summary: ${resume}\n`
    }

    const roleLabel = sc?.jobRole || 'a job'

    const systemPrompt = isDesiMode
      ? `You are an Indian interview coach helping a candidate prepare for ${roleLabel} interview.
${contextBlock}
${COACH_RULES}
Answer interview questions the way young Indian professionals actually speak — conversational, direct, with relatable examples. Avoid corporate jargon. Sound natural. Keep answers under 150 words. Reference the job requirements and candidate background when relevant.`
      : `You are an expert interview coach helping a candidate prepare for ${roleLabel} interview.
${contextBlock}
${COACH_RULES}
Given an interview question, provide a concise structured answer tailored to this specific role and the candidate's background. Use STAR method for behavioral questions, clear technical explanation for technical questions. Keep answers under 150 words. Reference specific requirements from the job description when relevant.`

    const userContent = `Interview question: ${question}

Please give a targeted answer for the ${sc?.jobRole || 'role'} position.`

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: 400,
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
