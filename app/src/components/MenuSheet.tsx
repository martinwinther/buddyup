import * as React from 'react';
import { Modal, View, Text, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Item = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: Item[];
  title?: string;
};

export function MenuSheet({ visible, onClose, items, title = 'Menu' }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="absolute right-3 top-14 w-64 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-2">
        <Text className="px-2 py-1 text-zinc-300 text-xs">{title}</Text>
        {items.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => { onClose(); it.onPress(); }}
            className="flex-row items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/10"
            accessibilityLabel={it.label}
          >
            <Ionicons name={it.icon} size={18} color={it.danger ? '#fca5a5' : '#E5E7EB'} />
            <Text className={it.danger ? 'text-red-300' : 'text-zinc-100'}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

