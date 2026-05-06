'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  subscribeToPush,
  unsubscribeFromPush,
  type OneSignalSubscriptionState,
} from '@/lib/onesignal/init';

export function useOneSignal() {
  const { user, supabase } = useAuth();
  const [state, setState] = useState<OneSignalSubscriptionState>({
    isSubscribed: false,
    isPushEnabled: false,
    playerId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial state from OneSignal (already initialized by OneSignalProvider)
  useEffect(() => {
    let mounted = true;

    const getState = async () => {
      try {
        // 1. Get real-time state from OneSignal v15 API
        const oneSignalState = {
          isSubscribed: await window.OneSignal?.isSubscribed?.() || false,
          isPushEnabled: await window.OneSignal?.isPushEnabled?.() || false,
          playerId: await window.OneSignal?.getUserId?.() || null,
        };
        
        console.log('📱 OneSignal state from API:', oneSignalState);
        
        // 2. Check database for active subscription (source of truth)
        if (user && supabase) {
          const { data: dbSubscription, error: dbError } = await supabase
            .from('onesignal_subscriptions')
            .select('onesignal_player_id, subscription_state')
            .eq('user_id', user.id)
            .eq('subscription_state', 'active')
            .single();

          if (dbError && dbError.code !== 'PGRST116') {
            console.error('Error fetching subscription from DB:', dbError);
          }

          // 3. Use database as source of truth for subscription state
          const finalState = {
            isSubscribed: !!dbSubscription && dbSubscription.subscription_state === 'active',
            isPushEnabled: !!dbSubscription && dbSubscription.subscription_state === 'active',
            playerId: dbSubscription?.onesignal_player_id || oneSignalState.playerId,
          };

          console.log('📊 Final subscription state (DB is source of truth):', finalState);

          if (mounted) {
            setState(finalState);
            setLoading(false);
          }
        } else {
          // No user, use OneSignal state only
          if (mounted) {
            setState(oneSignalState);
            setLoading(false);
          }
        }
      } catch (err: unknown) {
        console.error('❌ Error getting OneSignal state:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    };

    getState();

    return () => {
      mounted = false;
    };
  }, [user, supabase]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      if (!user) {
        setError('Utilizador não autenticado');
        setLoading(false);
        return false;
      }
      
      // Wait for OneSignal to be fully initialized
      const oneSignal = window.OneSignal;
      if (!oneSignal) {
        console.log('⏳ Waiting for OneSignal to initialize...');
        try {
          const { waitForOneSignal } = await import('@/lib/onesignal/init');
          await waitForOneSignal();
      } catch (err: unknown) {
        console.error('Timeout waiting for OneSignal:', err);
          setError('OneSignal ainda está a carregar. Tenta novamente em alguns segundos.');
          setLoading(false);
          return false;
        }
      }
      
      const playerId = await subscribeToPush();
      
      if (!playerId) {
        setError('Falha ao obter ID do dispositivo');
        setLoading(false);
        return false;
      }
      
      if (!supabase || !user) {
        setError('Utilizador não autenticado');
        setLoading(false);
        return false;
      }
      
      // Save to database using authenticated supabase client
      const { error: saveError } = await supabase
        .from('onesignal_subscriptions')
        .upsert({
          user_id: user.id,
          onesignal_player_id: playerId,
          browser_name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                         navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                         navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
          subscription_state: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      if (saveError) {
        console.error('Failed to save subscription:', saveError);
        setError('Falha ao guardar subscrição: ' + saveError.message);
        setLoading(false);
        return false;
      }
      
      console.log('✅ Subscription saved successfully:', { userId: user.id, playerId });
      
      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isPushEnabled: true,
        playerId,
      }));
      setLoading(false);
      return true;
} catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Subscribe error:', errorMessage);
        setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [user, supabase]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      await unsubscribeFromPush();
      
      if (!user || !supabase) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          isPushEnabled: false,
        }));
        return;
      }
      
      const { error } = await supabase
        .from('onesignal_subscriptions')
        .update({ subscription_state: 'inactive', updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to update subscription state:', error);
      }
      
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isPushEnabled: false,
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to unsubscribe');
      } else {
        setError('Failed to unsubscribe');
      }
    }
  }, [user, supabase]);

  // Refresh state from OneSignal
  const refreshState = useCallback(async () => {
    try {
      const oneSignalState = {
        isSubscribed: await window.OneSignal?.isSubscribed?.() || false,
        isPushEnabled: await window.OneSignal?.isPushEnabled?.() || false,
        playerId: await window.OneSignal?.getUserId?.() || null,
      };
      setState(oneSignalState);
    } catch (err: unknown) {
      console.error('Error refreshing OneSignal state:', err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    ...state,
    loading,
    error,
    subscribe,
    unsubscribe,
    refreshState,
  };
}
