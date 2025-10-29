import { supabase } from '../../lib/supabase';

export async function hydrateLastActive(userIds: string[]): Promise<Record<string, string | null>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from('profiles')
    .select('id,last_active')
    .in('id', userIds);
  if (error) return {};
  const map: Record<string, string | null> = {};
  for (const r of data) map[r.id] = r.last_active as any;
  return map;
}

