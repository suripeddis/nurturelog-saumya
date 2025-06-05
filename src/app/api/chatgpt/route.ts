import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const AnalysisSchema = z.object({
    summary: z.string(),
    successes: z.array(z.string()),
    struggles: z.array(z.string()),
    topicsDiscussed: z.array(z.string()),
});

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();
        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json(
                { error: 'Transcript is required' },
                { status: 400 }
            );
        }

        const response = await openai.responses.parse({
            model: 'gpt-4o',
            input: [
                {
                    role: 'system',
                    content: 'You are a skilled clinical analyst helping to interpret therapy sessions with non-verbal learners using a spelling board.',
                },
                {
                    role: 'user',
                    content: `
Analyze this therapy session transcript and return exactly these fields—no extra keys:
- summary: Professional summary of the session
- successes: List of quoted examples where learner succeeded
- struggles: List of quoted examples where learner struggled
- topicsDiscussed: List of distinct topics discussed

Transcript:
${transcript}
          `.trim(),
                },
            ],
            text: {
                format: zodTextFormat(AnalysisSchema, 'analysis'),
            },
        });

        const analysis = response.output_parsed;
        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to process analysis' },
            { status: 500 }
        );
    }
}
