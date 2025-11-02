import { supabase } from '../../lib/supabase';

export type ProfileSettings = {
  notify_email_messages: boolean;
};

export type DiscoveryPrefs = {
  age_min: number;
  age_max: number;
  max_km: number;
  only_shared_categories: boolean;
};

export type BlockRow = { blocked_id: string; display_name: string | null; photo_url: string | null };

export class SettingsRepository {
  async load(): Promise<ProfileSettings | null> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('notify_email_messages')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { notify_email_messages: false };

    return { notify_email_messages: !!data.notify_email_messages };
  }

  async update(patch: Partial<ProfileSettings>): Promise<void> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const { error } = await supabase
      .from('profiles')
      .update({ ...patch })
      .eq('id', uid);
    if (error) throw error;
  }
}

export async function getEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function loadDiscoveryPrefs(): Promise<DiscoveryPrefs | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('discovery_prefs')
    .select('age_min,age_max,max_km,only_shared_categories')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;

  return {
    age_min: data.age_min ?? 18,
    age_max: data.age_max ?? 99,
    max_km: data.max_km ?? 50,
    only_shared_categories: !!data.only_shared_categories,
  };
}

export async function saveDiscoveryPrefs(p: DiscoveryPrefs): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { error } = await supabase.from('discovery_prefs').upsert({
    user_id: uid,
    age_min: p.age_min,
    age_max: p.age_max,
    max_km: p.max_km,
    only_shared_categories: p.only_shared_categories,
  });

  if (error) throw error;
}

export async function loadBlocked(): Promise<BlockRow[]> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];

  const { data: blocks, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', uid);

  if (error || !blocks?.length) return [];

  const ids = blocks.map(b => b.blocked_id);

  const { data: profs } = await supabase
    .from('profiles')
    .select('id,display_name,photo_url')
    .in('id', ids);

  const map = new Map((profs ?? []).map(p => [p.id, p]));

  return ids.map(id => {
    const p = map.get(id);
    return { blocked_id: id, display_name: p?.display_name ?? null, photo_url: p?.photo_url ?? null };
  });
}

export async function unblock(targetId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Not signed in');

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', uid)
    .eq('blocked_id', targetId);

  if (error) throw error;
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
}
