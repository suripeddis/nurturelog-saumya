import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ---------- config ----------
const MODEL = process.env.OPENAI_TRANSCRIPT_MODEL || "gpt-4o";
const SHOULD_POLISH = process.env.HYBRID_POLISH === "1"; // 1 => polish TEACH/ASK with LLM

// ---------- types ----------
type Item = { speaker: "P" | "C"; text: string };
type Body =
  | { items: Item[] }                 // preferred: diarized lines from Deepgram: [{speaker:"P"|"C", text}]
  | { raw: string }                   // fallback: plain text with "P: ..." / "C: ..." per line
  | Record<string, unknown>;

// ---------- helpers ----------
function preClean(s: string): string {
  return s
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "") // [00:08]
    .replace(
      /\b(say it|find it|good|okay|ok|uhhuh|oops|next letter|hold on|breathe|deep breath)\b[.,!?]*/gi,
      ""
    )
    .replace(/[A-Z](?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, "")) // P-O-W-E-R -> POWER
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseItemsFromRaw(raw: string): Item[] {
  // Accept lines like "P: text" / "C: text"; default to client if no prefix.
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

function mergeLetters(s: string): string {
  return s.replace(/\b([A-Z])(?:\s*-\s*[A-Z]){1,10}\b/g, (m) => m.replace(/\s*-\s*/g, ""));
}

function isImplicitQuestion(text: string): boolean {
  if (/\?\s*$/.test(text)) return true;
  // Common interrogative cues (no '?')
  const cues =
    /^(?:what|when|where|why|how|which|who|whom|whose|is|are|was|were|do|does|did|can|could|would|will|should|shall|may|might|have|has|had|tell me|please describe|share|explain|could you|can you|would you|will you)\b/i;
  return cues.test(text.trim());
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function toBlocks(items: Item[]) {
  // Build blocks: consecutive P lines (TEACH/ASK) followed by consecutive C lines (CLIENT)
  const blocks: { teach?: string; ask?: string; client?: string }[] = [];
  let i = 0;

  while (i < items.length) {
    // practitioner segment
    let teachParts: string[] = [];
    let askLine: string | undefined;

    while (i < items.length && items[i].speaker === "P") {
      const t = normalizeWhitespace(preClean(items[i].text));
      if (!t) {
        i++;
        continue;
      }
      if (isImplicitQuestion(t) && !askLine) {
        askLine = t.endsWith("?") ? t : t + "?";
      } else {
        teachParts.push(t);
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

// Accept JSON (items/raw) or multipart (file/raw)
async function extractItems(req: Request): Promise<Item[] | null> {
  const ct = req.headers.get("content-type") || "";

  try {
    if (ct.includes("application/json")) {
      const body = (await req.json()) as Body;
      if ("items" in body && Array.isArray((body as any).items)) {
        return (body as any).items as Item[];
      }
      if (typeof (body as any).raw === "string") {
        return parseItemsFromRaw((body as any).raw);
      }
      return null;
    }

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const raw = form.get("raw");

      if (file instanceof File) {
        const text = await file.text();
        return parseItemsFromRaw(text);
      }
      if (typeof raw === "string") {
        return parseItemsFromRaw(raw);
      }
      return null;
    }
  } catch {
    return null;
  }

  return null;
}

// ---------- handler ----------
export async function POST(req: Request) {
  try {
    let items = await extractItems(req);

    // If caller sent { rawTranscript } like your older flow, accept it too
    if (!items) {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(() => null);
        const rawTranscript = body?.rawTranscript as string | undefined;
        if (rawTranscript) {
          items = parseItemsFromRaw(rawTranscript);
        }
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Provide transcript as JSON { items:[{speaker:'P'|'C', text}] } or { raw:'P:...\\nC:...' } or multipart with 'file' or 'raw'.",
        },
        { status: 400 }
      );
    }

    // Rules-first structure
    const blocks = toBlocks(items);

    // Optional LLM polish
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

    const cleanedTranscript = out.trim();
    return NextResponse.json({ cleanedTranscript });
  } catch (e) {
    console.error("❌ Hybrid cleanTranscript error:", e);
    return NextResponse.json({ error: "Failed to process transcript" }, { status: 500 });
  }
}