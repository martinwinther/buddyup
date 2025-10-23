import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MatchesRepository } from '../../features/messages/MatchesRepository';
import { useNavigation } from '@react-navigation/native';

const repo = new MatchesRepository();

export default function Matches() {
  const nav = useNavigation<any>();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const list = await repo.listMyMatches();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <ActivityIndicator />
        <Text className="text-zinc-400 mt-2">Loading matches…</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <Text className="text-zinc-100 text-lg">No matches yet</Text>
        <Text className="text-zinc-400 mt-1">Swipe right to connect</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] pt-6">
      <FlatList
        data={items}
        keyExtractor={i => i.matchId}
        ItemSeparatorComponent={() => <View className="h-px bg-white/5 mx-4" />}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center px-4 py-3"
            onPress={() => nav.navigate('Chat', { matchId: item.matchId, otherId: item.otherId, name: item.name })}
          >
            <Image
              source={ item.photoUrl ? { uri: item.photoUrl } : require('../../../assets/icon.png') }
              className="w-12 h-12 rounded-full mr-3"
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-zinc-100 text-base font-medium">{item.name ?? 'Buddy'}</Text>
              {item.lastMessage ? (
                <Text numberOfLines={1} className="text-zinc-400 text-xs mt-0.5">
                  {item.lastMessage.fromMe ? 'You: ' : ''}{item.lastMessage.body}
                </Text>
              ) : (
                <Text className="text-zinc-500 text-xs mt-0.5">Say hi 👋</Text>
              )}
            </View>
            {(item.unread ?? 0) > 0 ? (
              <View className="px-2 py-0.5 rounded-full bg-teal-500/90 ml-2 self-center">
                <Text className="text-black text-xs font-semibold">{item.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

