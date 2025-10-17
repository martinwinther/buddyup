import { supabase } from '../../lib/supabase';

export type ServerCandidate = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  overlap_count: number;
  boost_hits: number;
  score: number;
};

export type DeckCandidate = {
  id: string;
  displayName: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  score: number;
  distanceKm: number | null;
};

export class ServerDiscoverRepository {
  async list(max = 200): Promise<DeckCandidate[]> {
    const { data, error } = await supabase.rpc('discover_candidates', { max_rows: max });
    if (error) throw error;

    return ((data ?? []) as ServerCandidate[]).map((r: ServerCandidate) => ({
      id: r.id,
      displayName: r.display_name,
      age: r.age,
      bio: r.bio,
      photoUrl: r.photo_url,
      score: r.score ?? 0,
      distanceKm: r.distance_km,
    }));
  }
}

