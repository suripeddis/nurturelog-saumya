'use client';
import { useState } from 'react';

export default function GetStartedPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form), // assuming form = { name, email }
    });
  
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
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '100%',
          padding: 0,
          flexGrow: 1,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 72,
            lineHeight: 1.15,
            color: '#0f172a',
            textAlign: 'center',
            fontWeight: 800,
            display: submitted ? 'none' : 'block',
          }}
        >
          Join the Waitlist
        </h1>

        {!submitted ? (
          <form
            onSubmit={onSubmit}
            style={{
              marginTop: 40,
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 28,
              maxWidth: 800,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <label style={{ fontSize: 40, color: '#0f172a' }}>
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
                  marginTop: 10,
                  width: '100%',
                  height: 64,
                  padding: '0 20px',
                  fontSize: 40,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 14,
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 6px #dcfce7')}
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              />
            </label>

            <label style={{ fontSize: 40, color: '#0f172a' }}>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                minLength={6}
                maxLength={254}
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                title="Enter a valid email like name@example.com"
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 64,
                  padding: '0 20px',
                  fontSize: 40,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 14,
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 6px #dcfce7')}
                onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              />
            </label>

            <button
              type="submit"
              style={{
                marginTop: 8,
                height: 64,
                border: 'none',
                borderRadius: 14,
                background: '#16a34a',
                color: '#ffffff',
                fontSize: 22,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(22,163,74,0.28)',
                transition: 'background .15s ease, transform .05s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#16a34a')}
            >
              Submit
            </button>
          </form>
        ) : (
          <div
            style={{
              marginTop: 0,
              textAlign: 'center',
              fontSize: '14.5px',
              color: '#0f172a',
              lineHeight: 1.6,
              maxWidth: '100%',
            }}
          >
            <h2 style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '60px', marginTop: 48 }}>
              You’re In. Welcome to SessionClarity!
            </h2>

            <p style={{ marginBottom: 32, fontSize: '27px' }}>
              Thanks for joining the waitlist.<br />
              You’re now part of a community working to bring clarity, data, and dignity to letterboard communication.
            </p>

            <h3 style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '30px', marginBottom: 12 }}>
              While You Wait…
            </h3>

            <ul
              style={{
                paddingLeft: 20,
                marginBottom: 24,
                textAlign: 'left',
                display: 'inline-block',
                fontSize: '25px',
              }}
            >
              <li>✓ Check your inbox — we’ll send early access and updates soon.</li>
              <li>
              ✓ Invite others — share the waitlist with families or practitioners who believe in spelling as a method to communicate. 
              </li>
              <li>
                ✓ Start imagining — what would it mean to have real-time, data-rich reports on
                every session?
              </li>
              <li>
                ✓ We’ll be reaching out to invite you into our next early access cohort — stay
                tuned.
              </li>
            </ul>

            <div>
            <img
              src="/artibhatiasignature.png"
              alt="Handwritten signature of Arti Bhatia"
              style={{
                display: 'block',
                margin: '40px auto 8px',
                height: '200px' // increase this for larger size
              }}
            />
              <p style={{ fontSize: '20px', color: '#334155', marginTop: 4 }}>
                <a
                  href="mailto:arti@multiplehub.org"
                  style={{ color: '#16a34a', textDecoration: 'none' }}
                >
                  arti@multiplehub.org
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