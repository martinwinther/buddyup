import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import Home from '../screens/Home';
import SignUpEmail from '../screens/Auth/SignUpEmail';
import SignInEmail from '../screens/Auth/SignInEmail';
import StepProfile from '../screens/Onboarding/StepProfile';
import StepCategories from '../screens/Onboarding/StepCategories';
import Finish from '../screens/Onboarding/Finish';

export type RootStackParamList = {
  Home: undefined;
  SignUpEmail: undefined;
  SignInEmail: undefined;
  OnboardingProfile: undefined;
  OnboardingCategories: { profileData: any };
  OnboardingFinish: { profileData: any; selectedCategories: string[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkUserProfile();
    } else {
      setHasProfile(null);
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      setHasProfile(!!data && !error);
    } catch {
      setHasProfile(false);
    }
  };

  if (authLoading || (user && hasProfile === null)) {
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
        ) : !hasProfile ? (
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

