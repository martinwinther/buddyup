import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileData, RootStackParamList } from '../../types';
import { useOnboardingPersistence } from '../../features/onboarding/persistence';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionGate } from '../../lib/authGate';
import { Routes } from '../../navigation/routes';
import { Banner } from '../../components/Banner';
import PhotoGridManager from '../../components/PhotoGridManager';
import { calculateAge, isValidAge } from '../../lib/age';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

type StepProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OnboardingProfile'>;

export default function StepProfile() {
  const navigation = useNavigation<StepProfileNavigationProp>();
  const persistence = useOnboardingPersistence();
  const { user, session, isLoading, signOut } = useAuth();
  const { loading: gateLoading, hasSession } = useSessionGate();
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    bio: '',
    phone: '',
  });
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'info' | 'warning' | 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!gateLoading && !hasSession) {
      navigation.reset({ 
        index: 0, 
        routes: [{ name: Routes.AuthSignIn as never }] 
      });
    }
  }, [gateLoading, hasSession, navigation]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setBirthdate(selectedDate);
      const age = calculateAge(selectedDate.toISOString().split('T')[0]);
      if (age !== null) {
        setProfileData({ ...profileData, age: age.toString() });
      }
    }
  };

  const handleSignIn = async () => {
    await signOut();
    navigation.reset({ 
      index: 0, 
      routes: [{ name: Routes.AuthSignIn as never }] 
    });
  };

  const handleContinue = async () => {
    if (!profileData.displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    if (!birthdate) {
      Alert.alert('Error', 'Please select your date of birth');
      return;
    }

    const birthdateString = birthdate.toISOString().split('T')[0];
    const age = calculateAge(birthdateString);

    if (!isValidAge(age)) {
      Alert.alert('Age Requirement Not Met', 'You must be at least 18 years old to use this service.');
      navigation.navigate('OnboardingNotEligible' as never);
      return;
    }

    if (!confirmedOver18) {
      Alert.alert('Confirmation Required', 'Please confirm that you are 18 years or older');
      return;
    }

    setIsSaving(true);
    setBanner(null);

    try {
      await persistence.saveProfile({
        displayName: profileData.displayName.trim(),
        age: age!,
        birthdate: birthdateString,
        bio: profileData.bio?.trim() || undefined,
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
            <Text className="text-white/80 text-sm mb-2">Date of Birth *</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className={birthdate ? "text-white text-base" : "text-white/40 text-base"}>
                {birthdate
                  ? birthdate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Select your date of birth'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
            {birthdate && profileData.age && (
              <Text className="text-white/60 text-xs mt-1">Age: {profileData.age}</Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={birthdate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>

          <View className="mb-6">
            <Pressable
              onPress={() => setConfirmedOver18(!confirmedOver18)}
              className="flex-row items-center gap-3"
            >
              <View className={`w-6 h-6 rounded border-2 ${confirmedOver18 ? 'bg-blue-500 border-blue-500' : 'border-white/40'} items-center justify-center`}>
                {confirmedOver18 && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
              <Text className="text-white/80 text-base flex-1">I confirm that I am 18 years of age or older</Text>
            </Pressable>
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

          <PhotoGridManager className="mt-4" />
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

        <View className="flex-row justify-center mt-4">
          <Text className="text-white/60 text-sm">Already have an account? </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text className="text-blue-500 text-sm font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>

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

