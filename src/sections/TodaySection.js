/**
 * TODAY SECTION — Main scroll hook.
 * Fetches 7-day bundle, caches via dataCache, shows today's reading.
 * Day 6: background refresh. Zero loading after first fetch.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import dataCache, { CACHE_POLICY } from '../cache/dataCache';
import SectionLabel from '../components/SectionLabel';

const W = a => `rgba(255,255,255,${a})`;
const API = 'https://api.plutto.space/api/public';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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

export default function TodaySection({ kundliData, language = 'en', onOpenDeep, onImpulse }) {
  const [todayReading, setTodayReading] = useState(null);
  const [bundle, setBundle] = useState(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const registered = useRef(false);

  const fetchBundle = useCallback(async () => {
    const res = await fetch(`${API}/today-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundli_data: kundliData, language }),
    });
    const json = await res.json();
    if (!json?.days) throw new Error('Invalid today-deep response');
    return json;
  }, [kundliData, language]);

  useEffect(() => {
    if (!kundliData) return;
    const tk = todayKey();

    (async () => {
      let result = await dataCache.getOrFetch('today-deep', kundliData, fetchBundle, CACHE_POLICY.STATIC);
      let data = result?.data;
      if (data && result.fromCache && !(data.days || {})[tk]) {
        await dataCache.invalidate('today-deep', kundliData);
        result = await dataCache.getOrFetch('today-deep', kundliData, fetchBundle, CACHE_POLICY.STATIC);
        data = result?.data;
      }
      if (!data) return;
      const days = data.days || {};
      setBundle(data);
      setTodayReading(days[tk] || Object.values(days)[0] || null);
    })();

    if (!registered.current) {
      registered.current = true;
      dataCache.register('today-deep', kundliData, fetchBundle, CACHE_POLICY.STATIC);
    }
  }, [kundliData]);

  useEffect(() => {
    if (todayReading) {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [todayReading]);

  if (!todayReading) return null;

  return (
    <Animated.View style={[s.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <SectionLabel text="today" secret={todayReading.secret} />
      <Text style={s.hookTitle}>{todayReading.hook_title}</Text>
      <Text style={s.hookBody}>{todayReading.hook_body}</Text>
      <CTA
        text={todayReading.cta_dive}
        onPress={() => {
          if (onImpulse) onImpulse();
          if (onOpenDeep) onOpenDeep({ reading: todayReading, days: bundle?.days });
        }}
      />
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