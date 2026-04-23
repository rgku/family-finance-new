import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/components/AuthProvider';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  // Fetch notifications with polling (every 5 seconds)
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log('[useNotifications] Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useNotifications] Error fetching notifications:', error);
        throw error;
      }
      
      console.log('[useNotifications] Fetched', data?.length, 'notifications');
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true, // Also poll when tab is not focused
  });

  // Count unread
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!user || !supabase) return;

    console.log('[useNotifications] Setting up realtime subscription for user:', user.id);

    // Cleanup existing channel if it exists
    if (channelRef.current) {
      console.log('[useNotifications] Removing existing channel...');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `notifications:${user.id}`;
    const channel = supabase.channel(channelName);
    
    // Store channel reference
    channelRef.current = channel;

    // Add callback BEFORE subscribing
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      async (payload) => {
        console.log('[useNotifications] Realtime INSERT detected:', payload);
        
        // Force immediate refetch
        await refetch();
        
        // Show browser notification if new notification arrived
        const newNotif = payload.new as Notification;
        if (newNotif && !newNotif.read) {
          console.log('[useNotifications] New unread notification:', newNotif.title);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.body,
              icon: '/favicon.ico',
            });
          }
        }
      }
    );

    // Subscribe after callback is added
    channel.subscribe((status) => {
      console.log('[useNotifications] Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[useNotifications] ✅ Realtime subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[useNotifications] Realtime subscription error');
      }
    });

    return () => {
      console.log('[useNotifications] Cleaning up realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, supabase, refetch]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
  };
}

export function useNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Table doesn't exist yet - return defaults
        if (error.code === '42P01') {
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error: any) => {
      // Don't retry if table doesn't exist
      if (error.code === '42P01') return false;
      return failureCount < 3;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<typeof preferences>) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return updates;
    },
  });

  return {
    preferences,
    isLoading,
    error,
    update: updateMutation.mutateAsync,
  };
}
