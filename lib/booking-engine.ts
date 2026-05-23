import { SupabaseClient } from '@supabase/supabase-js';
import { bookingSchema } from './validations/booking.schema';
import { BookingFormData, Profile } from '@/types';

export interface BookingEngineResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  code?: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'CAPACITY_ERROR' | 'CONFLICT_ERROR' | 'DATABASE_ERROR';
}

export async function processBooking(
  supabase: SupabaseClient,
  userId: string,
  formData: BookingFormData
): Promise<BookingEngineResult> {
  try {
    // 1. Auth check: Fetch profile to verify role and active state
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Unauthorized: Active user profile not found.',
        code: 'AUTH_ERROR',
      };
    }

    const typedProfile = profile as Profile;
    if (!typedProfile.is_active) {
      return {
        success: false,
        error: 'Your account is currently inactive.',
        code: 'AUTH_ERROR',
      };
    }

    // 2. Input validation: Use Zod schema
    const validation = bookingSchema.safeParse(formData);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMsg}`,
        code: 'VALIDATION_ERROR',
      };
    }

    // 3. Capacity validation: Load room capacity
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('capacity, name')
      .eq('id', formData.room_id)
      .single();

    if (roomError || !room) {
      return {
        success: false,
        error: 'The requested room does not exist.',
        code: 'DATABASE_ERROR',
      };
    }

    // 4, 5, 6, 7. Atomic transaction via Supabase RPC `create_booking_atomic`
    const { data: bookingId, error: rpcError } = await supabase.rpc('create_booking_atomic', {
      p_user_id: userId,
      p_room_id: formData.room_id,
      p_title: formData.title,
      p_description: formData.description || '',
      p_start_time: formData.start_time,
      p_end_time: formData.end_time,
      p_resources: formData.resources,
    });

    if (rpcError) {
      const message = rpcError.message;
      if (message.includes('ROOM_OVERLAP')) {
        return {
          success: false,
          error: 'ROOM_OVERLAP: The room is already booked for the selected time range.',
          code: 'CONFLICT_ERROR',
        };
      }
      if (message.includes('RESOURCE_LIMIT_EXCEEDED')) {
        return {
          success: false,
          error: message.replace('RESOURCE_LIMIT_EXCEEDED: ', ''),
          code: 'CONFLICT_ERROR',
        };
      }
      return {
        success: false,
        error: `Booking failed: ${rpcError.message}`,
        code: 'DATABASE_ERROR',
      };
    }

    return {
      success: true,
      bookingId: bookingId as string,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `An unexpected system error occurred: ${err instanceof Error ? err.message : String(err)}`,
      code: 'DATABASE_ERROR',
    };
  }
}