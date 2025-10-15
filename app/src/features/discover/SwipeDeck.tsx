import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import CandidateCard from './CandidateCard';
import type { Candidate } from './types';

const { width } = Dimensions.get('window');
const SWIPE_OUT = Math.min(120, width * 0.28);
const ROT = 12;

type Props = {
  candidates: Candidate[];
  onSwipe: (id: string, dir: 'left' | 'right') => Promise<{ matched?: boolean } | void>;
};

export default function SwipeDeck({ candidates, onSwipe }: Props) {
  const [index, setIndex] = React.useState(0);
  const top = candidates[index];
  const next = candidates[index + 1];
  const third = candidates[index + 2];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const dragging = useSharedValue(false);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => { dragging.value = true; })
        .onChange((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY;
          rotation.value = (e.translationX / width) * ROT;
        })
        .onEnd(async (e) => {
          const dir = e.translationX > SWIPE_OUT ? 'right' : e.translationX < -SWIPE_OUT ? 'left' : null;
          if (dir && top) {
            const toX = dir === 'right' ? width * 1.2 : -width * 1.2;
            translateX.value = withTiming(toX, { duration: 180 }, () => {
              runOnJS(setIndex)(i => i + 1);
              translateX.value = 0; translateY.value = 0; rotation.value = 0; dragging.value = false;
            });
            runOnJS(onSwipe)(top.id, dir);
          } else {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            rotation.value = withSpring(0);
            dragging.value = false;
          }
        }),
    [top?.id]
  );

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  const nextStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(dragging.value ? 0.98 : 1) },
      { translateY: withSpring(dragging.value ? -6 : 0) },
    ],
    opacity: withSpring(dragging.value ? 0.96 : 1),
  }));

  const thirdStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  }));

  const Card = (c: Candidate | undefined, style?: any) =>
    c ? (
      <Animated.View style={[{ position: 'absolute', width: '100%' }, style]}>
        <CandidateCard
          name={c.displayName}
          age={c.age}
          bio={c.bio}
          photoUrl={c.photoUrl}
          shared={c.score}
        />
      </Animated.View>
    ) : null;

  return (
    <View className="flex-1 items-center justify-center">
      <View className="w-[92%]">
        {Card(third, thirdStyle)}
        {Card(next, nextStyle)}
        {top ? (
          <GestureDetector gesture={pan}>
            <Animated.View style={[topStyle]}>
              <CandidateCard
                name={top.displayName}
                age={top.age}
                bio={top.bio}
                photoUrl={top.photoUrl}
                shared={top.score}
              />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
    </View>
  );
}

