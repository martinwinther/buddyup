import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingPersistence } from '../features/onboarding/persistence';
import { RootStackParamList } from '../types';
import { SplashOrLoader } from '../components/SplashOrLoader';
import { Routes } from './routes';

import Home from '../screens/Home';
import SignUpEmail from '../screens/Auth/SignUpEmail';
import SignInEmail from '../screens/Auth/SignInEmail';
import StepProfile from '../screens/Onboarding/StepProfile';
import StepCategories from '../screens/Onboarding/StepCategories';
import Finish from '../screens/Onboarding/Finish';

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { session, isLoading } = useAuth();
  const persistence = useOnboardingPersistence();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!session) {
        if (alive) {
          setCompleted(false);
          setChecking(false);
        }
        return;
      }

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
  }, [session]);

  if (isLoading || checking) {
    return <SplashOrLoader />;
  }

  const renderAuthStack = () => (
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

  const renderOnboardingStack = () => (
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

  const renderMainStack = () => (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <MainStack.Screen name={Routes.Home} component={Home} />
    </MainStack.Navigator>
  );

  return (
    <NavigationContainer>
      {!session ? renderAuthStack() : !completed ? renderOnboardingStack() : renderMainStack()}
    </NavigationContainer>
  );
}

