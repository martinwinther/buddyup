import { supabase } from '../../lib/supabase';

export class ReadsRepository {
  async markRead(matchId: string) {
    const { data: s } = await supabase.auth.getSession();
    const userId = s?.session?.user?.id;
    if (!userId) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('message_reads')
      .upsert(
        { user_id: userId, match_id: matchId, last_read_at: now },
        { onConflict: 'user_id,match_id' }
      );
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[reads] markRead failed', error);
    }
  }

  async getLastReadsForMatches(matchIds: string[]) {
    const { data: s } = await supabase.auth.getSession();
    const userId = s?.session?.user?.id;
    if (!userId || matchIds.length === 0) return new Map<string, string | null>();

    const { data, error } = await supabase
      .from('message_reads')
      .select('match_id, last_read_at')
      .eq('user_id', userId)
      .in('match_id', matchIds);

    if (error) return new Map();

    const map = new Map<string, string | null>();
    for (const row of data ?? []) map.set(row.match_id, row.last_read_at);
    return map;
  }
}

