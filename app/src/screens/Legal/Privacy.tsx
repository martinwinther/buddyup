import { View, Text, ScrollView } from 'react-native';

export default function PrivacyScreen() {
  return (
    <ScrollView className="flex-1 bg-black px-4 py-5">
      <Text className="text-zinc-100 text-xl font-semibold mb-3">Privacy & Safety</Text>
      <Text className="text-zinc-300 leading-6">
        BuddyUp is 18+. We store minimal data needed for the app to work (profile, photos, likes, messages).
        You can delete your account anytime from Settings. For reports or questions, contact support.
      </Text>
    </ScrollView>
  );
}

