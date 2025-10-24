import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { InboundLikesRepository } from '../../features/likes/InboundLikesRepository';

type Row = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photo_url: string | null;
  liked_at: string;
};

export default function LikedYou() {
  const nav = useNavigation<any>();
  const repo = React.useMemo(() => new InboundLikesRepository(), []);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await repo.list(200);
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  React.useEffect(() => { load(); }, [load]);

  const likeAndMessage = async (otherId: string) => {
    setBusyId(otherId);
    try {
      await repo.ensureRightSwipe(otherId);
      const matchId = await repo.ensureThread(otherId);
      nav.navigate('Chat', { matchId, otherId });
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }: { item: Row }) => (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-12 h-12 rounded-full overflow-hidden bg-white/10 items-center justify-center">
          {item.photo_url
            ? <Image source={{ uri: item.photo_url }} style={{ width: 48, height: 48 }} contentFit="cover" />
            : <Ionicons name="person-circle-outline" size={28} color="#9CA3AF" />
          }
        </View>
        <View className="flex-1">
          <Text className="text-zinc-100" numberOfLines={1}>
            {item.display_name ?? 'Buddy'}{item.age ? `, ${item.age}` : ''}
          </Text>
          {item.bio ? (
            <Text className="text-zinc-400 text-xs" numberOfLines={1}>{item.bio}</Text>
          ) : (
            <Text className="text-zinc-500 text-xs">Liked you · {new Date(item.liked_at).toLocaleDateString()}</Text>
          )}
        </View>
      </View>
      <Pressable
        onPress={() => likeAndMessage(item.user_id)}
        disabled={busyId === item.user_id}
        className="px-3 py-2 rounded-2xl bg-teal-500/90 ml-3"
        hitSlop={8}
        android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
      >
        <Text className="text-zinc-900 font-semibold">{busyId === item.user_id ? 'Opening…' : 'Like & Message'}</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-10">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-zinc-100 text-lg">Who liked you</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      {loading ? (
        <Text className="text-zinc-400 mt-4">Loading…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-zinc-400 mt-4">No likes yet. Come back later ✨</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(it) => it.user_id}
          ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
}
