import { supabase } from '../../lib/supabase';

export type ReportReason = 'harassment' | 'spam' | 'inappropriate' | 'fake' | 'underage' | 'other';

export class ReportsRepository {
  async submit(reportedId: string, reason: ReportReason, details?: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    if (me === reportedId) throw new Error('CANNOT_REPORT_SELF');

    const { error } = await supabase.from('reports').insert({
      reporter_id: me,
      reported_id: reportedId,
      reason,
      details: details?.trim() || null,
    });
    if (error) throw error;
  }

  async block(reportedId: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    if (me === reportedId) return;

    // idempotent: ignore duplicate violation
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: me, blocked_id: reportedId })
      .select('blocked_id')
      .maybeSingle();
    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
  }
}