import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  Animated, Easing,
} from 'react-native';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';
import { searchPlaces as apiSearchPlaces, getPlaceDetails } from '../api/backend';

const { width: SW, height: SH } = Dimensions.get('window');

const PARTNER_TYPES = [
  { id: 'life', label: 'Life Partner' },
  { id: 'companion', label: 'Companion' },
  { id: 'ally', label: 'Ally' },
  { id: 'blood', label: 'Blood' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 100 }, (_, i) => String(2026 - i));
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));


// ─── Continue — line + circle, pulsing, gold drop on tap ───
const SubmitLine = ({ onPress, disabled }) => {
  const dotY = useRef(new Animated.Value(0)).current;
  const dotColor = useRef(new Animated.Value(0)).current;
  const dotOp = useRef(new Animated.Value(1)).current;
  const lineOp = useRef(new Animated.Value(1)).current;
  const pulseOp = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (disabled) { pulseOp.setValue(0.4); return; }
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulseOp, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(pulseOp, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [disabled]);

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(dotColor, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(dotY, { toValue: SH * 0.5, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(dotOp, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(lineOp, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => { if (onPress) onPress(); });
  };

  const borderColor = dotColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.6)', '#D4AF37'],
  });
  const bgColor = dotColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#D4AF37'],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} disabled={disabled} style={{ alignItems: 'center', paddingVertical: 16, opacity: disabled ? 0.15 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={{ width: 50, height: 0.5, backgroundColor: 'rgba(255,255,255,0.5)', opacity: lineOp }} />
        <Animated.View style={{
          width: 8, height: 8, borderRadius: 4,
          borderWidth: 1, borderColor: borderColor,
          backgroundColor: bgColor,
          marginLeft: 3,
          opacity: dotOp,
          transform: [{ translateY: dotY }],
        }} />
      </View>
    </TouchableOpacity>
  );
};


// ─── Compact scroll picker (ScrollView, not FlatList — avoids nesting error) ───
const Picker = ({ data, selectedIndex, onSelect, width = 64, itemHeight = 44 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && selectedIndex >= 0) {
      setTimeout(() => {
        ref.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false });
      }, 50);
    }
  }, []);

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
    if (idx >= 0 && idx < data.length && idx !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(idx);
    }
  };

  return (
    <View style={[s.picker, { width, height: itemHeight * 3 }]}>
      <View style={[s.pickerHL, { top: itemHeight, height: itemHeight }]} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: itemHeight }}
      >
        {data.map((item, index) => {
          const d = Math.abs(index - selectedIndex);
          const isSelected = d === 0;
          return (
            <View key={index} style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[
                s.pickerText,
                { opacity: isSelected ? 1 : d === 1 ? 0.3 : 0.08 },
                isSelected && s.pickerTextSelected,
              ]}>{item}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};


export default function BirthInputFlow({ onComplete, showPartnerType = false, language = 'en' }) {
  const [partnerType, setPartnerType] = useState('life');
  const [dayIdx, setDayIdx] = useState(14);
  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx, setYearIdx] = useState(25);
  const [hourIdx, setHourIdx] = useState(12);
  const [minIdx, setMinIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [place, setPlace] = useState(null);
  const [searching, setSearching] = useState(false);
  const timeout = useRef(null);
  const scrollRef = useRef(null);

  const searchPlaces = (q) => {
    setQuery(q);
    setPlace(null);
    if (timeout.current) clearTimeout(timeout.current);
    if (q.length < 3) { setResults([]); return; }
    timeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const d = await apiSearchPlaces(q);
        setResults((d.predictions || []).map(p => ({
          id: p.place_id,
          name: p.structured_formatting?.main_text || p.description.split(',')[0],
          full: p.description,
        })));
      } catch (e) { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const selectPlace = async (p) => {
    Keyboard.dismiss();
    try {
      const d = await getPlaceDetails(p.id);
      const loc = d.result?.geometry?.location;
      if (loc) {
        setPlace({ name: p.full, lat: loc.lat, lng: loc.lng });
        setQuery(p.name);
        setResults([]);
      }
    } catch (e) {}
  };

  const canSubmit = place !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete({
      year: parseInt(YEARS[yearIdx]),
      month: monthIdx + 1,
      day: parseInt(DAYS[dayIdx]),
      hour: parseInt(HOURS[hourIdx]),
      minute: parseInt(MINUTES[minIdx]),
      lat: place.lat,
      lng: place.lng,
      place: place.name,
      partnerType: showPartnerType ? partnerType : undefined,
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
      <ScrollView
        ref={scrollRef}
        style={s.root}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Partner Type */}
        {showPartnerType && (
          <View style={s.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeScroll}>
              {PARTNER_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.pill, partnerType === t.id && s.pillActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPartnerType(t.id); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pillText, partnerType === t.id && s.pillTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Date */}
        <View style={s.section}>
          
          <View style={s.pickerRow}>
            <Picker data={DAYS} selectedIndex={dayIdx} onSelect={setDayIdx} width={56} />
            <Picker data={MONTHS} selectedIndex={monthIdx} onSelect={setMonthIdx} width={68} />
            <Picker data={YEARS} selectedIndex={yearIdx} onSelect={setYearIdx} width={72} />
          </View>
        </View>

        {/* Time */}
        <View style={s.section}>
          
          <View style={s.pickerRow}>
            <Picker data={HOURS} selectedIndex={hourIdx} onSelect={setHourIdx} width={56} />
            <Text style={s.colon}>:</Text>
            <Picker data={MINUTES} selectedIndex={minIdx} onSelect={setMinIdx} width={56} />
          </View>
        </View>

        {/* Place */}
        <View style={s.section}>
          <TextInput
            style={[s.placeInput, place && s.placeInputSelected]}
            value={query}
            onChangeText={searchPlaces}
            placeholder={t('searchCity', language)}
            placeholderTextColor="rgba(255,255,255,0.35)"
            autoCorrect={false}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
          />
          {searching && <ActivityIndicator color="rgba(255,255,255,0.2)" style={{ marginTop: 8 }} />}
          {results.length > 0 && (
            <View style={s.resultBox}>
              {results.slice(0, 4).map(p => (
                <TouchableOpacity key={p.id} style={s.resultItem} onPress={() => selectPlace(p)}>
                  <Text style={s.resultName}>{p.name}</Text>
                  <Text style={s.resultFull} numberOfLines={1}>{p.full}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit */}
        <View style={s.submitWrap}>
          <SubmitLine onPress={handleSubmit} disabled={!canSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'space-evenly', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },

  section: { },
  label: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '300', fontStyle: 'italic', letterSpacing: 2.5, marginBottom: 12, textAlign: 'center' },

  // Partner pills
  typeScroll: { paddingHorizontal: 4, gap: 0 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', marginRight: 8 },
  pillActive: { borderColor: colors.gold, backgroundColor: 'rgba(212,175,55,0.06)' },
  pillText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '300', letterSpacing: 0.5 },
  pillTextActive: { color: colors.gold },

  // Pickers
  pickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  picker: { overflow: 'hidden' },
  pickerHL: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(212,175,55,0.04)', borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.15)', zIndex: -1 },
  pickerText: { fontSize: 18, fontWeight: '200', color: '#fff', letterSpacing: 0.5 },
  pickerTextSelected: { color: '#D4AF37', fontWeight: '500', fontSize: 22, textShadowColor: 'rgba(212,175,55,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  colon: { fontSize: 24, fontWeight: '200', color: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },

  // Place
  placeInput: { fontSize: 16, fontWeight: '300', fontStyle: 'italic', color: '#fff', textAlign: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)', letterSpacing: 0.3 },
  placeInputSelected: { color: colors.gold },
  resultBox: { marginTop: 6, backgroundColor: 'rgba(10,10,14,0.95)', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)', maxHeight: 180, overflow: 'hidden' },
  resultItem: { paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.03)' },
  resultName: { fontSize: 14, color: '#fff', fontWeight: '300' },
  resultFull: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 },

  // Submit
  submitWrap: { alignItems: 'center', marginTop: 24 },
  submitBtn: { paddingHorizontal: 20, paddingVertical: 16 },
});