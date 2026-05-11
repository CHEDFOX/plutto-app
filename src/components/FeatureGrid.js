/**
 * FEATURE GRID — Clean bento layout.
 * No subtitles. Bright borders. Clean section headers.
 */

import React, { useEffect, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { FEATURE_MAP } from '../data/features';

const { width: SW } = Dimensions.get('window');
const PAD = 14;
const GAP = 8;
const USABLE = SW - PAD * 2;

// ─── Feature Card ───
const FeatureCard = memo(function FeatureCard({ card, index, totalW, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, delay: 30 + index * 35,
      easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true,
    }).start();
  }, [card.id]);

  const translateY = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  const gapCount = Math.max(0, Math.round(1 / card.w) - 1);
  const totalGap = card.w >= 1 ? 0 : GAP * gapCount * card.w;
  const w = card.w * USABLE - totalGap;

  const isHero = card.type === 'hero';
  const isAccent = card.type === 'accent';
  const isMini = card.type === 'mini';

  return (
    <Animated.View style={{ width: w, opacity: fadeAnim, transform: [{ translateY }] }}>
      <TouchableOpacity
        activeOpacity={0.65}
        onPress={() => onPress && onPress(card.id)}
        style={[
          s.card,
          { minHeight: card.h },
          isHero && s.cardHero,
          isAccent && s.cardAccent,
          isMini && s.cardMini,
        ]}
      >
        <Text
          style={[
            s.cardTitle,
            isHero && s.cardTitleHero,
            isMini && s.cardTitleMini,
          ]}
          numberOfLines={1}
        >
          {card.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Section Header ───
function SectionHeader({ title, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, delay: index * 35,
      easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true,
    }).start();
  }, [title]);

  return (
    <Animated.View style={[s.sectionWrap, { opacity: fadeAnim }]}>
      <Text style={s.sectionLabel}>{title}</Text>
    </Animated.View>
  );
}

// ─── Main ───
export default function FeatureGrid({ systemId = 'bphs', onFeaturePress, kundliData }) {
  const layout = FEATURE_MAP[systemId] || FEATURE_MAP.bphs;
  let itemIndex = 0;
  let sectionCount = 0;

  return (
    <View style={s.container}>
      {layout.map((row, ri) => {
        if (row.section) {
          sectionCount++;
          const elements = [
            <SectionHeader key={`s-${ri}`} title={row.section} index={itemIndex++} />
          ];
          if (sectionCount === 2) {
          // DailyFeed slot reserved
        }
          return elements;
        }

        const totalW = row.cards.reduce((sum, c) => sum + c.w, 0);
        return (
          <View key={`r-${ri}`} style={s.row}>
            {row.cards.map((card) => (
              <FeatureCard key={card.id} card={card} index={itemIndex++} totalW={totalW} onPress={onFeaturePress} />
            ))}
          </View>
        );
      })}

    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: PAD, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: GAP, marginBottom: GAP },

  // Section — just text, no lines, no box
  sectionWrap: { paddingVertical: 18, alignItems: 'center' },
  sectionLabel: { fontSize: 9, fontWeight: '400', letterSpacing: 3, color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase' },

  // Card
  card: {
    flex: 1, borderWidth: 0.5, borderRadius: 12, padding: 16,
    justifyContent: 'center', overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHero: {
    backgroundColor: 'rgba(255,255,255,0.012)',
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 20, alignItems: 'center', justifyContent: 'center',
  },
  cardAccent: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardMini: {
    padding: 12, borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Title only — no subtitle
  cardTitle: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },
  cardTitleHero: { fontSize: 16, fontFamily: 'PlayfairDisplay', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5, textAlign: 'center' },
  cardTitleMini: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
});