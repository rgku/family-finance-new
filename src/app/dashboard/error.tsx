"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Icon } from "@/components/Icon";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-on-surface-variant">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <Icon name="lock" size={64} className="text-tertiary mx-auto" />
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Acesso Não Autorizado
          </h1>
          <p className="text-on-surface-variant">
            Precisas de fazer login para aceder ao dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <Icon name="error" size={64} className="text-tertiary mx-auto" />
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Oops! Algo correu mal
        </h1>
        <p className="text-on-surface-variant">
          Ocorreu um erro ao carregar o dashboard. Tenta novamente.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-6 py-3 bg-surface-container text-on-surface rounded-full font-bold hover:bg-surface-container-high transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left mt-4 p-4 bg-surface-container-low rounded-lg">
            <summary className="cursor-pointer text-sm font-semibold text-on-surface-variant">
              Detalhes do Erro (Development)
            </summary>
            <pre className="mt-2 text-xs text-tertiary overflow-auto max-h-64">
              {error.message}
              {error.stack && (
                <>
                  {"\n\n"}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
