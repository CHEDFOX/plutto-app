/**
 * FOUR PILLARS SCREEN
 * Kama · Karma · Dharma · Moksha
 * 
 * Zigzag thread rises from bottom.
 * LEFT side: topic + one word | RIGHT side: note  (first 2)
 * RIGHT side: topic + one word | LEFT side: note  (last 2)
 * Image zones at random positions between sections.
 * Closing one-liner at the end.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, PanResponder, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const PILLAR_ORDER = ['kama', 'karma', 'dharma', 'moksha'];

const PILLAR_COLORS = {
  kama:   '#E07070',
  karma:  '#7090D0',
  dharma: '#D4AF37',
  moksha: '#A080C0',
};

const PILLAR_GLYPHS = {
  kama:   '♀',
  karma:  '♄',
  dharma: '♃',
  moksha: '☋',
};

// Image zone positions — different for each pillar
const IMAGE_POSITIONS = {
  kama:   { side: 'right', top: 8 },
  karma:  { side: 'left',  top: 20 },
  dharma: { side: 'right', top: 12 },
  moksha: { side: 'left',  top: 6 },
};


// ─── Zigzag Thread SVG ───
function ZigzagThread({ pillarCount }) {
  const w = SW - 48;
  const segH = 280;
  const totalH = pillarCount * segH + 120;
  const midX = w / 2;
  const amplitude = w * 0.28;

  let pathD = `M ${midX} ${totalH}`;

  for (let i = 0; i < pillarCount; i++) {
    const y = totalH - (i + 1) * segH;
    const prevY = totalH - i * segH;
    const direction = i % 2 === 0 ? -1 : 1;
    const cx = midX + amplitude * direction;
    const cy = (y + prevY) / 2;

    pathD += ` Q ${cx} ${cy} ${midX} ${y}`;
  }

  // Final rise to top
  pathD += ` L ${midX} 40`;

  return (
    <Svg width={w} height={totalH} style={zs.threadSvg}>
      <Path
        d={pathD}
        stroke={W(0.04)}
        strokeWidth={1}
        fill="none"
      />
      {/* Dots at each node */}
      {PILLAR_ORDER.map((_, i) => {
        const y = totalH - (i + 1) * segH;
        return (
          <Circle
            key={i}
            cx={midX}
            cy={y}
            r={3}
            fill={W(0.08)}
          />
        );
      })}
    </Svg>
  );
}


// ─── Single Pillar Node ───
function PillarNode({ pillar, reading, index, scrollY }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(index < 2 ? -40 : 40)).current;
  const [revealed, setRevealed] = useState(false);

  const isLeftTopic = index < 2;  // first 2: topic left, note right. last 2: swap
  const color = PILLAR_COLORS[pillar?.key] || GOLD;
  const glyph = PILLAR_GLYPHS[pillar?.key] || '●';
  const imgPos = IMAGE_POSITIONS[pillar?.key] || { side: 'right', top: 10 };

  useEffect(() => {
    const trigger = index * 240;
    const listenerId = scrollY.addListener(({ value }) => {
      if (value >= trigger && !revealed) {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        ]).start();
      }
    });
    // Auto-reveal first
    if (index === 0) {
      setTimeout(() => {
        setRevealed(true);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        ]).start();
      }, 500);
    }
    return () => scrollY.removeListener(listenerId);
  }, [index, revealed]);

  const word = reading?.word || pillar?.meaning || '';
  const note = reading?.note || '';

  const topicBlock = (
    <View style={[ns.topicSide, isLeftTopic ? ns.alignRight : ns.alignLeft]}>
      <Text style={[ns.glyph, { color }]}>{glyph}</Text>
      <Text style={[ns.title, { color }]}>{pillar?.title}</Text>
      <Text style={ns.word}>{word}</Text>
    </View>
  );

  const noteBlock = (
    <View style={[ns.noteSide, isLeftTopic ? ns.alignLeft : ns.alignRight]}>
      <Text style={ns.noteText}>{note}</Text>
    </View>
  );

  return (
    <Animated.View style={[ns.container, { opacity, transform: [{ translateX }] }]}>
      {/* Image zone placeholder — random position per pillar */}
      <View style={[
        ns.imageZone,
        imgPos.side === 'left' ? ns.imgLeft : ns.imgRight,
        { marginTop: imgPos.top },
      ]}>
        <View style={[ns.imgPlaceholder, { borderColor: `${color}15` }]}>
          <Text style={[ns.imgGlyph, { color: `${color}12` }]}>{glyph}</Text>
        </View>
      </View>

      {/* Content row */}
      <View style={ns.row}>
        {isLeftTopic ? (
          <>
            {topicBlock}
            <View style={[ns.threadDot, { backgroundColor: `${color}30` }]} />
            {noteBlock}
          </>
        ) : (
          <>
            {noteBlock}
            <View style={[ns.threadDot, { backgroundColor: `${color}30` }]} />
            {topicBlock}
          </>
        )}
      </View>

      {/* Subtle question */}
      <Text style={[ns.question, isLeftTopic ? ns.questionRight : ns.questionLeft]}>
        {pillar?.question}
      </Text>
    </Animated.View>
  );
}


// ─── Main Component ───
export default function FourPillarsScreen({ visible, onClose, kundliData }) {
  const [pillarsData, setPillarsData] = useState(null);
  const [readings, setReadings] = useState(null);
  const [closing, setClosing] = useState('');
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sY = useRef(new Animated.Value(0)).current;
  const sS = useRef(0);
  const sPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { sY.stopAnimation(v => { sS.current = v; }); },
    onPanResponderMove: (_, g) => { if (sS.current + g.dy >= 0) sY.setValue(sS.current + g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120 || g.vy > 0.5) Animated.timing(sY, { toValue: SH, duration: 300, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }).start(() => { sY.setValue(0); onClose(); });
      else Animated.spring(sY, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }).start();
    },
  })).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPillarsData(null);
      setReadings(null);
      setClosing('');
      scrollY.setValue(0); sY.setValue(0);
      fetchPillars();
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

  const fetchPillars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/four-pillars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setPillarsData(data.pillars_data || null);
      setReadings(data.readings || null);
      setClosing(data.readings?.closing || '');
    } catch (e) {
      console.log('Four pillars error:', e);
    }
    setLoading(false);
  }, [kundliData]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: Animated.add(slideAnim, sY) }] }]}>
        <View {...sPan.panHandlers} style={s.handleZone}><View style={s.handle} /></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.loadCenter}>
            <ActivityIndicator color={GOLD} size="small" />
            <Text style={s.loadText}>Reading your four pillars...</Text>
          </View>
        ) : pillarsData ? (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            {/* Empty title space */}
            <View style={{ height: 80 }} />

            {/* Zigzag thread (behind content) */}
            <View style={zs.threadWrap}>
              <ZigzagThread pillarCount={4} />
            </View>

            {/* Pillar nodes */}
            {PILLAR_ORDER.map((key, i) => {
              const pillar = pillarsData[key] || {};
              const reading = readings?.[key] || {};
              return (
                <PillarNode
                  key={key}
                  pillar={pillar}
                  reading={reading}
                  index={i}
                  scrollY={scrollY}
                />
              );
            })}

            {/* Closing one-liner */}
            {closing ? (
              <View style={ts.closingZone}>
                <View style={ts.closingLine} />
                <Text style={ts.closingText}>{closing}</Text>
                <View style={ts.closingLine} />
              </View>
            ) : null}

            <View style={{ height: 80 }} />
          </Animated.ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
}


// ─── Thread styles ───
const zs = StyleSheet.create({
  threadWrap: {
    position: 'absolute',
    top: 140,
    left: 24,
    right: 24,
    zIndex: 0,
  },
  threadSvg: {
    position: 'absolute',
  },
});

// ─── Node styles ───
const ns = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 50,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  topicSide: {
    flex: 1,
    gap: 4,
  },
  noteSide: {
    flex: 1.2,
    paddingTop: 8,
  },
  alignRight: { alignItems: 'flex-end' },
  alignLeft: { alignItems: 'flex-start' },
  threadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 18,
  },

  glyph: { fontSize: 28, fontWeight: '200', opacity: 0.6 },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 24,
    letterSpacing: 0.5,
  },
  word: {
    fontSize: 13,
    color: W(0.5),
    letterSpacing: 3,
    fontWeight: '300',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  noteText: {
    fontSize: 14,
    color: W(0.6),
    lineHeight: 23,
    fontWeight: '300',
  },
  question: {
    fontSize: 10,
    color: W(0.1),
    letterSpacing: 2,
    fontWeight: '400',
    marginTop: 14,
    fontStyle: 'italic',
  },
  questionRight: { textAlign: 'right', paddingRight: 20 },
  questionLeft: { textAlign: 'left', paddingLeft: 20 },

  // Image zone — reserved space, varies per pillar
  imageZone: {
    position: 'absolute',
    zIndex: -1,
  },
  imgLeft: { left: 10 },
  imgRight: { right: 10 },
  imgPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: W(0.005),
  },
  imgGlyph: {
    fontSize: 32,
    fontWeight: '100',
  },
});

// ─── Title / closing styles ───
const ts = StyleSheet.create({
  titleZone: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    zIndex: 2,
  },
  overtitle: {
    fontSize: 8,
    color: W(0.12),
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleWord: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  titleDot: {
    fontSize: 14,
    color: W(0.15),
    fontWeight: '200',
  },
  titleLine: {
    width: 40,
    height: 0.5,
    backgroundColor: GOLD,
    opacity: 0.2,
    marginTop: 16,
  },
  closingZone: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 30,
    gap: 16,
    zIndex: 2,
  },
  closingLine: {
    width: 24,
    height: 0.5,
    backgroundColor: GOLD,
    opacity: 0.25,
  },
  closingText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 17,
    color: GOLD,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.92,
    backgroundColor: '#040404', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.06),
  },
  handleZone: { alignItems: 'center', paddingTop: 8, paddingBottom: 8, zIndex: 20 },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.1) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.25), fontWeight: '300' },
  scrollContent: { paddingBottom: 40, position: 'relative' },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5, fontWeight: '300' },
});
