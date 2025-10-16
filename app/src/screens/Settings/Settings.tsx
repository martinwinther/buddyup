import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const nav = useNavigation<any>();

  const signOut = async () => {
    await supabase.auth.signOut();
    // nav reset handled by your gate; optional local hint
  };

  const Row = ({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) => (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-4 border-b border-white/5">
      {icon}
      <Text className="text-zinc-100 text-base ml-3">{title}</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#0a0a0a] pt-10">
      <Text className="text-zinc-400 text-center mb-4">Settings</Text>

      <Row
        icon={<Ionicons name="person-circle-outline" size={22} color="#E5E7EB" />}
        title="Edit Profile"
        onPress={() => nav.navigate('EditProfile')}
      />
      <Row
        icon={<Ionicons name="pricetags-outline" size={22} color="#E5E7EB" />}
        title="Edit Interests"
        onPress={() => nav.navigate('EditInterests')}
      />
      <Row
        icon={<Ionicons name="log-out-outline" size={22} color="#FCA5A5" />}
        title="Sign out"
        onPress={() => signOut()}
      />

      {/* If you later add Delete Account, do it via Edge Function; not safe from client */}
    </View>
  );
}

