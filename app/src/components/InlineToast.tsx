import React from 'react';
import { View, Text, Platform } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

type Props = {
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
};

export default function InlineToast({ message, visible, onHide, duration = 1600, position = 'top' }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
      const t = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 160 }, () => onHide && runOnJS(onHide)());
        translateY.value = withTiming(-16, { duration: 160 });
      }, duration);
      return () => clearTimeout(t);
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = withTiming(-16, { duration: 120 });
    }
  }, [visible, duration, onHide]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const top = position === 'top';

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        position: 'absolute',
        left: 0, right: 0,
        top: top ? (Platform.OS === 'web' ? 16 : 12) : undefined,
        bottom: !top ? 24 : undefined,
        alignItems: 'center',
      }]}
    >
      <View className="px-3 py-2 rounded-xl bg-black/70 border border-white/10">
        <Text className="text-zinc-100 text-sm">{message}</Text>
      </View>
    </Animated.View>
  );
}

