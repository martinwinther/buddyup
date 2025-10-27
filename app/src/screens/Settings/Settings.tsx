import React from 'react';
import { View, Text, Pressable, Alert, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { invokeFunctionJSON } from '../../lib/functions';
import { SettingsRepository } from '../../features/settings/SettingsRepository';

export default function Settings() {
  const nav = useNavigation<any>();
  const [email, setEmail] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const settingsRepo = React.useMemo(() => new SettingsRepository(), []);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const s = await settingsRepo.load();
        if (s) setNotifyEmail(!!s.notify_email_messages);
      } catch {}
    })();
  }, [settingsRepo]);

  async function toggleNotifyEmail() {
    try {
      setSaving(true);
      const next = !notifyEmail;
      setNotifyEmail(next);
      await settingsRepo.update({ notify_email_messages: next });
    } catch {
      // revert on failure
      setNotifyEmail((v) => !v);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      setDeleting(true);
      await invokeFunctionJSON('delete-account', {}); // Edge function will use the caller's JWT to identify user
      await supabase.auth.signOut();
      Alert.alert('Account deleted', 'Your account has been removed.');
      // optional: you could navigate to Auth screen; signOut gate should redirect already
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not delete account.');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-10">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-zinc-100 text-xl">Settings</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="close" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      {email ? <Text className="text-zinc-400 mb-4">Signed in as {email}</Text> : null}

      <View className="gap-3">
        <Pressable onPress={() => nav.navigate('EditProfile')} className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 flex-row items-center justify-between">
          <Text className="text-zinc-100">Edit profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#E5E7EB" />
        </Pressable>

        <Pressable onPress={() => nav.navigate('DiscoverySettings')} className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 flex-row items-center justify-between">
          <Text className="text-zinc-100">Discovery preferences</Text>
          <Ionicons name="options-outline" size={18} color="#E5E7EB" />
        </Pressable>

        <Pressable onPress={() => nav.navigate('BlockedUsers')} className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 flex-row items-center justify-between">
          <Text className="text-zinc-100">Blocked users</Text>
          <Ionicons name="ban-outline" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      <View className="mt-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-zinc-200 mb-2">Notifications</Text>

        <Pressable
          onPress={toggleNotifyEmail}
          disabled={saving}
          className="flex-row items-center justify-between px-2 py-3"
        >
          <View className="flex-1 pr-3">
            <Text className="text-zinc-100">Email me when I get a new message</Text>
            <Text className="text-zinc-500 text-xs">You can turn this off anytime</Text>
          </View>
          <View className={`w-12 h-7 rounded-full ${notifyEmail ? 'bg-teal-500/80' : 'bg-white/10'}`}>
            <View className={`w-6 h-6 mt-0.5 rounded-full bg-white ${notifyEmail ? 'ml-6' : 'ml-1'}`} />
          </View>
        </Pressable>
      </View>

      <View className="mt-6">
        <View className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
          <Text className="text-zinc-200 mb-2">Danger zone</Text>
          <Pressable
            onPress={() => setConfirmOpen(true)}
            className="px-4 py-3 rounded-2xl bg-red-500/90"
            hitSlop={8}
            android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
          >
            <Text className="text-zinc-900 text-center font-semibold">Delete my account</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-auto mb-6">
        <Pressable
          onPress={async () => { await supabase.auth.signOut(); }}
          className="px-4 py-3 rounded-2xl bg-red-500/90"
        >
          <Text className="text-zinc-900 text-center font-semibold">Sign out</Text>
        </Pressable>
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-2xl bg-[#111] border border-white/10 p-4">
            <Text className="text-zinc-100 text-lg mb-2">Delete account?</Text>
            <Text className="text-zinc-400 mb-4">This will permanently remove your profile, photos, messages, likes, and preferences.</Text>
            <View className="flex-row justify-end gap-2">
              <Pressable onPress={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10">
                <Text className="text-zinc-100">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-red-500/90">
                <Text className="text-zinc-900 font-semibold">{deleting ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

