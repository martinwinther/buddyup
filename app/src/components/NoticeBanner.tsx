import React from 'react';
import { View, Text } from 'react-native';

interface NoticeBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning';
}

export function NoticeBanner({ message, type = 'info' }: NoticeBannerProps) {
  const bgColor = 
    type === 'success' ? 'bg-green-500/20' :
    type === 'warning' ? 'bg-amber-500/20' :
    'bg-blue-500/20';
  
  const borderColor = 
    type === 'success' ? 'border-green-500/40' :
    type === 'warning' ? 'border-amber-500/40' :
    'border-blue-500/40';
  
  const textColor = 
    type === 'success' ? 'text-green-400' :
    type === 'warning' ? 'text-amber-400' :
    'text-blue-400';

  return (
    <View className={`${bgColor} ${borderColor} border rounded-2xl p-4 mb-6`}>
      <Text className={`${textColor} text-sm text-center`}>
        {message}
      </Text>
    </View>
  );
}

