import './global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Navigation />
        <StatusBar style="light" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
