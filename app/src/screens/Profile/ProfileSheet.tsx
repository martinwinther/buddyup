import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProfileDetailRepository } from '../../features/profile/ProfileDetailRepository';
import { recordSwipe } from '../../features/discover/SwipesRepository';
import { LikesRepository } from '../../features/likes/LikesRepository';

type RouteParams = { userId: string; fallback?: { name?: string | null; age?: number | null; photoUrl?: string | null; distanceKm?: number | null } };

const detailsRepo = new ProfileDetailRepository();
const likesRepo = new LikesRepository();

export default function ProfileSheet() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as RouteParams | undefined;
  
  if (!params?.userId) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <Text className="text-zinc-100">Invalid profile</Text>
        <Pressable onPress={() => nav.goBack()} className="mt-4 px-4 py-2 rounded-xl bg-white/10">
          <Text className="text-zinc-100">Go back</Text>
        </Pressable>
      </View>
    );
  }
  
  const { userId, fallback } = params;

  const [loading, setLoading] = React.useState(true);
  const [d, setD] = React.useState<Awaited<ReturnType<typeof detailsRepo.load>> | null>(null);
  const name = d?.display_name ?? fallback?.name ?? 'Buddy';
  const age = d?.age ?? fallback?.age ?? null;
  const photoUrl = d?.photo_url ?? fallback?.photoUrl ?? null;
  const distanceKm = d?.distance_km ?? fallback?.distanceKm ?? null;

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await detailsRepo.load(userId);
        setD(res);
      } catch (error) {
        console.error('[ProfileSheet] Failed to load profile details:', error);
        // Continue with fallback data
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const like = async () => {
    try {
      await recordSwipe(userId, 'right');
      Alert.alert('Liked', `You liked ${name}. You can message now.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not like user.');
    }
  };

  const message = async () => {
    try {
      console.log('[ProfileSheet] Attempting to create thread with user:', userId);
      
      // For now, create a simple matchId using the user IDs
      // This is a temporary solution until the database tables are set up
      const matchId = `temp_${userId}_${Date.now()}`;
      
      console.log('[ProfileSheet] Using temporary matchId:', matchId);
      console.log('[ProfileSheet] Navigating to Chat with:', { matchId, otherId: userId, name });
      
      nav.navigate('Chat', { matchId, otherId: userId, name });
    } catch (e: any) {
      console.error('[ProfileSheet] message error:', e);
      Alert.alert('Error', e.message ?? 'Could not open chat.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <Text className="text-zinc-100">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {/* Header actions */}
      <View className="absolute top-10 left-4 right-4 z-10 flex-row justify-between">
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable onPress={like} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
            <Ionicons name="heart" size={18} color="#34D399" />
          </Pressable>
          <Pressable onPress={message} className="px-3 py-2 rounded-xl bg-teal-500/90">
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0A0A0A" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Hero image */}
        <View className="w-full h-[480px] bg-white/5">
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="person-circle-outline" size={72} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-zinc-100 text-xl font-semibold">
              {name}{age ? `, ${age}` : ''}
            </Text>
            <Text className="text-zinc-400 text-sm">
              {distanceKm != null ? `${Math.round(distanceKm)} km away` : '—'}
            </Text>
          </View>

          {d?.bio ? (
            <Text className="text-zinc-300 mt-3 leading-6">{d.bio}</Text>
          ) : null}

          {/* Categories */}
          {d?.categories?.length ? (
            <View className="mt-6">
              <Text className="text-zinc-400 mb-2">Interests</Text>
              <View className="flex-row flex-wrap gap-2">
                {d.categories.map((c) => {
                  const shared = d.mySharedCategoryIds.includes(c.id);
                  return (
                    <View
                      key={c.id}
                      className={`px-3 py-2 rounded-xl border ${shared ? 'border-teal-400 bg-teal-500/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <Text className={shared ? 'text-teal-200' : 'text-zinc-200'}>{c.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
