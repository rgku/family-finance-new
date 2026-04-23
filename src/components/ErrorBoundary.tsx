"use client";

import { Component, ReactNode } from "react";
import { Icon } from "@/components/Icon";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  includeResetButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.debug('Error boundary details:', errorInfo.componentStack);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-container rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto">
              <Icon name="error" size={32} className="text-error" />
            </div>
            
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
                Algo correu mal
              </h2>
              <p className="text-on-surface-variant text-sm">
                Ocorreu um erro inesperado. Por favor, tenta recarregar a página.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-surface-container-high rounded-lg p-4 text-left">
                <p className="text-xs text-error font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
            >
              Recarregar Página
            </button>

            {this.props.includeResetButton !== false && (
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 bg-surface-container-high text-on-surface font-semibold rounded-full hover:bg-surface-container-highest transition-all"
              >
                Voltar ao Início
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto">
          <Icon name="error" size={32} className="text-error" />
        </div>
        
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            Algo correu mal
          </h2>
          <p className="text-on-surface-variant text-sm">
            Ocorreu um erro inesperado. Tente novamente.
          </p>
        </div>

        <div className="bg-surface-container-high rounded-lg p-4 text-left">
          <p className="text-xs text-error font-mono break-all">
            {error.message}
          </p>
        </div>

        <button
          onClick={resetErrorBoundary}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
