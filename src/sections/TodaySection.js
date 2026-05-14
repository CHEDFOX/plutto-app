/**
 * TODAY SECTION — Main scroll hook.
 * Fetches 7-day bundle, caches it, shows today's reading.
 * Day 6: background refresh. Zero loading after first fetch.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const W = a => `rgba(255,255,255,${a})`;
const API = 'https://api.plutto.space/api/public';
const CACHE_KEY_PREFIX = 'today_7d_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const REFRESH_AT = 6 * 24 * 60 * 60 * 1000;

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

  const fetchBundle = useCallback(async () => {
    const res = await fetch(`${API}/today-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundli_data: kundliData, language }),
    });
    return await res.json();
  }, [kundliData, language]);

  useEffect(() => {
    if (!kundliData) return;
    const bd = kundliData?.raw?.birth_details || {};
    const cacheKey = CACHE_KEY_PREFIX + `${bd.year}_${bd.month}_${bd.day}`;
    const tk = todayKey();

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          const age = Date.now() - ts;
          const days = data?.days || {};
          // Check if today's reading exists in cache
          if (days[tk] && age < CACHE_TTL) {
            setBundle(data);
            setTodayReading(days[tk]);
            // Background refresh if past day 6
            if (age > REFRESH_AT) {
              fetchBundle().then(fresh => {
                setBundle(fresh);
                const fd = fresh?.days || {};
                if (fd[tk]) setTodayReading(fd[tk]);
                AsyncStorage.setItem(cacheKey, JSON.stringify({ data: fresh, ts: Date.now() }));
              }).catch(() => {});
            }
            return;
          }
        }
        // No valid cache or today missing — fetch fresh
        const fresh = await fetchBundle();
        setBundle(fresh);
        const fd = fresh?.days || {};
        setTodayReading(fd[tk] || Object.values(fd)[0] || null);
        AsyncStorage.setItem(cacheKey, JSON.stringify({ data: fresh, ts: Date.now() }));
      } catch (e) {
        try {
          const fresh = await fetchBundle();
          setBundle(fresh);
          const fd = fresh?.days || {};
          setTodayReading(fd[tk] || Object.values(fd)[0] || null);
        } catch (_) {}
      }
    })();
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
      <Text style={s.hookTitle}>{todayReading.hook_title}</Text>
      <Text style={s.hookBody}>{todayReading.hook_body}</Text>
      <CTA
        text={todayReading.cta_dive}
        onPress={() => {
          if (onImpulse) onImpulse();
          // Pass today's reading + full bundle for the deep screen
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
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingVertical: 18, paddingHorizontal: 22, marginVertical: 16 },
  ctaLabel: { fontFamily: 'PlayfairDisplay', fontSize: 16, lineHeight: 22, color: W(0.88), fontStyle: 'italic', flex: 1, marginRight: 14 },
  ctaArrow: { fontSize: 16, color: W(0.3), fontWeight: '200' },
});