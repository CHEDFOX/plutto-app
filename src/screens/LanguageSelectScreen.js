import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import * as Localization from 'expo-localization';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Expanded greeting pool — covers most device languages a user could install with.
// The 6 supported app languages are still the only options at the bottom.
const GREETINGS = [
  // Core 6 (always in rotation)
  { text: 'नमस्ते', lang: 'hi' },
  { text: 'Hello', lang: 'en' },
  { text: '你好', lang: 'zh' },
  { text: 'Hola', lang: 'es' },
  { text: 'Olá', lang: 'pt' },
  { text: 'こんにちは', lang: 'ja' },

  // Indian regional (high-leverage for your market)
  { text: 'নমস্কার', lang: 'bn' },
  { text: 'வணக்கம்', lang: 'ta' },
  { text: 'నమస్కారం', lang: 'te' },
  { text: 'ನಮಸ್ಕಾರ', lang: 'kn' },
  { text: 'നമസ്കാരം', lang: 'ml' },
  { text: 'નમસ્તે', lang: 'gu' },
  { text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', lang: 'pa' },
  { text: 'नमस्कार', lang: 'mr' },
  { text: 'ନମସ୍କାର', lang: 'or' },
  { text: 'السلام علیکم', lang: 'ur' },

  // European
  { text: 'Bonjour', lang: 'fr' },
  { text: 'Hallo', lang: 'de' },
  { text: 'Ciao', lang: 'it' },
  { text: 'Hallo', lang: 'nl' },
  { text: 'Hej', lang: 'sv' },
  { text: 'Hei', lang: 'no' },
  { text: 'Hej', lang: 'da' },
  { text: 'Terve', lang: 'fi' },
  { text: 'Cześć', lang: 'pl' },
  { text: 'Ahoj', lang: 'cs' },
  { text: 'Γεια', lang: 'el' },
  { text: 'Привет', lang: 'ru' },
  { text: 'Привіт', lang: 'uk' },
  { text: 'Merhaba', lang: 'tr' },
  { text: 'Salut', lang: 'ro' },
  { text: 'Szia', lang: 'hu' },

  // Middle East / Africa
  { text: 'مرحبا', lang: 'ar' },
  { text: 'שלום', lang: 'he' },
  { text: 'سلام', lang: 'fa' },
  { text: 'Habari', lang: 'sw' },

  // East / Southeast Asia
  { text: '안녕하세요', lang: 'ko' },
  { text: 'Xin chào', lang: 'vi' },
  { text: 'สวัสดี', lang: 'th' },
  { text: 'Halo', lang: 'id' },
  { text: 'Helo', lang: 'ms' },
  { text: 'Kamusta', lang: 'tl' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
];

export default function LanguageSelectScreen({ onSelect }) {
  // Reorder greetings so the user's detected device language shows FIRST.
  // Falls back gracefully if their language isn't in the pool.
  const orderedGreetings = useMemo(() => {
    const deviceLang = Localization.getLocales()?.[0]?.languageCode || 'en';
    const matchIndex = GREETINGS.findIndex(g => g.lang === deviceLang);
    if (matchIndex === -1) return GREETINGS;
    return [GREETINGS[matchIndex], ...GREETINGS.filter((_, i) => i !== matchIndex)];
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const greetingFade = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(greetingFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prev => (prev + 1) % orderedGreetings.length);
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [orderedGreetings.length]);

  const handleSelect = (langCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSelect) onSelect(langCode);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Greeting */}
        <Animated.Text style={[styles.greeting, { opacity: greetingFade }]}>
          {orderedGreetings[currentIndex].text}
        </Animated.Text>

        {/* Language boxes */}
        <View style={styles.languageContainer}>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.langBox}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    fontSize: 52,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT * 0.28,
    letterSpacing: 0,
  },
  languageContainer: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  langBox: {
    width: 105,
    height: 52,
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.sm,
  },
  langText: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 0.5,
  },
});