import { supabase } from '../../lib/supabase';

export type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'fake' | 'other';

export async function reportUser(opts: {
  reportedId: string;
  reason: ReportReason;
  details?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { error } = await supabase.from('reports').insert({
    reporter_id: uid,
    reported_id: opts.reportedId,
    reason: opts.reason,
    details: opts.details ?? null,
  });
  if (error) throw error;
}

export async function blockUser(targetId: string) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { error } = await supabase.from('blocks').insert({
    blocker_id: uid,
    blocked_id: targetId,
  });
  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function unblockUser(targetId: string) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { error } = await supabase.from('blocks')
    .delete()
    .eq('blocker_id', uid)
    .eq('blocked_id', targetId);
  if (error) throw error;
}

