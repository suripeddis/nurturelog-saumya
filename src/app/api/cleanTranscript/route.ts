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
FORMAT THE RAW TRANSCRIPT INTO A SINGLE SEQUENTIAL TRANSCRIPT.

USE ONLY THESE LABELS:
- **TEACH**: practitioner instructions, explanations, or coaching prompts.  
- **ASK**: practitioner questions.  
- **CLIENT**: client responses in ALL CAPS, or a clear description of their action (e.g., TAKES DEEP BREATH, NODS).  

HEADER (ONCE ONLY AT THE TOP NOT FOR EACH CHUNK):  
<date if available>; <practitioner initials>; <client initials>; <topic or N/A>  

HEADER RULE — PRINT THE HEADER **ONLY IF ALL** ARE TRUE:  
A) The first non-empty lines of the input clearly indicate a session start (e.g., date/time, “session start,” introductions, orientation/goal-setting).  
B) The input begins cleanly (not mid-sentence, not starting with punctuation like “,” “.” “—”, and not with ellipses “…”) and does **not** look like a continuation.  
C) No header-like line (angle-bracket fields separated by semicolons) already appears anywhere in the input.  
If any of A–C fails, **do not** print a header for this chunk.

RULES:  
1) Bold labels (TEACH, ASK, CLIENT) followed by a colon and the text.  
2) Remove filler, small talk, timestamps, and practitioner echoes of spelled letters.  
3) Remove side conversations between practitioner and parents/observers.  
4) Preserve client wording exactly; keep spelled letters and ALL CAPS.  
5) Replace vague “(ACTION)” with the most likely client action based on context.  
6) Coaching counts as TEACH.  
7) Practitioner asks, client answers — never the other way around.  
8) Keep the original order. Do not summarize or add block titles.  
9) HEADER appears only once at the very start (not for every chunk).  
10) Space out entries clearly with line breaks for readability.

OUTPUT FORMAT:  

TEACH: …  

ASK: …  

CLIENT: …  

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