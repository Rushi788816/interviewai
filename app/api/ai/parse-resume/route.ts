import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  let text = ''

  try {
    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const buffer = Buffer.from(await file.arrayBuffer())
      const parsed = await pdfParse(buffer)
      text = parsed.text
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === 'txt') {
      text = await file.text()
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Could not read file: ' + (err?.message ?? 'unknown error') }, { status: 400 })
  }

  if (!text.trim() || text.trim().length < 50) {
    return NextResponse.json({ error: 'File appears to be empty or unreadable.' }, { status: 400 })
  }

  const structureSchema = `{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "summary": "",
  "experience": [
    {
      "id": "exp_1",
      "company": "",
      "title": "",
      "start": "",
      "end": "",
      "current": false,
      "responsibilities": ""
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "",
      "degree": "",
      "field": "",
      "startYear": "",
      "endYear": "",
      "gpa": ""
    }
  ],
  "technicalSkills": [],
  "softSkills": [],
  "tools": [],
  "projects": [
    {
      "id": "proj_1",
      "name": "",
      "description": "",
      "tech": [],
      "liveUrl": "",
      "githubUrl": ""
    }
  ]
}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a resume parser. Extract ALL information from the resume text and return ONLY a valid JSON object matching the exact structure below. Rules:
- Return raw JSON only — no markdown, no code blocks, no explanation.
- Use empty string "" for missing text fields, empty array [] for missing lists.
- Put ALL work experience entries in the experience array with unique ids (exp_1, exp_2...).
- Put ALL education entries in the education array with unique ids (edu_1, edu_2...).
- Put ALL projects in the projects array with unique ids (proj_1, proj_2...).
- For technicalSkills: programming languages, frameworks, libraries.
- For tools: software tools, platforms, cloud services, databases.
- For softSkills: communication, leadership, teamwork etc.
- responsibilities: combine all bullet points for that job into one paragraph.
- current: true only if the job says "present" or "current".

JSON structure:
${structureSchema}`,
      },
      {
        role: 'user',
        content: `Parse this resume:\n\n${text.slice(0, 8000)}`,
      },
    ],
    max_tokens: 2500,
    temperature: 0.1,
  })

  const content = completion.choices[0]?.message?.content ?? ''

  // Extract JSON — strip markdown code blocks if model wrapped it
  const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'AI could not parse the resume structure. Try a cleaner PDF.' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    // Ensure all required arrays exist
    parsed.experience = parsed.experience ?? []
    parsed.education = parsed.education ?? []
    parsed.technicalSkills = parsed.technicalSkills ?? []
    parsed.softSkills = parsed.softSkills ?? []
    parsed.tools = parsed.tools ?? []
    parsed.projects = parsed.projects ?? []
    return NextResponse.json({ data: parsed })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Try again.' }, { status: 500 })
  }
}
