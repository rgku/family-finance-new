import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  month: string;
  limit_amount: number;
  created_at: string;
}

export function useBudgets(userId?: string, month?: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['budgets', userId, month],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreateBudget() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.setQueryData(['budgets'], (old: Budget[] = []) => [...old, data]);
    },
  });
}

export function useUpdateBudget() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, limit_amount }: { id: string; limit_amount: number }) => {
      const { error } = await supabase
        .from('budgets')
        .update({ limit_amount })
        .eq('id', id);
      if (error) throw error;
      return { id, limit_amount };
    },
    onSuccess: ({ id, limit_amount }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.setQueryData(['budgets'], (old: Budget[] = []) =>
        old.map(b => b.id === id ? { ...b, limit_amount } : b)
      );
    },
  });
}

export function useDeleteBudget() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.setQueryData(['budgets'], (old: Budget[] = []) =>
        old.filter(b => b.id !== id)
      );
    },
  });
}
