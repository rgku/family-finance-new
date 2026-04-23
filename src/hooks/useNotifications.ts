import { useEffect, useState } from 'react';
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

  // Fetch notifications with polling (every 5 seconds)
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
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
      
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Count unread
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

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
        if (error.code === '42P01') {
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!user,
    retry: (failureCount, error: any) => {
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
