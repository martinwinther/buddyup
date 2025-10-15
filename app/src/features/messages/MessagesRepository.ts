import { supabase } from '../../lib/supabase';

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export class MessagesRepository {
  async list(matchId: string, limit = 100): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  async send(matchId: string, body: string): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    const { error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: me, body });
    if (error) throw error;
  }

  // realtime subscription for new messages in a match
  subscribe(matchId: string, cb: (msg: ChatMessage) => void) {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        payload => cb(payload.new as ChatMessage)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
}

