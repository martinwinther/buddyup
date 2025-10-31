import { supabase } from '../../lib/supabase';

export type UnreadRow = { other_user_id: string; unread: number; last_read_at: string | null };

export async function markThreadRead(otherUserId: string) {
  const { error } = await supabase.rpc('mark_thread_read', { other_id: otherUserId });
  if (error) throw error;
}

export async function getUnreadCounts(): Promise<UnreadRow[]> {
  const { data, error } = await supabase.rpc('get_unread_counts');
  if (error) throw error;
  return data ?? [];
}

export async function getOtherLastRead(otherUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('thread_reads')
    .select('last_read_at')
    .eq('user_id', otherUserId)
    .eq('other_user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle();

  if (error) return null;
  return (data?.last_read_at as string) ?? null;
}
