/**
 * EMAIL SEND ANIMATION
 *
 * Six dots orbit a centered envelope with spring physics, then collapse
 * radially into it. Envelope pulses on absorption.
 *
 * All haptics scheduled from JS thread via setTimeout — no worklet
 * completion callbacks (those caused crashes when running JS-thread code
 * on the UI thread).
 */
import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

const { width: SW } = Dimensions.get('window');

const ENVELOPE_W = 88;
const ENVELOPE_H = 64;
const ORBIT_R = 90;
const DOT_SIZE = 8;
const DOT_COUNT = 6;

const SPRING_ORBIT = { damping: 8, stiffness: 35, mass: 1 };
const SPRING_COLLAPSE = { damping: 15, stiffness: 110, mass: 1 };
const PULSE_DURATION = 220;
const COLLAPSE_DELAY = 700;
const PULSE_DELAY = 1450;

function Dot({ index, rotation, radius }) {
  const baseAngle = (index / DOT_COUNT) * Math.PI * 2;

  const style = useAnimatedStyle(() => {
    const angle = baseAngle + rotation.value;
    const r = radius.value * ORBIT_R;
    const hidden = radius.value < 0.06;
    return {
      transform: [
        { translateX: Math.cos(angle) * r },
        { translateY: Math.sin(angle) * r },
        { scale: 0.7 + (1 - Math.abs(1 - radius.value)) * 0.4 },
      ],
      opacity: hidden ? 0 : 0.4 + (1 - radius.value) * 0.6,
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

function Envelope({ pulse }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <Animated.View style={[styles.envelopeWrap, style]}>
      <Svg width={ENVELOPE_W} height={ENVELOPE_H} viewBox="0 0 88 64">
        <Rect
          x="2"
          y="8"
          width="84"
          height="48"
          rx="3"
          stroke={colors.white}
          strokeWidth="1.4"
          fill="none"
        />
        <Path
          d="M 3.5 12 L 44 36 L 84.5 12"
          stroke={colors.white}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

export default function EmailSendAnimation() {
  const rotation = useSharedValue(0);
  const radius = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withSpring(Math.PI * 3, SPRING_ORBIT);
    radius.value = withDelay(COLLAPSE_DELAY, withSpring(0, SPRING_COLLAPSE));
    pulse.value = withDelay(
      PULSE_DELAY,
      withSequence(
        withTiming(1.18, { duration: PULSE_DURATION, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
        withTiming(1.0,  { duration: PULSE_DURATION, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      ),
    );

    const t1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 350);
    const t2 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, PULSE_DELAY);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Envelope pulse={pulse} />
        <View style={styles.dotLayer} pointerEvents="none">
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <Dot key={i} index={i} rotation={rotation} radius={radius} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stage: {
    width: ORBIT_R * 2 + DOT_SIZE * 2,
    height: ORBIT_R * 2 + DOT_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeWrap: {
    position: 'absolute',
    width: ENVELOPE_W,
    height: ENVELOPE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.gold,
  },
});