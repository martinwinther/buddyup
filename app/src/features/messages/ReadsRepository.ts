import { supabase } from '../../lib/supabase';

export type UnreadRow = { 
  match_id: string;
  other_user_id: string; 
  unread: number; 
  last_read_at: string | null;
};

/**
 * @deprecated Use markThreadRead from readState.ts instead
 * This RPC-based version is kept for backward compatibility but should not be used
 */
export async function markThreadRead(otherUserId: string) {
  console.warn('[ReadsRepository] markThreadRead is deprecated. Use readState.markThreadRead instead.');
  const { error } = await supabase.rpc('mark_thread_read', { other_id: otherUserId });
  if (error) throw error;
}

export async function getUnreadCounts(): Promise<UnreadRow[]> {
  const { data, error } = await supabase.rpc('get_unread_counts');
  if (error) throw error;
  return data ?? [];
}

export async function getOtherLastRead(matchId: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const me = userData.user?.id;
  if (!me) return null;

  // Get the other user in this match
  const { data: match } = await supabase
    .from('matches')
    .select('user_a, user_b')
    .eq('id', matchId)
    .maybeSingle();
  
  if (!match) return null;
  const otherId = match.user_a === me ? match.user_b : match.user_a;

  // Get their last read time for this match
  const { data, error } = await supabase
    .from('message_reads')
    .select('last_read_at')
    .eq('user_id', otherId)
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) return null;
  return (data?.last_read_at as string) ?? null;
}
