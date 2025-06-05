import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// 30MB threshold for chunking
const CHUNK_THRESHOLD = 30 * 1024 * 1024; // 30MB
const CHUNK_DURATION = 1200; // 20 minutes per chunk
const BATCH_SIZE = 4; // Process 4 chunks at a time

interface ChunkResult {
  text: string;
  words: any[];
  confidence: number;
}

interface AudioChunkerProgress {
  stage: 'initializing' | 'splitting' | 'transcribing' | 'consolidating' | 'complete';
  progress: number;
  message: string;
  chunksProcessed?: number;
  totalChunks?: number;
}

export class AudioChunker {
  private ffmpeg: FFmpeg;
  private initialized = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async init() {
    if (this.initialized) return;

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    this.ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.initialized = true;
  }

  /**
   * Determines if a file needs to be chunked based on size
   */
  needsChunking(file: File): boolean {
    return file.size > CHUNK_THRESHOLD;
  }

  /**
   * Splits audio file into chunks using ffmpeg
   */
  async splitAudioFile(file: File, onProgress?: (progress: AudioChunkerProgress) => void): Promise<File[]> {
    await this.init();

    onProgress?.({
      stage: 'initializing',
      progress: 5,
      message: 'Initializing audio processing...'
    });

    // Write input file to ffmpeg filesystem
    await this.ffmpeg.writeFile('input', await fetchFile(file));

    onProgress?.({
      stage: 'splitting',
      progress: 20,
      message: 'Analyzing audio file...'
    });

    // Get audio duration
    await this.ffmpeg.exec(['-i', 'input', '-f', 'null', '-']);
    
    // Split into chunks
    onProgress?.({
      stage: 'splitting',
      progress: 40,
      message: 'Splitting audio into chunks...'
    });

    await this.ffmpeg.exec([
      '-i', 'input',
      '-f', 'segment',
      '-segment_time', CHUNK_DURATION.toString(),
      '-c', 'copy',
      'chunk_%03d.mp3'
    ]);

    // Read generated chunks
    const chunks: File[] = [];
    let chunkIndex = 0;

    while (true) {
      try {
        const chunkName = `chunk_${chunkIndex.toString().padStart(3, '0')}.mp3`;
        const data = await this.ffmpeg.readFile(chunkName);
        
        if (data) {
          const blob = new Blob([data], { type: 'audio/mpeg' });
          const chunkFile = new File([blob], chunkName, { type: 'audio/mpeg' });
          chunks.push(chunkFile);
          chunkIndex++;
        } else {
          break;
        }
      } catch (error) {
        // No more chunks
        break;
      }
    }

    onProgress?.({
      stage: 'splitting',
      progress: 60,
      message: `Created ${chunks.length} audio chunks`
    });

    return chunks;
  }

  /**
   * Transcribes a single chunk
   */
  async transcribeChunk(chunk: File): Promise<ChunkResult> {
    const formData = new FormData();
    formData.append('file', chunk);

    const response = await fetch('/api/deepgram', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to transcribe chunk: ${chunk.name}`);
    }

    return await response.json();
  }

  /**
   * Processes chunks in batches of 4
   */
  async processChunksInBatches(
    chunks: File[], 
    onProgress?: (progress: AudioChunkerProgress) => void
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];
    const totalChunks = chunks.length;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      
      onProgress?.({
        stage: 'transcribing',
        progress: 60 + (processedChunks / totalChunks) * 30,
        message: `Transcribing batch ${Math.floor(i / BATCH_SIZE) + 1}...`,
        chunksProcessed: processedChunks,
        totalChunks
      });

      // Process batch in parallel
      const batchPromises = batch.map(chunk => this.transcribeChunk(chunk));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      processedChunks += batch.length;

      onProgress?.({
        stage: 'transcribing',
        progress: 60 + (processedChunks / totalChunks) * 30,
        message: `Processed ${processedChunks}/${totalChunks} chunks`,
        chunksProcessed: processedChunks,
        totalChunks
      });
    }

    return results;
  }

  /**
   * Consolidates multiple transcription results
   */
  consolidateResults(results: ChunkResult[]): ChunkResult {
    const consolidatedText = results.map(r => r.text).join(' ');
    const consolidatedWords = results.flatMap(r => r.words);
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      text: consolidatedText,
      words: consolidatedWords,
      confidence: averageConfidence,
    };
  }

  /**
   * Main method to process large audio files
   */
  async processLargeAudioFile(
    file: File,
    onProgress?: (progress: AudioChunkerProgress) => void
  ): Promise<ChunkResult> {
    try {
      // Check if chunking is needed
      if (!this.needsChunking(file)) {
        onProgress?.({
          stage: 'transcribing',
          progress: 50,
          message: 'File is small enough, processing directly...'
        });

        return await this.transcribeChunk(file);
      }

      // Split the file
      const chunks = await this.splitAudioFile(file, onProgress);

      // Process chunks in batches
      const results = await this.processChunksInBatches(chunks, onProgress);

      // Consolidate results
      onProgress?.({
        stage: 'consolidating',
        progress: 95,
        message: 'Consolidating transcription results...'
      });

      const finalResult = this.consolidateResults(results);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Audio processing complete!'
      });

      return finalResult;
    } catch (error) {
      console.error('Audio chunker error:', error);
      throw error;
    }
  }
} 