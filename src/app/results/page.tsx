'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProcessing } from '@/contexts/ProcessingContext'
import { usePDF } from 'react-to-pdf'

export default function ResultsPage() {
  const router = useRouter()
  const { results, error, isProcessing, reset } = useProcessing()

  // Precompute date/time strings
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const { toPDF, targetRef } = usePDF({
    filename: `session-analysis-${now.toISOString().split('T')[0]}.pdf`,
    page: {
      margin: 20,
      format: 'a4',
    },
  })

  useEffect(() => {
    if (!isProcessing && !results && !error) {
      router.push('/upload')
    }
  }, [results, router, isProcessing, error])

  if (error) {
    return (
      <main className="min-h-screen bg-white p-8">
        {/* …error UI… */}
      </main>
    )
  }

  if (!results) {
    return (
      <main className="min-h-screen bg-white p-8">
        {/* …no-results UI… */}
      </main>
    )
  }

  const handleNewSession = () => {
    reset()
    router.push('/upload')
  }

  const handleSavePDF = () => {
    // small delay so html2canvas doesn’t capture before painting
    setTimeout(() => {
      toPDF()
    }, 100)
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">Session Analysis</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSavePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {/* …icon SVG… */}
              Save as PDF
            </button>
            <button
              onClick={handleNewSession}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {/* …icon SVG… */}
              New Session
            </button>
          </div>
        </div>

        {/* 👇 PDF CONTENT: WRAP IN A PLAIN WHITE-BACKGROUND DIV 👇 */}
        <div
          ref={targetRef}
          style={{
            backgroundColor: 'white',
            color: 'black',
            fontFamily: 'Arial, sans-serif',
            padding: 0,
            margin: 0,
          }}
        >
          {/* PDF Header */}
          <div
            style={{
              marginBottom: '32px',
              textAlign: 'center',
              borderBottom: '2px solid #16a34a',
              paddingBottom: '24px',
              backgroundColor: 'white',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0,
                  color: '#16a34a',
                }}
              >
                NurtureLog
              </h1>
              <a
                href="https://nurturelog.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  textDecoration: 'none',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                nurturelog.com
              </a>
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                margin: '8px 0',
                color: '#1f2937',
              }}
            >
              Therapy Session Analysis Report
            </h2>

            <p
              style={{
                color: "#374151",
                fontSize: "14px",
                margin: "0 0 24px 0",
              }}
            >
              Generated on {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Session Summary */}
          <div
            style={{
              marginBottom: '32px',
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#166534',
              }}
            >
              Summary
            </h2>
            <p style={{ lineHeight: 1.5, color: '#374151', margin: 0 }}>
              {results.analysis.summary}
            </p>
          </div>

          {/* Successes & Struggles Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '32px',
              marginBottom: '32px',
            }}
          >
            {/* Successes */}
            <div
              style={{
                flex: '1 1 45%',
                padding: '24px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#1e40af',
                }}
              >
                Successes
              </h2>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {results.analysis.successes.map((success, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        color: '#1d4ed8',
                        fontWeight: 500,
                        marginRight: '8px',
                      }}
                    >
                      •
                    </span>
                    <span style={{ color: '#374151', lineHeight: 1.5 }}>
                      {success}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Growth */}
            <div
              style={{
                flex: '1 1 45%',
                padding: '24px',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#92400e',
                }}
              >
                Areas for Growth
              </h2>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {results.analysis.struggles.map((struggle, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        color: '#d97706',
                        fontWeight: 500,
                        marginRight: '8px',
                      }}
                    >
                      •
                    </span>
                    <span style={{ color: '#374151', lineHeight: 1.5 }}>
                      {struggle}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Topics Discussed */}
          <div
            style={{
              marginBottom: '32px',
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#faf5ff',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#7c2d12',
              }}
            >
              Topics Discussed
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {results.analysis.topicsDiscussed.map((topic, index) => (
                <span
                  key={index}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#e9d5ff',
                    color: '#7c2d12',
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Full Transcript */}
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#1f2937',
              }}
            >
              Full Transcript
            </h2>
            <div
              style={{
                fontSize: '12px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#374151',
                fontFamily: 'monospace',
              }}
            >
              {results.transcript}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
