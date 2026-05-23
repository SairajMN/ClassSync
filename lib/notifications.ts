import { SupabaseClient } from '@supabase/supabase-js';

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: 'booking_created' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_conflict' | 'reminder',
  title: string,
  message: string
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create notification:', error.message);
  }

  return { data, error };
}
