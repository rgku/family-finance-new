import { useMutation, useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/components/AuthProvider';

export interface SubscriptionPlan {
  id: 'free' | 'premium' | 'family';
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    members: number;
    budgets: number | 'unlimited';
    goals: number | 'unlimited';
    aiInsights: number | 'unlimited';
  };
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Até 3 membros',
      'Histórico 12 meses',
      '3 orçamentos',
      '2 metas',
      'Export CSV',
    ],
    limits: {
      members: 3,
      budgets: 3,
      goals: 2,
      aiInsights: 0,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 3.99,
    interval: 'month',
    features: [
      'Até 5 membros',
      'Histórico ilimitado',
      'Orçamentos ilimitados',
      '10 metas',
      'Export PDF + CSV',
      'Despesas recorrentes',
      '10 AI Insights/mês',
      'Notificações push',
      'Backup email semanal',
    ],
    limits: {
      members: 5,
      budgets: 'unlimited',
      goals: 10,
      aiInsights: 10,
    },
  },
  {
    id: 'family',
    name: 'Family',
    price: 6.99,
    interval: 'month',
    features: [
      'Até 10 membros',
      'Tudo ilimitado',
      'AI Insights ilimitados',
      'Backup Google Drive',
      'Metas compartilhadas',
      'Limites por membro',
      'Priority support',
      'API access',
    ],
    limits: {
      members: 10,
      budgets: 'unlimited',
      goals: 'unlimited',
      aiInsights: 'unlimited',
    },
  },
];

export function useSubscription() {
  const supabase = useSupabase();
  const { user, profile } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch latest profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentPlan = subscription?.plan || 'free';
  const isPremium = currentPlan === 'premium';
  const isFamily = currentPlan === 'family';
  const isPaid = isPremium || isFamily;
  const trialEndsAt = subscription?.trial_ends_at;

  return {
    subscription,
    isLoading,
    currentPlan,
    isPremium,
    isFamily,
    isPaid,
    trialEndsAt,
    planLimits: PLANS.find(p => p.id === currentPlan)?.limits,
  };
}

export function useCreateCheckoutSession() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ priceId, planType }: { priceId: string; planType: string }) => {
      if (!user) throw new Error('Must be logged in');
      if (!priceId) throw new Error('Price ID is required');
      if (!planType) throw new Error('Plan type is required');

      try {
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: {
            priceId,
            userId: user.id,
            email: user.email,
            planType,
          },
        });

        if (error) {
          console.error('Checkout session error:', error);
          throw new Error(error.message || 'Failed to create checkout session');
        }

        if (!data?.sessionId || !data?.url) {
          throw new Error('Invalid response from checkout');
        }

        return data;
      } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Network error. Please check your connection.');
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useManageSubscription() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw new Error(profileError.message || 'Failed to fetch profile');
        }

        if (!profile?.stripe_customer_id) {
          throw new Error('No active subscription found');
        }

        const { data, error } = await supabase.functions.invoke('stripe-portal', {
          body: {
            customerId: profile.stripe_customer_id,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to open billing portal');
        }

        return data;
      } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Failed to manage subscription');
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCheckPlanLimit(feature: keyof SubscriptionPlan['limits']) {
  const { planLimits, currentPlan } = useSubscription();
  const limit = planLimits?.[feature];

  const checkLimit = (currentCount: number) => {
    if (limit === 'unlimited') {
      return { allowed: true, current: currentCount, max: '∞' };
    }

    if (typeof limit === 'number') {
      return {
        allowed: currentCount < limit,
        current: currentCount,
        max: limit,
        remaining: Math.max(0, limit - currentCount),
      };
    }

    return { allowed: true };
  };

  return { checkLimit, currentPlan, limit };
}
