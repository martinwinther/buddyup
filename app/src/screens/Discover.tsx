import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { ServerDiscoverRepository, type DeckCandidate } from '../features/discover/ServerDiscoverRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import InlineToast from '../components/InlineToast';
import FiltersSheet from '../features/discover/FiltersSheet';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from '../features/discover/DiscoveryPrefsRepository';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const swipesRepo = new SwipesRepository();
const prefsRepo = new DiscoveryPrefsRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const serverRepo = React.useMemo(() => new ServerDiscoverRepository(), []);
  const [loading, setLoading] = React.useState(true);
  const [candidates, setCandidates] = React.useState<DeckCandidate[]>([]);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [prefs, setPrefs] = React.useState<DiscoveryPrefs>({ age_min: 18, age_max: 60, max_km: 50, boosted_category_ids: [] });
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

  const openProfile = (c: DeckCandidate) => {
    nav.navigate('ProfileSheet', {
      userId: c.id,
      fallback: {
        name: c.displayName,
        age: c.age,
        photoUrl: c.photoUrl,
        distanceKm: c.distanceKm,
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

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await serverRepo.list(200);
      setCandidates(rows);
    } finally {
      setLoading(false);
    }
  }, [serverRepo]);

  React.useEffect(() => {
    ensureMyLocation();
  }, [ensureMyLocation]);

  React.useEffect(() => {
    (async () => {
      const p = await prefsRepo.get();
      setPrefs(p);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const handleSwipe = async (id: string, dir: 'left' | 'right') => {
    try {
      const res = await swipesRepo.recordSwipe(id, dir);
      if (dir === 'right' && res && res.matchId) {
        const candidate = candidates.find(c => c.id === id);
        const name = candidate?.displayName;
        showToast(name ? `You can now message ${name}` : 'Added to Messages');
      }
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

  if (candidates.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <Text className="text-zinc-100 text-lg">You're all caught up</Text>
        <Text className="text-zinc-400 mt-1">Check back later for new people</Text>
        <Pressable onPress={load} className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
          <Text className="text-zinc-100">Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <TopBar onPressLeft={() => nav.navigate('Settings')} onPressRight={() => nav.navigate('Matches')} />

      <Pressable
        onPress={() => setFiltersOpen(true)}
        className="absolute right-4 top-16 z-10 px-3 py-2 rounded-xl bg-white/10 border border-white/10"
      >
        <Ionicons name="options-outline" size={18} color="#E5E7EB" />
      </Pressable>

      <Pressable
        onPress={() => nav.navigate('Likes')}
        className="absolute right-4 top-28 z-10 px-3 py-2 rounded-xl bg-white/10 border border-white/10"
      >
        <Ionicons name="heart-outline" size={18} color="#E5E7EB" />
      </Pressable>

      <View className="flex-1 items-center justify-center">
        <SwipeDeck ref={deckRef} candidates={candidates} onSwipe={handleSwipe} onPress={openProfile} />
      </View>

      <ActionBar
        onNope={() => deckRef.current?.swipeLeft()}
        onLike={() => deckRef.current?.swipeRight()}
        onSuperLike={() => deckRef.current?.swipeRight()}
        onRewind={() => {}}
        onBoost={() => {}}
      />

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={prefs}
        onApply={(p) => {
          setPrefs(p);
          load();
        }}
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

