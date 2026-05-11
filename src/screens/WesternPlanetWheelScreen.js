/**
 * WESTERN PLANET WHEEL
 *
 * 10 planets on a wheel. Select one → lines inside the circle
 * connect it to every other planet (colored by aspect type).
 * Reading: significance first, then aspect-by-aspect short notes.
 * Image spaces at random positions in readings.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const PLANETS = [
  { id: 'Sun',     glyph: '☉', color: '#E8A317' },
  { id: 'Moon',    glyph: '☽', color: '#C0C0C0' },
  { id: 'Mercury', glyph: '☿', color: '#70A870' },
  { id: 'Venus',   glyph: '♀', color: '#D0A0C0' },
  { id: 'Mars',    glyph: '♂', color: '#CC5544' },
  { id: 'Jupiter', glyph: '♃', color: '#CCAA33' },
  { id: 'Saturn',  glyph: '♄', color: '#5577AA' },
  { id: 'Uranus',  glyph: '⛢', color: '#40B0B0' },
  { id: 'Neptune', glyph: '♆', color: '#7080CC' },
  { id: 'Pluto',   glyph: '♇', color: '#886666' },
];

const COUNT = PLANETS.length;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM_ANGLE = Math.PI / 2;

const WHEEL_SIZE = Math.min(SW * 0.85, 350);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 30;
const NODE_SIZE = 40;

const ASPECT_COLORS = {
  conjunction: '#FFFFFF',
  opposition:  '#CC4444',
  trine:       '#44AA44',
  square:      '#CC4444',
  sextile:     '#4488CC',
  quincunx:    '#AA8844',
};

const IMG_SPOTS = [
  { align: 'flex-end', mt: 8 }, { align: 'flex-start', mt: 16 },
  { align: 'flex-end', mt: 12 }, { align: 'flex-start', mt: 6 },
  { align: 'center', mt: 14 }, { align: 'flex-end', mt: 10 },
  { align: 'flex-start', mt: 18 }, { align: 'center', mt: 8 },
  { align: 'flex-end', mt: 20 }, { align: 'flex-start', mt: 12 },
];


// ─── Aspect Lines inside wheel ───
function AspectLines({ aspects, selectedIdx, rotation }) {
  if (!aspects || aspects.length === 0 || selectedIdx === null) return null;

  return aspects.map((a, i) => {
    const otherIdx = PLANETS.findIndex(p => p.id === a.other_planet);
    if (otherIdx < 0) return null;

    const angle1 = BOTTOM_ANGLE + selectedIdx * ANGLE_STEP + rotation;
    const angle2 = BOTTOM_ANGLE + otherIdx * ANGLE_STEP + rotation;

    const x1 = WHEEL_R + (ORBIT_R - 8) * Math.cos(angle1);
    const y1 = WHEEL_R + (ORBIT_R - 8) * Math.sin(angle1);
    const x2 = WHEEL_R + (ORBIT_R - 8) * Math.cos(angle2);
    const y2 = WHEEL_R + (ORBIT_R - 8) * Math.sin(angle2);

    const color = ASPECT_COLORS[a.aspect] || W(0.15);
    const opacity = a.tight ? 0.4 : 0.15;
    const width = a.tight ? 1.2 : 0.6;

    return (
      <Line
        key={`asp-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} opacity={opacity}
      />
    );
  });
}


// ─── Planet Node ───
function PlanetNode({ planet, angle, isSelected, onPress }) {
  const x = WHEEL_R + ORBIT_R * Math.cos(angle) - NODE_SIZE / 2;
  const y = WHEEL_R + ORBIT_R * Math.sin(angle) - NODE_SIZE / 2;

  const distFromBottom = Math.abs(angle - BOTTOM_ANGLE);
  const normDist = Math.min(distFromBottom, 2 * Math.PI - distFromBottom);
  const scale = isSelected ? 1.25 : 0.65 + 0.3 * (1 - normDist / Math.PI);
  const opacity = isSelected ? 1 : 0.25 + 0.45 * (1 - normDist / Math.PI);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[ws.node, {
        left: x, top: y, width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
        transform: [{ scale }], opacity,
        borderColor: isSelected ? planet.color : W(0.06),
        borderWidth: isSelected ? 1.5 : 0.5,
        backgroundColor: isSelected ? `${planet.color}12` : 'transparent',
      }]}
    >
      <Text style={[ws.glyph, { color: isSelected ? planet.color : W(0.4), fontSize: isSelected ? 20 : 16 }]}>{planet.glyph}</Text>
      <Text style={[ws.label, { color: isSelected ? W(0.7) : W(0.15) }]} numberOfLines={1}>{planet.id}</Text>
    </TouchableOpacity>
  );
}


// ─── Animated Wheel ───
function AnimatedWheel({ rotationAngle, selectedIdx, hasSpun, onPress, aspects }) {
  const [rotation, setRotation] = useState(0);
  const [positions, setPositions] = useState(() => PLANETS.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP));

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      setRotation(value);
      setPositions(PLANETS.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP + value));
    });
    return () => rotationAngle.removeListener(id);
  }, []);

  return (
    <>
      {/* Aspect lines SVG */}
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R + NODE_SIZE / 2} stroke={W(0.04)} strokeWidth={0.5} fill="none" />
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R * 0.4} stroke={W(0.02)} strokeWidth={0.3} fill="none" strokeDasharray="2,6" />
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={3} fill={W(0.06)} />
        {hasSpun && selectedIdx !== null && (
          <AspectLines aspects={aspects} selectedIdx={selectedIdx} rotation={rotation} />
        )}
      </Svg>

      {/* Planet nodes */}
      {PLANETS.map((p, i) => (
        <PlanetNode
          key={p.id}
          planet={p}
          angle={positions[i]}
          isSelected={i === selectedIdx && hasSpun}
          onPress={() => onPress(i)}
        />
      ))}
    </>
  );
}


// ─── Main Component ───
export default function WesternPlanetWheelScreen({ visible, onClose, kundliData }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);

  const rotationAngle = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const lastGestureAngle = useRef(0);
  const velocity = useRef(0);
  const decayAnim = useRef(null);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => { currentRotation.current = value; });
    return () => rotationAngle.removeListener(id);
  }, []);

  useEffect(() => {
    if (visible) {
      setReading(null); setHasSpun(false); setSelectedIdx(0);
      currentRotation.current = 0; rotationAngle.setValue(0);
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

  const fetchReading = useCallback(async (planetName) => {
    setLoading(true); setReading(null);
    try {
      const r = await fetch(`${API_BASE}/western-planet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planet: planetName,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      setReading(await r.json());
    } catch (e) { console.log('Western planet error:', e); }
    setLoading(false);
  }, [kundliData]);

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
    Animated.spring(rotationAngle, { toValue: snap, tension: 80, friction: 12, useNativeDriver: false }).start(() => {
      currentRotation.current = snap; setSelectedIdx(closest); setHasSpun(true);
      fetchReading(PLANETS[closest].id);
    });
  }, [fetchReading]);

  const handlePlanetPress = useCallback((idx) => {
    if (decayAnim.current) { decayAnim.current.stop(); decayAnim.current = null; }
    rotationAngle.stopAnimation();
    const target = -idx * ANGLE_STEP;
    const diff = target - currentRotation.current;
    const snap = currentRotation.current + diff - Math.round(diff / (2 * Math.PI)) * 2 * Math.PI;
    Animated.spring(rotationAngle, { toValue: snap, tension: 60, friction: 10, useNativeDriver: false }).start(() => {
      currentRotation.current = snap; setSelectedIdx(idx); setHasSpun(true);
      fetchReading(PLANETS[idx].id);
    });
  }, [fetchReading]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
    onPanResponderGrant: (evt) => {
      if (decayAnim.current) { decayAnim.current.stop(); decayAnim.current = null; }
      rotationAngle.stopAnimation();
      const t = evt.nativeEvent;
      lastGestureAngle.current = Math.atan2(t.locationY - WHEEL_R, t.locationX - WHEEL_R);
      velocity.current = 0;
    },
    onPanResponderMove: (evt) => {
      const t = evt.nativeEvent;
      const curr = Math.atan2(t.locationY - WHEEL_R, t.locationX - WHEEL_R);
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
        decayAnim.current = Animated.timing(rotationAngle, { toValue: target, duration: 700, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: false });
        decayAnim.current.start(({ finished }) => { if (finished) snapToNearest(target); });
      } else { snapToNearest(currentRotation.current); }
    },
  })).current;

  if (!visible) return null;
  const selected = PLANETS[selectedIdx];
  const aspects = reading?.planet_data?.aspects || [];

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
          <Text style={s.title}>Your Planets</Text>
          <Text style={s.subtitle}>Spin or tap to explore</Text>

          {/* Wheel */}
          <View style={[ws.wheelWrap, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
            {/* Indicator */}
            <View style={ws.indicator}><View style={ws.indicatorTriangle} /></View>
            <View {...panResponder.panHandlers} style={[ws.touchZone, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
              <AnimatedWheel
                rotationAngle={rotationAngle}
                selectedIdx={selectedIdx}
                hasSpun={hasSpun}
                onPress={handlePlanetPress}
                aspects={aspects}
              />
            </View>
          </View>

          {/* Reading */}
          <View style={rs.container}>
            {!hasSpun ? (
              <View style={rs.empty}><Text style={rs.emptyText}>Spin the wheel to select a planet</Text></View>
            ) : loading ? (
              <View style={rs.loadWrap}><ActivityIndicator color={GOLD} size="small" /><Text style={rs.loadText}>Reading {selected.id}...</Text></View>
            ) : reading ? (
              <>
                {/* Header */}
                <View style={rs.header}>
                  <Text style={[rs.planetGlyph, { color: selected.color }]}>{selected.glyph}</Text>
                  <View style={rs.headerInfo}>
                    <Text style={rs.planetName}>{selected.id}</Text>
                    <Text style={rs.planetMeta}>
                      {reading.planet_data?.sign} · House {reading.planet_data?.house} · {reading.planet_data?.degree}°
                      {reading.planet_data?.is_retrograde ? ' · Retrograde' : ''}
                    </Text>
                    <Text style={rs.archetype}>{reading.planet_data?.archetype}</Text>
                  </View>
                </View>

                {/* Significance */}
                {reading.significance && (
                  <Text style={rs.sigText}>{reading.significance}</Text>
                )}

                {/* Aspect legend */}
                {aspects.length > 0 && (
                  <View style={rs.legendRow}>
                    {[['△ trine', '#44AA44'], ['□ square', '#CC4444'], ['☌ conj', '#FFFFFF'], ['⚹ sextile', '#4488CC']].map(([label, c]) => (
                      <Text key={label} style={[rs.legendItem, { color: c }]}>{label}</Text>
                    ))}
                  </View>
                )}

                {/* Aspect readings */}
                {reading.aspects_reading ? (
                  <View style={rs.aspectsSection}>
                    {reading.aspects_reading.split('\n').filter(l => l.trim()).map((line, i) => {
                      const asp = aspects[i];
                      const imgSpot = IMG_SPOTS[i % IMG_SPOTS.length];
                      return (
                        <View key={i} style={rs.aspectRow}>
                          {/* Aspect dot */}
                          <View style={[rs.aspectDot, { backgroundColor: asp ? ASPECT_COLORS[asp.aspect] || W(0.15) : W(0.1) }]} />
                          <View style={rs.aspectContent}>
                            <Text style={rs.aspectLine}>{line}</Text>
                            {/* Image zone at random spots — show every 3rd */}
                            {i % 3 === 1 && (
                              <View style={[rs.imgZone, { alignSelf: imgSpot.align, marginTop: imgSpot.mt }]}>
                                <View style={rs.imgPlaceholder} />
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}


const ws = StyleSheet.create({
  wheelWrap: { alignSelf: 'center', marginTop: 16, marginBottom: 8 },
  touchZone: { position: 'absolute', top: 0, left: 0 },
  node: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glyph: { fontWeight: '300' },
  label: { fontSize: 7, marginTop: 1, letterSpacing: 0.3 },
  indicator: { position: 'absolute', bottom: -16, left: WHEEL_R - 7, alignItems: 'center', zIndex: 10 },
  indicatorTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: GOLD,
    opacity: 0.5, transform: [{ rotate: '180deg' }],
  },
});

const rs = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 24, minHeight: 200 },
  empty: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 13, color: W(0.12), letterSpacing: 1.5, fontWeight: '300' },
  loadWrap: { alignItems: 'center', paddingTop: 30, gap: 14 },
  loadText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5, fontWeight: '300' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  planetGlyph: { fontSize: 38, fontWeight: '200' },
  headerInfo: { flex: 1 },
  planetName: { fontFamily: 'PlayfairDisplay', fontSize: 24, color: W(0.85), letterSpacing: 0.5 },
  planetMeta: { fontSize: 12, color: W(0.25), marginTop: 4, fontWeight: '300' },
  archetype: { fontSize: 11, color: GOLD, opacity: 0.4, marginTop: 3, letterSpacing: 1.5, fontWeight: '400' },

  sigText: { fontSize: 15, color: W(0.7), lineHeight: 25, fontWeight: '300', marginBottom: 22 },

  legendRow: { flexDirection: 'row', gap: 14, marginBottom: 18, flexWrap: 'wrap' },
  legendItem: { fontSize: 10, fontWeight: '400', letterSpacing: 0.5, opacity: 0.5 },

  aspectsSection: { gap: 14 },
  aspectRow: { flexDirection: 'row', gap: 10 },
  aspectDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, opacity: 0.6 },
  aspectContent: { flex: 1 },
  aspectLine: { fontSize: 13, color: W(0.55), lineHeight: 21, fontWeight: '300' },

  imgZone: { marginTop: 6, marginBottom: 4 },
  imgPlaceholder: { width: 60, height: 60, borderRadius: 10, borderWidth: 0.5, borderColor: W(0.02), backgroundColor: W(0.005) },
});

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
  title: { fontFamily: 'PlayfairDisplay', fontSize: 22, color: W(0.8), textAlign: 'center' },
  subtitle: { fontSize: 11, color: W(0.15), textAlign: 'center', marginTop: 6, letterSpacing: 1.5, fontWeight: '300' },
});
