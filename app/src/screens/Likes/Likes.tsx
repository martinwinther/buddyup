import * as React from 'react';
import { View, Text, TextInput, FlatList, Pressable, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Segmented from '../../components/Segmented';
import EmptyState from '../../components/EmptyState';
import { Image } from 'expo-image';
import { formatRelativeTime, isOnline } from '../../lib/time';
import { fetchLikedYou, fetchYouLiked, likeUser, type LikeRow, LikesRepository } from '../../features/likes/LikesRepository';
import { useNavigation } from '@react-navigation/native';

const likesRepo = new LikesRepository();

export default function Likes() {
  const nav = useNavigation<any>();
  const [mode, setMode] = React.useState<'likedYou' | 'youLiked'>('likedYou');
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState<LikeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = mode === 'likedYou' ? await fetchLikedYou() : await fetchYouLiked();
    setRows(data);
    setLoading(false);
  }, [mode]);

  React.useEffect(() => { load(); }, [load]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r => (r.display_name ?? '').toLowerCase().includes(t));
  }, [rows, q]);

  const Avatar = ({ uri, online }: { uri?: string; online: boolean }) => (
    <View>
      <Image
        source={uri ? { uri } : require('../../../assets/icon.png')}
        className="w-11 h-11 rounded-full"
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      {online && (
        <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-[#0a0a0a]" />
      )}
    </View>
  );

  const Row = ({ r }: { r: LikeRow }) => {
    const online = isOnline(r.last_active);
    return (
      <View className="px-4 py-3 border-b border-white/5">
        <View className="flex-row items-center gap-3">
          <Avatar uri={r.photo_url ?? undefined} online={online} />
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-zinc-100 font-semibold" numberOfLines={1}>
                {r.display_name ?? 'User'}{r.age ? `, ${r.age}` : ''}
              </Text>
              <Text className="text-[11px] text-zinc-500">
                {online ? 'Online' : (r.last_active ? `Active ${formatRelativeTime(r.last_active)} ago` : '')}
              </Text>
            </View>
            <Text className="text-sm text-zinc-400 mt-0.5">
              {r.shared_count ? `• ${r.shared_count} shared` : '• Say hi'}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={async () => {
                // Ensure thread exists then open chat
                try {
                  const matchId = await likesRepo.ensureThreadWith(r.id);
                  nav.navigate('Chat', { matchId, otherId: r.id, name: r.display_name ?? 'Chat' });
                } catch {}
              }}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
              accessibilityLabel={`Open chat with ${r.display_name ?? 'User'}`}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#E5E7EB" />
            </Pressable>
            {mode === 'likedYou' && (
              <Pressable
                onPress={async () => { try { await likeUser(r.id); } catch {} }}
                className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30"
                accessibilityLabel={`Like back ${r.display_name ?? 'User'}`}
              >
                <Ionicons name="heart" size={18} color="#2DD4BF" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  const Skeleton = () => (
    <View className="px-4 py-3 border-b border-white/5">
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-full bg-white/10" />
        <View className="flex-1 gap-2">
          <View className="h-3 w-40 bg-white/10 rounded" />
          <View className="h-3 w-20 bg-white/5 rounded" />
        </View>
        <View className="w-9 h-8 rounded-xl bg-white/10" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <View className="px-4 pt-4 pb-3 border-b border-white/5 gap-3">
        <Text className="text-zinc-100 text-lg font-semibold">Likes</Text>
        <Segmented
          options={[
            { key: 'likedYou', label: 'Liked You' },
            { key: 'youLiked', label: 'You Liked' },
          ]}
          value={mode}
          onChange={(k) => setMode(k as any)}
        />
        <View className="flex-row items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name…"
            placeholderTextColor="#6B7280"
            className="flex-1 text-zinc-100"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}</View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={mode === 'likedYou' ? 'No one has liked you yet' : 'You haven\'t liked anyone yet'}
          subtitle={mode === 'likedYou' ? 'Keep swiping! Explore people with shared interests to connect faster.' : 'Explore and like people with shared interests to connect faster.'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <Row r={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A1A1AA" />}
        />
      )}
    </View>
  );
}

