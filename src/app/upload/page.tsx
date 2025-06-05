'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadPage() {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Handle file upload here
    console.log(acceptedFiles);
    setIsUploading(true);
    // TODO: Implement actual file upload logic
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    }
  });

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement YouTube link processing
    console.log('Processing YouTube link:', youtubeLink);
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Upload Your Session</h1>
        
        {/* YouTube Link Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Or paste a YouTube link</h2>
          <form onSubmit={handleYoutubeSubmit} className="flex gap-4">
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Process
            </button>
          </form>
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
                  <p className="text-lg">Drag and drop your file here, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Supports MP4, MOV, AVI, MP3, WAV, M4A
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="text-center text-gray-600">
            <p>Uploading your file...</p>
            {/* TODO: Add progress indicator */}
          </div>
        )}
      </div>
    </main>
  );
} 