"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Icon } from "./Icon";

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncPending } = useOfflineSync();

  // Don't show anything when online and no pending items
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  const handleSync = async () => {
    await syncPending();
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300">
      <div className={`rounded-full px-4 py-2 shadow-lg flex items-center gap-2 ${
        !isOnline 
          ? 'bg-error text-white' 
          : isSyncing
          ? 'bg-primary text-white'
          : 'bg-surface-container-high text-on-surface'
      }`}>
        {!isOnline ? (
          <>
            <Icon name="wifi_off" size={18} />
            <span className="text-sm font-medium">Offline - {pendingCount} pendentes</span>
          </>
        ) : isSyncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">A sincronizar...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Icon name="sync" size={18} />
            <span className="text-sm font-medium">{pendingCount} para sincronizar</span>
            <button
              onClick={handleSync}
              className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold hover:bg-white/30 transition-colors"
            >
              Sincronizar
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
