import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBookingStore } from '@/store/booking.store';
import { Room, Resource } from '@/types';
import { toast } from 'sonner';

export function useRooms() {
  const supabase = createClient();
  const { setRooms, setResources } = useBookingStore();
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_resources(
            *,
            resources:resource_id(*)
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setRooms(data as Room[]);
    } catch (err: any) {
      toast.error('Failed to load rooms: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, setRooms]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setResources(data as Resource[]);
    } catch (err: any) {
      toast.error('Failed to load resources: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, setResources]);

  return {
    loading,
    fetchRooms,
    fetchResources,
  };
}
