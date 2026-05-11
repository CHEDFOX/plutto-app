/**
 * TODAY SCREEN
 * 
 * Simple, clean. No headings inside.
 * Just the reading text + subtle day data + image space at bottom.
 * Gold used only for truly important highlights.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';


export default function TodayScreen({ visible, onClose, kundliData }) {
  const [today, setToday] = useState(null);
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setToday(null);
      setReading('');
      textOpacity.setValue(0);
      fetchToday();
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

  // Fade in reading text after load
  useEffect(() => {
    if (reading) {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [reading]);

  const [debugInfo, setDebugInfo] = useState('waiting...');

  const fetchToday = useCallback(async () => {
    setLoading(true);
    setDebugInfo('fetching...');
    try {
      const r = await fetch(`${API_BASE}/today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      setDebugInfo('status: ' + r.status);
      const data = await r.json();
      setDebugInfo('s:' + r.status + ' | keys: ' + Object.keys(data).join(',') + ' | ' + JSON.stringify(data.detail).substring(0, 300));
      setToday(data.today || null);
      setReading(data.reading || '');
    } catch (e) {
      setDebugInfo('ERROR: ' + e.message);
      console.log('Today error:', e);
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

        <Text style={{color:'yellow',fontSize:12,padding:10,backgroundColor:'rgba(255,0,0,0.2)'}}>{debugInfo}</Text>

        {loading ? (
          <View style={s.loadCenter}>
            <ActivityIndicator color={W(0.2)} size="small" />
          </View>
        ) : today ? (
          <View style={t.content}>
            {/* Date — very subtle */}
            <Text style={t.date}>{today.date}</Text>

            {/* Day context — single quiet line */}
            <Text style={t.context}>
              {today.day_lord} day · Moon in {today.moon_transit}
              {today.retro_planets?.length > 0 ? ` · ${today.retro_planets.join(', ')} retrograde` : ''}
            </Text>

            {/* The reading — the main content, no heading */}
            <Animated.View style={[t.readingWrap, { opacity: textOpacity }]}>
              <Text style={t.reading}>{reading}</Text>
            </Animated.View>

            {/* Panchanga line — very subtle */}
            {today.tithi ? (
              <Text style={t.panchanga}>
                {today.tithi}{today.paksha ? ` · ${today.paksha}` : ''}
                {today.yoga ? ` · ${today.yoga}` : ''}
              </Text>
            ) : null}

            {/* Dasha — only if it matters, in gold */}
            {today.dasha ? (
              <Text style={t.dasha}>{today.dasha}</Text>
            ) : null}

            {/* ─── Image zone at bottom ─── */}
            <View style={t.imageZone}>
              {/* Image will be inserted here */}
              <View style={t.imgPlaceholder} />
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}


const t = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    justifyContent: 'flex-start',
  },

  date: {
    fontSize: 12,
    color: W(0.2),
    letterSpacing: 1,
    fontWeight: '300',
    marginBottom: 6,
  },

  context: {
    fontSize: 12,
    color: W(0.12),
    letterSpacing: 0.5,
    fontWeight: '300',
    marginBottom: 40,
  },

  readingWrap: {
    marginBottom: 40,
  },

  reading: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 19,
    color: W(0.8),
    lineHeight: 32,
    fontWeight: '400',
  },

  panchanga: {
    fontSize: 11,
    color: W(0.1),
    letterSpacing: 0.8,
    fontWeight: '300',
    marginBottom: 8,
  },

  dasha: {
    fontSize: 11,
    color: GOLD,
    opacity: 0.3,
    letterSpacing: 1,
    fontWeight: '400',
    marginBottom: 30,
  },

  // Image zone at bottom
  imageZone: {
    flex: 1,
    minHeight: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },

  imgPlaceholder: {
    width: SW * 0.6,
    height: 120,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: W(0.025),
    backgroundColor: W(0.005),
  },
});

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.88,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});