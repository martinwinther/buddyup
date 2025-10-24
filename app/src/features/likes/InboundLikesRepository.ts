import { supabase } from '../../lib/supabase';

export type InboundLikeRow = {
  user_id: string;           // swiper (the person who liked me)
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  liked_at: string;          // swipes.created_at
};

export class InboundLikesRepository {
  async list(limit = 100): Promise<InboundLikeRow[]> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return [];

    // Get swipes where they liked me (right)
    const { data, error } = await supabase
      .from('swipes')
      .select(`
        created_at,
        swiper_id,
        profiles!swipes_swiper_id_fkey (
          display_name, age, bio, photo_url
        )
      `)
      .eq('direction', 'right')
      .eq('target_id', me)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      user_id: r.swiper_id as string,
      display_name: r.profiles?.display_name ?? null,
      age: r.profiles?.age ?? null,
      bio: r.profiles?.bio ?? null,
      photo_url: r.profiles?.photo_url ?? null,
      liked_at: r.created_at as string,
    }));
  }

  async ensureRightSwipe(toUserId: string) {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    if (me === toUserId) return;

    // Check if I already liked them
    const { data: existing, error: selErr } = await supabase
      .from('swipes')
      .select('id')
      .eq('swiper_id', me)
      .eq('target_id', toUserId)
      .eq('direction', 'right')
      .limit(1);
    if (selErr) throw selErr;
    if (existing && existing.length) return;

    const { error: insErr } = await supabase
      .from('swipes')
      .insert({ swiper_id: me, target_id: toUserId, direction: 'right' });
    if (insErr && !String(insErr.message || '').includes('duplicate')) throw insErr;
  }

  async ensureThread(withUserId: string): Promise<string> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');
    const a = me < withUserId ? me : withUserId;
    const b = me < withUserId ? withUserId : me;

    // find existing
    const { data: found, error: findErr } = await supabase
      .from('matches')
      .select('id,user_a,user_b')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    if (!findErr && found?.id) return found.id as string;

    // create
    const { data: created, error: insErr } = await supabase
      .from('matches')
      .insert({ user_a: a, user_b: b })
      .select('id')
      .single();
    if (insErr) throw insErr;
    return created!.id as string;
  }
}
