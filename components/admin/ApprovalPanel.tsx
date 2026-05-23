'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Booking } from '@/types';
import {
  Check,
  X,
  Clock,
  MapPin,
  Users,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApprovalPanel() {
  const supabase = createClient();
  const [pendings, setPendings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id(id, name, email, role, department),
          rooms:room_id(*),
          booking_resources(
            *,
            resources:resource_id(*)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendings(data as unknown as Booking[]);
    } catch (err: unknown) {
      toast.error('Failed to load pending bookings: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to approve booking');
      }

      toast.success('Booking approved successfully.');
      setPendings((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve booking');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reject booking');
      }

      toast.success('Booking rejected successfully.');
      setPendings((prev) => prev.filter((p) => p.id !== id));
      setSelectedRejectId(null);
      setRejectReason('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject booking');
    }
  };

  if (loading && pendings.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500 animate-pulse" />
          Pending Booking Approvals
        </h2>
        <p className="text-xs text-slate-400 mt-1">Review and process student classroom and resource reservation requests.</p>
      </div>

      {pendings.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 text-center border-violet-500/10">
          <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto opacity-70 mb-3" />
          <h3 className="text-base font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-slate-400 mt-1">There are no pending booking approvals at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {pendings.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel flex flex-col md:flex-row justify-between rounded-xl p-5 border border-white/5 hover:border-violet-500/10 transition-all gap-6"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-base font-bold text-white leading-tight">{b.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-violet-500" />
                        Booked by <span className="font-semibold text-white">{b.profiles?.name}</span> ({b.profiles?.role})
                      </p>
                    </div>
                    <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-400 border border-amber-500/20">
                      Pending Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border-y border-white/5 py-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-400" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Timespan</p>
                        <p className="font-semibold">
                          {new Date(b.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-400" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Physical Room</p>
                        <p className="font-semibold">{b.rooms?.name || 'Classroom'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-400" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Department</p>
                        <p className="font-semibold">{b.profiles?.department || 'General'}</p>
                      </div>
                    </div>
                  </div>

                  {b.description && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                      {b.description}
                    </p>
                  )}

                  {b.booking_resources && b.booking_resources.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Add-ons:</span>
                      {b.booking_resources.map((br) => (
                        <span
                          key={br.id}
                          className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 border border-white/5"
                        >
                          {br.resources?.name} <span className="font-bold text-violet-400">x{br.quantity}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col justify-end gap-3 shrink-0 self-center">
                  <button
                    onClick={() => handleApprove(b.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all flex-1 md:flex-none"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setSelectedRejectId(b.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 px-4 py-2.5 text-xs font-semibold text-red-400 transition-all flex-1 md:flex-none"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedRejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRejectId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl glass-panel border border-violet-500/20 p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-white mb-2">Rejection Verdict</h3>
              <p className="text-xs text-slate-400 mb-4">Provide a reason explaining why this reservation request is rejected.</p>
              <textarea
                rows={3}
                placeholder="e.g. Schedule conflicts, resource limits, maintenance downtime."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm mb-4"
              />
              <div className="flex justify-end gap-3 text-xs">
                <button
                  onClick={() => { setSelectedRejectId(null); setRejectReason(''); }}
                  className="rounded-xl border border-white/5 hover:bg-white/5 px-4 py-2 font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRejectId)}
                  className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 font-semibold text-white shadow-lg shadow-red-600/20"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}