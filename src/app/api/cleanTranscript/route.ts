import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ---------------- Types ----------------
type Utterance = { id: number; speaker?: string; text: string };

// ---------------- Utterance segmentation ----------------
function segmentTranscript(raw: string): Utterance[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let id = 0;
  return lines.map(l => {
    const m = /^(P|C)\s*:\s*(.*)$/.exec(l);
    if (m) return { id: id++, speaker: m[1], text: m[2].trim() };
    return { id: id++, text: l };
  });
}

// Break into windows with overlap
function makeWindows(utterances: Utterance[], size = 25, overlap = 5): Utterance[][] {
  const windows: Utterance[][] = [];
  let i = 0;
  while (i < utterances.length) {
    windows.push(utterances.slice(i, i + size));
    if (i + size >= utterances.length) break;
    i += size - overlap;
  }
  return windows;
}

// ---------------- LLM call ----------------
async function processWindow(openai: OpenAI, window: Utterance[], headerExpected: boolean) {
  const content = window.map(u => `${u.id}|${u.speaker || "?"}: ${u.text}`).join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "You are a transcript formatter. Only output TEACH, ASK, CLIENT blocks.",
      },
      {
        role: "user",
        content: `
HEADER EXPECTED: ${headerExpected ? "YES" : "NO"}

TASK:
Condense this window into TEACH → [ASK] → CLIENT blocks.

RULES:
- TEACH: ≤3 sentences (practitioner explanation/instruction).
- ASK: ≤1 clear question (omit if none).
- CLIENT: concise ALL CAPS response (merge spellings).
- Preserve order, do not invent content.
- Each block separated by blank line.
- At end of each block, include a line "IDS: <list of utterance ids consumed>".

OUTPUT FORMAT:
${headerExpected ? "<date>; <P_INIT>; <C_INIT>; <topic or N/A>\n\n" : ""}
TEACH: ...
[optional] ASK: ...
CLIENT: ...
IDS: 12,13,14
`.trim(),
      },
      { role: "user", content },
    ],
  });

  return response.choices[0].message?.content?.trim() || "";
}

// ---------------- Handler ----------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body?.rawTranscript || body?.transcript;
    if (!raw) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const utterances = segmentTranscript(raw);
    const windows = makeWindows(utterances, 25, 5);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const parts: string[] = [];

    for (let i = 0; i < windows.length; i++) {
      const part = await processWindow(openai, windows[i], i === 0);
      parts.push(part);
    }

    // Stitch + collect IDs
    const seen = new Set<string>();
    const coveredIds = new Set<number>();
    const blocks = parts
      .join("\n\n")
      .split(/\n{2,}/)
      .map(b => b.trim())
      .filter(Boolean)
      .filter(b => {
        const sig = b.toUpperCase();
        if (seen.has(sig)) return false;
        seen.add(sig);

        // collect IDs
        const m = /IDS:\s*([\d,\s]+)/i.exec(b);
        if (m) {
          m[1].split(",").map(x => x.trim()).forEach(x => {
            const idNum = parseInt(x, 10);
            if (!isNaN(idNum)) coveredIds.add(idNum);
          });
        }
        return true;
      });

    const finalTranscript = blocks
      .map(b => b.replace(/\n?IDS:.*$/i, "").trim())
      .join("\n\n");

    // Coverage check
    const total = utterances.length;
    const covered = coveredIds.size;
    const coverage = ((covered / total) * 100).toFixed(1) + "%";
    const unassigned = utterances.filter(u => !coveredIds.has(u.id));

    return NextResponse.json({
      cleanedTranscript: finalTranscript,
      metrics: {
        totalUtterances: total,
        coveredUtterances: covered,
        coverage,
        unassigned: unassigned.map(u => ({ id: u.id, text: u.text })),
      },
    });
  } catch (err: any) {
    console.error("❌ cleanTranscript error:", err);
    return NextResponse.json({ error: "Failed to process transcript" }, { status: 500 });
  }
}
