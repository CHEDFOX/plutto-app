/**
 * PLUTTO — Single screen. Everything wired.
 * Sections: Today → Chart Overview → Core Chart → Compatibility → Features
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import Starfield from './src/components/Starfield';
import TodaySection from './src/sections/TodaySection';
import ChartOverviewSection from './src/sections/ChartOverviewSection';
import CoreChartSection from './src/sections/CoreChartSection';
import CompatibilitySection from './src/sections/CompatibilitySection';
import TodayDeepScreen from './src/screens/TodayDeepScreen';
import ChartOverviewScreen from './src/screens/ChartOverviewScreen';
import CoreChartScreen from './src/screens/CoreChartScreen';
import CompatibilityScreen from './src/screens/CompatibilityScreen';
import { initMediaCache } from './src/config/mediaCache';

import AsyncStorage from '@react-native-async-storage/async-storage';
// Clear stale core chart cache — remove after first run
AsyncStorage.removeItem('core_chart_1976_7_28').then(() => console.log('[Cache] Cleared core chart'));

const { width: SW, height: SH } = Dimensions.get('window');
const KUNDLI = { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } };

export default function App() {
  const [ready, setReady] = useState(false);

  // Today
  const [todayData, setTodayData] = useState(null);
  const [todayVisible, setTodayVisible] = useState(false);

  // Chart Overview
  const [chartData, setChartData] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);

  // Core Chart
  const [coreData, setCoreData] = useState(null);
  const [coreVisible, setCoreVisible] = useState(false);

  // Compatibility
  const [compatVisible, setCompatVisible] = useState(false);

  // Starfield
  const scrollY = useRef(new Animated.Value(0)).current;
  const impulseX = useRef(new Animated.Value(0)).current;
  const impulseY = useRef(new Animated.Value(0)).current;

  const triggerImpulse = useCallback(() => {
    const angle = Math.random() * Math.PI * 2, mag = 0.6 + Math.random() * 0.4;
    const dx = Math.cos(angle) * mag, dy = Math.sin(angle) * mag;
    impulseX.setValue(0); impulseY.setValue(0);
    Animated.parallel([
      Animated.sequence([Animated.timing(impulseX, { toValue: dx, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(impulseX, { toValue: 0, duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true })]),
      Animated.sequence([Animated.timing(impulseY, { toValue: dy, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(impulseY, { toValue: 0, duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true })]),
    ]).start();
  }, []);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });

  useEffect(() => {
    (async () => {
      try { await Font.loadAsync({ 'NotoSerif': require('./assets/fonts/NotoSerif-Regular.ttf'), 'PlayfairDisplay': require('./assets/fonts/PlayfairDisplay-Regular.ttf') }); } catch (_) {}
      initMediaCache().catch(() => {});
      setReady(true);
    })();
  }, []);

  // Handlers
  const openTodayDeep = useCallback(d => { triggerImpulse(); setTodayData(d); setTodayVisible(true); }, [triggerImpulse]);
  const closeTodayDeep = useCallback(() => { triggerImpulse(); setTodayVisible(false); }, [triggerImpulse]);

  const openChart = useCallback(d => { triggerImpulse(); setChartData(d); setChartVisible(true); }, [triggerImpulse]);
  const closeChart = useCallback(() => { triggerImpulse(); setChartVisible(false); }, [triggerImpulse]);

  const openCore = useCallback(d => { triggerImpulse(); setCoreData(d); setCoreVisible(true); }, [triggerImpulse]);
  const closeCore = useCallback(() => { triggerImpulse(); setCoreVisible(false); }, [triggerImpulse]);

  const openCompat = useCallback(() => { triggerImpulse(); setCompatVisible(true); }, [triggerImpulse]);
  const closeCompat = useCallback(() => { triggerImpulse(); setCompatVisible(false); }, [triggerImpulse]);

  if (!ready) return <View style={s.loading}><StatusBar style="light" /></View>;

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <Starfield scrollY={scrollY} impulseX={impulseX} impulseY={impulseY} />

      <Animated.ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Open sky */}
        <View style={s.topSpace} />

        {/* Today hook */}
        <TodaySection kundliData={KUNDLI} onOpenDeep={openTodayDeep} onImpulse={triggerImpulse} />

        <View style={{ height: 50 }} />

        {/* Chart overview hook */}
        <ChartOverviewSection kundliData={KUNDLI} onOpenChart={openChart} onImpulse={triggerImpulse} />

        <View style={{ height: 50 }} />

        {/* Core chart hook — unified wheel */}
        <CoreChartSection kundliData={KUNDLI} onOpenChart={openCore} onImpulse={triggerImpulse} />

        <View style={{ height: 50 }} />

        {/* Compatibility hook */}
        <CompatibilitySection onOpen={openCompat} onImpulse={triggerImpulse} />

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* ─── MODALS ─── */}
      <TodayDeepScreen visible={todayVisible} onClose={closeTodayDeep} todayData={todayData} onImpulse={triggerImpulse} />
      <ChartOverviewScreen visible={chartVisible} onClose={closeChart} chartData={chartData} onImpulse={triggerImpulse} />
      <CoreChartScreen visible={coreVisible} onClose={closeCore} kundliData={KUNDLI} onImpulse={triggerImpulse} />
      <CompatibilityScreen visible={compatVisible} onClose={closeCompat} kundliData={KUNDLI} onImpulse={triggerImpulse} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  topSpace: { height: SH * 0.42 },
});