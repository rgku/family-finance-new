"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabase } from "@/hooks/useSupabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          setError(error.message);
        } else if (data.user) {
          // Verify email is confirmed by fetching user data
          const { data: userData } = await supabase.auth.getUser();
          
          if (!userData.user?.email_confirmed_at) {
            // Sign out since email is not confirmed
            await supabase.auth.signOut();
            setError("Confirma o teu email antes de entrar. Verifica a tua caixa de correio.");
          } else {
            router.push("/dashboard");
          }
        }
      } else {
        // Signup with detailed error logging
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || "",
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        console.log("Signup response:", { error, data });
        
        if (error) {
          console.error("Signup error:", error);
          setError(error.message);
        } else if (data.user) {
          // User created, may or may not require email confirmation
          console.log("User created:", data.user.id);
          setError("Conta criada! Verifica o teu email para confirmar.");
        } else {
          setError("Erro ao criar conta. Tenta novamente.");
        }
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
            FamFlow
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Gestão financeira familiar em tempo real
          </p>
        </div>

        <div className="bg-surface-container rounded-lg p-8 space-y-6">
          <div className="flex gap-2 bg-surface-container-low rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                isLogin 
                  ? "bg-surface-container-highest text-on-surface" 
                  : "text-on-surface-variant"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                !isLogin 
                  ? "bg-surface-container-highest text-on-surface" 
                  : "text-on-surface-variant"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Seu nome"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="seu@email.com"
                required
                aria-describedby={error ? "auth-error" : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p id="auth-error" className="text-error text-sm text-center" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "A processar..." : isLogin ? "Entrar" : "Criar Conta"}
            </button>
          </form>

          {isLogin && (
            <p className="text-center">
              <Link href="/forgot-password" className="text-primary font-semibold hover:underline">
                Esqueceu a password?
              </Link>
            </p>
          )}

          <p className="text-center text-on-surface-variant text-sm">
            {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}