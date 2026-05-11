/**
 * CORE NUMBERS SCREEN
 *
 * Blank → faint numbers drift in from corners →
 * readings fade in showing all core numbers with significance.
 * Image spaces at random positions.
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

const WANDER_COUNT = 14;

// Starting corners for numbers
const CORNERS = [
  { x: -30, y: -30 },
  { x: SW + 30, y: -30 },
  { x: -30, y: SH * 0.7 },
  { x: SW + 30, y: SH * 0.7 },
];

const IMG_SPOTS = [
  { align: 'flex-end', mt: 10 },
  { align: 'flex-start', mt: 16 },
  { align: 'flex-end', mt: 8 },
  { align: 'flex-start', mt: 14 },
  { align: 'center', mt: 12 },
  { align: 'flex-end', mt: 18 },
];


// ─── Wandering Number ───
function WanderingNumber({ digit, index }) {
  const corner = CORNERS[index % CORNERS.length];
  const x = useRef(new Animated.Value(corner.x)).current;
  const y = useRef(new Animated.Value(corner.y)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Drift in from corner
    const targetX = 30 + Math.random() * (SW - 60);
    const targetY = 30 + Math.random() * (SH * 0.65);

    Animated.sequence([
      Animated.delay(index * 200),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.03 + Math.random() * 0.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(x, { toValue: targetX, duration: 2000 + Math.random() * 2000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(y, { toValue: targetY, duration: 2000 + Math.random() * 2000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Continue wandering
      const wander = () => {
        const nx = 20 + Math.random() * (SW - 40);
        const ny = 20 + Math.random() * (SH * 0.65);
        const dur = 6000 + Math.random() * 6000;
        Animated.parallel([
          Animated.timing(x, { toValue: nx, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
          Animated.timing(y, { toValue: ny, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) wander(); });
      };
      wander();
    });
  }, []);

  const fontSize = 20 + Math.random() * 30;

  return (
    <Animated.Text
      style={[ns.wanderDigit, { fontSize, opacity, transform: [{ translateX: x }, { translateY: y }] }]}
    >
      {digit}
    </Animated.Text>
  );
}


// ─── Number Card ───
function NumberCard({ item, index }) {
  const imgSpot = IMG_SPOTS[index % IMG_SPOTS.length];
  const showImg = index % 2 === 0;

  return (
    <View style={cs.card}>
      <View style={cs.cardHeader}>
        <Text style={cs.cardNumber}>{item.number}</Text>
        <View style={cs.cardInfo}>
          <Text style={cs.cardLabel}>{item.label}</Text>
          {item.planet && <Text style={cs.cardPlanet}>{item.planet}</Text>}
          {item.name && <Text style={cs.cardName}>{item.name}</Text>}
          {item.theme && <Text style={cs.cardName}>{item.theme}</Text>}
        </View>
      </View>
      <Text style={cs.cardNote}>{item.note}</Text>
      {item.traits && <Text style={cs.cardTraits}>{item.traits}</Text>}

      {/* Image zone at random positions — show on alternating cards */}
      {showImg && (
        <View style={[cs.imgZone, { alignSelf: imgSpot.align, marginTop: imgSpot.mt }]}>
          <View style={cs.imgPlaceholder} />
        </View>
      )}
    </View>
  );
}


// ─── Main Component ───
export default function CoreNumbersScreen({ visible, onClose, kundliData, userName }) {
  const [numbersData, setNumbersData] = useState(null);
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const name = userName || '';

  useEffect(() => {
    if (visible) {
      setNumbersData(null); setReading('');
      contentOpacity.setValue(0);
      fetchNumbers();
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
    if (numbersData) {
      Animated.timing(contentOpacity, { toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
    }
  }, [numbersData]);

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/core-numbers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setNumbersData(data.numbers_data || null);
      setReading(data.reading || '');
    } catch (e) { console.log('Core numbers error:', e); }
    setLoading(false);
  }, [name, kundliData]);

  if (!visible) return null;

  const numbers = numbersData?.numbers || [];
  const missing = numbersData?.missing_numbers || [];

  // Digits to wander: use the actual core numbers
  const wanderDigits = numbers.map(n => String(n.number)).concat(['1','2','3','4','5','6','7','8','9']).slice(0, WANDER_COUNT);

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

        {/* Wandering numbers background */}
        <View style={ns.field} pointerEvents="none">
          {wanderDigits.map((d, i) => (
            <WanderingNumber key={i} digit={d} index={i} />
          ))}
        </View>

        {loading ? (
          <View style={s.loadCenter}>
            <ActivityIndicator color={W(0.15)} size="small" />
          </View>
        ) : numbersData ? (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
            style={{ opacity: contentOpacity, zIndex: 1 }}
          >
            {/* Number cards */}
            {numbers.map((item, i) => (
              <NumberCard key={item.key} item={item} index={i} />
            ))}

            {/* Missing numbers */}
            {missing.length > 0 && (
              <View style={cs.missingWrap}>
                <Text style={cs.missingLabel}>missing from your grid</Text>
                <View style={cs.missingRow}>
                  {missing.map(n => (
                    <View key={n} style={cs.missingBadge}>
                      <Text style={cs.missingNum}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* LLM reading */}
            {reading && (
              <View style={cs.readingWrap}>
                <View style={cs.readingLine} />
                <Text style={cs.readingText}>{reading}</Text>
              </View>
            )}

            <View style={{ height: 80 }} />
          </Animated.ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
}


// ─── Wandering number styles ───
const ns = StyleSheet.create({
  field: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden' },
  wanderDigit: { position: 'absolute', fontWeight: '200', color: W(1) },
});

// ─── Card styles ───
const cs = StyleSheet.create({
  card: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: W(0.03),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  cardNumber: { fontSize: 36, color: W(0.15), fontWeight: '200', width: 50, textAlign: 'center' },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 13, color: W(0.6), fontWeight: '400', letterSpacing: 0.3 },
  cardPlanet: { fontSize: 10, color: GOLD, opacity: 0.35, marginTop: 2, letterSpacing: 1.5, fontWeight: '400' },
  cardName: { fontSize: 11, color: W(0.25), marginTop: 2, fontWeight: '300' },
  cardNote: { fontSize: 13, color: W(0.4), lineHeight: 20, fontWeight: '300' },
  cardTraits: { fontSize: 12, color: W(0.2), lineHeight: 18, fontWeight: '300', marginTop: 6, fontStyle: 'italic' },

  imgZone: { marginTop: 8 },
  imgPlaceholder: { width: 55, height: 55, borderRadius: 10, borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005) },

  // Missing
  missingWrap: { paddingHorizontal: 28, paddingTop: 20, alignItems: 'center', gap: 12 },
  missingLabel: { fontSize: 9, color: W(0.1), letterSpacing: 3, fontWeight: '500' },
  missingRow: { flexDirection: 'row', gap: 10 },
  missingBadge: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 0.5, borderColor: '#C8505030',
    backgroundColor: '#C8505008',
    alignItems: 'center', justifyContent: 'center',
  },
  missingNum: { fontSize: 14, color: '#C85050', opacity: 0.5, fontWeight: '300' },

  // Reading
  readingWrap: { paddingHorizontal: 28, paddingTop: 24, alignItems: 'center', gap: 16 },
  readingLine: { width: 24, height: 0.5, backgroundColor: W(0.04) },
  readingText: { fontSize: 15, color: W(0.7), lineHeight: 26, fontWeight: '300', textAlign: 'center' },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
