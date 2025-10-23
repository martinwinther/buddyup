import React from 'react';
import { View, Text, Pressable, Alert, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

type Row = { blocked_id: string; name: string | null; photo_url: string | null };

export default function BlockedUsers() {
  const nav = useNavigation<any>();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const me = s?.session?.user?.id;
      if (!me) return;

      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id, profiles!blocks_blocked_id_fkey ( display_name, photo_url )')
        .eq('blocker_id', me);
      if (error) throw error;

      const mapped: Row[] = (data ?? []).map((r: any) => ({
        blocked_id: r.blocked_id,
        name: r.profiles?.display_name ?? null,
        photo_url: r.profiles?.photo_url ?? null,
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const unblock = async (otherId: string) => {
    const { data: s } = await supabase.auth.getSession();
    const me = s?.session?.user?.id;
    if (!me) return;
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', me)
      .eq('blocked_id', otherId);
    if (error) {
      Alert.alert('Error', error.message ?? 'Could not unblock.');
      return;
    }
    load();
  };

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-10">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-100 text-lg">Blocked users</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      {loading ? (
        <Text className="text-zinc-400">Loading…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-zinc-400">You haven't blocked anyone.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(it) => it.blocked_id}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-white/10 my-2" />}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center gap-3">
                {/* small avatar circle */}
                <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                  {item.photo_url ? (
                    // Using Image from react-native is fine for small avatars
                    <img src={item.photo_url} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
                  )}
                </View>
                <Text className="text-zinc-100">{item.name ?? 'Buddy'}</Text>
              </View>
              <Pressable onPress={() => unblock(item.blocked_id)} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                <Text className="text-zinc-100">Unblock</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
