import { supabase } from '../../lib/supabase';

export class BlocksRepository {
  async block(userId: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: me, blocked_id: userId });
    // ignore unique violation (already blocked)
    const code = (error as any)?.code;
    if (error && code !== '23505') throw error;
  }

  async unblock(userId: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', me)
      .eq('blocked_id', userId);
    if (error) throw error;
  }

  /** Users I blocked + users who blocked me */
  async loadAllRelated(): Promise<{ iBlocked: Set<string>; blockedMe: Set<string> }> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return { iBlocked: new Set(), blockedMe: new Set() };

    const { data, error } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${me},blocked_id.eq.${me}`);
    if (error) throw error;

    const iBlocked = new Set<string>();
    const blockedMe = new Set<string>();
    for (const r of data ?? []) {
      if (r.blocker_id === me) iBlocked.add(r.blocked_id);
      if (r.blocked_id === me) blockedMe.add(r.blocker_id);
    }
    return { iBlocked, blockedMe };
  }

  /** True if either side blocked the other */
  async isBlockedPair(otherId: string): Promise<boolean> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return false;
    const { data } = await supabase
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${me},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${me})`)
      .limit(1);
    return (data?.length ?? 0) > 0;
  }
}

