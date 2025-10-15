import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPressLeft?: () => void;   // e.g., Settings
  onPressRight?: () => void;  // e.g., Messages
};

export default function TopBar({ onPressLeft, onPressRight }: Props) {
  return (
    <View className="w-full flex-row items-center justify-between px-4 pt-6 pb-2">
      <Pressable
        onPress={onPressLeft}
        hitSlop={10}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
      >
        <Ionicons name="menu" size={20} color="#E5E7EB" />
      </Pressable>

      <Text className="text-zinc-100 text-xl font-semibold tracking-wide">
        Buddy<Text className="text-teal-300">Up</Text>
      </Text>

      <Pressable
        onPress={onPressRight}
        hitSlop={10}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
      >
        <Ionicons name="chatbubbles-outline" size={20} color="#E5E7EB" />
      </Pressable>
    </View>
  );
}

