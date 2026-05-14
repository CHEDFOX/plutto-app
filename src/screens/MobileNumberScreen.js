/**
 * MOBILE NUMBER — Pure Vedic-style rotation.
 * No Animated.Value for rotation. requestAnimationFrame + useState only.
 * Dip detection runs directly in PanResponder move handler.
 * Spring-back via requestAnimationFrame.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, PanResponder, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

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
const DIP_GAP = 0.2;
const ARC_FOR_DIGITS = (2 * Math.PI) - (2 * DIP_GAP);
const DIGIT_STEP = ARC_FOR_DIGITS / COUNT;
const BOTTOM = Math.PI / 2;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const BASE_ANGLES = DIGITS.map((_, i) => BOTTOM + DIP_GAP + (i + 0.5) * DIGIT_STEP);
const DIP_THRESHOLD = 0.15;

function RevealCTA({ text, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={ctaS.ctaTouch}>
      <View style={ctaS.ctaBox}><Text style={ctaS.ctaText}>{text}</Text><Text style={ctaS.ctaArrow}>→</Text></View>
    </TouchableOpacity>
  );
}

export default function MobileNumberScreen({ visible, onClose, kundliData }) {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('dial'); // dial | sending | result
  const [mobileData, setMobileData] = useState(null);
  const [reading, setReading] = useState('');
  const [nearDigit, setNearDigit] = useState(null);
  const [dipGold, setDipGold] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0);

  // Pure Vedic rotation
  const rot = useRef(0);
  const [rotVal, setRotVal] = useState(0);
  const lastAng = useRef(0);
  const springRunning = useRef(false);

  // Dip detection refs
  const holdTimer = useRef(null);
  const nearRef = useRef(null);
  const typedRef = useRef('');
  useEffect(() => { typedRef.current = typed; }, [typed]);

  // Visual-only animations (not rotation)
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const dipVibrateX = useRef(new Animated.Value(0)).current;
  const vibrateAnim = useRef(null);

  // Check which digit is near dip at current rotation
  const checkDip = useCallback((rotValue) => {
    let closest = null, closestDist = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const angle = BASE_ANGLES[i] + rotValue;
      const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const d = Math.min(Math.abs(norm - BOTTOM), 2 * Math.PI - Math.abs(norm - BOTTOM));
      if (d < closestDist) { closestDist = d; closest = i; }
    }
    return closestDist < DIP_THRESHOLD ? closest : null;
  }, []);

  // Update dip state — called from pan move and spring-back
  const updateDip = useCallback((rotValue) => {
    const near = checkDip(rotValue);
    const prev = nearRef.current;

    if (near !== null && prev !== near) {
      // New digit entered dip
      nearRef.current = near;
      setNearDigit(near);
      setDipGold(true);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => {
        if (nearRef.current !== null && typedRef.current.length < 15) {
          setTyped(p => p + String(DIGITS[nearRef.current]));
        }
        holdTimer.current = null;
      }, 400);
    } else if (near === null && prev !== null) {
      // Digit left dip
      nearRef.current = null;
      setNearDigit(null);
      setDipGold(false);
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    }
  }, [checkDip]);

  // Spring back to 0 using requestAnimationFrame
  const springBack = useCallback(() => {
    springRunning.current = true;
    const start = rot.current;
    const duration = Math.min(800, Math.abs(start) * 200 + 200); // proportional
    const startTime = Date.now();

    const step = () => {
      if (!springRunning.current) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      rot.current = start * (1 - eased);
      setRotVal(rot.current);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        rot.current = 0;
        setRotVal(0);
        springRunning.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (visible) {
      setTyped(''); setPhase('dial'); setMobileData(null); setReading(''); setRevealLevel(0);
      resultOpacity.setValue(0); dipVibrateX.setValue(0);
      rot.current = 0; setRotVal(0);
      springRunning.current = false;
      nearRef.current = null; setNearDigit(null); setDipGold(false);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      springRunning.current = false;
      if (vibrateAnim.current) vibrateAnim.current.stop();
      if (holdTimer.current) clearTimeout(holdTimer.current);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // PanResponder — exact same physics as Vedic wheel
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      springRunning.current = false; // stop any spring animation
      lastAng.current = Math.atan2(
        e.nativeEvent.locationY - DIAL_R,
        e.nativeEvent.locationX - DIAL_R
      );
    },
    onPanResponderMove: (e) => {
      const a = Math.atan2(
        e.nativeEvent.locationY - DIAL_R,
        e.nativeEvent.locationX - DIAL_R
      );
      let d = a - lastAng.current;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      rot.current += d;
      setRotVal(rot.current);
      lastAng.current = a;

      // Check dip detection inline
      updateDip(rot.current);
    },
    onPanResponderRelease: () => {
      // Clear dip state
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      nearRef.current = null;
      setNearDigit(null);
      setDipGold(false);

      // Spring back to 0
      springBack();
    },
  })).current;

  const handleSend = useCallback(async () => {
    if (typed.length < 4) return;
    setPhase('sending');
    vibrateAnim.current = Animated.loop(Animated.sequence([
      Animated.timing(dipVibrateX, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: -3, duration: 40, useNativeDriver: true }),
      Animated.timing(dipVibrateX, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.delay(250),
    ]));
    vibrateAnim.current.start();
    try {
      const r = await fetch(`${API_BASE}/mobile-number`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: typed,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setMobileData(data.mobile_data || null);
      setReading(data.reading || '');
    } catch (e) { console.log('Mobile err:', e); }
    if (vibrateAnim.current) vibrateAnim.current.stop();
    dipVibrateX.setValue(0);
    setPhase('result'); setRevealLevel(0);
    Animated.timing(resultOpacity, { toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
  }, [typed, kundliData]);

  const reveal = useCallback(() => {
    LayoutAnimation.configureNext({ duration: 400, create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity }, update: { type: LayoutAnimation.Types.easeInEaseOut } });
    setRevealLevel(prev => prev + 1);
  }, []);

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
              {/* Rotary Dial */}
              <View style={[ds.dialWrap, { width: DIAL_SIZE, height: DIAL_SIZE }]}>
                <Svg width={DIAL_SIZE} height={DIAL_SIZE} style={StyleSheet.absoluteFill}>
                  <SvgCircle cx={DIAL_R} cy={DIAL_R} r={ORBIT_R + NUM_SIZE / 2 + 6} stroke={W(0.04)} strokeWidth={0.5} fill="none" />
                  <SvgCircle cx={DIAL_R} cy={DIAL_R} r={ORBIT_R - NUM_SIZE / 2 - 2} stroke={W(0.03)} strokeWidth={0.3} fill="none" strokeDasharray="3,8" />
                </Svg>

                {/* Dip circle — fixed at bottom */}
                <Animated.View style={[ds.dipCircle, {
                  left: DIAL_R + ORBIT_R * Math.cos(BOTTOM) - DIP_R,
                  top: DIAL_R + ORBIT_R * Math.sin(BOTTOM) - DIP_R,
                  width: DIP_R * 2, height: DIP_R * 2, borderRadius: DIP_R,
                  borderColor: dipGold ? GOLD : W(0.12),
                  transform: [{ translateX: dipVibrateX }],
                }]}>
                  {phase === 'sending' && <View style={ds.dipDot} />}
                </Animated.View>

                {/* Digit nodes — positioned from rotVal state */}
                {DIGITS.map((digit, i) => {
                  const angle = BASE_ANGLES[i] + rotVal;
                  const x = DIAL_R + ORBIT_R * Math.cos(angle) - NUM_SIZE / 2;
                  const y = DIAL_R + ORBIT_R * Math.sin(angle) - NUM_SIZE / 2;
                  const isNear = nearDigit === i;

                  return (
                    <View key={digit} style={[ds.digitNode, {
                      left: x, top: y, width: NUM_SIZE, height: NUM_SIZE, borderRadius: NUM_SIZE / 2,
                      borderColor: isNear ? GOLD : W(0.06),
                      backgroundColor: isNear ? `${GOLD}10` : W(0.01),
                    }]}>
                      <Text style={[ds.digitText, isNear && { color: GOLD }]}>{digit}</Text>
                    </View>
                  );
                })}

                {/* Touch zone */}
                <View {...pan.panHandlers} style={[ds.touchZone, { width: DIAL_SIZE, height: DIAL_SIZE }]} />
              </View>

              {/* Typed number */}
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
                {phase === 'sending' && <Text style={ds.sendingText}>ringing...</Text>}
              </View>
            </>
          )}

          {/* Results — Progressive Disclosure */}
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

              {revealLevel === 0 && <RevealCTA text="What this number means for you" onPress={reveal} />}

              {revealLevel >= 1 && (
                <>
                  <View style={[rs.verdictBadge, { borderColor: `${VC[mobileData.verdict] || '#888'}40`, backgroundColor: `${VC[mobileData.verdict] || '#888'}08` }]}>
                    <Text style={[rs.verdictText, { color: VC[mobileData.verdict] || '#888' }]}>{mobileData.verdict}{mobileData.is_aligned ? ' · aligned' : ''}</Text>
                  </View>
                  <View style={rs.insightRow}>
                    <View style={rs.insightBox}><Text style={rs.insightLabel}>dominant</Text><Text style={rs.insightValue}>{mobileData.dominant_digit}</Text><Text style={rs.insightVibe}>{mobileData.dominant_vibe}</Text></View>
                    <View style={rs.insightDivider} />
                    <View style={rs.insightBox}><Text style={rs.insightLabel}>last digit</Text><Text style={rs.insightValue}>{mobileData.last_digit}</Text><Text style={rs.insightVibe}>{mobileData.last_vibe}</Text></View>
                  </View>
                </>
              )}

              {revealLevel === 1 && reading && <RevealCTA text="The full reading" onPress={reveal} />}

              {revealLevel >= 2 && reading && (
                <Text style={rs.readingText}>{reading}</Text>
              )}

              <Text style={rs.ownerLine}>your numbers: {mobileData.owner_mulank} · {mobileData.owner_bhagyank}</Text>
            </Animated.View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const ctaS = StyleSheet.create({
  ctaTouch: { marginVertical: 20 },
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: W(0.10), paddingVertical: 18, paddingHorizontal: 22 },
  ctaText: { fontFamily: 'PlayfairDisplay', fontSize: 16, lineHeight: 22, color: W(0.85), fontStyle: 'italic', flex: 1, marginRight: 14 },
  ctaArrow: { fontSize: 16, color: W(0.3), fontWeight: '200' },
});
const ds = StyleSheet.create({
  dialWrap: { alignSelf: 'center', marginTop: 24 },
  touchZone: { position: 'absolute', top: 0, left: 0, zIndex: 5 },
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