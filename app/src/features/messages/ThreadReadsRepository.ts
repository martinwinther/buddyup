import { supabase } from '../../lib/supabase';

export class ThreadReadsRepository {
  async markRead(matchId: string) {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const { error } = await supabase
      .from('thread_reads')
      .upsert({ user_id: uid, match_id: matchId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,match_id' });
    if (error) throw error;
  }

  /**
   * Return unread counts keyed by matchId for current user.
   * Uses server-side computed counts via an RPC-like query built with supabase.
   */
  async unreadCounts(matchIds: string[]): Promise<Record<string, number>> {
    if (matchIds.length === 0) return {};
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return {};

    // Fetch read markers for these threads
    const { data: reads, error: rErr } = await supabase
      .from('thread_reads')
      .select('match_id, last_read_at')
      .in('match_id', matchIds)
      .eq('user_id', uid);
    if (rErr) throw rErr;

    const mapLastRead = new Map<string, string | null>();
    for (const mid of matchIds) mapLastRead.set(mid, null);
    for (const r of reads ?? []) mapLastRead.set(r.match_id as string, r.last_read_at as string);

    // For each thread, count messages from others after last_read_at
    const result: Record<string, number> = {};
    for (const mid of matchIds) {
      const fromTs = mapLastRead.get(mid);
      const q = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', mid);
      if (fromTs) q.gt('created_at', fromTs);
      const { data: s2 } = await supabase.auth.getSession();
      const me = s2?.session?.user?.id;
      const { count, error } = await q.neq('sender_id', me);
      if (error) throw error;
      result[mid] = count ?? 0;
    }
    return result;
  }
}
