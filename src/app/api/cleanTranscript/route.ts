import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// --- Config ---
const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const SHOULD_POLISH = process.env.HYBRID_POLISH === "1";
const DG_KEY = process.env.DEEPGRAM_API_KEY || "";

// --- Types ---
type Item = { speaker: "P" | "C"; text: string };

// --- Utility regex ---
function normalizeWhitespace(s: string): string {
  return s.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
}
function preClean(s: string): string {
  return normalizeWhitespace(
    s
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
      .replace(/[A-Z](?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, ""))
      .replace(/\r/g, "")
  );
}
function isQuestion(t: string): boolean {
  return /\?\s*$/.test(t);
}

// --- Parse helpers ---
function parsePCLines(raw: string): Item[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: Item[] = [];
  let last: "P" | "C" = "P"; // default start with Practitioner

  for (const line of lines) {
    const m = /^(P|C)\s*:\s*(.*)$/.exec(line);
    if (m) {
      last = m[1] as "P" | "C";
      items.push({ speaker: last, text: m[2] });
      continue;
    }

    // heuristic for unlabeled lines
    const isQ = isQuestion(line);
    const isShouty = /^[A-Z0-9\s,'".-]{2,}$/.test(line) && line === line.toUpperCase();
    const isShort = line.split(/\s+/).length <= 6;

    let speaker: "P" | "C";
    if (isQ) speaker = "P";
    else if (isShouty || isShort) speaker = "C";
    else speaker = last;

    last = speaker;
    items.push({ speaker, text: line });
  }
  return items;
}

// --- Block structuring ---
function structureBlocks(items: Item[]) {
  const blocks: { teach?: string; ask?: string; client?: string }[] = [];
  let i = 0;

  while (i < items.length) {
    let teachParts: string[] = [];
    let askLine: string | undefined;

    while (i < items.length && items[i].speaker === "P") {
      const t = items[i].text;
      if (isQuestion(t) && !askLine) askLine = t;
      else teachParts.push(t);
      i++;
    }

    let clientBuf: string[] = [];
    while (i < items.length && items[i].speaker === "C" && clientBuf.length < 2) {
      clientBuf.push(items[i].text);
      i++;
    }

    if (teachParts.length || askLine || clientBuf.length) {
      blocks.push({
        teach: teachParts.length ? teachParts.join(" ") : undefined,
        ask: askLine,
        client: clientBuf.length ? clientBuf.join(" ").toUpperCase() : undefined,
      });
    }
  }
  return blocks;
}

// --- Handler ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body?.rawTranscript || body?.transcript || body?.raw;
    if (!raw) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const items = parsePCLines(preClean(raw));
    const blocks = structureBlocks(items);

    const header = `**Date:** N/A • **Practitioner:** P • **Client:** C • **Topic:** Tea parties`;

    let out = `${header}\n\n`;
    for (const b of blocks) {
      if (b.teach) out += `**TEACH:** ${b.teach}\n\n`;
      if (b.ask) out += `**ASK:** ${b.ask}\n\n`;
      if (b.client) out += `**CLIENT:** ${b.client}\n\n`;
    }
    return NextResponse.json({ cleanedTranscript: out.trim() });
  } catch (e: any) {
    console.error("❌ cleanTranscript error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to process transcript" }, { status: 500 });
  }
}
