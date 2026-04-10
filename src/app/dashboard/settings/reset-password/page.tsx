"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/useSupabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useSupabase();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidToken(true);
      } else {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && type === 'recovery' && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setIsValidToken(true);
        } else {
          setError("Link de recuperação inválido ou expirado. Por favor, solicita um novo email.");
        }
      }
    };
    checkSession();
  }, [supabase]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Password redefinida com sucesso! Vai ser redirecionado para o login.");
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setError("Erro ao redefinir password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">lock</span>
          <h1 className="text-2xl font-bold text-on-surface">Nova Password</h1>
          <p className="text-on-surface-variant mt-2">
            {isValidToken ? "Introduz a tua nova password." : "Link de recuperação inválido ou expirado."}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
            <p className="text-error text-sm text-center">{error}</p>
            <p className="text-on-surface-variant text-xs text-center mt-2">
              <a href="/forgot-password" className="text-primary hover:underline">Solicitar novo link</a>
            </p>
          </div>
        )}

        {isValidToken && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Nova Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Confirmar Nova Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p className="text-primary text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "A guardar..." : "Guardar Nova Password"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}