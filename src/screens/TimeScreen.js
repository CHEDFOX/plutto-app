/**
 * TIME SCREEN
 * 
 * Three continuous readings: Today → Week → Month.
 * Each fades in as you scroll. Image spaces at random positions.
 * Clean, flowing, no heavy structure.
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

const SEGMENT_LABELS = ['today', 'this week', 'this month'];
const SEGMENT_OPACITIES = [0.2, 0.12, 0.08];

// Image positions — different per segment
const IMG_CONFIGS = [
  { align: 'flex-end', width: 65, height: 65, radius: 10, mt: 14 },
  { align: 'flex-start', width: 70, height: 55, radius: 8, mt: 10 },
  { align: 'flex-end', width: 60, height: 70, radius: 12, mt: 16 },
];


// ─── Single Time Segment ───
function TimeSegment({ label, reading, meta, index, scrollY, imgConfig }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(25)).current;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!reading) return;
    const trigger = index * 200;
    const listenerId = scrollY.addListener(({ value }) => {
      if (value >= trigger && !revealed) {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 800 + index * 200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 800 + index * 200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        ]).start();
      }
    });
    // Auto-reveal first segment
    if (index === 0 && reading) {
      setTimeout(() => {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]).start();
      }, 400);
    }
    return () => scrollY.removeListener(listenerId);
  }, [reading, revealed, index]);

  if (!reading) return null;

  return (
    <Animated.View style={[ts.segment, { opacity, transform: [{ translateY }] }]}>
      {/* Faint label */}
      <Text style={[ts.label, { opacity: SEGMENT_OPACITIES[index] }]}>{label}</Text>

      {/* Meta line */}
      {meta && <Text style={ts.meta}>{meta}</Text>}

      {/* Reading text */}
      <Text style={ts.reading}>{reading}</Text>

      {/* Image zone — varied position */}
      <View style={[ts.imgZone, { alignSelf: imgConfig.align, marginTop: imgConfig.mt }]}>
        <View style={[ts.imgPlaceholder, { width: imgConfig.width, height: imgConfig.height, borderRadius: imgConfig.radius }]} />
      </View>

      {/* Divider (not on last) */}
      {index < 2 && <View style={ts.divider} />}
    </Animated.View>
  );
}


// ─── Main Component ───
export default function TimeScreen({ visible, onClose, kundliData }) {
  const [timeData, setTimeData] = useState(null);
  const [readings, setReadings] = useState({ today: '', week: '', month: '' });
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setTimeData(null);
      setReadings({ today: '', week: '', month: '' });
      scrollY.setValue(0);
      fetchTime();
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

  const fetchTime = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/time-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setTimeData(data.time_data || null);
      setReadings({
        today: data.today_reading || '',
        week: data.week_reading || '',
        month: data.month_reading || '',
      });
    } catch (e) {
      console.log('Time reading error:', e);
    }
    setLoading(false);
  }, [kundliData]);

  if (!visible) return null;

  const today = timeData?.today || {};
  const week = timeData?.week || {};
  const month = timeData?.month || {};

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
            <ActivityIndicator color={W(0.15)} size="small" />
          </View>
        ) : readings.today ? (
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
            {/* Today */}
            <TimeSegment
              label="today"
              reading={readings.today}
              meta={`${today.date || ''} · ${today.day_lord || ''} day · Moon in ${today.moon_sign || ''}`}
              index={0}
              scrollY={scrollY}
              imgConfig={IMG_CONFIGS[0]}
            />

            {/* This Week */}
            <TimeSegment
              label="this week"
              reading={readings.week}
              meta={week.range || ''}
              index={1}
              scrollY={scrollY}
              imgConfig={IMG_CONFIGS[1]}
            />

            {/* This Month */}
            <TimeSegment
              label="this month"
              reading={readings.month}
              meta={`${month.name || ''} · ${month.days_left || 0} days left`}
              index={2}
              scrollY={scrollY}
              imgConfig={IMG_CONFIGS[2]}
            />

            {/* Dasha at bottom — faint gold */}
            {month.dasha && (
              <View style={ts.dashaWrap}>
                <Text style={ts.dashaText}>{month.dasha}</Text>
              </View>
            )}

            <View style={{ height: 80 }} />
          </Animated.ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
}


// ─── Segment styles ───
const ts = StyleSheet.create({
  segment: {
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 10,
  },
  label: {
    fontSize: 11,
    color: W(1),
    letterSpacing: 4,
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  meta: {
    fontSize: 11,
    color: W(0.12),
    letterSpacing: 0.5,
    fontWeight: '300',
    marginBottom: 16,
  },
  reading: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 17,
    color: W(0.8),
    lineHeight: 28,
  },
  divider: {
    width: 20,
    height: 0.5,
    backgroundColor: W(0.04),
    marginTop: 28,
    alignSelf: 'center',
  },

  // Image zone
  imgZone: {
    marginTop: 12,
    marginBottom: 4,
  },
  imgPlaceholder: {
    borderWidth: 0.5,
    borderColor: W(0.02),
    backgroundColor: W(0.005),
  },

  // Dasha
  dashaWrap: {
    alignItems: 'center',
    paddingTop: 30,
  },
  dashaText: {
    fontSize: 10,
    color: GOLD,
    opacity: 0.2,
    letterSpacing: 1.5,
    fontWeight: '400',
  },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.9,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  scrollContent: { paddingTop: 10, paddingBottom: 40 },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
