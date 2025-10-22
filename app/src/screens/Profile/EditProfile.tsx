import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ProfileRepository } from '../../features/profile/ProfileRepository';
import PhotoGridManager from '../../components/PhotoGridManager';

const repo = new ProfileRepository();

export default function EditProfile() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [displayName, setDisplayName] = React.useState('');
  const [age, setAge] = React.useState<string>('');
  const [bio, setBio] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await repo.getMe();
        if (me) {
          setDisplayName(me.display_name ?? '');
          setAge(me.age ? String(me.age) : '');
          setBio(me.bio ?? '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const parsedAge = age.trim() ? Math.max(13, Math.min(120, Number(age))) : null;
      await repo.updateMe({
        display_name: displayName.trim() || null,
        age: parsedAge,
        bio: bio.trim() || null,
      });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
        <ActivityIndicator />
        <Text className="text-zinc-400 mt-2">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] px-4 pt-8">
      <Text className="text-zinc-300 text-center mb-4">Edit Profile</Text>

      <PhotoGridManager className="mb-6" />

      <Text className="text-zinc-400 mb-1">Display name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor="#9CA3AF"
        className="mb-3 px-3 py-3 rounded-xl bg-white/10 text-zinc-100"
      />

      <Text className="text-zinc-400 mb-1">Age</Text>
      <TextInput
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholder="e.g. 27"
        placeholderTextColor="#9CA3AF"
        className="mb-3 px-3 py-3 rounded-xl bg-white/10 text-zinc-100"
      />

      <Text className="text-zinc-400 mb-1">Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people what you're into"
        placeholderTextColor="#9CA3AF"
        className="mb-6 px-3 py-3 rounded-xl bg-white/10 text-zinc-100"
        multiline
      />

      <Pressable disabled={saving} onPress={save} className="mb-10 px-4 py-3 rounded-2xl bg-teal-500/90">
        <Text className="text-zinc-900 text-center font-semibold">{saving ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>
    </View>
  );
}

