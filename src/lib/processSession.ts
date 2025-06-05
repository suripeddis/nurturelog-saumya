import { redirect } from 'next/navigation';

export interface ProcessingResult {
  transcript: string;
  analysis: string;
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
    // Step 1: Start upload
    onProgress?.({ stage: 'uploading', progress: 10, message: 'Uploading file...' });

    const formData = new FormData();
    formData.append('file', file);

    // Step 2: Send to AssemblyAI for transcription
    onProgress?.({ stage: 'transcribing', progress: 30, message: 'Transcribing audio...' });

    const transcriptionResponse = await fetch('/api/assemblyai', {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const { text: transcript } = await transcriptionResponse.json();
    console.log('Transcript:', transcript);

    // Step 3: Send to ChatGPT for analysis
    onProgress?.({ stage: 'analyzing', progress: 70, message: 'Analyzing content...' });

    const analysisResponse = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze transcript');
    }

    
    const { content: analysis } = await analysisResponse.json();
    console.log('Analysis:', analysis);

    // Step 4: Complete
    onProgress?.({ stage: 'complete', progress: 100, message: 'Complete!' });

    return {
      transcript,
      analysis,
    };
  } catch (error) {
    console.error('Error processing session:', error);
    throw error;
  }
} 