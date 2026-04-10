"use client";

import { useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/AuthProvider";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function useRealtimeTransactions(
  onTransactionChange?: () => void
) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    
    const channel = supabase
      .channel(`transactions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          onTransactionChange?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onTransactionChange]);
}