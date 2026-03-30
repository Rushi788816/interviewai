import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { sanitizeReadableText } from '@/lib/sanitizeText'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, resumeText, jobRole, jobDescription } = await req.json() as {
      category: string
      resumeText?: string
      jobRole?: string
      jobDescription?: string
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.credits < 2) {
      return Response.json({ error: 'Insufficient credits (2 required)' }, { status: 402 })
    }

    const resume = resumeText ? sanitizeReadableText(resumeText, 2000) : ''
    const jd = jobDescription ? sanitizeReadableText(jobDescription, 800) : ''
    const role = jobRole || 'Software Engineer'

    const categoryPrompts: Record<string, string> = {
      behavioral: 'Generate 8 behavioral interview questions (tell me about a time..., describe a situation...) tailored to the resume.',
      technical: 'Generate 8 technical interview questions about the technologies and skills listed in the resume.',
      hr: 'Generate 8 HR / culture-fit questions (strengths, weaknesses, salary, why this company, 5-year plan).',
      situational: 'Generate 8 situational interview questions (what would you do if..., how would you handle...) relevant to the role.',
      coding: 'Generate 8 coding / algorithm interview questions appropriate for the experience level shown in the resume.',
    }

    const categoryInstruction = categoryPrompts[category] ?? categoryPrompts.behavioral

    const systemPrompt = `You are an expert interview coach.
${resume ? `Resume:\n${resume}\n` : ''}${jd ? `Job Description:\n${jd}\n` : ''}
Target role: ${role}

${categoryInstruction}

For each question, also provide an ideal answer (2-3 sentences, first-person, specific to this resume).

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "questions": [
    { "question": "...", "answer": "..." },
    ...
  ]
}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      max_tokens: 2000,
      temperature: 0.5,
    })

    const raw = response.choices[0]?.message?.content || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    let parsed: { questions: { question: string; answer: string }[] }
    try {
      parsed = JSON.parse(cleaned) as typeof parsed
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
      parsed = JSON.parse(match[0]) as typeof parsed
    }

    // Deduct 2 credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 2 } },
    })

    return Response.json({ questions: parsed.questions || [] })
  } catch (e) {
    console.error('question-bank error:', e)
    return Response.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
