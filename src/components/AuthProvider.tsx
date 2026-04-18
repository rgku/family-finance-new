"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface AuthContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  tier: string;
  member_limit: number;
  billing_cycle_day: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const [supabase] = useState(() => createBrowserClient(supabaseUrl, supabaseKey));
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile({
        id: data.id,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        role: data.role,
        tier: data.tier,
        member_limit: data.member_limit,
        billing_cycle_day: data.billing_cycle_day || 1,
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          // Check if email is confirmed
          if (session.user.email_confirmed_at) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            // Email not confirmed - sign out and redirect to login
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          // No session, check server user
          const { data: { user: serverUser } } = await supabase.auth.getUser();
          if (mounted && serverUser?.email_confirmed_at) {
            setUser(serverUser);
            await fetchProfile(serverUser.id);
          } else if (mounted && serverUser && !serverUser.email_confirmed_at) {
            // Email not confirmed
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          if (session?.user?.email_confirmed_at) {
            setUser(session.user);
            fetchProfile(session.user.id);
          } else {
            // User logged in but email not confirmed - sign out
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ supabase, user, loading, signOut, profile, updateProfile }}>
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