'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessing } from '@/contexts/ProcessingContext';

export default function ProcessingPage() {
  const router = useRouter();
  const { progress, results, error } = useProcessing();

  useEffect(() => {
    // Navigate to results when processing is complete
    if (results) {
      router.push('/results');
    }
  }, [results, router]);

  if (error) {
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-8">Processing Error</h1>
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Processing Your Session</h1>
        
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress?.progress || 0}%` }}
            />
          </div>

          {/* Status Text */}
          <p className="text-center text-lg text-gray-600">
            {progress?.message || 'Initializing...'}
          </p>

          {/* Progress Percentage */}
          <p className="text-center text-2xl font-semibold text-green-600">
            {progress?.progress || 0}%
          </p>
        </div>
      </div>
    </main>
  );
} 