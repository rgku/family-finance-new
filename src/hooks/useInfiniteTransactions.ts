import { useInfiniteQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';

const PAGE_SIZE = 50;

export function useInfiniteTransactions(userId?: string, month?: string) {
  const supabase = useSupabase();
  
  return useInfiniteQuery({
    queryKey: ['transactions-infinite', userId, month],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      let query = supabase
        .from('transactions_decrypted')
        .select('*', { count: 'exact' })
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .range(from, to);
      
      if (month) {
        query = query.like('date', `${month}%`);
      }
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        data: data || [],
        nextPage: data!.length === PAGE_SIZE ? pageParam + 1 : null,
        totalCount: count || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
