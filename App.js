import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import ArcSelector from './src/components/ArcSelector';
import FeatureGrid from './src/components/FeatureGrid';
import FeatureScreen from './src/components/FeatureScreen';
import SystemInfoSheet from './src/components/SystemInfoSheet';
import Starfield from './src/components/Starfield';
import PlanetWheelScreen from './src/screens/PlanetWheelScreen';
import LifeStoryScreen from './src/screens/LifeStoryScreen';
import PastLifeScreen from './src/screens/PastLifeScreen';
import FourPillarsScreen from './src/screens/FourPillarsScreen';
import TodayScreen from './src/screens/TodayScreen';
import KPHouseClockScreen from './src/screens/KPHouseClockScreen';
import KPHoraryScreen from './src/screens/KPHoraryScreen';
import TheWordScreen from './src/screens/TheWordScreen';
import BluntSeerScreen from './src/screens/BluntSeerScreen';
import WesternPlanetWheelScreen from './src/screens/WesternPlanetWheelScreen';
import TimeScreen from './src/screens/TimeScreen';
import FiveElementsScreen from './src/screens/FiveElementsScreen';
import TheZooScreen from './src/screens/TheZooScreen';
import NameCorrectionScreen from './src/screens/NameCorrectionScreen';
import CoreNumbersScreen from './src/screens/CoreNumbersScreen';
import BusinessNameScreen from './src/screens/BusinessNameScreen';
import MobileNumberScreen from './src/screens/MobileNumberScreen';
import { featureCache } from './src/api/featureCache';

const KUNDLI = {
  raw: {
    birth_details: {
      year: 1976, month: 7, day: 28,
      hour: 9, minute: 30,
      latitude: 25.35, longitude: 74.64,
    },
  },
};

// Features that have dedicated screens (not generic FeatureScreen)
const CUSTOM_SCREENS = {
  'planet-strength': 'planets',
  'dasha-timeline': 'life-story',
  'past-life': 'past-life',
  'four-pillars': 'four-pillars',
  'daily-vibe': 'today',
  'kp-chart': 'kp-clock',
  'kp-event-promise': 'kp-horary',
  'todays-word': 'the-word',
  'blunt-seer': 'blunt-seer',
  'western-chart': 'western-planets',
  'western-daily-vibe': 'time',
  'chinese-element-balance': 'five-elements',
  'chinese-day-master': 'the-zoo',
  'num-name-analysis': 'name-correction',
  'num-chart': 'core-numbers',
  'num-biz-name': 'business-name',
  'num-mobile': 'mobile-number',
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeSystem, setActiveSystem] = useState('bphs');
  const [activeFeature, setActiveFeature] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showPlanets, setShowPlanets] = useState(false);
  const [showLifeStory, setShowLifeStory] = useState(false);
  const [showPastLife, setShowPastLife] = useState(false);
  const [showFourPillars, setShowFourPillars] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [showKPClock, setShowKPClock] = useState(false);
  const [showKPHorary, setShowKPHorary] = useState(false);
  const [showTheWord, setShowTheWord] = useState(false);
  const [showBluntSeer, setShowBluntSeer] = useState(false);
  const [showWesternPlanets, setShowWesternPlanets] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showFiveElements, setShowFiveElements] = useState(false);
  const [showTheZoo, setShowTheZoo] = useState(false);
  const [showNameCorrection, setShowNameCorrection] = useState(false);
  const [showCoreNumbers, setShowCoreNumbers] = useState(false);
  const [showBusinessName, setShowBusinessName] = useState(false);
  const [showMobileNumber, setShowMobileNumber] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = featureCache.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  useEffect(() => {
    Font.loadAsync({
      'NotoSerif': require('./assets/fonts/NotoSerif-Regular.ttf'),
      'PlayfairDisplay': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    }).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      featureCache.load(activeSystem, KUNDLI, 'en');
    }
  }, [fontsLoaded, activeSystem]);

  const handleSystemChange = useCallback((id) => {
    setActiveSystem(id);
  }, []);

  // Tap on active system name → show system info
  const handleActiveSystemPress = useCallback(() => {
    setShowSystemInfo(true);
  }, []);

  const handleFeaturePress = useCallback((featureId) => {
    // Route to custom screen if one exists
    const customScreen = CUSTOM_SCREENS[featureId];
    if (customScreen === 'planets') {
      setShowPlanets(true);
      return;
    }
    if (customScreen === 'life-story') {
      setShowLifeStory(true);
      return;
    }
    if (customScreen === 'past-life') {
      setShowPastLife(true);
      return;
    }
    if (customScreen === 'four-pillars') {
      setShowFourPillars(true);
      return;
    }
    if (customScreen === 'today') {
      setShowToday(true);
      return;
    }
    if (customScreen === 'kp-clock') {
      setShowKPClock(true);
      return;
    }
    if (customScreen === 'kp-horary') {
      setShowKPHorary(true);
      return;
    }
    if (customScreen === 'the-word') {
      setShowTheWord(true);
      return;
    }
    if (customScreen === 'blunt-seer') {
      setShowBluntSeer(true);
      return;
    }
    if (customScreen === 'western-planets') {
      setShowWesternPlanets(true);
      return;
    }
    if (customScreen === 'time') {
      setShowTime(true);
      return;
    }
    if (customScreen === 'five-elements') {
      setShowFiveElements(true);
      return;
    }
    if (customScreen === 'the-zoo') {
      setShowTheZoo(true);
      return;
    }
    if (customScreen === 'name-correction') {
      setShowNameCorrection(true);
      return;
    }
    if (customScreen === 'core-numbers') {
      setShowCoreNumbers(true);
      return;
    }
    if (customScreen === 'business-name') {
      setShowBusinessName(true);
      return;
    }
    if (customScreen === 'mobile-number') {
      setShowMobileNumber(true);
      return;
    }
    setActiveFeature(featureId);
  }, []);

  if (!fontsLoaded) {
    return <View style={s.loading}><StatusBar style="light" /></View>;
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <Starfield />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <ArcSelector
          activeSystem={activeSystem}
          onSystemChange={handleSystemChange}
          onActivePress={handleActiveSystemPress}
        />
        <View style={s.sep} />
        <FeatureGrid
          systemId={activeSystem}
          onFeaturePress={handleFeaturePress}
          kundliData={KUNDLI}
        />
        <View style={{ height: 80 }} />
      </ScrollView>

      <FeatureScreen
        featureId={activeFeature}
        visible={!!activeFeature && !CUSTOM_SCREENS[activeFeature]}
        onClose={() => setActiveFeature(null)}
      />

      <PlanetWheelScreen
        visible={showPlanets}
        onClose={() => setShowPlanets(false)}
        kundliData={KUNDLI}
      />

      <LifeStoryScreen
        visible={showLifeStory}
        onClose={() => setShowLifeStory(false)}
        kundliData={KUNDLI}
      />

      <PastLifeScreen
        visible={showPastLife}
        onClose={() => setShowPastLife(false)}
        kundliData={KUNDLI}
      />

      <FourPillarsScreen
        visible={showFourPillars}
        onClose={() => setShowFourPillars(false)}
        kundliData={KUNDLI}
      />

      <TodayScreen
        visible={showToday}
        onClose={() => setShowToday(false)}
        kundliData={KUNDLI}
      />

      <KPHouseClockScreen
        visible={showKPClock}
        onClose={() => setShowKPClock(false)}
        kundliData={KUNDLI}
      />

      <KPHoraryScreen
        visible={showKPHorary}
        onClose={() => setShowKPHorary(false)}
        kundliData={KUNDLI}
      />

      <TheWordScreen
        visible={showTheWord}
        onClose={() => setShowTheWord(false)}
        kundliData={KUNDLI}
      />

      <BluntSeerScreen
        visible={showBluntSeer}
        onClose={() => setShowBluntSeer(false)}
        kundliData={KUNDLI}
      />

      <WesternPlanetWheelScreen
        visible={showWesternPlanets}
        onClose={() => setShowWesternPlanets(false)}
        kundliData={KUNDLI}
      />

      <TimeScreen
        visible={showTime}
        onClose={() => setShowTime(false)}
        kundliData={KUNDLI}
      />

      <FiveElementsScreen
        visible={showFiveElements}
        onClose={() => setShowFiveElements(false)}
        kundliData={KUNDLI}
      />

      <TheZooScreen
        visible={showTheZoo}
        onClose={() => setShowTheZoo(false)}
        kundliData={KUNDLI}
      />

      <NameCorrectionScreen
        visible={showNameCorrection}
        onClose={() => setShowNameCorrection(false)}
        kundliData={KUNDLI}
      />

      <CoreNumbersScreen
        visible={showCoreNumbers}
        onClose={() => setShowCoreNumbers(false)}
        kundliData={KUNDLI}
      />

      <BusinessNameScreen
        visible={showBusinessName}
        onClose={() => setShowBusinessName(false)}
        kundliData={KUNDLI}
      />

      <MobileNumberScreen
        visible={showMobileNumber}
        onClose={() => setShowMobileNumber(false)}
        kundliData={KUNDLI}
      />

      <SystemInfoSheet
        systemId={activeSystem}
        visible={showSystemInfo}
        onClose={() => setShowSystemInfo(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  sep: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, marginTop: 10 },
});