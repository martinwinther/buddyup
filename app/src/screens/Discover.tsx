import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { type Candidate } from '../features/discover/SupabaseDiscoverRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import { AppHeader } from '../components/AppHeader';
import { MenuSheet } from '../components/MenuSheet';
import InlineToast from '../components/InlineToast';
import CardSkeleton from '../components/CardSkeleton';
import ReportModal from '../components/ReportModal';
import { useDeckPager } from '../features/discover/useDeckPager';
import { DiscoveryPrefs, DiscoveryPrefsRepository } from '../features/discover/DiscoveryPrefsRepository';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { pe } from '../ui/platform';
import { blockUser } from '../features/safety/SafetyRepository';
import { useChatNotify } from '../features/messages';
import { useBlocks } from '../hooks/useBlocks';
import { mapSupabaseError } from '../lib/errors';
import { msToS, superPerDay, swipePer10s } from '../lib/rateLimit';

const swipesRepo = new SwipesRepository();
const prefsRepo = new DiscoveryPrefsRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { unreadTotal } = useChatNotify();
  const { isBlocked } = useBlocks();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const pager = useDeckPager();
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [prefs, setPrefs] = React.useState<DiscoveryPrefs | null>(null);
  const [cardMenuOpen, setCardMenuOpen] = React.useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportTarget, setReportTarget] = React.useState<string | null>(null);

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

  const handleSwipe = async (id: string, dir: 'left' | 'right' | 'super') => {
    const burst = swipePer10s.take();
    if (!burst.ok) {
      const wait = msToS(burst.remainingMs);
      showToast(wait > 0 ? `Slow down. Try again in ${wait}s` : 'Slow down. Try again shortly');
      return;
    }

    if (dir === 'super') {
      const superCap = superPerDay.take();
      if (!superCap.ok) {
        showToast('Daily super-like limit reached');
        return;
      }
    }

    try {
      const res = await swipesRepo.recordSwipe(id, dir);
      if ((dir === 'right' || dir === 'super') && res && res.matchId) {
        const candidate = pager.items.find(c => c.id === id);
        const name = candidate?.display_name;
        showToast(name ? `You can now message ${name}` : 'Added to Messages');
      }
      onSwiped();
    } catch (e: any) {
      console.warn('[discover] swipe error', e);
      showToast(mapSupabaseError(e?.message));
    }
  };

  const handleBlockQuick = async () => {
    const currentCard = cards[0];
    if (!currentCard) return;
    setCardMenuOpen(false);
    try {
      await blockUser(currentCard.id);
      showToast('Blocked');
      onSwiped();
    } catch (e) {
      console.warn('[discover] block error', e);
      showToast('Failed to block');
    }
  };

  const handleReportOpen = () => {
    const currentCard = cards[0];
    if (!currentCard) return;
    setCardMenuOpen(false);
    setReportTarget(currentCard.id);
    setReportOpen(true);
  };

  const cards = React.useMemo(
    () => pager.items.filter(card => !isBlocked(card.id)),
    [pager.items, isBlocked]
  );

  const menuItems = [
    { 
      key: 'messages', 
      label: unreadTotal > 0 ? `Messages (${unreadTotal})` : 'Messages', 
      icon: 'chatbubble-ellipses-outline' as const, 
      onPress: () => nav.navigate('Matches') 
    },
    { 
      key: 'liked', 
      label: 'Liked you', 
      icon: 'heart-outline' as const, 
      onPress: () => nav.navigate('LikedYou') 
    },
    { 
      key: 'prefs', 
      label: 'Discovery preferences', 
      icon: 'options-outline' as const, 
      onPress: () => nav.navigate('DiscoverySettings') 
    },
    { 
      key: 'profile', 
      label: 'Edit profile', 
      icon: 'person-circle-outline' as const, 
      onPress: () => nav.navigate('EditProfile') 
    },
    { 
      key: 'settings', 
      label: 'Settings', 
      icon: 'settings-outline' as const, 
      onPress: () => nav.navigate('Settings') 
    },
    { 
      key: 'signout', 
      label: 'Sign out', 
      icon: 'log-out-outline' as const, 
      danger: true, 
      onPress: async () => { await supabase.auth.signOut(); } 
    },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <AppHeader onOpenMenu={() => setHeaderMenuOpen(true)} />

      {/* Card overflow menu */}
      {cards.length > 0 && (
        <>
          <View className="absolute top-20 left-2 z-10" {...pe('box-none')}>
            <View {...pe('auto')}>
              <Pressable
                onPress={() => setCardMenuOpen(v => !v)}
                hitSlop={8}
                android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
                className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/20"
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#E5E7EB" />
              </Pressable>
            </View>
          </View>

          {cardMenuOpen && (
            <View className="absolute top-32 left-2 z-10 rounded-xl border border-white/10 bg-[#0b0b0b]" {...pe('box-none')}>
              <View {...pe('auto')}>
                <Pressable
                  onPress={handleReportOpen}
                  className="px-4 py-3 border-b border-white/10"
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  <Text className="text-zinc-100">Report user</Text>
                </Pressable>
                <Pressable
                  onPress={handleBlockQuick}
                  className="px-4 py-3"
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  <Text className="text-red-300">Block user</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}

      <View className="flex-1" style={{ overflow: 'hidden' }}>
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

      <ReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedId={reportTarget}
        defaultBlock={true}
        onSubmitted={({ reported, blocked }) => {
          if (reported) {
            showToast(blocked ? 'Reported & blocked' : 'Reported');
            onSwiped();
          }
        }}
      />

      <MenuSheet 
        visible={headerMenuOpen} 
        onClose={() => setHeaderMenuOpen(false)} 
        items={menuItems} 
      />
    </View>
  );
}

