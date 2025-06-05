import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
      const { transcript } = await req.json();
  
      if (!transcript || typeof transcript !== 'string') {
        return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
      }
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `You are a skilled clinical analyst helping to interpret therapy sessions with non-verbal learners using a spelling board.`,
          },
          {
            role: 'user',
            content: `
  The following is a transcript of a therapy session between a therapist and a non-verbal learner. The therapist uses a spelling board to help the learner express themselves.
  
  Your task:
  
  1. Summarize the session clearly and professionally.
  2. Identify where the learner succeeded. Quote examples.
  3. Identify where the learner struggled. Quote examples.
  4. Give an overview of the topics discussed during the session.
  
  Transcript:
  ${transcript}
            `.trim(),
          },
        ],
      });
  
      return NextResponse.json(completion.choices[0].message);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to process chat request' },
        { status: 500 }
      );
    }
  }
  