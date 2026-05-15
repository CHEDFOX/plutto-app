/**
 * SANSKRIT OVERLAY — Full-screen blackout with daily Sanskrit word.
 * Triggered by two-finger swipe down on the home screen.
 * Reads daily_word from dataCache (today-deep response).
 */
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import dataCache, { CACHE_POLICY } from '../cache/dataCache';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = a => `rgba(255,255,255,${a})`;

const FALLBACK_WORD = {
  devanagari: 'क्षण',
  romanized: 'kshana',
  meaning: 'the moment',
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const SanskritOverlay = forwardRef(({ kundliData }, ref) => {
  const [visible, setVisible] = useState(false);
  const [word, setWord] = useState(FALLBACK_WORD);
  const opacity = useRef(new Animated.Value(0)).current;

  const trigger = useCallback(async () => {
    // Resolve today's word from cache (set by TodaySection's /today-deep call)
    try {
      const cached = await dataCache.read('today-deep', kundliData, CACHE_POLICY.STATIC);
      const days = cached?.data?.days || {};
      const today = days[todayKey()] || Object.values(days)[0];
      const w = today?.daily_word;
      if (w && w.devanagari) {
        setWord({
          devanagari: w.devanagari,
          romanized: w.romanized || '',
          meaning: w.meaning || '',
        });
      } else {
        setWord(FALLBACK_WORD);
      }
    } catch (_) {
      setWord(FALLBACK_WORD);
    }

    setVisible(true);
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(opacity, { toValue: 0, duration: 600, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [kundliData, opacity]);

  useImperativeHandle(ref, () => ({ trigger }), [trigger]);

  if (!visible) return null;
  return (
    <Animated.View style={[s.overlay, { opacity }]} pointerEvents="none">
      <Text style={s.devanagari}>{word.devanagari}</Text>
      {word.romanized ? <Text style={s.romanized}>{word.romanized}</Text> : null}
      {word.meaning ? <Text style={s.meaning}>{word.meaning}</Text> : null}
    </Animated.View>
  );
});

export default SanskritOverlay;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  devanagari: {
    fontSize: 72,
    color: GOLD,
    fontFamily: 'PlayfairDisplay',
    letterSpacing: 2,
    marginBottom: 24,
  },
  romanized: {
    fontSize: 14,
    color: W(0.5),
    letterSpacing: 4,
    textTransform: 'lowercase',
    fontWeight: '300',
    marginBottom: 8,
  },
  meaning: {
    fontSize: 11,
    color: W(0.25),
    letterSpacing: 2,
    fontStyle: 'italic',
    fontFamily: 'PlayfairDisplay',
  },
});