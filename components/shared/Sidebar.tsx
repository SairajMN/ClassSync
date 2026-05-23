'use strict';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Layers,
  LayoutDashboard,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { profile, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out: ' + error.message);
    } else {
      clearAuth();
      toast.success('Successfully logged out.');
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Rooms Explorer', href: '/rooms', icon: Layers },
    { name: 'Scheduler Calendar', href: '/calendar', icon: Calendar },
  ];

  // Admin specific navigation
  const isAdmin = profile?.role === 'admin';
  const adminItems = [
    { name: 'Admin Hub', href: '/admin', icon: Shield },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 p-4 pr-2">
      <div className="glass-panel flex h-full flex-col justify-between rounded-2xl p-6 border-r border-violet-500/10">
        <div>
          {/* Logo Brand Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <span className="font-display text-xl font-extrabold text-white">C</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 blur-[1px]"></div>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white">ClassSync</h1>
              <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Smart Booking</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href} className="relative block">
                  <div
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>

                    {isActive && (
                      <motion.div
                        layoutId="activeSideNav"
                        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-violet-600/15 to-indigo-600/5 border-l-2 border-violet-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="my-4 border-t border-white/5 pt-4">
                  <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-violet-400">Admin Section</p>
                </div>
                {adminItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link key={item.name} href={item.href} className="relative block">
                      <div
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                            ? 'text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                        <span>{item.name}</span>

                        {isActive && (
                          <motion.div
                            layoutId="activeSideNav"
                            className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-amber-600/15 to-violet-600/5 border-l-2 border-amber-500"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* User Block & Logout */}
        <div className="space-y-4">
          {profile && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 relative overflow-hidden">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-[1.5px] shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0f172a] font-display font-semibold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-semibold text-white">{profile.name}</p>
                <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${profile.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : profile.role === 'teacher'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                  {profile.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}