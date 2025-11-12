// src/components/EmptyState.tsx

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon = 'chatbubble-ellipses-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="items-center gap-3">
        <View className="w-16 h-16 rounded-full bg-zinc-900 items-center justify-center">
          <Ionicons name={icon} size={28} color="#a1a1aa" />
        </View>
        <Text className="text-zinc-100 text-lg font-semibold text-center">{title}</Text>
        {!!subtitle && (
          <Text className="text-zinc-400 text-center leading-6">{subtitle}</Text>
        )}
        {!!actionLabel && !!onAction && (
          <TouchableOpacity
            className="mt-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800"
            onPress={onAction}
          >
            <Text className="text-zinc-200">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

