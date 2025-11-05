import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getTotalUnreadCount } from '../lib/chat';

type Props = {
  onPressLeft?: () => void;   // e.g., Settings
  onPressRight?: () => void;  // e.g., Messages
};

export default function TopBar({ onPressLeft, onPressRight }: Props) {
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getTotalUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.warn('[TopBar] Failed to load unread count:', e);
      }
    };

    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="w-full flex-row items-center justify-between px-4 pt-6 pb-2">
      <Pressable
        onPress={onPressLeft}
        hitSlop={10}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
      >
        <Ionicons name="menu" size={20} color="#E5E7EB" />
      </Pressable>

      <Text className="text-zinc-100 text-xl font-semibold tracking-wide">
        Buddy<Text className="text-teal-300">Up</Text>
      </Text>

      <Pressable
        onPress={onPressRight}
        hitSlop={10}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
      >
        <Ionicons name="chatbubbles-outline" size={20} color="#E5E7EB" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 min-w-5 px-1 h-5 rounded-full bg-teal-500/90 items-center justify-center">
            <Text className="text-[10px] text-zinc-900 font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

