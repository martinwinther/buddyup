import { supabase } from '../../lib/supabase';
import type { Candidate } from './types';

export class CandidatesRepository {
  async listCandidatesForMe(limit = 30): Promise<Candidate[]> {
    // 1) who am I?
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return [];

    // 2) my category ids
    const { data: myCats } = await supabase
      .from('user_categories')
      .select('category_id, active')
      .eq('user_id', uid);
    const myActive = new Set((myCats ?? []).filter(c => c.active !== false).map(c => c.category_id));

    // 3) already swiped targets (exclude)
    const { data: swiped } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', uid);
    const excludeSet = new Set((swiped ?? []).map(r => r.target_id));
    excludeSet.add(uid);

    // 4) fetch candidate profiles (basic fields), limit a bit larger initially
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, age, bio, photo_url, last_active')
      .order('last_active', { ascending: false })
      .limit(limit * 2);
    if (pErr) throw pErr;

    const candidates = (profs ?? []).filter(p => !excludeSet.has(p.id));

    // 5) get categories for those candidates (batch IDs)
    const ids = candidates.map(c => c.id);
    if (ids.length === 0) return [];
    const { data: cats } = await supabase
      .from('user_categories')
      .select('user_id, category_id, active')
      .in('user_id', ids);

    const catByUser = new Map<string, number[]>();
    for (const row of cats ?? []) {
      if (row.active === false) continue;
      const arr = catByUser.get(row.user_id) ?? [];
      arr.push(row.category_id);
      catByUser.set(row.user_id, arr);
    }

    // 6) score by overlap size (simple baseline)
    const scored: Candidate[] = candidates.map(c => {
      const others = new Set(catByUser.get(c.id) ?? []);
      let score = 0;
      for (const k of myActive) if (others.has(k)) score += 1;
      return {
        id: c.id,
        displayName: c.display_name ?? null,
        age: c.age ?? null,
        bio: c.bio ?? null,
        photoUrl: c.photo_url ?? null,
        score,
      };
    });

    // 7) sort by score desc, tie-break by recency already approximated by initial order
    scored.sort((a, b) => b.score - a.score);

    // 8) final limit
    return scored.slice(0, limit);
  }
}

