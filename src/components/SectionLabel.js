/**
 * SECTION LABEL — Tiny uppercase label above each section.
 * Triple-tap reveals a cryptic per-section "secret" from the backend.
 * Fades out automatically after a few seconds.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text, TouchableWithoutFeedback, Animated, Easing, StyleSheet, View } from 'react-native';

const W = a => `rgba(255,255,255,${a})`;
const GOLD = '#D4AF37';
const TRIPLE_TAP_WINDOW_MS = 800;
const REVEAL_HOLD_MS = 3500;

export default function SectionLabel({ text, secret }) {
  const [revealed, setRevealed] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const hideTimer = useRef(null);
  const secretOpacity = useRef(new Animated.Value(0)).current;

  const hideSecret = useCallback(() => {
    Animated.timing(secretOpacity, {
      toValue: 0,
      duration: 800,
      easing: Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(() => setRevealed(false));
  }, [secretOpacity]);

  const showSecret = useCallback(() => {
    if (!secret) return;
    setRevealed(true);
    secretOpacity.setValue(0);
    Animated.timing(secretOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideSecret, REVEAL_HOLD_MS);
  }, [secret, hideSecret, secretOpacity]);

  const onTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      showSecret();
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, TRIPLE_TAP_WINDOW_MS);
  }, [showSecret]);

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <View style={s.wrap}>
      <TouchableWithoutFeedback onPress={onTap}>
        <View style={s.hit}>
          <Text style={s.label}>{text}</Text>
        </View>
      </TouchableWithoutFeedback>
      {revealed && secret ? (
        <Animated.Text style={[s.secret, { opacity: secretOpacity }]}>
          {secret}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 16, marginTop: 8 },
  hit: { paddingVertical: 8, paddingHorizontal: 24 },
  label: {
    fontSize: 8,
    letterSpacing: 4,
    color: W(0.1),
    fontWeight: '400',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  secret: {
    marginTop: 12,
    fontSize: 11,
    letterSpacing: 1,
    color: GOLD,
    opacity: 0.7,
    fontFamily: 'PlayfairDisplay',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});