import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/components/AuthProvider';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionWithKeys extends PushSubscription {
  keys: PushSubscriptionKeys;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker não suportado neste browser');
    }
    
    if (!('PushManager' in window)) {
      throw new Error('Push Manager não suportado neste browser');
    }

    // Register service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch (err) {
      throw new Error('Service Worker não disponível. Faz refresh da página (Ctrl+Shift+R)');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permissão de notificações negada');
    }

    // Create subscription
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidKey) {
      throw new Error('VAPID public key not configured');
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      }) as any;

      const keys = subscription.keys;

      if (!keys) {
        throw new Error('Chaves da subscrição não disponíveis');
      }

      const p256dh = keys.p256dh;
      const auth = keys.auth;

      if (!p256dh || !auth) {
        throw new Error(`Chaves incompletas: p256dh=${!!p256dh}, auth=${!!auth}`);
      }

      // Save to database
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user!.id,
        endpoint: subscription.endpoint,
        keys_p256dh: p256dh,
        keys_auth: auth,
      });

      if (error) {
        throw new Error(`Erro ao guardar: ${error.message}`);
      }

      return subscription;
    } catch (error: any) {
      throw error;
    }
  };

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user!.id);
  };

  return { subscribe, unsubscribe };
}

export function useNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (error) {
          return null;
        }
        return data;
      } catch (err) {
        return null;
      }
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

      let error: any;
      
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
