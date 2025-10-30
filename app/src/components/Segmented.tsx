import * as React from 'react';
import { View, Pressable, Text } from 'react-native';

type Props = {
  options: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
};

export default function Segmented({ options, value, onChange }: Props) {
  return (
    <View className="flex-row bg-white/5 border border-white/10 rounded-xl p-1">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            className={`flex-1 items-center py-2 rounded-lg ${active ? 'bg-white/15' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            <Text className={`text-sm ${active ? 'text-zinc-100 font-semibold' : 'text-zinc-400'}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}


