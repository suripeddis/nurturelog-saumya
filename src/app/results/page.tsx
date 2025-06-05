'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessing } from '@/contexts/ProcessingContext';

export default function ResultsPage() {
  const router = useRouter();
  const { results, error, isProcessing } = useProcessing();

  useEffect(() => {
    // If there's no results and no active processing, redirect to upload
    if (!results && !isProcessing && !error) {
      router.push('/upload');
    }
  }, [results, router, isProcessing, error]);

  if (error) {
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-8">Error</h1>
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!results) {
    return (
      <main className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-600 mb-8">No Results</h1>
          <div className="p-4 bg-gray-50 text-gray-600 rounded-lg">
            No results found. Please try processing a session again.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Session Analysis</h1>
        
        <div className="space-y-8">
          {/* Summary Section */}
          <section className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Session Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {results.analysis.summary}
            </p>
          </section>

          {/* Successes and Struggles Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Successes Section */}
            <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎉</span>
                Successes
              </h2>
              {results.analysis.successes.length > 0 ? (
                <ul className="space-y-3">
                  {results.analysis.successes.map((success, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 font-bold mr-2">•</span>
                      <span className="text-gray-700">{success}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No specific successes identified.</p>
              )}
            </section>

            {/* Struggles Section */}
            <section className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <h2 className="text-xl font-semibold text-orange-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">💪</span>
                Areas for Growth
              </h2>
              {results.analysis.struggles.length > 0 ? (
                <ul className="space-y-3">
                  {results.analysis.struggles.map((struggle, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-600 font-bold mr-2">•</span>
                      <span className="text-gray-700">{struggle}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No specific challenges identified.</p>
              )}
            </section>
          </div>

          {/* Topics Discussed Section */}
          <section className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">💭</span>
              Topics Discussed
            </h2>
            {results.analysis.topicsDiscussed.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {results.analysis.topicsDiscussed.map((topic, index) => (
                  <span
                    key={index}
                    className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No specific topics identified.</p>
            )}
          </section>

          {/* Transcript Section */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">📝</span>
              Full Transcript
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <div className="prose max-w-none text-gray-700">
                {results.transcript.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-3 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
} 