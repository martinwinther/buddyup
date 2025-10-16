import React from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native';
import { CandidatesRepository } from '../features/discover/CandidatesRepository';
import { SwipesRepository } from '../features/discover/SwipesRepository';
import SwipeDeck, { type SwipeDeckRef } from '../features/discover/SwipeDeck';
import ActionBar from '../features/discover/ActionBar';
import TopBar from '../components/TopBar';
import type { Candidate } from '../features/discover/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const candidatesRepo = new CandidatesRepository();
const swipesRepo = new SwipesRepository();

export default function Discover() {
  const nav = useNavigation<any>();
  const deckRef = React.useRef<SwipeDeckRef>(null);
  const [loading, setLoading] = React.useState(true);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [matchVisible, setMatchVisible] = React.useState(false);
  const [lastMatch, setLastMatch] = React.useState<{ matchId?: string; otherId?: string; otherName?: string }>({});

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
      if (res?.matched) {
        const candidate = candidates.find(c => c.id === id);
        setLastMatch({
          matchId: res.matchId,
          otherId: res.otherId,
          otherName: candidate?.displayName ?? undefined,
        });
        setMatchVisible(true);
      }
    } catch (e) {
      console.warn('[discover] swipe error', e);
      // non-blocking
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
      <TopBar onPressRight={() => nav.navigate('Matches')} />

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

      <Modal visible={matchVisible} transparent animationType="fade" onRequestClose={() => setMatchVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-[85%] rounded-3xl p-6 bg-zinc-900/90 border border-white/10">
            <Text className="text-2xl text-teal-200 font-semibold">You liked {lastMatch.otherName}!</Text>
            <Text className="text-zinc-300 mt-2">Send them a message to start chatting 💬</Text>
            <View className="flex-row gap-3 mt-5">
              <Pressable className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10" onPress={() => setMatchVisible(false)}>
                <Text className="text-center text-zinc-100">Keep swiping</Text>
              </Pressable>
              <Pressable 
                className="flex-1 px-4 py-3 rounded-2xl bg-teal-500/90" 
                onPress={() => {
                  setMatchVisible(false);
                  if (lastMatch.matchId) {
                    nav.navigate('Chat', { 
                      matchId: lastMatch.matchId, 
                      otherId: lastMatch.otherId, 
                      name: lastMatch.otherName 
                    });
                  } else {
                    nav.navigate('Matches');
                  }
                }}
              >
                <Text className="text-center text-zinc-900 font-semibold">Send message</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

