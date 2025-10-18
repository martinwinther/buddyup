import { supabase } from '../../lib/supabase';

export class ReportsRepository {
  async submit(targetId: string, reason: string, details?: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: me,
        target_id: targetId,
        reason,
        details: details ?? null,
      });
    if (error) throw error;
  }
}

