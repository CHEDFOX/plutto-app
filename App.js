/**
 * PLUTTO — Root.
 * Pipeline: splash → auth → language → languageTransition → birth → home.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initMediaCache } from './src/config/mediaCache';
import RemoteMedia from './src/components/RemoteMedia';
import Starfield from './src/components/Starfield';
import { generateKundli } from './src/api/backend';

import SplashScreen from './src/screens/SplashScreen';
import AuthGateScreen from './src/screens/AuthGateScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import BirthDetailsScreen from './src/screens/BirthDetailsScreen';
import { supabase } from './src/api/supabase';

import TodaySection from './src/sections/TodaySection';
import ChartOverviewSection from './src/sections/ChartOverviewSection';
import CoreChartSection from './src/sections/CoreChartSection';
import CompatibilitySection from './src/sections/CompatibilitySection';
import TodayDeepScreen from './src/screens/TodayDeepScreen';
import ChartOverviewScreen from './src/screens/ChartOverviewScreen';
import CoreChartScreen from './src/screens/CoreChartScreen';
import CompatibilityScreen from './src/screens/CompatibilityScreen';

const { width: SW, height: SH } = Dimensions.get('window');

const API_BASE = 'https://api.plutto.space/api/public';
const CACHE_KEY_PREFIX = '@plutto/onboarding-content/';
const ONBOARDING_DONE_KEY = '@plutto/onboarding-done';
const KUNDLI_KEY = '@plutto/kundli';

const TRANSITION_MIN_MS = 3500;

async function fetchBundle(language) {
  const url = `${API_BASE}/onboarding-content${language ? `?language=${encodeURIComponent(language)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`onboarding-content ${res.status}`);
  const json = await res.json();
  if (!json?.success || !json?.data) throw new Error('bad shape');
  return json.data;
}

async function fetchWithRetry(language) {
  let attempt = 0;
  for (;;) {
    try { return await fetchBundle(language); }
    catch (err) {
      const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
      attempt += 1;
      console.log('[onboarding/retry]', err?.message || err, 'next in', delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function loadCachedBundle(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

async function saveCachedBundle(key, bundle) {
  try { await AsyncStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(bundle)); } catch (_) {}
}

function TransitionMedia({ mediaPath, size = 200 }) {
  return (
    <View style={s.transition}>
      <StatusBar style="light" />
      {mediaPath ? <RemoteMedia path={mediaPath} size={size} loop fadeIn /> : null}
    </View>
  );
}

function HomeView({ kundliData }) {
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

  const triggerImpulse = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const mag = 0.6 + Math.random() * 0.4;
    const dx = Math.cos(angle) * mag;
    const dy = Math.sin(angle) * mag;
    impulseX.setValue(0); impulseY.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(impulseX, { toValue: dx, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(impulseX, { toValue: 0, duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(impulseY, { toValue: dy, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(impulseY, { toValue: 0, duration: 1400, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });

  const openTodayDeep = useCallback((d) => { triggerImpulse(); setTodayData(d); setTodayVisible(true); }, [triggerImpulse]);
  const closeTodayDeep = useCallback(() => { triggerImpulse(); setTodayVisible(false); }, [triggerImpulse]);
  const openChart = useCallback((d) => { triggerImpulse(); setChartData(d); setChartVisible(true); }, [triggerImpulse]);
  const closeChart = useCallback(() => { triggerImpulse(); setChartVisible(false); }, [triggerImpulse]);
  const openCore = useCallback((d) => { triggerImpulse(); setCoreData(d); setCoreVisible(true); }, [triggerImpulse]);
  const closeCore = useCallback(() => { triggerImpulse(); setCoreVisible(false); }, [triggerImpulse]);
  const openCompat = useCallback(() => { triggerImpulse(); setCompatVisible(true); }, [triggerImpulse]);
  const closeCompat = useCallback(() => { triggerImpulse(); setCompatVisible(false); }, [triggerImpulse]);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <Starfield scrollY={scrollY} impulseX={impulseX} impulseY={impulseY} />

      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={s.topSpace} />
        <TodaySection kundliData={kundliData} onOpenDeep={openTodayDeep} onImpulse={triggerImpulse} />
        <View style={{ height: 50 }} />
        <ChartOverviewSection kundliData={kundliData} onOpenChart={openChart} onImpulse={triggerImpulse} />
        <View style={{ height: 50 }} />
        <CoreChartSection kundliData={kundliData} onOpenChart={openCore} onImpulse={triggerImpulse} />
        <View style={{ height: 50 }} />
        <CompatibilitySection onOpen={openCompat} onImpulse={triggerImpulse} />
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <TodayDeepScreen visible={todayVisible} onClose={closeTodayDeep} todayData={todayData} onImpulse={triggerImpulse} />
      <ChartOverviewScreen visible={chartVisible} onClose={closeChart} chartData={chartData} onImpulse={triggerImpulse} />
      <CoreChartScreen visible={coreVisible} onClose={closeCore} kundliData={kundliData} onImpulse={triggerImpulse} />
      <CompatibilityScreen visible={compatVisible} onClose={closeCompat} kundliData={kundliData} onImpulse={triggerImpulse} />
    </View>
  );
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const [splashAnimDone, setSplashAnimDone] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [hasSession, setHasSession] = useState(null);
  const [pickedLanguage, setPickedLanguage] = useState(null);
  const [refetching, setRefetching] = useState(false);
  const [birthData, setBirthData] = useState(null);
  const [kundliData, setKundliData] = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(null);

  const deviceLang = useMemo(() => Localization.getLocales()?.[0]?.languageCode || 'en', []);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          NotoSerif: require('./assets/fonts/NotoSerif-Regular.ttf'),
          PlayfairDisplay: require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
        });
      } catch (_) {}
      setFontsReady(true);
    })();

    initMediaCache().catch(() => {});

    (async () => {
      // DEV: force onboarding every launch. Restore for production:
      //   const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      //   if (done === '1') {
      //     const cached = await AsyncStorage.getItem(KUNDLI_KEY);
      //     if (cached) setKundliData(JSON.parse(cached));
      //   }
      //   setOnboardingDone(done === '1');
      await AsyncStorage.multiRemove([ONBOARDING_DONE_KEY, KUNDLI_KEY]);
      setOnboardingDone(false);
    })();

    // DEV: force fresh auth every launch.
    (async () => {
      try { await supabase.auth.signOut(); } catch (_) {}
      setHasSession(false);
    })();
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    const handleIncomingUrl = async ({ url }) => {
      if (!url) return;
      const frag = url.split('#')[1] || url.split('?')[1];
      if (!frag) return;
      const params = Object.fromEntries(new URLSearchParams(frag));
      if (params.access_token && params.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        } catch (e) {
          console.log('[auth/deeplink] setSession failed', e?.message || e);
        }
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleIncomingUrl({ url }); });
    const linkSub = Linking.addEventListener('url', handleIncomingUrl);

    let live = true;
    (async () => {
      const cached = await loadCachedBundle('auto');
      if (live && cached) setBundle(cached);
      const fresh = await fetchWithRetry(deviceLang);
      if (!live) return;
      setBundle(fresh);
      saveCachedBundle('auto', fresh);
    })();
    return () => {
      live = false;
      authSub?.subscription?.unsubscribe?.();
      linkSub?.remove?.();
    };
  }, [deviceLang]);

  const handleLanguagePick = useCallback(async (code) => {
    setPickedLanguage(code);
    setRefetching(true);

    const minDelay = new Promise((r) => setTimeout(r, TRANSITION_MIN_MS));

    const refetchTask = (async () => {
      if (!bundle || code === bundle.language) return;
      const cached = await loadCachedBundle(code);
      if (cached) {
        setBundle(cached);
        fetchWithRetry(code).then((fresh) => {
          setBundle(fresh);
          saveCachedBundle(code, fresh);
        }).catch(() => {});
        return;
      }
      try {
        const fresh = await fetchWithRetry(code);
        setBundle(fresh);
        saveCachedBundle(code, fresh);
      } catch (_) {}
    })();

    await Promise.all([refetchTask, minDelay]);
    setRefetching(false);
  }, [bundle]);

  const handleBirthBack = useCallback(() => {
    setPickedLanguage(null);
  }, []);

  const prepareApp = useCallback(async (birth) => {
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp?.user;
      const name = birth?.name
        || user?.user_metadata?.full_name
        || (user?.email || 'User').split('@')[0];
      const language = pickedLanguage || 'en';
      const gender = birth?.gender || null;

      if (user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              name,
              gender,
              language,
              birth_year:   parseInt(birth?.date?.year)       || null,
              birth_month:  parseInt(birth?.date?.monthIndex) || null,
              birth_day:    parseInt(birth?.date?.day)        || null,
              birth_hour:   parseInt(birth?.time?.hour)       || null,
              birth_minute: parseInt(birth?.time?.minute)     || null,
              birth_place:  birth?.place?.name || null,
              birth_lat:    birth?.place?.lat  || null,
              birth_lng:    birth?.place?.lng  || null,
              onboarded:    true,
            })
            .eq('id', user.id);
        } catch (e) {
          console.log('[prepareApp] profile save failed', e?.message || e);
        }
      }

      const userData = { name, language, gender };
      const result = await generateKundli(userData, birth);
      if (!result?.success) {
        console.log('[prepareApp] generateKundli failed', result?.error);
        return { kundli: null };
      }
      const kundli = result.data;

      let soulProfile = null;
      try {
        const r = await fetch(`${API_BASE}/soul-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kundli_data: kundli, language }),
        });
        const j = await r.json();
        if (j?.success) soulProfile = j.data;
      } catch (e) {
        console.log('[prepareApp] soul-profile failed', e?.message || e);
      }

      const enriched = { ...kundli, soulProfile };

      try { await AsyncStorage.setItem(KUNDLI_KEY, JSON.stringify(enriched)); } catch (_) {}
      if (user?.id) {
        try {
          await supabase
            .from('kundli_cache')
            .upsert({ user_id: user.id, data: enriched, language });
        } catch (e) {
          console.log('[prepareApp] kundli cache save failed', e?.message || e);
        }
      }

      return { kundli: enriched };
    } catch (e) {
      console.log('[prepareApp] error', e?.message || e);
      return { kundli: null };
    }
  }, [pickedLanguage]);

  const handleBirthComplete = useCallback(async (birth, prep) => {
    setBirthData(birth);
    if (prep?.kundli) setKundliData(prep.kundli);
    try { await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1'); } catch (_) {}
    setOnboardingDone(true);
  }, []);

  const bundleReady = bundle !== null;
  const gateReady = bundleReady && fontsReady && onboardingDone !== null && hasSession !== null;
  const showSplash = !splashAnimDone || !gateReady;

  let stage;
  if (showSplash) {
    stage = 'splash';
  } else if (!hasSession) {
    stage = 'auth';
  } else if (onboardingDone) {
    stage = 'home';
  } else if (!pickedLanguage) {
    stage = 'language';
  } else if (refetching) {
    stage = 'language_transition';
  } else if (!birthData) {
    stage = 'birth';
  } else {
    stage = 'home';
  }

  if (stage === 'splash') {
    return (
      <GestureHandlerRootView style={s.container}>
        <SplashScreen
          gateReady={gateReady}
          onComplete={() => setSplashAnimDone(true)}
        />
      </GestureHandlerRootView>
    );
  }

  if (stage === 'auth') {
    return (
      <GestureHandlerRootView style={s.container}>
        <StatusBar style="light" />
        <AuthGateScreen content={bundle?.screens?.auth} />
      </GestureHandlerRootView>
    );
  }

  if (stage === 'language') {
    return (
      <GestureHandlerRootView style={s.container}>
        <StatusBar style="light" />
        <LanguageSelectScreen bundle={bundle} onSelect={handleLanguagePick} />
      </GestureHandlerRootView>
    );
  }

  if (stage === 'language_transition') {
    return (
      <GestureHandlerRootView style={s.container}>
        <TransitionMedia mediaPath={bundle?.screens?.languageTransition?.mediaPath} />
      </GestureHandlerRootView>
    );
  }

  if (stage === 'birth') {
    return (
      <GestureHandlerRootView style={s.container}>
        <StatusBar style="light" />
        <BirthDetailsScreen
          content={bundle.screens.birth}
          loadingMediaPath={bundle?.screens?.loading?.mediaPath}
          onBack={handleBirthBack}
          onComplete={handleBirthComplete}
          prepareApp={prepareApp}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={s.container}>
      <HomeView kundliData={kundliData} />
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  topSpace: { height: SH * 0.42 },
  transition: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});