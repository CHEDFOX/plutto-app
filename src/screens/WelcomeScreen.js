import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { STARS } from '../utils/starSeed';

const { width: SW, height: SH } = Dimensions.get('window');
const CX = SW / 2;
const CY = SH / 2;
const COUNT = Math.min(STARS.length, 120);

function sr(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

export default function WelcomeScreen({ language, userName, onComplete }) {
  const starsOp = useRef(new Animated.Value(0)).current;
  const disperse = useRef(new Animated.Value(0)).current;

  const starData = useMemo(() => STARS.slice(0, COUNT).map((s, i) => {
    const sx = (sr((i + 1) * 37) - 0.5) * 60;
    const sy = (sr((i + 1) * 41) - 0.5) * 40;
    return { ...s, dx: (CX + sx) - s.x, dy: (CY + sy) - s.y };
  }), []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(starsOp, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(400),
      Animated.spring(disperse, { toValue: 1, tension: 8, friction: 12, useNativeDriver: true }),
      Animated.delay(200),
    ]).start(() => { if (onComplete) onComplete(); });
  }, []);

  return (
    <View style={st.container}>
      {starData.map((s, i) => {
        const tx = disperse.interpolate({ inputRange: [0, 1], outputRange: [s.dx, 0] });
        const ty = disperse.interpolate({ inputRange: [0, 1], outputRange: [s.dy, 0] });
        return (
          <Animated.View key={i} pointerEvents="none" style={{
            position: 'absolute', left: s.x - s.size, top: s.y - s.size,
            width: s.size * 2, height: s.size * 2, borderRadius: s.size,
            backgroundColor: '#fff',
            opacity: Animated.multiply(starsOp, s.baseOpacity || 0.4),
            transform: [{ translateX: tx }, { translateY: ty }],
          }} />
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({ container: { flex: 1, backgroundColor: '#030308' } });