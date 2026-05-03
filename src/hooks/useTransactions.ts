import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}

export function useTransactions(userId?: string, month?: string, limit = 50) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['transactions', userId, month, limit],
    queryFn: async () => {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      // Use view that already filters by family_id via RLS
      let query = supabase
        .from('transactions_decrypted')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .limit(limit);
      
      if (month) {
        query = query.like('date', `${month}%`);
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

export function useCreateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.setQueryData(['transactions'], (old: Transaction[] = []) => [data, ...old]);
    },
  });
}

export function useUpdateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Transaction>) => {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: ({ id, ...updates }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.setQueryData(['transactions'], (old: Transaction[] = []) =>
        old.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    },
  });
}

export function useDeleteTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.setQueryData(['transactions'], (old: Transaction[] = []) =>
        old.filter(t => t.id !== id)
      );
    },
  });
}
