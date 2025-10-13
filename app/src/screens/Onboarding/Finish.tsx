import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Finish() {
  const route = useRoute();
  const { profileData, selectedCategories } = route.params as any;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: profileData.displayName,
        bio: profileData.bio || null,
        age: Number(profileData.age),
        photo_url: null,
        latitude: null,
        longitude: null,
      });

      if (profileError) throw profileError;

      const categoryInserts = selectedCategories.map((categoryId: string) => ({
        user_id: user.id,
        category_id: categoryId,
        intensity: 3,
        active: true,
      }));

      const { error: categoriesError } = await supabase
        .from('user_categories')
        .insert(categoryInserts);

      if (categoriesError) throw categoriesError;

      console.log('✅ Profile and categories saved successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile: ' + error.message);
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

        <View className="bg-zinc-900/90 rounded-3xl border border-white/20 p-6 w-full mb-8">
          <View className="mb-4">
            <Text className="text-white/60 text-sm mb-1">Display Name</Text>
            <Text className="text-white text-lg font-medium">
              {profileData.displayName}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-white/60 text-sm mb-1">Age</Text>
            <Text className="text-white text-lg font-medium">{profileData.age}</Text>
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
              {selectedCategories.length} selected
            </Text>
          </View>
        </View>
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

