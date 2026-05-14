/**
 * COMPATIBILITY SECTION — Hook on main scroll.
 * Persuasive heading + short line + intimidating CTA.
 * Tapping opens CompatibilityScreen.
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';

const { height: SH } = Dimensions.get('window');
const W = (a) => `rgba(255,255,255,${a})`;

function Reveal({ visible, delay = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    if (visible) {
      opacity.setValue(0); translateY.setValue(24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 700, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 700, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function CTA({ text, onPress }) {
  const breathe = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 0.18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(breathe, { toValue: 0.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);
  const borderColor = breathe.interpolate({ inputRange: [0.08, 0.18], outputRange: [W(0.08), W(0.18)] });
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <Animated.View style={[s.ctaBox, { borderColor }]}>
        <Text style={s.ctaLabel}>{text}</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CompatibilitySection({ onOpen, onImpulse }) {
  return (
    <View style={s.container}>
      <Reveal visible={true}>
        <Text style={s.heading}>Who are you with?</Text>
      </Reveal>
      <Reveal visible={true} delay={200}>
        <Text style={s.subline}>Every connection carries a frequency. Some amplify you. Some drain you. The chart knows which.</Text>
      </Reveal>
      <Reveal visible={true} delay={500}>
        <CTA text="Find out what the sky says about them" onPress={() => { if (onImpulse) onImpulse(); if (onOpen) onOpen(); }} />
      </Reveal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28, minHeight: SH * 0.18, justifyContent: 'center' },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 30, lineHeight: 42, color: W(0.93), letterSpacing: -0.3, marginBottom: 16 },
  subline: { fontSize: 14, lineHeight: 24, color: W(0.45), fontWeight: '300', marginBottom: 32 },
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: W(0.10), paddingVertical: 20, paddingHorizontal: 24, marginBottom: 20 },
  ctaLabel: { fontFamily: 'PlayfairDisplay', fontSize: 16, lineHeight: 22, color: W(0.88), fontStyle: 'italic', flex: 1, marginRight: 16 },
  ctaArrow: { fontSize: 18, color: W(0.35), fontWeight: '200' },
});