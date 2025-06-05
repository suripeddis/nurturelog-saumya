import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
}

const deepgram = createClient(DEEPGRAM_API_KEY);

/**
 * POST /api/deepgram
 * Accepts: FormData with 'file' field
 * Sends the audio to Deepgram for transcription and returns the response.
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

    // Transcribe the audio using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-3',
        language: 'en',
        smart_format: true,
      }
    );

    if (error) {
      console.error('Deepgram transcription error:', error);
      return NextResponse.json(
        { error: error.message || 'Transcription failed' },
        { status: 500 }
      );
    }

    if (!result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs) {
      return NextResponse.json(
        { error: 'No transcription results found' },
        { status: 500 }
      );
    }

    const transcript = result.results.channels[0].alternatives[0].paragraphs.transcript;
    const words = result.results.channels[0].alternatives[0].words || [];
    const confidence = result.results.channels[0].alternatives[0].confidence || 0;

    return NextResponse.json({
      text: transcript,
      words: words,
      confidence: confidence,
    });
  } catch (error) {
    console.error('Deepgram API error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 