/**
 * BUSINESS NAME SCREEN
 *
 * Blank → text fades in about vibration → input line appears →
 * pulsing gold hollow circle (send) → sent → image arrives first →
 * reading fades in with corrections/approval.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Easing, Dimensions, ActivityIndicator, Keyboard,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const VERDICT_COLORS = {
  excellent: '#50C878',
  good: '#50C878',
  decent: '#C89850',
  weak: '#C85050',
};

const IMG_SPOTS = [
  { align: 'flex-end', mt: 0 },
  { align: 'flex-start', mt: 0 },
  { align: 'center', mt: 0 },
];


export default function BusinessNameScreen({ visible, onClose, kundliData }) {
  const [phase, setPhase] = useState('blank'); // blank → input → sending → image → result
  const [bizName, setBizName] = useState('');
  const [bizData, setBizData] = useState(null);
  const [reading, setReading] = useState('');

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(1)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(null);

  useEffect(() => {
    if (visible) {
      setPhase('blank'); setBizName(''); setBizData(null); setReading('');
      introOpacity.setValue(0); inputOpacity.setValue(0); imgOpacity.setValue(0); resultOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setPhase('input');
        Animated.stagger(500, [
          Animated.timing(introOpacity, { toValue: 1, duration: 1200, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
          Animated.timing(inputOpacity, { toValue: 1, duration: 800, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
        ]).start();

        // Start circle pulse
        pulseAnim.current = Animated.loop(
          Animated.sequence([
            Animated.timing(circleScale, { toValue: 1.12, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
            Animated.timing(circleScale, { toValue: 1, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
          ])
        );
        pulseAnim.current.start();
      });
    } else {
      if (pulseAnim.current) pulseAnim.current.stop();
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSend = useCallback(async () => {
    if (!bizName.trim() || bizName.trim().length < 2) return;
    Keyboard.dismiss();
    if (pulseAnim.current) pulseAnim.current.stop();
    setPhase('sending');

    // Fade out input area
    Animated.parallel([
      Animated.timing(introOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      Animated.timing(inputOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
    ]).start();

    try {
      const r = await fetch(`${API_BASE}/business-name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: bizName.trim(),
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setBizData(data.biz_data || null);
      setReading(data.reading || '');

      // Image arrives first
      setPhase('image');
      Animated.timing(imgOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
        // Then reading
        setTimeout(() => {
          setPhase('result');
          Animated.timing(resultOpacity, { toValue: 1, duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
        }, 500);
      });
    } catch (e) {
      console.log('Business name error:', e);
      setPhase('input');
    }
  }, [bizName, kundliData]);

  if (!visible) return null;

  const verdictColor = VERDICT_COLORS[bizData?.verdict] || W(0.3);
  const imgSpot = IMG_SPOTS[Math.abs((bizData?.biz_number || 0)) % IMG_SPOTS.length];

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

        <View style={bs.content}>
          {/* Intro text */}
          <Animated.View style={[bs.introWrap, { opacity: introOpacity }]}>
            <Text style={bs.introText}>your business name carries a vibration</Text>
            <Text style={bs.introSub}>it should be high</Text>
          </Animated.View>

          {/* Input area */}
          {(phase === 'input' || phase === 'sending') && (
            <Animated.View style={[bs.inputWrap, { opacity: inputOpacity }]}>
              <View style={bs.inputRow}>
                <TextInput
                  style={bs.input}
                  value={bizName}
                  onChangeText={setBizName}
                  placeholder="business name"
                  placeholderTextColor={W(0.08)}
                  returnKeyType="done"
                  onSubmitEditing={handleSend}
                  editable={phase === 'input'}
                  autoCapitalize="words"
                />
                <TouchableOpacity onPress={handleSend} activeOpacity={0.7} disabled={phase === 'sending'}>
                  <Animated.View style={[bs.sendCircle, { transform: [{ scale: circleScale }] }]}>
                    {phase === 'sending' ? (
                      <ActivityIndicator color={GOLD} size="small" />
                    ) : (
                      <View style={bs.sendDot} />
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Image arrives first */}
          {(phase === 'image' || phase === 'result') && (
            <Animated.View style={[bs.imgArrival, { opacity: imgOpacity, alignSelf: imgSpot.align }]}>
              <View style={{width:65,height:65,borderRadius:32,borderWidth:0.5,borderColor:"rgba(255,255,255,0.02)",backgroundColor:"rgba(255,255,255,0.005)"}} />
            </Animated.View>
          )}

          {/* Result */}
          {phase === 'result' && bizData && (
            <Animated.View style={[bs.resultWrap, { opacity: resultOpacity }]}>
              {/* Business name + number */}
              <Text style={bs.bizNameDisplay}>{bizData.business_name}</Text>
              <View style={bs.vibRow}>
                <Text style={bs.vibNumber}>{bizData.biz_number}</Text>
                <View style={bs.vibInfo}>
                  <Text style={bs.vibVibe}>{bizData.biz_vibe}</Text>
                  <Text style={bs.vibBest}>{bizData.biz_best_for}</Text>
                </View>
              </View>

              {/* Verdict */}
              <View style={[bs.verdictBadge, { borderColor: `${verdictColor}40`, backgroundColor: `${verdictColor}08` }]}>
                <Text style={[bs.verdictText, { color: verdictColor }]}>{bizData.verdict}</Text>
              </View>

              {/* Suggestions */}
              {bizData.suggestions?.length > 0 && (
                <View style={bs.sugWrap}>
                  {bizData.suggestions.map((s, i) => (
                    <View key={i} style={bs.sugItem}>
                      <Text style={bs.sugName}>{s.name}</Text>
                      <Text style={bs.sugMeta}>{s.change} · vibration {s.number}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Reading */}
              <Text style={bs.readingText}>{reading}</Text>

              {/* Owner alignment */}
              <Text style={bs.alignLine}>
                your numbers: {bizData.owner_mulank} · {bizData.owner_bhagyank}
                {bizData.is_aligned ? ' · aligned' : ' · not aligned'}
              </Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}


const bs = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 50 },

  introWrap: { alignItems: 'center', gap: 8, marginBottom: 40 },
  introText: { fontFamily: 'PlayfairDisplay', fontSize: 18, color: W(0.5), textAlign: 'center', lineHeight: 28 },
  introSub: { fontSize: 12, color: W(0.12), letterSpacing: 3, fontWeight: '300' },

  inputWrap: { marginBottom: 30 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  input: {
    flex: 1, fontSize: 20, color: W(0.8), fontWeight: '300',
    borderBottomWidth: 0.5, borderBottomColor: W(0.08),
    paddingVertical: 12, letterSpacing: 0.5,
  },
  sendCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1, borderColor: GOLD, opacity: 0.5,
    alignItems: 'center', justifyContent: 'center',
  },
  sendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD, opacity: 0.7 },

  imgArrival: { marginBottom: 20 },
  imgPlaceholder: { width: 80, height: 80, borderRadius: 14, borderWidth: 0.5, borderColor: W(0.03), backgroundColor: W(0.008) },

  resultWrap: {},
  bizNameDisplay: { fontFamily: 'PlayfairDisplay', fontSize: 26, color: W(0.85), marginBottom: 16, letterSpacing: 0.5 },
  vibRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  vibNumber: { fontSize: 36, color: W(0.15), fontWeight: '200' },
  vibInfo: { flex: 1 },
  vibVibe: { fontSize: 13, color: W(0.5), fontWeight: '300' },
  vibBest: { fontSize: 11, color: W(0.2), marginTop: 3, fontWeight: '300' },

  verdictBadge: { alignSelf: 'flex-start', borderWidth: 0.5, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 18 },
  verdictText: { fontSize: 12, fontWeight: '500', letterSpacing: 1.5 },

  sugWrap: { gap: 8, marginBottom: 20 },
  sugItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 0.5, borderColor: W(0.04), borderRadius: 10, padding: 12, backgroundColor: W(0.008),
  },
  sugName: { fontFamily: 'PlayfairDisplay', fontSize: 15, color: GOLD, opacity: 0.7 },
  sugMeta: { fontSize: 10, color: W(0.2), fontWeight: '300' },

  readingText: { fontSize: 15, color: W(0.7), lineHeight: 25, fontWeight: '300', marginBottom: 20 },

  alignLine: { fontSize: 10, color: W(0.1), letterSpacing: 1.5, fontWeight: '400', textAlign: 'center' },
});

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.9,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
});
