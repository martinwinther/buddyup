import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { Category, RootStackParamList } from '../../types';

type StepCategoriesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingCategories'>;
type StepCategoriesRouteProp = RouteProp<RootStackParamList, 'OnboardingCategories'>;

export default function StepCategories() {
  const navigation = useNavigation<StepCategoriesNavigationProp>();
  const route = useRoute<StepCategoriesRouteProp>();
  const { profileData } = route.params;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, emoji')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load categories: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      if (selectedCategories.length >= 3) {
        Alert.alert('Limit Reached', 'You can select up to 3 categories');
        return;
      }
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one category');
      return;
    }

    navigation.navigate('OnboardingFinish', {
      profileData,
      selectedCategories,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white/60 mt-4">Loading categories...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <ScrollView className="flex-1 px-6 pt-16">
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">
            Choose Your Interests
          </Text>
          <Text className="text-white/60 text-base">
            Select up to 3 categories ({selectedCategories.length}/3)
          </Text>
        </View>

        <View className="flex-row flex-wrap mb-6">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                className={`mr-3 mb-3 px-6 py-4 rounded-2xl border-2 ${
                  isSelected
                    ? 'bg-teal-400/20 border-teal-400'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <Text className="text-2xl mb-1">{category.emoji}</Text>
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-teal-400' : 'text-white/80'
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-8">
        <TouchableOpacity
          className={`bg-blue-500 rounded-2xl py-4 ${
            selectedCategories.length === 0 ? 'opacity-50' : ''
          }`}
          onPress={handleContinue}
          disabled={selectedCategories.length === 0}
        >
          <Text className="text-white text-center text-base font-semibold">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

