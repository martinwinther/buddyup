import { View, Text, ScrollView } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView className="flex-1 bg-black px-4 py-5">
      <Text className="text-zinc-100 text-xl font-semibold mb-3">Terms of Service</Text>
      <Text className="text-zinc-300 leading-6">
        By using BuddyUp you agree to be respectful, comply with local laws, and only use the app if you are 18+.
        Illegal content, harassment, and spam are not allowed. We may remove accounts that violate these terms.
      </Text>
    </ScrollView>
  );
}

