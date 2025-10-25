import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SupabaseDiscoverRepository, type Candidate } from '../features/discover/SupabaseDiscoverRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import InlineToast from '../components/InlineToast';
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
  const repo = React.useMemo(() => new SupabaseDiscoverRepository(), []);
  const [cards, setCards] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [offset, setOffset] = React.useState(0);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [prefs, setPrefs] = React.useState<DiscoveryPrefs | null>(null);
  const PAGE = 30;

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

  const loadPage = React.useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      const nextOffset = fresh ? 0 : offset;
      const result = await repo.page(PAGE, nextOffset);
      setCards((prev) => fresh ? result : [...prev, ...result]);
      setOffset((o) => fresh ? result.length : o + result.length);
    } finally {
      setLoading(false);
    }
  }, [repo, offset]);

  const onCardConsumed = React.useCallback(() => {
    setCards((prev) => {
      const next = prev.slice(1);
      if (next.length < 5 && !loading) {
        // fire and forget; no double fetch guard needed for simplicity
        loadPage(false);
      }
      return next;
    });
  }, [loadPage, loading]);

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
    loadPage(true);
  }, [loadPage]);

  React.useEffect(() => {
    ensureMyLocation();
  }, [ensureMyLocation]);

  // Refresh on return: watch route params and reload deck when refresh changes
  React.useEffect(() => {
    if (route.params?.refresh) {
      prefsRepo.load().then(setPrefs);
      // also re-fetch deck
      loadPage(true);
    }
  }, [route.params?.refresh, loadPage]);

  useFocusEffect(
    React.useCallback(() => {
      loadPage(true);
    }, [loadPage])
  );

  const handleSwipe = async (id: string, dir: 'left' | 'right') => {
    try {
      const res = await swipesRepo.recordSwipe(id, dir);
      if (dir === 'right' && res && res.matchId) {
        const candidate = cards.find(c => c.id === id);
        const name = candidate?.display_name;
        showToast(name ? `You can now message ${name}` : 'Added to Messages');
      }
      onCardConsumed();
    } catch (e) {
      console.warn('[discover] swipe error', e);
      showToast('Something went wrong');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <ActivityIndicator />
        <Text className="text-zinc-300 mt-2">Loading people…</Text>
      </View>
    );
  }

  if (!loading && cards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <Text className="text-zinc-100 text-lg">You're all caught up</Text>
        <Text className="text-zinc-400 mt-1">Check back later for new people</Text>
        <Pressable onPress={() => loadPage(true)} className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
          <Text className="text-zinc-100">Refresh</Text>
        </Pressable>
      </View>
    );
  }

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
            onPress={() => nav.navigate('LikedYou')}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
            className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/20"
          >
            <Ionicons name="heart-outline" size={16} color="#E5E7EB" />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <SwipeDeck ref={deckRef} candidates={cards} onSwipe={handleSwipe} onPress={openProfile} />
      </View>

      <ActionBar
        onNope={() => deckRef.current?.swipeLeft()}
        onLike={() => deckRef.current?.swipeRight()}
        onSuperLike={() => deckRef.current?.swipeRight()}
        onRewind={() => {}}
        onBoost={() => {}}
      />


      <InlineToast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
        position="top"
      />
    </View>
  );
}

