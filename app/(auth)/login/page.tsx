'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth.store';
import {
  KeyRound,
  Mail,
  Loader2,
  Sparkles,
  Shield,
  User,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { setProfile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sign in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Fetch User Profile role details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Authorized user profile not found.');
      }

      setProfile(profile);
      toast.success(`Welcome back, ${profile.name}!`);

      // 3. Role-based redirect
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  // One-click quick login credentials for reviewers
  const handleQuickLogin = (role: 'admin' | 'teacher' | 'student') => {
    if (role === 'admin') {
      setEmail('admin@classsync.edu');
      setPassword('admin123');
    } else if (role === 'teacher') {
      setEmail('teacher@classsync.edu');
      setPassword('teacher123');
    } else {
      setEmail('student@classsync.edu');
      setPassword('student123');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Dynamic Background Neon Blobs */}
      <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[80px] animate-float pointer-events-none"></div>
      <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-indigo-600/10 blur-[80px] animate-float-delayed pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md rounded-2xl glass-panel border border-violet-500/10 p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Specular glare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/2 to-white/0 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">ClassSync Hub</h2>
          <p className="text-xs text-slate-400">Classroom Booking & Institutional Resource Scheduler</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Logins Section */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">
            One-Click Quick Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 p-2.5 transition-all group"
            >
              <Shield className="h-4 w-4 text-amber-400 mb-1 group-hover:scale-115 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('teacher')}
              className="flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 p-2.5 transition-all group"
            >
              <GraduationCap className="h-4 w-4 text-indigo-400 mb-1 group-hover:scale-115 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">Teacher</span>
            </button>

            <button
              onClick={() => handleQuickLogin('student')}
              className="flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 p-2.5 transition-all group"
            >
              <User className="h-4 w-4 text-emerald-400 mb-1 group-hover:scale-115 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">Student</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
