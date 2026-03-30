import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const prompt = (formData.get('prompt') as string | null) ?? ''

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ text: '' })
    }

    // Max 25MB audio file
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ text: '', error: 'Audio file too large (max 25MB)' }, { status: 413 })
    }

    const params: Record<string, any> = {
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
    }
    // Passing prior transcript as prompt dramatically improves accuracy on
    // split-chunk boundaries — Whisper uses it as context, not as forced output
    if (prompt.trim()) params.prompt = prompt.trim().slice(-200)

    const transcription = await (groq as any).audio.transcriptions.create(params)

    return NextResponse.json({ text: transcription.text ?? '' })
  } catch (err: any) {
    console.error('Transcription error:', err?.message)
    return NextResponse.json({ text: '', error: 'Transcription failed' }, { status: 500 })
  }
}
