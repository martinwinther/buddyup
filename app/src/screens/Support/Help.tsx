// src/screens/Support/Help.tsx

import { ScrollView, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SUPPORT_EMAIL } from '../../lib/config';

function openEmail() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('BuddyUp Support')}`;
  Linking.openURL(mailto).catch(() =>
    Alert.alert('Error', `Could not open email app. Please write to ${SUPPORT_EMAIL}`)
  );
}

export default function HelpScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-zinc-100 text-2xl font-semibold mb-6">Help & Support</Text>

      <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
        <Text className="text-zinc-200 text-base font-medium mb-1">Contact</Text>
        <Text className="text-zinc-400 mb-3">Have an issue or feedback? We'd love to help.</Text>
        <TouchableOpacity onPress={openEmail} className="flex-row items-center gap-2">
          <Ionicons name="mail-outline" size={18} color="#a1a1aa" />
          <Text className="text-zinc-300">{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
        <Text className="text-zinc-200 text-base font-medium mb-1">Safety basics</Text>
        <Text className="text-zinc-400">
          Keep conversations respectful. Don't share sensitive info. Meet in public places.
          Use the Block/Report tools if someone makes you uncomfortable.
        </Text>
      </View>

      <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
        <Text className="text-zinc-200 text-base font-medium mb-2">Policies</Text>
        <TouchableOpacity
          className="flex-row items-center justify-between py-2"
          onPress={() => (navigation as any)?.navigate?.('Guidelines')}
        >
          <Text className="text-zinc-300">Community Guidelines</Text>
          <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center justify-between py-2"
          onPress={() => (navigation as any)?.navigate?.('Privacy')}
        >
          <Text className="text-zinc-300">Privacy & Safety</Text>
          <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center justify-between py-2"
          onPress={() => (navigation as any)?.navigate?.('Terms')}
        >
          <Text className="text-zinc-300">Terms of Service</Text>
          <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

