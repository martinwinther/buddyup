import { supabase } from '../../../lib/supabase';
import type {
  OnboardingPersistence,
  ProfileDraft,
  SelectedCategory,
} from './types';

export class SupabaseOnboardingPersistence implements OnboardingPersistence {
  constructor(private getUserId: () => string | null) {}

  private uidOrThrow() {
    const id = this.getUserId();
    if (!id) throw new Error('No authenticated user. Please sign in again.');
    return id;
  }

  async saveProfile(profile: ProfileDraft) {
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw sessErr;
    const uid = sessionData?.session?.user?.id;
    if (!uid) throw new Error('NO_SESSION');

    const row = {
      id: uid,
      display_name: profile.displayName ?? null,
      age: profile.age ?? null,
      bio: profile.bio ?? null,
      photo_url:
        profile.photoUri && profile.photoUri.startsWith('http') ? profile.photoUri : null,
      last_active: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' });

    if (upErr) {
      if ((upErr as any).code === '23505' || (upErr as any).message?.includes('duplicate')) {
        const { error: updErr } = await supabase.from('profiles').update(row).eq('id', uid);
        if (updErr) throw updErr;
        if (__DEV__) console.info('[profiles] updated for uid', uid);
      } else {
        throw upErr;
      }
    } else {
      if (__DEV__) console.info('[profiles] saved for uid', uid);
    }
  }

  async saveCategories(categories: SelectedCategory[]) {
    const id = this.uidOrThrow();

    const { error: delErr } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', id);
    
    if (delErr) {
      console.warn('Error deleting categories:', delErr);
      throw delErr;
    }

    if (categories.length === 0) return;

    const rows = categories.map(c => ({
      user_id: id,
      category_id: c.categoryId,
      intensity: c.intensity,
      active: c.active,
    }));

    const { error: insErr } = await supabase
      .from('user_categories')
      .insert(rows);
    
    if (insErr) {
      console.warn('Error inserting categories:', insErr);
      throw insErr;
    }
  }

  async loadProfile(): Promise<ProfileDraft | null> {
    const id = this.uidOrThrow();
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, age, bio, photo_url')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Error loading profile:', error);
      throw error;
    }
    
    if (!data) return null;

    return {
      displayName: data.display_name ?? undefined,
      age: data.age ?? undefined,
      bio: data.bio ?? undefined,
      photoUri: data.photo_url ?? null,
    };
  }

  async loadCategories(): Promise<SelectedCategory[] | null> {
    const id = this.uidOrThrow();
    const { data, error } = await supabase
      .from('user_categories')
      .select('category_id, intensity, active')
      .eq('user_id', id);
    
    if (error) {
      console.warn('Error loading categories:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return data.map(r => ({
      categoryId: r.category_id,
      intensity: r.intensity ?? 3,
      active: !!r.active,
    }));
  }

  async setCompleted(_completed: boolean) {
    // no-op: completion inferred from DB in isCompleted()
  }

  async isCompleted(): Promise<boolean> {
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) return false;

      // Has profile with display_name?
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', uid)
        .maybeSingle();
      if (pErr) return false;
      const hasProfile = !!prof?.id && !!prof?.display_name;

      // Has at least one category? (HEAD + count = exact is fast)
      const { count, error: cErr } = await supabase
        .from('user_categories')
        .select('category_id', { count: 'exact', head: true })
        .eq('user_id', uid);
      if (cErr) return false;
      const hasCats = (count ?? 0) > 0;

      return hasProfile && hasCats; // photo not required
    } catch (error) {
      console.warn('Error checking completion status:', error);
      return false;
    }
  }

  async clear() {
    // No destructive server operations here.
    // This is intentionally a no-op for safety.
    console.log('Clear is a no-op for Supabase persistence (safety)');
  }
}

