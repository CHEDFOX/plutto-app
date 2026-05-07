/**
 * FEATURE GRID — Asymmetric bento layout with decorative mini visuals.
 * 
 * Each system has a hand-crafted layout with varied width ratios,
 * heights, card types, and small decorative data visualizations.
 * Cards stagger-fade when system changes.
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

// ─── Mini Visualizations (decorative, no real data) ───
function MiniVis({ type, w, h }) {
  if (!type) return null;

  const visH = Math.min(h * 0.4, 28);

  switch (type) {
    case 'bars': {
      const count = 5 + Math.floor(w * 4);
      return (
        <View style={[vs.wrap, { height: visH }]}>
          {Array.from({ length: count }).map((_, i) => {
            const barH = 4 + Math.random() * (visH - 6);
            return (
              <View key={i} style={[vs.bar, {
                height: barH,
                width: 3,
                opacity: 0.06 + Math.random() * 0.08,
              }]} />
            );
          })}
        </View>
      );
    }

    case 'dots': {
      const count = 4 + Math.floor(w * 5);
      return (
        <View style={[vs.wrap, { height: visH, gap: 6 }]}>
          {Array.from({ length: count }).map((_, i) => {
            const size = 3 + Math.random() * 5;
            return (
              <View key={i} style={{
                width: size, height: size, borderRadius: size,
                backgroundColor: `rgba(255,255,255,${0.06 + Math.random() * 0.08})`,
              }} />
            );
          })}
        </View>
      );
    }

    case 'ring':
      return (
        <View style={[vs.wrap, { height: visH + 10, justifyContent: 'center' }]}>
          <View style={vs.ringOuter}>
            <View style={vs.ringInner} />
          </View>
        </View>
      );

    case 'line':
      return (
        <View style={[vs.wrap, { height: visH }]}>
          <View style={vs.line}>
            <View style={[vs.lineDot, { left: '15%' }]} />
            <View style={[vs.lineDot, { left: '45%' }]} />
            <View style={[vs.lineDot, { left: '72%' }]} />
          </View>
        </View>
      );

    case 'arc':
      return (
        <View style={[vs.wrap, { height: visH }]}>
          <View style={vs.arc} />
        </View>
      );

    case 'grid': {
      return (
        <View style={[vs.wrap, { height: visH, flexWrap: 'wrap', gap: 3 }]}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={{
              width: 5, height: 5, borderRadius: 1,
              backgroundColor: `rgba(255,255,255,${i % 3 === 0 ? 0.1 : 0.04})`,
            }} />
          ))}
        </View>
      );
    }

    default:
      return null;
  }
}

// ─── Feature Card ───
const FeatureCard = memo(function FeatureCard({ card, index, totalW, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 30 + index * 35,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [card.id]);

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  // Proper width: account for gaps between cards in the row
  const siblings = totalW > 0.99 ? Math.round(1 / Math.min(...[card.w])) : Math.round(totalW / card.w);
  const gapCount = Math.max(0, Math.round(1 / card.w) - 1);
  const totalGap = card.w >= 1 ? 0 : GAP * gapCount * card.w;
  const w = card.w * USABLE - totalGap;

  const isHero = card.type === 'hero';
  const isAccent = card.type === 'accent';
  const isTall = card.type === 'tall';
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
        {/* Card content */}
        <View style={s.cardContent}>
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
          {card.sub && (
            <Text style={s.cardSub} numberOfLines={2}>{card.sub}</Text>
          )}
        </View>

        {/* Decorative visualization */}
        <MiniVis type={card.vis} w={card.w} h={card.h} />
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
      toValue: 1,
      duration: 300,
      delay: index * 35,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [title]);

  return (
    <Animated.View style={[s.sectionWrap, { opacity: fadeAnim }]}>
      <View style={s.sectionLine} />
      <Text style={s.sectionLabel}>{title}</Text>
      <View style={s.sectionLine} />
    </Animated.View>
  );
}

// ─── Main ───
export default function FeatureGrid({ systemId = 'bphs', onFeaturePress }) {
  const layout = FEATURE_MAP[systemId] || FEATURE_MAP.bphs;
  let itemIndex = 0;

  return (
    <View style={s.container}>
      {layout.map((row, ri) => {
        // Section header
        if (row.section) {
          return (
            <SectionHeader
              key={`s-${ri}`}
              title={row.section}
              index={itemIndex++}
            />
          );
        }

        // Card row
        const totalW = row.cards.reduce((sum, c) => sum + c.w, 0);
        return (
          <View key={`r-${ri}`} style={s.row}>
            {row.cards.map((card) => (
              <FeatureCard
                key={card.id}
                card={card}
                index={itemIndex++}
                totalW={totalW}
                onPress={onFeaturePress}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

// ─── Visualization styles ───
const vs = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 'auto',
    paddingTop: 8,
  },
  bar: {
    backgroundColor: 'rgba(255,255,255,1)',
    borderRadius: 1,
  },
  ringOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  line: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
    position: 'relative',
  },
  lineDot: {
    position: 'absolute',
    top: -2.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  arc: {
    width: 40,
    height: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});

// ─── Card styles ───
const s = StyleSheet.create({
  container: {
    paddingHorizontal: PAD,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },

  // Section
  sectionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.1)',
    textTransform: 'uppercase',
  },

  // Card base
  card: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardHero: {
    backgroundColor: 'rgba(255,255,255,0.012)',
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAccent: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  cardMini: {
    padding: 12,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  // Content
  cardContent: {},
  cardTitle: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  cardTitleHero: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardTitleMini: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  cardSub: {
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.16)',
    marginTop: 4,
    lineHeight: 15,
  },
});