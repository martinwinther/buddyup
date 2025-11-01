import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, View, Platform } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { CategoriesProvider } from './src/features/categories/CategoriesProvider';
import { SupabaseCategoriesRepository } from './src/features/categories/SupabaseCategoriesRepository';
import { PersistenceProvider } from './src/features/onboarding/persistence';
import { SupabaseOnboardingPersistence } from './src/features/onboarding/persistence';
import Navigation from './src/navigation';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import AppInstallPrompt from './src/web/AppInstallPrompt';

function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const persistenceImpl = React.useMemo(
    () => new SupabaseOnboardingPersistence(() => user?.id ?? null),
    [user?.id]
  );

  const categoriesRepo = React.useMemo(() => new SupabaseCategoriesRepository(), []);

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
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AuthProvider>
            <AppProviders>
              <ResponsiveContainer>
                <Navigation />
              </ResponsiveContainer>
            </AppProviders>
          </AuthProvider>
        </SafeAreaView>
      </View>
      {Platform.OS === 'web' ? <AppInstallPrompt /> : null}
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
