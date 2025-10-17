import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CandidatesRepository } from '../features/discover/CandidatesRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import InlineToast from '../components/InlineToast';
import FiltersSheet from '../features/discover/FiltersSheet';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from '../features/discover/DiscoveryPrefsRepository';
import { kmBetween } from '../features/discover/geo';
import type { Candidate } from '../features/discover/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const candidatesRepo = new CandidatesRepository();
const swipesRepo = new SwipesRepository();
const prefsRepo = new DiscoveryPrefsRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const [loading, setLoading] = React.useState(true);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [prefs, setPrefs] = React.useState<DiscoveryPrefs>({ age_min: 18, age_max: 60, max_km: 50, boosted_category_ids: [] });
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

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

  const filterAndScore = React.useCallback(async (rows: any[], myCats: number[]) => {
    const boosted = new Set(prefs.boosted_category_ids);

    const enriched = rows.map((r) => {
      const overlap = (r.categories ?? []).filter((cid: number) => myCats.includes(cid)).length;
      const boostHit = (r.categories ?? []).filter((cid: number) => boosted.has(cid)).length;
      const scoreBase = overlap * 10 + boostHit * 8;

      const age = r.age ?? null;
      let agePenalty = 0;
      if (age != null) {
        if (age < prefs.age_min) agePenalty = (prefs.age_min - age) * 2;
        if (age > prefs.age_max) agePenalty = (age - prefs.age_max) * 2;
      }

      let distanceKm: number | null = null;
      if (r.latitude != null && r.longitude != null && r._meLat != null && r._meLon != null) {
        distanceKm = kmBetween({ lat: r._meLat, lon: r._meLon }, { lat: r.latitude, lon: r.longitude });
      }

      const distancePenalty = distanceKm != null && prefs.max_km != null ? Math.max(0, (distanceKm - prefs.max_km) * 0.5) : 0;
      const score = scoreBase - agePenalty - distancePenalty;

      return {
        id: r.id,
        displayName: r.display_name ?? 'Buddy',
        age: r.age ?? null,
        bio: r.bio ?? null,
        photoUrl: r.photo_url ?? null,
        score: Math.round(score),
        distanceKm,
        categories: r.categories ?? [],
      };
    });

    const withinAge = enriched.filter(c => {
      if (c.age == null) return true;
      return c.age >= prefs.age_min && c.age <= prefs.age_max;
    });

    const withinDist = withinAge.filter(c => {
      if (prefs.max_km == null) return true;
      if (c.distanceKm == null) return true;
      return c.distanceKm <= prefs.max_km;
    });

    withinDist.sort((a, b) => b.score - a.score);
    return withinDist;
  }, [prefs]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data: s } = await supabase.auth.getSession();
      const me = s?.session?.user?.id;
      if (!me) return;

      const [{ data: myProfile }, { data: myCategories }] = await Promise.all([
        supabase.from('profiles').select('latitude, longitude').eq('id', me).maybeSingle(),
        supabase.from('user_categories').select('category_id').eq('user_id', me),
      ]);

      const myLat = myProfile?.latitude ?? null;
      const myLon = myProfile?.longitude ?? null;
      const myCats = (myCategories ?? []).map(r => r.category_id);

      const { data: liked } = await supabase
        .from('swipes')
        .select('target_id')
        .eq('swiper_id', me)
        .eq('direction', 'right');
      const excludeIds = (liked ?? []).map(r => r.target_id);
      excludeIds.push(me);

      const { data: disliked } = await supabase
        .from('swipes')
        .select('target_id')
        .eq('swiper_id', me)
        .eq('direction', 'left');
      const dislikedSet = new Set((disliked ?? []).map(r => r.target_id));

      let query = supabase
        .from('profiles')
        .select('id, display_name, age, bio, photo_url, latitude, longitude, last_active');
      
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }
      
      const { data: profs } = await query
        .order('last_active', { ascending: false })
        .limit(100);

      const ids = (profs ?? []).map(c => c.id);
      if (ids.length === 0) {
        setCandidates([]);
        return;
      }

      const { data: cats } = await supabase
        .from('user_categories')
        .select('user_id, category_id, active')
        .in('user_id', ids);

      const catsByUser = new Map<string, number[]>();
      for (const row of cats ?? []) {
        if (row.active === false) continue;
        const list = catsByUser.get(row.user_id) ?? [];
        list.push(row.category_id);
        catsByUser.set(row.user_id, list);
      }

      const merged = (profs ?? []).map(r => ({
        ...r,
        _meLat: myLat,
        _meLon: myLon,
        categories: catsByUser.get(r.id) ?? [],
        _disliked: dislikedSet.has(r.id),
      }));

      const filtered = await filterAndScore(merged, myCats);
      
      const finalScored = filtered.map(c => {
        const original = merged.find(m => m.id === c.id);
        if (original?._disliked) {
          return { ...c, score: c.score - 1000 };
        }
        return c;
      });

      finalScored.sort((a, b) => b.score - a.score);
      setCandidates(finalScored.slice(0, 20));
    } catch (e) {
      console.warn('[discover] load error', e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [filterAndScore]);

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

      <View className="flex-1 items-center justify-center">
        <SwipeDeck ref={deckRef} candidates={candidates} onSwipe={handleSwipe} />
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

