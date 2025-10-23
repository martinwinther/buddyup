import React from 'react';
import { View, Text, Pressable, ScrollView, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProfileDetailRepository } from '../../features/profile/ProfileDetailRepository';
import { recordSwipe } from '../../features/discover/SwipesRepository';
import { LikesRepository } from '../../features/likes/LikesRepository';
import { ProfilePhotosRepository } from '../../features/profile/ProfilePhotosRepository';
import { pe } from '../../ui/platform';

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

  const photosRepo = React.useMemo(() => new ProfilePhotosRepository(), []);
  const [gallery, setGallery] = React.useState<{ id: string; url: string }[]>([]);

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

  React.useEffect(() => {
    (async () => {
      const list = await photosRepo.listByUser(userId);
      setGallery((list ?? []).map(p => ({ id: p.id, url: p.url })));
    })();
  }, [userId, photosRepo]);

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
      
      // Generate a proper UUID for the temporary matchId
      // This ensures the database accepts it as a valid UUID
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const matchId = generateUUID();
      
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
      <View className="absolute top-10 left-4 right-4 z-10 flex-row justify-between" {...pe('box-none')}>
        <View {...pe('auto')}>
          <Pressable 
            onPress={() => nav.goBack()} 
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
          >
            <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
          </Pressable>
        </View>
        <View className="flex-row gap-2" {...pe('auto')}>
          <Pressable 
            onPress={like} 
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
          >
            <Ionicons name="heart" size={18} color="#34D399" />
          </Pressable>
          <Pressable 
            onPress={message} 
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-3 py-2 rounded-xl bg-teal-500/90"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0A0A0A" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Hero image */}
        <View className="w-full h-[480px] bg-white/5">
          {gallery.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%', height: '100%' }}
            >
              {gallery.map((g) => (
                <View key={g.id} style={{ width: Dimensions.get('window').width, height: 480 }}>
                  <Image source={{ uri: g.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              ))}
            </ScrollView>
          ) : photoUrl ? (
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
