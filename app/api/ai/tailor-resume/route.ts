import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { prisma } from '@/lib/prisma'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`tailor:${session.user.id}`, 5, 60 * 1000)
    if (!rl.allowed) {
      return Response.json({ error: 'Too many requests — please wait a minute' }, { status: 429 })
    }

    const { resumeText, jobDescription } = await req.json() as {
      resumeText: string
      jobDescription: string
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return Response.json({ error: 'Resume text is required (min 50 chars)' }, { status: 400 })
    }
    if (!jobDescription || jobDescription.trim().length < 30) {
      return Response.json({ error: 'Job description is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.credits < 5) {
      return Response.json({ error: 'Insufficient credits (5 required)' }, { status: 402 })
    }

    const resume = sanitizeReadableText(resumeText, 3000)
    const jd = sanitizeReadableText(jobDescription, 1500)

    const prompt = `You are an expert resume writer and ATS optimization specialist.

RESUME:
${resume}

JOB DESCRIPTION:
${jd}

Analyze the resume and job description, then tailor the resume content to maximize ATS score and shortlisting chances.

Rules:
- ONLY use skills, technologies, and experiences that already exist in the resume — do NOT invent anything
- You MAY add relevant keywords from the JD to the skills section IF they are genuinely implied by the candidate's experience
- Rewrite experience bullets to be more impactful and JD-aligned using strong action verbs and quantified results where possible
- Rewrite the summary to directly address the JD requirements
- Do NOT change company names, job titles, dates, education, or personal info

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "summary": {
    "original": "<extracted summary from resume or empty string if none>",
    "tailored": "<rewritten summary optimized for this JD>"
  },
  "skills": {
    "original": "<extracted skills section as comma-separated string>",
    "tailored": "<rewritten skills section — reordered by JD relevance, added matching keywords>",
    "added": ["<keyword1>", "<keyword2>"]
  },
  "experience": [
    {
      "title": "<Job Title at Company Name>",
      "original": "<original bullet points as single string with newlines>",
      "tailored": "<rewritten bullet points as single string with newlines>"
    }
  ],
  "keywords_matched": ["<key skill/tech from JD that candidate has>"],
  "keywords_missing": ["<important JD keywords candidate is missing — max 5>"],
  "ats_score_before": <number 0-100>,
  "ats_score_after": <number 0-100>
}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    })

    const raw = response.choices[0]?.message?.content?.trim() || ''

    // Extract JSON from response (strip any accidental markdown fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'AI returned invalid response, please try again' }, { status: 500 })
    }

    let tailored: Record<string, unknown>
    try {
      tailored = JSON.parse(jsonMatch[0])
    } catch {
      return Response.json({ error: 'Failed to parse AI response, please try again' }, { status: 500 })
    }

    // Deduct 5 credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 5 } },
    })

    return Response.json({ tailored })
  } catch (e) {
    console.error('tailor-resume error:', e)
    return Response.json({ error: 'Failed to tailor resume' }, { status: 500 })
  }
}
