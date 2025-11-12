// src/screens/Support/Guidelines.tsx

import { ScrollView, Text, View } from 'react-native';

export default function GuidelinesScreen() {
  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-zinc-100 text-2xl font-semibold mb-6">Community Guidelines</Text>

      <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <Text className="text-zinc-300 leading-6">
          • Be 18+ and honest in your profile.{'\n'}
          • No hate, harassment, threats, or illegal content.{'\n'}
          • Don't spam or mass-message.{'\n'}
          • Respect boundaries. Use Block/Report when needed.{'\n'}
          • For safety issues, contact us via Help & Support.
        </Text>
      </View>
    </ScrollView>
  );
}

