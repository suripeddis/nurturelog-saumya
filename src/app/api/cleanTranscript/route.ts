// app/api/cleanTranscript/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ---- Config ----
const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const SHOULD_POLISH = process.env.HYBRID_POLISH === "1"; // 1 => LLM polish on
const DG_KEY = process.env.DEEPGRAM_API_KEY || "";       // for audio/video auto-transcribe (optional)
const P_SPEAKER_OVERRIDE = process.env.P_SPEAKER?.trim(); // e.g., "0" or "1"

// ---- Types ----
type Item = { speaker: "P" | "C"; text: string };

// ---- Helpers ----
function preClean(s: string): string {
  return s
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
    .replace(/\b(say it|find it|good|okay|ok|uhhuh|oops|next letter|hold on|breathe|deep breath)\b[.,!?]*/gi, "")
    .replace(/[A-Z](?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, "")) // P-O-W-E-R -> POWER
    .replace(/[ \t]+/g, " ")
    .trim();
}
function mergeLetters(s: string): string {
  return s.replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, ""));
}
function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
function isImplicitQuestion(text: string): boolean {
  if (/\?\s*$/.test(text)) return true;
  const cues =
    /^(?:what|when|where|why|how|which|who|whom|whose|is|are|was|were|do|does|did|can|could|would|will|should|shall|may|might|have|has|had|tell me|please describe|share|explain|could you|can you|would you|will you)\b/i;
  return cues.test(text.trim());
}
function toBlocks(items: Item[]) {
  const blocks: { teach?: string; ask?: string; client?: string }[] = [];
  let i = 0;

  while (i < items.length) {
    // practitioner segment
    let teachParts: string[] = [];
    let askLine: string | undefined;

    while (i < items.length && items[i].speaker === "P") {
      const t = normalizeWhitespace(preClean(items[i].text));
      if (t) {
        if (isImplicitQuestion(t) && !askLine) askLine = t.endsWith("?") ? t : t + "?";
        else teachParts.push(t);
      }
      i++;
    }

    // client segment
    let clientParts: string[] = [];
    while (i < items.length && items[i].speaker === "C") {
      const c = normalizeWhitespace(preClean(items[i].text));
      if (c) clientParts.push(c);
      i++;
    }

    if (teachParts.length || askLine || clientParts.length) {
      const clientText = clientParts.join(" ");
      blocks.push({
        teach: teachParts.length ? normalizeWhitespace(teachParts.join(" ")) : undefined,
        ask: askLine,
        client: clientText ? mergeLetters(clientText).toUpperCase() : undefined,
      });
    }
  }
  return blocks;
}
async function polish(openai: OpenAI, text: string, tag: "TEACH" | "ASK"): Promise<string> {
  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          `Rewrite the ${tag} text to be concise and clear WITHOUT changing meaning or adding details.\n` +
          `- TEACH: at most 3 concise sentences.\n` +
          `- ASK: exactly one question.\n` +
          `Return ONLY the rewritten text.`,
      },
      { role: "user", content: text },
    ],
  });
  return r.choices[0].message?.content?.trim() || text;
}

// ---- Parsers (back-compat for rawTranscript everywhere) ----
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
  } catch {
    /* ignore */
  }
  return null;
}

async function tryExtractFromText(req: Request): Promise<Item[] | null> {
  try {
    const txt = await req.text();
    if (txt && txt.trim()) return parsePCLines(txt);
  } catch {
    /* ignore */
  }
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

  // choose P speaker
  if (P_SPEAKER_OVERRIDE) {
    return utts.map((u) => ({
      speaker: String(u.speaker ?? "0") === P_SPEAKER_OVERRIDE ? "P" : "C",
      text: String(u.transcript ?? ""),
    }));
  }
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

  // rawTranscript/transcript/raw fields (back-compat)
  const rt =
    (form.get("rawTranscript") as string) ||
    (form.get("transcript") as string) ||
    (form.get("raw") as string) ||
    "";
  if (rt && rt.trim()) return parsePCLines(rt);

  const file = form.get("file");
  if (!(file instanceof File)) return null;

  // text file with P:/C: lines
  if (file.type === "text/plain" || /\.txt$/i.test(file.name)) {
    const txt = await file.text();
    if (txt && txt.trim()) return parsePCLines(txt);
    return null;
  }

  // audio/video -> Deepgram (if configured)
  return await deepgramFromFile(file);
}

async function extractItems(req: Request): Promise<Item[] | null> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const items = await tryExtractFromJSON(req);
    if (items?.length) return items;
    // if JSON parse consumed body and failed, nothing else to try
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

  // Fallback attempt: try JSON, then plain text
  const jsonTry = await tryExtractFromJSON(req);
  if (jsonTry?.length) return jsonTry;
  const textTry = await tryExtractFromText(req);
  if (textTry?.length) return textTry;

  return null;
}

// ---- Handler ----
export async function POST(req: Request) {
  try {
    const items = await extractItems(req);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const blocks = toBlocks(items);

    const openai = SHOULD_POLISH ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

    let out = "";
    for (const b of blocks) {
      let teach = b.teach ? normalizeWhitespace(b.teach) : undefined;
      let ask = b.ask ? normalizeWhitespace(b.ask) : undefined;

      if (openai && teach) teach = await polish(openai, teach, "TEACH");
      if (openai && ask) ask = await polish(openai, ask, "ASK");

      if (teach) out += `TEACH: ${teach}\n`;
      if (ask) out += `ASK: ${ask}\n`;
      if (b.client) out += `CLIENT: ${b.client}\n`;
      out += `\n`;
    }

    return NextResponse.json({ cleanedTranscript: out.trim() });
  } catch (e: any) {
    console.error("❌ cleanTranscript error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to process transcript" }, { status: 500 });
  }
}