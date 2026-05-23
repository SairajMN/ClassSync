'use client';

import { useEffect } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';

export default function CalendarPage() {
    const { fetchBookings, loading } = useBookings();
    const { fetchRooms } = useRooms();

    useEffect(() => {
        fetchBookings();
        fetchRooms();
    }, [fetchBookings, fetchRooms]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-violet-400" />
                        Schedule Calendar
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">View and manage all room reservations across day, week, and month views.</p>
                </div>
                <button
                    onClick={() => fetchBookings()}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Calendar View */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <BookingCalendar />
            </motion.div>
        </div>
    );
}