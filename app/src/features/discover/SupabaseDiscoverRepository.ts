import { supabase } from '../../lib/supabase';

export type Candidate = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  distance_km: number | null;
  overlap_count: number;
  last_active: string | null;
};

export class SupabaseDiscoverRepository {
  async page(limit = 30, offset = 0): Promise<Candidate[]> {
    const { data: s } = await supabase.auth.getSession();
    if (!s?.session?.user?.id) return [];
    // The SQL function signature uses p_limit, p_offset
    const { data, error } = await supabase.rpc('discover_candidates', {
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return (data ?? []) as Candidate[];
  }
}
