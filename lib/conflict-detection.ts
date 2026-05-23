import { SupabaseClient } from '@supabase/supabase-js';
import { ConflictError } from '@/types';

interface RequestedResource {
  resource_id: string;
  quantity: number;
}

export async function checkConflicts(
  supabase: SupabaseClient,
  room_id: string,
  start_time: string,
  end_time: string,
  requested_resources: RequestedResource[],
  exclude_booking_id?: string
): Promise<ConflictError> {
  // 1. Room overlap check
  let query = supabase
    .from('bookings')
    .select('id, title, start_time, end_time')
    .eq('room_id', room_id)
    .in('status', ['pending', 'approved'])
    .lt('start_time', end_time)
    .gt('end_time', start_time);

  if (exclude_booking_id) {
    query = query.neq('id', exclude_booking_id);
  }

  const { data: overlappingBookings, error: overlapError } = await query;

  if (overlapError) {
    return { conflict: true, message: `Database error: ${overlapError.message}` };
  }

  if (overlappingBookings && overlappingBookings.length > 0) {
    const conflict = overlappingBookings[0];
    return {
      conflict: true,
      message: `The room is already booked for "${conflict.title}" during this time.`,
      conflictingBooking: {
        id: conflict.id,
        title: conflict.title,
        start_time: conflict.start_time,
        end_time: conflict.end_time,
      },
    };
  }

  // 2. Resource inventory and overlap check
  for (const requested of requested_resources) {
    // Get total inventory quantity
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .select('name, quantity')
      .eq('id', requested.resource_id)
      .single();

    if (resourceError || !resourceData) {
      return { conflict: true, message: 'Requested resource does not exist in inventory.' };
    }

    const totalInventory = resourceData.quantity;

    // Sum other bookings that overlap the requested time and also book this resource
    const resourceQuery = supabase
      .from('booking_resources')
      .select('quantity, booking:bookings(id, status, start_time, end_time)')
      .eq('resource_id', requested.resource_id);

    const { data: activeAllocations, error: allocationError } = await resourceQuery;

    if (allocationError) {
      return { conflict: true, message: `Database error checking resources: ${allocationError.message}` };
    }

    let allocatedQuantity = 0;
    if (activeAllocations) {
      for (const alloc of activeAllocations) {
        const booking = alloc.booking as unknown as {
          id: string;
          status: string;
          start_time: string;
          end_time: string;
        } | null;

        if (
          booking &&
          ['pending', 'approved'].includes(booking.status) &&
          booking.start_time < end_time &&
          booking.end_time > start_time &&
          (!exclude_booking_id || booking.id !== exclude_booking_id)
        ) {
          allocatedQuantity += alloc.quantity;
        }
      }
    }

    if (allocatedQuantity + requested.quantity > totalInventory) {
      return {
        conflict: true,
        message: `Resource limit exceeded for "${resourceData.name}". Requested: ${requested.quantity}, Available: ${totalInventory - allocatedQuantity} (out of ${totalInventory} total).`,
      };
    }
  }

  return { conflict: false, message: 'No conflicts detected.' };
}
