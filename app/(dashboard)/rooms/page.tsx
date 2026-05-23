'use client';

import { useEffect } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useBookingStore } from '@/store/booking.store';
import RoomCard from '@/components/rooms/RoomCard';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useState } from 'react';

export default function RoomsPage() {
    const { fetchRooms, fetchResources } = useRooms();
    const { rooms, loading } = useBookingStore();
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchRooms();
        fetchResources();
    }, [fetchRooms, fetchResources]);

    const filteredRooms = filter === 'all' ? rooms : rooms.filter((r) => r.room_type === filter);

    const roomTypes = ['all', 'classroom', 'lab', 'seminar_hall', 'smart_room'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                        <Layers className="h-6 w-6 text-violet-400" />
                        Rooms Explorer
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Browse and select from available institutional spaces.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    {roomTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${filter === type
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {type === 'all' ? 'All Spaces' : type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-panel rounded-2xl h-[350px] animate-pulse p-6" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room, idx) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <RoomCard room={room} />
                        </motion.div>
                    ))}
                    {filteredRooms.length === 0 && (
                        <div className="col-span-full text-center py-20">
                            <p className="text-slate-500 text-sm">No rooms found matching this filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}