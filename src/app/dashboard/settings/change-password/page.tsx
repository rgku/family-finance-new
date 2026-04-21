"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSupabase } from "@/hooks/useSupabase";
import { Icon } from "@/components/Icon";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        setError("Password atual incorreta");
        setLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Password alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError("Erro ao alterar password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Icon name="lock" size={60} className="text-6xl text-on-surface-variant mb-4" />
          <p className="text-on-surface-variant">Precisas de estar logged in para alterar a password</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Alterar Password</h1>
          <p className="text-on-surface-variant mt-2">Altera a tua password de acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Password Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              required
            />
          </div>

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

          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}

          {message && (
            <p className="text-primary text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "A alterar..." : "Alterar Password"}
          </button>
        </form>

        <p className="text-center mt-6 text-on-surface-variant text-sm">
          <a href="/dashboard/profile" className="text-primary hover:underline">
            ← Voltar ao Perfil
          </a>
        </p>
      </div>
    </div>
  );
}