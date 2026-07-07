'use client';

import { useEffect, useCallback, useMemo, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sparkles, Calendar, ShieldCheck, Bell, ArrowRight, Layers, Cpu } from 'lucide-react';
import Link from 'next/link';

/* ── Floating Particles Background ─────────────────────────────── */
function ParticlesBackground({ count = 30 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.1,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-500/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── 3D Tilt Card Wrapper ──────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
      const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
      x.set(relativeX);
      y.set(relativeY);
    },
    [x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: 'preserve-3d' }}
      className={`perspective-1000 ${className}`}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

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
      {/* Particles Background */}
      <ParticlesBackground count={40} />

      {/* Background Glow Orbs */}
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[120px] animate-float-delayed pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="font-display text-xl font-extrabold text-white">C</span>
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">ClassSync</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/login"
            className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/20 hover:text-white transition-all"
          >
            Sign In
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-32">
        <TiltCard>
          <div className="text-center space-y-8" style={{ transform: 'translateZ(40px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-500/20 px-4 py-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse-ring" />
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
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </TiltCard>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <div className="group glass-panel rounded-2xl p-6 border-violet-500/10 hover:border-violet-500/20 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-4 group-hover:border-violet-500/40 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all">
                  <feature.icon className="h-5 w-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                </div>
                <h3 className="font-display font-bold text-white text-base mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-24 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-6 w-[1px] bg-gradient-to-b from-violet-500/60 to-transparent"
          />
        </motion.div>

        {/* Footer */}
        <footer className="mt-24 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
            © {new Date().getFullYear()} ClassSync — Built with Next.js, Supabase & Framer Motion
          </p>
        </footer>
      </main>
    </div>
  );
}