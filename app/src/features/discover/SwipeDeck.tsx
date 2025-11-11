import React, { useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Dimensions, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolate
} from 'react-native-reanimated';
import FullProfileCard from './FullProfileCard';
import type { Candidate } from './SupabaseDiscoverRepository';

const ROT = 12;

export type SwipeDeckRef = { swipeLeft: () => void; swipeRight: () => void; };

type Props = {
  candidates: Candidate[];
  onSwipe: (id: string, dir: 'left' | 'right' | 'super') => Promise<{ matched?: boolean } | void>;
  onPress?: (candidate: Candidate) => void;
};

const SwipeDeck = forwardRef<SwipeDeckRef, Props>(({ candidates, onSwipe, onPress }, ref) => {
  const { width } = useWindowDimensions();
  const SWIPE_OUT = Math.min(120, width * 0.28);
  
  const [swipingCard, setSwipingCard] = React.useState<Candidate | null>(null);
  const [frozenNext, setFrozenNext] = React.useState<Candidate | null>(null);
  const [frozenThird, setFrozenThird] = React.useState<Candidate | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  const top = candidates[0];
  const next = candidates[1];
  const third = candidates[2];

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const dragging = useSharedValue(false);

  const doSwipe = (dir: 'left' | 'right' | 'super') => {
    if (!top || isAnimating) return;
    setIsAnimating(true);
    setSwipingCard(top);
    setFrozenNext(next);
    setFrozenThird(third);
    const toX = dir === 'right' ? width * 1.3 : -width * 1.3;
    const cardId = top.id;
    x.value = withTiming(toX, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(onSwipe)(cardId, dir);
      }
    });
  };

  // Clear frozen states when the candidates array actually changes
  React.useEffect(() => {
    if (swipingCard && swipingCard.id !== top?.id) {
      // Animate position back to center first, then clear frozen states after animation
      x.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(setSwipingCard)(null);
          runOnJS(setFrozenNext)(null);
          runOnJS(setFrozenThird)(null);
          runOnJS(setIsAnimating)(false);
        }
      });
      y.value = withTiming(0, { duration: 150 });
      rot.value = withTiming(0, { duration: 150 });
      dragging.value = false;
    }
  }, [top?.id, swipingCard, x, y, rot, dragging]);

  useImperativeHandle(ref, () => ({
    swipeLeft: () => doSwipe('left'),
    swipeRight: () => doSwipe('right'),
  }), [top?.id, isAnimating]);

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
    [top?.id, isAnimating, width, SWIPE_OUT]
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .enabled(false),
    [top?.id, onPress, swipingCard]
  );

  const composed = useMemo(() => Gesture.Simultaneous(pan, tap), [pan, tap]);

  const cardWidth = Math.min(width * 0.9, 540);
  const cardHeight = Math.min(cardWidth * 1.2, 650);

  const topStyle = useAnimatedStyle(() => {
    // Fade out when off-screen, fade in smoothly when at center
    const absX = Math.abs(x.value);
    const isOffScreen = absX > width * 0.5;
    
    // If off-screen, hide completely
    // If at center (x very close to 0), show fully
    // In between, fade smoothly
    const opacity = isOffScreen ? 0 : interpolate(
      absX,
      [width * 0.3, 0],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      position: 'absolute',
      width: cardWidth,
      height: cardHeight,
      overflow: 'hidden',
      transform: [{ translateX: x.value }, { translateY: y.value }, { rotateZ: `${rot.value}deg` }],
      opacity,
    };
  });

  const nextStyle = useAnimatedStyle(() => {
    const scale = interpolate(Math.abs(x.value), [0, SWIPE_OUT], [1, 0.98], Extrapolate.CLAMP);
    const ty = interpolate(Math.abs(x.value), [0, SWIPE_OUT], [0, -6], Extrapolate.CLAMP);
    return { position: 'absolute', width: cardWidth, height: cardHeight, overflow: 'hidden', transform: [{ scale }, { translateY: ty }], opacity: 0.98 };
  });

  const thirdStyle = useAnimatedStyle(() => ({ position: 'absolute', width: cardWidth, height: cardHeight, overflow: 'hidden', transform: [{ scale: 0.96 }], opacity: 0.9 }));

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
        <FullProfileCard
          key={c.id}
          name={c.display_name}
          age={c.age}
          bio={c.bio}
          photoUrl={c.photo_url}
          distanceKm={c.distance_km}
          lastActive={c.last_active}
          sharedCount={c.overlap_count}
          photos={c.profile_photos}
          categories={c.categories}
          width={cardWidth}
          height={cardHeight}
        />
      </Animated.View>
    ) : null;

  const displayCard = swipingCard || top;
  const displayNext = frozenNext || next;
  const displayThird = frozenThird || third;

  return (
    <View className="flex-1 items-center justify-center">
      <View style={{ width: cardWidth, height: cardHeight, position: 'relative', overflow: 'hidden' }}>
        {Card(displayThird, thirdStyle)}
        {Card(displayNext, nextStyle)}

        {displayCard ? (
          <GestureDetector gesture={composed}>
            <Animated.View style={[topStyle]}>
              {/* LIKE / NOPE stamps */}
              <Animated.View style={[{ position: 'absolute', top: 24, left: 24, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 3, borderColor: 'rgba(34,197,94,0.9)', borderRadius: 12, zIndex: 10 }, likeStyle]}>
                <Text style={{ color: 'rgb(34,197,94)', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[{ position: 'absolute', top: 24, right: 60, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 3, borderColor: 'rgba(239,68,68,0.9)', borderRadius: 12, zIndex: 10 }, nopeStyle]}>
                <Text style={{ color: 'rgb(239,68,68)', fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>NOPE</Text>
              </Animated.View>

              <FullProfileCard
                key={displayCard.id}
                name={displayCard.display_name}
                age={displayCard.age}
                bio={displayCard.bio}
                photoUrl={displayCard.photo_url}
                distanceKm={displayCard.distance_km}
                lastActive={displayCard.last_active}
                sharedCount={displayCard.overlap_count}
                photos={displayCard.profile_photos}
                categories={displayCard.categories}
                width={cardWidth}
                height={cardHeight}
              />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
    </View>
  );
});

export default SwipeDeck;

