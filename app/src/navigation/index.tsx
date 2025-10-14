import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingPersistence } from '../features/onboarding/persistence';
import { RootStackParamList } from '../types';
import { SplashOrLoader } from '../components/SplashOrLoader';

import Home from '../screens/Home';
import SignUpEmail from '../screens/Auth/SignUpEmail';
import SignInEmail from '../screens/Auth/SignInEmail';
import StepProfile from '../screens/Onboarding/StepProfile';
import StepCategories from '../screens/Onboarding/StepCategories';
import Finish from '../screens/Onboarding/Finish';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {!session ? (
          <>
            <Stack.Screen name="SignUpEmail" component={SignUpEmail} />
            <Stack.Screen name="SignInEmail" component={SignInEmail} />
          </>
        ) : !completed ? (
          <>
            <Stack.Screen name="OnboardingProfile" component={StepProfile} />
            <Stack.Screen name="OnboardingCategories" component={StepCategories} />
            <Stack.Screen name="OnboardingFinish" component={Finish} />
          </>
        ) : (
          <Stack.Screen name="Home" component={Home} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

