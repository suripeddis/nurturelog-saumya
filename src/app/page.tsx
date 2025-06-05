'use client';

import Image from "next/image";
import Link from "next/link";
import { analytics } from '@/lib/mixpanel';

export default function Home() {
  return (
    <main className="bg-white text-gray-800 font-sans">
      {/* App Header */}
      <header className="bg-white shadow px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">NurtureLog</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-green-50 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Skip the paperwork. Keep the progress.</h1>
        <p className="text-lg max-w-xl mx-auto mb-6">
          Whether you're a parent or a therapist, NurtureLog writes the report so you don't have to. Upload your letterboarding session—get instant summaries, strengths, and next steps.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/upload">
            <button 
              onClick={() => analytics.trackLandingPageButton('Upload a Session - Hero')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Upload a Session
            </button>
          </Link>
          <button 
            onClick={() => analytics.trackLandingPageButton('See Sample Report - Hero')}
            className="border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold"
          >
            See Sample Report
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-600">Supports real-world, imperfect recordings—no need for clean audio or perfect structure.</p>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-12">From session to summary in under a minute</h2>
        <div className="flex flex-col md:flex-row justify-center gap-12 max-w-4xl mx-auto">
          <div>
            <span className="text-4xl">🎥</span>
            <h3 className="text-xl font-semibold mt-2">Upload a video or link</h3>
          </div>
          <div>
            <span className="text-4xl">🧠</span>
            <h3 className="text-xl font-semibold mt-2">AI analyzes patterns and cues</h3>
          </div>
          <div>
            <span className="text-4xl">📋</span>
            <h3 className="text-xl font-semibold mt-2">Get a clear report instantly</h3>
          </div>
        </div>
      </section>

      {/* Therapist Section */}
      <section className="bg-gray-100 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">No more late-night notes.</h2>
        <p className="max-w-2xl mx-auto text-lg">
          You already did the hard part—running the session. Let NurtureLog handle the write-up so you can move on to the next family, client, or moment of rest.
        </p>
      </section>

      {/* Parent Section */}
      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Understand what happened—without rewatching.</h2>
        <p className="max-w-2xl mx-auto text-lg">
          Sessions can be messy. You're not sure if they were focused, tuned out, or progressing. NurtureLog gives you clarity—what worked, what didn't, and what's next.
        </p>
      </section>

      {/* Time-Saving Quote */}
      <section className="bg-green-100 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">15+ minutes saved per session. That adds up.</h2>
        <blockquote className="italic text-lg max-w-xl mx-auto text-gray-700">
          "I used to spend my evenings trying to summarize sessions. Now it's just… done."<br />
          <span className="text-sm font-semibold block mt-2">— Early Access Therapist</span>
        </blockquote>
      </section>

      {/* Real-World Section */}
      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Real progress doesn't need perfect recordings.</h2>
        <p className="max-w-2xl mx-auto text-lg">
          NurtureLog is built for: background noise, mid-session breaks, unscripted moments, and unfiltered joy and frustration. Upload what you have—we'll make sense of it.
        </p>
      </section>

      {/* Final CTA */}
      <section className="bg-green-600 text-white py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Get clarity without the burnout.</h2>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => analytics.trackLandingPageButton('Try NurtureLog Free - Footer')}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold"
          >
            Try NurtureLog Free
          </button>
          <button 
            onClick={() => analytics.trackLandingPageButton('See a Demo Report - Footer')}
            className="border border-white px-6 py-3 rounded-lg font-semibold"
          >
            See a Demo Report
          </button>
        </div>
      </section>
    </main>
  );
}
