import { supabase } from '../../lib/supabase';

export type ProfilePhoto = {
  id: string;
  url: string;
  sort_order: number;
};

export type CandidateCategory = {
  id: number;
  name: string;
  slug: string;
  shared?: boolean;
};

export type Candidate = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  distance_km: number | null;
  overlap_count: number;
  last_active: string | null;
  profile_photos?: ProfilePhoto[];
  categories?: CandidateCategory[];
};

export class SupabaseDiscoverRepository {
  async page(limit = 30, offset = 0): Promise<Candidate[]> {
    const { data: s } = await supabase.auth.getSession();
    if (!s?.session?.user?.id) return [];
    
    // Get base candidates from RPC
    const { data, error } = await supabase.rpc('discover_candidates', {
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    const candidates = (data ?? []) as Candidate[];
    
    if (candidates.length === 0) return [];
    
    // Get my categories to mark shared ones
    const { data: myCats } = await supabase
      .from('user_categories')
      .select('category_id')
      .eq('user_id', s.session.user.id)
      .eq('active', true);
    const myCategories = new Set((myCats ?? []).map(c => c.category_id));
    
    // Fetch profile_photos and categories for all candidates
    const candidateIds = candidates.map(c => c.id);
    
    const [photosResult, categoriesResult, categoryNamesResult] = await Promise.all([
      supabase
        .from('profile_photos')
        .select('id, user_id, url, sort_order')
        .in('user_id', candidateIds)
        .order('sort_order', { ascending: true }),
      supabase
        .from('user_categories')
        .select('user_id, category_id')
        .in('user_id', candidateIds)
        .eq('active', true),
      supabase
        .from('categories')
        .select('id, name, slug')
    ]);
    
    const photosByUser = new Map<string, ProfilePhoto[]>();
    for (const photo of photosResult.data ?? []) {
      const arr = photosByUser.get(photo.user_id) ?? [];
      arr.push({ id: photo.id, url: photo.url, sort_order: photo.sort_order });
      photosByUser.set(photo.user_id, arr);
    }
    
    const categoryIdsToNames = new Map<number, { name: string; slug: string }>();
    for (const cat of categoryNamesResult.data ?? []) {
      categoryIdsToNames.set(cat.id, { name: cat.name, slug: cat.slug });
    }
    
    const categoriesByUser = new Map<string, CandidateCategory[]>();
    for (const uc of categoriesResult.data ?? []) {
      const catInfo = categoryIdsToNames.get(uc.category_id);
      if (!catInfo) continue;
      const arr = categoriesByUser.get(uc.user_id) ?? [];
      arr.push({
        id: uc.category_id,
        name: catInfo.name,
        slug: catInfo.slug,
        shared: myCategories.has(uc.category_id)
      });
      categoriesByUser.set(uc.user_id, arr);
    }
    
    // Attach photos and categories to each candidate
    return candidates.map(c => ({
      ...c,
      profile_photos: photosByUser.get(c.id) ?? [],
      categories: categoriesByUser.get(c.id) ?? []
    }));
  }
}
