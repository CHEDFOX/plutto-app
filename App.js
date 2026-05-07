import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import ArcSelector from './src/components/ArcSelector';
import FeatureGrid from './src/components/FeatureGrid';
import FeatureScreen from './src/components/FeatureScreen';
import SystemInfoSheet from './src/components/SystemInfoSheet';
import Starfield from './src/components/Starfield';
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

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeSystem, setActiveSystem] = useState('bphs');
  const [activeFeature, setActiveFeature] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
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
        />
        <View style={{ height: 80 }} />
      </ScrollView>

      <FeatureScreen
        featureId={activeFeature}
        visible={!!activeFeature}
        onClose={() => setActiveFeature(null)}
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