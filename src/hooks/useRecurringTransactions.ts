import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/components/AuthProvider';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  family_id?: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  auto_create: boolean;
  last_created?: string;
  next_run: string;
  enabled: boolean;
  created_at: string;
}

export function useRecurringTransactions(userId?: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['recurring', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId!)
        .order('enabled', { ascending: false }) // Ativas primeiro
        .order('next_run', { ascending: true });
      
      if (error) throw error;
      return data as RecurringTransaction[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateRecurring() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (recurring: Omit<RecurringTransaction, 'id' | 'created_at' | 'next_run' | 'user_id'>) => {
      const nextRun = calculateNextRun(recurring.frequency, recurring.day_of_month);
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          ...recurring,
          user_id: user!.id,
          next_run: nextRun,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useUpdateRecurring() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<RecurringTransaction>) => {
      const updateData: Partial<RecurringTransaction> = { ...updates };

      // Recalculate next_run if frequency or day_of_month changed
      const freq = updates.frequency;
      const day = updates.day_of_month;
      if (freq) {
        updateData.next_run = calculateNextRun(freq, day);
      }
      
      const { error } = await supabase
        .from('recurring_transactions')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useDeleteRecurring() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useToggleRecurring() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ enabled })
        .eq('id', id);
      
      if (error) throw error;
      return { id, enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

function calculateNextRun(frequency: string, dayOfMonth?: number): string {
  const date = new Date();
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      if (dayOfMonth) date.setDate(dayOfMonth);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      if (dayOfMonth) date.setDate(dayOfMonth);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      if (dayOfMonth) date.setDate(dayOfMonth);
      break;
  }
  
  return date.toISOString().split('T')[0];
}
