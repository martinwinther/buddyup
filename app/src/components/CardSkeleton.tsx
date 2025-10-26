import * as React from 'react';
import { View } from 'react-native';

export default function CardSkeleton() {
  return (
    <View className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 w-full aspect-[3/4]">
      <View className="flex-1 bg-white/5" />
      <View className="p-4 gap-2">
        <View className="h-5 w-1/3 bg-white/10 rounded" />
        <View className="h-4 w-2/3 bg-white/10 rounded" />
      </View>
    </View>
  );
}
