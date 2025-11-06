import React from 'react';
import { View, Text, FlatList, Pressable, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { formatRelative } from '../../lib/time';
import { fetchInbox, markThreadRead, type InboxThread } from '../../lib/chat';
import { supabase } from '../../lib/supabase';
import { useLikes } from '../../hooks/useLikes';
import LikeListItem from '../../components/LikeListItem';

type FilterTab = 'all' | 'messages' | 'likes';

export default function Matches() {
  const nav = useNavigation<any>();
  const [items, setItems] = React.useState<InboxThread[]>([]);
  const [filtered, setFiltered] = React.useState<InboxThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [tab, setTab] = React.useState<FilterTab>('all');

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const threads = await fetchInbox();
      setItems(threads);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const threadUserIds = React.useMemo(() => new Set(items.map(t => t.other_user_id)), [items]);

  const { likes } = useLikes({
    limit: 100,
    excludeUserIds: tab === 'likes' ? [] : Array.from(threadUserIds),
  });

  // Setup realtime subscription for new messages
  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      channel = supabase
        .channel('inbox-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async () => {
            // Reload inbox when new messages arrive
            await load();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [load]);

  // Refresh inbox when screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
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
        const name = (item.other_name ?? '').toLowerCase();
        const msg = (item.last_message ?? '').toLowerCase();
        return name.includes(needle) || msg.includes(needle);
      })
    );
  }, [searchQuery, items]);

  const openChat = async (item: InboxThread) => {
    // Optimistically clear unread in UI
    setItems((prev) => prev.map(i => i.other_user_id === item.other_user_id ? { ...i, unread_count: 0 } : i));
    try { 
      await markThreadRead(item.other_user_id); 
    } catch (e) {
      console.warn('[Matches] Failed to mark thread read:', e);
    }
    nav.navigate('Chat', { otherId: item.other_user_id, name: item.other_name });
  };

  const openLikeChat = (userId: string) => {
    nav.navigate('Chat', { otherId: userId });
  };

  const renderItem = ({ item }: { item: InboxThread }) => {
    const unread = item.unread_count ?? 0;
    return (
      <Pressable
        onPress={() => openChat(item)}
        className="flex-row items-center gap-3 px-4 py-3 border-b border-white/5"
        hitSlop={8}
        android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      >
        <Image
          source={item.other_photo_url ? { uri: item.other_photo_url } : require('../../../assets/icon.png')}
          className="w-12 h-12 rounded-full"
          contentFit="cover"
        />

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-zinc-100 font-semibold" numberOfLines={1}>
              {item.other_name ?? 'Buddy'}
            </Text>
          </View>

          <Text className={`text-sm ${unread > 0 ? 'text-zinc-100' : 'text-zinc-400'}`} numberOfLines={1}>
            {item.last_message ? item.last_message : 'Say hi 👋'}
          </Text>
        </View>

        <View className="items-end w-16">
          <Text className="text-[11px] text-zinc-500">
            {formatRelative(item.last_at)}
          </Text>
          {unread > 0 && (
            <View 
              className="self-end mt-1 min-w-5 px-1 h-5 rounded-full bg-teal-500/90 items-center justify-center"
              accessibilityLabel={`${unread} unread ${unread === 1 ? 'message' : 'messages'}`}
            >
              <Text className="text-[11px] text-zinc-900 font-bold">{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const displayedThreads = tab === 'likes' ? [] : filtered;
  const displayedLikes = (tab === 'all' || tab === 'likes') ? likes : [];

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

        {/* Filter tabs */}
        <View className="flex-row bg-zinc-900 rounded-xl p-1">
          {(['all', 'messages', 'likes'] as FilterTab[]).map(k => (
            <TouchableOpacity
              key={k}
              onPress={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg ${tab === k ? 'bg-zinc-800' : ''}`}
            >
              <Text className="text-center text-zinc-200 capitalize">{k}</Text>
            </TouchableOpacity>
          ))}
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
      ) : displayedThreads.length === 0 && displayedLikes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-zinc-400 text-center">
            {searchQuery ? 'No conversations found.' : tab === 'likes' ? 'No likes yet' : 'No matches yet'}
          </Text>
          {!searchQuery && (
            <Text className="text-zinc-500 text-center mt-1">Swipe right to connect</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={[...displayedThreads, ...displayedLikes]}
          keyExtractor={(item) => 'other_user_id' in item ? item.other_user_id : `like-${item.user_id}-${item.created_at}`}
          renderItem={({ item }) => {
            if ('other_user_id' in item) {
              return renderItem({ item });
            } else {
              return (
                <LikeListItem
                  userId={item.user_id}
                  name={item.display_name ?? 'Someone'}
                  photoUrl={item.photo_url}
                  isSuper={item.is_super}
                  subtitle={formatRelative(item.created_at)}
                  onPress={openLikeChat}
                />
              );
            }
          }}
          refreshControl={<RefreshControl tintColor="#E5E7EB" refreshing={refreshing} onRefresh={onRefresh} />}
          initialNumToRender={12}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

