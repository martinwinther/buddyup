import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { CategoriesProvider } from './src/features/categories/CategoriesProvider';
import { FakeCategoriesRepository } from './src/features/categories/FakeCategoriesRepository';
import Navigation from './src/navigation';

const categoriesRepo = new FakeCategoriesRepository();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OnboardingProvider>
          <CategoriesProvider repo={categoriesRepo}>
            <Navigation />
            <StatusBar style="light" />
          </CategoriesProvider>
        </OnboardingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
