import { NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not set in environment variables');
}

const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY,
});

/**
 * POST /api/transcribe
 * Accepts: { audioUrl: string }
 * Sends the audio to AssemblyAI for transcription and returns the response.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe the audio
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      speech_model: "slam-1",
    });

    if (transcript.status === "error") {
      console.error(`Transcription failed: ${transcript.error}`);
      return NextResponse.json(
        { error: transcript.error || 'Transcription failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: transcript.text,
      words: transcript.words,
      confidence: transcript.confidence,
    });
  } catch (error) {
    console.error('AssemblyAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
