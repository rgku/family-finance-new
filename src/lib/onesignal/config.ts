/**
 * OneSignal Configuration
 * Get your credentials from: https://onesignal.com
 */

export const ONE_SIGNAL_CONFIG = {
  appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
  allowLocalhostAsSecureOrigin: true,
  requireUserInteractionPromise: true,
} as const;

export type OneSignalConfig = typeof ONE_SIGNAL_CONFIG;
