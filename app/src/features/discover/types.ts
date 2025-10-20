export type Candidate = {
  id: string;
  displayName: string | null;
  age: number | null;
  bio: string | null;
  photoUrl: string | null;
  score: number; // overlap points
  distanceKm: number | null;
  overlapCount: number;
};

