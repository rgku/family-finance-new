"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/hooks/useNotifications";
import { useOneSignal } from "@/hooks/useOneSignal";
import { useAuth } from "@/components/AuthProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { isPushEnabled, loading: oneSignalLoading, error: oneSignalError, subscribe, unsubscribe } = useOneSignal();
  const { signOut } = useAuth();
  const isMobile = useDeviceType();
  
  const { preferences, isLoading, error, update } = useNotificationPreferences();
  
  // Default preferences when table doesn't exist
  const defaultPrefs = {
    budget_80_percent: true,
    budget_100_percent: true,
    goal_achieved: true,
  };
  
  const prefs = (preferences as typeof defaultPrefs) || defaultPrefs;

  const handleToggle = async (key: string, value: boolean) => {
    if (error) {
      setMessage({ type: 'error', text: 'Tabela não configurada. Executa a migration no Supabase.' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    
    setLoading(true);
    try {
      await update({ [key]: value });
      setMessage({ type: 'success', text: 'Preferências atualizadas!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar preferências' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      // ✅ Check browser permission first
      if (Notification.permission === 'denied') {
        setMessage({ 
          type: 'error', 
          text: 'Notificações bloqueadas. Para ativar: Configurações do Browser > Notificações' 
        });
        setLoading(false);
        return;
      }
      
      // Check if OneSignal is available
      if (!window.OneSignal) {
        throw new Error('OneSignal não está disponível');
      }
      
      // Check if OneSignal is initialized
      const oneSignalAny = window.OneSignal as { initialized?: boolean };
      if (!oneSignalAny?.initialized) {
        setMessage({ 
          type: 'error', 
          text: 'OneSignal ainda está a carregar. Aguarda alguns segundos e tenta novamente.' 
        });
        setLoading(false);
        return;
      }
      
      const success = await subscribe();
      
      if (success) {
        setMessage({ type: 'success', text: 'Notificações push ativadas!' });
      } else {
        setMessage({ type: 'error', text: oneSignalError || 'Permissão negada ou erro ao ativar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao ativar notificações' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDisablePush = async () => {
    setLoading(true);
    try {
      await unsubscribe();
      setMessage({ type: 'success', text: 'Notificações push desativadas' });
    } catch (error) {
      console.error('Erro ao desativar push:', error);
      setMessage({ type: 'error', text: 'Erro ao desativar notificações' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const pageContent = (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Notificações</h1>
        <p className="text-on-surface-variant">Gerencia as tuas preferências de notificação</p>
      </header>

      <div className="max-w-3xl space-y-6">
        {/* Push Notifications Status */}
        <div className="bg-surface-container rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isPushEnabled ? 'bg-primary/20' : 'bg-surface-container-highest'
              }`}>
                <Icon 
                  name={isPushEnabled ? 'notifications' : 'notifications_off'} 
                  size={24} 
                  className={isPushEnabled ? 'text-primary' : 'text-on-surface-variant'} 
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Notificações Push</h3>
                <p className="text-sm text-on-surface-variant">
                  {isPushEnabled 
                    ? 'Ativas - Recebe alertas mesmo com o browser fechado' 
                    : 'Inativas - Ativa para receber alertas'}
                </p>
              </div>
            </div>
          </div>

          {isPushEnabled ? (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="check_circle" size={20} />
                <span className="text-sm font-bold">Ativas</span>
              </div>
              <button
                onClick={handleDisablePush}
                disabled={loading || oneSignalLoading}
                className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                Desativar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleEnablePush}
                disabled={loading || oneSignalLoading}
                className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {oneSignalLoading ? 'A carregar...' : 'Ativar Notificações'}
              </button>
            </div>
          )}

          {oneSignalError && (
            <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{oneSignalError}</p>
            </div>
          )}

          <p className="text-xs text-on-surface-variant mt-4">
            ℹ️ Requer browser moderno (Chrome, Firefox, Edge, Safari)
          </p>
        </div>

        {/* Notification Types */}
        {isLoading ? (
          <div className="text-center py-12 text-on-surface-variant">
            <p>A carregar preferências...</p>
          </div>
        ) : error ? (
          <div className="bg-surface-container rounded-lg p-6 text-center">
            <Icon name="info" size={48} className="mx-auto mb-4 text-on-surface-variant opacity-50" />
            <h3 className="font-bold text-lg text-on-surface mb-2">Preferências não disponíveis</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              As preferências de notificação requerem configuração adicional da base de dados.
            </p>
            <p className="text-xs text-on-surface-variant bg-surface-container-high inline-block px-4 py-2 rounded-lg">
              ℹ️ Executa a migration <code className="font-mono">20270424000000_push_notifications.sql</code> no Supabase
            </p>
          </div>
        ) : (
          <div className="bg-surface-container rounded-lg p-6">
            <h3 className="font-bold text-lg text-on-surface mb-6">Tipos de Notificação</h3>

            <div className="space-y-4">
              {/* Budget 80% */}
              <div className="flex items-center justify-between py-3 border-b border-surface-container-highest">
                <div className="flex items-center gap-3">
                  <Icon name="pie_chart" size={24} className="text-tertiary" />
                  <div>
                    <p className="font-medium text-on-surface">Orçamento 80%</p>
                    <p className="text-sm text-on-surface-variant">
                      Quando atingires 80% do orçamento de uma categoria
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.budget_80_percent}
                    onChange={(e) => handleToggle('budget_80_percent', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading || !!error}
                  />
                  <div className="w-14 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-colors"></div>
                  <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7"></div>
                </label>
              </div>

              {/* Budget 100% */}
              <div className="flex items-center justify-between py-3 border-b border-surface-container-highest">
                <div className="flex items-center gap-3">
                  <Icon name="warning" size={24} className="text-error" />
                  <div>
                    <p className="font-medium text-on-surface">Orçamento Esgotado</p>
                    <p className="text-sm text-on-surface-variant">
                      Quando ultrapassares o limite do orçamento
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.budget_100_percent}
                    onChange={(e) => handleToggle('budget_100_percent', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading || !!error}
                  />
                  <div className="w-14 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-colors"></div>
                  <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7"></div>
                </label>
              </div>

              {/* Goal Achieved */}
              <div className="flex items-center justify-between py-3 border-b border-surface-container-highest">
                <div className="flex items-center gap-3">
                  <Icon name="emoji_events" size={24} className="text-secondary" />
                  <div>
                    <p className="font-medium text-on-surface">Meta Atingida</p>
                    <p className="text-sm text-on-surface-variant">
                      Quando completares uma meta de poupança
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.goal_achieved}
                    onChange={(e) => handleToggle('goal_achieved', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading || !!error}
                  />
                  <div className="w-14 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-colors"></div>
                  <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`rounded-lg p-4 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-primary/20' : 'bg-error/20'
          }`}>
            <Icon
              name={message.type === 'success' ? 'check_circle' : 'error'}
              size={24}
              className={message.type === 'success' ? 'text-primary' : 'text-error'}
            />
            <p className={`font-medium ${
              message.type === 'success' ? 'text-primary' : 'text-error'
            }`}>
              {message.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-3xl mx-auto">
        {pageContent}
      </div>
    </div>
  );
}
