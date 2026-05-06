import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  const queryClient = useQueryClient();
  const supabase = null as unknown as SupabaseClient;
  const user = null as unknown as { id: string } | null;

  const { data: notifications = [], isFetching } = useQuery({
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

  const unreadCount = notifications.filter(n => !n.read).length;

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
    isLoading: !user || isFetching,
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
  };
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const supabase = null as unknown as SupabaseClient;
  const user = null as unknown as { id: string } | null;

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const defaultPrefs = {
    budget_80_percent: true,
    budget_100_percent: true,
    goal_achieved: true,
    recurring_reminder: true,
    weekly_summary: false,
    inactivity_reminder: true,
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<typeof defaultPrefs>) => {
      // First check if record exists
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      let error: { message?: string } | null;
      
      if (existing) {
        // Update existing
        const result = await supabase
          .from('notification_preferences')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user!.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user!.id,
            ...updates,
          });
        error = result.error;
      }

      if (error) throw error;
      return updates;
    },
    onSuccess: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['notification_preferences'] });
    },
  });

  const prefs = preferences || defaultPrefs;

  return {
    preferences: prefs,
    isLoading,
    error,
    update: updateMutation.mutateAsync,
  };
}
