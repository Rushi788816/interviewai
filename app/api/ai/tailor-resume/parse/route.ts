import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import type { ResumeData } from '@/lib/resumeTypes'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as {
      resumeText: string
      tailored: {
        summary?: { tailored?: string }
        skills?: { tailored?: string; added?: string[] }
        experience?: { title?: string; tailored?: string }[]
      }
    }

    const { resumeText, tailored } = body

    if (!resumeText || resumeText.trim().length < 50) {
      return Response.json({ error: 'Resume text required' }, { status: 400 })
    }

    const resume = sanitizeReadableText(resumeText, 3000)

    const tailoredSummary = tailored?.summary?.tailored || ''
    const tailoredSkills = tailored?.skills?.tailored || ''
    const tailoredExperience = Array.isArray(tailored?.experience)
      ? tailored.experience.map(e => `${e.title || 'Role'}:\n${e.tailored || ''}`).join('\n\n')
      : ''

    const prompt = `Parse this resume text into structured JSON. Apply the tailored content provided.

RESUME TEXT:
${resume}

TAILORED SUMMARY (use this instead of original):
${tailoredSummary}

TAILORED SKILLS (use this instead of original):
${tailoredSkills}

TAILORED EXPERIENCE (apply these rewrites to matching roles):
${tailoredExperience}

Extract ALL information from the resume and return ONLY valid JSON with NO markdown, NO explanation:
{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "summary": "<use the TAILORED SUMMARY above>",
  "experience": [
    {
      "id": "1",
      "company": "",
      "title": "",
      "start": "",
      "end": "",
      "current": false,
      "responsibilities": "<use TAILORED EXPERIENCE bullets for this role, newline-separated>"
    }
  ],
  "education": [
    {
      "id": "1",
      "institution": "",
      "degree": "",
      "field": "",
      "startYear": "",
      "endYear": "",
      "gpa": ""
    }
  ],
  "technicalSkills": ["<parse from TAILORED SKILLS — only technical/hard skills>"],
  "softSkills": ["<parse soft skills like Communication, Leadership etc>"],
  "tools": ["<tools, frameworks, platforms>"],
  "projects": [
    {
      "id": "1",
      "name": "",
      "description": "",
      "tech": [],
      "liveUrl": "",
      "githubUrl": ""
    }
  ]
}`

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.1,
    })

    const raw = response.choices[0]?.message?.content?.trim() || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse resume structure' }, { status: 500 })
    }

    let resumeData: ResumeData
    try {
      resumeData = JSON.parse(jsonMatch[0]) as ResumeData
    } catch {
      return Response.json({ error: 'Failed to parse resume structure' }, { status: 500 })
    }

    // Ensure arrays exist
    resumeData.experience = Array.isArray(resumeData.experience) ? resumeData.experience : []
    resumeData.education = Array.isArray(resumeData.education) ? resumeData.education : []
    resumeData.technicalSkills = Array.isArray(resumeData.technicalSkills) ? resumeData.technicalSkills : []
    resumeData.softSkills = Array.isArray(resumeData.softSkills) ? resumeData.softSkills : []
    resumeData.tools = Array.isArray(resumeData.tools) ? resumeData.tools : []
    resumeData.projects = Array.isArray(resumeData.projects) ? resumeData.projects : []

    return Response.json({ resumeData })
  } catch (e: any) {
    console.error('tailor-resume/parse error:', e?.message || e)
    return Response.json({ error: e?.message || 'Failed to parse resume' }, { status: 500 })
  }
}
