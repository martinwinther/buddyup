import { supabase } from '../../lib/supabase';

export type Category = { id: number; slug: string; name: string };
export type UserCategory = { category_id: number; intensity: number; active: boolean };

export class InterestsRepository {
  async loadAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name')
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async loadMine(): Promise<UserCategory[]> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from('user_categories')
      .select('category_id, intensity, active')
      .eq('user_id', uid);
    if (error) throw error;
    return data ?? [];
  }

  async saveMine(rows: UserCategory[]) {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    // Replace strategy: delete then insert
    const { error: delErr } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', uid);
    if (delErr) throw delErr;

    if (!rows.length) return;

    const insertRows = rows.map(r => ({
      user_id: uid,
      category_id: r.category_id,
      intensity: r.intensity,
      active: r.active,
    }));

    const { error: insErr } = await supabase
      .from('user_categories')
      .insert(insertRows);
    if (insErr) throw insErr;
  }
}

