'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Initialize ffmpeg with CDN URLs
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export interface AudioProcessingProgress {
  stage: 'initializing' | 'processing' | 'complete';
  progress: number;
  message: string;
}

export async function downsampleAudio(
  file: File,
  onProgress?: (progress: AudioProcessingProgress) => void
): Promise<File> {
  try {
    onProgress?.({ stage: 'initializing', progress: 10, message: 'Initializing audio processor...' });

    // Initialize ffmpeg
    const ffmpegInstance = await initFFmpeg();

    onProgress?.({ stage: 'processing', progress: 30, message: 'Processing audio...' });

    // Get file extension
    const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFileName = `input.${originalExtension}`;
    const outputFileName = 'output.m4a';

    // Write input file to ffmpeg filesystem
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    onProgress?.({ stage: 'processing', progress: 50, message: 'Resampling audio...' });

    // Run ffmpeg command equivalent to:
    // ffmpeg -i input -vn -ac 1 -ar 16000 -c:a aac -b:a 48k -y output.m4a
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-vn',           // No video
      '-ac', '1',      // Mono audio (1 channel)
      '-ar', '16000',  // Sample rate 16kHz
      '-c:a', 'aac',   // AAC codec
      '-b:a', '48k',   // Audio bitrate 48k
      '-y',            // Overwrite output
      outputFileName
    ]);

    onProgress?.({ stage: 'processing', progress: 80, message: 'Finalizing...' });

    // Read the output file
    const outputData = await ffmpegInstance.readFile(outputFileName);
    
    // Clean up files from ffmpeg filesystem
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);

    onProgress?.({ stage: 'complete', progress: 100, message: 'Audio processing complete!' });

    // Create new File object with processed audio
    const processedBlob = new Blob([outputData], { type: 'audio/m4a' });
    const processedFile = new File(
      [processedBlob], 
      file.name.replace(/\.[^/.]+$/, '-processed.m4a'),
      { type: 'audio/m4a' }
    );

    return processedFile;

  } catch (error) {
    console.error('Audio processing error:', error);
    throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 