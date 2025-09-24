import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ------------------ Pre-clean transcript ------------------
function preClean(s: string): string {
  return s
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '') // strip [00:08] style timestamps
    .replace(
      /\b(say it|find it|good|okay|uhhuh|oops|next letter|hold on|breathe|deep breath)\b[.,!?]*/gi,
      ''
    ) // remove filler
    .replace(/[A-Z](?:\s*-\s*[A-Z]){1,10}/g, (m) => m.replace(/\s*-\s*/g, '')) // merge spelled letters (P - O - W - E - R → POWER)
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// ------------------ Sentence chunker ------------------
function chunkBySentences(text: string, maxChars = 4500, overlapSentences = 3): string[] {
  const sents = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?]["’”)]?)\s+|\n{2,}/g) // split on sentence end or paragraph break
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let i = 0;
  while (i < sents.length) {
    let buf = '';
    while (i < sents.length && (buf + (buf ? ' ' : '') + sents[i]).length <= maxChars) {
      buf += (buf ? ' ' : '') + sents[i];
      i++;
    }
    if (!buf && sents[i]) {
      buf = sents[i].slice(0, maxChars); // fallback: chop very long sentence
      i++;
    }
    chunks.push(buf);
    i = Math.max(i - overlapSentences, i); // rewind a few sentences for overlap
  }
  return chunks;
}

// ------------------ Context tail helper ------------------
function lastLines(s: string, n = 8): string {
  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(-n).join('\n');
}

// ------------------ Block-level validation + repair ------------------
type Block = { text: string };

function splitBlocks(part: string): Block[] {
  return part
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

function validateBlock(block: Block, headerAllowed: boolean): boolean {
  const lines = block.text.split(/\r?\n/).map((l) => l.trim());
  if (!lines.length) return false;

  // header
  if (lines[0]?.startsWith('<') && !headerAllowed) return false;

  const teach = lines.find((l) => /^TEACH:/i.test(l));
  const ask = lines.find((l) => /^ASK:/i.test(l));
  const client = lines.find((l) => /^CLIENT:/i.test(l));
  if (!teach || !client) return false;

  // TEACH ≤ 3 sentences and must NOT have '?'
  const teachText = teach.replace(/^TEACH:\s*/i, '');
  const teachSentences = (teachText.match(/[.!?](\s|$)/g) || []).length || 1;
  if (teachSentences > 3) return false;
  if (teachText.includes('?')) return false;

  // ASK ≤ 1 sentence and MUST have '?', if present
  if (ask) {
    const askText = ask.replace(/^ASK:\s*/i, '');
    const askSentences = (askText.match(/[.!?](\s|$)/g) || []).length || 1;
    if (askSentences > 1) return false;
    if (!askText.includes('?')) return false;
  }

  // CLIENT all caps or [ACTION]
  const clientText = client.replace(/^CLIENT:\s*/i, '').trim();
  const isAction =
    /^\[[A-Z][A-Z\s]+\]$/.test(clientText) ||
    /^[A-Z0-9][A-Z0-9\s\.\-\,\!\?']+$/.test(clientText);
  if (!isAction) return false;

  return true;
}

async function repairBlock(
  openai: OpenAI,
  block: Block,
  headerAllowed: boolean
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'Fix this transcript block to satisfy the schema. Do not invent new content. Preserve meaning.'
      },
      {
        role: 'user',
        content: `
SCHEMA RULES:
- Optional header only if headerAllowed=${headerAllowed}.
- Must contain TEACH (≤3 sentences, no "?").
- ASK optional, ≤1 sentence, must contain "?" if present.
- CLIENT required, ALL CAPS or [ACTION].
- One block only, no commentary.

BLOCK TO FIX:
${block.text}
        `.trim()
      }
    ]
  });
  return response.choices[0].message?.content?.trim() || block.text;
}

async function enforceBlocksOrRepair(
  openai: OpenAI,
  part: string,
  headerAllowed: boolean
): Promise<string> {
  const blocks = splitBlocks(part);
  const fixedBlocks: string[] = [];
  for (const b of blocks) {
    if (validateBlock(b, headerAllowed)) {
      fixedBlocks.push(b.text);
    } else {
      const repaired = await repairBlock(openai, b, headerAllowed);
      fixedBlocks.push(repaired);
    }
    headerAllowed = false; // only first block may keep header
  }
  return fixedBlocks.join('\n\n');
}

// ------------------ Stitcher to merge parts ------------------
function stitchParts(parts: string[]): string {
  const out: string[] = [];
  const seenBlocks = new Set<string>();
  let firstHeaderKept = false;

  const splitBlocks = (s: string) =>
    s.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  for (const part of parts) {
    const blocks = splitBlocks(part);
    for (const b of blocks) {
      const lines = b.split(/\r?\n/);
      if (lines[0]?.startsWith('<')) {
        if (firstHeaderKept) continue;
        firstHeaderKept = true;
      }
      const blockSig = lines.map((l) => l.trim().toUpperCase()).join('|');
      if (seenBlocks.has(blockSig)) continue;
      seenBlocks.add(blockSig);
      out.push(lines.join('\n'));
      out.push('');
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ------------------ API handler ------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawTranscript } = body;

    if (!rawTranscript) {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    const cleanedInput = preClean(rawTranscript);
    const chunks = chunkBySentences(cleanedInput, 4500, 3);
    const total = chunks.length;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const cleanedChunks: string[] = [];
    let prevTail = '';

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
              'NEVER output any line starting with "<" unless headerExpected=YES. ' +
              'DO NOT INVENT CONTENT NOT PRESENT IN RAW CHUNK OR CONTEXT_TRAIL.',
          },
          {
            role: 'user',
            content: `
CHUNK_META:
- index: ${i + 1}
- total: ${total}
- headerExpected: ${i === 0 ? 'YES' : 'NO'}

CONTEXT_TRAIL (formatted tail from previous chunk; do not re-emit, only use to keep continuity):
${prevTail || '(none)'}

TASK:
Format this raw chunk into the ongoing transcript.

HEADER RULE:
- If headerExpected=YES, begin with exactly one header line:
  <date if available>; <P_INIT>; <C_INIT>; <topic or N/A>
- If headerExpected=NO, you MUST NOT output any header or any line that starts with "<".

LABELS (ONLY):
- TEACH — practitioner instruction/explanation/coaching. Max 3 sentences.
- ASK — exactly one practitioner question. Max 1 sentence. If no genuine question occurs, OMIT ASK for that block.
- CLIENT — response in ALL CAPS; if nonverbal, SHORT present-tense action (e.g., TAKES DEEP BREATH, NODS).

RULES:
1) Preserve chronological sequence; do not reorder.
2) TEACH: essentials only; ≤3 concise sentences; remove filler/side-talk.
3) CLIENT: merge spelled letters when unambiguous (P-O-W-E-R → POWER).
4) Practitioner only TEACH/ASK; client only CLIENT.
5) Each block separated by a single blank line. No extra commentary.

OUTPUT SHAPE:

# When headerExpected=YES
<date>; <P_INIT>; <C_INIT>; <topic or N/A>

TEACH: ...
[optional] ASK: ...
CLIENT: ...

# When headerExpected=NO
TEACH: ...
[optional] ASK: ...
CLIENT: ...

RAW CHUNK:
${chunk}
            `.trim(),
          },
        ],
      });

      let part = response.choices[0].message?.content?.trim() || '';
      if (i > 0) {
        part = part.replace(/^\s*<[^>\n]+>.*(?:\r?\n|$)+/i, '').trim(); // strip illegal headers
      }

      part = await enforceBlocksOrRepair(openai, part, i === 0);

      cleanedChunks.push(part);
      prevTail = lastLines(part, 8);
    }

    const finalTranscript = stitchParts(cleanedChunks);
    return NextResponse.json({ cleanedTranscript: finalTranscript });
  } catch (err) {
    console.error('❌ Error in cleanTranscript API:', err);
    return NextResponse.json({ error: 'Failed to clean transcript' }, { status: 500 });
  }
}