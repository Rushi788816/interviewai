import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/anthropic'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { action, role, companyType, difficulty, question, answer } = body as {
      action: string
      role?: string
      companyType?: string
      difficulty?: string
      question?: string
      answer?: string
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'generate') {
      if (user.credits < 5) {
        return Response.json({ error: 'Insufficient credits' }, { status: 402 })
      }

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert technical interviewer. Return ONLY a valid JSON array of exactly 5 interview questions. No markdown, no explanation, just the JSON array.',
          },
          {
            role: 'user',
            content: `Generate 5 interview questions for: Role: ${role}, Company type: ${companyType}, Difficulty: ${difficulty}. Return ONLY this format: ["question1", "question2", "question3", "question4", "question5"]`,
          },
        ],
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content || '[]'
      const cleaned = content.replace(/```json|```/g, '').trim()
      let questions: string[]
      try {
        questions = JSON.parse(cleaned) as string[]
      } catch {
        const m = cleaned.match(/\[[\s\S]*\]/)
        questions = m ? (JSON.parse(m[0]) as string[]) : []
      }
      if (!Array.isArray(questions) || questions.length < 1) {
        return Response.json({ error: 'Failed to parse questions' }, { status: 500 })
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { credits: user.credits - 5 },
        }),
      ])

      return Response.json({ questions: questions.slice(0, 5) })
    }

    if (action === 'evaluate') {
      if (user.credits < 1) {
        return Response.json({ error: 'Insufficient credits' }, { status: 402 })
      }
      if (!question || !answer) {
        return Response.json({ error: 'Question and answer required' }, { status: 400 })
      }

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator. Return ONLY valid JSON with no markdown fences.',
          },
          {
            role: 'user',
            content: `Evaluate this interview answer.
Question: ${question}
Answer: ${answer}
Return ONLY this JSON format with no extra text:
{"clarity": 85, "relevance": 90, "structure": 80, "feedback": "short feedback under 80 words", "betterAnswer": "better answer under 120 words"}`,
          },
        ],
        max_tokens: 400,
      })

      const content = response.choices[0]?.message?.content || '{}'
      const cleaned = content.replace(/```json|```/g, '').trim()
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(cleaned) as Record<string, unknown>
      } catch {
        return Response.json({ error: 'Failed to parse evaluation' }, { status: 500 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      })

      return Response.json(parsed)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('mock-interview error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}
