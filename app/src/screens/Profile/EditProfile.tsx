import React from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import PhotoGridManager from '../../components/PhotoGridManager';
import { supabase } from '../../lib/supabase';

export default function EditProfile() {
  const nav = useNavigation<any>();
  const [displayName, setDisplayName] = React.useState('');
  const [age, setAge] = React.useState<string>('');
  const [bio, setBio] = React.useState('');
  const [notifyEmailMessages, setNotifyEmailMessages] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, age, bio, notify_email_messages')
        .eq('id', uid)
        .maybeSingle();
      setDisplayName(data?.display_name ?? '');
      setAge(data?.age != null ? String(data.age) : '');
      setBio(data?.bio ?? '');
      setNotifyEmailMessages(data?.notify_email_messages ?? true);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const aNum = age.trim() ? Number(age) : null;
    if (aNum != null && (aNum < 13 || aNum > 120)) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }
    setSaving(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) throw new Error('NO_SESSION');

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          age: aNum,
          bio: bio.trim() || null,
          notify_email_messages: notifyEmailMessages,
          last_active: new Date().toISOString(),
        })
        .eq('id', uid);
      if (error) throw error;
      Alert.alert('Saved', 'Your profile has been updated.');
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <Text className="text-zinc-400">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-[#0a0a0a]" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-100 text-lg">Edit profile</Text>
        <Pressable onPress={() => nav.goBack()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10">
          <Ionicons name="chevron-down" size={18} color="#E5E7EB" />
        </Pressable>
      </View>

      {/* Multi-photo manager */}
      <PhotoGridManager className="mb-6" />

      {/* Fields */}
      <Text className="text-zinc-300 mb-1">Display name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor="#9CA3AF"
        className="px-3 py-3 rounded-xl bg-white/10 text-zinc-100 mb-4"
      />

      <Text className="text-zinc-300 mb-1">Age</Text>
      <TextInput
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholder="e.g. 28"
        placeholderTextColor="#9CA3AF"
        className="px-3 py-3 rounded-xl bg-white/10 text-zinc-100 mb-4"
      />

      <Text className="text-zinc-300 mb-1">Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Say something about yourself…"
        placeholderTextColor="#9CA3AF"
        className="min-h-[120px] px-3 py-3 rounded-xl bg-white/10 text-zinc-100 mb-6"
      />

      <View className="flex-row items-center justify-between px-4 py-4 rounded-xl bg-white/10 border border-white/10">
        <View className="flex-1 pr-4">
          <Text className="text-zinc-100 font-medium mb-1">Email notifications</Text>
          <Text className="text-zinc-400 text-sm">Get notified when someone sends you a message</Text>
        </View>
        <Switch
          value={notifyEmailMessages}
          onValueChange={setNotifyEmailMessages}
          trackColor={{ false: '#52525b', true: '#14b8a6' }}
          thumbColor="#ffffff"
        />
      </View>

      <Pressable onPress={save} disabled={saving} className="mt-6 px-4 py-3 rounded-2xl bg-teal-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{saving ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

