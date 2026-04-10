"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSupabase } from "@/hooks/useSupabase";

export function useRealtimeTransactions(
  onTransactionChange?: () => void
) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const onChangeRef = useRef(onTransactionChange);
  
  useEffect(() => {
    onChangeRef.current = onTransactionChange;
  }, [onTransactionChange]);
  
  useEffect(() => {
    if (!user) return;
    
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
          onChangeRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);
}