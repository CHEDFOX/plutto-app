/**
 * STARFIELD — Premium interactive night sky.
 *
 * Reacts to:
 *   1. Scroll — 3-layer parallax (near stars drift with scroll, far barely move)
 *   2. Interactions — impulse nudge on page transitions, feature opens, lens changes
 *      Stars scatter outward proportional to depth, settle back via spring physics
 *
 * Props:
 *   scrollY   — Animated.Value from ScrollView's onScroll
 *   impulseX  — Animated.Value, quick burst then decay on interaction
 *   impulseY  — Animated.Value, same
 *
 * 280 stars. 3 depth layers. Subtle color temperature.
 * 4 shared scintillation channels at prime periods.
 * All transforms use useNativeDriver: true.
 * No pulsars. No shooting stars. No gimmicks.
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

function sr(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const STAR_COLORS = ['#FFFFFF', '#FFFFFF', '#FFF8F0', '#FFF5E8', '#F0F4FF', '#E8EEFF'];

// Parallax factors per depth (how much scroll affects position)
const PARALLAX = [0.008, 0.025, 0.055]; // far, mid, near

// Impulse magnitude per depth
const IMPULSE_MAG = [1.5, 4, 8]; // far, mid, near

function generateStars() {
  const stars = [];
  const COUNT = 280;

  for (let i = 0; i < COUNT; i++) {
    const s = i + 1;
    const depthRoll = sr(s * 31);
    const depth = depthRoll < 0.65 ? 0 : depthRoll < 0.90 ? 1 : 2;

    const size = depth === 0 ? 0.15 + sr(s * 11) * 0.25
               : depth === 1 ? 0.3 + sr(s * 11) * 0.35
               :               0.5 + sr(s * 13) * 0.4;

    const baseOpacity = depth === 0 ? 0.04 + sr(s * 17) * 0.12
                      : depth === 1 ? 0.08 + sr(s * 17) * 0.22
                      :               0.15 + sr(s * 17) * 0.30;

    const driftScale = depth === 0 ? 0.3 : depth === 1 ? 0.65 : 1.0;
    const scintGroup = Math.floor(sr(s * 37) * 4);
    const scintPhase = sr(s * 41);
    const scintAmount = depth === 0 ? 0.3 + sr(s * 43) * 0.3
                      : depth === 1 ? 0.4 + sr(s * 43) * 0.35
                      :               0.5 + sr(s * 43) * 0.3;

    const color = STAR_COLORS[Math.floor(sr(s * 47) * STAR_COLORS.length)];

    stars.push({
      id: i, x: sr(s * 3) * W, y: sr(s * 5) * H * 1.3,
      size, baseOpacity, depth, driftScale, scintGroup, scintPhase, scintAmount, color,
      parallaxFactor: PARALLAX[depth],
      impulseMag: IMPULSE_MAG[depth],
    });
  }
  return stars;
}


const Star = React.memo(({ star, driftX, driftY, scrollY, impulseX, impulseY, scintAnim }) => {
  // Scintillation
  const opacity = scintAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: (() => {
      const base = star.baseOpacity;
      const amt = star.scintAmount;
      const p = star.scintPhase;
      const v = (i) => {
        const t = (i / 4 + p) % 1;
        return Math.max(0.02, base + base * amt * Math.sin(t * Math.PI * 2) * 0.5);
      };
      return [v(0), v(1), v(2), v(3), v(0)];
    })(),
  });

  // Compose translateX: drift + impulse
  const translateX = Animated.add(
    driftX.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6 * star.driftScale],
    }),
    Animated.multiply(impulseX, star.impulseMag)
  );

  // Compose translateY: drift + impulse + scroll parallax
  const translateY = Animated.add(
    Animated.add(
      driftY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 4 * star.driftScale],
      }),
      Animated.multiply(impulseY, star.impulseMag)
    ),
    Animated.multiply(scrollY, -star.parallaxFactor)
  );

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
        backgroundColor: star.color,
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
});


export default function Starfield({ scrollY, impulseX, impulseY }) {
  const stars = useMemo(generateStars, []);

  // Fallback animated values if not provided
  const fallbackScroll = useRef(new Animated.Value(0)).current;
  const fallbackImpX = useRef(new Animated.Value(0)).current;
  const fallbackImpY = useRef(new Animated.Value(0)).current;

  const sY = scrollY || fallbackScroll;
  const iX = impulseX || fallbackImpX;
  const iY = impulseY || fallbackImpY;

  // Slow organic drift
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;

  // 4 scintillation channels
  const scintAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // Drift
    Animated.loop(Animated.sequence([
      Animated.timing(driftX, { toValue: 1, duration: 80000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(driftX, { toValue: 0, duration: 80000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(driftY, { toValue: 1, duration: 110000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(driftY, { toValue: 0, duration: 110000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Scintillation
    [7000, 11000, 13000, 17000].forEach((period, i) => {
      Animated.loop(
        Animated.timing(scintAnims[i], { toValue: 1, duration: period, easing: Easing.linear, useNativeDriver: true })
      ).start();
    });
  }, []);

  const groups = [[], [], [], []];
  stars.forEach(s => groups[s.scintGroup].push(s));

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.base} />
      {groups.map((group, gi) =>
        group.map(star => (
          <Star
            key={star.id}
            star={star}
            driftX={driftX}
            driftY={driftY}
            scrollY={sY}
            impulseX={iX}
            impulseY={iY}
            scintAnim={scintAnims[gi]}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
});