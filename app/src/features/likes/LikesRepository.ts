import { supabase } from '../../lib/supabase';
import { recordSwipe } from '../discover/SwipesRepository';

export type LikeItem = {
  userId: string;
  displayName: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  likedAt: string;
  matchId: string | null;
};

export class LikesRepository {
  /**
   * Returns distinct people who liked me (right-swiped), newest first.
   * Also detects if a thread already exists (either party right-swiped).
   */
  async list(): Promise<LikeItem[]> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return [];

    // 1) Get recent right-swipes into me (dedupe by swiper_id; newest)
    const { data: swipes, error: swErr } = await supabase
      .from('swipes')
      .select('swiper_id, created_at')
      .eq('target_id', me)
      .eq('direction', 'right')
      .order('created_at', { ascending: false })
      .limit(400);
    if (swErr) throw swErr;

    // Deduplicate by swiper_id (keep newest timestamp)
    const latestByUser = new Map<string, string>();
    for (const r of swipes ?? []) {
      if (!latestByUser.has(r.swiper_id)) latestByUser.set(r.swiper_id, r.created_at as string);
    }
    const userIds = Array.from(latestByUser.keys());
    if (userIds.length === 0) return [];

    // 2) Load their profiles
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, age, bio, photo_url')
      .in('id', userIds);
    if (pErr) throw pErr;
    const pById = new Map((profs ?? []).map(p => [p.id, p]));

    // 3) Find existing threads (matches) between me and those users
    const { data: threads, error: mErr } = await supabase
      .from('matches')
      .select('id, user_a, user_b')
      .or(userIds.map(uid => `and(user_a.eq.${me},user_b.eq.${uid}),and(user_a.eq.${uid},user_b.eq.${me})`).join(','));
    if (mErr) throw mErr;

    const matchByOther = new Map<string, string>();
    for (const t of threads ?? []) {
      const other = t.user_a === me ? t.user_b : t.user_a;
      matchByOther.set(other, t.id);
    }

    // 4) Assemble items
    const items: LikeItem[] = userIds.map(uid => {
      const prof = pById.get(uid);
      return {
        userId: uid,
        displayName: prof?.display_name ?? null,
        age: prof?.age ?? null,
        bio: prof?.bio ?? null,
        photoUrl: prof?.photo_url ?? null,
        likedAt: latestByUser.get(uid)!,
        matchId: matchByOther.get(uid) ?? null,
      };
    });

    // newest first by likedAt
    items.sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
    return items;
  }

  /**
   * Ensure thread exists, return matchId.
   */
  async ensureThreadWith(userId: string): Promise<string> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) throw new Error('NO_SESSION');

    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a.eq.${me},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${me})`)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // Creating a thread via our swipe rule (right swipe)
    const res = await recordSwipe(userId, 'right');
    if (res?.matchId) return res.matchId;

    // Fallback: try direct insert if needed
    const { data: created, error } = await supabase
      .from('matches')
      .insert({ user_a: me, user_b: userId })
      .select('id')
      .single();
    if (error) throw error;
    return created.id;
  }

  /**
   * Subscribe to new incoming likes.
   */
  subscribeToIncoming(cb: (payload: { swiper_id: string; created_at: string }) => void) {
    const ch = supabase
      .channel('likes-incoming')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'swipes',
        filter: `direction=eq.right`,
      }, (payload) => {
        // Only care if it's into me
        const row = payload.new as any;
        supabase.auth.getSession().then(({ data }) => {
          const me = data.session?.user?.id;
          if (row?.target_id === me) cb({ swiper_id: row.swiper_id, created_at: row.created_at });
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }
}

