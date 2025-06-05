import { redirect } from 'next/navigation';
import { downsampleAudio, AudioProcessingProgress } from './audioProcessor';

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
  stage: 'processing_audio' | 'uploading' | 'transcribing' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export async function processSession(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  try {
    // Step 1: Process audio client-side
    onProgress?.({ stage: 'processing_audio', progress: 5, message: 'Processing audio...' });

    const processedFile = await downsampleAudio(file, (audioProgress) => {
      // Map audio processing progress to overall progress (5-25%)
      const overallProgress = 5 + (audioProgress.progress * 0.2);
      onProgress?.({ 
        stage: 'processing_audio', 
        progress: overallProgress, 
        message: audioProgress.message 
      });
    });

    // Step 2: Start upload
    onProgress?.({ stage: 'uploading', progress: 25, message: 'Uploading processed file...' });

    const formData = new FormData();
    formData.append('file', processedFile);

    // Step 3: Send to Deepgram for transcription
    onProgress?.({ stage: 'transcribing', progress: 40, message: 'Transcribing audio...' });

    const transcriptionResponse = await fetch('/api/deepgram', {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const { text: transcript } = await transcriptionResponse.json();
    console.log('Transcript received:', transcript?.substring(0, 100) + '...');

    // Step 4: Send to ChatGPT for analysis
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

    // Step 5: Complete
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