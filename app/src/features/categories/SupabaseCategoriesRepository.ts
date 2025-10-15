import { supabase } from '../../lib/supabase';
import type { CategoriesRepository, Category } from './types';

export class SupabaseCategoriesRepository implements CategoriesRepository {
  async listAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, slug: r.slug, name: r.name }));
  }
}


