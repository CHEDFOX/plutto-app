/**
 * SYSTEM INFO SHEET — historical description of the active astrology system.
 * Triggered when user taps the active (centered) system name in the arc.
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions,
} from 'react-native';
import SYSTEM_INFO from '../data/systemInfo';
import { featureCache } from '../api/featureCache';

const { height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;


export default function SystemInfoSheet({ systemId, visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const staticInfo = SYSTEM_INFO[systemId] || SYSTEM_INFO.bphs;
  const cachedDescription = featureCache.getSystemInfo(systemId);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          {/* Name */}
          <Text style={s.name}>{staticInfo.name}</Text>

          {/* Origin line */}
          <View style={s.metaRow}>
            <Text style={s.metaText}>{staticInfo.origin}</Text>
            <View style={s.metaDot} />
            <Text style={s.metaText}>{staticInfo.tradition}</Text>
          </View>

          {/* Description — LLM version if available, static fallback */}
          <Text style={s.description}>
            {cachedDescription || staticInfo.description}
          </Text>

          {/* Key idea — always from static (it's the core concept) */}
          <View style={s.keyIdeaWrap}>
            <View style={s.keyIdeaBar} />
            <Text style={s.keyIdea}>{staticInfo.keyIdea}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}


const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.65,
    backgroundColor: '#080808', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.06),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.1) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.25), fontWeight: '300' },
  content: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },

  name: {
    fontFamily: 'PlayfairDisplay', fontSize: 26, fontWeight: '300',
    color: GOLD, letterSpacing: 0.5, marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  metaText: { fontSize: 11, color: W(0.25), letterSpacing: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: W(0.1) },

  description: {
    fontSize: 14, fontWeight: '300', color: W(0.55),
    lineHeight: 24, marginBottom: 28,
  },

  keyIdeaWrap: {
    flexDirection: 'row', gap: 14, paddingTop: 8,
  },
  keyIdeaBar: {
    width: 2, backgroundColor: GOLD, opacity: 0.3, borderRadius: 1,
  },
  keyIdea: {
    flex: 1, fontSize: 13, fontWeight: '300', fontStyle: 'italic',
    color: W(0.4), lineHeight: 22,
  },
});