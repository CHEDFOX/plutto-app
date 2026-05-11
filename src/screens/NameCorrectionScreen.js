/**
 * NAME CORRECTION SCREEN
 *
 * Blank → faint alphabets wander in background →
 * reading fades in with name analysis, corrections, effects.
 * Image space on the page.
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

// Wandering alphabet characters
const ALPHA_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WANDER_COUNT = 18;


// ─── Wandering Alphabet Letter ───
function WanderingLetter({ char, index }) {
  const x = useRef(new Animated.Value(Math.random() * (SW - 40))).current;
  const y = useRef(new Animated.Value(Math.random() * (SH * 0.7))).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in staggered
    Animated.timing(opacity, {
      toValue: 0.03 + Math.random() * 0.04,
      duration: 1000 + index * 200,
      useNativeDriver: true,
    }).start();

    // Wander
    const wander = () => {
      const nx = 20 + Math.random() * (SW - 60);
      const ny = 40 + Math.random() * (SH * 0.7);
      const dur = 5000 + Math.random() * 8000;
      Animated.parallel([
        Animated.timing(x, { toValue: nx, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
        Animated.timing(y, { toValue: ny, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) wander(); });
    };
    setTimeout(wander, index * 300);
  }, []);

  const fontSize = 14 + Math.random() * 20;

  return (
    <Animated.Text
      style={[
        ws.letter,
        {
          fontSize,
          opacity,
          transform: [{ translateX: x }, { translateY: y }],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}


// ─── Main Component ───
export default function NameCorrectionScreen({ visible, onClose, kundliData, userName }) {
  const [nameData, setNameData] = useState(null);
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const readingOpacity = useRef(new Animated.Value(0)).current;

  // The user's name — from props or hardcoded for now
  const name = userName || 'Rajesh Kumar';

  useEffect(() => {
    if (visible) {
      setNameData(null); setReading('');
      readingOpacity.setValue(0);
      fetchCorrection();
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

  useEffect(() => {
    if (reading) {
      Animated.timing(readingOpacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
    }
  }, [reading]);

  const fetchCorrection = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/name-correction`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setNameData(data.name_data || null);
      setReading(data.reading || '');
    } catch (e) { console.log('Name correction error:', e); }
    setLoading(false);
  }, [name, kundliData]);

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

        {/* Wandering alphabets background */}
        <View style={ws.field} pointerEvents="none">
          {ALPHA_CHARS.slice(0, WANDER_COUNT).map((char, i) => (
            <WanderingLetter key={i} char={char} index={i} />
          ))}
        </View>

        {/* Content */}
        <View style={rs.content}>
          {loading ? (
            <View style={rs.loadWrap}>
              <ActivityIndicator color={W(0.15)} size="small" />
              <Text style={rs.loadText}>reading your name...</Text>
            </View>
          ) : nameData ? (
            <Animated.View style={[rs.readingWrap, { opacity: readingOpacity }]}>
              {/* Current name */}
              <Text style={rs.currentName}>{nameData.name}</Text>

              {/* Numbers row */}
              <View style={rs.numbersRow}>
                <View style={rs.numBox}>
                  <Text style={rs.numLabel}>name</Text>
                  <Text style={[rs.numValue, !nameData.needs_correction && { color: GOLD }]}>{nameData.current_namank}</Text>
                </View>
                <View style={rs.numDot} />
                <View style={rs.numBox}>
                  <Text style={rs.numLabel}>root</Text>
                  <Text style={rs.numValue}>{nameData.mulank}</Text>
                </View>
                <View style={rs.numDot} />
                <View style={rs.numBox}>
                  <Text style={rs.numLabel}>destiny</Text>
                  <Text style={rs.numValue}>{nameData.bhagyank}</Text>
                </View>
              </View>

              {/* Verdict */}
              <View style={[rs.verdictBox,
                nameData.needs_correction ? rs.verdictBad : rs.verdictGood
              ]}>
                <Text style={[rs.verdictText,
                  nameData.needs_correction ? { color: '#C89850' } : { color: '#50C878' }
                ]}>
                  {nameData.needs_correction ? 'correction suggested' : 'aligned'}
                </Text>
              </View>

              {/* Suggestions */}
              {nameData.suggestions?.length > 0 && (
                <View style={rs.suggestionsWrap}>
                  {nameData.suggestions.slice(0, 3).map((s, i) => (
                    <View key={i} style={rs.suggestion}>
                      <Text style={rs.sugName}>{s.name}</Text>
                      <Text style={rs.sugChange}>{s.change}</Text>
                      <Text style={rs.sugNum}>vibration → {s.namank}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Image zone */}
              <View style={rs.imgZone}>
                <View style={rs.imgPlaceholder} />
              </View>

              {/* LLM reading */}
              <Text style={rs.readingText}>{reading}</Text>

              {/* Lucky info */}
              {nameData.lucky_color && (
                <Text style={rs.luckyLine}>
                  {nameData.lucky_color} · {nameData.lucky_day}
                </Text>
              )}
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}


// ─── Wandering letter styles ───
const ws = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  letter: {
    position: 'absolute',
    fontFamily: 'PlayfairDisplay',
    color: W(1),
    fontWeight: '200',
  },
});

// ─── Reading styles ───
const rs = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    zIndex: 1,
  },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadText: { fontSize: 11, color: W(0.12), letterSpacing: 2, fontWeight: '300' },

  readingWrap: {},

  currentName: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 30,
    color: W(0.85),
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },

  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  numBox: { alignItems: 'center', gap: 4 },
  numLabel: { fontSize: 9, color: W(0.12), letterSpacing: 2, fontWeight: '500', textTransform: 'uppercase' },
  numValue: { fontSize: 24, color: W(0.5), fontWeight: '200' },
  numDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: W(0.06), marginTop: 12 },

  verdictBox: {
    alignSelf: 'center',
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  verdictGood: { borderColor: 'rgba(80,200,120,0.2)', backgroundColor: 'rgba(80,200,120,0.04)' },
  verdictBad: { borderColor: 'rgba(200,152,80,0.2)', backgroundColor: 'rgba(200,152,80,0.04)' },
  verdictText: { fontSize: 11, fontWeight: '500', letterSpacing: 1.5 },

  suggestionsWrap: { gap: 10, marginBottom: 22 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: W(0.04),
    borderRadius: 10,
    padding: 14,
    backgroundColor: W(0.008),
  },
  sugName: { fontFamily: 'PlayfairDisplay', fontSize: 16, color: GOLD, opacity: 0.7, flex: 1 },
  sugChange: { fontSize: 10, color: W(0.25), fontWeight: '300' },
  sugNum: { fontSize: 10, color: W(0.15), fontWeight: '400' },

  imgZone: { alignSelf: 'flex-end', marginBottom: 16 },
  imgPlaceholder: { width: 70, height: 70, borderRadius: 12, borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005) },

  readingText: { fontSize: 15, color: W(0.7), lineHeight: 26, fontWeight: '300', marginBottom: 20 },

  luckyLine: { fontSize: 10, color: GOLD, opacity: 0.25, textAlign: 'center', letterSpacing: 2, fontWeight: '400' },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.9,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
});
