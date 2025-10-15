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

    // 3) exclude only right-swiped profiles (likes) - left swipes should cycle back
    const { data: liked } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', uid)
      .eq('direction', 'right');
    const excludeIds = (liked ?? []).map(r => r.target_id);
    excludeIds.push(uid); // also exclude self
    
    // 4a) get left-swiped profiles to deprioritize them
    const { data: disliked } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', uid)
      .eq('direction', 'left');
    const dislikedSet = new Set((disliked ?? []).map(r => r.target_id));

    // 4b) fetch candidate profiles, excluding only right-swiped
    let query = supabase
      .from('profiles')
      .select('id, display_name, age, bio, photo_url, last_active');
    
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data: profs, error: pErr } = await query
      .order('last_active', { ascending: false })
      .limit(limit * 3);
    if (pErr) throw pErr;

    const candidates = profs ?? [];

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

    // 6) score by overlap size, heavily penalize disliked profiles
    const scored: Candidate[] = candidates.map(c => {
      const others = new Set(catByUser.get(c.id) ?? []);
      let score = 0;
      for (const k of myActive) if (others.has(k)) score += 1;
      
      // deprioritize previously disliked profiles (send to bottom)
      if (dislikedSet.has(c.id)) {
        score -= 1000;
      }
      
      return {
        id: c.id,
        displayName: c.display_name ?? null,
        age: c.age ?? null,
        bio: c.bio ?? null,
        photoUrl: c.photo_url ?? null,
        score,
      };
    });

    // 7) sort by score desc - disliked profiles sink to bottom due to penalty
    scored.sort((a, b) => b.score - a.score);

    // 8) final limit
    return scored.slice(0, limit);
  }
}

