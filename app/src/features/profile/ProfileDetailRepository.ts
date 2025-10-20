import { supabase } from '../../lib/supabase';

export type ProfileDetail = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  distance_km: number | null;
  categories: { id: number; name: string }[];
  mySharedCategoryIds: number[]; // categories shared with current user
};

export class ProfileDetailRepository {
  async load(otherId: string): Promise<ProfileDetail | null> {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id ?? null;

    // profile
    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, age, bio, photo_url, latitude, longitude')
      .eq('id', otherId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!prof) return null;

    // my location (for distance)
    let meLat: number | null = null;
    let meLon: number | null = null;
    if (me) {
      const { data: mine } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', me)
        .maybeSingle();
      meLat = mine?.latitude ?? null;
      meLon = mine?.longitude ?? null;
    }

    // categories for other
    const { data: otherCats, error: ocErr } = await supabase
      .from('user_categories')
      .select('category_id, categories(name)')
      .eq('user_id', otherId)
      .order('category_id', { ascending: true });
    if (ocErr) throw ocErr;

    const categories = (otherCats ?? []).map((r: any) => ({
      id: r.category_id as number,
      name: r.categories?.name as string,
    }));

    // my categories for overlap
    let mySharedCategoryIds: number[] = [];
    if (me) {
      const { data: myCats } = await supabase
        .from('user_categories')
        .select('category_id')
        .eq('user_id', me);
      const mySet = new Set((myCats ?? []).map((x) => x.category_id as number));
      mySharedCategoryIds = categories.filter((c) => mySet.has(c.id)).map((c) => c.id);
    }

    // distance (client-side quick calc)
    const distKm =
      prof.latitude != null && prof.longitude != null && meLat != null && meLon != null
        ? this.kmBetween({ lat: meLat, lon: meLon }, { lat: prof.latitude as number, lon: prof.longitude as number })
        : null;

    return {
      id: prof.id,
      display_name: prof.display_name ?? null,
      age: prof.age ?? null,
      bio: prof.bio ?? null,
      photo_url: prof.photo_url ?? null,
      distance_km: distKm,
      categories,
      mySharedCategoryIds,
    };
  }

  private kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const R = 6371;
    const dLat = this.deg2rad(b.lat - a.lat);
    const dLon = this.deg2rad(b.lon - a.lon);
    const la1 = this.deg2rad(a.lat);
    const la2 = this.deg2rad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  private deg2rad(d: number) { return d * (Math.PI / 180); }
}
