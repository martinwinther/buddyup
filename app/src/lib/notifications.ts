import { supabase } from './supabase';

export async function notifyNewMessage(params: {
  matchId: string;
  recipientId: string;
  preview: string;
  threadUrl?: string;
}) {
  const { data, error } = await supabase.functions.invoke('notify-message', {
    body: params,
  });

  if (error) {
    console.warn('[notify] invoke failed', error.message);
  }

  return { data, error };
}

