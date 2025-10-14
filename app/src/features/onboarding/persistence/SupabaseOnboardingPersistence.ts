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
    const id = this.uidOrThrow();

    const photo_url =
      profile.photoUri && profile.photoUri.startsWith('http')
        ? profile.photoUri
        : null;

    const { error } = await supabase.from('profiles').upsert({
      id,
      display_name: profile.displayName ?? null,
      age: profile.age ?? null,
      bio: profile.bio ?? null,
      photo_url,
      last_active: new Date().toISOString(),
    });
    
    if (error) {
      console.warn('Error saving profile:', error);
      throw error;
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

  async isCompleted() {
    try {
      const [p, c] = await Promise.all([
        this.loadProfile(),
        this.loadCategories(),
      ]);
      
      const hasProfile = !!(p && (p.displayName || p.photoUri || p.age || p.bio));
      const hasAnyCategory = !!(c && c.length > 0);
      
      return hasProfile && hasAnyCategory;
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

