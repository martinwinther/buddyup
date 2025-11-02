import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  title?: string;
  onOpenMenu?: () => void;
};

export function AppHeader({ title = 'BuddyUp', onOpenMenu }: Props) {
  return (
    <View className="w-full px-4 py-3 flex-row items-center justify-between bg-[#0a0a0a] border-b border-white/5">
      {/* Left spacer to keep title centered */}
      <View className="w-8" />

      <Text className="text-zinc-100 text-lg font-bold">
        Buddy<Text className="text-teal-300">Up</Text>
      </Text>

      <Pressable
        onPress={onOpenMenu}
        hitSlop={12}
        className="w-8 h-8 items-center justify-center rounded-xl bg-white/5 border border-white/10"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="ellipsis-horizontal" size={18} color="#E5E7EB" />
      </Pressable>
    </View>
  );
}

