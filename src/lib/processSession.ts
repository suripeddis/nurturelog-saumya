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
    console.log('Transcript received:', transcript?.substring(0, 100) + '...');

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
      const errorText = await analysisResponse.text();
      console.error('ChatGPT API error:', errorText);
      throw new Error('Failed to analyze transcript');
    }

    const analysis: SessionAnalysis = await analysisResponse.json();
    console.log('Structured analysis received:', {
      summary: analysis.summary?.substring(0, 50) + '...',
      successesCount: analysis.successes?.length,
      strugglesCount: analysis.struggles?.length,
      topicsCount: analysis.topicsDiscussed?.length
    });

    // Validate the structure
    if (!analysis.summary || !Array.isArray(analysis.successes) || 
        !Array.isArray(analysis.struggles) || !Array.isArray(analysis.topicsDiscussed)) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Received invalid analysis structure from ChatGPT');
    }

    // Step 4: Complete
    onProgress?.({ stage: 'complete', progress: 100, message: 'Complete!' });

    const result: ProcessingResult = {
      transcript,
      analysis,
    };

    console.log('Final result structure:', {
      hasTranscript: !!result.transcript,
      analysisStructure: {
        hasSummary: !!result.analysis.summary,
        successesCount: result.analysis.successes.length,
        strugglesCount: result.analysis.struggles.length,
        topicsCount: result.analysis.topicsDiscussed.length
      }
    });

    return result;
  } catch (error) {
    console.error('Error processing session:', error);
    throw error;
  }
} 