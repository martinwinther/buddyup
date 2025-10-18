import React from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LikesRepository } from '../../features/likes/LikesRepository';
import { useNavigation } from '@react-navigation/native';
import { recordSwipe } from '../../features/discover/SwipesRepository';

const repo = new LikesRepository();

export default function Likes() {
  const nav = useNavigation<any>();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await repo.list();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const off = repo.subscribeToIncoming(async () => {
      // naive refresh on any like into me
      const list = await repo.list();
      setItems(list);
    });
    return () => off();
  }, [load]);

  const onLikeBack = async (userId: string) => {
    await recordSwipe(userId, 'right');
    const list = await repo.list();
    setItems(list);
  };

  const onMessage = async (userId: string, matchId: string | null, name?: string | null) => {
    const id = matchId || await repo.ensureThreadWith(userId);
    nav.navigate('Chat', { matchId: id, otherId: userId, name: name ?? 'Chat' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center px-4 py-3">
      <Image
        source={ item.photoUrl ? { uri: item.photoUrl } : require('../../../assets/icon.png') }
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text className="text-zinc-100 font-medium">
          {item.displayName ?? 'Buddy'}{item.age ? `, ${item.age}` : ''}
        </Text>
        <Text className="text-zinc-500 text-xs">
          Liked you {new Date(item.likedAt).toLocaleDateString()}
        </Text>
      </View>
      <Pressable
        onPress={() => onLikeBack(item.userId)}
        className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 mr-2"
      >
        <Ionicons name="heart" size={18} color="#34D399" />
      </Pressable>
      <Pressable
        onPress={() => onMessage(item.userId, item.matchId, item.displayName)}
        className="px-3 py-2 rounded-xl bg-teal-500/90"
      >
        <Text className="text-zinc-900 font-semibold">Message</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <ActivityIndicator />
        <Text className="text-zinc-400 mt-2">Loading likes…</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <Ionicons name="heart-outline" size={36} color="#9CA3AF" />
        <Text className="text-zinc-400 mt-2">No likes yet</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] pt-6">
      <FlatList
        data={items}
        keyExtractor={(i) => i.userId}
        renderItem={renderItem}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        refreshing={refreshing}
        ItemSeparatorComponent={() => <View className="h-px bg-white/5 mx-4" />}
      />
    </View>
  );
}

