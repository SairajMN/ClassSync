'use client';

import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useBookingStore } from '@/store/booking.store';
import { useAuthStore } from '@/store/auth.store';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types';
import type { EventClickArg } from '@fullcalendar/core';
import {
  X,
  Clock,
  MapPin,
  Users,
  Tv,
  Trash2,
  Filter,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingCalendar() {
  const { bookings, rooms } = useBookingStore();
  const { profile } = useAuthStore();
  const { cancelBooking } = useBookings();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter bookings based on selected room filter
  const filteredBookings = useMemo(() => {
    if (selectedRoomFilter === 'all') return bookings;
    return bookings.filter((b) => b.room_id === selectedRoomFilter);
  }, [bookings, selectedRoomFilter]);

  // Convert database bookings to FullCalendar compatible events
  const calendarEvents = useMemo(() => {
    return filteredBookings.map((b) => {
      let backgroundColor = 'rgba(234, 179, 8, 0.2)';
      let textColor = '#eab308';
      let borderColor = 'rgba(234, 179, 8, 0.4)';

      if (b.status === 'approved') {
        backgroundColor = 'rgba(16, 185, 129, 0.15)';
        textColor = '#34d399';
        borderColor = 'rgba(16, 185, 129, 0.3)';
      } else if (b.status === 'rejected') {
        backgroundColor = 'rgba(239, 68, 68, 0.15)';
        textColor = '#f87171';
        borderColor = 'rgba(239, 68, 68, 0.3)';
      } else if (b.status === 'cancelled') {
        backgroundColor = 'rgba(148, 163, 184, 0.15)';
        textColor = '#94a3b8';
        borderColor = 'rgba(148, 163, 184, 0.3)';
      }

      return {
        id: b.id,
        title: b.title,
        start: b.start_time,
        end: b.end_time,
        extendedProps: { booking: b },
        backgroundColor,
        textColor,
        borderColor,
      };
    });
  }, [filteredBookings]);

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as Booking;
    setSelectedEvent(booking);
    setShowDetailModal(true);
  };

  const handleCancelClick = async () => {
    if (!selectedEvent) return;
    const res = await cancelBooking(selectedEvent.id);
    if (res.success) {
      setShowDetailModal(false);
      setSelectedEvent(null);
    }
  };

  const isOwnerOrAdmin = selectedEvent && (
    profile?.id === selectedEvent.user_id ||
    profile?.role === 'admin'
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header with Room Filtering Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl glass-panel p-6 border-violet-500/10">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-violet-400" />
            Classroom Schedule Filters
          </h2>
          <p className="text-xs text-slate-400 mt-1">Select a physical room to filter current reservation timelines.</p>
        </div>

        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-slate-400 hidden sm:block" />
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="glass-input rounded-xl px-4 py-2 text-xs font-semibold select-none pr-8 cursor-pointer"
          >
            <option value="all">All Lecture Halls & Labs</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.building})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Core Grid Container */}
      <div className="glass-panel rounded-2xl p-6 border-violet-500/10 shadow-2xl relative overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          height="auto"
          editable={false}
          selectable={false}
          dayMaxEvents={3}
        />
      </div>

      {/* Elastic Glass Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md rounded-2xl glass-panel border border-violet-500/20 p-6 shadow-2xl preserve-3d"
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${selectedEvent.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : selectedEvent.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                    {selectedEvent.status}
                  </span>
                  <h3 className="font-display text-xl font-bold text-white mt-2 leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>

                <div className="space-y-3 border-y border-white/5 py-4 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4.5 w-4.5 text-violet-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Scheduled Time</p>
                      <p className="font-medium">
                        {new Date(selectedEvent.start_time).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(selectedEvent.start_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(selectedEvent.end_time).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4.5 w-4.5 text-violet-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Physical Space</p>
                      <p className="font-medium">{selectedEvent.rooms?.name || 'Classroom Space'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-4.5 w-4.5 text-violet-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Organized By</p>
                      <p className="font-medium">{selectedEvent.profiles?.name || 'Academic Staff'}</p>
                    </div>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Description</span>
                    <p className="text-xs leading-relaxed text-slate-400 mt-1">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.booking_resources && selectedEvent.booking_resources.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Allocated Resources</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedEvent.booking_resources.map((br) => (
                        <div
                          key={br.id}
                          className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 border border-white/5"
                        >
                          <Tv className="h-3 w-3 text-violet-400" />
                          <span>{br.resources?.name}</span>
                          <span className="font-bold text-violet-400">x{br.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isOwnerOrAdmin && selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'completed' && (
                  <button
                    onClick={handleCancelClick}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-600/20 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Cancel Reservation</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}