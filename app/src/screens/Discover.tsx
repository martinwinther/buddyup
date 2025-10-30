import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { type Candidate } from '../features/discover/SupabaseDiscoverRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import InlineToast from '../components/InlineToast';
import CardSkeleton from '../components/CardSkeleton';
import { useDeckPager } from '../features/discover/useDeckPager';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from '../features/discover/DiscoveryPrefsRepository';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { pe } from '../ui/platform';

const swipesRepo = new SwipesRepository();
const prefsRepo = new DiscoveryPrefsRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const pager = useDeckPager();
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [prefs, setPrefs] = React.useState<DiscoveryPrefs | null>(null);

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

  const onSwiped = React.useCallback(() => {
    pager.consumeHead();
  }, [pager]);

  const openProfile = (c: Candidate) => {
    nav.navigate('ProfileSheet', {
      userId: c.id,
      fallback: {
        name: c.display_name,
        age: c.age,
        photoUrl: c.photo_url,
        distanceKm: c.distance_km,
      },
    });
  };

  const ensureMyLocation = React.useCallback(async () => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) return;

      const { data: me } = await supabase.from('profiles').select('latitude, longitude').eq('id', uid).maybeSingle();
      if (me?.latitude != null && me?.longitude != null) return;

      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({});
      await supabase.from('profiles').update({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        last_active: new Date().toISOString(),
      }).eq('id', uid);
    } catch {}
  }, []);

  React.useEffect(() => {
    ensureMyLocation();
  }, [ensureMyLocation]);

  // Refresh on return: watch route params and reload deck when refresh changes
  React.useEffect(() => {
    if (route.params?.refresh) {
      prefsRepo.load().then(setPrefs);
      // also re-fetch deck
      pager.refresh();
    }
  }, [route.params?.refresh, pager]);

  useFocusEffect(
    React.useCallback(() => {
      pager.refresh();
    }, [pager])
  );

  const handleSwipe = async (id: string, dir: 'left' | 'right') => {
    try {
      const res = await swipesRepo.recordSwipe(id, dir);
      if (dir === 'right' && res && res.matchId) {
        const candidate = pager.items.find(c => c.id === id);
        const name = candidate?.display_name;
        showToast(name ? `You can now message ${name}` : 'Added to Messages');
      }
      onSwiped();
    } catch (e) {
      console.warn('[discover] swipe error', e);
      showToast('Something went wrong');
    }
  };

  const cards = pager.items;

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <TopBar onPressLeft={() => nav.navigate('Settings')} onPressRight={() => nav.navigate('Matches')} />

      <View className="absolute top-20 right-2 z-10" {...pe('box-none')}>
        <View {...pe('auto')}>
          <Pressable 
            onPress={() => nav.navigate('DiscoverySettings')} 
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/20"
          >
            <Ionicons name="options-outline" size={16} color="#E5E7EB" />
          </Pressable>
        </View>
      </View>

      <View className="absolute top-32 right-2 z-10" {...pe('box-none')}>
        <View {...pe('auto')}>
          <Pressable
            onPress={() => nav.navigate('Likes')}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/20"
            accessibilityLabel="Open likes"
          >
            <Ionicons name="heart-outline" size={16} color="#E5E7EB" />
          </Pressable>
        </View>
      </View>

      <View className="absolute top-44 right-2 z-10" {...pe('box-none')}>
        <View {...pe('auto')}>
          <Pressable
            onPress={pager.refresh}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/20"
          >
            <Ionicons name="refresh" size={16} color="#E5E7EB" />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        {pager.loading && cards.length === 0 ? (
          <CardSkeleton />
        ) : cards.length === 0 ? (
          <View className="items-center gap-3">
            <Text className="text-zinc-200 text-base">You're all caught up</Text>
            <View className="flex-row gap-2 mt-1">
              <Pressable
                onPress={pager.refresh}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
              >
                <Text className="text-zinc-100">Reload</Text>
              </Pressable>
              <Pressable
                onPress={() => nav.navigate('DiscoverySettings')}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
              >
                <Text className="text-zinc-100">Edit preferences</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <SwipeDeck ref={deckRef} candidates={cards} onSwipe={handleSwipe} onPress={openProfile} />
        )}
      </View>

      <ActionBar
        onNope={() => deckRef.current?.swipeLeft()}
        onLike={() => deckRef.current?.swipeRight()}
        onSuperLike={() => deckRef.current?.swipeRight()}
        onRewind={() => {}}
        onBoost={() => {}}
      />

      {/* Inline non-blocking error banner */}
      {pager.error ? (
        <View className="absolute bottom-6 left-4 right-4">
          <View className="px-4 py-3 rounded-2xl bg-red-500/90">
            <Text className="text-zinc-900">
              {pager.error} ·{' '}
              <Text onPress={pager.retry} className="underline">Retry</Text>
            </Text>
          </View>
        </View>
      ) : null}

      <InlineToast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
        position="top"
      />
    </View>
  );
}

