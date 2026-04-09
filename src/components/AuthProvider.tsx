"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not configured");
      setLoading(false);
      return;
    }

    const client = createClient(supabaseUrl, supabaseKey);
    setSupabase(client);

    const getUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabaseUrl, supabaseKey]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const defaultValue = {
    supabase,
    user,
    loading: !supabaseUrl || !supabaseKey ? false : loading,
    signOut: async () => {},
  };

  return (
    <AuthContext.Provider value={supabase ? { supabase, user, loading, signOut } : defaultValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}