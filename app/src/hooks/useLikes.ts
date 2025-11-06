import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type LikeRow = {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  is_super: boolean;
};

export function useLikes(options?: { limit?: number; offset?: number; excludeUserIds?: string[] }) {
  const { limit = 50, offset = 0, excludeUserIds = [] } = options ?? {};
  const [data, setData] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) { 
        setData([]); 
        setLoading(false); 
        return; 
      }

      const q = supabase
        .from('swipes')
        .select(`
          created_at,
          direction,
          swiper_id,
          profiles!swipes_swiper_id_fkey (id, display_name, photo_url)
        `)
        .eq('target_id', uid)
        .in('direction', ['right', 'super'])
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      const { data: rows, error: err } = await q;
      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        const mapped: LikeRow[] = (rows ?? [])
          .map((r: any) => ({
            user_id: r.profiles?.id ?? r.swiper_id,
            display_name: r.profiles?.display_name ?? null,
            photo_url: r.profiles?.photo_url ?? null,
            created_at: r.created_at,
            is_super: r.direction === 'super',
          }))
          .filter(r => !excludeUserIds.includes(r.user_id));

        setData(mapped);
      }

      setLoading(false);
    })();

    return () => { 
      cancelled = true; 
    };
  }, [limit, offset, JSON.stringify(excludeUserIds)]);

  return { likes: data, loading, error };
}

