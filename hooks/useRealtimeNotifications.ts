import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { Notification } from '@/types';

export function useRealtimeNotifications() {
  const supabase = createClient();
  const { profile } = useAuthStore();
  const { addNotification, setNotifications } = useNotificationStore();

  useEffect(() => {
    if (!profile) return;

    // 1. Initial fetch of notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();

    // 2. Real-time subscription to user notifications
    const channel = supabase
      .channel(`realtime:notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          addNotification(newNotif);

          // Trigger a Sonner Toast based on notification type
          if (newNotif.type.includes('reject') || newNotif.type.includes('conflict')) {
            toast.error(newNotif.title, {
              description: newNotif.message,
              duration: 5000,
            });
          } else if (newNotif.type.includes('approve') || newNotif.type.includes('success')) {
            toast.success(newNotif.title, {
              description: newNotif.message,
              duration: 5000,
            });
          } else {
            toast.info(newNotif.title, {
              description: newNotif.message,
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, addNotification, setNotifications, supabase]);
}
