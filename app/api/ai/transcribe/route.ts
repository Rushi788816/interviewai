import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ text: '' })
    }

    const transcription = await (groq as any).audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text ?? '' })
  } catch (err: any) {
    console.error('Transcription error:', err?.message)
    return NextResponse.json({ text: '', error: 'Transcription failed' }, { status: 500 })
  }
}
