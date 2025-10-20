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
  Discover: undefined;
  AuthSignUp: undefined;
  AuthSignIn: { notice?: string } | undefined;
  OnboardingProfile: undefined;
  OnboardingCategories: undefined;
  OnboardingFinish: undefined;
  Matches: undefined;
  Chat: { matchId: string; otherId?: string; name?: string };
  Likes: undefined;
  Settings: undefined;
  EditProfile: undefined;
  EditInterests: undefined;
  ProfileSheet: { userId: string; fallback?: { name?: string | null; age?: number | null; photoUrl?: string | null; distanceKm?: number | null } };
  Report: { targetId: string; name?: string };
};

