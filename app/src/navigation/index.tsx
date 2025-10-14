import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingPersistence } from '../features/onboarding/persistence';
import { RootStackParamList } from '../types';

import Home from '../screens/Home';
import SignUpEmail from '../screens/Auth/SignUpEmail';
import SignInEmail from '../screens/Auth/SignInEmail';
import StepProfile from '../screens/Onboarding/StepProfile';
import StepCategories from '../screens/Onboarding/StepCategories';
import Finish from '../screens/Onboarding/Finish';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { user, isLoading: authLoading } = useAuth();
  const persistence = useOnboardingPersistence();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    } else {
      setOnboardingCompleted(null);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const completed = await persistence.isCompleted();
      setOnboardingCompleted(completed);
    } catch {
      setOnboardingCompleted(false);
    }
  };

  if (authLoading || (user && onboardingCompleted === null)) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="SignUpEmail" component={SignUpEmail} />
            <Stack.Screen name="SignInEmail" component={SignInEmail} />
          </>
        ) : !onboardingCompleted ? (
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

