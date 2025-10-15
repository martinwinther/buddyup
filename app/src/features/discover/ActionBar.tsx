import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onNope: () => void;
  onLike: () => void;
  onSuperLike?: () => void;
  onRewind?: () => void;
  onBoost?: () => void;
};

const Round = ({
  onPress,
  size = 64,
  bg = 'bg-white/10',
  border = 'border-white/10',
  children,
}: React.PropsWithChildren<{ onPress?: () => void; size?: number; bg?: string; border?: string }>) => (
  <Pressable
    onPress={onPress}
    hitSlop={10}
    style={{ width: size, height: size }}
    className={`items-center justify-center rounded-full ${bg} border ${border}`}
  >
    {children}
  </Pressable>
);

export default function ActionBar({ onNope, onLike, onSuperLike, onRewind, onBoost }: Props) {
  return (
    <View className="w-full flex-row items-center justify-center gap-4 px-4 py-4">
      <Round onPress={onRewind} size={52} bg="bg-white/5">
        <Ionicons name="return-down-back" size={22} color="#E5E7EB" />
      </Round>

      <Round onPress={onNope}>
        <Ionicons name="close" size={28} color="#F87171" />
      </Round>

      <Round onPress={onSuperLike} size={56} bg="bg-white/20">
        <Ionicons name="star" size={24} color="#93C5FD" />
      </Round>

      <Round onPress={onLike}>
        <Ionicons name="heart" size={26} color="#34D399" />
      </Round>

      <Round onPress={onBoost} size={52} bg="bg-white/5">
        <Ionicons name="flash" size={22} color="#FDE68A" />
      </Round>
    </View>
  );
}

