import { supabase } from '../../lib/supabase';

type Unsub = () => void;

/** Live inserts for a specific match */
export function subscribeToMatchMessages(matchId: string, cb: (row: any) => void): Unsub {
  const channel = supabase.channel(`msg-${matchId}`);
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
    (payload) => cb(payload.new)
  );
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

