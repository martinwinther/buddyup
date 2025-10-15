import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0a0a0a]">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-zinc-400 mt-2">Loading…</Text>
    </View>
  );
}

