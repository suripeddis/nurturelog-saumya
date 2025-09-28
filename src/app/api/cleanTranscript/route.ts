import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ------------------ Env toggles ------------------
const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const AI_VERIFIER = process.env.AI_VERIFIER === "1"; // turn on to use LLM windows
const MAX_WINDOW_SEC = Number(process.env.WINDOW_SEC || 120); // ~2min windows
const OVERLAP_SEC = Number(process.env.OVERLAP_SEC || 15);

// ------------------ Types ------------------
type PCS = "P" | "C";
type Utterance = {
  id: string;
  start?: number; // seconds
  end?: number;   // seconds
  speaker?: PCS;  // "P" (practitioner) or "C" (client)
  text: string;
};
type Block = {
  teach?: string; ask?: string; client?: string;
  utterance_ids: string[];
  start: number; end: number;
};

// ------------------ Utils ------------------
const toId = (p: string, i: number) => `${p}_${String(i).padStart(6, "0")}`;
const normSpace = (s: string) => s.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();

function preClean(s: string): string {
  return normSpace(
    s
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "") // strip [00:08]
      .replace(/\b(say it|find it|good|okay|uhhuh|oops|next letter|hold on|breathe|deep breath)\b[.,!?]*/gi, "")
      .replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, "")) // P - O - W - E - R → POWER
      .replace(/\r/g, "")
  );
}

function parseFromRaw(raw: string): Utterance[] {
  const lines = preClean(raw).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: Utterance[] = [];
  let last: PCS = "P";
  let t = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(P|C)\s*:\s*(.*)$/.exec(line);
    let speaker: PCS | undefined;
    let text = line;

    if (m) {
      speaker = m[1] as PCS;
      text = m[2].trim();
      last = speaker;
    } else {
      // simple guess: questions => P, short/all-caps => C, else last
      if (/\?\s*$/.test(line)) speaker = "P";
      else if ((line === line.toUpperCase() && /[A-Z]/.test(line)) || line.split(/\s+/).length <= 6) speaker = "C";
      else speaker = last;
      last = speaker;
    }

    const estDur = Math.max(1.2, Math.min(6, text.split(/\s+/).length * 0.35));
    out.push({ id: toId("raw", i), start: t, end: t + estDur, speaker, text });
    t += estDur;
  }
  return out;
}

function parseInput(body: any): Utterance[] {
  if (Array.isArray(body?.segments)) {
    return (body.segments as any[]).map((s, i) => ({
      id: s.id ?? toId("seg", i),
      start: typeof s.start === "number" ? s.start : undefined,
      end: typeof s.end === "number" ? s.end : undefined,
      speaker: s.speaker === "P" || s.speaker === "C" ? s.speaker : undefined,
      text: preClean(String(s.text ?? "")),
    }));
  }
  const raw = body?.rawTranscript || body?.transcript || body?.raw;
  if (typeof raw === "string" && raw.trim()) return parseFromRaw(raw);
  return [];
}

function totalDuration(us: Utterance[]): number {
  if (!us.length) return 0;
  return (us[us.length - 1].end ?? 0) - (us[0].start ?? 0);
}

// Merge tiny utterances with same speaker if close
function microMerge(utt: Utterance[], tiny=1.0, gap=0.8): Utterance[] {
  if (!utt.length) return utt;
  const out: Utterance[] = [];
  let buf = { ...utt[0] };
  const dur = (u: Utterance) => (u.end ?? 0) - (u.start ?? 0);
  const gapOf = (a: Utterance, b: Utterance) => Math.max(0, (b.start ?? 0) - (a.end ?? 0));
  for (let i = 1; i < utt.length; i++) {
    const u = utt[i];
    if (buf.speaker === u.speaker && (dur(buf) < tiny || dur(u) < tiny || gapOf(buf, u) <= gap)) {
      buf.text = `${buf.text} ${u.text}`.trim();
      buf.end = Math.max(buf.end ?? 0, u.end ?? 0);
    } else {
      out.push(buf);
      buf = { ...u };
    }
  }
  out.push(buf);
  return out;
}

// ------------------ Windowing (timestamp-based) ------------------
type Window = { idx: number; startSec: number; endSec: number; utterances: Utterance[] };

function makeWindows(utt: Utterance[], windowSec=120, overlapSec=15): Window[] {
  if (!utt.length) return [];
  const t0 = utt[0].start ?? 0;
  const T = (utt[utt.length - 1].end ?? t0);
  const windows: Window[] = [];
  let ws = t0, idx = 0;

  while (ws < T) {
    const we = ws + windowSec;
    const uIn = utt.filter(u => (u.start ?? 0) < we && (u.end ?? 0) > ws); // intersects window
    if (uIn.length) windows.push({ idx, startSec: ws, endSec: we, utterances: uIn });
    idx++;
    ws = we - overlapSec; // slide with overlap
  }
  return windows;
}

// ------------------ Deterministic fallback (no AI) ------------------
// Simple heuristic labeling + block builder (short)
function isQuestion(t: string): boolean {
  const s = t.trim();
  return /\?\s*$/.test(s) || /^(what|how|why|where|when|which|can|could|would|do|does|did|are|is|was|were|will|should|may|might)\b/i.test(s);
}
type Label = "TEACH" | "ASK" | "CLIENT";
type Labeled = Utterance & { label: Label };

function labelAll(utt: Utterance[]): Labeled[] {
  const out: Labeled[] = [];
  for (let i = 0; i < utt.length; i++) {
    const u = utt[i];
    if (isQuestion(u.text)) { out.push({ ...u, label: "ASK" }); continue; }
    if (u.speaker === "C" || (u.text === u.text.toUpperCase() && /[A-Z]/.test(u.text))) {
      out.push({ ...u, label: "CLIENT" });
    } else {
      out.push({ ...u, label: "TEACH" });
    }
  }
  return out;
}

function buildBlocksHeuristic(lab: Labeled[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lab.length) {
    const ids: string[] = [];
    let teach: string[] = [];
    let ask: string[] = [];
    let client: string[] = [];
    let start = lab[i].start ?? 0;
    let end = lab[i].end ?? start;

    // TEACH*
    while (i < lab.length && lab[i].label === "TEACH") {
      ids.push(lab[i].id); teach.push(lab[i].text); end = Math.max(end, lab[i].end ?? end); i++;
    }
    // ASK*
    while (i < lab.length && lab[i].label === "ASK") {
      ids.push(lab[i].id); ask.push(lab[i].text); end = Math.max(end, lab[i].end ?? end); i++;
    }
    // CLIENT+
    while (i < lab.length && lab[i].label === "CLIENT") {
      ids.push(lab[i].id); client.push(lab[i].text); end = Math.max(end, lab[i].end ?? end); i++;
    }

    if (teach.length || ask.length || client.length) {
      blocks.push({
        teach: teach.length ? normSpace(teach.join(" ")) : undefined,
        ask: ask.length ? normSpace(ask.join(" ").replace(/\s*\?\s*/g, "? ")) : undefined,
        client: client.length ? normSpace(client.join(" ").toUpperCase()) : undefined,
        utterance_ids: ids, start, end
      });
    }
  }
  return blocks;
}

// ------------------ LLM window formatter (coverage-preserving) ------------------
async function llmFormatWindow(openai: OpenAI, w: Window, contextTail: string) {
  // Prepare compact utterance list with IDs so model must account for them
  const list = w.utterances.map(u => `- id:${u.id} | ${u.speaker ?? "?"} | ${Math.round(u.start ?? 0)}-${Math.round(u.end ?? 0)} | ${u.text}`).join("\n");

  const prompt = `
You format utterances into TEACH / ASK / CLIENT blocks with FULL COVERAGE.
DO NOT invent content or change meaning. DO NOT drop any utterance IDs.

INPUT:
- "Utterances" are chronological lines like: id:<ID> | <P/C/?> | <start>-<end> | <text>.
- Use ONLY these utterances to build blocks.
- If a line can't fit, put it in UNASSIGNED with its id and reason.
- Prefer merging consecutive same-section lines.
- CLIENT text must be UPPERCASE; merge spelled letters (P-O-W-E-R → POWER).
- ASK is a genuine question; omit if not present.

CONTEXT_TAIL (previous window tail; continuity only, do not re-emit):
${contextTail || "(none)"}

OUTPUT (strict JSON, no prose):
{
  "blocks": [
    {
      "teach": "string or empty if none",
      "ask": "string or omitted",
      "client": "string or omitted",
      "utterance_ids": ["id1","id2",...]
    }
  ],
  "unassigned": [{"id":"...", "reason":"..."}]
}

Now format this window's utterances:

${list}
`.trim();

  const res = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" } as any,
    messages: [
      { role: "system", content: "You are a precise transcript block formatter. Return valid JSON only." },
      { role: "user", content: prompt }
    ]
  });

  let raw = res.choices[0].message?.content || "{}";
  try {
    const parsed = JSON.parse(raw);
    const blocks: Block[] = (parsed.blocks || []).map((b: any) => ({
      teach: b.teach || undefined,
      ask: b.ask,
      client: b.client ? String(b.client).toUpperCase() : undefined,
      utterance_ids: Array.isArray(b.utterance_ids) ? b.utterance_ids : [],
      start: Math.min(...w.utterances.filter(u => b.utterance_ids.includes(u.id)).map(u => u.start ?? Infinity)),
      end: Math.max(...w.utterances.filter(u => b.utterance_ids.includes(u.id)).map(u => u.end ?? -Infinity)),
    }));
    const unassigned = parsed.unassigned || [];
    return { blocks, unassigned };
  } catch (e) {
    // If JSON failed, fall back to heuristic for this window
    const lab = labelAll(w.utterances);
    return { blocks: buildBlocksHeuristic(lab), unassigned: [] };
  }
}

// ------------------ Stitcher for overlapping windows ------------------
function stitchBlocks(allWindows: { blocks: Block[] }[]): Block[] {
  const out: Block[] = [];
  const seen = new Set<string>(); // signature by utterance_ids join

  for (const w of allWindows) {
    for (const b of w.blocks) {
      const key = b.utterance_ids.join("|");
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(b);
      }
    }
  }

  // Sort final blocks by start time
  return out.sort((a, b) => a.start - b.start);
}

// ------------------ Markdown render (your exact style) ------------------
function renderMarkdown(blocks: Block[], meta?: Record<string,string>) {
  const header = `**Date:** ${meta?.date ?? "N/A"} • **Practitioner:** ${meta?.practitioner ?? "P"} • **Client:** ${meta?.client ?? "C"} • **Topic:** ${meta?.topic ?? "N/A"}`;
  const lines: string[] = [header, ""];
  for (const b of blocks) {
    if (b.teach) lines.push(`**TEACH:** ${b.teach}`);
    if (b.ask)   lines.push(`\n**ASK:** ${b.ask}`);
    if (b.client)lines.push(`\n**CLIENT:** ${b.client}`);
    lines.push(""); // blank line between blocks
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ------------------ Handler ------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const meta = {
      date: body?.date ?? "N/A",
      practitioner: body?.practitioner ?? "P",
      client: body?.client ?? "C",
      topic: body?.topic ?? "Tea parties & social power",
    };

    let utt = parseInput(body);
    if (!utt.length) {
      return NextResponse.json({ error: "Provide `segments` or `rawTranscript`/`transcript`/`raw`." }, { status: 400 });
    }

    // Normalize & merge tiny fragments
    utt = microMerge(utt, 1.0, 0.8);

    // AI path: timestamp windows with overlap; else deterministic fallback
    let finalBlocks: Block[];

    if (AI_VERIFIER) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const windows = makeWindows(utt, MAX_WINDOW_SEC, OVERLAP_SEC);

      let tail = "";
      const windowResults: { blocks: Block[] }[] = [];

      for (const w of windows) {
        const { blocks } = await llmFormatWindow(openai, w, tail);
        windowResults.push({ blocks });

        // Update tail with last few lines for continuity (no hard dependency)
        const lastClient = blocks.map(b => b.client || "").filter(Boolean).slice(-3).join("\n");
        tail = lastClient || tail;
      }

      finalBlocks = stitchBlocks(windowResults);
    } else {
      // Deterministic fallback (no AI)
      finalBlocks = buildBlocksHeuristic(labelAll(utt));
    }

    // Final markdown
    const cleanedTranscript = renderMarkdown(finalBlocks, meta);

    // Coverage metric
    const idSet = new Set<string>();
    finalBlocks.forEach(b => b.utterance_ids.forEach(id => idSet.add(id)));
    const covered = utt.filter(u => idSet.has(u.id));
    const coveredDur = covered.reduce((s,u)=> s + Math.max(0, (u.end ?? 0) - (u.start ?? 0)), 0);
    const cov = totalDuration(utt) > 0 ? Math.min(1, coveredDur / totalDuration(utt)) : 1;

    return NextResponse.json({
      meta,
      stats: {
        utterances: utt.length,
        blocks: finalBlocks.length,
        coverage_percent: Math.round(cov * 1000) / 10, // e.g., 99.2
        mode: AI_VERIFIER ? "ai_windows" : "heuristic",
        window_sec: AI_VERIFIER ? MAX_WINDOW_SEC : 0,
        overlap_sec: AI_VERIFIER ? OVERLAP_SEC : 0
      },
      cleanedTranscript
    });
  } catch (e: any) {
    console.error("❌ cleanTranscript error:", e?.stack || e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to process transcript" }, { status: 500 });
  }
}
