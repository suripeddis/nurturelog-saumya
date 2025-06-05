import { NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

/**
 * POST /api/transcribe
 * Accepts: { audioUrl: string }
 * Sends the audio to AssemblyAI for transcription and returns the response.
 */
export async function POST(req: Request) {
  try {
    const { audioUrl } = await req.json();

    if (!audioUrl || typeof audioUrl !== 'string') {
      return NextResponse.json({ error: 'A valid audioUrl is required' }, { status: 400 });
    }

    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'en',
        auto_chapters: true,
        auto_highlights: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('AssemblyAI API error:', data);
      return NextResponse.json({ error: data.error || 'Failed to process audio' }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error during transcription:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
