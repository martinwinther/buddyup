import { supabase } from '../../lib/supabase';

type RecordSwipeResult = { 
  matched?: boolean;
  matchId?: string;
  otherId?: string;
};

export class SwipesRepository {
  async recordSwipe(targetId: string, direction: 'left' | 'right'): Promise<RecordSwipeResult> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    // 1) insert my swipe (optimistic; ignore 409)
    const { error: insErr } = await supabase.from('swipes').insert({
      swiper_id: uid,
      target_id: targetId,
      direction,
    });
    if (insErr && (insErr as any).code !== '23505') {
      // non-unique error → bubble up; UI can ignore/continue
      console.warn('[swipes] insert error', insErr);
    }

    if (direction === 'left') return {};

    // 2) if right swipe, check for mutual right
    const { data: mutual, error: mErr } = await supabase
      .from('swipes')
      .select('id')
      .eq('swiper_id', targetId)
      .eq('target_id', uid)
      .eq('direction', 'right')
      .maybeSingle();
    if (mErr) {
      console.warn('[swipes] mutual check error', mErr);
      return {};
    }
    if (!mutual) return {};

    // 3) prevent duplicate matches & get or create matchId
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a.eq.${uid},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${uid})`)
      .maybeSingle();

    let matchId = existing?.id;
    if (!matchId) {
      const { data: created, error: matchErr } = await supabase
        .from('matches')
        .insert({ user_a: uid, user_b: targetId })
        .select('id')
        .single();
      if (matchErr) {
        console.warn('[matches] insert error', matchErr);
      } else {
        matchId = created?.id;
      }
    }

    return { matched: true, matchId, otherId: targetId };
  }
}

