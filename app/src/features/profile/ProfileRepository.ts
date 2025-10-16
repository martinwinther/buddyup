import { supabase } from '../../lib/supabase';

export type MyProfile = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
};

export class ProfileRepository {
  async getMe(): Promise<MyProfile | null> {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, age, bio, photo_url')
      .eq('id', uid)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  async updateMe(patch: Partial<Omit<MyProfile, 'id'>>) {
    const { data: s } = await supabase.auth.getSession();
    const uid = s?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: patch.display_name ?? undefined,
        age: patch.age ?? undefined,
        bio: patch.bio ?? undefined,
        photo_url: patch.photo_url ?? undefined,
        last_active: new Date().toISOString(),
      })
      .eq('id', uid);
    if (error) throw error;
  }
}

