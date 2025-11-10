'use client';

import Image from "next/image";
import Link from "next/link";
import { analytics } from '@/lib/mixpanel';
import { useSession, useUser, useDescope } from '@descope/nextjs-sdk/client';
import { useCallback, useEffect, useState } from 'react';
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
  ChevronDown,
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
        email: (user as any)?.email ?? (user as any)?.emails?.[0],
      });
    }
  }, [isSessionLoading, isAuthenticated, user]);

  // --- Team card open-state (independent, multiple can be open) ---
  const [openMap, setOpenMap] = useState<{ [idx: number]: boolean }>({});
  const toggleCard = (idx: number) =>
    setOpenMap(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <main className="font-sans text-gray-800">
      {/* Header (polished glass) */}
      <header className="sticky top-0 z-30 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <span className="text-2xl font-bold text-green-700 tracking-tight">SessionClarity</span>
          {!isSessionLoading && (
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <Link href="/upload">
                    <button
                      onClick={() => analytics.trackLandingPageButton('Go to App')}
                      className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 transition"
                    >
                      Go to App
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-800 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/sign-in">
                  <button className="text-sm font-semibold text-green-700 hover:text-green-800">
                    Login
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero (soft gradient + better buttons) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white px-6 py-20 text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-green-100/50 blur-3xl" />
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-5xl font-extrabold tracking-tight text-gray-900">
          Skip the paperwork. Keep the progress.
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700">
          Whether you're a parent or a practitioner, SessionClarity writes the report so you don't have to. Upload your letterboard session—get instant summaries, strengths, and next steps.
        </p>

        <div className="flex justify-center gap-3">
          <Link href="/getStarted">
            <button
              onClick={() => analytics.trackLandingPageButton('Sign Up for Early Access - Hero')}
              className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white shadow-md shadow-green-600/30 hover:bg-green-700 transition"
            >
              Sign Up for Early Access
            </button>
          </Link>
          <Link href="/sample">
            <button
              onClick={() => analytics.trackLandingPageButton('See Sample Report - Hero')}
              className="rounded-full border border-green-600 px-6 py-3 font-semibold text-green-700 hover:bg-green-50 transition"
            >
              See Sample Report
            </button>
          </Link>
        </div>

        <p className="mt-5 text-sm text-gray-600">
          Supports real-world, imperfect recordings—no need for clean audio, video, or perfect structure.
        </p>
      </section>

      {/* Early Access (light purple bg + green heading) */}
      <motion.section
        className="relative py-20 px-6 bg-purple-50"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="relative max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-semibold text-green-700">
            Sign Up for Early Access
          </h2>

          <ul className="text-lg space-y-2 text-gray-700">
            <li className="flex items-center justify-center gap-2">
              ✅ <span>Upload your first video</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              ✅ <span>Get your session summary</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              ✅ <span>See the power of clear insight</span>
            </li>
          </ul>

          <Link href="/getStarted">
            <button
              onClick={() => analytics.trackLandingPageButton('Early Access CTA - Centered')}
              className="mt-4 rounded-full bg-green-600 px-8 py-4 text-lg font-medium text-white shadow-md hover:bg-green-700 transition-all duration-200"
            >
              Sign Up for Early Access
            </button>
          </Link>
        </div>
      </motion.section>

      {/* How It Works (step cards) */}
      <section className="bg-green-50 px-6 py-20">
        <h2 className="mb-10 text-center text-3xl font-bold">From session to summary in a few minutes</h2>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { emoji: '🎥', title: 'Upload audio or video' },
            { emoji: '🧠', title: 'AI analyzes patterns and cues' },
            { emoji: '📋', title: 'Get a clear report instantly' },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                {s.emoji}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* What You’ll Unlock (feature cards) */}
      <motion.section
        className="bg-slate-50 px-6 py-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold">🔍 What You’ll Unlock</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { Icon: Presentation, label: 'Session Summary' },
              { Icon: Zap, label: 'Strengths & Challenges' },
              { Icon: LucideUsers, label: 'Communication Patterns' },
              { Icon: BarChart2, label: 'Visuals & Trends (coming soon)' },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Icon className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-lg">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Made for the Team */}
      <motion.section
        className="bg-white px-6 py-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-bold">👥 Made for the Team Around the Learner</h2>
        <div className="grid gap-6 md:grid-cols-3 text-lg">
            <div className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <LucideUsers className="mt-1 h-6 w-6 text-green-600" />
              <p className="text-gray-700">Parents documenting growth and communication for IEPs, schools, and families.</p>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <ClipboardList className="mt-1 h-6 w-6 text-green-600" />
              <p className="text-gray-700">Practitioners saving time on notes while giving families deeper insights.</p>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <BookOpen className="mt-1 h-6 w-6 text-green-600" />
              <p className="text-gray-700">Educators &amp; Therapists tracking progress and advocating effectively.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* About (centered with soft blob) */}
      <section id="about" className="relative bg-white py-24 px-6 border-t border-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-[450px] h-[450px] rounded-full bg-green-100/45 blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-semibold text-gray-900">About SessionClarity</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            We’re really excited to have you here. We know how challenging it can be
            to stay present in a letterboard session while also trying to take detailed
            notes. SessionClarity helps parents and practitioners focus on the learner
            — while we handle the paperwork.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Simply upload a session recording. Our system analyzes communication patterns
            and cues, then generates a comprehensive, easy-to-share report that highlights
            strengths, challenges, and meaningful progress.
          </p>
        </div>
      </section>

      {/* Team (click-to-expand cards, multiple open) */}
      <section id="team" className="bg-gray-50 px-6 py-20 text-center">
        <h2 className="mb-3 text-3xl font-bold">Meet the team</h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600">
          Built by families of non-speaking learners. Informed by practitioners.
        </p>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              name: "Arti Bhatia",
              img: "/artiPicture.png",
              blurb:
                "Arti is a parent of a non-speaking college student who began using a letterboard at 17—an experience that led her to pivot into autism innovation. She previously held leadership roles in product strategy, business development, and sales at Microsoft, AWS, and Dell. Today, she works with trusted family and practitioner networks in the autism community throughout the world.",
            },
            {
              name: "Faraz Abidi",
              img: "/farazPicture.jpg",
              blurb:
                "Faraz is an AI engineer whose work in autism began while living with his autistic cousin and attending therapy sessions. He's since created award-winning assistive tools. Previously, he was the founding engineer and Director of Software at SprintRay, one of the world's top 3D printing companies.",
            },
            {
              name: "Dan Feshbach",
              img: "/danPicture.jpg",
              blurb:
                "Dan is a veteran autism advocate and entrepreneur, inspired by his 31-year-old autistic son who is a limited speaker. He previously co-founded TeachTown (serving 120,000+ students), launched the Multiple autism tech accelerator, and helped organize the Autism Impact Fund.",
            },
          ].map((p, idx) => {
            const isOpen = !!openMap[idx];
            return (
              <div
                key={p.name}
                className="mx-auto max-w-sm rounded-2xl border border-black/5 bg-white p-6 text-left shadow-sm"
              >
                <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-xl">
                  <Image
                    src={p.img}
                    alt={p.name}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Clickable name row */}
                <button
                  onClick={() => toggleCard(idx)}
                  aria-expanded={isOpen}
                  className="mb-2 flex w-full items-center justify-center gap-2 text-xl font-semibold text-gray-900 hover:text-green-700 transition"
                >
                  {p.name}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown content (full blurb) */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-gray-600 mt-2">{p.blurb}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}