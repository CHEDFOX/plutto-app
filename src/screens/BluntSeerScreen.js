/**
 * THE BLUNT SEER
 * 
 * Blank screen → tap anywhere → gold particles spawn at tap point,
 * collide with each other in a small space → roast fades in.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const PARTICLE_COUNT = 12;


// ─── Colliding Particle System ───
function ParticleSystem({ originX, originY, active }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      size: 4 + Math.random() * 5,
    }))
  ).current;

  useEffect(() => {
    if (!active || originX == null) return;

    // Spawn particles and make them bounce around a small area
    particles.forEach((p, i) => {
      const delay = i * 40;
      const radius = 20 + Math.random() * 35;

      // Fade in
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.6 + Math.random() * 0.4, duration: 200, useNativeDriver: true }),
          Animated.spring(p.scale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]),
      ]).start();

      // Continuous bouncing
      const bounce = () => {
        const angle = Math.random() * 2 * Math.PI;
        const dist = radius * (0.3 + Math.random() * 0.7);
        const nx = Math.cos(angle) * dist;
        const ny = Math.sin(angle) * dist;
        const dur = 400 + Math.random() * 600;

        Animated.parallel([
          Animated.timing(p.x, { toValue: nx, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
          Animated.timing(p.y, { toValue: ny, duration: dur, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
        ]).start(({ finished }) => {
          if (finished && active) bounce();
        });
      };

      setTimeout(bounce, delay + 200);
    });

    return () => {
      particles.forEach(p => {
        p.x.stopAnimation();
        p.y.stopAnimation();
      });
    };
  }, [active, originX, originY]);

  // Fade out when roast arrives
  const fadeOut = useCallback(() => {
    particles.forEach((p, i) => {
      Animated.sequence([
        Animated.delay(i * 30),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0.15, duration: 800, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  // Expose fadeOut
  useEffect(() => {
    if (active === 'fading') fadeOut();
  }, [active]);

  if (!originX || !active) return null;

  return (
    <View style={[ps.particleField, { left: originX, top: originY }]} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            ps.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}
      {/* Central glow */}
      <View style={ps.centralGlow} />
    </View>
  );
}


// ─── Main Component ───
export default function BluntSeerScreen({ visible, onClose, kundliData }) {
  const [phase, setPhase] = useState('blank'); // blank → tapped → loading → roast
  const [tapPos, setTapPos] = useState(null);
  const [roast, setRoast] = useState('');
  const [seerData, setSeerData] = useState(null);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const roastOpacity = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPhase('blank');
      setTapPos(null);
      setRoast('');
      setSeerData(null);
      roastOpacity.setValue(0);
      hintOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Show hint after delay
        setTimeout(() => {
          Animated.timing(hintOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
        }, 1000);
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleTap = useCallback((evt) => {
    if (phase !== 'blank') return;

    const { locationX, locationY } = evt.nativeEvent;
    setTapPos({ x: locationX, y: locationY });
    setPhase('tapped');

    // Fade out hint
    Animated.timing(hintOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();

    // Fetch roast
    fetchRoast();
  }, [phase, kundliData]);

  const fetchRoast = useCallback(async () => {
    setPhase('loading');
    try {
      const r = await fetch(`${API_BASE}/blunt-seer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setRoast(data.roast || '');
      setSeerData(data.seer_data || null);
      setPhase('roast');

      // Fade in roast text
      Animated.timing(roastOpacity, {
        toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true,
      }).start();
    } catch (e) {
      console.log('Blunt seer error:', e);
      setPhase('blank');
    }
  }, [kundliData]);

  if (!visible) return null;

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

        {/* Tappable area */}
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={s.tapZone}>

            {/* Hint text */}
            {phase === 'blank' && (
              <Animated.View style={[rs.hintWrap, { opacity: hintOpacity }]}>
                <Text style={rs.hint}>tap anywhere</Text>
                <Text style={rs.hintSub}>if you dare</Text>
              </Animated.View>
            )}

            {/* Particles */}
            <ParticleSystem
              originX={tapPos?.x}
              originY={tapPos?.y}
              active={phase === 'tapped' || phase === 'loading' ? true : phase === 'roast' ? 'fading' : false}
            />

            {/* Loading */}
            {phase === 'loading' && (
              <View style={rs.loadWrap}>
                <Text style={rs.loadText}>reading you...</Text>
              </View>
            )}

            {/* Roast */}
            {phase === 'roast' && roast && (
              <Animated.View style={[rs.roastWrap, { opacity: roastOpacity }]}>
                <Text style={rs.roastText}>{roast}</Text>

                {/* Big Three tag */}
                {seerData && (
                  <Text style={rs.tagLine}>
                    {seerData.sun} ☉ · {seerData.moon} ☽ · {seerData.rising} ↑
                  </Text>
                )}
              </Animated.View>
            )}

          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
}


// ─── Particle styles ───
const ps = StyleSheet.create({
  particleField: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 5,
  },
  particle: {
    position: 'absolute',
    backgroundColor: GOLD,
  },
  centralGlow: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    opacity: 0.08,
    left: -8,
    top: -8,
  },
});

// ─── Content styles ───
const rs = StyleSheet.create({
  hintWrap: {
    position: 'absolute',
    top: SH * 0.35,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 14,
    color: W(0.1),
    letterSpacing: 4,
    fontWeight: '300',
  },
  hintSub: {
    fontSize: 11,
    color: W(0.06),
    letterSpacing: 2,
    fontWeight: '300',
    fontStyle: 'italic',
  },

  loadWrap: {
    position: 'absolute',
    bottom: SH * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadText: {
    fontSize: 11,
    color: W(0.1),
    letterSpacing: 3,
    fontWeight: '300',
  },

  roastWrap: {
    position: 'absolute',
    top: SH * 0.12,
    left: 30,
    right: 30,
    bottom: SH * 0.08,
    justifyContent: 'center',
  },
  roastText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 19,
    color: W(0.85),
    lineHeight: 32,
    textAlign: 'center',
  },
  tagLine: {
    fontSize: 11,
    color: W(0.1),
    textAlign: 'center',
    letterSpacing: 1.5,
    fontWeight: '300',
    marginTop: 30,
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
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.06) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.15), fontWeight: '300' },
  tapZone: { flex: 1 },
});
