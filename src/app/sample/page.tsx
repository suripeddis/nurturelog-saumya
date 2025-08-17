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
      summary: "The session between the practitioner and Reed involved using a letterboard to facilitate communication, focusing on the topic of aliens and the concept of a paradox. Reed demonstrated strong conceptual understanding and reasoning abilities while navigating some anxiety around new tasks. The discussion centered on the Fermi Paradox - the contradiction between the likelihood of extraterrestrial life and the lack of evidence. Reed engaged thoughtfully with complex philosophical concepts while using comfort phrases to manage anxiety throughout the session.",
      successes: [
        "Spelling and Conceptual Understanding: Reed successfully chose and spelled the topic 'aliens,' exploring the concept of a paradox: 'no evidence' despite the high probability of extraterrestrial life. He spelled out and understood complex ideas like 'most likely aliens but no evidence.'",
        "Expressing Opinions and Reasoning: Reed communicated his thoughts on why he believes there are no aliens, spelling out 'no because there is no evidence,' showing his ability to reason and express his opinion using the board.",
        "Engaging in Hypothetical Scenarios: In response to the idea of alien contact, Reed contributed by expressing that 'I don't think they want to,' indicating his engagement in considering different viewpoints.",
        "Articulating Complex Ideas: He articulated his stance that 'intelligent life may be extremely rare,' providing the rationale 'only we exist' with clear logical reasoning."
      ],
      struggles: [
        "Initial Topic Decision: Reed initially struggled to confirm his chosen topic, moving between 'eggs' and 'aliens' before settling on the latter. The practitioner guided him to verify his choice, suggesting a bit of indecision.",
        "Anxiety and Comfort Words: Throughout the session, Reed intermittently used comfort phrases like 'done,' 'all done,' and 'no,' indicating anxiety or a need for reassurance, especially when tasks required more intention or were new.",
        "Drawing Task: Reed showed reluctance and anxiety when asked to draw an alien, repeatedly saying 'no' and refusing to draw, perhaps due to discomfort with the demand or a lack of confidence in the task.",
        "Task Transitions: Reed demonstrated ongoing struggle with tasks outside his comfort zone, particularly when moving from discussion to hands-on activities."
      ],
      topicsDiscussed: [
        "The session primarily revolved around discussing aliens and the Fermi Paradox, which relates to the contradiction between the likelihood of extraterrestrial life and the lack of evidence.",
        "Reed and the practitioner explored explanations for why humans have not encountered alien life, considering possibilities such as \"we are alone,\" \"aliens are hiding,\" and \"we are in a zoo.\"",
        "Reed shared his belief that intelligent life is rare, emphasizing that \"only we exist\" and expressing skepticism about alien visibility or contact.",
        "The practitioner encouraged Reed to explore hypothetical scenarios, such as the potential appearance of aliens and reasons for contacting Earth.",
        "The session also touched briefly on Reed's anxiety, revealing that it could stem from engaging in new or purposeful tasks requiring intention.",
        "The practitioner closed the session with an activity, inviting Reed to draw an alien, which Reed resisted, pointing to an ongoing struggle with tasks outside his comfort zone."
      ],
      transcript: `<date>; <practitioner initials>; <client initials>; <topic>

      - [QUESTION] Do you want to talk directly about aliens or Area 51?
      - [QUESTION] What topic do you want to choose?
      - [CLIENT] (ACTION: CHOOSES EGGS)
      - [TEACH] Area 51 is like a top-secret place. You can talk about theories about aliens or eggs.
      - [QUESTION] Do you need to talk about the food you want to eat when you're done?
      - [CLIENT] YES I DO
      - [QUESTION] Are you sure you don't want to talk about aliens?
      - [CLIENT] ALIENS BE FINE
      - [TEACH] Let's talk about the word "Paradox." A paradox is something that looks like they contradict each other.
      - [TEACH] A paradox has to do with contradictory statements about an alien.
      - [QUESTION] Do you want to keep going with this lesson or switch to the other topic?
      - [CLIENT] (ACTION: CHOOSES TO CONTINUE WITH ALIENS)
      - [TEACH] This is the contradiction between the high probability of extraterrestrial life and the lack of evidence.
      - [QUESTION] What's the Paradox?
      - [CLIENT] MOST LIKELY ALIENS BUT NO EVIDENCE
      - [TEACH] It's very unlikely that there aren't aliens, but we have no proof of it.
      
      <date>; <practitioner initials>; <client initials>; Discussion on Aliens and the Fermi Paradox
      
      - [TEACH] Most likely aliens exist, but we have no proof, making it a question.
      - [QUESTION] Do you think there are aliens or life outside of Earth?
      - [CLIENT] NO BECAUSE THERE IS NO EVIDENCE
      - [TEACH] The universe is vast with billions of galaxies, each with billions of stars.
      - [QUESTION] How many galaxies are out there?
      - [CLIENT] BILLIONS
      - [TEACH] Our Milky Way galaxy is spiral-shaped.
      - [QUESTION] If intelligent life is common, why haven't they found us?
      - [CLIENT] THEY SHOULD FIND US
      - [TEACH] Despite potential for life, we have no confirmed contact from alien civilizations.
      - [COACH] Take a deep breath and keep at it; you're doing great.
      
      <date>; <practitioner initials>; <client initials>; Discussion on Intelligent Life
      
      - [TEACH] Intelligent life may be extremely rare.
      - [QUESTION] Intelligent life could be rare. What do you think is the most common reason: we are alone, or aliens are hiding?
      - [CLIENT] WE ARE ALONE.
      - [QUESTION] Why would you say that? Give a reason.
      - [CLIENT] HARD TO COME BY. ONLY WE EXIST.
      - [TEACH] Looking at the Sun, only we exist on the planets we know. Maybe it's really hard to come by.
      - [QUESTION] What evidence would show that aliens are rare?
      - [CLIENT] WE ARE ALONE.
      - [COACH] Notice how he's plotting along just fine, but speeds up impulsively. I'll stop if I see a change in speed that doesn't make sense.
      
      <date>; <practitioner initials>; <client initials>; <topic>
      
      - [TEACH] Notice how he's plotting along fine, then speeds up due to an impulse.
      - [QUESTION] Do you think we are going to self-destruct before we achieve interstellar travel?
      - [CLIENT] Y AND N AND O
      - [QUESTION] Do you think we're part of a zoo the aliens watch?
      - [CLIENT] NOT TRUE
      - [QUESTION] Do you think he deserves a reward for his thinking skills about aliens?
      - [CLIENT] NO
      - [QUESTION] If there are aliens, do you think they would look different from Earth forms?
      - [CLIENT] DIFFERENT
      - [QUESTION] Do you have other comments on this?
      - [CLIENT] NOT DEBATING GOD'S EXISTENCE
      - [TEACH] We've explored only a tiny fraction of the universe. We've mapped nearly all of Earth's surface, sent humans to the Moon, and probes to every planet. Humans haven't gone beyond the Moon.
      
      <date>; <practitioner initials>; <client initials>; Space Exploration
      
      - [TEACH] We've explored only a tiny fraction of the Universe. We've mapped nearly all of Earth's surface, sent humans to the Moon, and probes to every planet. Humans haven't gone beyond the Moon. 
      - [QUESTION] Can you imagine traveling 93 billion light years at the speed of light?
      - [CLIENT] NOT POSSIBLE TO DO.
      
      <date>; <practitioner initials>; <client initials>; Language and Expression
      
      - [TEACH] Let's use "done" and "alien" in a sentence.
      - [CLIENT] DONE ALL DONE. I AM FINISHED LIVING IN SPACE.
      
      <date>; <practitioner initials>; <client initials>; Emotional Expression
      
      - [TEACH] Remember, overcoming fear requires action. Your words are comforting, but you're working hard and engaging with the session.
      - [QUESTION] Did I get it right?
      - [CLIENT] AGREED.
      
      <date>; <practitioner initials>; <client initials>; Creative Exercise
      
      - [TEACH] Let's draw our own version of an alien.
      - [CLIENT] DECAYING FACE. NO NO NO NO NO.
      - [COACH] Keep going, good, excellent.
      
      <date>; <practitioner initials>; <client initials>; Alien Drawing and Anxiety
      
      - [TEACH] You can draw your alien differently than me. Maybe add some decay or a skinny body.
      - [COACH] I know you're anxious, but keep going. You're doing great.
      - [QUESTION] How was your alien drawing experience?
      - [CLIENT] (ACTION: Drawing completed)
      - [TEACH] We're building sensory tolerance for drawing and confidence when feeling anxious.
      - [QUESTION] What was different than what your dad said?
      - [CLIENT] I DON'T NEED TO BE CONSOLED. I JUST AM ANXIOUS FOR NO REASON.
      - [TEACH] It's good you're recognizing your anxiety without a clear reason. It might be triggered by new, purposeful tasks.
      - [QUESTION] If aliens did contact us, what would be the point of contacting us?
      - [CLIENT] I DON'T THINK...
      
      <date>; <practitioner initials>; <client initials>; Aliens and Exploration
      
      - [QUESTION] If aliens did contact us, what would be the point of contacting us?
      - [CLIENT] I DON'T THINK THEY WANT TO.
      - [QUESTION] Do you want to go into more detail on that?
      - [CLIENT] NO.
      
      <date>; <practitioner initials>; <client initials>; Teaching and Coaching Options
      
      - [TEACH] Some civilizations in the past didn't think about topics like women's rights; they were focused on survival.
      - [TEACH] We can try different teaching methods: work with him this evening and show me a clip, or work in front of me.
      - [TEACH] I can teach the lesson while you get the answers, and I coach you.
      - [CLIENT] (ACTION: Nods in agreement)`,
      
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 font-semibold whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Save as PDF
            </button>
            <Link href="/upload">
              <button
                onClick={() => analytics.trackLandingPageButton('Try SessionClarity - Sample Page')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 font-semibold whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Try SessionClarity
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
                SessionClarity
              </h1>
              <a
                href="https://sessionclarity.com"
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
                sessionclarity.com
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
              Session Analysis Report (Sample)
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
{/* Transcript Section */}
<div
  style={{
    marginTop: '32px',
    padding: '24px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
  }}
>
  <h2
    style={{
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#111827',
    }}
  >
    Transcript (Sample)
  </h2>
  <pre
  style={{
    whiteSpace: 'pre-wrap',
    lineHeight: 2,   // double spaced
    color: '#374151',
    fontSize: '14px',
    margin: 0,
    fontFamily: 'monospace',
  }}
>
  {sampleResults.analysis.transcript}
</pre>
</div>  
        </div>
      </div>
    </main>
  )
} 