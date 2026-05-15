/**
 * COMPATIBILITY SECTION — Main scroll hook.
 * Fetches persuasive heading from backend. Cached via dataCache (STATIC).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import dataCache, { CACHE_POLICY } from '../cache/dataCache';
import SectionLabel from '../components/SectionLabel';

const W = a => `rgba(255,255,255,${a})`;
const API = 'https://api.plutto.space/api/public';

function CTA({ text, onPress }) {
  const breathe = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 0.18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(breathe, { toValue: 0.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <Animated.View style={[s.ctaBox, { borderColor: breathe.interpolate({ inputRange: [0.08, 0.18], outputRange: [W(0.08), W(0.18)] }) }]}>
        <Text style={s.ctaLabel}>{text}</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CompatibilitySection({ kundliData, onOpen, onImpulse }) {
  const [data, setData] = useState(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const registered = useRef(false);

  const fetchHook = useCallback(async () => {
    const res = await fetch(`${API}/compatibility-hook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundli_data: kundliData }),
    });
    const json = await res.json();
    if (!json?.hook_title) throw new Error('Invalid compatibility-hook response');
    return json;
  }, [kundliData]);

  useEffect(() => {
    if (!kundliData) return;
    (async () => {
      const result = await dataCache.getOrFetch('compatibility-hook', kundliData, fetchHook, CACHE_POLICY.STATIC);
      if (result?.data) setData(result.data);
    })();
    if (!registered.current) {
      registered.current = true;
      dataCache.register('compatibility-hook', kundliData, fetchHook, CACHE_POLICY.STATIC);
    }
  }, [kundliData]);

  useEffect(() => {
    if (data) {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [data]);

  if (!data?.hook_title) return null;

  return (
    <Animated.View style={[s.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <SectionLabel text="compatibility" secret={data.secret} />
      <Text style={s.hookTitle}>{data.hook_title}</Text>
      <Text style={s.hookBody}>{data.hook_body}</Text>
      <CTA text={data.cta_dive} onPress={() => { if (onImpulse) onImpulse(); if (onOpen) onOpen(); }} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28 },
  hookTitle: { fontFamily: 'PlayfairDisplay', fontSize: 24, lineHeight: 34, color: W(0.9), marginBottom: 14 },
  hookBody: { fontSize: 14, lineHeight: 24, color: W(0.5), fontWeight: '300', marginBottom: 4 },
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 0.5, borderColor: W(0.08), paddingVertical: 12, paddingHorizontal: 16, marginVertical: 14, borderRadius: 2 },
  ctaLabel: { fontFamily: 'PlayfairDisplay', fontSize: 13, lineHeight: 18, color: W(0.65), fontStyle: 'italic', flex: 1, marginRight: 10 },
  ctaArrow: { fontSize: 13, color: W(0.18), fontWeight: '200' },
});