import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/anthropic'

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
    const { action, section, content, jobTitle, resumeData } = body as {
      action: string
      section?: string
      content?: string
      jobTitle?: string
      resumeData?: unknown
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'enhance') {
      if (user.credits < 2) {
        return Response.json({ error: 'Insufficient credits' }, { status: 402 })
      }

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert resume writer. Rewrite resume content to be strong, professional, and ATS-friendly. Return ONLY the rewritten text with no explanation or markdown.',
          },
          {
            role: 'user',
            content: `Rewrite this resume ${section} section for a ${jobTitle || 'professional'} role. Make it ATS-friendly, use strong action verbs, be concise and impactful. Original content: ${content}`,
          },
        ],
        max_tokens: 300,
      })

      const enhanced = response.choices[0]?.message?.content || content || ''
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: user.credits - 2 },
      })
      return Response.json({ enhanced: enhanced.trim() })
    }

    if (action === 'ats-check') {
      if (user.credits < 3) {
        return Response.json({ error: 'Insufficient credits' }, { status: 402 })
      }

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an ATS resume expert. Analyze resumes and return ONLY valid JSON with no markdown.',
          },
          {
            role: 'user',
            content: `Analyze this resume for ATS compatibility: ${JSON.stringify(resumeData)}
Return ONLY this JSON format:
{"score": 75, "suggestions": ["suggestion1", "suggestion2", "suggestion3"], "strongPoints": ["point1", "point2"]}`,
          },
        ],
        max_tokens: 400,
      })

      const content2 = response.choices[0]?.message?.content || '{}'
      const cleaned = content2.replace(/```json|```/g, '').trim()
      let parsed: { score: number; suggestions: string[]; strongPoints: string[] }
      try {
        parsed = JSON.parse(cleaned) as { score: number; suggestions: string[]; strongPoints: string[] }
      } catch {
        return Response.json({ error: 'Failed to parse ATS result' }, { status: 500 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { credits: user.credits - 3 },
      })
      return Response.json(parsed)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('resume-generate error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}
