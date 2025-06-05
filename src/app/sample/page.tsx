'use client'

import { usePDF } from 'react-to-pdf'
import { analytics } from '@/lib/mixpanel'
import Link from 'next/link'

export default function SamplePage() {
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
    filename: `sample-session-analysis-${now.toISOString().split('T')[0]}.pdf`,
    page: {
      margin: 20,
      format: 'a4',
    },
  })

  // Sample hardcoded data
  const sampleResults = {
    analysis: {
      summary: "The session between the therapist and Reed involved using a spelling board to facilitate communication, focusing on the topic of aliens and the concept of a paradox. Reed demonstrated strong conceptual understanding and reasoning abilities while navigating some anxiety around new tasks. The discussion centered on the Fermi Paradox - the contradiction between the likelihood of extraterrestrial life and the lack of evidence. Reed engaged thoughtfully with complex philosophical concepts while using comfort phrases to manage anxiety throughout the session.",
      successes: [
        "Spelling and Conceptual Understanding: Reed successfully chose and spelled the topic 'aliens,' exploring the concept of a paradox: 'no evidence' despite the high probability of extraterrestrial life. He spelled out and understood complex ideas like 'most likely aliens but no evidence.'",
        "Expressing Opinions and Reasoning: Reed communicated his thoughts on why he believes there are no aliens, spelling out 'no because there is no evidence,' showing his ability to reason and express his opinion using the board.",
        "Engaging in Hypothetical Scenarios: In response to the idea of alien contact, Reed contributed by expressing that 'I don't think they want to,' indicating his engagement in considering different viewpoints.",
        "Articulating Complex Ideas: He articulated his stance that 'intelligent life may be extremely rare,' providing the rationale 'only we exist' with clear logical reasoning."
      ],
      struggles: [
        "Initial Topic Decision: Reed initially struggled to confirm his chosen topic, moving between 'eggs' and 'aliens' before settling on the latter. The therapist guided him to verify his choice, suggesting a bit of indecision.",
        "Anxiety and Comfort Words: Throughout the session, Reed intermittently used comfort phrases like 'done,' 'all done,' and 'no,' indicating anxiety or a need for reassurance, especially when tasks required more intention or were new.",
        "Drawing Task: Reed showed reluctance and anxiety when asked to draw an alien, repeatedly saying 'no' and refusing to draw, perhaps due to discomfort with the demand or a lack of confidence in the task.",
        "Task Transitions: Reed demonstrated ongoing struggle with tasks outside his comfort zone, particularly when moving from discussion to hands-on activities."
      ],
      topicsDiscussed: [
        "Aliens and extraterrestrial life",
        "Fermi Paradox",
        "Evidence and probability",
        "Intelligent life rarity",
        "Hypothetical alien contact scenarios",
        "Anxiety management strategies",
        "Drawing and creative expression",
        "Opinion formation and reasoning"
      ]
    },
    
  }

  const handleSavePDF = () => {
    const analysisData = {
      successesCount: sampleResults.analysis.successes.length,
      strugglesCount: sampleResults.analysis.struggles.length,
      topicsCount: sampleResults.analysis.topicsDiscussed.length,
    }
    
    
    
    // small delay so html2canvas doesn't capture before painting
    setTimeout(() => {
      toPDF()
    }, 100)
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">Sample Session Analysis</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSavePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Save as PDF
            </button>
            <Link href="/upload">
              <button
                onClick={() => analytics.trackLandingPageButton('Try NurtureLog - Sample Page')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Try NurtureLog
              </button>
            </Link>
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
              Therapy Session Analysis Report (Sample)
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
              {sampleResults.analysis.summary}
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
                {sampleResults.analysis.successes.map((success, index) => (
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
                {sampleResults.analysis.struggles.map((struggle, index) => (
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
              marginBottom: "32px",
              padding: "24px",
              borderRadius: "8px",
              backgroundColor: "#faf5ff",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#7c2d12",
              }}
            >
              Topics Discussed
            </h2>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {sampleResults.analysis.topicsDiscussed.map((topic, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      color: '#7c2d12',
                      fontWeight: 500,
                      marginRight: '8px',
                    }}
                  >
                    •
                  </span>
                  <span style={{ color: '#374151', lineHeight: 1.5 }}>
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          </div>        
        </div>
      </div>
    </main>
  )
} 