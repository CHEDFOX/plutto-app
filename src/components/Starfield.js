import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { STARS } from '../utils/starSeed';

const { width: W, height: H } = Dimensions.get('window');

// Single uniform star — tiny white, subtle twinkle, participates in global drift
const Star = React.memo(({ star, driftX, driftY }) => {
  const opacity = useRef(new Animated.Value(star.baseOpacity)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.max(0.04, star.baseOpacity * 0.4),
          duration: star.twinkleSpeed,
          useNativeDriver: true,
          easing: Easing.bezier(0.37, 0, 0.63, 1),
        }),
        Animated.timing(opacity, {
          toValue: star.baseOpacity,
          duration: star.twinkleSpeed,
          useNativeDriver: true,
          easing: Easing.bezier(0.37, 0, 0.63, 1),
        }),
      ])
    );
    const t = setTimeout(() => loop.start(), star.twinkleDelay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);

  const translateX = driftX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-star.driftMag, star.driftMag],
  });
  const translateY = driftY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-star.driftMag * 0.7, star.driftMag * 0.7],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: star.x - star.size,
        top: star.y - star.size,
        width: star.size * 2,
        height: star.size * 2,
        borderRadius: star.size,
        backgroundColor: '#FFFFFF',
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
});

export default function Starfield() {
  const stars = useMemo(() => STARS, []);

  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopX = Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, { toValue: 1, duration: 40000, useNativeDriver: true, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        Animated.timing(driftX, { toValue: -1, duration: 40000, useNativeDriver: true, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
      ])
    );
    const loopY = Animated.loop(
      Animated.sequence([
        Animated.timing(driftY, { toValue: 1, duration: 48000, useNativeDriver: true, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
        Animated.timing(driftY, { toValue: -1, duration: 48000, useNativeDriver: true, easing: Easing.bezier(0.37, 0, 0.63, 1) }),
      ])
    );
    loopX.start();
    loopY.start();
    return () => { loopX.stop(); loopY.stop(); };
  }, []);

  return (
    <View style={s.container} pointerEvents="none">
      <View style={s.base} />
      {stars.map(st => (
        <Star key={st.id} star={st} driftX={driftX} driftY={driftY} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});