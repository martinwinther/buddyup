import { supabase } from '../../lib/supabase';

type RecordSwipeResult = { 
  matched?: boolean;
  matchId?: string;
  otherId?: string;
};

export async function recordSwipe(targetId: string, direction: 'left' | 'right' | 'super'): Promise<RecordSwipeResult> {
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
    console.warn('[swipes] insert error', insErr);
    throw insErr;
  }

  if (direction === 'left') return {};

  // 2) 1-way messaging: create/get a thread row now
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

export class SwipesRepository {
  async recordSwipe(targetId: string, direction: 'left' | 'right' | 'super'): Promise<RecordSwipeResult> {
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
      console.warn('[swipes] insert error', insErr);
      throw insErr;
    }

    if (direction === 'left') return {};

    // 2) 1-way messaging: create/get a thread row now
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

