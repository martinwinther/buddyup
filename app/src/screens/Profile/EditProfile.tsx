import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProfileRepository } from '../../features/profile/ProfileRepository';
import { uploadProfilePhotoFromUri } from '../../lib/upload';
import { supabase } from '../../lib/supabase';

const repo = new ProfileRepository();

export default function EditProfile() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [displayName, setDisplayName] = React.useState('');
  const [age, setAge] = React.useState<string>('');
  const [bio, setBio] = React.useState('');
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoErr, setPhotoErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await repo.getMe();
        if (me) {
          setDisplayName(me.display_name ?? '');
          setAge(me.age ? String(me.age) : '');
          setBio(me.bio ?? '');
          setPhotoUrl(me.photo_url ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickPhoto = async () => {
    setPhotoErr(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to change your picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      aspect: [3, 4],
    });
    if (res.canceled) return;

    const { assets } = res;
    const uri = assets?.[0]?.uri;
    if (!uri) return;

    // Try upload to Supabase Storage → get public URL
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id;
      if (!uid) throw new Error('NO_SESSION');
      const url = await uploadProfilePhotoFromUri(uri, uid);
      if (!url) throw new Error('UPLOAD_FAILED');
      setPhotoUrl(url);
    } catch (e: any) {
      // Fallback: keep local uri to preview, but warn user
      setPhotoErr('Could not upload new photo. Saved other edits only.');
      setPhotoUrl(uri);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const parsedAge = age.trim() ? Math.max(13, Math.min(120, Number(age))) : null;
      await repo.updateMe({
        display_name: displayName.trim() || null,
        age: parsedAge,
        bio: bio.trim() || null,
        photo_url: photoUrl ?? null,
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

      <View className="items-center mb-6">
        <View className="w-36 h-48 rounded-2xl overflow-hidden border border-white/10">
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-white/5">
              <Ionicons name="person-circle-outline" size={48} color="#9CA3AF" />
            </View>
          )}
        </View>
        <Pressable onPress={pickPhoto} className="mt-3 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
          <Text className="text-zinc-100">Change photo</Text>
        </Pressable>
        {photoErr ? <Text className="text-red-400 mt-2">{photoErr}</Text> : null}
      </View>

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

