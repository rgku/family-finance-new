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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ziyriwdkgankrbmsjvhk.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeXJpd2RrZ2Fua3JibXNqdmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mjg2MTUsImV4cCI6MjA5MTMwNDYxNX0.ukeAK91Nf13jL6LDhw8mrPrUlb98743BqyRn7Ns1UIA';
  
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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

  return (
    <AuthContext.Provider value={{ supabase, user, loading, signOut }}>
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