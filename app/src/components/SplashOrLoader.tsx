import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export function SplashOrLoader() {
  return (
    <View className="flex-1 bg-[#0a0a0a] justify-center items-center">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

