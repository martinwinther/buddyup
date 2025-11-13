// src/screens/Admin/AdminHome.tsx

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminWhoAmI, adminListReports, adminBanUser, adminUnbanUser, adminDeleteUser, AdminReport } from '../../lib/admin';

export default function AdminHome() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await adminListReports({ limit: 50, offset: 0 });
      setItems(items);
      setTotal(total);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const ok = await adminWhoAmI();
        setIsAdmin(ok);
        if (ok) await load();
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [load]);

  if (checking) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator />
        <Text className="text-zinc-300 mt-2">Checking admin…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-zinc-100 text-lg font-semibold">Access denied</Text>
        <Text className="text-zinc-400 text-center mt-2">This area is restricted to admins.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 py-5 border-b border-zinc-800">
        <Text className="text-zinc-100 text-xl font-semibold">Admin — Reports ({total})</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item }) => <ReportRow item={item} onChanged={load} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#a1a1aa" />
              <Text className="text-zinc-300 mt-3">No reports</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function ReportRow({ item, onChanged }: { item: AdminReport; onChanged: () => void }) {
  const target = item.reported;
  const title = target.display_name ?? target.id.slice(0,8);

  const confirm = (title: string, action: () => Promise<void>) => {
    Alert.alert(title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'destructive', onPress: () => action().then(onChanged).catch(e => Alert.alert('Error', e?.message ?? 'Failed')) }
    ]);
  };

  return (
    <View className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12px px-4 py-3">
      <View className="flex-row items-center gap-3">
        {target.photo_url ? (
          <Image source={{ uri: target.photo_url }} style={{ width: 44, height: 44, borderRadius: 999 }} />
        ) : (
          <View className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center">
            <Ionicons name="person-outline" size={20} color="#a1a1aa" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-zinc-100 font-medium">{title}</Text>
          <Text className="text-zinc-400 text-xs">{item.reason}{item.details ? ` • ${item.details}` : ''}</Text>
        </View>
        <Text className="text-zinc-500 text-xs">{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View className="flex-row gap-8 mt-3">
        <AdminButton icon="ban-outline"  label="Ban"    onPress={() => confirm('Ban this user?', () => adminBanUser(target.id))} />
        <AdminButton icon="refresh-outline" label="Unban" onPress={() => confirm('Unban this user?', () => adminUnbanUser(target.id))} />
        <AdminButton icon="trash-outline" label="Delete" onPress={() => confirm('Delete account?', () => adminDeleteUser(target.id))} />
      </View>
    </View>
  );
}

function AdminButton({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-zinc-800">
      <Ionicons name={icon} size={16} color="#e4e4e7" />
      <Text className="text-zinc-200">{label}</Text>
    </TouchableOpacity>
  );
}

