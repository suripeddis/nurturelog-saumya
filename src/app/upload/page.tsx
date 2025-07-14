'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { useProcessing } from '@/contexts/ProcessingContext';
import { analytics } from '@/lib/mixpanel';
import { useSession, useUser } from '@descope/nextjs-sdk/client';

export default function UploadPage() {
  const router = useRouter();
  const { startProcessing } = useProcessing();
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();
  const [youtubeLink, setYoutubeLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setError(null);
      
      // Track file upload
      analytics.trackFileUploaded(file.type, file.size);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    onFileDialogOpen: () => {
      // Track when file dialog is opened via click
      analytics.trackLandingPageButton('File Drop Zone Clicked');
    }
  });

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track YouTube submission
    analytics.trackYouTubeSubmitted(youtubeLink);
    
    // TODO: Implement YouTube link processing
    console.log('Processing YouTube link:', youtubeLink);
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }

    setError(null);
    
    // Track processing started
    analytics.trackProcessingStarted('file');
    
    // Start processing and immediately navigate to processing page
    startProcessing(uploadedFile);
    router.push('/processing');
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Upload Your Session</h1>
        
        <div className="mb-6">
          <a 
            href="https://docs.google.com/document/d/1odqYl0E4FwabOauBt6okP1RBMoKq0xDZasPUVSpAxTQ/edit?tab=t.0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            How to upload your audio or video file
          </a>
        </div>

        {/* Early Access Banner */}
        <div className="text-green-700 bg-green-100 p-4 rounded-lg text-center mb-6 font-semibold">
          Get early access — Cohort 2 waitlist open
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload a file</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              {isDragActive ? (
                <p className="text-lg">Drop the files here...</p>
              ) : (
                <>
                  <p className="text-lg">Drag and Drop from your computer, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Supports MP4, MOV, AVI, MP3, WAV, M4A
                  </p>
                </>
              )}
            </div>
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Selected file: {uploadedFile.name}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              analytics.trackLandingPageButton('Process File');
              handleProcess();
            }}
            disabled={!uploadedFile}
            className={`mt-4 w-full py-3 rounded-lg font-semibold transition-colors
              ${!uploadedFile
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            Process File
          </button>
        </div>
      </div>
    </main>
  );
} 