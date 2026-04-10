"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useMemo } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function useSupabase() {
  const client = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    return createBrowserClient(supabaseUrl, supabaseKey);
  }, []);

  return client;
}