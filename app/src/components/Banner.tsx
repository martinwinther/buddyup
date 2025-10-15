import React from 'react';
import { View, Text } from 'react-native';

interface BannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  text: string;
}

export function Banner({ type, text }: BannerProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/40';
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/40';
      case 'error':
        return 'bg-red-500/20 border-red-500/40';
      case 'info':
      default:
        return 'bg-blue-500/20 border-blue-500/40';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-red-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  };

  return (
    <View className={`rounded-2xl border p-4 mb-4 ${getStyles()}`}>
      <Text className={`text-sm ${getTextColor()}`}>{text}</Text>
    </View>
  );
}


