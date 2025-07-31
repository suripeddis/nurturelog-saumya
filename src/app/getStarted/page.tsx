'use client';
import { useState } from 'react';

export default function GetStartedPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to your API
    setSubmitted(true);
  };

  return (
    <main
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '96px 24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 920,                    // was 720
          background: '#ffffff',
          borderRadius: 20,                 // was 16
          boxShadow: '0 16px 48px rgba(2, 6, 23, 0.10)',
          border: '1px solid #e5e7eb',
          padding: '64px 64px',             // was 48px
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
            display: submitted ? 'none' : 'block',  // 👈 add this
         }}
        >
            Join the Waitlist
        </h1>

        {!submitted ? (
          <form
            onSubmit={onSubmit}
            style={{
              marginTop: 40,                 // was 32
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 28,                       // was 24
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
                pattern="^[A-Za-z][A-Za-z' -]{1,}$"
                title="Use letters, spaces, apostrophes (’), and hyphens only."
                autoComplete="name"

                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 64,                // was 56
                  padding: '0 20px',
                  fontSize: 40,              // was 18
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 14,          // was 12
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
                  height: 64,                // was 56
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
                height: 64,                  // was 56
                border: 'none',
                borderRadius: 14,
                background: '#16a34a',
                color: '#ffffff',
                fontSize: 22,                // was 20
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
          <p
            style={{
              marginTop: 36,
              textAlign: 'center',
              fontSize: 55,
              color: '#16a34a',
              fontWeight: 800,
            }}
          >
            Thank you for sigining up!
          </p>
        )}
      </section>
    </main>
  );
}
