/**
 * CHART OVERVIEW SECTION — Hook on main scroll.
 *
 * Fetches chart-overview. Cached 7 days with day-6 background refresh.
 * Shows first system's headline + glance + CTA.
 * Tapping opens ChartOverviewScreen modal via onOpenChart(data).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Easing, Dimensions,
} from 'react-native';
import dataCache, { CACHE_POLICY } from '../cache/dataCache';

const { height: SH } = Dimensions.get('window');
const API = 'https://api.plutto.space/api/public';
const W = (a) => `rgba(255,255,255,${a})`;

const SYSTEM_ORDER = ['vedic', 'kp', 'western', 'chinese', 'numerology'];

function createFetchFn(kundliData, name, language) {
  return async () => {
    const res = await fetch(`${API}/chart-overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundli_data: kundliData, name, language }),
    });
    if (!res.ok) throw new Error(`Server: ${res.status}`);
    const json = await res.json();
    if (json.overview && !json.overview.error) return json.overview;
    throw new Error(json.overview?.error || 'Failed');
  };
}

function Reveal({ visible, delay = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    if (visible) {
      opacity.setValue(0); translateY.setValue(24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 700, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 700, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function CTA({ text, onPress }) {
  const breathe = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 0.18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(breathe, { toValue: 0.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);
  const borderColor = breathe.interpolate({ inputRange: [0.08, 0.18], outputRange: [W(0.08), W(0.18)] });
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <Animated.View style={[s.ctaBox, { borderColor }]}>
        <Text style={s.ctaLabel}>{text}</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ChartOverviewSection({
  kundliData, language = 'en', name = '', primarySystem = null,
  onOpenChart, onImpulse,
}) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const registered = useRef(false);

  const fetchFn = useCallback(() => createFetchFn(kundliData, name, language)(), [kundliData, name, language]);

  useEffect(() => {
    loadData();
    if (!registered.current) {
      registered.current = true;
      dataCache.register('chart-overview', kundliData, () => createFetchFn(kundliData, name, language)(), CACHE_POLICY.STATIC);
    }
  }, []);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const result = await dataCache.getOrFetch('chart-overview', kundliData, fetchFn, CACHE_POLICY.STATIC);
      if (result.data) setOverview(result.data);
      else setError(result.error || 'No data');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleOpen = useCallback(() => {
    if (onImpulse) onImpulse();
    if (onOpenChart && overview) onOpenChart(overview);
  }, [overview, onOpenChart, onImpulse]);

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={W(0.2)} size="small" />
          <Text style={s.loadingText}>Mapping your chart...</Text>
        </View>
      </View>
    );
  }

  if (error && !overview) {
    return (
      <View style={s.container}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadData} style={s.retryTouch}>
          <Text style={s.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!overview) return null;

  // Pick the primary system's hook or first available
  const primary = primarySystem || SYSTEM_ORDER.find(k => overview[k]);
  const hook = overview[primary] || overview[SYSTEM_ORDER[0]];
  if (!hook) return null;

  return (
    <View style={s.container}>
      <Reveal visible={true}>
        <Text style={s.headline}>{hook.headline}</Text>
      </Reveal>
      <Reveal visible={true} delay={200}>
        <Text style={s.glance}>{hook.glance}</Text>
      </Reveal>
      <Reveal visible={true} delay={500}>
        <CTA text="See your chart through every lens" onPress={handleOpen} />
      </Reveal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28, minHeight: SH * 0.2, justifyContent: 'center' },
  headline: { fontFamily: 'PlayfairDisplay', fontSize: 30, lineHeight: 42, color: W(0.93), letterSpacing: -0.3, marginBottom: 16 },
  glance: { fontSize: 15, lineHeight: 26, color: W(0.55), fontWeight: '300', marginBottom: 32 },
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: W(0.10), paddingVertical: 20, paddingHorizontal: 24, marginBottom: 20 },
  ctaLabel: { fontFamily: 'PlayfairDisplay', fontSize: 17, lineHeight: 24, color: W(0.88), fontStyle: 'italic', flex: 1, marginRight: 16 },
  ctaArrow: { fontSize: 18, color: W(0.35), fontWeight: '200' },
  loadingWrap: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  loadingText: { fontSize: 13, color: W(0.15), letterSpacing: 1.5, fontWeight: '300' },
  errorText: { fontSize: 14, color: W(0.35), textAlign: 'center' },
  retryTouch: { alignSelf: 'center', marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 0.5, borderColor: W(0.1) },
  retryText: { fontSize: 13, color: W(0.4) },
});