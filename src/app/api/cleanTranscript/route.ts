import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

/**
 * ENV:
 * - OPENAI_API_KEY (required)
 * - OPENAI_TRANSCRIPT_MODEL (default: gpt-4o)
 * - WINDOW_UTTERANCES (default: 28)
 * - OVERLAP_UTTERANCES (default: 6)
 */

const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const WINDOW_SIZE = Number(process.env.WINDOW_UTTERANCES || 28);
const OVERLAP = Number(process.env.OVERLAP_UTTERANCES || 6);

// ---------------- Types ----------------
type Utterance = { id: number; speaker?: "P" | "C" | "?"; text: string };

// ---------------- Small helpers ----------------
const norm = (s: string) => s.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
const mergeSpellouts = (s: string) =>
  s.replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,20}\b/g, (m) => m.replace(/\s*-\s*/g, ""));

// Parse raw transcript into utterances (prefers lines starting with "P:" / "C:")
function segmentTranscript(raw: string): Utterance[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let id = 0;
  let last: "P" | "C" = "P";
  const utt: Utterance[] = [];

  for (const l of lines) {
    const m = /^(P|C)\s*:\s*(.*)$/.exec(l);
    if (m) {
      const sp = m[1] as "P" | "C";
      utt.push({ id: id++, speaker: sp, text: mergeSpellouts(m[2].trim()) });
      last = sp;
      continue;
    }
    // heuristic for unlabeled lines
    const isQuestion =
      /\?\s*$/.test(l) ||
      /^(what|why|how|when|where|which|can|could|would|do|does|did|are|is|was|were|will|should|may|might)\b/i.test(l);
    const isCaps = l === l.toUpperCase() && /[A-Z]/.test(l);
    const isShort = l.split(/\s+/).length <= 6;

    let speaker: "P" | "C";
    if (isQuestion) speaker = "P";
    else if (isCaps || isShort) speaker = "C";
    else speaker = last;

    utt.push({ id: id++, speaker, text: mergeSpellouts(l) });
    last = speaker;
  }
  return utt;
}

// Window by utterance count (with overlap)
function makeWindows(utterances: Utterance[], size = WINDOW_SIZE, overlap = OVERLAP): Utterance[][] {
  const out: Utterance[][] = [];
  if (utterances.length === 0) return out;
  let i = 0;
  while (i < utterances.length) {
    out.push(utterances.slice(i, i + size));
    if (i + size >= utterances.length) break;
    i += Math.max(1, size - overlap);
  }
  return out;
}

// ---------------- LLM window call (TEXT protocol; no JSON parsing) ----------------
async function processWindow(
  openai: OpenAI,
  window: Utterance[],
  opts: { headerExpected: boolean; topic?: string; date?: string; practitioner?: string; client?: string }
) {
  const { headerExpected, topic = "N/A", date = "N/A", practitioner = "P", client = "C" } = opts;

  // Provide compact input with IDs so we can account for coverage
  const content = window.map((u) => `${u.id}|${u.speaker || "?"}: ${u.text}`).join("\n");

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a precise transcript formatter. Output ONLY the strict format requested. Do NOT invent content.",
      },
      {
        role: "user",
        content: `
TASK:
Condense the provided utterances into chronological TEACH → [ASK] → CLIENT blocks.

HARD RULES:
- Use ONLY the utterances provided (by id). Do NOT add external info or change meanings.
- TEACH = practitioner explanation/instruction. Compress to essentials (max 2–3 sentences). Remove filler, stage directions, and motor prompts.
- ASK = exactly one clear practitioner question. If no real question exists for a block, omit ASK.
- CLIENT = the client's words/actions in ALL CAPS. Merge clear spellings (P-O-W-E-R => POWER). Keep it concise.
- After EACH block, include: IDS: <comma-separated utterance ids you consumed for this block>
- Separate blocks with a single blank line. No extra prose.

HEADER:
- ${headerExpected ? `First output MUST begin with a single header line exactly as shown below.\n` : `Do NOT output a header.`}
${headerExpected ? `**Date:** ${date} • **Practitioner:** ${practitioner} • **Client:** ${client} • **Topic:** ${topic}\n` : ``}

OUTPUT SHAPE:
${headerExpected ? `**TEACH:** ...\n[optional] **ASK:** ...\n**CLIENT:** ...\nIDS: 1,2,3\n` : `**TEACH:** ...\n[optional] **ASK:** ...\n**CLIENT:** ...\nIDS: 1,2,3\n`}

UTTERANCES (id|speaker: text):
${content}
`.trim(),
      },
    ],
  });

  return (resp.choices[0].message?.content || "").trim();
}

// ---------------- Normalizer & stitcher ----------------
function normalizeBlock(b: string): string {
  // Ensure labels are on their own lines and bolded
  let out = b
    .replace(/\s*\*\*TEACH:\*\*/i, "**TEACH:**")
    .replace(/\s*\*\*ASK:\*\*/i, "**ASK:**")
    .replace(/\s*\*\*CLIENT:\*\*/i, "**CLIENT:**");

  // Add line breaks before bold labels if mashed
  out = out.replace(/\s*(\*\*TEACH:\*\*|\*\*ASK:\*\*|\*\*CLIENT:\*\*)/g, "\n$1");
  // Collapse extra blanks
  out = out.replace(/\n{3,}/g, "\n\n");
  return norm(out);
}

function stitchAndMeasure(blockTexts: string[], utterances: Utterance[]) {
  const seen = new Set<string>();
  const covered = new Set<number>();
  const finalBlocks: string[] = [];
  let headerIncluded = false;

  const rawBlocks = blockTexts
    .join("\n\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const raw of rawBlocks) {
    // Keep only the FIRST header; drop any repeated headers from overlaps
    const hasHeader = /^\*\*Date:\*\*/i.test(raw);
    let block = raw;
    if (hasHeader) {
      if (headerIncluded) continue;
      headerIncluded = true;
    }

    // Collect IDS
    const idsMatch = /IDS:\s*([\d,\s]+)/i.exec(block);
    if (idsMatch) {
      idsMatch[1]
        .split(",")
        .map((s) => s.trim())
        .forEach((s) => {
          const n = parseInt(s, 10);
          if (!Number.isNaN(n)) covered.add(n);
        });
    }

    // Strip IDS line from the block
    block = block.replace(/\n?IDS:.*$/i, "").trim();

    // Deduplicate identical blocks across overlaps
    const sig = block.toUpperCase();
    if (seen.has(sig)) continue;
    seen.add(sig);

    finalBlocks.push(normalizeBlock(block));
  }

  const total = utterances.length;
  const coverage = total ? Math.min(1, covered.size / total) : 1;
  const unassigned = utterances.filter((u) => !covered.has(u.id)).map((u) => ({ id: u.id, text: u.text }));

  return {
    finalMarkdown: finalBlocks.join("\n\n"),
    metrics: {
      totalUtterances: total,
      coveredUtterances: covered.size,
      coveragePercent: Math.round(coverage * 1000) / 10, // e.g., 98.7
      unassigned,
    },
  };
}

// ---------------- Handler ----------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept either raw string or "rawTranscript" field
    const raw =
      (typeof body === "string" ? body : body?.rawTranscript || body?.transcript || body?.raw) ?? "";

    if (!raw || !raw.trim()) {
      return NextResponse.json({ error: "Provide `rawTranscript` (string)." }, { status: 400 });
    }

    const meta = {
      date: body?.date ?? "N/A",
      practitioner: body?.practitioner ?? "P",
      client: body?.client ?? "C",
      topic: body?.topic ?? "N/A",
    };

    const utterances = segmentTranscript(raw);
    if (utterances.length === 0) {
      return NextResponse.json({ error: "No lines found in transcript." }, { status: 400 });
    }

    const windows = makeWindows(utterances, WINDOW_SIZE, OVERLAP);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const parts: string[] = [];
    for (let i = 0; i < windows.length; i++) {
      const text = await processWindow(openai, windows[i], {
        headerExpected: i === 0,
        topic: meta.topic,
        date: meta.date,
        practitioner: meta.practitioner,
        client: meta.client,
      });
      parts.push(text);
    }

    // Stitch + coverage
    const { finalMarkdown, metrics } = stitchAndMeasure(parts, utterances);

    return NextResponse.json({
      cleanedTranscript: finalMarkdown,
      metrics,
    });
  } catch (err: any) {
    console.error("❌ cleanTranscript error:", err?.message || err);
    return NextResponse.json({ error: "Failed to clean transcript" }, { status: 500 });
  }
}
