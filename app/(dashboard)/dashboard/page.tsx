'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth.store';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { motion } from 'framer-motion';
import { Calendar, Layers, TrendingUp, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const supabase = createClient();
    const { profile } = useAuthStore();
    const { fetchBookings, loading: bookingsLoading } = useBookings();
    const { fetchRooms, fetchResources } = useRooms();
    const [stats, setStats] = useState({ totalBookings: 0, approved: 0, pending: 0, rooms: 0 });

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchBookings(), fetchRooms(), fetchResources()]);

            const { count: total } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
            const { count: approved } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');
            const { count: pending } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: rooms } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true);

            setStats({
                totalBookings: total || 0,
                approved: approved || 0,
                pending: pending || 0,
                rooms: rooms || 0,
            });
        };
        loadData();
    }, [fetchBookings, fetchRooms, fetchResources, supabase]);

    const statCards = [
        { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-violet-400' },
        { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Pending Review', value: stats.pending, icon: AlertCircle, color: 'text-amber-400' },
        { label: 'Active Rooms', value: stats.rooms, icon: Layers, color: 'text-indigo-400' },
    ];

    const quickActions = [
        { label: 'New Booking', href: '/bookings/new', desc: 'Reserve a room and resources' },
        { label: 'View Calendar', href: '/calendar', desc: 'See all scheduled bookings' },
        { label: 'Explore Rooms', href: '/rooms', desc: 'Browse available spaces' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="font-display text-2xl font-extrabold text-white">
                    Welcome back, {profile?.name || 'User'} <span className="text-violet-400">✦</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    {profile?.role === 'admin'
                        ? 'You have full administrative access. Manage bookings, approvals, and system resources.'
                        : profile?.role === 'teacher'
                            ? 'You have auto-approval privileges. Create bookings and manage your reservations.'
                            : 'Submit room booking requests for admin approval.'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="glass-panel rounded-xl p-5 border-white/5 relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                                <h3 className="text-2xl font-extrabold text-white mt-0.5">{bookingsLoading ? '...' : card.value}</h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-400" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action, idx) => (
                        <Link key={idx} href={action.href}>
                            <div className="glass-panel rounded-xl p-5 border-white/5 hover:border-violet-500/20 transition-all hover:translate-y-[-2px] cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{action.label}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-violet-400 shrink-0" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Role-specific section */}
            {profile?.role === 'admin' && (
                <div className="glass-panel rounded-2xl p-6 border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-violet-500/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-display font-bold text-white text-base">Admin Control Center</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                You have {stats.pending} pending booking{stats.pending !== 1 ? 's' : ''} awaiting your review.
                            </p>
                        </div>
                        <Link
                            href="/admin"
                            className="rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-amber-500 hover:to-violet-500 transition-all"
                        >
                            Go to Admin Hub
                        </Link>
                    </div>
                </div>
            )}

            {/* Recent Activity Skeleton */}
            <div className="glass-panel rounded-2xl p-6 border-white/5">
                <h3 className="font-display font-bold text-white text-base mb-2">Recent Activity</h3>
                <p className="text-xs text-slate-400">
                    {profile?.role === 'admin'
                        ? 'Review pending approvals in the Admin Hub to see detailed booking requests.'
                        : 'Your recent bookings will appear here once you start reserving rooms.'}
                </p>
            </div>
        </div>
    );
}