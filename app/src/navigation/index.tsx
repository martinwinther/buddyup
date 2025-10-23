import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingPersistence } from '../features/onboarding/persistence';
import { RootStackParamList } from '../types';
import SplashScreen from '../components/SplashScreen';
import { Routes } from './routes';

import Home from '../screens/Home';
import Discover from '../screens/Discover';
import SignUpEmail from '../screens/Auth/SignUpEmail';
import SignInEmail from '../screens/Auth/SignInEmail';
import StepProfile from '../screens/Onboarding/StepProfile';
import StepCategories from '../screens/Onboarding/StepCategories';
import Finish from '../screens/Onboarding/Finish';
import Matches from '../screens/Messages/Matches';
import Chat from '../screens/Messages/Chat';
import Settings from '../screens/Settings/Settings';
import EditProfile from '../screens/Profile/EditProfile';
import EditInterests from '../screens/Profile/EditInterests';
import ProfileSheet from '../screens/Profile/ProfileSheet';
import Likes from '../screens/Likes/Likes';
import Report from '../screens/Safety/Report';
import BlockedUsers from '../screens/Safety/BlockedUsers';
import DiscoverySettings from '../screens/Discover/DiscoverySettings';

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <AppGate />
    </NavigationContainer>
  );
}

function AppGate() {
  const { session, isLoading: authLoading } = useAuth();
  const persistence = useOnboardingPersistence();
  const [checking, setChecking] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      // If auth still loading, stay on splash
      if (authLoading) return;

      // No session → no onboarding check needed
      if (!session) {
        if (alive) {
          setCompleted(false);
          setChecking(false);
        }
        return;
      }

      // Session present → run a single completion check
      setChecking(true);
      try {
        const done = await persistence.isCompleted();
        if (alive) {
          setCompleted(done);
          setChecking(false);
        }
      } catch {
        if (alive) {
          setCompleted(false);
          setChecking(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [authLoading, session?.user?.id]); // re-check only when session identity changes

  // Gate: show splash until we definitively know what to render
  if (authLoading || checking || completed === null) {
    return <SplashScreen />;
  }

  if (!session) {
    return <AuthStackNavigator />;
  }

  // MAIN vs ONBOARDING — choose after check resolves
  return completed ? <MainStackNavigator /> : <OnboardingStackNavigator />;
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <AuthStack.Screen name={Routes.AuthSignUp} component={SignUpEmail} />
      <AuthStack.Screen name={Routes.AuthSignIn} component={SignInEmail} />
    </AuthStack.Navigator>
  );
}

function OnboardingStackNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <OnboardingStack.Screen name={Routes.OnboardingProfile} component={StepProfile} />
      <OnboardingStack.Screen name={Routes.OnboardingCategories} component={StepCategories} />
      <OnboardingStack.Screen name={Routes.OnboardingFinish} component={Finish} />
    </OnboardingStack.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <MainStack.Screen name={Routes.Discover} component={Discover} />
      <MainStack.Screen name={Routes.Home} component={Home} />
      <MainStack.Screen name={Routes.Matches} component={Matches} />
      <MainStack.Screen name={Routes.Chat} component={Chat} />
      <MainStack.Screen name="Likes" component={Likes} options={{ headerShown: false }} />
      <MainStack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      <MainStack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
      <MainStack.Screen name="EditInterests" component={EditInterests} options={{ headerShown: false }} />
      <MainStack.Screen name="ProfileSheet" component={ProfileSheet} options={{ headerShown: false }} />
      <MainStack.Screen name="Report" component={Report} options={{ headerShown: false }} />
      <MainStack.Screen name="BlockedUsers" component={BlockedUsers} options={{ headerShown: false }} />
      <MainStack.Screen name="DiscoverySettings" component={DiscoverySettings} options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
}

