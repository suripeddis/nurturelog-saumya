'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessing } from '@/contexts/ProcessingContext';

export default function ProcessingPage() {
  const router = useRouter();
  const { progress, results, error, isProcessing } = useProcessing();

  useEffect(() => {
    // If there's no active processing and no results, redirect to upload
    if (!isProcessing && !results && !error) {
      router.push('/upload');
      return;
    }

    // Navigate to results when processing is complete
    if (results) {
      router.push('/results');
    }
  }, [results, router, isProcessing, error]);

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
          {/* Progress Bar Container */}
          <div className="relative">
            {/* Background Track */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-500 to-green-400 opacity-20 animate-gradient-x"></div>
              
              {/* Progress Bar */}
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-in-out relative overflow-hidden"
                style={{ width: `${progress?.progress || 0}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Status Text with Pulse Animation */}
          <div className="relative">
            <p className="text-center text-lg text-gray-600 animate-pulse">
              {progress?.message || 'Initializing...'}
            </p>
          </div>

          {/* Progress Percentage with Count Animation */}
          <p className="text-center text-2xl font-semibold text-green-600">
            <span className="inline-block animate-count-up">
              {progress?.progress || 0}%
            </span>
          </p>
        </div>
      </div>

      {/* Add the animation keyframes to the page */}
      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes count-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-count-up {
          animation: count-up 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
} 