import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ProfileData, RootStackParamList } from '../../types';
import { useOnboardingPersistence } from '../../features/onboarding/persistence';

type StepProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

export default function StepProfile() {
  const navigation = useNavigation<StepProfileNavigationProp>();
  const persistence = useOnboardingPersistence();
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    bio: '',
    phone: '',
  });
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
      setUploadError(null);
    }
  };

  const handleContinue = async () => {
    if (!profileData.displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    if (!profileData.age.trim() || isNaN(Number(profileData.age))) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    const age = Number(profileData.age);
    if (age < 13 || age > 120) {
      Alert.alert('Error', 'Age must be between 13 and 120');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      await persistence.saveProfile({
        displayName: profileData.displayName,
        age: Number(profileData.age),
        bio: profileData.bio || undefined,
        photoUri: selectedImageUri,
      });

      const updatedProfileData = { ...profileData, photoUrl: selectedImageUri || undefined };
      navigation.navigate('OnboardingCategories', { profileData: updatedProfileData });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setUploadError(error.message || 'Failed to save profile');
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#0a0a0a]">
      <View className="px-6 pt-16 pb-8">
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">
            Create Your Profile
          </Text>
          <Text className="text-white/60 text-base">
            Tell us a bit about yourself
          </Text>
        </View>

        <View className="bg-zinc-900/90 rounded-3xl border border-white/20 p-6 mb-6">
          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">Display Name *</Text>
            <TextInput
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
              placeholder="How should people call you?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={profileData.displayName}
              onChangeText={(text) =>
                setProfileData({ ...profileData, displayName: text })
              }
            />
          </View>

          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">Age *</Text>
            <TextInput
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
              placeholder="Your age"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={profileData.age}
              onChangeText={(text) => setProfileData({ ...profileData, age: text })}
              keyboardType="number-pad"
            />
          </View>

          <View className="mb-6">
            <Text className="text-white/80 text-sm mb-2">Bio</Text>
            <TextInput
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
              placeholder="Tell us about yourself..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={profileData.bio}
              onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Text className="text-white/80 text-sm">Phone</Text>
              <Text className="text-white/40 text-xs ml-2">
                (optional — SMS login coming soon)
              </Text>
            </View>
            <TextInput
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={profileData.phone}
              onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            className="bg-white/10 border border-white/30 border-dashed rounded-2xl py-8 items-center overflow-hidden"
            onPress={pickImage}
            disabled={isSaving}
          >
            {selectedImageUri ? (
              <View className="w-full items-center">
                <Image 
                  source={{ uri: selectedImageUri }}
                  className="w-32 h-32 rounded-2xl mb-3"
                  resizeMode="cover"
                />
                <Text className="text-white/80 text-sm">Tap to change photo</Text>
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-white/60 text-sm">📸</Text>
                <Text className="text-white/60 text-sm mt-2">Upload Photo</Text>
                <Text className="text-white/40 text-xs mt-1">Tap to select</Text>
              </View>
            )}
          </TouchableOpacity>

          {uploadError && (
            <View className="mt-2">
              <Text className="text-red-400 text-xs text-center">{uploadError}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-4 ${isSaving ? 'bg-blue-500/50' : 'bg-blue-500'}`}
          onPress={handleContinue}
          disabled={isSaving}
        >
          {isSaving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="#ffffff" size="small" />
              <Text className="text-white text-center text-base font-semibold ml-2">
                Saving...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center text-base font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

