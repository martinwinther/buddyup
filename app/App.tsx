import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { CategoriesProvider } from './src/features/categories/CategoriesProvider';
import { FakeCategoriesRepository } from './src/features/categories/FakeCategoriesRepository';
import { PersistenceProvider } from './src/features/onboarding/persistence';
import { AsyncOnboardingPersistence } from './src/features/onboarding/persistence';
import Navigation from './src/navigation';

const categoriesRepo = new FakeCategoriesRepository();
const persistenceImpl = new AsyncOnboardingPersistence();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PersistenceProvider impl={persistenceImpl}>
          <OnboardingProvider>
            <CategoriesProvider repo={categoriesRepo}>
              <Navigation />
              <StatusBar style="light" />
            </CategoriesProvider>
          </OnboardingProvider>
        </PersistenceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
