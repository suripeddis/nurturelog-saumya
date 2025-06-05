'use client';

import { useProcessing } from '@/contexts/ProcessingContext';

export default function ResultsPage() {
  const { results, error } = useProcessing();

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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-8">Session Analysis</h1>
        
        <div className="space-y-8">
          {/* Analysis Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="prose max-w-none">
                {results.analysis.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* Transcript Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="prose max-w-none">
                {results.transcript.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
} 