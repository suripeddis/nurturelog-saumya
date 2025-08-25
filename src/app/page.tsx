'use client';

import Image from "next/image";
import Link from "next/link";
import { analytics } from '@/lib/mixpanel';
import { useSession, useUser, useDescope } from '@descope/nextjs-sdk/client';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Presentation,
  Zap,
  Users as LucideUsers,
  BarChart2,
  Layers,
  Eye,
  Clock,
  Megaphone,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();
  const sdk = useDescope();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    sdk.logout();
  }, [sdk]);

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated && user?.userId) {
      console.log("LOGIN TRACK firing", { userId: user.userId, email: user.email });
      analytics.trackUserLoggedIn({
        id: user.userId,
        // depending on your setup this might be a string or nested—use optional chaining:
        email: (user as any)?.email ?? (user as any)?.emails?.[0],
      });
    }
  }, [isSessionLoading, isAuthenticated, user]);

  return (
    <main className="font-sans text-gray-800">
      {/* App Header */}
      <header className="bg-white shadow px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">SessionClarity</h1>
          {!isSessionLoading && (
            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  <Link href="/upload">
                    <button
                      onClick={() => analytics.trackLandingPageButton('Go to App')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      Go to App
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/sign-in">
                  <button className="text-sm text-green-600 hover:text-green-700 transition-colors">
                    Login
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-green-50 py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Skip the paperwork. Keep the progress.</h1>
        <p className="text-lg max-w-xl mx-auto mb-6">
          Whether you're a parent or a practitioner, SessionClarity writes the report so you don't have to. Upload your letterboard session—get instant summaries, strengths, and next steps.
        </p>
        <div className="flex justify-center gap-4">
        <Link href="/getStarted">
          <button
            onClick={() => analytics.trackLandingPageButton('Sign Up for Early Access - Hero')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Sign Up for Early Access
          </button>
        </Link>
          {/*}
          <Link href="/upload">
            <button
              onClick={() => analytics.trackLandingPageButton('Upload a Session - Hero')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Upload a Session
            </button>
          </Link>
          */}
          <Link href="/sample">
            <button
              onClick={() => analytics.trackLandingPageButton('See Sample Report - Hero')}
              className="border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold"
            >
              See Sample Report
            </button>
          </Link>
      </div>
        <p className="mt-4 text-sm text-gray-600">Supports real-world, imperfect recordings—no need for clean audio, video, or perfect structure.</p>
      </section>

 {/* Early Access (moved up) */}
 <motion.section
  className="bg-blue-50 py-6 px-4"
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  <div className="mx-auto max-w-2xl text-center">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-green-700 tracking-tight">
      Sign Up for Early&nbsp;Access
    </h2>

    <ul className="mt-4 text-lg mx-auto w-fit space-y-2">
  <li className="grid grid-cols-[1.5rem_auto] items-center gap-3">
    <span className="h-6 w-6 text-center leading-6">✅</span>
    <span className="text-left">Upload your first video</span>
  </li>
  <li className="grid grid-cols-[1.5rem_auto] items-center gap-3">
    <span className="h-6 w-6 text-center leading-6">✅</span>
    <span className="text-left">Get your session summary</span>
  </li>
  <li className="grid grid-cols-[1.5rem_auto] items-center gap-3">
    <span className="h-6 w-6 text-center leading-6">✅</span>
    <span className="text-left">See the power of clear insight</span>
  </li>
</ul>

    <div className="mt-6">
      <Link href="/getStarted">
        <button
          onClick={() =>
            analytics.trackLandingPageButton('Early Access CTA - Footer')
          }
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-md shadow-green-600/30 hover:bg-green-700 hover:shadow-lg transition-all duration-200"
        >
          Sign Up for Early Access
        </button>
      </Link>
    </div>
  </div>
</motion.section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-green-50 text-center">
  <h2 className="text-3xl font-bold mb-12">From session to summary in a few minutes</h2>
  <div className="flex flex-col md:flex-row justify-center gap-12 max-w-4xl mx-auto">
    <div>
      <span className="text-4xl">🎥</span>
      <h3 className="text-xl font-semibold mt-2">Upload audio or video</h3>
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
      {/* Here’s What You Get */}
      <motion.section
  className="py-16 px-6 bg-slate-50 text-center"
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold mb-6">🔍 What You’ll Unlock</h2>
    <div className="grid gap-6 md:grid-cols-2 justify-items-center">
      <div className="flex items-start gap-4">
        <Presentation className="w-6 h-6 text-green-600 mt-1" />
        <span className="text-lg">Session Summary</span>
      </div>
      <div className="flex items-start gap-4">
        <Zap className="w-6 h-6 text-green-600 mt-1" />
        <span className="text-lg">Strengths &amp; Challenges</span>
      </div>
      <div className="flex items-start gap-4">
        <LucideUsers className="w-6 h-6 text-green-600 mt-1" />
        <span className="text-lg">Communication Patterns</span>
      </div>
      <div className="flex items-start gap-4">
        <BarChart2 className="w-6 h-6 text-green-600 mt-1" />
        <span className="text-lg">Visuals &amp; Trends (coming soon)</span>
      </div>
    </div>
  </div>
</motion.section>

      {/* Built for... */}
      <motion.section
        className="py-16 px-6 bg-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">👥 Made for the Team Around the Learner</h2>
          <div className="grid gap-6 md:grid-cols-3 text-lg">
            <div className="flex items-start gap-4">
              <LucideUsers className="w-6 h-6 text-green-600 mt-1" />
              <p className="text-gray-700">Parents documenting growth and communication for IEPs, schools, and families.</p>
            </div>
            <div className="flex items-start gap-4">
              <ClipboardList className="w-6 h-6 text-green-600 mt-1" />
              <p className="text-gray-700">practitioners saving time on notes while giving families deeper insights.</p>
            </div>
            <div className="flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-green-600 mt-1" />
              <p className="text-gray-700">Educators &amp; Therapists tracking progress and advocating effectively.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Why You’ll Care */}
      <motion.section
        className="py-16 px-6 bg-green-50"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">💡 Why It Matters</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <Eye className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Clarity</h3>
                <p className="text-gray-700">Understand what happened in a session—without rewatching video.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Time-Saving</h3>
                <p className="text-gray-700">Automate note-taking so you can focus on the next task.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Megaphone className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Advocacy Tool</h3>
                <p className="text-gray-700">Share meaningful progress—rooted in the presumption of potential—with schools, IEP teams, and therapists.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <LucideUsers className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Aligned</h3>
                <p className="text-gray-700">Built for both parents &amp; practitioners doing the work.</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            {/*}
            <Link href="/upload">
              <button
                onClick={() => analytics.trackLandingPageButton('Get Started - Why Section')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Get Started
              </button>
            </Link>
            */}
          </div>
        </div>
      </motion.section>

      {/* About Section */}
      <section className="bg-gray-50 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Meet the team</h2>
        <p className="max-w-2xl mx-auto text-lg mb-12 text-gray-600">
          Built by families of non-speaking learners. Informed by practitioners.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-12 max-w-4xl mx-auto">
          {/* Arti */}
          <div className="flex flex-col items-center max-w-xs">
            <div className="w-32 h-32 overflow-hidden mb-4 rounded-lg">
              <Image
                src="/artiPicture.png"
                alt="Arti"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Arti Bhatia</h3>
            <p className="text-gray-600 text-center">Arti is a parent of a non-speaking college student who began using a letterboard at 17—an experience that led her to pivot into autism innovation. She previously held leadership roles in product strategy, business development, and sales at Microsoft, AWS, and Dell. Today, she works with trusted family and practitioner networks in the autism community throughout the world.</p>
          </div>

          {/* Faraz */}
          <div className="flex flex-col items-center max-w-xs">
            <div className="w-32 h-32 overflow-hidden mb-4 rounded-lg">
              <Image
                src="/farazPicture.jpg"
                alt="Faraz"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Faraz Abidi</h3>
            <p className="text-gray-600 text-center">Faraz is an AI engineer whose work in autism began while living with his autistic cousin and attending therapy sessions. He's since created award-winning assistive tools. Previously, he was the founding engineer and  Director of Software at SprintRay, one of the world's top 3d printing companies.</p>

          </div>

          {/* Dan */}
          <div className="flex flex-col items-center max-w-xs">
            <div className="w-32 h-32 overflow-hidden mb-4 rounded-lg">
              <Image
                src="/danPicture.jpg"
                alt="Dan"
                width={128}
                height={128}
                quality={100}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dan Feshbach</h3>
            <p className="text-gray-600 text-center">Dan is a veteran autism advocate and entrepreneur, inspired by his 31-year-old autistic son who is a limited speaker. He previously co-founded TeachTown (serving 120,000+ students), launched the Multiple autism tech accelerator, and helped organize the Autism Impact Fund.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
