import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function chunkText(text: string, chunkSize = 4500, overlap = 500): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawTranscript } = body;

    if (!rawTranscript) {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chunks = chunkText(rawTranscript);
    const cleanedChunks: string[] = [];

    for (const chunk of chunks) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are processing a session transcript. Format your output as instructed.',
          },
          {
            role: 'user',
            content: `
Clean this transcript. Use the following format:
<date>; <practitioner initials>; <client initials>; <topic>
- [TEACH] for each teaching or instruction from the practitioner.
- [QUESTION] for each question asked by the practitioner.
- [COACH] for brief coaching prompts that help focus, posture, breathing, etc.
- [CLIENT] for the response in ALL CAPS (or (ACTION) if nonverbal).
Only include the <date>; ... header once at the top — not for each section.
Format each line as follows:
**LABEL**: message  
(Make the speaker label bold using Markdown asterisks, like **TEACH**)
Be concise. Skip filler, small talk, and repeated phrases.

Transcript:
${chunk}
            `.trim(),
          },
        ],
        temperature: 0.2,
      });

      const cleanedPart = response.choices[0].message?.content?.trim() || '';
      cleanedChunks.push(cleanedPart);
    }

    return NextResponse.json({ cleanedTranscript: cleanedChunks.join('\n\n') });
  } catch (err) {
    console.error('❌ Error in cleanTranscript API:', err);
    return NextResponse.json({ error: 'Failed to clean transcript' }, { status: 500 });
  }
}