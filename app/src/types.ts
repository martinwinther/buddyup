export type Category = {
  id: string;
  name: string;
  emoji: string;
};

export type Card = {
  id: string;
  display_name: string;
  photo_url?: string;
  distance_km?: number;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ProfileData = {
  displayName: string;
  age: string;
  bio: string;
  phone: string;
  photoUrl?: string;
};

export type RootStackParamList = {
  Home: undefined;
  SignUpEmail: undefined;
  SignInEmail: undefined;
  OnboardingProfile: undefined;
  OnboardingCategories: { profileData: ProfileData };
  OnboardingFinish: { profileData: ProfileData; selectedCategories: string[] };
};

