import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing } from '../theme';
import { generateKundli, saveUser } from '../api/backend';
import * as Haptics from 'expo-haptics';
import { saveKundliData } from '../api/userService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

const CONTENT = {
  en: {
    generating: 'Reading The Stars...',
    mapping: 'Mapping Your Cosmic Blueprint...',
    calculating: 'Calculating Planetary Positions...',
    complete: 'Your Chart Is Ready',
    error: 'The Stars Are Unclear. Please Try Again.',
  },
  hi: {
    generating: 'नक्षत्रों को पढ़ा जा रहा है...',
    mapping: 'आपका ब्रह्मांडीय मानचित्र उभर रहा है...',
    calculating: 'ग्रहों की स्थिति तय हो रही है...',
    complete: 'आपकी कुंडली तैयार है',
    error: 'नक्षत्र स्पष्ट नहीं हैं। कृपया पुनः प्रयास करें।',
  },
  zh: {
    generating: '正在解读星象...',
    mapping: '你的命运蓝图正在展开...',
    calculating: '行星位置正在计算...',
    complete: '你的命盘已就绪',
    error: '星象不清晰，请重试。',
  },
  es: {
    generating: 'Leyendo los astros...',
    mapping: 'Tu mapa cósmico está tomando forma...',
    calculating: 'Calculando posiciones planetarias...',
    complete: 'Tu carta está lista',
    error: 'Los astros no están claros. Intenta de nuevo.',
  },
  pt: {
    generating: 'Lendo os astros...',
    mapping: 'Seu mapa cósmico está se formando...',
    calculating: 'Calculando posições planetárias...',
    complete: 'Seu mapa está pronto',
    error: 'Os astros não estão claros. Tente novamente.',
  },
  ja: {
    generating: '星を読み解いています...',
    mapping: 'あなたの宇宙の設計図が形になっています...',
    calculating: '惑星の位置を計算しています...',
    complete: 'あなたの星図が完成しました',
    error: '星がはっきりしません。もう一度お試しください。',
  },
};

const OrbitingDots = () => {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animate = () => {
      rotation.setValue(0);
      Animated.timing(rotation, { toValue: 1, duration: 3000, useNativeDriver: true }).start(() => animate());
    };
    animate();
  }, []);

  const dots = [0, 1, 2, 3, 4, 5];
  const radius = 40;

  return (
    <View style={styles.orbitContainer}>
      <View style={styles.centerDot} />
      {dots.map((_, index) => {
        const angle = (index / dots.length) * 2 * Math.PI;
        const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: [`${angle}rad`, `${angle + 2 * Math.PI}rad`] });
        return (
          <Animated.View key={index} style={[styles.orbitDot, { transform: [{ rotate }, { translateX: radius }] }]} />
        );
      })}
    </View>
  );
};

export default function KundliGenerationScreen({ onComplete, language = 'en', birthData, userData }) {
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);
  const [kundliData, setKundliData] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const content = CONTENT[language] || CONTENT.en;
  const latin = isLatinScript(language);
  const stages = [content.generating, content.mapping, content.calculating, content.complete];

  useEffect(() => { generateKundliData(); }, []);

  const generateKundliData = async () => {
    setTimeout(() => animateTextChange(() => setStage(1)), 1500);
    setTimeout(() => animateTextChange(() => setStage(2)), 3000);
    const result = await generateKundli(userData, birthData);
    if (result.success) {
      setKundliData(result.data);
      await saveKundliData(result.data);

      // Generate soul profile from Oracle
      let soulData = null;
      try {
        const soulRes = await fetch('https://api.plutto.space/api/public/soul-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kundli_data: result.data, language: language }),
        });
        const soulJson = await soulRes.json();
        if (soulJson.success) soulData = soulJson.data;
      } catch (e) { console.log('Soul profile fetch failed:', e); }

      const enrichedData = { ...result.data, soulProfile: soulData };

      setTimeout(() => { animateTextChange(() => setStage(3)); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 4500);
      setTimeout(() => { if (onComplete) onComplete(enrichedData); }, 6000);
    } else {
      setError(true);
      animateTextChange(() => setStage(-1));
    }
  };

  const animateTextChange = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.container}>
      <OrbitingDots />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center' },
  orbitContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl },
  centerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  orbitDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.white },
  statusText: { fontSize: 16, fontWeight: '200', color: colors.silver, letterSpacing: 0.8 },
});