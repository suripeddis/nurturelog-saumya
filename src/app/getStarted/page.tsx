'use client';
import { useState } from 'react';

export default function GetStartedPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        padding: '32px 48px',
        fontFamily: 'Helvetica, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <section
        style={{
          width: '100%',
        }}
      >
        {!submitted ? (
          <>
            <h1
              style={{
                fontSize: 48,
                color: '#0f172a',
                fontWeight: 800,
                marginBottom: 40,
              }}
            >
              Join the Waitlist
            </h1>

            <form
              onSubmit={onSubmit}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 28,
                maxWidth: 800,
              }}
            >
              <label style={{ fontSize: 24, color: '#0f172a' }}>
                Name
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={80}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    height: 48,
                    padding: '0 16px',
                    fontSize: 20,
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 10,
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ fontSize: 24, color: '#0f172a' }}>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="Enter your email"
                  style={{
                    marginTop: 8,
                    width: '100%',
                    height: 48,
                    padding: '0 16px',
                    fontSize: 20,
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 10,
                    outline: 'none',
                  }}
                />
              </label>

              <button
                type="submit"
                style={{
                  marginTop: 8,
                  height: 50,
                  border: 'none',
                  borderRadius: 10,
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Submit
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              paddingTop: 24,
              paddingBottom: 24,
              color: '#0f172a',
              fontSize: '16px',
              lineHeight: 1.8,
              maxWidth: '100%',
            }}
          >
            <h2 style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '22px' }}>
              You’re In. Welcome to SessionClarity!
            </h2>

            <p style={{ margin: '16px 0' }}>
              Thanks for joining the waitlist.<br />
              You’re now part of a community working to bring clarity, data, and dignity to
              letterboard communication.
            </p>

            <h3 style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '18px' }}>While You Wait…</h3>

            <ul style={{ margin: '16px 0 24px 0', paddingLeft: 20 }}>
              <li>✓ Check your inbox — we’ll send early access and updates soon.</li>
              <li>
                ✓ Invite others — share the waitlist with families or practitioners who believe in
                spelling to communicate.
              </li>
              <li>
                ✓ Start imagining — what would it mean to have real-time, data-rich reports on every
                session?
              </li>
              <li>
                ✓ We’ll be reaching out to invite you into our next early access cohort — stay
                tuned.
              </li>
            </ul>

            <p>We’re building this with and for you.</p>
            <p>Built by families and practitioners. Powered by insight.</p>

            <div style={{ marginTop: 32 }}>
              <p
                style={{
                  fontFamily: `'Brush Script MT', 'Dancing Script', cursive`,
                  fontSize: '24px',
                  color: '#16a34a',
                  fontStyle: 'italic',
                  marginBottom: 0,
                }}
              >
                Arti Bhatia
              </p>
              <p style={{ fontSize: '14px', color: '#334155', marginTop: 4 }}>
                <a
                  href="mailto:artipriya@gmail.com"
                  style={{ color: '#16a34a', textDecoration: 'none' }}
                >
                  artipriya@gmail.com
                </a>
                <br />
                425-647-8307
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}