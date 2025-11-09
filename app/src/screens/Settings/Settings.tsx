import { useEffect, useState } from 'react';
import { View, Text, Switch, Alert, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { loadMyProfile, updateNotifyEmail, invokeDeleteAccount } from '../../lib/account';

export default function SettingsScreen() {
  const nav = useNavigation();
  const [loading, setLoading] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const me = await loadMyProfile();
        if (!dead && me) setNotifyEmail(!!me.notify_email_messages);
      } catch (_) {}
      if (!dead) setLoading(false);
    })();
    return () => { dead = true; };
  }, []);

  const onToggleNotify = async (val: boolean) => {
    setNotifyEmail(val);
    setSaving(true);
    try {
      await updateNotifyEmail(val);
    } catch (e) {
      Alert.alert('Error', 'Could not update preference. Please try again.');
      setNotifyEmail(!val);
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    // nav reset happens in your nav guard
  };

  const onDelete = () => {
    setDeleteModalOpen(true);
    setDeleteConfirmText('');
  };

  const executeDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Invalid confirmation', 'You must type DELETE to confirm.');
      return;
    }
    setSaving(true);
    setDeleteModalOpen(false);
    try {
      await invokeDeleteAccount();
      await supabase.auth.signOut();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator />
        <Text className="text-zinc-300 mt-2">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 py-5 border-b border-zinc-800">
        <Text className="text-zinc-100 text-xl font-semibold">Settings</Text>
      </View>

      <ScrollView>
        {/* Notifications */}
        <View className="px-4 py-4 gap-3">
          <Text className="text-zinc-400 text-xs uppercase">Notifications</Text>
          <View className="flex-row items-center justify-between bg-zinc-900 rounded-2xl px-4 py-3">
            <View className="flex-1">
              <Text className="text-zinc-100">Email me when I get a new message</Text>
              <Text className="text-zinc-400 text-xs">You can turn this off anytime</Text>
            </View>
            <Switch
              value={notifyEmail}
              onValueChange={onToggleNotify}
              disabled={saving}
            />
          </View>
        </View>

        {/* Legal */}
        <View className="px-4 py-4 gap-3">
          <Text className="text-zinc-400 text-xs uppercase">Legal</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-zinc-900 rounded-2xl px-4 py-3"
            onPress={() => nav.navigate('Privacy' as never)}
          >
            <Text className="text-zinc-100">Privacy & Safety</Text>
            <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-zinc-900 rounded-2xl px-4 py-3"
            onPress={() => nav.navigate('Terms' as never)}
          >
            <Text className="text-zinc-100">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View className="px-4 py-4 gap-3">
          <Text className="text-zinc-400 text-xs uppercase">Account</Text>
          <TouchableOpacity 
            className="bg-zinc-900 rounded-2xl px-4 py-3" 
            onPress={onSignOut} 
            disabled={saving}
          >
            <Text className="text-zinc-100 text-center">Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-red-600/10 border border-red-600/30 rounded-2xl px-4 py-3"
            onPress={onDelete} 
            disabled={saving}
          >
            <Text className="text-red-400 text-center">Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={() => setDeleteModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-2xl bg-[#111] border border-white/10 p-4">
            <Text className="text-zinc-100 text-lg mb-2 font-semibold">Delete account?</Text>
            <Text className="text-zinc-400 mb-4">
              This will permanently remove your profile, photos, messages, likes, and preferences.
            </Text>
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
              <TouchableOpacity 
                onPress={() => setDeleteModalOpen(false)} 
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
              >
                <Text className="text-zinc-100">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={executeDelete} 
                disabled={saving} 
                className="px-4 py-2 rounded-xl bg-red-500/90"
              >
                <Text className="text-zinc-900 font-semibold">{saving ? 'Deleting…' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
