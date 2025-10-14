import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Switch } from 'react-native';
import { RootStackParamList } from '../../types';
import { useCategories } from '../../features/categories/CategoriesProvider';
import { useCategorySelection } from '../../features/categories/useCategorySelection';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useOnboardingPersistence } from '../../features/onboarding/persistence';
import { CategoryGrid } from '../../components/CategoryGrid';
import GlassCard from '../../components/GlassCard';

type StepCategoriesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingCategories'>;

export default function StepCategories() {
  const navigation = useNavigation<StepCategoriesNavigationProp>();
  const { categories, loading, error } = useCategories();
  const { selected, toggle, setIntensity, setActive, maxReached, isSelected } = useCategorySelection();
  const { setCategories } = useOnboarding();
  const persistence = useOnboardingPersistence();

  const handleContinue = async () => {
    if (selected.length === 0) return;
    
    try {
      await persistence.saveCategories(selected);
      setCategories(selected);
      navigation.navigate('OnboardingFinish', {
        profileData: { displayName: '', age: '', bio: '', phone: '' },
        selectedCategories: [],
      });
    } catch (error: any) {
      console.error('Error saving categories:', error);
    }
  };

  const canContinue = selected.length >= 1 && selected.length <= 3;

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white/60 mt-4">Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
        <Text className="text-red-400 text-base text-center">{error}</Text>
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
            Select 1-3 categories ({selected.length}/3)
          </Text>
          {maxReached && (
            <Text className="text-amber-400 text-sm mt-2">
              Maximum reached - deselect a category to choose another
            </Text>
          )}
        </View>

        <View className="mb-6">
          <CategoryGrid
            categories={categories}
            selectedIds={selected.map((s) => s.categoryId)}
            onToggle={toggle}
            maxReached={maxReached}
          />
        </View>

        {selected.length > 0 && (
          <View className="mt-6 mb-8">
            <Text className="text-white text-xl font-semibold mb-4">
              Customize Your Selections
            </Text>
            
            {selected.map((item) => {
              const category = categories.find((c) => c.id === item.categoryId);
              if (!category) return null;
              
              return (
                <GlassCard key={item.categoryId} className="mb-4 p-4">
                  <View className="mb-4">
                    <Text className="text-white font-medium text-base mb-2">
                      {category.name}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-white/70 text-sm">Intensity</Text>
                      <Text className="text-teal-400 font-semibold text-base">
                        {item.intensity}/5
                      </Text>
                    </View>
                    <Slider
                      value={item.intensity}
                      onValueChange={(value) =>
                        setIntensity(item.categoryId, Math.round(value) as 1 | 2 | 3 | 4 | 5)
                      }
                      minimumValue={1}
                      maximumValue={5}
                      step={1}
                      minimumTrackTintColor="#2dd4bf"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#2dd4bf"
                    />
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/70 text-sm">Active</Text>
                    <Switch
                      value={item.active}
                      onValueChange={(value) => setActive(item.categoryId, value)}
                      trackColor={{ false: '#374151', true: '#2dd4bf' }}
                      thumbColor={item.active ? '#fff' : '#9ca3af'}
                    />
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-8">
        <TouchableOpacity
          className={`bg-blue-500 rounded-2xl py-4 ${
            !canContinue ? 'opacity-50' : ''
          }`}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text className="text-white text-center text-base font-semibold">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
