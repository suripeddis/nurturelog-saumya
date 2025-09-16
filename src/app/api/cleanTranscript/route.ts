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
    const total = chunks.length; 
    const cleanedChunks: string[] = [];

    for (let i = 0; i < total; i++) {
      const chunk = chunks[i];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You are a transcript formatter. Follow the exact output shape. ' +
              'NEVER output any line starting with "<" unless headerExpected=YES.',
          },
          {
            role: 'user',
            content: `
CHUNK_META:
- index: ${i + 1}
- total: ${total}
- headerExpected: ${i === 0 ? 'YES' : 'NO'}

TASK:
Format this raw chunk into the ongoing transcript.

HEADER RULE:
- If headerExpected=YES, begin with exactly one header line:
  <date if available>; <P_INIT>; <C_INIT>; <topic or N/A>
- If headerExpected=NO, you MUST NOT output any header or any line that starts with "<".

LABELS (ONLY):
- TEACH — practitioner instruction/explanation/coaching. Max 3 sentences.
- ASK — exactly one practitioner question. Max 1 sentence.
- CLIENT — response in ALL CAPS; if nonverbal, SHORT present-tense action (e.g., TAKES DEEP BREATH, NODS).

RULES:
1) Preserve chronological sequence; do not reorder.
2) TEACH: essentials only; ≤3 concise sentences; remove filler/side-talk.
3) ASK: one clear question; no repeats.
4) CLIENT: ALL CAPS; merge spelled letters if unambiguous; nonverbal → short action.
5) Remove timestamps, greetings, letter-echoes, side conversations.
6) Practitioner only TEACH/ASK; client only CLIENT.
7) Insert a blank line between entries. No extra commentary.

OUTPUT SHAPE:

# When headerExpected=YES
<date>; <P_INIT>; <C_INIT>; <topic or N/A>

TEACH: ...

ASK: ...

CLIENT: ...

# When headerExpected=NO
TEACH: ...

ASK: ...

CLIENT: ...

RAW CHUNK:
${chunk}
            `.trim(),
          },
        ],
      });

      let part = response.choices[0].message?.content?.trim() || '';

      // Defensive cleanup for non-first chunks
      if (i > 0) {
        part = part.replace(/^\s*<[^>\n]+>.*(?:\r?\n|$)+/i, '').trim();
        part = part.replace(/^\s*<[^>\n]+>.*(?:\r?\n|$)+/i, '').trim();
      }

      cleanedChunks.push(part);
    }

    // Join chunks
    let joined = cleanedChunks.join('\n\n');

    // Keep only the very first header (<...>) and drop all others
    let sawHeader = false;
    joined = joined
      .split(/\r?\n/)
      .filter((line) => {
        if (/^\s*<[^>\n]+>/.test(line)) {
          if (!sawHeader) {
            sawHeader = true;
            return true; // keep first header
          }
          return false; // drop later headers
        }
        return true;
      })
      .join('\n');

    const finalTranscript = joined
      .replace(/(\n{3,})/g, '\n\n') // squeeze extra blank lines
      .trim();

    return NextResponse.json({ cleanedTranscript: finalTranscript });
  } catch (err) {
    console.error('❌ Error in cleanTranscript API:', err);
    return NextResponse.json({ error: 'Failed to clean transcript' }, { status: 500 });
  }
}
