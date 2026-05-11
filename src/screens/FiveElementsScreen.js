/**
 * FIVE ELEMENTS WHEEL
 *
 * 5 elements in production cycle: Wood → Fire → Earth → Metal → Water.
 * Spin → bottom dip = selected → element "hangs" with pendulum swing.
 * Reading: personal relationship + remedies + image spaces.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const ELEMENTS = [
  { id: 'Wood',  glyph: '木', color: '#4A8C5C', emoji: '🌳' },
  { id: 'Fire',  glyph: '火', color: '#CC4444', emoji: '🔥' },
  { id: 'Earth', glyph: '土', color: '#B8860B', emoji: '⛰️' },
  { id: 'Metal', glyph: '金', color: '#A0A0A0', emoji: '⚔️' },
  { id: 'Water', glyph: '水', color: '#3366AA', emoji: '🌊' },
];

const COUNT = 5;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM_ANGLE = Math.PI / 2;

const WHEEL_SIZE = Math.min(SW * 0.82, 340);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 32;
const NODE_SIZE = 52;

const IMG_SPOTS = [
  { align: 'flex-end', mt: 10 },
  { align: 'flex-start', mt: 18 },
  { align: 'flex-end', mt: 14 },
  { align: 'flex-start', mt: 8 },
  { align: 'center', mt: 16 },
];

// ─── Element Node with pendulum for selected ───
function ElementNode({ element, angle, isSelected, onPress, pendulumValue }) {
  const x = WHEEL_R + ORBIT_R * Math.cos(angle) - NODE_SIZE / 2;
  const y = WHEEL_R + ORBIT_R * Math.sin(angle) - NODE_SIZE / 2;

  const distFromBottom = Math.abs(angle - BOTTOM_ANGLE);
  const normDist = Math.min(distFromBottom, 2 * Math.PI - distFromBottom);
  const baseScale = 0.7 + 0.3 * (1 - normDist / Math.PI);
  const scale = isSelected ? 1.3 : baseScale;
  const opacity = isSelected ? 1 : 0.3 + 0.4 * (1 - normDist / Math.PI);

  // Pendulum rotation for selected element
  const pendulumStyle = isSelected ? {
    transform: [
      { scale },
      { rotate: `${(pendulumValue || 0) * 8}deg` },
    ],
  } : {
    transform: [{ scale }],
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[es.node, {
        left: x, top: y, width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
        opacity,
        borderColor: isSelected ? element.color : W(0.06),
        borderWidth: isSelected ? 2 : 0.5,
        backgroundColor: isSelected ? `${element.color}18` : W(0.01),
      }, pendulumStyle]}
    >
      <Text style={[es.glyph, { color: isSelected ? element.color : W(0.35), fontSize: isSelected ? 24 : 18 }]}>
        {element.glyph}
      </Text>
      <Text style={[es.label, { color: isSelected ? W(0.7) : W(0.15) }]}>{element.id}</Text>
    </TouchableOpacity>
  );
}

// ─── Animated Wheel with production cycle lines ───
function AnimatedWheel({ rotationAngle, selectedIdx, hasSpun, onPress, pendulumValue }) {
  const [positions, setPositions] = useState(() => ELEMENTS.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP));

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => {
      setPositions(ELEMENTS.map((_, i) => BOTTOM_ANGLE + i * ANGLE_STEP + value));
    });
    return () => rotationAngle.removeListener(id);
  }, []);

  // Production cycle arrows
  const cycleLines = ELEMENTS.map((_, i) => {
    const a1 = positions[i];
    const a2 = positions[(i + 1) % COUNT];
    const x1 = WHEEL_R + (ORBIT_R - 12) * Math.cos(a1);
    const y1 = WHEEL_R + (ORBIT_R - 12) * Math.sin(a1);
    const x2 = WHEEL_R + (ORBIT_R - 12) * Math.cos(a2);
    const y2 = WHEEL_R + (ORBIT_R - 12) * Math.sin(a2);
    return (
      <Line key={`cycle-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={W(0.04)} strokeWidth={0.6} strokeDasharray="4,8" />
    );
  });

  return (
    <>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R + NODE_SIZE / 2 + 4} stroke={W(0.04)} strokeWidth={0.5} fill="none" />
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R * 0.35} stroke={W(0.02)} strokeWidth={0.3} fill="none" />
        <Circle cx={WHEEL_R} cy={WHEEL_R} r={3} fill={W(0.06)} />
        {cycleLines}
      </Svg>
      {ELEMENTS.map((e, i) => (
        <ElementNode
          key={e.id}
          element={e}
          angle={positions[i]}
          isSelected={i === selectedIdx && hasSpun}
          onPress={() => onPress(i)}
          pendulumValue={i === selectedIdx && hasSpun ? pendulumValue : 0}
        />
      ))}
    </>
  );
}


// ─── Main Component ───
export default function FiveElementsScreen({ visible, onClose, kundliData }) {
  const [elementsData, setElementsData] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [dmElement, setDmElement] = useState('');
  const [yongShen, setYongShen] = useState('');

  const rotationAngle = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const lastGestureAngle = useRef(0);
  const velocity = useRef(0);
  const decayAnim = useRef(null);
  const pendulum = useRef(new Animated.Value(0)).current;
  const [pendulumValue, setPendulumValue] = useState(0);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = rotationAngle.addListener(({ value }) => { currentRotation.current = value; });
    return () => rotationAngle.removeListener(id);
  }, []);

  // Pendulum animation
  useEffect(() => {
    if (hasSpun) {
      const swing = Animated.loop(
        Animated.sequence([
          Animated.timing(pendulum, { toValue: 1, duration: 1800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
          Animated.timing(pendulum, { toValue: -1, duration: 1800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
        ])
      );
      swing.start();
      const lid = pendulum.addListener(({ value }) => setPendulumValue(value));
      return () => { swing.stop(); pendulum.removeListener(lid); };
    }
  }, [hasSpun, selectedIdx]);

  useEffect(() => {
    if (visible) {
      setElementsData([]); setReading(null); setHasSpun(false); setSelectedIdx(0);
      currentRotation.current = 0; rotationAngle.setValue(0);
      fetchElements();
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

  const fetchElements = useCallback(async () => {
    setLoadingAll(true);
    try {
      const r = await fetch(`${API_BASE}/five-elements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }),
      });
      const data = await r.json();
      setElementsData(data.elements || []);
      setDmElement(data.day_master || '');
      setYongShen(data.yong_shen || '');
    } catch (e) { console.log('Five elements error:', e); }
    setLoadingAll(false);
  }, [kundliData]);

  const fetchReading = useCallback(async (elemName) => {
    setLoading(true); setReading(null);
    try {
      const r = await fetch(`${API_BASE}/five-elements/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element: elemName, kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }),
      });
      setReading(await r.json());
    } catch (e) { console.log('Element read error:', e); }
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
      fetchReading(ELEMENTS[closest].id);
    });
  }, [fetchReading]);

  const handlePress = useCallback((idx) => {
    if (decayAnim.current) { decayAnim.current.stop(); }
    rotationAngle.stopAnimation();
    const target = -idx * ANGLE_STEP;
    const diff = target - currentRotation.current;
    const snap = currentRotation.current + diff - Math.round(diff / (2 * Math.PI)) * 2 * Math.PI;
    Animated.spring(rotationAngle, { toValue: snap, tension: 60, friction: 10, useNativeDriver: false }).start(() => {
      currentRotation.current = snap; setSelectedIdx(idx); setHasSpun(true);
      fetchReading(ELEMENTS[idx].id);
    });
  }, [fetchReading]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
    onPanResponderGrant: (evt) => {
      if (decayAnim.current) { decayAnim.current.stop(); }
      rotationAngle.stopAnimation();
      lastGestureAngle.current = Math.atan2(evt.nativeEvent.locationY - WHEEL_R, evt.nativeEvent.locationX - WHEEL_R);
      velocity.current = 0;
    },
    onPanResponderMove: (evt) => {
      const curr = Math.atan2(evt.nativeEvent.locationY - WHEEL_R, evt.nativeEvent.locationX - WHEEL_R);
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
  const selected = ELEMENTS[selectedIdx];
  const selData = reading?.element_data || elementsData.find(e => e.element === selected?.id) || {};
  const imgSpot = IMG_SPOTS[selectedIdx % IMG_SPOTS.length];

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
          <Text style={s.title}>Five Elements</Text>
          <Text style={s.subtitle}>
            {dmElement ? `Day Master: ${dmElement} · Medicine: ${yongShen}` : 'Spin to explore'}
          </Text>

          {loadingAll ? (
            <View style={s.loadCenter}><ActivityIndicator color={GOLD} size="small" /></View>
          ) : (
            <>
              {/* Wheel */}
              <View style={[es.wheelWrap, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
                <View style={es.indicator}><View style={es.indicatorDot} /></View>
                <View {...panResponder.panHandlers} style={[es.touchZone, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
                  <AnimatedWheel rotationAngle={rotationAngle} selectedIdx={selectedIdx} hasSpun={hasSpun} onPress={handlePress} pendulumValue={pendulumValue} />
                </View>
              </View>

              {/* Reading */}
              <View style={rs.container}>
                {!hasSpun ? (
                  <View style={rs.empty}><Text style={rs.emptyText}>Spin the wheel to explore an element</Text></View>
                ) : loading ? (
                  <View style={rs.loadWrap}><ActivityIndicator color={selected.color} size="small" /><Text style={rs.loadText}>Reading {selected.id}...</Text></View>
                ) : (
                  <>
                    {/* Header */}
                    <View style={rs.header}>
                      <Text style={[rs.headerGlyph, { color: selected.color }]}>{selected.glyph}</Text>
                      <View style={rs.headerInfo}>
                        <Text style={[rs.elemName, { color: selected.color }]}>{selected.id}</Text>
                        <Text style={rs.archetype}>{selData.archetype}</Text>
                        <Text style={rs.meta}>{selData.season} · {selData.direction} · {selData.organ}</Text>
                      </View>
                    </View>

                    {/* Bar showing amount */}
                    <View style={rs.barWrap}>
                      <View style={[rs.bar, { width: `${Math.max(5, selData.percentage || 0)}%`, backgroundColor: selected.color }]} />
                      <Text style={rs.barLabel}>{selData.percentage || 0}% in your chart</Text>
                    </View>

                    {/* Relationship + need badges */}
                    <View style={rs.badges}>
                      <View style={[rs.badge, { borderColor: `${selected.color}40` }]}>
                        <Text style={[rs.badgeText, { color: selected.color }]}>{selData.relation}</Text>
                      </View>
                      <View style={[rs.badge,
                        selData.is_yong_shen && { borderColor: `${GOLD}50`, backgroundColor: `${GOLD}08` },
                        selData.is_ji_shen && { borderColor: '#CC444440', backgroundColor: '#CC444408' },
                      ]}>
                        <Text style={[rs.badgeText,
                          selData.is_yong_shen && { color: GOLD },
                          selData.is_ji_shen && { color: '#CC4444' },
                        ]}>{selData.need}</Text>
                      </View>
                      {selData.is_yong_shen && <View style={[rs.badge, { borderColor: `${GOLD}40` }]}><Text style={[rs.badgeText, { color: GOLD }]}>★ medicine</Text></View>}
                    </View>

                    {/* Image zone */}
                    <View style={[rs.imgZone, { alignSelf: imgSpot.align, marginTop: imgSpot.mt }]}>
                      <View style={[rs.imgPlaceholder, { borderColor: `${selected.color}10` }]} />
                    </View>

                    {/* LLM reading */}
                    {reading?.reading && <Text style={rs.readingText}>{reading.reading}</Text>}

                    {/* Cycle info */}
                    <View style={rs.cycleRow}>
                      <Text style={rs.cycleText}>generates {selData.generates}</Text>
                      <Text style={rs.cycleDot}>·</Text>
                      <Text style={rs.cycleText}>controls {selData.controls}</Text>
                      <Text style={rs.cycleDot}>·</Text>
                      <Text style={rs.cycleText}>fed by {selData.generated_by}</Text>
                    </View>

                    {/* Remedy */}
                    {selData.remedy && (
                      <View style={rs.remedyBox}>
                        <Text style={rs.remedyLabel}>{selData.need === 'need more' || selData.need === 'lacking' ? 'TO INCREASE' : 'TO BALANCE'}</Text>
                        <Text style={rs.remedyText}>{selData.remedy}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}


const es = StyleSheet.create({
  wheelWrap: { alignSelf: 'center', marginTop: 16, marginBottom: 8 },
  touchZone: { position: 'absolute', top: 0, left: 0 },
  node: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glyph: { fontWeight: '300' },
  label: { fontSize: 8, marginTop: 2, letterSpacing: 0.5, fontWeight: '400' },
  indicator: { position: 'absolute', bottom: -14, left: WHEEL_R - 5, alignItems: 'center', zIndex: 10 },
  indicatorDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD, opacity: 0.4 },
});

const rs = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 24, minHeight: 200 },
  empty: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 13, color: W(0.12), letterSpacing: 1.5, fontWeight: '300' },
  loadWrap: { alignItems: 'center', paddingTop: 30, gap: 14 },
  loadText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5, fontWeight: '300' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  headerGlyph: { fontSize: 44, fontWeight: '200' },
  headerInfo: { flex: 1 },
  elemName: { fontFamily: 'PlayfairDisplay', fontSize: 26, letterSpacing: 0.5 },
  archetype: { fontSize: 12, color: W(0.25), marginTop: 3, fontWeight: '300', letterSpacing: 1 },
  meta: { fontSize: 11, color: W(0.15), marginTop: 3, fontWeight: '300' },

  barWrap: { height: 20, borderRadius: 10, backgroundColor: W(0.02), marginBottom: 16, justifyContent: 'center', overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10, opacity: 0.3 },
  barLabel: { fontSize: 10, color: W(0.3), textAlign: 'center', letterSpacing: 0.5, fontWeight: '400' },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  badge: { borderWidth: 0.5, borderColor: W(0.08), borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, color: W(0.4), fontWeight: '400', letterSpacing: 0.3 },

  imgZone: { marginBottom: 14 },
  imgPlaceholder: { width: 65, height: 65, borderRadius: 12, borderWidth: 0.5, backgroundColor: W(0.005) },

  readingText: { fontSize: 15, color: W(0.7), lineHeight: 25, fontWeight: '300', marginBottom: 20 },

  cycleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  cycleText: { fontSize: 11, color: W(0.2), fontWeight: '300', letterSpacing: 0.3 },
  cycleDot: { fontSize: 11, color: W(0.08) },

  remedyBox: { borderWidth: 0.5, borderColor: W(0.04), borderRadius: 10, padding: 16, backgroundColor: W(0.008) },
  remedyLabel: { fontSize: 8, color: W(0.1), letterSpacing: 3, fontWeight: '600', marginBottom: 8 },
  remedyText: { fontSize: 13, color: W(0.5), lineHeight: 21, fontWeight: '300' },
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
  subtitle: { fontSize: 11, color: W(0.15), textAlign: 'center', marginTop: 6, letterSpacing: 1, fontWeight: '300' },
  loadCenter: { alignItems: 'center', paddingTop: 60 },
});
