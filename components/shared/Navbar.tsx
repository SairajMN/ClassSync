'use strict';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Info, ShieldAlert } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  // Activate the real-time websocket notification channel
  useRealtimeNotifications();

  const supabase = createClient();
  const { profile } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      markAsRead(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id);

    if (!error) {
      markAllAsRead();
    }
  };

  // Simple custom helper to format dates nicely without date-fns library
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <header className="relative z-30 flex h-16 w-full items-center justify-between px-8 py-4">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">ClassSync Engine</span>
        <h2 className="text-xl font-bold text-white tracking-wide">Campus Scheduler</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Live Synced</span>
        </div>

        {/* Notifications Icon and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white glass-panel-hover"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white ring-2 ring-[#030712] animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-violet-500/20 p-4 shadow-2xl"
              >
                <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-display text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Dismiss all
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                        className={`flex gap-3 rounded-xl p-2.5 transition-all cursor-pointer ${notif.is_read
                            ? 'bg-transparent text-slate-400 hover:bg-white/5'
                            : 'bg-violet-600/10 border border-violet-500/20 text-slate-200 hover:bg-violet-600/20'
                          }`}
                      >
                        <div className="mt-0.5">
                          {notif.type.includes('reject') ? (
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                          ) : notif.type.includes('approve') ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Info className="h-4 w-4 text-violet-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-white">{notif.title}</p>
                          <p className="text-[11px] leading-relaxed text-slate-400 mt-0.5">{notif.message}</p>
                          <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}