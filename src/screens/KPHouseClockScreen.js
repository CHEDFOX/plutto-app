/**
 * KP HOUSE CLOCK
 * 
 * 12 houses in a mechanical clock face.
 * Rotate → house at 6 o'clock = selected.
 * Selected house reveals 3 layers: Life Area, Verdict, Chain.
 * Image zones at varied positions.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder,
} from 'react-native';
import Svg, { Circle, Line, G, Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const CLOCK_SIZE = Math.min(SW * 0.88, 360);
const CLOCK_R = CLOCK_SIZE / 2;
const ORBIT_R = CLOCK_R - 30;
const SEG_SIZE = 48;
const COUNT = 12;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM_ANGLE = Math.PI / 2;

const VERDICT_COLORS = {
  'Fruitful': '#50C878',
  'Barren': '#C85050',
  'Semi-fruitful': '#C89850',
  'Unknown': '#888',
};

const STRENGTH_FILL = {
  'strong': 0.12,
  'moderate': 0.06,
  'weak': 0.03,
};

// Image positions — varied per house
const IMG_OFFSETS = [
  { side: 'right', mt: 5 }, { side: 'left', mt: 18 }, { side: 'right', mt: 12 },
  { side: 'left', mt: 8 }, { side: 'right', mt: 22 }, { side: 'left', mt: 5 },
  { side: 'right', mt: 15 }, { side: 'left', mt: 10 }, { side: 'right', mt: 8 },
  { side: 'left', mt: 20 }, { side: 'right', mt: 6 }, { side: 'left', mt: 14 },
];


// ─── Clock Face SVG ───
function ClockFace() {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const r1 = ORBIT_R + (isMajor ? 14 : 10);
    const r2 = ORBIT_R + (isMajor ? 20 : 14);
    ticks.push(
      <Line
        key={`tick-${i}`}
        x1={CLOCK_R + r1 * Math.cos(angle)}
        y1={CLOCK_R + r1 * Math.sin(angle)}
        x2={CLOCK_R + r2 * Math.cos(angle)}
        y2={CLOCK_R + r2 * Math.sin(angle)}
        stroke="white"
        strokeWidth={isMajor ? 0.8 : 0.3}
        opacity={isMajor ? 0.12 : 0.04}
      />
    );
  }

  return (
    <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} style={StyleSheet.absoluteFill}>
      {/* Outer ring */}
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R + 22} stroke={W(0.06)} strokeWidth={0.5} fill="none" />
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R + 20} stroke={W(0.03)} strokeWidth={0.3} fill="none" />
      {/* Inner rings */}
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R - SEG_SIZE / 2 - 4} stroke={W(0.04)} strokeWidth={0.5} fill="none" />
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R * 0.35} stroke={W(0.02)} strokeWidth={0.3} fill="none" strokeDasharray="2,6" />
      {/* Center mechanism */}
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={6} fill={W(0.04)} stroke={W(0.08)} strokeWidth={0.5} />
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={2} fill={GOLD} opacity={0.2} />
      {/* Ticks */}
      {ticks}
    </Svg>
  );
}

// ─── Selection Indicator ───
function BottomIndicator() {
  return (
    <View style={cs.indicator}>
      <View style={cs.indicatorDiamond} />
      <View style={cs.indicatorLine} />
    </View>
  );
}

// ─── House Segment ───
function HouseSegment({ house, angle, isSelected, onPress }) {
  const x = CLOCK_R + ORBIT_R * Math.cos(angle) - SEG_SIZE / 2;
  const y = CLOCK_R + ORBIT_R * Math.sin(angle) - SEG_SIZE / 2;

  const distFromBottom = Math.abs(angle - BOTTOM_ANGLE);
  const normalizedDist = Math.min(distFromBottom, 2 * Math.PI - distFromBottom);
  const scaleFactor = isSelected ? 1.2 : 0.65 + 0.3 * (1 - normalizedDist / Math.PI);
  const opacityFactor = isSelected ? 1 : 0.25 + 0.45 * (1 - normalizedDist / Math.PI);

  const verdictColor = VERDICT_COLORS[house.verdict] || VERDICT_COLORS.Unknown;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        cs.segment,
        {
          left: x, top: y, width: SEG_SIZE, height: SEG_SIZE,
          borderRadius: SEG_SIZE / 2,
          transform: [{ scale: scaleFactor }],
          opacity: opacityFactor,
          borderColor: isSelected ? GOLD : W(0.06),
          borderWidth: isSelected ? 1.5 : 0.5,
          backgroundColor: isSelected ? `${verdictColor}${Math.round(STRENGTH_FILL[house.strength] * 255).toString(16).padStart(2, '0')}` : W(0.01),
        },
      ]}
    >
      <Text style={[cs.segNum, isSelected && { color: GOLD, fontSize: 16 }]}>{house.house}</Text>
      <Text style={[cs.segArea, isSelected && { color: W(0.6) }]} numberOfLines={1}>{house.area}</Text>
      {/* Tiny verdict dot */}
      <View style={[cs.verdictDot, { backgroundColor: verdictColor }]} />
    </TouchableOpacity>
  );
}


// ─── Animated Clock Wheel ───
function AnimatedClock({ rotationAngle, houses, selectedIndex, onHousePress }) {
  const [positions, setPositions] = useState(() => houses.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP));

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      setPositions(houses.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP + value));
    });
    return () => rotationAngle.removeListener(id);
  }, [houses.length]);

  return (
    <>
      {houses.map((h, i) => (
        <HouseSegment
          key={h.house}
          house={h}
          angle={positions[i]}
          isSelected={i === selectedIndex}
          onPress={() => onHousePress(i)}
        />
      ))}
    </>
  );
}


// ─── Main Component ───
export default function KPHouseClockScreen({ visible, onClose, kundliData }) {
  const [houses, setHouses] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [loadingRead, setLoadingRead] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const rotationAngle = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const lastGestureAngle = useRef(0);
  const velocity = useRef(0);
  const decayAnim = useRef(null);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      currentRotation.current = value;
    });
    return () => rotationAngle.removeListener(id);
  }, []);

  // Open/close
  useEffect(() => {
    if (visible) {
      setHouses([]);
      setReading(null);
      setHasInteracted(false);
      setSelectedIdx(0);
      currentRotation.current = 0;
      rotationAngle.setValue(0);
      fetchHouses();
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

  const fetchHouses = useCallback(async () => {
    setLoadingHouses(true);
    try {
      const r = await fetch(`${API_BASE}/kp-house-clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setHouses(data.houses || []);
    } catch (e) {
      console.log('KP house clock error:', e);
    }
    setLoadingHouses(false);
  }, [kundliData]);

  const fetchReading = useCallback(async (houseNum) => {
    setLoadingRead(true);
    setReading(null);
    try {
      const r = await fetch(`${API_BASE}/kp-house-clock/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          house: houseNum,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setReading(data);
    } catch (e) {
      console.log('KP read error:', e);
    }
    setLoadingRead(false);
  }, [kundliData]);

  // Snap to nearest house
  const snapToNearest = useCallback((rot) => {
    const norm = ((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let closest = 0, closestDist = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const pa = ((BOTTOM_ANGLE + i * ANGLE_STEP + norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const d = Math.min(Math.abs(pa - BOTTOM_ANGLE), 2 * Math.PI - Math.abs(pa - BOTTOM_ANGLE));
      if (d < closestDist) { closestDist = d; closest = i; }
    }
    const target = -closest * ANGLE_STEP;
    const diff = target - rot;
    const snap = rot + diff - Math.round(diff / (2 * Math.PI)) * 2 * Math.PI;

    Animated.spring(rotationAngle, {
      toValue: snap, tension: 80, friction: 12, useNativeDriver: false,
    }).start(() => {
      currentRotation.current = snap;
      setSelectedIdx(closest);
      setHasInteracted(true);
      if (houses[closest]) fetchReading(houses[closest].house);
    });
  }, [houses, fetchReading]);

  // Pan handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: (evt) => {
        if (decayAnim.current) { decayAnim.current.stop(); decayAnim.current = null; }
        rotationAngle.stopAnimation();
        const t = evt.nativeEvent;
        lastGestureAngle.current = Math.atan2(t.locationY - CLOCK_R, t.locationX - CLOCK_R);
        velocity.current = 0;
      },
      onPanResponderMove: (evt) => {
        const t = evt.nativeEvent;
        const curr = Math.atan2(t.locationY - CLOCK_R, t.locationX - CLOCK_R);
        let delta = curr - lastGestureAngle.current;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        velocity.current = delta;
        currentRotation.current += delta;
        rotationAngle.setValue(currentRotation.current);
        lastGestureAngle.current = curr;
      },
      onPanResponderRelease: () => {
        const v = velocity.current;
        if (Math.abs(v) > 0.02) {
          const target = currentRotation.current + v * 12;
          decayAnim.current = Animated.timing(rotationAngle, {
            toValue: target, duration: 700, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: false,
          });
          decayAnim.current.start(({ finished }) => { if (finished) snapToNearest(target); });
        } else {
          snapToNearest(currentRotation.current);
        }
      },
    })
  ).current;

  // Tap on house
  const handleHousePress = useCallback((idx) => {
    if (decayAnim.current) { decayAnim.current.stop(); decayAnim.current = null; }
    rotationAngle.stopAnimation();
    const target = -idx * ANGLE_STEP;
    const diff = target - currentRotation.current;
    const snap = currentRotation.current + diff - Math.round(diff / (2 * Math.PI)) * 2 * Math.PI;
    Animated.spring(rotationAngle, {
      toValue: snap, tension: 60, friction: 10, useNativeDriver: false,
    }).start(() => {
      currentRotation.current = snap;
      setSelectedIdx(idx);
      setHasInteracted(true);
      if (houses[idx]) fetchReading(houses[idx].house);
    });
  }, [houses, fetchReading]);

  if (!visible) return null;
  const selected = houses[selectedIdx] || null;

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
          <Text style={s.title}>House Clock</Text>
          <Text style={s.subtitle}>Rotate to examine each house</Text>

          {loadingHouses ? (
            <View style={s.loadCenter}><ActivityIndicator color={GOLD} size="small" /></View>
          ) : houses.length > 0 ? (
            <>
              {/* Clock */}
              <View style={[cs.clockWrap, { width: CLOCK_SIZE, height: CLOCK_SIZE }]}>
                <ClockFace />
                <BottomIndicator />
                <View {...panResponder.panHandlers} style={[cs.touchZone, { width: CLOCK_SIZE, height: CLOCK_SIZE }]}>
                  <AnimatedClock
                    rotationAngle={rotationAngle}
                    houses={houses}
                    selectedIndex={selectedIdx}
                    onHousePress={handleHousePress}
                  />
                </View>
              </View>

              {/* Reading */}
              <View style={rs.container}>
                {!hasInteracted ? (
                  <View style={rs.empty}>
                    <Text style={rs.emptyText}>Spin the clock to open a house</Text>
                  </View>
                ) : selected ? (
                  <>
                    {/* House header */}
                    <View style={rs.header}>
                      <View style={[rs.houseNum, { borderColor: VERDICT_COLORS[selected.verdict] || W(0.1) }]}>
                        <Text style={[rs.houseNumText, { color: VERDICT_COLORS[selected.verdict] }]}>{selected.house}</Text>
                      </View>
                      <View style={rs.headerInfo}>
                        <Text style={rs.areaTitle}>{selected.area}</Text>
                        <Text style={rs.governs}>{selected.governs}</Text>
                      </View>
                    </View>

                    {/* Cusp data line */}
                    <Text style={rs.cuspLine}>
                      {selected.sign} {selected.degree}° · {selected.nakshatra}
                      {selected.occupants?.length > 0 ? ` · ${selected.occupants.join(', ')}` : ''}
                    </Text>

                    {/* Image zone — varied per house */}
                    {(() => {
                      const img = IMG_OFFSETS[(selected.house - 1) % 12];
                      return (
                        <View style={[rs.imageZone, img.side === 'left' ? rs.imgLeft : rs.imgRight, { marginTop: img.mt }]}>
                          <View style={rs.imgPlaceholder} />
                        </View>
                      );
                    })()}

                    {/* ═══ THE THREE LAYERS ═══ */}

                    {loadingRead ? (
                      <View style={rs.loadWrap}>
                        <ActivityIndicator color={GOLD} size="small" />
                        <Text style={rs.loadText}>Opening house {selected.house}...</Text>
                      </View>
                    ) : reading ? (
                      <>
                        {/* Layer 1: Life Area */}
                        {reading.life_area_text ? (
                          <View style={rs.layer}>
                            <Text style={rs.layerLabel}>THE LIFE AREA</Text>
                            <Text style={rs.layerText}>{reading.life_area_text}</Text>
                          </View>
                        ) : null}

                        {/* Layer 2: Verdict */}
                        {reading.verdict_text ? (
                          <View style={rs.layer}>
                            <Text style={rs.layerLabel}>THE VERDICT</Text>
                            <View style={rs.verdictRow}>
                              <View style={[rs.verdictBadge, { backgroundColor: `${VERDICT_COLORS[selected.verdict]}15`, borderColor: `${VERDICT_COLORS[selected.verdict]}40` }]}>
                                <Text style={[rs.verdictBadgeText, { color: VERDICT_COLORS[selected.verdict] }]}>
                                  {selected.verdict} · {selected.strength}
                                </Text>
                              </View>
                            </View>
                            <Text style={rs.layerText}>{reading.verdict_text}</Text>
                          </View>
                        ) : null}

                        {/* Layer 3: The Chain */}
                        <View style={rs.layer}>
                          <Text style={rs.layerLabel}>THE CHAIN</Text>
                          <View style={rs.chainRow}>
                            <View style={rs.chainLink}>
                              <Text style={rs.chainLinkLabel}>SIGN</Text>
                              <Text style={rs.chainLinkValue}>{selected.chain?.sign_lord}</Text>
                            </View>
                            <Text style={rs.chainArrow}>→</Text>
                            <View style={rs.chainLink}>
                              <Text style={rs.chainLinkLabel}>STAR</Text>
                              <Text style={rs.chainLinkValue}>{selected.chain?.nakshatra_lord}</Text>
                            </View>
                            <Text style={rs.chainArrow}>→</Text>
                            <View style={[rs.chainLink, rs.chainLinkMain]}>
                              <Text style={[rs.chainLinkLabel, { color: GOLD, opacity: 0.5 }]}>SUB</Text>
                              <Text style={[rs.chainLinkValue, { color: GOLD }]}>{selected.chain?.sub_lord}</Text>
                            </View>
                            <Text style={rs.chainArrow}>→</Text>
                            <View style={rs.chainLink}>
                              <Text style={rs.chainLinkLabel}>SS</Text>
                              <Text style={rs.chainLinkValue}>{selected.chain?.sub_sub_lord}</Text>
                            </View>
                          </View>
                          {reading.insight_text ? (
                            <Text style={[rs.layerText, { marginTop: 14 }]}>{reading.insight_text}</Text>
                          ) : null}
                        </View>
                      </>
                    ) : null}
                  </>
                ) : null}
              </View>
            </>
          ) : null}

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}


// ─── Clock styles ───
const cs = StyleSheet.create({
  clockWrap: { alignSelf: 'center', marginTop: 16, marginBottom: 8 },
  touchZone: { position: 'absolute', top: 0, left: 0 },
  segment: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  segNum: { fontSize: 13, color: W(0.35), fontWeight: '500' },
  segArea: { fontSize: 6.5, color: W(0.18), marginTop: 1, letterSpacing: 0.3, fontWeight: '400' },
  verdictDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3, opacity: 0.5 },
  indicator: { position: 'absolute', bottom: -16, left: CLOCK_R - 6, alignItems: 'center', zIndex: 10 },
  indicatorDiamond: {
    width: 10, height: 10, backgroundColor: GOLD, opacity: 0.5,
    transform: [{ rotate: '45deg' }], borderRadius: 2,
  },
  indicatorLine: { width: 0.5, height: 10, backgroundColor: GOLD, opacity: 0.25, marginTop: 2 },
});

// ─── Reading styles ───
const rs = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 24, minHeight: 200 },
  empty: { alignItems: 'center', paddingTop: 30, gap: 12 },
  emptyText: { fontSize: 13, color: W(0.12), letterSpacing: 1.5, fontWeight: '300' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  houseNum: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: W(0.01),
  },
  houseNumText: { fontSize: 18, fontWeight: '600' },
  headerInfo: { flex: 1 },
  areaTitle: { fontFamily: 'PlayfairDisplay', fontSize: 24, color: W(0.85), letterSpacing: 0.5 },
  governs: { fontSize: 12, color: W(0.25), marginTop: 4, lineHeight: 18, fontWeight: '300' },

  cuspLine: { fontSize: 11, color: W(0.15), letterSpacing: 0.5, fontWeight: '300', marginBottom: 18 },

  // Image zone
  imageZone: { position: 'absolute', zIndex: -1 },
  imgLeft: { left: 8 },
  imgRight: { right: 8 },
  imgPlaceholder: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005),
  },

  // Layers
  layer: { marginBottom: 22 },
  layerLabel: { fontSize: 8, color: W(0.1), letterSpacing: 3, fontWeight: '600', marginBottom: 10 },
  layerText: { fontSize: 14, color: W(0.65), lineHeight: 22, fontWeight: '300' },

  // Verdict
  verdictRow: { marginBottom: 10 },
  verdictBadge: {
    alignSelf: 'flex-start', borderWidth: 0.5, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verdictBadgeText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },

  // Chain
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  chainLink: { alignItems: 'center', gap: 3 },
  chainLinkMain: {
    backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  chainLinkLabel: { fontSize: 7, color: W(0.12), letterSpacing: 2, fontWeight: '600' },
  chainLinkValue: { fontSize: 13, color: W(0.5), fontWeight: '400' },
  chainArrow: { fontSize: 12, color: W(0.08), fontWeight: '200' },

  loadWrap: { alignItems: 'center', paddingTop: 20, gap: 14 },
  loadText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5, fontWeight: '300' },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#060606', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.06),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.1) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.25), fontWeight: '300' },
  scrollContent: { paddingTop: 12, paddingBottom: 40 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 22, color: W(0.8), textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: W(0.15), textAlign: 'center', marginTop: 6, letterSpacing: 1.5, fontWeight: '300' },
  loadCenter: { alignItems: 'center', paddingTop: 60, gap: 16 },
});
