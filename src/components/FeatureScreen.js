/**
 * FEATURE SCREEN v6
 * Fixed: uses kundli_data format for chat calls, parses response field correctly.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { featureCache } from '../api/featureCache';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.12)';
const W = (a) => `rgba(255,255,255,${a})`;

const API_BASE = 'https://api.plutto.space/api/public';
const KUNDLI = { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } };


async function chatQuery(message, system = 'bphs') {
  try {
    const r = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, system, kundli_data: KUNDLI, history: [] }),
    });
    const data = await r.json();
    return data?.response || data?.detail || '';
  } catch (e) {
    return '';
  }
}


export default function FeatureScreen({ featureId, visible, onClose }) {
  const [data, setData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && featureId) {
      const cached = featureCache.get(featureId);
      setData(cached);
      setResult(null);
      setLoading(false);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      if (!cached) {
        const unsub = featureCache.subscribe(() => {
          const fresh = featureCache.get(featureId);
          if (fresh) { setData(fresh); unsub(); }
        });
        return unsub;
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, featureId]);

  if (!visible) return null;

  const reading = data?.reading || '';
  const line = data?.line || '';
  const hold = data?.hold || '';
  const anchor = data?.anchor || '';
  const math = data?.math || {};
  const thread = data?.thread || {};
  const requiresInput = math?.requires_input;
  const inputType = math?.input_type;
  const choices = math?.choices;

  const primaryText = reading && reading !== line ? reading : '';
  const secondaryText = primaryText ? '' : line;
  const contextText = primaryText ? '' : hold;

  const handleEventChoice = async (eventId) => {
    setLoading(true);
    const response = await chatQuery(
      `Analyze using KP system: Will ${eventId} happen in my life? Give a decisive yes or no first, then the evidence and timing.`,
      'kp'
    );
    setResult({ anchor: eventId.charAt(0).toUpperCase() + eventId.slice(1), reading: response });
    setLoading(false);
  };

  const handleNameSubmit = async (name) => {
    if (!name.trim()) return;
    setLoading(true);
    const response = await chatQuery(
      `Analyze the name "${name}" using Chaldean numerology. Break down the letters, give the total number, check harmony with my birth numbers, and suggest corrections if needed.`,
      'num'
    );
    setResult({ anchor: name, reading: response });
    setLoading(false);
  };

  const handleCompatibility = async (pd) => {
    setLoading(true);
    const response = await chatQuery(
      `Check my compatibility with someone born on ${pd.day}/${pd.month}/${pd.year}. Give ashtakoota score out of 36 and the key dynamics between us.`,
      'bphs'
    );
    setResult({ anchor: 'Compatibility', reading: response });
    setLoading(false);
  };

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

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            {!data ? (
              <View style={s.center}>
                <ActivityIndicator color={GOLD} size="small" />
                <Text style={s.loadingText}>Reading the sky...</Text>
              </View>
            ) : result ? (
              <>
                <Text style={s.anchor}>{result.anchor}</Text>
                <Text style={s.reading}>{result.reading}</Text>
                <TouchableOpacity style={s.resetBtn} onPress={() => setResult(null)} activeOpacity={0.7}>
                  <Text style={s.resetText}>Ask again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.anchor}>{anchor}</Text>
                {primaryText ? <Text style={s.reading}>{primaryText}</Text> : null}
                {secondaryText ? <Text style={s.line}>{secondaryText}</Text> : null}
                {contextText ? <Text style={s.hold}>{contextText}</Text> : null}

                {loading ? (
                  <View style={s.center}>
                    <ActivityIndicator color={GOLD} size="small" />
                  </View>
                ) : null}

                {!loading && requiresInput && inputType === 'event_choice' && choices ? (
                  <View style={s.choicesWrap}>
                    {choices.map((c) => (
                      <TouchableOpacity key={c.id} style={s.choiceBtn} activeOpacity={0.7} onPress={() => handleEventChoice(c.id)}>
                        <Text style={s.choiceLabel}>{c.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {!loading && requiresInput && inputType === 'name_text' ? (
                  <NameInput onSubmit={handleNameSubmit} />
                ) : null}

                {!loading && requiresInput && (inputType === 'partner_birth_data' || inputType === 'partner_birth_date') ? (
                  <PartnerInput onSubmit={handleCompatibility} />
                ) : null}

                {!loading && thread?.fragment ? (
                  <View style={s.threadZone}>
                    <View style={s.threadLine} />
                    <Text style={s.threadText}>{thread.fragment}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}


function NameInput({ onSubmit }) {
  const [name, setName] = useState('');
  return (
    <View style={s.inputWrap}>
      <TextInput
        style={s.textInput}
        placeholder="Enter a name"
        placeholderTextColor={W(0.2)}
        value={name}
        onChangeText={setName}
        onSubmitEditing={() => onSubmit(name)}
        returnKeyType="go"
        autoFocus
      />
      <TouchableOpacity
        style={[s.submitBtn, !name.trim() && s.submitBtnOff]}
        onPress={() => onSubmit(name)}
        disabled={!name.trim()}
        activeOpacity={0.7}
      >
        <Text style={s.submitText}>Analyze</Text>
      </TouchableOpacity>
    </View>
  );
}


function PartnerInput({ onSubmit }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const ok = day && month && year && year.length === 4;

  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>Partner's birth date</Text>
      <View style={s.dateRow}>
        <TextInput style={s.dateInput} placeholder="DD" placeholderTextColor={W(0.15)} value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
        <TextInput style={s.dateInput} placeholder="MM" placeholderTextColor={W(0.15)} value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} />
        <TextInput style={[s.dateInput, { flex: 1.5 }]} placeholder="YYYY" placeholderTextColor={W(0.15)} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
      </View>
      <TouchableOpacity
        style={[s.submitBtn, !ok && s.submitBtnOff]}
        onPress={() => onSubmit({ day: parseInt(day), month: parseInt(month), year: parseInt(year) })}
        disabled={!ok}
        activeOpacity={0.7}
      >
        <Text style={s.submitText}>Check compatibility</Text>
      </TouchableOpacity>
    </View>
  );
}


const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.88,
    backgroundColor: '#080808', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.06),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.1) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.25), fontWeight: '300' },
  content: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 60 },
  center: { alignItems: 'center', paddingTop: 60, gap: 16 },
  loadingText: { fontSize: 11, color: W(0.18), letterSpacing: 1.5 },

  anchor: { fontFamily: 'PlayfairDisplay', fontSize: 28, fontWeight: '300', color: GOLD, letterSpacing: 0.5, marginBottom: 20 },
  reading: { fontSize: 17, fontWeight: '300', color: W(0.85), lineHeight: 30, marginBottom: 24 },
  line: { fontSize: 16, fontWeight: '300', color: W(0.8), lineHeight: 26, marginBottom: 14 },
  hold: { fontSize: 13, fontWeight: '300', color: W(0.3), lineHeight: 22, marginBottom: 20 },

  choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  choiceBtn: { flexBasis: '47%', flexGrow: 1, borderWidth: 0.5, borderColor: W(0.08), borderRadius: 12, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  choiceLabel: { fontSize: 14, color: W(0.5), fontWeight: '300', letterSpacing: 0.5 },

  inputWrap: { marginTop: 8, gap: 14 },
  inputLabel: { fontSize: 12, color: W(0.25), letterSpacing: 0.5 },
  textInput: { borderWidth: 0.5, borderColor: W(0.1), borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: W(0.8), fontWeight: '300' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1, borderWidth: 0.5, borderColor: W(0.1), borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: W(0.8), fontWeight: '300', textAlign: 'center' },

  submitBtn: { borderWidth: 0.5, borderColor: GOLD_DIM, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.04)' },
  submitBtnOff: { opacity: 0.3 },
  submitText: { fontSize: 14, color: GOLD, fontWeight: '300', letterSpacing: 0.5 },

  resetBtn: { marginTop: 24, paddingVertical: 12, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: W(0.04) },
  resetText: { fontSize: 12, color: W(0.2), letterSpacing: 1 },

  threadZone: { alignItems: 'center', paddingTop: 28, gap: 10 },
  threadLine: { width: 0.5, height: 20, backgroundColor: W(0.06) },
  threadText: { fontSize: 11, fontStyle: 'italic', color: W(0.1), textAlign: 'center' },
});