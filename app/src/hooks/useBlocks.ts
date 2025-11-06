import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useBlocks() {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedByIds, setBlockedByIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      if (!me) {
        setLoading(false);
        return;
      }

      const [mine, theirs] = await Promise.all([
        supabase.from('blocks').select('blocked_id').eq('blocker_id', me),
        supabase.from('blocks').select('blocker_id').eq('blocked_id', me),
      ]);

      if (cancelled) return;

      setBlockedIds((mine.data ?? []).map(r => r.blocked_id));
      setBlockedByIds((theirs.data ?? []).map(r => r.blocker_id));
      setLoading(false);
    })();

    return () => { 
      cancelled = true; 
    };
  }, []);

  const isBlocked = useMemo(
    () => (otherId: string) => blockedIds.includes(otherId) || blockedByIds.includes(otherId),
    [blockedIds, blockedByIds]
  );

  const allBlockedIds = useMemo(
    () => [...blockedIds, ...blockedByIds],
    [blockedIds, blockedByIds]
  );

  return { blockedIds, blockedByIds, allBlockedIds, isBlocked, loading };
}

