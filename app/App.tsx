import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { CategoriesProvider } from './src/features/categories/CategoriesProvider';
import { FakeCategoriesRepository } from './src/features/categories/FakeCategoriesRepository';
import { PersistenceProvider } from './src/features/onboarding/persistence';
import { SupabaseOnboardingPersistence } from './src/features/onboarding/persistence';
import Navigation from './src/navigation';

const categoriesRepo = new FakeCategoriesRepository();

function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const persistenceImpl = React.useMemo(
    () => new SupabaseOnboardingPersistence(() => user?.id ?? null),
    [user?.id]
  );

  return (
    <PersistenceProvider impl={persistenceImpl}>
      <OnboardingProvider>
        <CategoriesProvider repo={categoriesRepo}>
          {children}
        </CategoriesProvider>
      </OnboardingProvider>
    </PersistenceProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppProviders>
          <Navigation />
          <StatusBar style="light" />
        </AppProviders>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
