/**
 * PAST LIFE SCREEN
 * 
 * Cinematic scroll story:
 * Segment 1 fades in → scroll → Segment 2 → scroll → IMAGE → scroll → Segment 4 → Segment 5
 * Each segment is 2-3 lines that fade in as you scroll into view.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

// ─── Fade-in Segment ───
function StorySegment({ text, index, scrollY, offsetY }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const [revealed, setRevealed] = useState(false);

  // Trigger reveal based on scroll position
  useEffect(() => {
    if (!text) return;
    const listenerId = scrollY.addListener(({ value }) => {
      // Reveal when scroll reaches this segment's zone
      const trigger = offsetY - SH * 0.55;
      if (value >= trigger && !revealed) {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 900,
            easing: Easing.bezier(0, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [text, revealed, offsetY]);

  // First segment auto-reveals
  useEffect(() => {
    if (index === 0 && text && !revealed) {
      setTimeout(() => {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 1200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        ]).start();
      }, 600);
    }
  }, [index, text]);

  if (!text) return null;

  // Split into lines for line-by-line display
  const lines = text.split('\n').filter(l => l.trim());

  return (
    <Animated.View
      style={[
        ps.segment,
        { opacity, transform: [{ translateY }] },
        index === 0 && ps.segmentFirst,
      ]}
    >
      {lines.map((line, i) => (
        <Text key={i} style={ps.line}>{line}</Text>
      ))}
    </Animated.View>
  );
}

// ─── Image Break (between segment 2 and 4) ───
function ImageBreak({ scrollY, offsetY, ketu }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const trigger = offsetY - SH * 0.5;
      if (value >= trigger && !revealed) {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        ]).start();
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [revealed, offsetY]);

  return (
    <Animated.View style={[ps.imageBreak, { opacity, transform: [{ scale }] }]}>
      {/* Decorative scene visualization — replace with real image later */}
      <View style={ps.sceneBox}>
        <View style={ps.sceneLine} />
        <Text style={ps.sceneGlyph}>☋</Text>
        <Text style={ps.sceneRole}>{ketu?.role || 'a soul in passage'}</Text>
        <Text style={ps.sceneWorld}>{ketu?.world || 'an ancient world'}</Text>
        <View style={ps.sceneLine} />
      </View>
    </Animated.View>
  );
}

// ─── Main Component ───
export default function PastLifeScreen({ visible, onClose, kundliData }) {
  const [segments, setSegments] = useState([]);
  const [pastData, setPastData] = useState(null);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Segment Y offsets for scroll-triggered reveals
  const segmentOffsets = [0, 220, 440, 600, 820];

  useEffect(() => {
    if (visible) {
      setSegments([]);
      setPastData(null);
      scrollY.setValue(0);
      fetchPastLife();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchPastLife = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/past-life`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setSegments(data.segments || []);
      setPastData(data.past_life_data || null);
    } catch (e) {
      console.log('Past life error:', e);
    }
    setLoading(false);
  }, [kundliData]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handleWrap}><View style={s.handle} /></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.loadCenter}>
            <ActivityIndicator color={GOLD} size="small" />
            <Text style={s.loadText}>Reaching into the past...</Text>
          </View>
        ) : segments.length > 0 ? (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            {/* Title */}
            <View style={ps.titleZone}>
              <Text style={ps.overtitle}>IN ANOTHER TIME</Text>
              <Text style={ps.title}>Your Past Life</Text>
              <View style={ps.titleLine} />
            </View>

            {/* Ketu badge */}
            {pastData?.ketu && (
              <View style={ps.ketuBadge}>
                <Text style={ps.ketuLabel}>KETU IN {(pastData.ketu.sign || '').toUpperCase()} · HOUSE {pastData.ketu.house}</Text>
              </View>
            )}

            {/* Segment 1 — The scene */}
            <StorySegment
              text={segments[0]}
              index={0}
              scrollY={scrollY}
              offsetY={segmentOffsets[0]}
            />

            {/* Spacer */}
            <View style={ps.spacer} />

            {/* Segment 2 — Who they were */}
            <StorySegment
              text={segments[1]}
              index={1}
              scrollY={scrollY}
              offsetY={segmentOffsets[1]}
            />

            {/* Spacer */}
            <View style={ps.spacerLarge} />

            {/* IMAGE BREAK — The peak / visual scene */}
            <ImageBreak
              scrollY={scrollY}
              offsetY={segmentOffsets[2]}
              ketu={pastData?.ketu}
            />

            {/* Segment 3 — The peak (text companion to image) */}
            <StorySegment
              text={segments[2]}
              index={2}
              scrollY={scrollY}
              offsetY={segmentOffsets[2]}
            />

            {/* Spacer */}
            <View style={ps.spacerLarge} />

            {/* Segment 4 — The fall */}
            <StorySegment
              text={segments[3]}
              index={3}
              scrollY={scrollY}
              offsetY={segmentOffsets[3]}
            />

            {/* Spacer */}
            <View style={ps.spacer} />

            {/* Segment 5 — The thread to now */}
            <StorySegment
              text={segments[4]}
              index={4}
              scrollY={scrollY}
              offsetY={segmentOffsets[4]}
            />

            {/* Karmic debt footer */}
            {pastData?.saturn?.karmic_debt && (
              <View style={ps.debtBox}>
                <View style={ps.debtLine} />
                <Text style={ps.debtLabel}>KARMIC THREAD</Text>
                <Text style={ps.debtText}>{pastData.saturn.karmic_debt}</Text>
              </View>
            )}

            {/* Rahu craving */}
            {pastData?.rahu?.craving && (
              <View style={ps.cravingBox}>
                <Text style={ps.cravingLabel}>WHAT YOUR SOUL SEEKS NOW</Text>
                <Text style={ps.cravingText}>{pastData.rahu.craving}</Text>
                <Text style={ps.cravingSign}>Rahu in {pastData.rahu.sign} · House {pastData.rahu.house}</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </Animated.ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
}

// ─── Past life story styles ───
const ps = StyleSheet.create({
  titleZone: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  overtitle: {
    fontSize: 9,
    color: W(0.12),
    letterSpacing: 4,
    fontWeight: '500',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    color: W(0.85),
    letterSpacing: 0.5,
  },
  titleLine: {
    width: 40,
    height: 0.5,
    backgroundColor: GOLD,
    opacity: 0.3,
    marginTop: 16,
  },

  ketuBadge: {
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: W(0.06),
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 30,
  },
  ketuLabel: {
    fontSize: 9,
    color: W(0.2),
    letterSpacing: 2.5,
    fontWeight: '500',
  },

  // Story segments
  segment: {
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  segmentFirst: {
    marginTop: 10,
  },
  line: {
    fontSize: 17,
    color: W(0.8),
    lineHeight: 30,
    fontWeight: '300',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay',
  },

  // Spacers
  spacer: { height: 60 },
  spacerLarge: { height: 90 },

  // Image break
  imageBreak: {
    alignItems: 'center',
    marginVertical: 10,
  },
  sceneBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
    gap: 14,
  },
  sceneLine: {
    width: 30,
    height: 0.5,
    backgroundColor: W(0.06),
  },
  sceneGlyph: {
    fontSize: 50,
    color: W(0.08),
    fontWeight: '200',
  },
  sceneRole: {
    fontSize: 14,
    color: GOLD,
    letterSpacing: 2,
    fontWeight: '300',
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.6,
  },
  sceneWorld: {
    fontSize: 12,
    color: W(0.25),
    letterSpacing: 1.5,
    fontWeight: '300',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Karmic debt
  debtBox: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
    gap: 12,
  },
  debtLine: {
    width: 20,
    height: 0.5,
    backgroundColor: W(0.06),
  },
  debtLabel: {
    fontSize: 8,
    color: W(0.1),
    letterSpacing: 3,
    fontWeight: '600',
  },
  debtText: {
    fontSize: 14,
    color: W(0.45),
    lineHeight: 22,
    fontWeight: '300',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Rahu craving
  cravingBox: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    paddingBottom: 20,
    gap: 10,
  },
  cravingLabel: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 3,
    fontWeight: '600',
    opacity: 0.4,
  },
  cravingText: {
    fontSize: 15,
    color: W(0.6),
    lineHeight: 24,
    fontWeight: '300',
    textAlign: 'center',
  },
  cravingSign: {
    fontSize: 10,
    color: W(0.15),
    letterSpacing: 1.5,
    fontWeight: '400',
    marginTop: 4,
  },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#040404', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.06),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.1) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.25), fontWeight: '300' },
  scrollContent: { paddingBottom: 40 },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5, fontWeight: '300' },
});
