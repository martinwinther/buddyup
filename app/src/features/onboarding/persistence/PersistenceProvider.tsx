import React, { createContext, useContext, useMemo } from 'react';
import { OnboardingPersistence } from './types';

const Ctx = createContext<OnboardingPersistence | null>(null);

export function PersistenceProvider({ impl, children }: { impl: OnboardingPersistence; children: React.ReactNode }) {
  const value = useMemo(() => impl, [impl]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboardingPersistence() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboardingPersistence must be used within PersistenceProvider');
  return ctx;
}

