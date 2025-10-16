import { supabase } from '../../lib/supabase';
import { ReadsRepository } from './ReadsRepository';

export type MatchListItem = {
  matchId: string;
  otherId: string;
  name: string | null;
  photoUrl: string | null;
  lastMessage?: {
    id: string;
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread: boolean;
};

const readsRepo = new ReadsRepository();

export class MatchesRepository {
  async listMyMatches(): Promise<MatchListItem[]> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return [];

    // 1) fetch matches involving me
    const { data: matches, error: mErr } = await supabase
      .from('matches')
      .select('id, user_a, user_b, created_at')
      .or(`user_a.eq.${me},user_b.eq.${me}`)
      .order('created_at', { ascending: false });
    if (mErr) throw mErr;

    if (!matches || matches.length === 0) return [];

    const otherIds = matches.map(m => (m.user_a === me ? m.user_b : m.user_a));

    // 2) fetch profiles for "others"
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, photo_url')
      .in('id', otherIds);
    if (pErr) throw pErr;

    const profileById = new Map(profs?.map(p => [p.id, p]) ?? []);

    // 3) fetch latest messages for these matches in one go and pick the most recent per match
    const matchIds = matches.map(m => m.id);
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, body, created_at')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false })
      .limit(500); // enough to capture last per thread in dev
    if (msgErr) throw msgErr;

    const lastByMatch = new Map<string, any>();
    for (const m of msgs ?? []) {
      if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m);
    }

    // 4) fetch last reads for me
    const lastReads = await readsRepo.getLastReadsForMatches(matchIds);

    // 5) assemble with unread flag
    return matches.map(m => {
      const otherId = m.user_a === me ? m.user_b : m.user_a;
      const prof = profileById.get(otherId);
      const last = lastByMatch.get(m.id) ?? null;

      const lr = lastReads.get(m.id) ?? null;
      const unread =
        !!last &&
        last.sender_id !== me &&
        (!lr || new Date(last.created_at).getTime() > new Date(lr).getTime());

      return {
        matchId: m.id,
        otherId,
        name: prof?.display_name ?? null,
        photoUrl: prof?.photo_url ?? null,
        lastMessage: last,
        unread,
      };
    });
  }
}

