import { supabase } from './supabase';

export type InboxThread = {
  other_user_id: string;
  other_name: string | null;
  other_photo_url: string | null;
  last_message: string | null;
  last_at: string | null;
  unread_count: number;
};

/**
 * Fetch all inbox threads for the current user.
 * Calls the RPC function get_inbox_threads which returns threads
 * ordered by last_at desc with unread counts.
 */
export async function fetchInbox(): Promise<InboxThread[]> {
  const { data, error } = await supabase.rpc('get_inbox_threads');
  if (error) throw error;
  return (data ?? []) as InboxThread[];
}

/**
 * Mark a thread as read by upserting to thread_reads.
 * This sets last_read_at to now() for the current user and the given other_user_id.
 */
export async function markThreadRead(otherUserId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('thread_reads')
    .upsert(
      {
        user_id: user.id,
        other_user_id: otherUserId,
        last_read_at: now,
      },
      { onConflict: 'user_id,other_user_id' }
    );

  if (error) {
    console.warn('[chat] markThreadRead failed:', error.message);
  }
}

/**
 * Get total unread count across all threads.
 * Useful for displaying a badge in the header/nav.
 */
export async function getTotalUnreadCount(): Promise<number> {
  const threads = await fetchInbox();
  return threads.reduce((sum, thread) => sum + thread.unread_count, 0);
}

/**
 * Upsert message read status for current user in a match.
 * Updates last_read_at in message_reads table.
 */
export async function upsertMessageRead(matchId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return;

  await supabase.from('message_reads').upsert(
    { user_id: uid, match_id: matchId, last_read_at: new Date().toISOString() },
    { onConflict: 'user_id,match_id' }
  );
}

/**
 * Listen to the other participant's read changes for this match.
 * Returns an unsubscribe function.
 */
export function listenOtherRead(
  matchId: string,
  otherUserId: string,
  onUpdate: (iso: string) => void
): () => void {
  const ch = supabase
    .channel(`reads:${matchId}:${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reads',
        filter: `match_id=eq.${matchId}`,
      },
      (payload: any) => {
        const row = payload.new ?? payload.old;
        if (row?.user_id === otherUserId && row?.last_read_at) {
          onUpdate(row.last_read_at);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(ch);
  };
}

