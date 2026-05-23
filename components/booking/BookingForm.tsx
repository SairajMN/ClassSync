'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, BookingSchemaType } from '@/lib/validations/booking.schema';
import { useBookingStore } from '@/store/booking.store';
import { useAuthStore } from '@/store/auth.store';
import { useBookings } from '@/hooks/useBookings';
import { checkConflicts } from '@/lib/conflict-detection';
import { createClient } from '@/lib/supabase/client';
import { ConflictError } from '@/types';
import {
  Tv,
  Users,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  MonitorPlay,
  Mic,
  Wifi,
  Wind,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function BookingForm() {
  const router = useRouter();
  const supabase = createClient();
  const { rooms, resources } = useBookingStore();
  const { profile } = useAuthStore();
  const { createBooking } = useBookings();

  const [step, setStep] = useState(1);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictState, setConflictState] = useState<ConflictError>({
    conflict: false,
    message: '',
  });

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<BookingSchemaType>({
    resolver: zodResolver(bookingSchema),
    mode: 'all',
    defaultValues: {
      title: '',
      description: '',
      room_id: '',
      start_time: '',
      end_time: '',
      resources: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'resources',
  });

  // Watch key values
  const watchRoomId = watch('room_id');
  const watchStartTime = watch('start_time');
  const watchEndTime = watch('end_time');
  const watchResources = watch('resources');

  const selectedRoom = rooms.find((r) => r.id === watchRoomId);

  // Trigger conflict check when room, start, or end changes
  useEffect(() => {
    if (!watchRoomId || !watchStartTime || !watchEndTime) return;

    const runCheck = async () => {
      setCheckingConflict(true);
      const res = await checkConflicts(
        supabase,
        watchRoomId,
        watchStartTime,
        watchEndTime,
        watchResources || []
      );
      setConflictState(res);
      setCheckingConflict(false);
    };

    const delay = setTimeout(runCheck, 500);
    return () => clearTimeout(delay);
  }, [watchRoomId, watchStartTime, watchEndTime, watchResources, supabase]);

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: BookingSchemaType) => {
    if (conflictState.conflict) return;

    const res = await createBooking(data);
    if (res.success) {
      // Trigger canvas-confetti upon booking creation!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#6366f1', '#10b981'],
      });
      router.push('/calendar');
    }
  };

  // Helper to map resource icons
  const getResourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('projector')) return MonitorPlay;
    if (lower.includes('smart board')) return Tv;
    if (lower.includes('mic')) return Mic;
    if (lower.includes('internet') || lower.includes('wifi')) return Wifi;
    if (lower.includes('ac')) return Wind;
    return Tv;
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl glass-panel border border-violet-500/10 p-8 shadow-2xl overflow-hidden relative">
      {/* Decorative Neon Mesh Orbs */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-600/10 blur-2xl pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-indigo-600/10 blur-2xl pointer-events-none"></div>

      {/* Steps Indicator Tracker */}
      <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-4">
        {[
          { num: 1, label: 'Select Room' },
          { num: 2, label: 'Schedule Time' },
          { num: 3, label: 'Add Resources' },
          { num: 4, label: 'Review & Book' },
        ].map((item) => (
          <div key={item.num} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${step >= item.num
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-white/5 text-slate-500 border border-white/5'
              }`}>
              {step > item.num ? <Check className="h-4 w-4" /> : item.num}
            </div>
            <span className={`text-xs font-semibold hidden md:inline ${step >= item.num ? 'text-white' : 'text-slate-500'
              }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Core Wizard Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-white">Choose Classroom or Lecture Hall</h3>
                <p className="text-xs text-slate-400">Select a specific physical room location from the options below.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const isSelected = watchRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setValue('room_id', room.id, { shouldValidate: true })}
                      className={`glass-panel cursor-pointer rounded-xl p-4 transition-all hover:bg-violet-600/5 relative overflow-hidden ${isSelected
                          ? 'border-violet-500 bg-violet-600/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                          : 'border-white/5 hover:border-white/10'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-bold text-white text-base">{room.name}</h4>
                          <span className="text-[10px] uppercase font-bold text-violet-400">{room.room_type.replace('_', ' ')}</span>

                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                            <MapPin className="h-3 w-3 text-violet-500" />
                            {room.building}, Floor {room.floor}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>Cap: {room.capacity}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute right-2 bottom-2 h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.room_id && (
                <span className="text-xs font-semibold text-red-400">{errors.room_id.message}</span>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-white">Title & Scheduling Times</h3>
                <p className="text-xs text-slate-400">Provide a descriptive title and select the scheduling duration.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">Reservation Title</label>
                  <input
                    type="text"
                    placeholder="e.g. CS101 Lecture, Research Colloquium"
                    {...register('title')}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                  {errors.title && (
                    <span className="text-xs font-semibold text-red-400">{errors.title.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Brief outline of the booking purpose"
                    {...register('description')}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  />
                  {errors.description && (
                    <span className="text-xs font-semibold text-red-400">{errors.description.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-violet-400" />
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      onChange={(e) => {
                        const isoStr = e.target.value ? new Date(e.target.value).toISOString() : '';
                        setValue('start_time', isoStr, { shouldValidate: true });
                      }}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm cursor-pointer select-none"
                    />
                    {errors.start_time && (
                      <span className="text-xs font-semibold text-red-400">{errors.start_time.message}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-violet-400" />
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      onChange={(e) => {
                        const isoStr = e.target.value ? new Date(e.target.value).toISOString() : '';
                        setValue('end_time', isoStr, { shouldValidate: true });
                      }}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm cursor-pointer select-none"
                    />
                    {errors.end_time && (
                      <span className="text-xs font-semibold text-red-400">{errors.end_time.message}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-white">Dynamic Resource Add-ons</h3>
                <p className="text-xs text-slate-400">Append additional shared resources to your room booking.</p>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                {resources.map((res) => {
                  // Find if resource is already chosen
                  const index = fields.findIndex((f) => f.resource_id === res.id);
                  const selectedAmount = index !== -1 ? fields[index].quantity : 0;

                  const handleIncrement = () => {
                    if (index === -1) {
                      append({ resource_id: res.id, quantity: 1 });
                    } else if (selectedAmount < res.quantity) {
                      update(index, { resource_id: res.id, quantity: selectedAmount + 1 });
                    }
                  };

                  const handleDecrement = () => {
                    if (index !== -1) {
                      if (selectedAmount === 1) {
                        remove(index);
                      } else {
                        update(index, { resource_id: res.id, quantity: selectedAmount - 1 });
                      }
                    }
                  };

                  const ResIcon = getResourceIcon(res.name);

                  return (
                    <div
                      key={res.id}
                      className="glass-panel flex items-center justify-between rounded-xl p-4 border border-white/5 hover:border-violet-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-500/20">
                          <ResIcon className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{res.name}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Pool: {res.quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1 border border-white/5">
                        <button
                          type="button"
                          onClick={handleDecrement}
                          disabled={selectedAmount === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-white">{selectedAmount}</span>
                        <button
                          type="button"
                          onClick={handleIncrement}
                          disabled={selectedAmount >= res.quantity}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-white">Review Reservation Details</h3>
                <p className="text-xs text-slate-400">Verify dates and quantities before committing.</p>
              </div>

              {/* Review Panel details */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-5 space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400">Classroom Space</span>
                    <h4 className="font-display text-xl font-bold text-white mt-0.5">{selectedRoom?.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-violet-500" />
                      {selectedRoom?.building}, Floor {selectedRoom?.floor}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1 border border-violet-500/30 text-xs font-bold text-violet-300">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {selectedRoom?.capacity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 py-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Timing Bounds</p>
                      <p className="font-semibold text-white">
                        {watchStartTime && new Date(watchStartTime).toLocaleDateString()} • {watchStartTime && new Date(watchStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {watchEndTime && new Date(watchEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">System Routing Policy</p>
                      <p className="font-semibold text-white">
                        {profile?.role === 'student' ? 'Requires Admin Approval' : 'Auto-Approved Booking'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Resources array */}
                {watchResources && watchResources.length > 0 && (
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Requested Dynamic Extras</p>
                    <div className="flex flex-wrap gap-2">
                      {watchResources.map((item, idx) => {
                        const r = resources.find((x) => x.id === item.resource_id);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300 border border-white/5"
                          >
                            <span>{r?.name}</span>
                            <span className="font-bold text-violet-400">x{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Conflict Prevention Alert Banner */}
              {conflictState.conflict && (
                <div className="rounded-xl border border-red-500/20 bg-red-600/10 p-4 flex gap-3 text-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Conflict Detected</h4>
                    <p className="text-xs leading-relaxed text-red-300 mt-1">{conflictState.message}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Controls */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 border border-white/5 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={step === 1 && !watchRoomId}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-indigo-600 transition-all duration-200"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={checkingConflict || conflictState.conflict || !isValid}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-indigo-600 transition-all duration-200"
            >
              <span>Confirm & Book</span>
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
