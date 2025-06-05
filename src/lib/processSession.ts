import { redirect } from 'next/navigation';

export interface SessionAnalysis {
  summary: string;
  successes: string[];
  struggles: string[];
  topicsDiscussed: string[];
}

export interface ProcessingResult {
  transcript: string;
  analysis: SessionAnalysis;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export async function processSession(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  try {
    // Step 1: Upload (stage=10)
    onProgress?.({
      stage: 'uploading',
      progress: 10,
      message: 'Uploading file…',
    });

    const formData = new FormData();
    formData.append('file', file);

    // Step 2: Transcribe (stage=30)
    onProgress?.({
      stage: 'transcribing',
      progress: 30,
      message: 'Transcribing audio…',
    });

    const transcriptionResponse = await fetch(
      'https://nurturelogserver.onrender.com/transcribe',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!transcriptionResponse.ok) {
      // You can inspect transcriptionResponse.status or body if you like:
      const errorText = await transcriptionResponse.text();
      console.error('Transcription service error:', errorText);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const transcriptionJson = await transcriptionResponse.json();
    const transcript: string = transcriptionJson.text;
    console.log('📝 Transcript received:', transcript?.substring(0, 100) + '…');

    // Step 3: Analyze (stage=70)
    onProgress?.({
      stage: 'analyzing',
      progress: 70,
      message: 'Analyzing content…',
    });

    const analysisResponse = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('ChatGPT analysis error:', errorText);
      throw new Error(`Analysis failed: ${errorText}`);
    }

    const analysisJson = await analysisResponse.json();

    // Step 4: Complete (stage=100)
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Done!',
    });

    return {
      transcript,
      analysis: analysisJson,
    };
  } catch (error: any) {
    console.error('processSession error:', error);
    throw error;
  }
}