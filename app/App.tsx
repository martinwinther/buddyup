import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, View, Platform } from 'react-native';
import { useNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { CategoriesProvider } from './src/features/categories/CategoriesProvider';
import { PersistenceProvider } from './src/features/onboarding/persistence';
import { SupabaseOnboardingPersistence } from './src/features/onboarding/persistence';
import { ChatNotifyProvider } from './src/features/messages';
import Navigation from './src/navigation';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import AppInstallPrompt from './src/web/AppInstallPrompt';

function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const persistenceImpl = React.useMemo(
    () => new SupabaseOnboardingPersistence(() => user?.id ?? null),
    [user?.id]
  );

  return (
    <PersistenceProvider impl={persistenceImpl}>
      <OnboardingProvider>
        <CategoriesProvider>
          {children}
        </CategoriesProvider>
      </OnboardingProvider>
    </PersistenceProvider>
  );
}

export default function App() {
  const navRef = useNavigationContainerRef();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <AuthProvider>
            <AppProviders>
              <ChatNotifyProvider navigation={navRef}>
                <ResponsiveContainer>
                  <Navigation navigationRef={navRef} />
                </ResponsiveContainer>
              </ChatNotifyProvider>
            </AppProviders>
          </AuthProvider>
        </SafeAreaView>
      </View>
      {Platform.OS === 'web' ? <AppInstallPrompt /> : null}
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
