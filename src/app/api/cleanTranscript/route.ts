import type { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { rawTranscript } = req.body;
  
    if (!rawTranscript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }
  
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const chunks = chunkText(rawTranscript);
      const cleanedChunks: string[] = [];
  
      for (const chunk of chunks) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are processing a session transcript. Format your output as instructed."
            },
            {
              role: "user",
              content: `
  Clean this transcript. Use the following format:
  <date>; <practitioner initials>; <client initials>; <topic>
  - [TEACH] for each teaching or instruction from the practitioner.
  - [QUESTION ASKED] for each question asked by the practitioner.
  - [COACH] for brief coaching prompts that help focus, posture, breathing, etc.
  - [CLIENT] for the response in ALL CAPS (or (ACTION) if nonverbal).
  Be concise. Skip filler, small talk, and repeated phrases.
  
  Transcript:
  ${chunk}
              `.trim(),
            },
          ],
          temperature: 0.2,
        });
  
        const cleanedPart = response.choices[0].message?.content?.trim() || "";
        cleanedChunks.push(cleanedPart);
      }
  
      res.status(200).json({ cleanedTranscript: cleanedChunks.join('\n\n') });
    } catch (err: any) {
      console.error("❌ Error in cleanTranscript API:", err);
      res.status(500).json({ error: "Failed to clean transcript" });
    }
  }
  