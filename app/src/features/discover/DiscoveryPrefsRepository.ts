import { supabase } from '../../lib/supabase';

export type DiscoveryPrefs = {
  age_min: number;
  age_max: number;
  max_km: number | null;
  boosted_category_ids: number[];
};

const DEFAULT_PREFS: DiscoveryPrefs = {
  age_min: 18,
  age_max: 60,
  max_km: 50,
  boosted_category_ids: [],
};

export class DiscoveryPrefsRepository {
  async get(): Promise<DiscoveryPrefs> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return DEFAULT_PREFS;

    const { data, error } = await supabase
      .from('discovery_prefs')
      .select('age_min, age_max, max_km, boosted_category_ids')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) return DEFAULT_PREFS;
    return {
      age_min: data?.age_min ?? DEFAULT_PREFS.age_min,
      age_max: data?.age_max ?? DEFAULT_PREFS.age_max,
      max_km: data?.max_km ?? DEFAULT_PREFS.max_km,
      boosted_category_ids: data?.boosted_category_ids ?? DEFAULT_PREFS.boosted_category_ids,
    };
  }

  async save(prefs: DiscoveryPrefs) {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const payload = {
      user_id: uid,
      age_min: prefs.age_min,
      age_max: prefs.age_max,
      max_km: prefs.max_km,
      boosted_category_ids: prefs.boosted_category_ids.slice(0, 3),
    };

    const { error } = await supabase
      .from('discovery_prefs')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
  }
}

