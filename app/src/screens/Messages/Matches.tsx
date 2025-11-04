import React from 'react';
import { View, Text, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MatchesRepository, type MatchListItem, getUnreadCounts, subscribeToMatchMessages } from '../../features/messages';
import { markThreadRead } from '../../features/messages/readState';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { formatRelative, formatPresence } from '../../lib/time';
import { useAuth } from '../../contexts/AuthContext';

const repo = new MatchesRepository();

export default function Matches() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [items, setItems] = React.useState<MatchListItem[]>([]);
  const [filtered, setFiltered] = React.useState<MatchListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const subs = React.useRef<(() => void)[]>([]);

  const loadUnreadCounts = React.useCallback(async () => {
    try {
      const unread = await getUnreadCounts();
      const map = new Map(unread.map(r => [r.other_user_id, r.unread]));
      setItems(ts => ts.map(t => ({ ...t, unread: map.get(t.otherId) ?? 0 })));
    } catch (e) {
      console.error('[Matches] Failed to load unread counts:', e);
    }
  }, []);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await repo.listMyMatches();
      setItems(list);
      // Load unread counts after loading matches
      await loadUnreadCounts();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [loadUnreadCounts]);

  React.useEffect(() => { load(); }, [load]);

  // Setup realtime subscriptions for all matches
  React.useEffect(() => {
    // Clean up old subscriptions
    subs.current.forEach((u) => u());
    subs.current = [];

    if (!user?.id || items.length === 0) return;

    items.forEach((t) => {
      const off = subscribeToMatchMessages(t.matchId, (row) => {
        setItems((prev) => prev.map((th) => {
          if (th.matchId !== t.matchId) return th;
          const isMine = row.sender_id === user.id;
          return {
            ...th,
            lastMessage: { body: row.body, at: row.created_at, fromMe: isMine },
            unread: isMine ? th.unread : (th.unread ?? 0) + 1,
          };
        }));
      });
      subs.current.push(off);
    });

    return () => { subs.current.forEach((u) => u()); subs.current = []; };
  }, [items.length > 0 ? items.map(t => t.matchId).join(',') : '', user?.id]);

  // Refresh unread counts when screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCounts();
    }, [loadUnreadCounts])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  React.useEffect(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return setFiltered(items);
    setFiltered(
      items.filter((item) => {
        const name = (item.name ?? '').toLowerCase();
        const msg = (item.lastMessage?.body ?? '').toLowerCase();
        return name.includes(needle) || msg.includes(needle);
      })
    );
  }, [searchQuery, items]);

  const openChat = async (item: MatchListItem) => {
    // Optimistically clear unread in UI
    setItems((prev) => prev.map(i => i.matchId === item.matchId ? { ...i, unread: 0 } : i));
    if (user?.id) {
      try { await markThreadRead(user.id, item.matchId); } catch {}
    }
    nav.navigate('Chat', { matchId: item.matchId, otherId: item.otherId, name: item.name });
  };

  const renderItem = ({ item }: { item: MatchListItem }) => {
    const unread = item.unread ?? 0;
    return (
      <Pressable
        onPress={() => openChat(item)}
        className="flex-row items-center gap-3 px-4 py-3 border-b border-white/5"
        hitSlop={8}
        android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      >
        <Image
          source={item.photoUrl ? { uri: item.photoUrl } : require('../../../assets/icon.png')}
          className="w-12 h-12 rounded-full"
          contentFit="cover"
        />

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-zinc-100 font-semibold" numberOfLines={1}>
              {item.name ?? 'Buddy'}
            </Text>
            {!!item.lastActive && (
              <Text className="text-[11px] text-zinc-500" numberOfLines={1}>
                {formatPresence(item.lastActive)}
              </Text>
            )}
          </View>

          <Text className={`text-sm ${unread > 0 ? 'text-zinc-100' : 'text-zinc-400'}`} numberOfLines={1}>
            {item.lastMessage ? (
              <>
                {item.lastMessage.fromMe ? 'You: ' : ''}{item.lastMessage.body}
              </>
            ) : (
              'Say hi 👋'
            )}
          </Text>
        </View>

        <View className="items-end w-16">
          <Text className="text-[11px] text-zinc-500">
            {formatRelative(item.lastMessage?.at)}
          </Text>
          {unread > 0 && (
            <View 
              className="self-end mt-1 min-w-5 px-1 h-5 rounded-full bg-teal-500/90 items-center justify-center"
              accessibilityLabel={`Unread ${unread} ${unread === 1 ? 'message' : 'messages'}`}
            >
              <Text className="text-[11px] text-zinc-900 font-bold">{unread}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-white/5 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-zinc-100 text-lg font-semibold">Chats</Text>
          <View className="flex-row gap-2">
            <Pressable onPress={() => nav.navigate('Likes')} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10" accessibilityLabel="Open likes">
              <Ionicons name="heart-outline" size={18} color="#E5E7EB" />
            </Pressable>
            <Pressable onPress={onRefresh} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10" accessibilityLabel="Refresh chats">
              <Ionicons name="refresh" size={18} color="#E5E7EB" />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <Ionicons name="search" size={16} color="#A1A1AA" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chats"
            placeholderTextColor="#7A7A7A"
            className="flex-1 text-zinc-100"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={16} color="#A1A1AA" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Body */}
      {loading && items.length === 0 ? (
        <View className="flex-1 px-4 pt-4">
          <View className="w-full h-16 rounded-2xl bg-white/5 mb-3" />
          <View className="w-full h-16 rounded-2xl bg-white/5 mb-3" />
          <View className="w-full h-16 rounded-2xl bg-white/5" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-zinc-400 text-center mb-3">{error}</Text>
          <Pressable onPress={onRefresh} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10">
            <Text className="text-zinc-100">Retry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-zinc-400 text-center">
            {searchQuery ? 'No conversations found.' : 'No matches yet'}
          </Text>
          {!searchQuery && (
            <Text className="text-zinc-500 text-center mt-1">Swipe right to connect</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.matchId}
          renderItem={renderItem}
          refreshControl={<RefreshControl tintColor="#E5E7EB" refreshing={refreshing} onRefresh={onRefresh} />}
          initialNumToRender={12}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

