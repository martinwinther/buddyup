import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  uri?: string;
  size?: number;
};

export function Avatar({ uri, size = 40 }: Props) {
  return (
    <View 
      className="rounded-full bg-white/10 items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={{ width: size, height: size }} 
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Ionicons name="person-circle-outline" size={size * 0.6} color="#9CA3AF" />
      )}
    </View>
  );
}

