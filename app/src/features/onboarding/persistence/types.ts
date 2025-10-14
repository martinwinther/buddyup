export type ProfileDraft = {
  displayName?: string;
  age?: number;
  bio?: string;
  photoUri?: string | null;
};
export type SelectedCategory = { categoryId: number; intensity: number; active: boolean };

export interface OnboardingPersistence {
  saveProfile(profile: ProfileDraft): Promise<void>;
  saveCategories(categories: SelectedCategory[]): Promise<void>;
  loadProfile(): Promise<ProfileDraft | null>;
  loadCategories(): Promise<SelectedCategory[] | null>;
  setCompleted(completed: boolean): Promise<void>;
  isCompleted(): Promise<boolean>;
  clear(): Promise<void>;
}

