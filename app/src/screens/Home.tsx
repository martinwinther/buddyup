import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingPersistence } from '../features/onboarding/persistence';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';

interface Profile {
  display_name: string;
  age: number;
  bio: string | null;
}

export default function Home() {
  const { user, signOut } = useAuth();
  const persistence = useOnboardingPersistence();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, age, bio')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleClearOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'Note: Onboarding data is now stored in the database. To reset, you\'ll need to sign out and sign back in, or manually delete your profile data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="px-6 py-4 border-b border-white/10 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-semibold text-zinc-100">
            Discover
          </Text>
          {profile && (
            <Text className="text-sm text-zinc-400 mt-1">
              Welcome back, {profile.display_name}!
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-white/10 px-4 py-2 rounded-xl border border-white/20"
        >
          <Text className="text-white text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          <View className="bg-zinc-900/90 rounded-3xl border border-white/20 p-6 mb-4">
            <Text className="text-white text-xl font-semibold mb-2">
              Your Profile
            </Text>
            {profile && (
              <View>
                <Text className="text-white/80 text-base">
                  {profile.display_name}, {profile.age}
                </Text>
                {profile.bio && (
                  <Text className="text-white/60 text-sm mt-2">{profile.bio}</Text>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleClearOnboarding}
            className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 mb-4"
          >
            <Text className="text-amber-400 text-sm text-center font-medium">
              ⚙️ Reset Onboarding (Dev)
            </Text>
          </TouchableOpacity>

          <Text className="text-white text-xl font-semibold mb-4 px-2">
            Discover Buddies
          </Text>

          <GlassCard
            title="Alex, 28"
            subtitle="Looking for gym buddies and hiking partners in SF"
            imageUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80"
            categories={['Gym', 'Hiking', 'Cooking']}
            className="mb-4"
          />

          <GlassCard
            title="Marcus, 32"
            subtitle="Into spirituality, meditation, and outdoor adventures"
            imageUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
            categories={['Spirituality', 'Meditation', 'Basketball']}
            className="mb-4"
          />

          <GlassCard
            title="David, 26"
            subtitle="Passionate about cooking and trying new restaurants"
            imageUrl="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80"
            categories={['Cooking', 'Food', 'Music']}
            className="mb-4"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

