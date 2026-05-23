import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useAvailability() {
  const [checking, setChecking] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const checkAvailability = useCallback(async (params: {
    start_time: string;
    end_time: string;
    capacity?: number;
    resource_ids?: string[];
  }) => {
    setChecking(true);
    try {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability');
      }

      setAvailableRooms(result.rooms || []);
      return result.rooms;
    } catch (err: any) {
      toast.error(err.message);
      return [];
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    checking,
    availableRooms,
    checkAvailability,
  };
}
