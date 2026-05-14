/**
 * TODAY CARD — The layered card.
 *
 * Surface:  1-2 line insight + muted attribution. Nothing else.
 * Pull:     Tap or scroll → card breathes open. Explanation + strips.
 * Strips:   Contextual questions, stagger in. Tap → route to feature.
 * Cross:    "What is another tradition saying?" → secondary system.
 * Return:   Scroll up or tap surface → collapse to calm.
 *
 * All text comes from the backend. Frontend renders blindly.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API = 'https://api.plutto.space/api/public';


export default function TodayScreen({ visible, onClose, kundliData, onNavigate }) {
  // ── Data ──
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ── Animations ──
  const slideAnim   = useRef(new Animated.Value(SH)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const surfaceOp   = useRef(new Animated.Value(0)).current;
  const explainOp   = useRef(new Animated.Value(0)).current;
  const stripAnims  = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const crossOp     = useRef(new Animated.Value(0)).current;
  const depthGrad   = useRef(new Animated.Value(0)).current;  // bottom gradient hint

  // ── Open / Close ──
  useEffect(() => {
    if (visible) {
      setCard(null);
      setExpanded(false);
      resetAnims();
      fetchCard();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const resetAnims = () => {
    surfaceOp.setValue(0);
    explainOp.setValue(0);
    stripAnims.forEach(a => a.setValue(0));
    crossOp.setValue(0);
    depthGrad.setValue(0);
  };

  // ── Surface fade in after load ──
  useEffect(() => {
    if (card) {
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(surfaceOp, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      // Subtle bottom gradient hint — "there's more below"
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(depthGrad, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
    }
  }, [card]);

  // ── Expand animation ──
  useEffect(() => {
    if (expanded) {
      // Explanation fades in
      Animated.timing(explainOp, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      // Strips stagger in
      const numStrips = card?.strips?.length || 0;
      stripAnims.forEach((anim, i) => {
        if (i < numStrips) {
          Animated.sequence([
            Animated.delay(300 + i * 200),
            Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]).start();
        }
      });
      // Cross system after strips
      Animated.sequence([
        Animated.delay(300 + (numStrips * 200) + 200),
        Animated.timing(crossOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } else {
      explainOp.setValue(0);
      stripAnims.forEach(a => a.setValue(0));
      crossOp.setValue(0);
    }
  }, [expanded]);

  // ── Fetch ──
  const fetchCard = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kundli_data: kundliData }),
      });
      const data = await r.json();
      setCard(data);
    } catch (e) {
      console.log('Today fetch error:', e);
    }
    setLoading(false);
  }, [kundliData]);

  // ── Tap surface → expand ──
  const handleSurfaceTap = () => {
    if (!expanded && card) setExpanded(true);
  };

  // ── Tap strip → navigate to feature ──
  const handleStripTap = (strip) => {
    if (onNavigate) {
      onNavigate({ route: strip.route, system: strip.system, reason: strip.reason });
    }
  };

  // ── Scroll handler — collapse when scrolled back to top ──
  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    if (expanded && y <= 0) {
      setExpanded(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[st.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[st.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={st.handleWrap}><View style={st.handle} /></View>
        <TouchableOpacity style={st.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={st.closeX}>✕</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={st.loadCenter}>
            <ActivityIndicator color={W(0.15)} size="small" />
          </View>
        ) : card ? (
          <ScrollView
            style={st.scroll}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* ═══ SURFACE ═══ */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSurfaceTap}
              style={[st.surfaceWrap, !expanded && st.surfaceCentered]}
            >
              <Animated.View style={{ opacity: surfaceOp }}>
                {/* Insight */}
                <Text style={[st.insight, expanded && { opacity: 0.5 }]}>{card.surface?.insight}</Text>

                {/* Attribution */}
                <Text style={st.attribution}>{card.surface?.attribution}</Text>
              </Animated.View>
            </TouchableOpacity>

            {/* ═══ DEPTH GRADIENT HINT ═══ */}
            {!expanded && (
              <Animated.View style={[st.depthHint, { opacity: depthGrad }]}>
                <View style={st.depthLine} />
              </Animated.View>
            )}

            {/* ═══ EXPANDED LAYERS ═══ */}
            {expanded && (
              <View style={st.layers}>

                {/* ── Explanation ── */}
                <Animated.View style={[st.explainWrap, { opacity: explainOp }]}>
                  <Text style={st.explain}>{card.explanation}</Text>
                </Animated.View>

                {/* ── Strips ── */}
                {card.strips?.map((strip, i) => (
                  <Animated.View
                    key={strip.route + i}
                    style={[
                      st.stripWrap,
                      {
                        opacity: stripAnims[i],
                        transform: [{
                          translateY: stripAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={st.strip}
                      activeOpacity={0.6}
                      onPress={() => handleStripTap(strip)}
                    >
                      <Text style={st.stripText}>{strip.question}</Text>
                      <Text style={st.stripArrow}>›</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}

                {/* ── Cross-system ── */}
                {card.cross_system?.available && (
                  <Animated.View style={[st.crossWrap, { opacity: crossOp }]}>
                    <TouchableOpacity
                      style={st.crossStrip}
                      activeOpacity={0.6}
                      onPress={() => onNavigate && onNavigate({
                        route: 'cross-system-today',
                        systems: card.cross_system.systems,
                      })}
                    >
                      <Text style={st.crossText}>{card.cross_system.question}</Text>
                    </TouchableOpacity>

                    {/* Six-system teaser */}
                    {card.cross_system.six_system_label ? (
                      <TouchableOpacity
                        style={st.sixWrap}
                        activeOpacity={0.5}
                        onPress={() => onNavigate && onNavigate({
                          route: 'six-system-today',
                          systems: card.cross_system.systems,
                        })}
                      >
                        <Text style={st.sixText}>{card.cross_system.six_system_label}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </Animated.View>
                )}

                {/* Bottom breathing room */}
                <View style={{ height: 80 }} />
              </View>
            )}
          </ScrollView>
        ) : null}
      </Animated.View>
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  // ── Shell ──
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SH * 0.92,
    backgroundColor: '#040404',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.04),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.06) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeX: { fontSize: 18, color: W(0.15), fontWeight: '300' },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Surface ──
  surfaceWrap: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  surfaceCentered: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  insight: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 22,
    color: W(0.85),
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  attribution: {
    fontSize: 11,
    color: W(0.12),
    letterSpacing: 1.2,
    fontWeight: '300',
    marginTop: 20,
    textTransform: 'lowercase',
  },

  // ── Depth hint ──
  depthHint: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  depthLine: {
    width: 24,
    height: 1,
    backgroundColor: W(0.04),
    borderRadius: 1,
  },

  // ── Expanded layers ──
  layers: {
    paddingHorizontal: 32,
    paddingTop: 40,
  },

  // ── Explanation ──
  explainWrap: {
    marginBottom: 48,
  },
  explain: {
    fontSize: 15,
    color: W(0.5),
    lineHeight: 24,
    fontWeight: '300',
    letterSpacing: 0.2,
  },

  // ── Strips ──
  stripWrap: {
    marginBottom: 1,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderTopWidth: 0.5,
    borderTopColor: W(0.03),
  },
  stripText: {
    flex: 1,
    fontSize: 14,
    color: W(0.6),
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  stripArrow: {
    fontSize: 20,
    color: W(0.1),
    marginLeft: 12,
    fontWeight: '300',
  },

  // ── Cross-system ──
  crossWrap: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 0.5,
    borderTopColor: W(0.03),
  },
  crossStrip: {
    paddingVertical: 16,
  },
  crossText: {
    fontSize: 13,
    color: GOLD,
    opacity: 0.4,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  sixWrap: {
    paddingVertical: 12,
  },
  sixText: {
    fontSize: 12,
    color: W(0.15),
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});