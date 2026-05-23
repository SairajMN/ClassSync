'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ShieldCheck, Bell, ArrowRight, Layers, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router, supabase]);

  const features = [
    { icon: Calendar, title: 'Smart Scheduling', desc: 'Drag-and-drop calendar with real-time availability, 15-min increments, and instant conflict detection.' },
    { icon: ShieldCheck, title: 'Auto-Approval Engine', desc: 'Teachers and admins get instant auto-approval. Student bookings route to admin for review with one-click approve/reject.' },
    { icon: Bell, title: 'Live Notifications', desc: 'Real-time push alerts via Supabase WebSockets with Sonner toasts when bookings are approved or conflicts arise.' },
    { icon: Layers, title: 'Resource Management', desc: 'Track projectors, smart boards, microphones, and lab equipment with live inventory allocation across bookings.' },
    { icon: Cpu, title: '3D Immersive UI', desc: 'Premium glassmorphism with Framer Motion 3D card tilts, elastic modals, floating orbs, and dark gradient ambiance.' },
    { icon: Sparkles, title: 'Analytics Dashboard', desc: 'Recharts-powered utilization metrics, peak hours analysis, and resource popularity insights for administrators.' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Background Glow Orbs */}
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[120px] animate-float-delayed pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="font-display text-xl font-extrabold text-white">C</span>
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">ClassSync</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/20 hover:text-white transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-32">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-500/20 px-4 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">v1.0 — Smart Campus Scheduling</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            Intelligent Room &{' '}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Resource Orchestration
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base text-slate-400 leading-relaxed"
          >
            A modern institutional scheduling platform designed for colleges and schools to manage classrooms, labs,
            seminar halls, and shared educational resources. Real-time bookings, automatic conflict prevention,
            and flexible approval workflows — all wrapped in a state-of-the-art 3D glassmorphism experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-6 border-violet-500/10 hover:border-violet-500/20 transition-all duration-300 hover:translate-y-[-2px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-4">
                <feature.icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="font-display font-bold text-white text-base mb-2">{feature.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="mt-32 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
            © {new Date().getFullYear()} ClassSync — Built with Next.js, Supabase & Framer Motion
          </p>
        </footer>
      </main>
    </div>
  );
}