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

    const { resumeText, jobDescription, jobRole, company, tone } = await req.json() as {
      resumeText: string
      jobDescription?: string
      jobRole?: string
      company?: string
      tone?: 'professional' | 'enthusiastic' | 'concise'
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return Response.json({ error: 'Resume text is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.credits < 3) {
      return Response.json({ error: 'Insufficient credits (3 required)' }, { status: 402 })
    }

    const resume = sanitizeReadableText(resumeText, 2500)
    const jd = jobDescription ? sanitizeReadableText(jobDescription, 1000) : ''
    const role = jobRole || 'the position'
    const companyName = company || 'your company'
    const toneInstruction =
      tone === 'enthusiastic' ? 'Write with genuine enthusiasm and passion. Show excitement for the role.'
      : tone === 'concise' ? 'Be direct and concise — no fluff, maximum impact in minimum words.'
      : 'Maintain a polished, professional tone throughout.'

    const systemPrompt = `You are a professional cover letter writer.

Resume:
${resume}
${jd ? `\nJob Description:\n${jd}` : ''}

Write a compelling cover letter for ${role} at ${companyName}.

Instructions:
- ${toneInstruction}
- Write in first person as the candidate.
- 3–4 short paragraphs: opening hook, relevant experience match, value add, closing CTA.
- ONLY reference skills, technologies, and experiences that are in the resume.
- Keep total length under 280 words.
- Do NOT include "[Your Name]", "[Date]", or placeholder brackets — write it complete and ready to send.
- Start directly with the letter body (no "Dear Hiring Manager" header needed, just start with the first paragraph).`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      max_tokens: 700,
      temperature: 0.6,
    })

    const letter = response.choices[0]?.message?.content?.trim() || ''

    // Deduct 3 credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 3 } },
    })

    return Response.json({ letter })
  } catch (e) {
    console.error('cover-letter error:', e)
    return Response.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}
