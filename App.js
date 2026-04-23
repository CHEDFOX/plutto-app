import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform, ScrollView, Dimensions, Text, TextInput, Animated, Keyboard } from 'react-native';
import { supabase } from './src/api/supabase';
import { getUserProfile } from './src/api/userService';
import { colors } from './src/theme';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Font from 'expo-font';

import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import AuthScreen from './src/screens/AuthScreen';
import BirthDetailsScreen from './src/screens/BirthDetailsScreen';
import KundliGenerationScreen from './src/screens/KundliGenerationScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import DailyRitualScreen from './src/screens/DailyRitualScreen';
import HomeScreen from './src/screens/HomeScreen';
import KundliMatchScreen from './src/screens/KundliMatchScreen';
import FeatureScreen from './src/screens/feature/FeatureScreen';
import FeatureSkyScreen from './src/screens/FeatureSkyScreen';
import AnotherSkyScreen from './src/screens/AnotherSkyScreen';
import CosmicBondScreen from './src/screens/CosmicBondScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Font families mapping
const FONT_FAMILIES = {
  sans: undefined, // system default
  serif: 'NotoSerif',
  classic: 'PlayfairDisplay',
};

// ─── Lock Screen ───
const LOCK_ELEMENTS = ['◇', '○', '△', '∼', '☆'];
const LOCK_FILLED =   ['◆', '●', '▲', '≈', '★'];

function LockScreen({ storedPasscode, onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const handleChange = (val) => {
    if (val.length > 5) return;
    setInput(val);
    setError(false);
    if (val.length === 5) {
      setTimeout(() => {
        if (val === storedPasscode) {
          onUnlock();
        } else {
          setError(true);
          setInput('');
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();
        }
      }, 100);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar style="light" />
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '300', letterSpacing: 3, marginBottom: 40, textTransform: 'lowercase' }}>sacred key</Text>
      <Animated.View style={{ flexDirection: 'row', gap: 16, transform: [{ translateX: shakeAnim }] }}>
        {LOCK_ELEMENTS.map((el, i) => (
          <View key={i} style={{ width: 40, height: 48, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: input.length > i ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)' }}>
            <Text style={{ fontSize: 22, color: input.length > i ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}>
              {input.length > i ? LOCK_FILLED[i] : el}
            </Text>
          </View>
        ))}
      </Animated.View>
      {error && <Text style={{ color: 'rgba(255,100,100,0.6)', fontSize: 11, marginTop: 20, letterSpacing: 1 }}>wrong key</Text>}
      <TextInput ref={inputRef} style={{ position: 'absolute', opacity: 0, height: 0 }} value={input} onChangeText={handleChange} keyboardType="number-pad" maxLength={5} autoFocus />
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [birthData, setBirthData] = useState(null);
  const [kundliData, setKundliData] = useState(null);
  const [showDailyRitual, setShowDailyRitual] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [typography, setTypography] = useState('classic');
  const [locked, setLocked] = useState(null); // null=checking, true=locked, false=unlocked
  const [storedPasscode, setStoredPasscode] = useState(null);
  const [homeTab, setHomeTab] = useState('chat');
  const swipeRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Block swipe on features tab and voice chat
const swipeEnabled = homeTab === 'chat';
  const handleSwipeEnd = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const returnToCenter = () => {
    swipeRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
    setCurrentPage(1);
  };

  // Load fonts + saved preferences
  useEffect(() => {
    const init = async () => {
      try {
        await Font.loadAsync({
          'NotoSerif': require('./assets/fonts/NotoSerif-Regular.ttf'),
          'PlayfairDisplay': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
        });
      } catch (e) {
        console.log('Font loading failed:', e);
      }
      setFontsLoaded(true);

      try {
        const savedLang = await SecureStore.getItemAsync('user_language');
        if (savedLang) setLanguage(savedLang);
        const savedTypo = await SecureStore.getItemAsync('user_typography');
        if (savedTypo) setTypography(savedTypo);
      } catch (e) {}
    };
    init();
  }, []);

  // Auth state
  useEffect(() => {
    if (!fontsLoaded) return;
    checkAuthState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) await handleSignedInUser(session.user);
      else if (event === 'SIGNED_OUT') resetToStart();
    });
    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await handleSignedInUser(session.user);
      else setScreen('splash');
    } catch (e) { setScreen('splash'); }
  };

  const handleSignedInUser = async (authUser) => {
    try {
      const result = await getUserProfile();
      if (result.success && result.data) {
        const p = result.data;
        setUser({ id: authUser.id, email: authUser.email, name: p.name });
        if (p.kundli_data) {
          setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } });
          setKundliData(p.kundli_data);
          // Check if passcode lock is set
          const pc = await SecureStore.getItemAsync('app_passcode');
          if (pc) { setStoredPasscode(pc); setLocked(true); } else { setLocked(false); }
          setScreen('home');
        }
        else if (p.birth_date) { setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } }); setScreen('kundli'); }
        else if (p.name) setScreen('birth');
        else setScreen('language');
      } else setScreen('language');
    } catch (e) { setScreen('splash'); }
  };

  // Push notifications
  useEffect(() => {
    if (kundliData && user) registerPushNotifications();
  }, [kundliData, user]);

  const registerPushNotifications = async () => {
    try {
      if (!Device.isDevice) return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;
      const raw = kundliData?.raw || {};
      const bd = raw.birth_details || {};

      await fetch('https://api.plutto.space/api/public/register-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || user?.name || 'unknown',
          push_token: pushToken,
          birth_details: { year: bd.year, month: bd.month, day: bd.day, hour: bd.hour, minute: bd.minute, latitude: bd.latitude, longitude: bd.longitude },
          language: language,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily', {
          name: 'Daily Insights',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
    } catch (e) { console.log('Push registration failed:', e); }
  };

  const resetToStart = () => { setUser(null); setBirthData(null); setKundliData(null); setScreen('language'); };
  const handleLogout = async () => { await supabase.auth.signOut(); resetToStart(); };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    await SecureStore.setItemAsync('user_language', lang);
  };

  const handleTypographyChange = async (typo) => {
    setTypography(typo);
    await SecureStore.setItemAsync('user_typography', typo);
  };

  const handleNavigate = (target) => setScreen(target);
  const handleBack = () => { setScreen('home'); setShowDailyRitual(false); };

  // Get current font family
  const fontFamily = FONT_FAMILIES[typography];

  if (!fontsLoaded || screen === 'loading') return <View style={{ flex: 1, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center' }}><StatusBar style="light" /><ActivityIndicator size="large" color={colors.white} /></View>;
  if (screen === 'splash') return <><StatusBar style="light" /><SplashScreen onComplete={() => setScreen('language')} /></>;
  if (screen === 'language') return <><StatusBar style="light" /><LanguageSelectScreen onSelect={async (lang) => { setLanguage(lang); await SecureStore.setItemAsync('user_language', lang); setScreen('auth'); }} /></>;
  if (screen === 'auth') return <><StatusBar style="light" /><AuthScreen language={language} onBack={() => setScreen('language')} onComplete={async (ud) => {
    setUser(ud);
    // Check if existing user with full data
    try {
      const { getUserProfile } = require('./src/api/userService');
      const result = await getUserProfile();
      if (result?.success && result?.data) {
        const p = result.data;
        if (p.kundli_data) {
          setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } });
          setKundliData(p.kundli_data);
          const pc = await SecureStore.getItemAsync('app_passcode');
          if (pc) { setStoredPasscode(pc); setLocked(true); } else { setLocked(false); }
          setScreen('home');
          return;
        }
        if (p.birth_date) {
          setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } });
          setScreen('kundli');
          return;
        }
      }
    } catch (e) { /* new user */ }
    setScreen('birth');
  }} /></>;
  if (screen === 'birth') return <><StatusBar style="light" /><BirthDetailsScreen language={language} onBack={() => setScreen('auth')} onComplete={(d) => { setBirthData(d); setScreen('kundli'); }} /></>;
  if (screen === 'kundli') return <><StatusBar style="light" /><KundliGenerationScreen language={language} birthData={birthData} userData={user} onComplete={(d) => { setKundliData(d); setScreen('welcome'); }} /></>;
if (screen === 'welcome') { setIsNewUser(false); setShowDailyRitual(false); setLocked(false); setScreen('home'); return null; }  // DailyRitualScreen intentionally disabled after onboarding — WelcomeScreen handles the greeting.
  // Keep it available only if explicitly triggered (e.g., return visits, which we're not doing now).
  if (screen === 'match') return <><StatusBar style="light" /><KundliMatchScreen kundliData={kundliData} language={language} onBack={handleBack} /></>;

  // ─── FEATURE SKY — the new cosmic entry into all features ───
  if (screen === 'features') return <><StatusBar style="light" /><FeatureSkyScreen kundliData={kundliData} language={language} onBack={handleBack} /></>;

  // ─── INDIVIDUAL FEATURE SCREENS (direct deep-link access) ───
  const FEATURE_IDS = [
    'daily-vibe', 'power-hours', 'planet-strength', 'festivals',
    'cosmic-match', 'ideal-partner', 'match-oracle', 'relationship-xray',
    'soul-profile', 'rare-traits', 'cosmic-novel', 'personal-deities',
    'money-calendar', 'gemstone-profile', 'year-map', 'danger-radar',
    'what-if', 'find-muhurta', 'past-event', 'family-karma',
  ];
  if (FEATURE_IDS.includes(screen)) {
    return <><StatusBar style="light" /><FeatureScreen featureId={screen} kundliData={kundliData} language={language} onBack={handleBack} /></>;
  }

  // Lock screen — if passcode is set, show lock before main app
  if (locked === true && storedPasscode) {
    return <LockScreen storedPasscode={storedPasscode} onUnlock={() => setLocked(false)} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        ref={swipeRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
        scrollEventThrottle={16}
        scrollEnabled={swipeEnabled}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        onMomentumScrollEnd={handleSwipeEnd}
        style={{ flex: 1, backgroundColor: '#000' }}
      >
        {/* Page 0 (left) — Cosmic Bond — reached by right swipe from center */}
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          <CosmicBondScreen kundliData={kundliData} language={language} fontFamily={fontFamily} onReturnToCenter={returnToCenter} isVisible={currentPage === 0} />
        </View>

        {/* Page 1 (center) — Main Chat */}
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          <HomeScreen language={language} userData={user} birthData={birthData} kundliData={kundliData} onLogout={handleLogout} onLanguageChange={handleLanguageChange} onNavigate={handleNavigate} chatMessages={chatMessages} onMessagesChange={setChatMessages} fontFamily={fontFamily} typography={typography} onTypographyChange={handleTypographyChange} onTabChange={setHomeTab} />
        </View>

        {/* Page 2 (right) — Another Sky — reached by left swipe from center */}
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          <AnotherSkyScreen kundliData={kundliData} language={language} fontFamily={fontFamily} onReturnToCenter={returnToCenter} isVisible={currentPage === 2} />
        </View>
      </ScrollView>
    </>
  );
}