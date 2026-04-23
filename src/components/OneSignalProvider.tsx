'use client';

import { useEffect, useState, useCallback } from 'react';
import { initOneSignal, cleanupOneSignal } from '@/lib/onesignal/init';

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export function OneSignalProvider({ children }: OneSignalProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = useCallback(async () => {
    await cleanupOneSignal();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    console.log('🔔 OneSignalProvider: Starting initialization...');
    const startTime = Date.now();

    initOneSignal()
      .then((state) => {
        const duration = Date.now() - startTime;
        if (mounted) {
          console.log(`✅ OneSignal initialized successfully in ${duration}ms:`, {
            ...state,
            timestamp: new Date().toISOString(),
          });
          setInitialized(true);
        }
      })
      .catch((err) => {
        const duration = Date.now() - startTime;
        if (mounted) {
          console.error(`❌ OneSignal initialization failed after ${duration}ms:`, {
            error: err,
            timestamp: new Date().toISOString(),
          });
          setError(err?.message || 'OneSignal initialization failed');
        }
      });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  if (error) {
    console.warn('OneSignal not available:', error);
  }

  return <>{children}</>;
}
