import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// --- Config ---
const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const SHOULD_POLISH = process.env.HYBRID_POLISH === "1"; // optional micro-polish of TEACH/ASK
const DG_KEY = process.env.DEEPGRAM_API_KEY || "";
const P_SPEAKER_OVERRIDE = process.env.P_SPEAKER?.trim(); // "0" | "1"

// --- Types ---
type Item = { speaker: "P" | "C"; text: string };

// --- Utility regex/sets ---
const TOPIC_KEYWORDS = [
  // lesson themes to keep
  "tea", "teacup", "china", "fancy", "dress", "manners", "etiquette", "wealth",
  "connection", "status", "symbol", "social power", "power", "hangry", "wildfire",
  "feast", "present", "leadership",
];

const ASIDE_PATTERNS: RegExp[] = [
  // logistics / motor prompts / to-parent chatter
  /\b(mom|mother)\b/i,
  /\b(phone call|on the phone)\b/i,
  /\b(lunch|restroom)\b/i,
  /\b(camera|mic|record|summer's getting lunch)\b/i,
  /\b(let'?s|gonna|going to)\s+(walk|move|come|reset|try|do|hold|see|check|fade|switch)\b/i,
  /\b(hold|holding|grab)\b.*\b(board|device|ipad)\b/i,
  /\bthumb\b/i,
  /\bstand|sit|seat|breathe|deep breath|take a breath|stretch\b/i,
  /\bparalleled|pressure|strain|stabilize|gesture\b/i,
  /\btable|position|top row|bottom row|up high|down\b/i,
  /\bspell the word\b/i, // mechanical prompting (often noise in final transcript)
];

const FILLER_PATTERNS: RegExp[] = [
  /\b(okay|ok|good|great|excellent|perfect|yeah|uhhuh|right)\b[.!?,]*/gi,
  /\b(hmm|uh|um)\b/gi,
];

// --- Helpers ---
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
function mergeLetters(s: string): string {
  return s.replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, ""));
}
function isQuestion(t: string): boolean {
  return /\?\s*$/.test(t);
}
function containsTopicKeyword(t: string): boolean {
  const low = t.toLowerCase();
  return TOPIC_KEYWORDS.some((k) => low.includes(k));
}
function looksAside(t: string): boolean {
  return ASIDE_PATTERNS.some((re) => re.test(t));
}
function stripFiller(t: string): string {
  let out = t;
  for (const re of FILLER_PATTERNS) out = out.replace(re, "");
  return normalizeWhitespace(out);
}
function toUpperClientPhrase(t: string): string {
  // Keep short, meaningful client phrases; uppercased
  const cleaned = stripFiller(mergeLetters(t));
  // Prefer <= 8 words; if longer, take first meaningful clause/sentence
  const firstClause = cleaned.split(/[.!?]/)[0] || cleaned;
  const words = firstClause.trim().split(/\s+/);
  const short = words.slice(0, 12).join(" ");
  return short.toUpperCase();
}

// --- Parse helpers (back-compat for rawTranscript) ---
function parsePCLines(raw: string): Item[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(P|C)\s*:\s*(.*)$/.exec(line);
      if (!m) return { speaker: "C", text: line };
      return { speaker: m[1] as "P" | "C", text: m[2] };
    });
}

async function tryExtractFromJSON(req: Request): Promise<Item[] | null> {
  try {
    const body = await req.json();
    if (Array.isArray(body?.items)) {
      return (body.items as any[]).map((x) => ({
        speaker: (x.speaker === "P" ? "P" : "C") as "P" | "C",
        text: String(x.text ?? ""),
      }));
    }
    const raw = (body?.raw ?? body?.rawTranscript ?? body?.transcript) as string | undefined;
    if (typeof raw === "string" && raw.trim()) return parsePCLines(raw);
  } catch {}
  return null;
}

async function tryExtractFromText(req: Request): Promise<Item[] | null> {
  try {
    const txt = await req.text();
    if (txt && txt.trim()) return parsePCLines(txt);
  } catch {}
  return null;
}

async function deepgramFromFile(file: File): Promise<Item[] | null> {
  if (!DG_KEY) return null;

  const dgForm = new FormData();
  dgForm.append("audio", file, file.name);

  const dgRes = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&utterances=true&smart_format=true",
    { method: "POST", headers: { Authorization: `Token ${DG_KEY}` }, body: dgForm }
  );
  if (!dgRes.ok) {
    const errText = await dgRes.text().catch(() => "");
    throw new Error(`Deepgram error ${dgRes.status}: ${errText || dgRes.statusText}`);
  }
  const dg: any = await dgRes.json();
  const utts: any[] = dg?.results?.utterances || [];
  if (!Array.isArray(utts) || utts.length === 0) throw new Error("Deepgram returned no utterances");

  if (P_SPEAKER_OVERRIDE) {
    return utts.map((u) => ({
      speaker: String(u.speaker ?? "0") === P_SPEAKER_OVERRIDE ? "P" : "C",
      text: String(u.transcript ?? ""),
    }));
  }
  // heuristic: speaker with more '?' is practitioner
  const qCount: Record<string, number> = {};
  for (const u of utts) {
    const sp = String(u.speaker ?? "0");
    const txt = String(u.transcript ?? "");
    qCount[sp] = (qCount[sp] || 0) + (txt.includes("?") ? 1 : 0);
  }
  const pSpeaker = Object.entries(qCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "0";

  return utts.map((u) => ({
    speaker: String(u.speaker ?? "0") === pSpeaker ? "P" : "C",
    text: String(u.transcript ?? ""),
  }));
}

async function tryExtractFromMultipart(req: Request): Promise<Item[] | null> {
  const form = await req.formData();

  const rt =
    (form.get("rawTranscript") as string) ||
    (form.get("transcript") as string) ||
    (form.get("raw") as string) ||
    "";
  if (rt && rt.trim()) return parsePCLines(rt);

  const file = form.get("file");
  if (!(file instanceof File)) return null;

  if (file.type === "text/plain" || /\.txt$/i.test(file.name)) {
    const txt = await file.text();
    if (txt && txt.trim()) return parsePCLines(txt);
    return null;
  }

  return await deepgramFromFile(file);
}

async function extractItems(req: Request): Promise<Item[] | null> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const items = await tryExtractFromJSON(req);
    if (items?.length) return items;
    return null;
  }
  if (ct.includes("multipart/form-data")) {
    const items = await tryExtractFromMultipart(req);
    if (items?.length) return items;
    return null;
  }
  if (ct.includes("text/plain")) {
    const items = await tryExtractFromText(req);
    if (items?.length) return items;
    return null;
  }
  // best-effort fallback
  const jsonTry = await tryExtractFromJSON(req);
  if (jsonTry?.length) return jsonTry;
  const textTry = await tryExtractFromText(req);
  if (textTry?.length) return textTry;
  return null;
}

// --- Core: structure + filtering ---
function structureBlocks(items: Item[]) {
  // 1) clean lines
  const cleaned = items.map((it) => ({
    speaker: it.speaker,
    text: stripFiller(preClean(it.text)),
  }));

  // 2) keep only practitioner content that's a question or contains topic keywords, and NOT an aside
  const kept: Item[] = [];
  for (const it of cleaned) {
    if (it.speaker === "C") {
      kept.push({ speaker: "C", text: it.text });
      continue;
    }
    const t = it.text;
    if (!t) continue;
    if (looksAside(t)) continue;
    if (isQuestion(t) || containsTopicKeyword(t)) {
      kept.push({ speaker: "P", text: t });
    }
  }

  // 3) pair P→C windows into blocks
  const blocks: { teach?: string; ask?: string; client?: string }[] = [];
  let i = 0;
  while (i < kept.length) {
    // accumulate TEACH (topic lines without '?') and 1 ASK (with '?')
    let teachParts: string[] = [];
    let askLine: string | undefined;

    while (i < kept.length && kept[i].speaker === "P") {
      const t = kept[i].text;
      if (isQuestion(t) && !askLine) askLine = t.endsWith("?") ? t : t + "?";
      else if (containsTopicKeyword(t)) teachParts.push(t);
      i++;
    }

    // take following client burst (up to 2 C lines) and condense
    let clientBuf: string[] = [];
    while (i < kept.length && kept[i].speaker === "C" && clientBuf.length < 2) {
      const c = kept[i].text;
      if (c) clientBuf.push(c);
      i++;
    }

    if (teachParts.length || askLine || clientBuf.length) {
      const clientPhrase = clientBuf.length ? toUpperClientPhrase(clientBuf.join(" ")) : undefined;
      blocks.push({
        teach: teachParts.length ? normalizeWhitespace(teachParts.join(" ")) : undefined,
        ask: askLine,
        client: clientPhrase,
      });
    }
  }

  // 4) prune blocks with no signal (e.g., no ASK and client too empty)
  return blocks.filter((b) => b.ask || (b.client && b.client.length >= 3) || b.teach);
}

async function polishIfEnabled(openai: OpenAI | null, text: string, tag: "TEACH" | "ASK") {
  if (!openai) return text;
  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          `Rewrite the ${tag} to be concise and clear WITHOUT adding facts. ` +
          (tag === "TEACH" ? "Max 2 short sentences." : "Exactly one question.") +
          " Return ONLY the rewritten text.",
      },
      { role: "user", content: text },
    ],
  });
  return r.choices[0].message?.content?.trim() || text;
}

function inferTopic(blocks: { teach?: string; ask?: string; client?: string }[]): string {
  const bag = (blocks
    .map((b) => `${b.teach ?? ""} ${b.ask ?? ""} ${b.client ?? ""}`)
    .join(" ")
    .toLowerCase());

  const hits: string[] = [];
  if (bag.includes("tea")) hits.push("Tea parties");
  if (bag.includes("power")) hits.push("social power");
  if (bag.includes("etiquette") || bag.includes("manners")) hits.push("etiquette");
  if (bag.includes("china")) hits.push("china");
  if (!hits.length) return "N/A";
  return hits.join(" & ");
}

// --- Handler ---
export async function POST(req: Request) {
  try {
    const items = await extractItems(req);
    if (!items || !items.length) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const blocks = structureBlocks(items);

    // optional micro-polish
    const openai = SHOULD_POLISH ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    const polished = [];
    for (const b of blocks) {
      const teach = b.teach ? await polishIfEnabled(openai, b.teach, "TEACH") : undefined;
      const ask = b.ask ? await polishIfEnabled(openai, b.ask, "ASK") : undefined;
      const client = b.client;
      if (teach || ask || client) polished.push({ teach, ask, client });
    }

    // Header (simple inference)
    const header = `**Date:** N/A • **Practitioner:** P • **Client:** C • **Topic:** ${inferTopic(polished)}`;

    // Render
    let out = `${header}\n\n`;
    for (const b of polished) {
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
