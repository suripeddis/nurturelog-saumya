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
- **CLIENT**: client responses in ALL CAPS, or (ACTION) if nonverbal.

HEADER (ONCE ONLY):  
<date if available>; <practitioner initials>; <client initials>; <topic or N/A>  

RULES:  
1) Bold labels (**TEACH**, **ASK**, **CLIENT**) followed by a colon and the text.  
2) Remove filler, small talk, timestamps, and practitioner echoes of spelled letters.  
3) Preserve client wording exactly; keep spelled letters and ALL CAPS.  
4) Coaching counts as **TEACH**.  
5) Keep the original order. Do not summarize or add block titles.  
6) Include the HEADER only once at the very start of the full transcript (not for every chunk).  
7) Space out entries clearly with line breaks so the output is easy to read.  
8)  The **practitioner asks**, the **client answers** — never the other way around.  

OUTPUT EXAMPLE:  

<date>; <P_INIT>; <C_INIT>; <topic or N/A>  

**TEACH:** ...  

**ASK:** ...  

**CLIENT:** ...  

**CLIENT:** (ACTION)   

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