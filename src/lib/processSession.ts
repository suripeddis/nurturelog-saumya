import { redirect } from 'next/navigation';

// Get the server endpoint from environment variables
const getServerEndpoint = () => {
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
};

// Upload file to S3 via our server and return the S3 key
const uploadFileToS3 = async (file: File): Promise<string> => {
  const serverUrl = getServerEndpoint();
  
  // Step 1: Get presigned upload URL from our server
  const uploadUrlResponse = await fetch(
    `${serverUrl}/get-upload-url?filename=${encodeURIComponent(file.name)}`,
    { method: 'GET' }
  );

  if (!uploadUrlResponse.ok) {
    throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`);
  }

  const { uploadUrl, key } = await uploadUrlResponse.json();
  console.log('📤 Got S3 upload URL for key:', key);

  // Step 2: Upload file directly to S3 using presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'audio/mp4',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  console.log('✅ File uploaded to S3 successfully');
  return key;
};

// Get transcription from our server using the S3 key
const getTranscriptionFromServer = async (key: string): Promise<{ text: string; words: any[]; confidence: number }> => {
  const serverUrl = getServerEndpoint();
  
  const transcriptionResponse = await fetch(`${serverUrl}/transcribe-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!transcriptionResponse.ok) {
    const errorText = await transcriptionResponse.text();
    console.error('Server transcription error:', errorText);
    throw new Error(`Transcription failed: ${transcriptionResponse.status} ${transcriptionResponse.statusText}`);
  }

  return await transcriptionResponse.json();
};

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
    // Step 1: Upload to S3 via our server (stage=10)
    onProgress?.({
      stage: 'uploading',
      progress: 10,
      message: 'Uploading file',
    });

    const s3Key = await uploadFileToS3(file);    

    // Step 2: Get transcription from our server (stage=30)
    onProgress?.({
      stage: 'transcribing',
      progress: 30,
      message: 'Transcribing audio…',
    });

    const transcriptionResult = await getTranscriptionFromServer(s3Key);
    const transcript: string = transcriptionResult.text;
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
