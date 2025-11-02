import * as React from 'react';
import { View, Text, Pressable, TextInput, Alert, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../../components/Avatar';
import {
  getEmail, loadDiscoveryPrefs, saveDiscoveryPrefs,
  loadBlocked, unblock
} from '../../features/settings/SettingsRepository';
import { supabase } from '../../lib/supabase';
import { invokeFunctionJSON } from '../../lib/functions';

function Row({ children }: { children: React.ReactNode }) {
  return <View className="px-4 py-3 border-b border-white/5">{children}</View>;
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string | null>(null);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [ageMin, setAgeMin] = React.useState(18);
  const [ageMax, setAgeMax] = React.useState(99);
  const [km, setKm] = React.useState(50);
  const [onlyShared, setOnlyShared] = React.useState(true);
  const [blocked, setBlocked] = React.useState<{ id: string; name: string; photo?: string | null }[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const e = await getEmail();
      setEmail(e);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (uid) {
        const { data: me } = await supabase
          .from('profiles')
          .select('display_name,photo_url')
          .eq('id', uid)
          .maybeSingle();
        setName(me?.display_name ?? null);
        setPhoto(me?.photo_url ?? null);
      }

      const prefs = await loadDiscoveryPrefs();
      if (prefs) {
        setAgeMin(prefs.age_min);
        setAgeMax(prefs.age_max);
        setKm(prefs.max_km);
        setOnlyShared(prefs.only_shared_categories);
      }

      const bl = await loadBlocked();
      setBlocked(bl.map(b => ({ id: b.blocked_id, name: b.display_name ?? 'User', photo: b.photo_url })));
    })();
  }, []);

  const savePrefs = async () => {
    setBusy(true);
    try {
      await saveDiscoveryPrefs({
        age_min: Math.min(ageMin, ageMax),
        age_max: Math.max(ageMin, ageMax),
        max_km: km,
        only_shared_categories: onlyShared,
      });
      Alert.alert('Saved', 'Your discovery preferences have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save preferences.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    setDeleteModalOpen(true);
    setDeleteConfirmText('');
  };

  const executeDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Invalid confirmation', 'You must type DELETE to confirm.');
      return;
    }
    setBusy(true);
    setDeleteModalOpen(false);
    try {
      await invokeFunctionJSON('delete-account', {});
      await supabase.auth.signOut();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not delete account.');
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <View className="px-4 pt-4 pb-3 border-b border-white/5">
        <View className="flex-row items-center justify-between">
          <Text className="text-zinc-100 text-lg font-semibold">Settings</Text>
          <Pressable onPress={() => navigation.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
            <Ionicons name="close" size={18} color="#E5E7EB" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1">

      {/* Account */}
      <Row>
        <View className="flex-row items-center gap-3">
          <Avatar uri={photo ?? undefined} size={52} />
          <View className="flex-1">
            <Text className="text-zinc-100 font-semibold" numberOfLines={1}>{name ?? 'Your name'}</Text>
            <Text className="text-zinc-400 text-sm" numberOfLines={1}>{email ?? ''}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
            accessibilityLabel="Edit profile"
          >
            <Text className="text-zinc-200">Edit</Text>
          </Pressable>
        </View>
      </Row>

      {/* Discovery preferences */}
      <Row>
        <Text className="text-zinc-100 font-semibold mb-2">Discovery preferences</Text>
        <Text className="text-zinc-300 mb-1">Age range</Text>
        <View className="flex-row items-center gap-2 mb-2">
          <TextInput
            keyboardType="number-pad"
            value={String(ageMin)}
            onChangeText={(t) => setAgeMin(Math.max(18, Math.min(99, parseInt(t || '18', 10))))}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100"
          />
          <Text className="text-zinc-400">to</Text>
          <TextInput
            keyboardType="number-pad"
            value={String(ageMax)}
            onChangeText={(t) => setAgeMax(Math.max(18, Math.min(99, parseInt(t || '99', 10))))}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100"
          />
        </View>
        <Text className="text-zinc-300 mb-1">Max distance (km)</Text>
        <TextInput
          keyboardType="number-pad"
          value={String(km)}
          onChangeText={(t) => setKm(Math.max(1, Math.min(500, parseInt(t || '50', 10))))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100 mb-2"
        />
        <Pressable
          onPress={() => setOnlyShared(v => !v)}
          className="flex-row items-center gap-2 mb-1"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: onlyShared }}
        >
          <View className={`w-5 h-5 rounded-md border ${onlyShared ? 'bg-teal-500/80 border-teal-500/60' : 'bg-white/5 border-white/20'}`} />
          <Text className="text-zinc-200">Only show people who share my categories</Text>
        </Pressable>
        <Pressable
          onPress={savePrefs}
          disabled={busy}
          className={`mt-2 items-center py-3 rounded-xl ${busy ? 'bg-white/10' : 'bg-teal-500/90'}`}
          accessibilityLabel="Save preferences"
        >
          <Text className={busy ? 'text-zinc-500' : 'text-zinc-900 font-semibold'}>{busy ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </Row>

      {/* Blocked users */}
      <Row>
        <Text className="text-zinc-100 font-semibold mb-2">Blocked users</Text>
        {blocked.length === 0 ? (
          <Text className="text-zinc-400">You haven't blocked anyone.</Text>
        ) : blocked.map(b => (
          <View key={b.id} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <Avatar uri={b.photo ?? undefined} size={36} />
              <Text className="text-zinc-100">{b.name}</Text>
            </View>
            <Pressable
              onPress={async () => {
                try {
                  await unblock(b.id);
                  setBlocked(x => x.filter(y => y.id !== b.id));
                } catch (e: any) {
                  Alert.alert('Error', e?.message ?? 'Could not unblock user.');
                }
              }}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
              accessibilityLabel={`Unblock ${b.name}`}
            >
              <Text className="text-zinc-200">Unblock</Text>
            </Pressable>
          </View>
        ))}
      </Row>

      {/* Danger zone */}
      <Row>
        <Text className="text-zinc-100 font-semibold mb-2">Danger zone</Text>
        <Pressable
          onPress={confirmDelete}
          className="mb-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30"
          accessibilityLabel="Delete account"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="trash-outline" size={18} color="#fca5a5" />
            <Text className="text-red-300 font-semibold">Delete account</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={async () => {
            await supabase.auth.signOut();
          }}
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/10"
          accessibilityLabel="Sign out"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={18} color="#E5E7EB" />
            <Text className="text-zinc-200">Sign out</Text>
          </View>
        </Pressable>
      </Row>
      </ScrollView>

      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={() => setDeleteModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-2xl bg-[#111] border border-white/10 p-4">
            <Text className="text-zinc-100 text-lg mb-2 font-semibold">Delete account?</Text>
            <Text className="text-zinc-400 mb-4">This will permanently remove your profile, photos, messages, likes, and preferences.</Text>
            <Text className="text-zinc-300 mb-2 text-sm">Type DELETE to confirm:</Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#9CA3AF"
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100 mb-4"
              autoCapitalize="characters"
            />
            <View className="flex-row justify-end gap-2">
              <Pressable onPress={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10">
                <Text className="text-zinc-100">Cancel</Text>
              </Pressable>
              <Pressable onPress={executeDelete} disabled={busy} className="px-4 py-2 rounded-xl bg-red-500/90">
                <Text className="text-zinc-900 font-semibold">{busy ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
