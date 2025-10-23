import { supabase } from '../../lib/supabase';

export type DiscoveryPrefs = {
  age_min: number;
  age_max: number;
  max_km: number | null; // null = unlimited
  only_shared_categories: boolean;
};

const DEFAULTS: DiscoveryPrefs = {
  age_min: 18,
  age_max: 60,
  max_km: 50,
  only_shared_categories: false,
};

export class DiscoveryPrefsRepository {
  async load(): Promise<DiscoveryPrefs> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return DEFAULTS;

    const { data, error } = await supabase
      .from('discovery_prefs')
      .select('age_min, age_max, max_km, only_shared_categories')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULTS;

    return {
      age_min: data.age_min ?? DEFAULTS.age_min,
      age_max: data.age_max ?? DEFAULTS.age_max,
      max_km: data.max_km ?? DEFAULTS.max_km,
      only_shared_categories: !!data.only_shared_categories,
    };
  }

  async save(prefs: Partial<DiscoveryPrefs>): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    // Upsert row with defaults behind the scenes
    const merged = { ...(await this.load()), ...prefs };
    const { error } = await supabase
      .from('discovery_prefs')
      .upsert(
        {
          user_id: uid,
          age_min: merged.age_min,
          age_max: merged.age_max,
          max_km: merged.max_km,
          only_shared_categories: merged.only_shared_categories,
        },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
  }
}

