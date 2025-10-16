import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { CandidatesRepository } from '../features/discover/CandidatesRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import InlineToast from '../components/InlineToast';
import type { Candidate } from '../features/discover/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const candidatesRepo = new CandidatesRepository();
const swipesRepo = new SwipesRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const [loading, setLoading] = React.useState(true);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [toast, setToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const list = await candidatesRepo.listCandidatesForMe(20);
      setCandidates(list);
    } catch (e) {
      console.warn('[discover] load error', e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
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

      <InlineToast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
        position="top"
      />
    </View>
  );
}

