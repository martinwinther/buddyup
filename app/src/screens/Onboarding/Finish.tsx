import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboardingPersistence } from '../../features/onboarding/persistence';
import { ProfileDraft, SelectedCategory } from '../../features/onboarding/persistence/types';
import { RootStackParamList } from '../../types';
import { Routes } from '../../navigation/routes';

type FinishNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingFinish'>;

export default function Finish() {
  const navigation = useNavigation<FinishNavigationProp>();
  const persistence = useOnboardingPersistence();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDraft | null>(null);
  const [categories, setCategories] = useState<SelectedCategory[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const profile = await persistence.loadProfile();
      const cats = await persistence.loadCategories();
      setProfileData(profile);
      setCategories(cats || []);
    } catch (error: any) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);

    try {
      await persistence.setCompleted(true);
      console.log('✅ Onboarding marked as complete');
      
      // Reset navigation to Discover immediately
      navigation.reset({
        index: 0,
        routes: [{ name: Routes.Discover as never }],
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete onboarding: ' + error.message);
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a] px-6 justify-center">
      <View className="items-center mb-12">
        <View className="w-24 h-24 bg-teal-400/20 rounded-full items-center justify-center mb-6">
          <Text className="text-5xl">🎉</Text>
        </View>
        
        <Text className="text-white text-3xl font-bold text-center mb-4">
          You're All Set!
        </Text>
        
        <Text className="text-white/60 text-base text-center mb-8">
          Your profile is ready. Let's find you some buddies!
        </Text>

        {profileData ? (
          <View className="bg-zinc-900/90 rounded-3xl border border-white/20 p-6 w-full mb-8">
            <View className="mb-4">
              <Text className="text-white/60 text-sm mb-1">Display Name</Text>
              <Text className="text-white text-lg font-medium">
                {profileData.displayName || 'Not set'}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-white/60 text-sm mb-1">Age</Text>
              <Text className="text-white text-lg font-medium">
                {profileData.age || 'Not set'}
              </Text>
            </View>

            {profileData.bio && (
              <View className="mb-4">
                <Text className="text-white/60 text-sm mb-1">Bio</Text>
                <Text className="text-white text-base">{profileData.bio}</Text>
              </View>
            )}

            <View>
              <Text className="text-white/60 text-sm mb-2">Interests</Text>
              <Text className="text-teal-400 text-base">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'} selected
              </Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#3b82f6" />
        )}
      </View>

      <TouchableOpacity
        className={`bg-blue-500 rounded-2xl py-4 ${isLoading ? 'opacity-50' : ''}`}
        onPress={handleFinish}
        disabled={isLoading}
      >
        {isLoading ? (
          <View className="flex-row justify-center items-center">
            <ActivityIndicator color="white" />
            <Text className="text-white text-center text-base font-semibold ml-2">
              Setting Up...
            </Text>
          </View>
        ) : (
          <Text className="text-white text-center text-base font-semibold">
            Finish Setup
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

