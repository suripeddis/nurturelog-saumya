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

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

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
FORMAT THE RAW TRANSCRIPT INTO ONE SEQUENTIAL TRANSCRIPT.

LABELS (ONLY):
- TEACH — practitioner instructions, explanations, or coaching prompts. Max 3 sentences each.
- ASK — practitioner questions only (max 1 sentence).
- CLIENT — client responses in ALL CAPS; if nonverbal, infer a SHORT action (e.g., TAKES DEEP BREATH, NODS).

HEADER:
<date if available>; <practitioner initials>; <client initials>; <topic or N/A>
${i === 0 
  ? 'Print the header ONCE at the very start.' 
  : 'DO NOT print the header again. Continue transcript seamlessly.'}

RULES:
1) Preserve sequence. Do not reorder.
2) TEACH entries: keep essential prompts or feedback, but no filler or side-talk. At most 3 concise sentences.
3) ASK: one clear question, no repeats.
4) CLIENT: preserve wording in ALL CAPS. Merge spelled letters into words if unambiguous (e.g., D-E-E-P → DEEP). If action is implied, write as an action in present tense (e.g., TAKES DEEP BREATH).
5) Remove timestamps, greetings, chit-chat, repetition/echo of spelled letters, and any side conversations with parents/observers.
6) Practitioner should only **ask** questions; client should only **answer**.
7) Insert a blank line between entries so text is not smushed.

OUTPUT FORMAT (STRUCTURE ONLY, NOT CONTENT):

<date>; <P_INIT>; <C_INIT>; <topic or N/A>

TEACH: short instruction (≤3 sentences)

ASK: short question

CLIENT: CLIENT’S RESPONSE

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

    const finalTranscript = cleanedChunks
    .join('\n\n')
    .replace(/<date[^>]*>.*\n/i, (match, offset) => (offset === 0 ? match : ''));

    return NextResponse.json({ cleanedTranscript: cleanedChunks.join('\n\n') });
  } catch (err) {
    console.error('❌ Error in cleanTranscript API:', err);
    return NextResponse.json({ error: 'Failed to clean transcript' }, { status: 500 });
  }
}