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
      const { error } = await supabase
        .from('goal_contributions')
        .update({ amount, contribution_date: contributionDate, month })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
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
      const { error } = await supabase
        .from('goal_contributions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalContributions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}