import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  month: string;
  created_at: string;
  goal_name?: string;
  goal_icon?: string;
}

export function useGoalContributions(userId?: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['goalContributions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select(`
          *,
          goal:goals_decrypted(name, icon)
        `)
        .eq('user_id', userId!)
        .order('contribution_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        goal_id: item.goal_id,
        user_id: item.user_id,
        amount: parseFloat(item.amount),
        contribution_date: item.contribution_date,
        month: item.month,
        created_at: item.created_at,
        goal_name: item.goal?.name,
        goal_icon: item.goal?.icon,
      })) as GoalContribution[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateGoalContribution() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount, contributionDate, userId }: { id: string; amount: number; contributionDate: string; userId: string }) => {
      const month = contributionDate.slice(0, 7) + '-01';
      
      // Get old contribution
      const { data: oldContrib, error: fetchError } = await supabase
        .from('goal_contributions')
        .select('amount, goal_id')
        .eq('id', id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!oldContrib) {
        console.log('[updateGoalContribution] Contrib not found:', id);
        throw new Error('Contribution not found');
      }
      console.log('[updateGoalContribution] Old contrib:', oldContrib);

      // Calculate diff first
      const oldVal = parseFloat(oldContrib.amount) || 0;
      const newVal = amount;
      const diff = newVal - oldVal;
      console.log('[updateGoalContribution] Old:', oldVal, 'new:', newVal, 'diff:', diff);

      // Update contribution
      const { error } = await supabase
        .from('goal_contributions')
        .update({ amount, contribution_date: contributionDate, month })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        console.error('[updateGoalContribution] Update error:', error);
        throw error;
      }

      // Update goal current_amount (difference)
      if (oldContrib.goal_id && diff !== 0) {
        const { data: goal } = await supabase
          .from('goals')
          .select('current_amount')
          .eq('id', oldContrib.goal_id)
          .single();
        const newAmount = (parseFloat(goal?.current_amount) || 0) + diff;
        console.log('[updateGoalContribution] Goal current:', goal?.current_amount, 'new:', newAmount);
        await supabase
          .from('goals')
          .update({ current_amount: newAmount.toFixed(2) })
          .eq('id', oldContrib.goal_id);
      }

      return { id, amount, contributionDate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalContributions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoalContribution() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Get contribution amount first
      const { data: contrib, error: fetchError } = await supabase
        .from('goal_contributions')
        .select('amount, goal_id')
        .eq('id', id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!contrib) {
        console.log('[deleteGoalContribution] Contrib not found, maybe already deleted:', id);
        return id;
      }
      console.log('[deleteGoalContribution] Old contrib:', contrib);

      // Delete contribution
      const { error } = await supabase
        .from('goal_contributions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;

      // Update goal current_amount
      const currentVal = parseFloat(contrib.amount) || 0;
      if (contrib.goal_id && currentVal > 0) {
        const { data: goal } = await supabase
          .from('goals')
          .select('current_amount')
          .eq('id', contrib.goal_id)
          .single();
        const newAmount = (parseFloat(goal?.current_amount) || 0) - currentVal;
        console.log('[deleteGoalContribution] Current:', goal?.current_amount, 'subtract:', currentVal, 'new:', newAmount);
        await supabase
          .from('goals')
          .update({ current_amount: newAmount.toFixed(2) })
          .eq('id', contrib.goal_id);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalContributions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}