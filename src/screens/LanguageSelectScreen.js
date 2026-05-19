import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import * as Localization from 'expo-localization';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { height: SH } = Dimensions.get('window');

const ARRIVAL_HOLD_MS = 2500;
const ARRIVAL_MOVE_MS = 1200;
const ROTATION_INTERVAL_MS = 2500;
const ROTATION_FADE_MS = 280;

const GREETING_CENTER_Y = SH * 0.40;
const GREETING_TOP_Y = SH * 0.10;
const LIST_TOP = SH * 0.36;
const LIST_BOTTOM = SH * 0.06;

function orderLanguages(list, deviceLang, deviceRegion) {
  if (!list?.length) return [];
  const matches = [];
  const cluster = [];
  const rest = [];
  list.forEach((l) => {
    if (l.code === deviceLang) matches.push(l);
    else if (deviceRegion && Array.isArray(l.regions) && l.regions.includes(deviceRegion)) cluster.push(l);
    else rest.push(l);
  });
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...matches, ...cluster, ...rest];
}

export default function LanguageSelectScreen({ bundle, onSelect }) {
  const [arrivalDone, setArrivalDone] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const deviceLang = useMemo(() => Localization.getLocales()?.[0]?.languageCode || 'en', []);
  const deviceRegion = useMemo(() => Localization.getLocales()?.[0]?.regionCode || '', []);

  const orderedLanguages = useMemo(
    () => orderLanguages(bundle?.languages, deviceLang, deviceRegion),
    [bundle, deviceLang, deviceRegion],
  );

  const arrival = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!orderedLanguages.length || arrivalDone) return;
    const t = setTimeout(() => {
      Animated.timing(arrival, {
        toValue: 1,
        duration: ARRIVAL_MOVE_MS,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => setArrivalDone(true));
    }, ARRIVAL_HOLD_MS);
    return () => clearTimeout(t);
  }, [orderedLanguages.length, arrivalDone]);

  const greetingFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(greetingFade, {
      toValue: 1,
      duration: ROTATION_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  useEffect(() => {
    if (!arrivalDone || orderedLanguages.length < 2) return;
    const interval = setInterval(() => {
      Animated.timing(greetingFade, {
        toValue: 0,
        duration: ROTATION_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setCurrentIndex((prev) => (prev + 1) % orderedLanguages.length);
        }
      });
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [arrivalDone, orderedLanguages.length]);

  const handleSelect = useCallback((langCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onSelect) onSelect(langCode);
  }, [onSelect]);

  if (!orderedLanguages.length) {
    return <View style={styles.container} />;
  }

  const greetingTranslateY = arrival.interpolate({
    inputRange: [0, 1],
    outputRange: [0, GREETING_TOP_Y - GREETING_CENTER_Y],
  });

  const listOpacity = arrival.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });

  const greeting = orderedLanguages[currentIndex]?.greeting || '';

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.greeting,
          {
            top: GREETING_CENTER_Y,
            opacity: greetingFade,
            transform: [{ translateY: greetingTranslateY }],
          },
        ]}
      >
        {greeting}
      </Animated.Text>

      <Animated.View
        style={[styles.listContainer, { opacity: listOpacity }]}
        pointerEvents={arrivalDone ? 'auto' : 'none'}
      >
        <ScrollView
          contentContainerStyle={styles.listGrid}
          showsVerticalScrollIndicator={false}
        >
          {orderedLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.langBox}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.langText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  greeting: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 52,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0,
  },
  listContainer: {
    position: 'absolute',
    top: LIST_TOP,
    bottom: LIST_BOTTOM,
    left: spacing.lg,
    right: spacing.lg,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
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