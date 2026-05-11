/**
 * KP HORARY SCREEN
 * 
 * Gold particle wanders → text fades "think of a number 1-249" →
 * input + circle → particle flies to circle → pulse → tap → send →
 * reading arrives. Once per day.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Easing, Dimensions, ActivityIndicator, AsyncStorage,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';
const STORAGE_KEY = '@kp_horary_last_used';

// Image positions
const IMG_POSITIONS = [
  { top: '55%', right: 20 },
  { top: '60%', left: 25 },
  { top: '50%', right: 30 },
  { top: '65%', left: 15 },
];


// ─── Wandering Gold Particle ───
function GoldParticle({ targetX, targetY, shouldFly, visible }) {
  const posX = useRef(new Animated.Value(SW / 2)).current;
  const posY = useRef(new Animated.Value(SH * 0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const wanderRef = useRef(null);

  // Fade in
  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
      startWandering();
    }
    return () => { if (wanderRef.current) wanderRef.current.stop(); };
  }, [visible]);

  const startWandering = () => {
    const wander = () => {
      const nx = 40 + Math.random() * (SW - 80);
      const ny = 100 + Math.random() * (SH * 0.6 - 100);
      const duration = 3000 + Math.random() * 4000;
      wanderRef.current = Animated.parallel([
        Animated.timing(posX, { toValue: nx, duration, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
        Animated.timing(posY, { toValue: ny, duration, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
      ]);
      wanderRef.current.start(({ finished }) => { if (finished) wander(); });
    };
    wander();
  };

  // Fly to circle
  useEffect(() => {
    if (shouldFly && targetX != null && targetY != null) {
      if (wanderRef.current) wanderRef.current.stop();
      Animated.parallel([
        Animated.timing(posX, { toValue: targetX, duration: 400, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(posY, { toValue: targetY, duration: 400, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scale, { toValue: 2.5, duration: 200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [shouldFly, targetX, targetY]);

  // Resume wandering
  useEffect(() => {
    if (!shouldFly && visible) {
      startWandering();
    }
  }, [shouldFly]);

  return (
    <Animated.View
      style={[
        ps.particle,
        {
          opacity,
          transform: [
            { translateX: Animated.subtract(posX, new Animated.Value(4)) },
            { translateY: Animated.subtract(posY, new Animated.Value(4)) },
            { scale },
          ],
        },
      ]}
    >
      <View style={ps.particleInner} />
      <View style={ps.particleGlow} />
    </Animated.View>
  );
}


// ─── Pulsing Circle ───
function PulseCircle({ visible, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[ps.circleWrap, { opacity, transform: [{ scale }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={ps.circleTouch}>
        <View style={ps.circleOuter}>
          <View style={ps.circleInner} />
        </View>
        <Text style={ps.circleTap}>tap to ask</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}


// ─── Main Component ───
export default function KPHoraryScreen({ visible, onClose, kundliData }) {
  const [phase, setPhase] = useState('idle'); // idle → input → flying → pulsing → loading → result → used
  const [number, setNumber] = useState('');
  const [reading, setReading] = useState(null);
  const [horaryData, setHoraryData] = useState(null);
  const [usedToday, setUsedToday] = useState(false);

  const textOpacity = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const circleX = SW / 2;
  const circleY = SH * 0.48;

  // Check daily usage
  useEffect(() => {
    checkUsage();
  }, []);

  const checkUsage = async () => {
    try {
      const last = await AsyncStorage?.getItem?.(STORAGE_KEY);
      if (last) {
        const today = new Date().toDateString();
        if (last === today) setUsedToday(true);
      }
    } catch (e) {}
  };

  const markUsed = async () => {
    try {
      await AsyncStorage?.setItem?.(STORAGE_KEY, new Date().toDateString());
    } catch (e) {}
    setUsedToday(true);
  };

  // Open/close
  useEffect(() => {
    if (visible) {
      setPhase('idle');
      setNumber('');
      setReading(null);
      setHoraryData(null);
      textOpacity.setValue(0);
      inputOpacity.setValue(0);
      resultOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // After sheet opens, fade in text
        setTimeout(() => {
          if (usedToday) {
            setPhase('used');
          } else {
            setPhase('input');
            Animated.stagger(400, [
              Animated.timing(textOpacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
              Animated.timing(inputOpacity, { toValue: 1, duration: 800, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
            ]).start();
          }
        }, 800);
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, usedToday]);

  // Number entered → fly particle
  const handleNumberSubmit = useCallback(() => {
    const n = parseInt(number);
    if (!n || n < 1 || n > 249) return;
    setPhase('flying');
    setTimeout(() => setPhase('pulsing'), 500);
  }, [number]);

  // Circle tapped → send
  const handleCircleTap = useCallback(async () => {
    setPhase('loading');
    try {
      const r = await fetch(`${API_BASE}/kp-horary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(number),
          question: '',
          category: 'general',
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setReading(data.reading || '');
      setHoraryData(data.horary || null);
      markUsed();
      setPhase('result');
      Animated.timing(resultOpacity, { toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
    } catch (e) {
      console.log('Horary error:', e);
      setPhase('input');
    }
  }, [number, kundliData]);

  if (!visible) return null;

  const imgPos = IMG_POSITIONS[Math.abs(parseInt(number) || 0) % IMG_POSITIONS.length];

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

        {/* Gold particle — always present except during result */}
        {phase !== 'result' && phase !== 'used' && (
          <GoldParticle
            visible={phase !== 'idle'}
            shouldFly={phase === 'flying' || phase === 'pulsing'}
            targetX={circleX}
            targetY={circleY - 40}
          />
        )}

        {/* Used today message */}
        {phase === 'used' && (
          <View style={ps.usedWrap}>
            <Text style={ps.usedText}>You've already asked today.</Text>
            <Text style={ps.usedSub}>The universe answers once a day.{'\n'}Come back tomorrow.</Text>
          </View>
        )}

        {/* Prompt text */}
        {(phase === 'input' || phase === 'flying' || phase === 'pulsing') && (
          <Animated.View style={[ps.promptWrap, { opacity: textOpacity }]}>
            <Text style={ps.promptText}>Think of the first number{'\n'}that comes to mind</Text>
            <Text style={ps.promptRange}>between 1 and 249</Text>
          </Animated.View>
        )}

        {/* Input + circle */}
        {(phase === 'input' || phase === 'flying' || phase === 'pulsing') && (
          <Animated.View style={[ps.inputWrap, { opacity: inputOpacity }]}>
            <TextInput
              style={ps.input}
              value={number}
              onChangeText={(t) => {
                const digits = t.replace(/[^0-9]/g, '');
                if (!digits) { setNumber(''); return; }

                // Digit-by-digit validation
                let valid = '';
                for (let i = 0; i < digits.length && i < 3; i++) {
                  const d = parseInt(digits[i], 10);
                  if (i === 0) {
                    // First digit: only 1 or 2
                    if (d < 1 || d > 2) return;
                    valid += digits[i];
                  } else if (i === 1) {
                    // Second digit: if first was 2, max 4
                    if (valid[0] === '2' && d > 4) return;
                    valid += digits[i];
                  } else if (i === 2) {
                    // Third digit: if first two are "24", max 9 (gives 240-249)
                    // if first two are "25"-"29", blocked already by rule above
                    valid += digits[i];
                  }
                }
                setNumber(valid);
              }}
              onSubmitEditing={() => {
                const n = parseInt(number, 10);
                if (n >= 1 && n <= 249) handleNumberSubmit();
              }}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="—"
              placeholderTextColor={W(0.1)}
              returnKeyType="done"
              editable={phase === 'input'}
            />
          </Animated.View>
        )}

        {/* Pulsing circle */}
        {(phase === 'pulsing') && (
          <View style={[ps.circlePosition, { top: circleY, left: circleX - 30 }]}>
            <PulseCircle visible={true} onPress={handleCircleTap} />
          </View>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <View style={ps.loadWrap}>
            <ActivityIndicator color={GOLD} size="small" />
            <Text style={ps.loadText}>The universe is answering...</Text>
          </View>
        )}

        {/* Result */}
        {phase === 'result' && reading && (
          <Animated.View style={[rs.resultWrap, { opacity: resultOpacity }]}>
            {/* Number echo */}
            <Text style={rs.numberEcho}>{number}</Text>

            {/* Verdict badge */}
            {horaryData && (
              <View style={[rs.verdictBadge,
                horaryData.verdict?.startsWith('YES') && rs.verdictYes,
                horaryData.verdict?.startsWith('NO') && rs.verdictNo,
              ]}>
                <Text style={[rs.verdictText,
                  horaryData.verdict?.startsWith('YES') && { color: '#50C878' },
                  horaryData.verdict?.startsWith('NO') && { color: '#C85050' },
                ]}>{horaryData.verdict}</Text>
              </View>
            )}

            {/* Reading */}
            <Text style={rs.reading}>{reading}</Text>

            {/* Entry info */}
            {horaryData?.entry && (
              <Text style={rs.entryLine}>
                {horaryData.entry.sign} · {horaryData.entry.star} · {horaryData.entry.sub_lord}
              </Text>
            )}

            {/* Image zone at random position */}
            <View style={[rs.imageZone, imgPos]}>
              <View style={rs.imgPlaceholder} />
            </View>

            {/* Confidence */}
            {horaryData && (
              <Text style={rs.confidence}>{horaryData.confidence}% confidence</Text>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}


// ─── Particle styles ───
const ps = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    zIndex: 5,
  },
  particleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  particleGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    opacity: 0.15,
  },

  // Prompt
  promptWrap: {
    position: 'absolute',
    top: SH * 0.18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 20,
    color: W(0.7),
    textAlign: 'center',
    lineHeight: 32,
  },
  promptRange: {
    fontSize: 12,
    color: GOLD,
    opacity: 0.4,
    letterSpacing: 3,
    marginTop: 12,
    fontWeight: '300',
  },

  // Input
  inputWrap: {
    position: 'absolute',
    top: SH * 0.35,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  input: {
    fontSize: 42,
    color: W(0.85),
    fontWeight: '200',
    textAlign: 'center',
    width: 120,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: W(0.08),
    letterSpacing: 8,
  },

  // Circle
  circlePosition: {
    position: 'absolute',
    zIndex: 10,
  },
  circleWrap: {
    alignItems: 'center',
    gap: 10,
  },
  circleTouch: {
    alignItems: 'center',
    gap: 10,
  },
  circleOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: GOLD,
    opacity: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOLD,
    opacity: 0.8,
  },
  circleTap: {
    fontSize: 9,
    color: W(0.15),
    letterSpacing: 2,
    fontWeight: '400',
  },

  // Loading
  loadWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadText: {
    fontSize: 12,
    color: W(0.15),
    letterSpacing: 1.5,
    fontWeight: '300',
  },

  // Used today
  usedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  usedText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    color: W(0.5),
    textAlign: 'center',
  },
  usedSub: {
    fontSize: 12,
    color: W(0.15),
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '300',
  },
});

// ─── Result styles ───
const rs = StyleSheet.create({
  resultWrap: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: SH * 0.08,
  },
  numberEcho: {
    fontSize: 48,
    color: W(0.06),
    fontWeight: '200',
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 16,
  },
  verdictBadge: {
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: W(0.1),
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  verdictYes: { borderColor: 'rgba(80,200,120,0.2)', backgroundColor: 'rgba(80,200,120,0.04)' },
  verdictNo: { borderColor: 'rgba(200,80,80,0.2)', backgroundColor: 'rgba(200,80,80,0.04)' },
  verdictText: {
    fontSize: 13,
    color: W(0.5),
    fontWeight: '500',
    letterSpacing: 1,
  },
  reading: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    color: W(0.8),
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 24,
  },
  entryLine: {
    fontSize: 11,
    color: W(0.1),
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '300',
    marginBottom: 20,
  },
  confidence: {
    fontSize: 10,
    color: GOLD,
    opacity: 0.25,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '400',
    marginTop: 20,
  },
  imageZone: {
    position: 'absolute',
  },
  imgPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: W(0.02),
    backgroundColor: W(0.005),
  },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#020202', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.04),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
});
