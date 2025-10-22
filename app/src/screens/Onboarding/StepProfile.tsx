import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ProfileData, RootStackParamList } from '../../types';
import { useOnboardingPersistence } from '../../features/onboarding/persistence';
import { useAuth } from '../../contexts/AuthContext';
import { tryUploadProfilePhoto } from '../../lib/upload';
import { useSessionGate } from '../../lib/authGate';
import { Routes } from '../../navigation/routes';
import { Banner } from '../../components/Banner';
import { ProfilePhotosRepository } from '../../features/profile/ProfilePhotosRepository';

type StepProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

export default function StepProfile() {
  const navigation = useNavigation<StepProfileNavigationProp>();
  const persistence = useOnboardingPersistence();
  const { user, session, isLoading } = useAuth();
  const { loading: gateLoading, hasSession } = useSessionGate();
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    bio: '',
    phone: '',
  });
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'info' | 'warning' | 'error' | 'success'; text: string } | null>(null);

  const photosRepo = React.useMemo(() => new ProfilePhotosRepository(), []);
  const [photos, setPhotos] = React.useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = React.useState(false);

  useEffect(() => {
    if (!gateLoading && !hasSession) {
      navigation.reset({ 
        index: 0, 
        routes: [{ name: Routes.AuthSignIn as never }] 
      });
    }
  }, [gateLoading, hasSession, navigation]);

  React.useEffect(() => {
    // load existing (in case user resumes)
    (async () => {
      if (!user?.id) return;
      const list = await photosRepo.listByUser(user.id);
      setPhotos(list.map(p => ({ id: p.id, url: p.url })));
    })();
  }, [user?.id, photosRepo]);

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
      setBanner(null);
    }
  };

  const onAddPhoto = async () => {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (pick.canceled || !pick.assets?.length) return;
    setUploading(true);
    try {
      const asset = pick.assets[0];
      const added = await photosRepo.addFromUri(asset.uri, true);
      setPhotos(prev => [...prev, { id: added.id, url: added.url }]);
    } finally {
      setUploading(false);
    }
  };

  const onRemove = async (id: string) => {
    await photosRepo.remove(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const onSetPrimary = async (id: string) => {
    await photosRepo.setPrimary(id);
    // reorder locally: move chosen to front
    setPhotos(prev => {
      const chosen = prev.find(p => p.id === id)!;
      return [chosen, ...prev.filter(p => p.id !== id)];
    });
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
    setBanner(null);

    try {
      let photoUrl: string | null = null;

      if (selectedImageUri) {
        if (selectedImageUri.startsWith('http')) {
          photoUrl = selectedImageUri;
        } else {
          setIsUploading(true);
          const res = await tryUploadProfilePhoto(selectedImageUri);
          setIsUploading(false);

          if (res.ok) {
            photoUrl = res.url;
          } else {
            setBanner({
              type: 'warning',
              text:
                res.reason === 'RLS'
                  ? 'Could not upload your photo right now. You can continue and add it later.'
                  : 'Photo upload failed. You can continue and add a photo later.',
            });
            photoUrl = null;
          }
        }
      }

      await persistence.saveProfile({
        displayName: profileData.displayName.trim(),
        age: Number(profileData.age),
        bio: profileData.bio?.trim() || undefined,
        photoUri: photoUrl,
      });

      navigation.navigate(Routes.OnboardingCategories as never);
    } catch (error: any) {
      console.error('Error saving profile:', error);
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

        {banner && <Banner type={banner.type} text={banner.text} />}

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

          <View className="mt-4">
            <Text className="text-zinc-300 mb-2">Photos</Text>

            <View className="flex-row flex-wrap gap-3">
              {photos.map((p, idx) => (
                <View key={p.id} className="w-[30%] aspect-square rounded-xl overflow-hidden bg-white/5 relative">
                  <Image
                    source={{ uri: p.url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-1 left-1 right-1 flex-row justify-between">
                    <Pressable onPress={() => onRemove(p.id)} className="px-2 py-1 rounded-lg bg-black/50">
                      <Text className="text-red-300 text-xs">Remove</Text>
                    </Pressable>
                    {idx !== 0 ? (
                      <Pressable onPress={() => onSetPrimary(p.id)} className="px-2 py-1 rounded-lg bg-black/50">
                        <Text className="text-teal-300 text-xs">Primary</Text>
                      </Pressable>
                    ) : (
                      <View className="px-2 py-1 rounded-lg bg-black/50">
                        <Text className="text-zinc-200 text-xs">Primary</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {photos.length < 6 ? (
                <Pressable
                  onPress={onAddPhoto}
                  className="w-[30%] aspect-square rounded-xl border border-white/10 items-center justify-center bg-white/5"
                  disabled={uploading}
                >
                  <Text className="text-zinc-400">{uploading ? 'Uploading…' : '+ Add'}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-4 ${isSaving || isUploading ? 'bg-blue-500/50' : 'bg-blue-500'}`}
          onPress={handleContinue}
          disabled={isSaving || isUploading}
        >
          {isSaving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="#ffffff" size="small" />
              <Text className="text-white text-center text-base font-semibold ml-2">
                {isUploading ? 'Uploading photo...' : 'Saving...'}
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center text-base font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {__DEV__ && session?.user?.id && (
          <View className="mt-4 bg-zinc-900/50 rounded-xl p-3 border border-white/10">
            <Text className="text-white/40 text-xs font-mono mb-1">DEV INFO</Text>
            <Text className="text-white/60 text-xs font-mono">
              uid: {session.user.id.slice(0, 8)}…
            </Text>
            <Text className="text-white/60 text-xs font-mono">
              path: profiles/{session.user.id.slice(0, 8)}…/avatar.jpg
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

