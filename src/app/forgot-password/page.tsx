"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Email de recuperação enviado! Verifica a tua caixa de correio.");
        setEmail("");
      }
    } catch (err) {
      setError("Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">lock_reset</span>
          <h1 className="text-2xl font-bold text-on-surface">Esqueci a Password</h1>
          <p className="text-on-surface-variant mt-2">
            Enter o teu email e vamos enviar-te um link para redefinir a password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-slate-600"
              placeholder="teu@email.com"
              required
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
            {loading ? "A enviar..." : "Enviar Link de Recuperação"}
          </button>
        </form>

        <p className="text-center mt-6 text-on-surface-variant text-sm">
          Lembraste da password? <Link href="/" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}