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
        console.log('transcript', transcript);
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
                    content: 'You are a skilled clinical analyst helping to interpret letterboard sessions with non-speaking autistic learners using a letterboard.',
                },
                {
                    role: 'user',
                    content: `
Analyze this letterboard session transcript and return exactly these fields—no extra keys:
- summary: Write a professional summary of the session, focusing only on what was discussed and the learner’s engagement with those topics. Do not describe the learner’s diagnosis, communication style labels, or personal identifiers beyond what they said. When you see words being spelled out, treat that as the learner’s speech.
- successes: List of quoted examples where learner succeeded. Give at least 3 examples. Describe the success in detail, then include a quote from the transcript.
- struggles: List of quoted examples where learner struggled. Give at least 3 examples. Describe the struggle in detail, then include a quote from the transcript.
- topicsDiscussed: List of distinct topics discussed, with details.

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
