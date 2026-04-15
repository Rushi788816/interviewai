import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { resumeText, jobDescription } = await req.json()
    if (!resumeText || resumeText.trim().length < 50) return Response.json({ error: 'Resume text required' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    if (!user || user.credits < 2) return Response.json({ error: 'Insufficient credits (2 required)' }, { status: 402 })
    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume and return ONLY a JSON object with this exact structure, no other text:
{"overallScore":<number 0-100>,"sections":{"formatting":{"score":<0-100>,"feedback":"<one sentence>"},"keywords":{"score":<0-100>,"feedback":"<one sentence>","missing":["keyword1","keyword2"]},"experience":{"score":<0-100>,"feedback":"<one sentence>"},"education":{"score":<0-100>,"feedback":"<one sentence>"},"skills":{"score":<0-100>,"feedback":"<one sentence>"}},"topIssues":["issue1","issue2","issue3"],"quickWins":["fix1","fix2","fix3"]}

Resume:
${resumeText.slice(0, 3000)}
${jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 1000)}` : ''}`
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800, temperature: 0.3,
    })
    const raw = response.choices[0]?.message?.content?.trim() || '{}'
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    await prisma.user.update({ where: { id: (session.user as any).id }, data: { credits: { decrement: 2 } } })
    return Response.json(result)
  } catch (e) {
    console.error('ats-score error:', e)
    return Response.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}
