import { supabase } from '../../lib/supabase';

export type Category = { id: number; slug: string; name: string };

let cache: Category[] | null = null;

export async function fetchCategories(): Promise<Category[]> {
  if (cache) return cache;

  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .order('name');

  if (error) {
    console.warn('[categories] load failed:', error.message);
    cache = [];
    return cache;
  }

  cache = (data ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
  return cache;
}

