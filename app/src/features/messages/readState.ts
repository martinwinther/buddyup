import { supabase } from '../../lib/supabase';

/** Persist last_read_at for (user_id, match_id) */
export async function markThreadRead(uid: string, matchId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('message_reads')
    .upsert(
      { user_id: uid, match_id: matchId, last_read_at: now },
      { onConflict: 'user_id,match_id' }
    );
  if (error) console.warn('[read] upsert failed:', error.message);
}

