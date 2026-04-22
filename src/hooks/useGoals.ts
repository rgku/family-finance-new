import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon: string;
  goal_type: 'savings' | 'expense';
  created_at: string;
}

export function useGoals(userId?: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals_decrypted')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreateGoal() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.setQueryData(['goals'], (old: Goal[] = []) => [...old, data]);
    },
  });
}

export function useUpdateGoal() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Goal>) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.goal_type !== undefined) updateData.goal_type = updates.goal_type;
      
      if (Object.keys(updateData).length === 0) return { id };
      
      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: ({ id, ...updates }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.setQueryData(['goals'], (old: Goal[] = []) =>
        old.map(g => g.id === id ? { ...g, ...updates } : g)
      );
    },
  });
}

export function useDeleteGoal() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.setQueryData(['goals'], (old: Goal[] = []) =>
        old.filter(g => g.id !== id)
      );
    },
  });
}

export function useAddGoalContribution() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const { error } = await supabase.rpc('add_goal_contribution', {
        p_goal_id: goalId,
        p_amount: amount,
      });
      if (error) throw error;
      
      const { data } = await supabase
        .from('goals_decrypted')
        .select('*')
        .eq('id', goalId)
        .single();
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (data) {
        queryClient.setQueryData(['goals'], (old: Goal[] = []) =>
          old.map(g => g.id === data.id ? data : g)
        );
      }
    },
  });
}
