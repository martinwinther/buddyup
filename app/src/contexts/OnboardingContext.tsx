import React, { createContext, useContext, useState } from 'react';
import { SelectedCategory } from '../features/categories/types';

type OnboardingState = {
  profile?: {
    displayName?: string;
    age?: number;
    bio?: string;
    photo_url?: string | null;
  };
  categories?: SelectedCategory[];
};

interface OnboardingContextType {
  state: OnboardingState;
  setProfile: (profile: OnboardingState['profile']) => void;
  setCategories: (categories: SelectedCategory[]) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>({});

  const setProfile = (profile: OnboardingState['profile']) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const setCategories = (categories: SelectedCategory[]) => {
    setState((prev) => ({ ...prev, categories }));
  };

  return (
    <OnboardingContext.Provider value={{ state, setProfile, setCategories }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

