import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
}

const deepgram = createClient(DEEPGRAM_API_KEY);

/**
 * POST /api/deepgram
 * Accepts: JSON with 'url' field
 * Sends the audio URL to Deepgram for transcription and returns the response.
 */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    console.log('🎧 Transcribing audio from URL:', url);

    // Transcribe the audio using Deepgram URL method
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url },
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