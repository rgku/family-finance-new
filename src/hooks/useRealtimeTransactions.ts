"use client";

import { useEffect, useState, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  created_at: string;
};

export function useRealtimeTransactions(
  supabase: SupabaseClient,
  familyId: string | undefined,
  initialData: Transaction[] = []
) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);

  const loadTransactions = useCallback(async () => {
    if (!familyId) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", familyId)
      .order("date", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  }, [supabase, familyId]);

  useEffect(() => {
    if (!familyId) return;

    loadTransactions();

    const channel = supabase
      .channel(`transactions:${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Transaction) : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, familyId, loadTransactions]);

  return { transactions, refresh: loadTransactions };
}