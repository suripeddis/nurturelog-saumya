import { redirect } from 'next/navigation';
import { AudioChunker } from './audioChunker';

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
  chunksProcessed?: number;
  totalChunks?: number;
}

export async function processSession(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  try {
    // Step 1: Initialize
    onProgress?.({ stage: 'uploading', progress: 5, message: 'Preparing file for processing...' });

    // Step 2: Use AudioChunker for smart processing
    const audioChunker = new AudioChunker();
    
    const transcriptionResult = await audioChunker.processLargeAudioFile(file, (chunkProgress) => {
      // Map AudioChunker progress to our ProcessingProgress format
      let mappedProgress: ProcessingProgress;
      
      if (chunkProgress.stage === 'initializing' || chunkProgress.stage === 'splitting') {
        mappedProgress = {
          stage: 'uploading',
          progress: Math.max(5, chunkProgress.progress * 0.3), // Map to 5-30%
          message: chunkProgress.message,
          chunksProcessed: chunkProgress.chunksProcessed,
          totalChunks: chunkProgress.totalChunks
        };
      } else if (chunkProgress.stage === 'transcribing') {
        mappedProgress = {
          stage: 'transcribing',
          progress: 30 + (chunkProgress.progress - 60) * 0.6, // Map 60-90% to 30-48%
          message: chunkProgress.message,
          chunksProcessed: chunkProgress.chunksProcessed,
          totalChunks: chunkProgress.totalChunks
        };
      } else {
        mappedProgress = {
          stage: 'transcribing',
          progress: Math.min(50, 30 + chunkProgress.progress * 0.2),
          message: chunkProgress.message,
          chunksProcessed: chunkProgress.chunksProcessed,
          totalChunks: chunkProgress.totalChunks
        };
      }
      
      onProgress?.(mappedProgress);
    });

    const transcript = transcriptionResult.text;
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