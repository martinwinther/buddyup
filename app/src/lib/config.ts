// src/lib/config.ts

export const SUPPORT_EMAIL =
  (process.env.EXPO_PUBLIC_SUPPORT_EMAIL as string | undefined) ??
  'support@buddyup.app';

