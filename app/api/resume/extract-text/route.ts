import { NextRequest } from 'next/server'
import { looksLikeCorruptedExtract, sanitizeReadableText } from '@/lib/sanitizeText'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.txt')) {
      const raw = await file.text()
      const text = sanitizeReadableText(raw, 5000)
      if (text && looksLikeCorruptedExtract(text)) {
        return Response.json({
          text: '',
          warning: 'This file does not look like readable text. Try UTF-8 .txt or paste your resume below.',
        })
      }
      return Response.json({ text })
    }

    if (fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data })
      try {
        const result = await parser.getText()
        const pages = result.pages?.length ?? result.total
        const text = sanitizeReadableText(result.text, 5000)
        if (!text || looksLikeCorruptedExtract(text)) {
          return Response.json({
            text: '',
            pages,
            warning:
              'Could not read usable text from this PDF. Try “Save as PDF” from Word, or paste your resume text below.',
          })
        }
        return Response.json({ text, pages })
      } finally {
        await parser.destroy()
      }
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return Response.json({
        text: `Resume file: ${file.name}. Candidate has provided their resume. Paste the full text below for best results.`,
        note: 'DOC format - limited extraction',
      })
    }

    return Response.json({ text: '' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('PDF extraction error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}
