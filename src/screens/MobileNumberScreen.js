/**
 * MOBILE NUMBER SCREEN — Rotary Phone Dial
 *
 * User ROTATES the whole wheel. When a number aligns with
 * the dip circle at the bottom and is held — number is typed.
 * Release → wheel springs back. ✕ backspace. RING to send.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder,
} from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const DIAL_SIZE = Math.min(SW * 0.84, 345);
const DIAL_R = DIAL_SIZE / 2;
const ORBIT_R = DIAL_R - 22;
const NUM_SIZE = 36;
const DIP_R = 28;
const COUNT = 10;
const ANGLE_STEP = (2 * Math.PI) / (COUNT + 1); // 11 slots: 10 digits + 1 gap for dip
const DIP_GAP = 0.2; // extra breathing room
const ARC_FOR_DIGITS = (2 * Math.PI) - (2 * DIP_GAP);
const DIGIT_STEP = ARC_FOR_DIGITS / COUNT;
const BOTTOM = Math.PI / 2;

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

// Dip is at the bottom. Digits arranged clockwise starting just after the gap.
const BASE_ANGLES = DIGITS.map((_, i) => BOTTOM + DIP_GAP + (i + 0.5) * DIGIT_STEP);


export default function MobileNumberScreen({ visible, onClose, kundliData }) {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('dial');
  const [mobileData, setMobileData] = useState(null);
  const [reading, setReading] = useState('');
  const [nearDigit, setNearDigit] = useState(null); // which digit is near dip
  const [dipGold, setDipGold] = useState(false);

  const rotation = useRef(new Animated.Value(0)).current;
  const currentRot = useRef(0);
  const lastAngle = useRef(0);
  const holdTimer = useRef(null);
  const nearDigitRef = useRef(null);
  const typedRef = useRef('');

  // Keep typedRef in sync
  useEffect(() => { typedRef.current = typed; }, [typed]);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dipVibrateX = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const vibrateAnim = useRef(null);

  // Track rotation value and detect digit near dip
  const [positions, setPositions] = useState(() => BASE_ANGLES.map(a => a));

  const checkNearDip = useCallback((rotValue) => {
    let closest = null;
    let closestDist = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const angle = BASE_ANGLES[i] + rotValue;
      const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const d = Math.min(Math.abs(norm - BOTTOM), 2 * Math.PI - Math.abs(norm - BOTTOM));
      if (d < closestDist) { closestDist = d; closest = i; }
    }
    if (closestDist < 0.15) {
      return closest;
    }
    return null;
  }, []);

  useEffect(() => {
    const id = rotation.addListener(({ value }) => {
      currentRot.current = value;
      setPositions(BASE_ANGLES.map(a => a + value));
      const near = checkNearDip(value);
      const prevNear = nearDigitRef.current;

      if (near !== null && prevNear !== near) {
        // New digit entered dip zone — start hold timer
        nearDigitRef.current = near;
        setNearDigit(near);
        setDipGold(true);
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdTimer.current = setTimeout(() => {
          // Type the digit
          if (nearDigitRef.current !== null && typedRef.current.length < 15) {
            const digit = DIGITS[nearDigitRef.current];
            setTyped(prev => prev + String(digit));
          }
          holdTimer.current = null;
        }, 400);
      } else if (near === null && prevNear !== null) {
        // Digit left dip zone — cancel timer
        nearDigitRef.current = null;
        setNearDigit(null);
        setDipGold(false);
        if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      }
    });
    return () => rotation.removeListener(id);
  }, [checkNearDip]);

  useEffect(() => {
    if (visible) {
      setTyped(''); setPhase('dial'); setMobileData(null); setReading('');
      resultOpacity.setValue(0); dipVibrateX.setValue(0);
      rotation.setValue(0); currentRot.current = 0;
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      if (vibrateAnim.current) vibrateAnim.current.stop();
      if (holdTimer.current) clearTimeout(holdTimer.current);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Pan to rotate the wheel
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
    onPanResponderGrant: (evt) => {
      rotation.stopAnimation();
      const t = evt.nativeEvent;
      lastAngle.current = Math.atan2(t.locationY - DIAL_R, t.locationX - DIAL_R);
    },
    onPanResponderMove: (evt) => {
      const t = evt.nativeEvent;
      const curr = Math.atan2(t.locationY - DIAL_R, t.locationX - DIAL_R);
      let delta = curr - lastAngle.current;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      currentRot.current += delta;
      rotation.setValue(currentRot.current);
      lastAngle.current = curr;
    },
    onPanResponderRelease: () => {
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      nearDigitRef.current = null;
      setNearDigit(null);
      setDipGold(false);
      Animated.spring(rotation, {
        toValue: 0, tension: 50, friction: 10, useNativeDriver: false,
      }).start(() => { currentRot.current = 0; });
    },
  })).current;

  const handleSend = useCallback(async () => {
    if (typed.length < 4) return;
    setPhase('sending');
    vibrateAnim.current = Animated.loop(Animated.sequence([
      Animated.timing(dipVibrateX, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: -3, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: 2, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: -2, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.delay(250),
    ]));
    vibrateAnim.current.start();
    try {
      const r = await fetch(`${API_BASE}/mobile-number`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: typed, kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }),
      });
      const data = await r.json();
      setMobileData(data.mobile_data || null);
      setReading(data.reading || '');
    } catch (e) { console.log('Mobile error:', e); }
    if (vibrateAnim.current) vibrateAnim.current.stop();
    dipVibrateX.setValue(0);
    setPhase('result');
    Animated.timing(resultOpacity, { toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
  }, [typed, kundliData]);

  if (!visible) return null;
  const VC = { excellent: '#50C878', good: '#50C878', decent: '#C89850', caution: '#C85050', neutral: '#888' };

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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} bounces={false}>
          {(phase === 'dial' || phase === 'sending') && (
            <>
              {/* Rotary dial */}
              <View style={[ds.dialWrap, { width: DIAL_SIZE, height: DIAL_SIZE }]}>
                <Svg width={DIAL_SIZE} height={DIAL_SIZE} style={StyleSheet.absoluteFill}>
                  <SvgCircle cx={DIAL_R} cy={DIAL_R} r={ORBIT_R + NUM_SIZE / 2 + 6} stroke={W(0.04)} strokeWidth={0.5} fill="none" />
                  <SvgCircle cx={DIAL_R} cy={DIAL_R} r={ORBIT_R - NUM_SIZE / 2 - 2} stroke={W(0.03)} strokeWidth={0.3} fill="none" strokeDasharray="3,8" />
                </Svg>

                {/* Dip circle — fixed at bottom, does NOT rotate */}
                <Animated.View style={[ds.dipCircle, {
                  left: DIAL_R + ORBIT_R * Math.cos(BOTTOM) - DIP_R,
                  top: DIAL_R + ORBIT_R * Math.sin(BOTTOM) - DIP_R,
                  width: DIP_R * 2, height: DIP_R * 2, borderRadius: DIP_R,
                  borderColor: dipGold ? GOLD : W(0.12),
                  transform: [{ translateX: dipVibrateX }],
                }]}>
                  {phase === 'sending' && <View style={ds.dipDot} />}
                </Animated.View>

                {/* Touch zone for rotation */}
                <View {...panResponder.panHandlers} style={[ds.touchZone, { width: DIAL_SIZE, height: DIAL_SIZE }]}>
                  {/* Digit nodes — rotate with wheel */}
                  {DIGITS.map((digit, i) => {
                    const angle = positions[i];
                    const x = DIAL_R + ORBIT_R * Math.cos(angle) - NUM_SIZE / 2;
                    const y = DIAL_R + ORBIT_R * Math.sin(angle) - NUM_SIZE / 2;
                    const isNear = nearDigit === i;

                    return (
                      <View key={digit} style={[ds.digitNode, {
                        left: x, top: y,
                        width: NUM_SIZE, height: NUM_SIZE, borderRadius: NUM_SIZE / 2,
                        borderColor: isNear ? GOLD : W(0.06),
                        backgroundColor: isNear ? `${GOLD}10` : W(0.01),
                      }]}>
                        <Text style={[ds.digitText, isNear && { color: GOLD }]}>{digit}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Typed number — lower */}
              <View style={ds.typedSection}>
                <View style={ds.typedRow}>
                  <Text style={ds.typedNumber}>{typed || '—'}</Text>
                  {typed.length > 0 && (
                    <TouchableOpacity onPress={() => setTyped(p => p.slice(0, -1))} style={ds.backBtn} activeOpacity={0.6}>
                      <Text style={ds.backText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {typed.length >= 4 && phase === 'dial' && (
                  <TouchableOpacity onPress={handleSend} activeOpacity={0.6} style={ds.ringBtn}>
                    <Text style={ds.ringText}>RING</Text>
                  </TouchableOpacity>
                )}

                {phase === 'sending' && (
                  <Text style={ds.sendingText}>ringing...</Text>
                )}
              </View>
            </>
          )}

          {phase === 'result' && mobileData && (
            <Animated.View style={[rs.resultWrap, { opacity: resultOpacity }]}>
              <Text style={rs.number}>{mobileData.mobile}</Text>
              <View style={rs.vibRow}>
                <Text style={rs.vibNumber}>{mobileData.root}</Text>
                <View style={rs.vibInfo}>
                  <Text style={rs.vibVibe}>{mobileData.vibe} · {mobileData.planet}</Text>
                  <Text style={rs.vibEffect}>{mobileData.effect}</Text>
                </View>
              </View>
              <View style={[rs.verdictBadge, { borderColor: `${VC[mobileData.verdict] || '#888'}40`, backgroundColor: `${VC[mobileData.verdict] || '#888'}08` }]}>
                <Text style={[rs.verdictText, { color: VC[mobileData.verdict] || '#888' }]}>{mobileData.verdict}{mobileData.is_aligned ? ' · aligned' : ''}</Text>
              </View>
              <View style={rs.insightRow}>
                <View style={rs.insightBox}><Text style={rs.insightLabel}>dominant</Text><Text style={rs.insightValue}>{mobileData.dominant_digit}</Text><Text style={rs.insightVibe}>{mobileData.dominant_vibe}</Text></View>
                <View style={rs.insightDivider} />
                <View style={rs.insightBox}><Text style={rs.insightLabel}>last digit</Text><Text style={rs.insightValue}>{mobileData.last_digit}</Text><Text style={rs.insightVibe}>{mobileData.last_vibe}</Text></View>
              </View>
              <View style={rs.imgZone}><View style={rs.imgPlaceholder} /></View>
              <Text style={rs.readingText}>{reading}</Text>
              <Text style={rs.ownerLine}>your numbers: {mobileData.owner_mulank} · {mobileData.owner_bhagyank}</Text>
            </Animated.View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}


const ds = StyleSheet.create({
  dialWrap: { alignSelf: 'center', marginTop: 24 },
  touchZone: { position: 'absolute', top: 0, left: 0 },
  dipCircle: { position: 'absolute', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  dipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, opacity: 0.6 },
  digitNode: { position: 'absolute', borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  digitText: { fontSize: 16, color: W(0.45), fontWeight: '300' },

  typedSection: { alignItems: 'center', paddingTop: 56, gap: 18 },
  typedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  typedNumber: { fontSize: 28, color: GOLD, fontWeight: '200', letterSpacing: 5, opacity: 0.8, minHeight: 40, textAlign: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 0.5, borderColor: W(0.1), alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 12, color: W(0.3), fontWeight: '300' },
  ringBtn: { paddingHorizontal: 28, paddingVertical: 10, borderWidth: 0.5, borderColor: `${GOLD}30`, borderRadius: 20 },
  ringText: { fontSize: 13, color: GOLD, opacity: 0.6, letterSpacing: 6, fontWeight: '500' },
  sendingText: { fontSize: 11, color: W(0.12), letterSpacing: 3, fontWeight: '300' },
});

const rs = StyleSheet.create({
  resultWrap: { paddingHorizontal: 28, paddingTop: 30 },
  number: { fontSize: 22, color: GOLD, opacity: 0.3, letterSpacing: 4, fontWeight: '200', textAlign: 'center', marginBottom: 20 },
  vibRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  vibNumber: { fontSize: 40, color: W(0.15), fontWeight: '200' },
  vibInfo: { flex: 1 },
  vibVibe: { fontSize: 14, color: W(0.5), fontWeight: '300' },
  vibEffect: { fontSize: 12, color: W(0.25), marginTop: 3, fontWeight: '300' },
  verdictBadge: { alignSelf: 'flex-start', borderWidth: 0.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 18 },
  verdictText: { fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  insightRow: { flexDirection: 'row', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: W(0.04), paddingVertical: 14, marginBottom: 18 },
  insightBox: { flex: 1, alignItems: 'center', gap: 4 },
  insightDivider: { width: 0.5, height: 28, backgroundColor: W(0.06) },
  insightLabel: { fontSize: 8, color: W(0.1), letterSpacing: 2, fontWeight: '500' },
  insightValue: { fontSize: 22, color: W(0.4), fontWeight: '200' },
  insightVibe: { fontSize: 10, color: W(0.2), fontWeight: '300' },
  imgZone: { alignSelf: 'flex-end', marginBottom: 16 },
  imgPlaceholder: { width: 65, height: 65, borderRadius: 12, borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005) },
  readingText: { fontSize: 15, color: W(0.7), lineHeight: 25, fontWeight: '300', marginBottom: 18 },
  ownerLine: { fontSize: 10, color: W(0.1), letterSpacing: 1.5, fontWeight: '400', textAlign: 'center' },
});

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92, backgroundColor: '#040404', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, borderColor: W(0.05) },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  scrollContent: { paddingBottom: 40 },
});
