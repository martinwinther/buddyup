import React, { useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolate
} from 'react-native-reanimated';
import CandidateCard from './CandidateCard';
import type { Candidate } from './types';

const { width } = Dimensions.get('window');
const SWIPE_OUT = Math.min(120, width * 0.28);
const ROT = 12;

export type SwipeDeckRef = { swipeLeft: () => void; swipeRight: () => void; };

type Props = {
  candidates: Candidate[];
  onSwipe: (id: string, dir: 'left' | 'right') => Promise<{ matched?: boolean } | void>;
};

const SwipeDeck = forwardRef<SwipeDeckRef, Props>(({ candidates, onSwipe }, ref) => {
  const [index, setIndex] = React.useState(0);
  const top = candidates[index];
  const next = candidates[index + 1];
  const third = candidates[index + 2];

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const dragging = useSharedValue(false);

  const doSwipe = (dir: 'left' | 'right') => {
    if (!top) return;
    const toX = dir === 'right' ? width * 1.3 : -width * 1.3;
    x.value = withTiming(toX, { duration: 180 }, () => {
      runOnJS(setIndex)(i => i + 1);
      x.value = 0; y.value = 0; rot.value = 0; dragging.value = false;
    });
    onSwipe(top.id, dir);
  };

  useImperativeHandle(ref, () => ({
    swipeLeft: () => doSwipe('left'),
    swipeRight: () => doSwipe('right'),
  }), [top?.id]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => { dragging.value = true; })
        .onChange((e) => {
          x.value = e.translationX;
          y.value = e.translationY;
          rot.value = (e.translationX / width) * ROT;
        })
        .onEnd((e) => {
          const dir = e.translationX > SWIPE_OUT ? 'right' : e.translationX < -SWIPE_OUT ? 'left' : null;
          if (dir) doSwipe(dir);
          else {
            x.value = withSpring(0);
            y.value = withSpring(0);
            rot.value = withSpring(0);
            dragging.value = false;
          }
        }),
    [top?.id]
  );

  const topStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotateZ: `${rot.value}deg` }],
  }));

  const nextStyle = useAnimatedStyle(() => {
    const scale = interpolate(Math.abs(x.value), [0, SWIPE_OUT], [1, 0.98], Extrapolate.CLAMP);
    const ty = interpolate(Math.abs(x.value), [0, SWIPE_OUT], [0, -6], Extrapolate.CLAMP);
    return { position: 'absolute', width: '100%', height: '100%', transform: [{ scale }, { translateY: ty }], opacity: 0.98 };
  });

  const thirdStyle = useAnimatedStyle(() => ({ position: 'absolute', width: '100%', height: '100%', transform: [{ scale: 0.96 }], opacity: 0.9 }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [20, 80], [0, 1], Extrapolate.CLAMP),
    transform: [{ rotateZ: '-12deg' }],
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-80, -20], [1, 0], Extrapolate.CLAMP),
    transform: [{ rotateZ: '12deg' }],
  }));

  const Card = (c: Candidate | undefined, style?: any) =>
    c ? (
      <Animated.View style={style}>
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
      <View style={{ width: Math.min(width * 0.92, 480), height: 600 }}>
        {Card(third, thirdStyle)}
        {Card(next, nextStyle)}

        {top ? (
          <GestureDetector gesture={pan}>
            <Animated.View style={[topStyle]}>
              {/* LIKE / NOPE stamps */}
              <Animated.View style={[{ position: 'absolute', top: 24, left: 24, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 3, borderColor: 'rgba(34,197,94,0.9)', borderRadius: 12 }, likeStyle]}>
                <Text style={{ color: 'rgb(34,197,94)', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[{ position: 'absolute', top: 24, right: 24, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 3, borderColor: 'rgba(239,68,68,0.9)', borderRadius: 12 }, nopeStyle]}>
                <Text style={{ color: 'rgb(239,68,68)', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>NOPE</Text>
              </Animated.View>

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
});

export default SwipeDeck;

