import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

/**
 * ENV:
 * - OPENAI_API_KEY (required)
 * - OPENAI_TRANSCRIPT_MODEL (default: gpt-4o)
 * - WINDOW_UTTERANCES (default: 30)
 * - OVERLAP_UTTERANCES (default: 8)
 */

const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const WINDOW_SIZE = Number(process.env.WINDOW_UTTERANCES || 30);
const OVERLAP = Number(process.env.OVERLAP_UTTERANCES || 8);

// ---------- Types ----------
type Utterance = { id: number; speaker?: "P" | "C" | "?"; text: string };

// ---------- Helpers ----------
const norm = (s: string) => s.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
const mergeSpellouts = (s: string) =>
  s.replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,20}\b/g, (m) => m.replace(/\s*-\s*/g, ""));

function segmentTranscript(raw: string): Utterance[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let id = 0; let last: "P" | "C" = "P";
  const utt: Utterance[] = [];
  for (const l of lines) {
    const m = /^(P|C)\s*:\s*(.*)$/.exec(l);
    if (m) {
      const sp = m[1] as "P" | "C";
      utt.push({ id: id++, speaker: sp, text: mergeSpellouts(m[2].trim()) });
      last = sp; continue;
    }
    const isQ = /\?\s*$/.test(l) || /^(what|why|how|when|where|which|can|could|would|do|does|did|are|is|was|were|will|should|may|might)\b/i.test(l);
    const isCaps = l === l.toUpperCase() && /[A-Z]/.test(l);
    const isShort = l.split(/\s+/).length <= 6;
    const sp: "P" | "C" = isQ ? "P" : (isCaps || isShort) ? "C" : last;
    utt.push({ id: id++, speaker: sp, text: mergeSpellouts(l) });
    last = sp;
  }
  return utt;
}

function makeWindows(utterances: Utterance[], size = WINDOW_SIZE, overlap = OVERLAP): Utterance[][] {
  const out: Utterance[][] = [];
  let i = 0;
  while (i < utterances.length) {
    out.push(utterances.slice(i, i + size));
    if (i + size >= utterances.length) break;
    i += Math.max(1, size - overlap);
  }
  return out;
}

function findQuestions(window: Utterance[]) {
  const qre = /(\?\s*$)|^(what|why|how|when|where|which|can|could|would|do|does|did|are|is|was|were|will|should|may|might)\b/i;
  return window.filter(u => (u.speaker === "P" || !u.speaker) && qre.test((u.text || "").trim()))
               .map(u => ({ id: u.id, q: u.text.trim() }));
}

// ---------- LLM calls ----------
async function processWindow(openai: OpenAI, window: Utterance[]) {
  const lines = window.map(u => `${u.id}|${u.speaker || "?"}: ${u.text}`);
  const asks = findQuestions(window);
  const requiredBlocks = Math.max(1, asks.length);

  const resp = await openai.chat.completions.create({
    model: MODEL, temperature: 0,
    messages: [
      { role: "system",
        content: "You are a strict transcript formatter. Do NOT invent content. Output ONLY blocks as specified." },
      { role: "user", content: `
FORMAT EXACTLY ${requiredBlocks} BLOCKS (no more, no fewer).
- If ASK_CANDIDATES is non-empty, output EXACTLY one block per candidate, in the same order (copy/clean that question for **ASK:**).
- If empty, output exactly ONE block (TEACH→[ASK]→CLIENT) summarizing the window.

RULES:
- **TEACH:** compress practitioner instruction to ≤2 sentences; remove filler/motor prompts.
- **ASK:** one clear practitioner question (from candidate when present).
- **CLIENT:** client's words/actions in ALL CAPS; merge clear spell-outs (P-O-W-E-R → POWER); keep ≤ 8 words if possible.
- Do NOT group unrelated client answers; one concise CLIENT per block.
- After EACH block, add: IDS: <comma-separated utterance ids used for THIS block>.
- Separate blocks with ONE blank line. No header. No extra prose.

ASK_CANDIDATES (id|question):
${asks.length ? asks.map(a => `- ${a.id}|${a.q}`).join("\n") : "(none)"}

UTTERANCES (id|speaker: text):
${lines.join("\n")}

OUTPUT SHAPE (repeat ${requiredBlocks} times ONLY):
**TEACH:** ...
**ASK:** ...
**CLIENT:** ...
IDS: 1,2,3
`.trim() }
    ]
  });

  return (resp.choices[0].message?.content || "").trim();
}

function countBlocks(txt: string) {
  return (txt.match(/\*\*TEACH:\*\*/gi) || []).length;
}

async function ensureBlockCount(openai: OpenAI, firstPass: string, window: Utterance[]) {
  const must = Math.max(1, findQuestions(window).length);
  if (countBlocks(firstPass) === must) return firstPass;

  const lines = window.map(u => `${u.id}|${u.speaker || "?"}: ${u.text}`);
  const resp = await openai.chat.completions.create({
    model: MODEL, temperature: 0,
    messages: [
      { role: "system", content: "Repair the formatting only. Do NOT invent content." },
      { role: "user", content: `
You must output EXACTLY ${must} blocks. Your previous output had ${countBlocks(firstPass)}.
Split/merge only; keep the same text. No header. No commentary.

PREVIOUS OUTPUT:
${firstPass}

REFERENCE UTTERANCES:
${lines.join("\n")}
`.trim() }
    ]
  });

  return (resp.choices[0].message?.content || "").trim();
}

// ---------- Stitch, normalize, coverage ----------
function normalizeBlock(b: string): string {
  let out = b
    .replace(/\*\*teach:\*\*/gi, "**TEACH:**")
    .replace(/\*\*ask:\*\*/gi, "**ASK:**")
    .replace(/\*\*client:\*\*/gi, "**CLIENT:**");
  out = out.replace(/\s*(\*\*TEACH:\*\*|\*\*ASK:\*\*|\*\*CLIENT:\*\*)/g, "\n$1");
  out = out.replace(/\n{3,}/g, "\n\n");
  return norm(out);
}

function stitchAndMeasure(blockTexts: string[], utterances: Utterance[], header: string) {
  const seen = new Set<string>();
  const covered = new Set<number>();
  const finalBlocks: string[] = [];

  const rawBlocks = blockTexts
    .join("\n\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (let raw of rawBlocks) {
    const idsMatch = /IDS:\s*([\d,\s]+)/i.exec(raw);
    if (idsMatch) {
      idsMatch[1].split(",").map(s => s.trim()).forEach(s => {
        const n = parseInt(s, 10); if (!Number.isNaN(n)) covered.add(n);
      });
    }
    raw = raw.replace(/\n?IDS:.*$/i, "").trim();

    // Split if model returned multiple CLIENTs in one block
    const clients = [...raw.matchAll(/\*\*CLIENT:\*\*\s*([^\n]+)/g)];
    if (clients.length > 1) {
      const teach = (/\*\*TEACH:\*\*([\s\S]*?)(?=\n\*\*ASK:\*\*|\n\*\*CLIENT:\*\*|$)/.exec(raw)?.[1] || "").trim();
      const ask = (/\*\*ASK:\*\*([\s\S]*?)(?=\n\*\*CLIENT:\*\*|$)/.exec(raw)?.[1] || "").trim();
      for (const c of clients) {
        const block = `${teach ? `**TEACH:** ${teach}` : ""}${ask ? `\n**ASK:** ${ask}` : ""}\n**CLIENT:** ${c[1]}`.trim();
        const sig = block.toUpperCase(); if (!seen.has(sig)) { seen.add(sig); finalBlocks.push(normalizeBlock(block)); }
      }
      continue;
    }

    const block = normalizeBlock(raw);
    const sig = block.toUpperCase(); if (!seen.has(sig)) { seen.add(sig); finalBlocks.push(block); }
  }

  const total = utterances.length;
  const coverage = total ? Math.min(1, covered.size / total) : 1;
  const unassigned = utterances.filter(u => !covered.has(u.id)).map(u => ({ id: u.id, text: u.text }));

  const finalMarkdown = [header, "", finalBlocks.join("\n\n")].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return {
    finalMarkdown,
    metrics: {
      totalUtterances: total,
      coveredUtterances: covered.size,
      coveragePercent: Math.round(coverage * 1000) / 10,
      unassigned
    }
  };
}

// ---------- Handler ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = (typeof body === "string" ? body : body?.rawTranscript || body?.transcript || body?.raw) ?? "";
    if (!raw.trim()) return NextResponse.json({ error: "Provide `rawTranscript` (string)." }, { status: 400 });

    const meta = {
      date: body?.date ?? "N/A",
      practitioner: body?.practitioner ?? "P",
      client: body?.client ?? "C",
      topic: body?.topic ?? "N/A",
    };
    const header = `**Date:** ${meta.date} • **Practitioner:** ${meta.practitioner} • **Client:** ${meta.client} • **Topic:** ${meta.topic}`;

    const utterances = segmentTranscript(raw);
    if (!utterances.length) return NextResponse.json({ error: "No lines found." }, { status: 400 });

    const windows = makeWindows(utterances, WINDOW_SIZE, OVERLAP);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const parts: string[] = [];
    for (let i = 0; i < windows.length; i++) {
      const first = await processWindow(openai, windows[i]);
      const fixed = await ensureBlockCount(openai, first, windows[i]);
      parts.push(fixed);
    }

    const { finalMarkdown, metrics } = stitchAndMeasure(parts, utterances, header);
    return NextResponse.json({ cleanedTranscript: finalMarkdown, metrics });
  } catch (e: any) {
    console.error("❌ cleanTranscript error:", e?.message || e);
    return NextResponse.json({ error: "Failed to clean transcript" }, { status: 500 });
  }
}
