'use client';

import { useEffect, Suspense } from 'react';
import { useRooms } from '@/hooks/useRooms';
import BookingForm from '@/components/booking/BookingForm';
import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/store/booking.store';
import { motion } from 'framer-motion';
import { CalendarPlus } from 'lucide-react';

function NewBookingContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get('room_id');
    const { fetchRooms, fetchResources } = useRooms();
    const { setSelectedRoomId } = useBookingStore();

    useEffect(() => {
        fetchRooms();
        fetchResources();
    }, [fetchRooms, fetchResources]);

    useEffect(() => {
        if (roomId) {
            setSelectedRoomId(roomId);
        }
    }, [roomId, setSelectedRoomId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                    <CalendarPlus className="h-6 w-6 text-violet-400" />
                    New Booking
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Reserve a room and resources for your scheduled activity.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <BookingForm />
            </motion.div>
        </div>
    );
}

export default function NewBookingPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-60">
                <div className="text-slate-400 text-sm">Loading booking form...</div>
            </div>
        }>
            <NewBookingContent />
        </Suspense>
    );
}