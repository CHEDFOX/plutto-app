/**
 * THE ZOO
 *
 * Blank → "You think you are a [Dragon]... NO" → fades out →
 * 4 pillars appear with different heights (year/month/day/hour).
 * Tap any → reading about that animal.
 * Image spaces in readings at random positions.
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

const PILLAR_HEIGHTS = [140, 180, 200, 155]; // year, month, day, hour — different sizes
const PILLAR_WIDTHS = [0.21, 0.24, 0.28, 0.22];

const ANIMAL_EMOJI = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇', Dragon: '🐉', Snake: '🐍',
  Horse: '🐴', Goat: '🐐', Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐷',
};

const IMG_SPOTS = [
  { align: 'flex-end', mt: 12 },
  { align: 'flex-start', mt: 16 },
  { align: 'flex-end', mt: 8 },
  { align: 'flex-start', mt: 14 },
];


export default function TheZooScreen({ visible, onClose, kundliData }) {
  const [phase, setPhase] = useState('blank'); // blank → intro → pillars → reading
  const [animals, setAnimals] = useState([]);
  const [yearAnimal, setYearAnimal] = useState('');
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [reading, setReading] = useState(null);
  const [loadingRead, setLoadingRead] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introNoOpacity = useRef(new Animated.Value(0)).current;
  const pillarsOpacity = useRef(new Animated.Value(0)).current;
  const pillarAnims = useRef([0,1,2,3].map(() => new Animated.Value(0))).current;
  const readingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPhase('blank'); setAnimals([]); setSelectedPillar(null); setReading(null);
      introOpacity.setValue(0); introNoOpacity.setValue(0); pillarsOpacity.setValue(0); readingOpacity.setValue(0);
      pillarAnims.forEach(a => a.setValue(0));

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => fetchZoo());
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchZoo = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/the-zoo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }),
      });
      const data = await r.json();
      setAnimals(data.animals || []);
      setYearAnimal(data.year_animal || '');
      playIntro(data.year_animal || '');
    } catch (e) { console.log('Zoo error:', e); }
  }, [kundliData]);

  const playIntro = (animal) => {
    setPhase('intro');
    // "You think you are a [Dragon]..."
    Animated.timing(introOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start(() => {
      // "...NO"
      setTimeout(() => {
        Animated.timing(introNoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
          // Fade out intro
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(introOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
              Animated.timing(introNoOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]).start(() => {
              setPhase('pillars');
              showPillars();
            });
          }, 1500);
        });
      }, 800);
    });
  };

  const showPillars = () => {
    Animated.timing(pillarsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.stagger(150, pillarAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true })
    )).start();
  };

  const handlePillarPress = useCallback(async (pillarKey) => {
    setSelectedPillar(pillarKey);
    setLoadingRead(true); setReading(null);
    readingOpacity.setValue(0);
    try {
      const r = await fetch(`${API_BASE}/the-zoo/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: pillarKey, kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }),
      });
      const data = await r.json();
      setReading(data);
      Animated.timing(readingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch (e) { console.log('Zoo read error:', e); }
    setLoadingRead(false);
  }, [kundliData]);

  if (!visible) return null;

  const selAnimal = reading?.animal_data || animals.find(a => a.pillar === selectedPillar) || {};
  const imgSpot = IMG_SPOTS[['year','month','day','hour'].indexOf(selectedPillar) % 4];

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

        {/* Intro text */}
        {phase === 'intro' && (
          <View style={zs.introWrap}>
            <Animated.Text style={[zs.introText, { opacity: introOpacity }]}>
              you think you are a {yearAnimal}
            </Animated.Text>
            <Animated.Text style={[zs.introNo, { opacity: introNoOpacity }]}>
              NO
            </Animated.Text>
          </View>
        )}

        {/* Pillars + reading */}
        {(phase === 'pillars' || phase === 'reading') && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} bounces={false}>
            {/* Four pillars */}
            <Animated.View style={[zs.pillarsRow, { opacity: pillarsOpacity }]}>
              {animals.map((a, i) => {
                const isSelected = selectedPillar === a.pillar;
                const height = PILLAR_HEIGHTS[i];
                const width = PILLAR_WIDTHS[i];
                return (
                  <Animated.View key={a.pillar} style={[zs.pillarWrap, {
                    transform: [{ scale: pillarAnims[i] }],
                    width: `${width * 100}%`,
                  }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handlePillarPress(a.pillar)}
                      style={[zs.pillar, {
                        height,
                        borderColor: isSelected ? GOLD : W(0.05),
                        borderWidth: isSelected ? 1 : 0.5,
                        backgroundColor: isSelected ? `${GOLD}06` : W(0.008),
                      }]}
                    >
                      <Text style={zs.pillarLabel}>{a.label}</Text>
                      <Text style={[zs.pillarAnimal, isSelected && { color: GOLD, opacity: 0.8 }]}>{a.animal}</Text>
                      <Text style={zs.pillarEmoji}>{ANIMAL_EMOJI[a.animal] || '🐾'}</Text>
                      <Text style={zs.pillarElement}>{a.polarity} {a.stem_element}</Text>
                      <Text style={zs.pillarRole}>{a.role}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </Animated.View>

            {/* Reading */}
            {selectedPillar && (
              <Animated.View style={[rs.container, { opacity: readingOpacity }]}>
                {loadingRead ? (
                  <View style={rs.loadWrap}><ActivityIndicator color={GOLD} size="small" /></View>
                ) : reading ? (
                  <>
                    <View style={rs.header}>
                      <Text style={rs.emoji}>{ANIMAL_EMOJI[selAnimal.animal] || '🐾'}</Text>
                      <View style={rs.headerInfo}>
                        <Text style={rs.animalName}>{selAnimal.animal}</Text>
                        <Text style={rs.pillarTag}>{selAnimal.label} pillar · {selAnimal.role}</Text>
                        <Text style={rs.governs}>{selAnimal.governs}</Text>
                      </View>
                    </View>

                    <Text style={rs.ages}>Ages {selAnimal.ages}</Text>

                    {/* Nature + shadow */}
                    <Text style={rs.natureText}>{selAnimal.nature}</Text>
                    <Text style={rs.shadowText}>{selAnimal.shadow}</Text>

                    {/* Image zone */}
                    <View style={[rs.imgZone, { alignSelf: imgSpot?.align || 'flex-end', marginTop: imgSpot?.mt || 10 }]}>
                      <View style={rs.imgPlaceholder} />
                    </View>

                    {/* LLM reading */}
                    <Text style={rs.readingText}>{reading.reading}</Text>
                  </>
                ) : null}
              </Animated.View>
            )}

            <View style={{ height: 80 }} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}


const zs = StyleSheet.create({
  introWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  introText: {
    fontFamily: 'PlayfairDisplay', fontSize: 20, color: W(0.5),
    textAlign: 'center', lineHeight: 32,
  },
  introNo: {
    fontFamily: 'PlayfairDisplay', fontSize: 42, color: W(0.85),
    letterSpacing: 8, fontWeight: '400',
  },

  pillarsRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 30, paddingBottom: 20,
  },
  pillarWrap: {
    alignItems: 'center',
  },
  pillar: {
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  pillarLabel: {
    fontSize: 8, color: W(0.15), letterSpacing: 2.5, fontWeight: '600', textTransform: 'uppercase',
  },
  pillarAnimal: {
    fontSize: 14, color: W(0.5), fontWeight: '400', letterSpacing: 0.5,
  },
  pillarEmoji: {
    fontSize: 28,
  },
  pillarElement: {
    fontSize: 9, color: W(0.2), fontWeight: '300', letterSpacing: 0.5,
  },
  pillarRole: {
    fontSize: 8, color: W(0.1), fontWeight: '300', textAlign: 'center', lineHeight: 12,
  },
});

const rs = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 16 },
  loadWrap: { alignItems: 'center', paddingTop: 30 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  emoji: { fontSize: 40 },
  headerInfo: { flex: 1 },
  animalName: { fontFamily: 'PlayfairDisplay', fontSize: 24, color: W(0.85) },
  pillarTag: { fontSize: 11, color: GOLD, opacity: 0.4, marginTop: 3, letterSpacing: 1, fontWeight: '400' },
  governs: { fontSize: 11, color: W(0.2), marginTop: 3, fontWeight: '300' },
  ages: { fontSize: 10, color: W(0.12), letterSpacing: 2, fontWeight: '400', marginBottom: 14 },

  natureText: { fontSize: 13, color: W(0.5), lineHeight: 20, fontWeight: '300', marginBottom: 8 },
  shadowText: { fontSize: 13, color: W(0.3), lineHeight: 20, fontWeight: '300', fontStyle: 'italic', marginBottom: 16 },

  imgZone: { marginBottom: 14 },
  imgPlaceholder: { width: 65, height: 65, borderRadius: 12, borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005) },

  readingText: { fontSize: 15, color: W(0.7), lineHeight: 25, fontWeight: '300' },
});

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#040404', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  scrollContent: { paddingBottom: 40 },
});
