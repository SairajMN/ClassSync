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
  GraduationCap,
  Eye,
  EyeOff
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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | null>(null);

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
    setSelectedRole(role);
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

  const roleConfig = {
    admin: { icon: Shield, label: 'Admin', color: 'amber', accent: 'from-amber-600 to-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10', textColor: 'text-amber-400' },
    teacher: { icon: GraduationCap, label: 'Teacher', color: 'indigo', accent: 'from-indigo-600 to-indigo-500', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', textColor: 'text-indigo-400' },
    student: { icon: User, label: 'Student', color: 'emerald', accent: 'from-emerald-600 to-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Dynamic Background Neon Blobs */}
      <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[80px] animate-float pointer-events-none"></div>
      <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-indigo-600/10 blur-[80px] animate-float-delayed pointer-events-none"></div>

      {/* Role Ambience Glow */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
            selectedRole === 'admin' ? 'bg-amber-500/[0.03]' :
            selectedRole === 'teacher' ? 'bg-indigo-500/[0.03]' :
            'bg-emerald-500/[0.03]'
          }`}
        />
      )}

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
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
            {(['admin', 'teacher', 'student'] as const).map((role) => {
              const config = roleConfig[role];
              const isActive = selectedRole === role;
              const Icon = config.icon;

              return (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all group ${
                    isActive
                      ? `${config.bg} ${config.border} shadow-lg`
                      : 'bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5'
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1 transition-all ${
                    isActive ? config.textColor : 'text-slate-400 group-hover:text-violet-300'
                  }`} />
                  <span className={`text-[10px] font-bold ${
                    isActive ? config.textColor : 'text-slate-300'
                  }`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
