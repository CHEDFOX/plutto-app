import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Starfield from './src/components/Starfield';
import MediaView from './src/components/MediaView';
import SanskritOverlay from './src/components/SanskritOverlay';
import TodaySection from './src/sections/TodaySection';
import ChartOverviewSection from './src/sections/ChartOverviewSection';
import CoreChartSection from './src/sections/CoreChartSection';
import CompatibilitySection from './src/sections/CompatibilitySection';
import TodayDeepScreen from './src/screens/TodayDeepScreen';
import ChartOverviewScreen from './src/screens/ChartOverviewScreen';
import CoreChartScreen from './src/screens/CoreChartScreen';
import CompatibilityScreen from './src/screens/CompatibilityScreen';
import { initMediaCache } from './src/config/mediaCache';
import dataCache from './src/cache/dataCache';

const { width: SW, height: SH } = Dimensions.get('window');
const W = a => `rgba(255,255,255,${a})`;
const GOLD = '#D4AF37';
const KUNDLI = { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } };

function SectionDivider({ style }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeIn, { toValue: 1, duration: 1500, delay: 500, useNativeDriver: true }).start(); }, []);
  return <Animated.View style={[s.divider, style, { opacity: fadeIn }]}><View style={s.divLine} /></Animated.View>;
}

function SectionMedia({ path, height = 200 }) {
  const [ok, setOk] = useState(false);
  return <View style={{ width: '100%', height: ok ? height : 0, overflow: 'hidden' }}>
    <MediaView uri={path} style={{ width: '100%', height }} onLoaded={() => setOk(true)} />
  </View>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [todayVisible, setTodayVisible] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [coreData, setCoreData] = useState(null);
  const [coreVisible, setCoreVisible] = useState(false);
  const [compatVisible, setCompatVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const impulseX = useRef(new Animated.Value(0)).current;
  const impulseY = useRef(new Animated.Value(0)).current;
  const sanskritRef = useRef(null);

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
      dataCache.init();
      setReady(true);
    })();
  }, []);

  const openTodayDeep = useCallback(d => { triggerImpulse(); setTodayData(d); setTodayVisible(true); }, [triggerImpulse]);
  const closeTodayDeep = useCallback(() => { triggerImpulse(); setTodayVisible(false); }, [triggerImpulse]);
  const openChart = useCallback(d => { triggerImpulse(); setChartData(d); setChartVisible(true); }, [triggerImpulse]);
  const closeChart = useCallback(() => { triggerImpulse(); setChartVisible(false); }, [triggerImpulse]);
  const openCore = useCallback(d => { triggerImpulse(); setCoreData(d); setCoreVisible(true); }, [triggerImpulse]);
  const closeCore = useCallback(() => { triggerImpulse(); setCoreVisible(false); }, [triggerImpulse]);
  const openCompat = useCallback(() => { triggerImpulse(); setCompatVisible(true); }, [triggerImpulse]);
  const closeCompat = useCallback(() => { triggerImpulse(); setCompatVisible(false); }, [triggerImpulse]);

  // Two-finger swipe down → Sanskrit overlay
  const onPan = useCallback((e) => {
    if (e.nativeEvent.state === State.ACTIVE && e.nativeEvent.translationY > 50) {
      sanskritRef.current?.trigger();
    }
  }, []);

  if (!ready) return <View style={s.loading}><StatusBar style="light" /></View>;

  return (
    <GestureHandlerRootView style={s.container}>
      <StatusBar style="light" />
      <Starfield scrollY={scrollY} impulseX={impulseX} impulseY={impulseY} />

      <PanGestureHandler
        minPointers={2}
        maxPointers={2}
        activeOffsetY={[0, 30]}
        onHandlerStateChange={onPan}
      >
        <Animated.ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
          <View style={s.topSpace} />

          <TodaySection kundliData={KUNDLI} onOpenDeep={openTodayDeep} onImpulse={triggerImpulse} />
          <SectionMedia path="sections/between_today_chart.jpg" height={220} />
          <SectionDivider />

          <ChartOverviewSection kundliData={KUNDLI} onOpenChart={openChart} onImpulse={triggerImpulse} />
          <SectionMedia path="sections/between_chart_core.jpg" height={200} />
          <SectionDivider />

          <CoreChartSection kundliData={KUNDLI} onOpenChart={openCore} onImpulse={triggerImpulse} />
          <SectionMedia path="sections/between_core_compat.jpg" height={240} />
          <SectionDivider />

          <CompatibilitySection kundliData={KUNDLI} onOpen={openCompat} onImpulse={triggerImpulse} />

          <View style={{ height: 160 }} />
        </Animated.ScrollView>
      </PanGestureHandler>

      <TodayDeepScreen visible={todayVisible} onClose={closeTodayDeep} todayData={todayData} onImpulse={triggerImpulse} />
      <ChartOverviewScreen visible={chartVisible} onClose={closeChart} chartData={chartData} onImpulse={triggerImpulse} />
      <CoreChartScreen visible={coreVisible} onClose={closeCore} kundliData={KUNDLI} onImpulse={triggerImpulse} />
      <CompatibilityScreen visible={compatVisible} onClose={closeCompat} kundliData={KUNDLI} onImpulse={triggerImpulse} />

      <SanskritOverlay ref={sanskritRef} kundliData={KUNDLI} />
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  topSpace: { height: SH * 0.42 },
  divider: { alignItems: 'center', paddingVertical: 40 },
  divLine: { width: 1, height: 40, backgroundColor: W(0.04) },
});