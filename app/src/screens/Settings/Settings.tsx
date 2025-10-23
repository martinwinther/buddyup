import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const nav = useNavigation<any>();
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

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

      <View className="mt-auto mb-6">
        <Pressable
          onPress={async () => { await supabase.auth.signOut(); }}
          className="px-4 py-3 rounded-2xl bg-red-500/90"
        >
          <Text className="text-zinc-900 text-center font-semibold">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

