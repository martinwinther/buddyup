import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface CategoryPillProps {
  name: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function CategoryPill({ name, isSelected, onPress, disabled }: CategoryPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`px-6 py-4 rounded-2xl border-2 ${
        isSelected
          ? 'bg-teal-400/20 border-teal-400'
          : disabled
          ? 'bg-white/5 border-white/10 opacity-50'
          : 'bg-white/5 border-white/20'
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-teal-400' : 'text-white/80'
        }`}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

