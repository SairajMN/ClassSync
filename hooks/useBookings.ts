import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBookingStore } from '@/store/booking.store';
import { Booking } from '@/types';
import { toast } from 'sonner';

export function useBookings() {
  const supabase = createClient();
  const { setBookings, addBooking, updateBooking, removeBooking } = useBookingStore();
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
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
        .order('start_time', { ascending: true });

      if (error) throw error;
      setBookings(data as unknown as Booking[]);
    } catch (err: any) {
      toast.error('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, setBookings]);

  const createBooking = useCallback(
    async (formData: any) => {
      setLoading(true);
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to submit booking');
        }

        // Fetch fresh list to update calendars and resources
        await fetchBookings();
        toast.success(
          result.approved
            ? 'Booking automatically approved!'
            : 'Booking submitted successfully! Awaiting approval.'
        );
        return { success: true, bookingId: result.bookingId };
      } catch (err: any) {
        toast.error(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchBookings]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE',
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to cancel booking');
        }

        removeBooking(bookingId);
        toast.success('Booking successfully cancelled.');
        return { success: true };
      } catch (err: any) {
        toast.error(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [removeBooking]
  );

  return {
    loading,
    fetchBookings,
    createBooking,
    cancelBooking,
  };
}
