/**
 * OneSignal Initialization
 * Initializes OneSignal SDK and handles subscription
 */

import { ONE_SIGNAL_CONFIG } from './config';

declare global {
  interface Window {
    OneSignal?: any;
  }
}

export interface OneSignalSubscriptionState {
  isSubscribed: boolean;
  isPushEnabled: boolean;
  playerId: string | null;
}

let initialized = false;
let subscriptionState: OneSignalSubscriptionState = {
  isSubscribed: false,
  isPushEnabled: false,
  playerId: null,
};

export async function initOneSignal(): Promise<OneSignalSubscriptionState> {
  if (initialized) {
    console.log('OneSignal already initialized, returning cached state');
    return subscriptionState;
  }

  if (!ONE_SIGNAL_CONFIG.appId) {
    console.error('OneSignal App ID not configured');
    return subscriptionState;
  }

  try {
    await loadOneSignalSDK();

    if (!window.OneSignal) {
      throw new Error('OneSignal SDK não carregou');
    }

    console.log('OneSignal SDK loaded, initializing with App ID:', ONE_SIGNAL_CONFIG.appId);

    try {
      await window.OneSignal.init({
        appId: ONE_SIGNAL_CONFIG.appId,
        allowLocalhostAsSecureOrigin: ONE_SIGNAL_CONFIG.allowLocalhostAsSecureOrigin,
        requireUserInteractionPromise: ONE_SIGNAL_CONFIG.requireUserInteractionPromise,
        notifyButton: {
          enable: false,
        },
      });

      console.log('OneSignal.init() completed');
    } catch (initError: any) {
      if (!initError.message.includes('already been initialized')) {
        console.error('OneSignal.init() failed:', initError);
        throw new Error('OneSignal.init() falhou: ' + initError.message);
      }
      console.log('OneSignal already initialized, continuing...');
    }

    // Wait for initialization to fully complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('OneSignal structure:', {
      initialized: window.OneSignal.initialized,
      hasIsSubscribed: typeof window.OneSignal.isSubscribed === 'function',
      hasIsPushEnabled: typeof window.OneSignal.isPushEnabled === 'function',
      hasGetUserId: typeof window.OneSignal.getUserId === 'function',
    });

    // OneSignal v15 uses direct methods instead of nested APIs
    // Get subscription state using v15 API
    let isSubscribed = false;
    let isPushEnabled = false;
    let playerId: string | null = null;

    try {
      // v15 API: Direct methods on window.OneSignal
      if (typeof window.OneSignal.isSubscribed === 'function') {
        isSubscribed = await window.OneSignal.isSubscribed();
      }
      if (typeof window.OneSignal.isPushEnabled === 'function') {
        isPushEnabled = await window.OneSignal.isPushEnabled();
      }
      if (typeof window.OneSignal.getUserId === 'function') {
        playerId = await window.OneSignal.getUserId();
      }
    } catch (e) {
      console.error('Error getting subscription state:', e);
    }

    subscriptionState = {
      isSubscribed,
      isPushEnabled,
      playerId,
    };

    initialized = true;
    console.log('✅ OneSignal state:', subscriptionState);

    return subscriptionState;
  } catch (error: any) {
    console.error('❌ OneSignal initialization failed:', error.message);
    return subscriptionState;
  }
}

export async function subscribeToPush(): Promise<string | null> {
  if (!window.OneSignal) {
    throw new Error('OneSignal não está disponível');
  }

  console.log('=== SUBSCRIBE START (v15 API) ===');
  
  try {
    // v15 API: registerForPushNotifications returns a Promise
    // Note: In v15, this method may not return a value in some versions
    const result = await window.OneSignal.registerForPushNotifications();
    
    console.log('registerForPushNotifications result:', result);
    
    // Wait a bit for subscription to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the subscription ID after registration
    const subscriptionId = await window.OneSignal.getUserId();
    
    if (subscriptionId) {
      console.log('✅ Successfully subscribed with ID:', subscriptionId);
      return subscriptionId;
    }
    
    throw new Error('Não foi possível obter o ID de subscrição');
  } catch (error: any) {
    console.error('❌ subscribeToPush error:', error);
    throw error;
  }
}

export async function saveOneSignalSubscription(userId: string, playerId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const userAgent = navigator.userAgent;
    const browserInfo = getBrowserInfo(userAgent);
    
    const { error } = await supabase
      .from('onesignal_subscriptions')
      .upsert({
        user_id: userId,
        onesignal_player_id: playerId,
        browser_name: browserInfo.name,
        browser_version: browserInfo.version,
        os_name: browserInfo.os,
        os_version: browserInfo.osVersion,
        subscription_state: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    if (error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

function getBrowserInfo(userAgent: string) {
  // Simple browser detection
  let name = 'Unknown';
  let version = 'Unknown';
  let os = 'Unknown';
  let osVersion = 'Unknown';
  
  // Detect browser
  if (userAgent.includes('Chrome')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Safari')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Edge')) {
    name = 'Edge';
    const match = userAgent.match(/Edge\/([\d.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    osVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }
  
  return { name, version, os, osVersion };
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    // v15 API: Clear all notifications
    if (window.OneSignal?.clearAllNotifications) {
      await window.OneSignal.clearAllNotifications();
      console.log('✅ Notifications cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
}

export function getOneSignalState(): OneSignalSubscriptionState {
  return subscriptionState;
}

/**
 * Helper function to wait for OneSignal to be fully initialized
 */
export async function waitForOneSignal(maxRetries: number = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    if (window.OneSignal?.initialized) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('OneSignal não inicializou após 5 segundos');
}

export async function cleanupOneSignal(): Promise<void> {
  try {
    // v15 API: Clear all notifications
    if (window.OneSignal?.clearAllNotifications) {
      await window.OneSignal.clearAllNotifications();
    }
    initialized = false;
    subscriptionState = {
      isSubscribed: false,
      isPushEnabled: false,
      playerId: null,
    };
  } catch (error) {
    console.error('❌ Cleanup OneSignal error:', error);
  }
}

async function loadOneSignalSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.OneSignal) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      const checkLoaded = setInterval(() => {
        if (window.OneSignal) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('OneSignal SDK timeout'));
      }, 10000);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load OneSignal SDK script'));
    };
    
    document.head.appendChild(script);
  });
}
