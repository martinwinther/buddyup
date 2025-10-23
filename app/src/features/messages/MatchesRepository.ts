import { supabase } from '../../lib/supabase';
import { ReadsRepository } from './ReadsRepository';
import { ThreadReadsRepository } from './ThreadReadsRepository';
import { BlocksRepository } from '../safety/BlocksRepository';

export type MatchListItem = {
  matchId: string;
  otherId: string;
  name: string | null;
  photoUrl: string | null;
  lastMessage?: { body: string; at: string; fromMe: boolean } | null;
  unread?: number;
};

const readsRepo = new ReadsRepository();
const threadReadsRepo = new ThreadReadsRepository();

async function lastMessageFor(matchId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, sender_id, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

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

    // 3) assemble basic match data
    const items = matches.map(m => {
      const otherId = m.user_a === me ? m.user_b : m.user_a;
      const prof = profileById.get(otherId);
      return {
        matchId: m.id,
        otherId,
        name: prof?.display_name ?? null,
        photoUrl: prof?.photo_url ?? null,
      };
    });

    // 4) filter out blocked users first
    const blocksRepo = new BlocksRepository();
    const { iBlocked, blockedMe } = await blocksRepo.loadAllRelated();
    const filteredItems = items.filter(item => !iBlocked.has(item.otherId) && !blockedMe.has(item.otherId));

    // 5) enhance with last message and unread counts
    const enhanced = [];
    for (const m of filteredItems) {
      const last = await lastMessageFor(m.matchId);
      enhanced.push({
        ...m,
        lastMessage: last ? { body: last.body as string, at: last.created_at as string, fromMe: last.sender_id === me } : null,
      });
    }

    // 6) fetch unread counts with the new repo
    const unread = await threadReadsRepo.unreadCounts(enhanced.map(e => e.matchId));
    return enhanced.map(e => ({ ...e, unread: unread[e.matchId] ?? 0 }));
  }
}

