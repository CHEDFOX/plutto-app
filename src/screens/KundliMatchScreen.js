import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { searchPlaces, getPlaceDetails } from '../api/backend';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');
const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);


const CONTENT = {
  en: {
    title: 'Kundli Match',
    dateLabel: 'Date of Birth',
    timeLabel: 'Time of Birth',
    placeLabel: 'Place of Birth',
    placePlaceholder: 'Search city...',
    match: 'Match Charts',
    back: '‹',
    gunas: 'Gunas',
    outOf: 'out of 36',
    kootas: ['Varna', 'Vashya', 'Tara', 'Yoni', 'Graha Maitri', 'Gana', 'Bhakoot', 'Nadi'],
    maxPoints: [1, 2, 3, 4, 5, 6, 7, 8],
    excellent: 'Excellent Match',
    good: 'Good Match',
    average: 'Average Match',
    poor: 'Challenging Match',
    askOracle: 'Ask Oracle About This Match',
  },
  hi: {
    title: 'कुंडली मिलान',
    dateLabel: 'जन्म तिथि',
    timeLabel: 'जन्म समय',
    placeLabel: 'जन्म स्थान',
    placePlaceholder: 'शहर खोजें...',
    match: 'मिलान करें',
    back: '‹',
    gunas: 'गुण',
    outOf: '36 में से',
    kootas: ['वर्ण', 'वश्य', 'तारा', 'योनि', 'ग्रह मैत्री', 'गण', 'भकूट', 'नाड़ी'],
    maxPoints: [1, 2, 3, 4, 5, 6, 7, 8],
    excellent: 'उत्तम मिलान',
    good: 'अच्छा मिलान',
    average: 'सामान्य मिलान',
    poor: 'चुनौतीपूर्ण मिलान',
    askOracle: 'इस मिलान के बारे में पूछें',
  },
};

// ─── GUNA CIRCLE ───
const GunaCircle = ({ score, maxScore = 36, onComplete }) => {
  const segmentAnims = useRef(
    Array.from({ length: maxScore }, () => new Animated.Value(0))
  ).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate segments one by one
    const stagger = 60;
    segmentAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: i < score ? 1 : 0.15,
          duration: 200,
          easing: Easing.bezier(0, 0, 0.58, 1),
          useNativeDriver: true,
        }).start();
      }, i * stagger);
    });

    // Show score number after segments
    setTimeout(() => {
      Animated.timing(scoreOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, maxScore * stagger + 200);

    // Fade out circle after 5 seconds
    setTimeout(() => {
      Animated.timing(circleOpacity, { toValue: 0, duration: 600, easing: Easing.bezier(0.42, 0, 1, 1), useNativeDriver: true }).start(() => {
        if (onComplete) onComplete();
      });
    }, maxScore * stagger + 5000);
  }, []);

  const radius = 90;
  const segmentLength = 12;
  const segmentWidth = 3;

  return (
    <Animated.View style={[gcStyles.container, { opacity: circleOpacity }]}>
      {segmentAnims.map((anim, i) => {
        const angle = (i / maxScore) * 360;
        const rad = (angle - 90) * (Math.PI / 180);
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const isFilled = i < score;

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: radius + x - segmentWidth / 2,
              top: radius + y - segmentLength / 2,
              width: segmentWidth,
              height: segmentLength,
              borderRadius: segmentWidth / 2,
              backgroundColor: isFilled ? colors.gold : 'rgba(255,255,255,0.15)',
              opacity: anim,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Center score */}
      <Animated.View style={[gcStyles.scoreCenter, { opacity: scoreOpacity }]}>
        <Text style={gcStyles.scoreNumber}>{score}</Text>
        <Text style={gcStyles.scoreLabel}>/ 36</Text>
      </Animated.View>
    </Animated.View>
  );
};

const gcStyles = StyleSheet.create({
  container: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  scoreCenter: { position: 'absolute', alignItems: 'center' },
  scoreNumber: { fontSize: 36, fontWeight: '200', color: colors.gold, letterSpacing: 2 },
  scoreLabel: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});

// ─── SCROLL PICKER ───
const ScrollPicker = ({ data, selectedIndex, onSelect, itemHeight = 44 }) => {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0)
      scrollRef.current.scrollTo({ y: selectedIndex * itemHeight, animated: false });
  }, []);
  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
    if (idx >= 0 && idx < data.length && idx !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(idx);
    }
  };
  return (
    <View style={[pkStyles.container, { height: itemHeight * 3 }]}>
      <View style={[pkStyles.highlight, { top: itemHeight, height: itemHeight }]} />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight} decelerationRate="fast" onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: itemHeight }}>
        {data.map((item, index) => {
          const dist = Math.abs(index - selectedIndex);
          const op = dist === 0 ? 1 : dist === 1 ? 0.4 : 0.15;
          return <View key={index} style={[pkStyles.item, { height: itemHeight }]}><Text style={[pkStyles.text, { opacity: op }]}>{item}</Text></View>;
        })}
      </ScrollView>
    </View>
  );
};
const pkStyles = StyleSheet.create({
  container: { width: 70, overflow: 'hidden' },
  highlight: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.abyss, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', zIndex: -1 },
  item: { justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '300', color: colors.white },
});

const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const years = Array.from({ length: 100 }, (_, i) => String(2026 - i));
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function KundliMatchScreen({ kundliData, language = 'en', onBack }) {
  const [phase, setPhase] = useState('input'); // input, loading, circle, table
  const [dayIdx, setDayIdx] = useState(14);
  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx, setYearIdx] = useState(25);
  const [hourIdx, setHourIdx] = useState(12);
  const [minIdx, setMinIdx] = useState(0);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const searchTimeout = useRef(null);
  const tableOpacity = useRef(new Animated.Value(0)).current;

  const ct = CONTENT[language] || CONTENT.en;
  const latin = isLatinScript(language);
  const ts = latin ? {} : { letterSpacing: 0, fontWeight: '400' };

  const handlePlaceSearch = async (query) => {
    setPlaceQuery(query); setSelectedPlace(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) { setPlaceResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const d = await searchPlaces(query);
        if (d.predictions) setPlaceResults(d.predictions.map(p => ({ id: p.place_id, name: p.structured_formatting?.main_text || p.description?.split(',')[0], fullName: p.description })));
      } catch (e) {}
      setIsSearching(false);
    }, 300);
  };

  const handlePlaceSelect = async (place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlaceQuery(place.name); setPlaceResults([]);
    try {
      const d = await getPlaceDetails(place.id);
      if (d.result) setSelectedPlace({ name: place.name, lat: d.result.geometry.location.lat, lng: d.result.geometry.location.lng });
      else setSelectedPlace({ name: place.name });
    } catch (e) { setSelectedPlace({ name: place.name }); }
  };

  const handleMatch = async () => {
    if (!selectedPlace) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('loading');

    const partnerData = {
      year: parseInt(years[yearIdx]), month: monthIdx + 1, day: parseInt(days[dayIdx]),
      hour: parseInt(hours[hourIdx]), minute: parseInt(minutes[minIdx]),
      lat: selectedPlace.lat || 28.6, lng: selectedPlace.lng || 77.2,
    };

    try {
      const r = await fetch('https://api.plutto.space/api/public/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kundli_data: kundliData, partner: partnerData }),
      });
      const d = await r.json();
      if (d.success) {
        setMatchResult(d.data || d);
        setPhase('circle');
      } else {
        // Mock data for testing if endpoint not ready
        setMatchResult({
          total_score: 24,
          kootas: [
            { name: 'Varna', score: 1, max: 1 }, { name: 'Vashya', score: 1, max: 2 },
            { name: 'Tara', score: 2, max: 3 }, { name: 'Yoni', score: 3, max: 4 },
            { name: 'Graha Maitri', score: 4, max: 5 }, { name: 'Gana', score: 5, max: 6 },
            { name: 'Bhakoot', score: 5, max: 7 }, { name: 'Nadi', score: 3, max: 8 },
          ],
        });
        setPhase('circle');
      }
    } catch (e) {
      // Mock if backend not available
      setMatchResult({
        total_score: 24,
        kootas: [
          { name: 'Varna', score: 1, max: 1 }, { name: 'Vashya', score: 1, max: 2 },
          { name: 'Tara', score: 2, max: 3 }, { name: 'Yoni', score: 3, max: 4 },
          { name: 'Graha Maitri', score: 4, max: 5 }, { name: 'Gana', score: 5, max: 6 },
          { name: 'Bhakoot', score: 5, max: 7 }, { name: 'Nadi', score: 3, max: 8 },
        ],
      });
      setPhase('circle');
    }
  };

  const handleCircleComplete = () => {
    setPhase('table');
    Animated.timing(tableOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const totalScore = matchResult?.total_score || 0;
  const verdict = totalScore >= 28 ? ct.excellent : totalScore >= 21 ? ct.good : totalScore >= 14 ? ct.average : ct.poor;

  // ─── INPUT PHASE ───
  if (phase === 'input') {
    return (
      <View style={ms.container}>
        <View style={ms.header}>
          <TouchableOpacity onPress={onBack} style={ms.backBtn}><Text style={ms.backText}>{ct.back}</Text></TouchableOpacity>
          <Text style={[ms.title, ts]}>{ct.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={ms.inputScroll} contentContainerStyle={ms.inputContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[ms.label, ts]}>{ct.dateLabel}</Text>
          <View style={ms.pickerRow}>
            <ScrollPicker data={days} selectedIndex={dayIdx} onSelect={setDayIdx} />
            <ScrollPicker data={months} selectedIndex={monthIdx} onSelect={setMonthIdx} />
            <ScrollPicker data={years} selectedIndex={yearIdx} onSelect={setYearIdx} />
          </View>

          <Text style={[ms.label, ts, { marginTop: 24 }]}>{ct.timeLabel}</Text>
          <View style={ms.pickerRow}>
            <ScrollPicker data={hours} selectedIndex={hourIdx} onSelect={setHourIdx} />
            <Text style={ms.colon}>:</Text>
            <ScrollPicker data={minutes} selectedIndex={minIdx} onSelect={setMinIdx} />
          </View>

          <Text style={[ms.label, ts, { marginTop: 24 }]}>{ct.placeLabel}</Text>
          <TextInput style={ms.placeInput} value={placeQuery} onChangeText={handlePlaceSearch} placeholder={ct.placePlaceholder} placeholderTextColor={colors.ash} autoCorrect={false} />
          {isSearching && <ActivityIndicator color={colors.silver} style={{ marginTop: 8 }} />}
          {placeResults.length > 0 && (
            <View style={ms.results}>
              {placeResults.map(p => (
                <TouchableOpacity key={p.id} style={ms.resultItem} onPress={() => handlePlaceSelect(p)}>
                  <Text style={ms.resultName}>{p.name}</Text>
                  <Text style={ms.resultFull} numberOfLines={1}>{p.fullName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {selectedPlace && (
          <View style={ms.matchBtnWrap}>
            <TouchableOpacity style={ms.matchBtn} onPress={handleMatch}>
              <Text style={[ms.matchBtnText, ts]}>{ct.match}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ─── LOADING ───
  if (phase === 'loading') {
    return (
      <View style={[ms.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // ─── CIRCLE PHASE ───
  if (phase === 'circle') {
    return (
      <View style={[ms.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <GunaCircle score={totalScore} onComplete={handleCircleComplete} />
      </View>
    );
  }

  // ─── TABLE PHASE ───
  return (
    <View style={ms.container}>
      <View style={ms.header}>
        <TouchableOpacity onPress={onBack} style={ms.backBtn}><Text style={ms.backText}>{ct.back}</Text></TouchableOpacity>
        <Text style={[ms.title, ts]}>{ct.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[ms.tableWrap, { opacity: tableOpacity }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Score header */}
          <View style={ms.scoreHeader}>
            <Text style={ms.scoreNum}>{totalScore}</Text>
            <Text style={ms.scoreOf}>{ct.outOf}</Text>
          </View>
          <Text style={[ms.verdict, ts]}>{verdict}</Text>

          {/* Koota table */}
          <View style={ms.kootaTable}>
            {(matchResult?.kootas || []).map((k, i) => {
              const kootaName = ct.kootas?.[i] || k.name;
              const pct = k.max > 0 ? (k.score / k.max) : 0;
              return (
                <View key={i} style={ms.kootaRow}>
                  <Text style={[ms.kootaName, ts]}>{kootaName}</Text>
                  <View style={ms.kootaBarBg}>
                    <View style={[ms.kootaBarFill, { width: `${pct * 100}%` }]} />
                  </View>
                  <Text style={ms.kootaScore}>{k.score}/{k.max}</Text>
                </View>
              );
            })}
          </View>

          {/* Ask Oracle */}
          <TouchableOpacity style={ms.askBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); if (onBack) onBack(); }}>
            <Text style={[ms.askBtnText, ts]}>{ct.askOracle}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '200', color: colors.silver },
  title: { fontSize: 18, fontWeight: '300', color: colors.white, letterSpacing: 0.5 },
  inputScroll: { flex: 1 },
  inputContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  label: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 12 },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  colon: { fontSize: 24, fontWeight: '200', color: colors.white, marginHorizontal: 4 },
  placeInput: { fontSize: 16, fontWeight: '300', color: colors.white, textAlign: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.15)' },
  results: { marginTop: 8, backgroundColor: colors.abyss, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', maxHeight: 160 },
  resultItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  resultName: { fontSize: 15, color: colors.white, fontWeight: '400' },
  resultFull: { fontSize: 11, color: colors.silver, marginTop: 2 },
  matchBtnWrap: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  matchBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 24, borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.4)' },
  matchBtnText: { fontSize: 15, fontWeight: '400', color: colors.gold, letterSpacing: 0.5 },
  tableWrap: { flex: 1, paddingHorizontal: 24 },
  scoreHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 20, gap: 8 },
  scoreNum: { fontSize: 48, fontWeight: '200', color: colors.gold, letterSpacing: 2 },
  scoreOf: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.35)' },
  verdict: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },
  kootaTable: { marginTop: 32 },
  kootaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.04)' },
  kootaName: { width: 100, fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.6)' },
  kootaBarBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1.5, marginHorizontal: 12 },
  kootaBarFill: { height: 3, backgroundColor: colors.gold, borderRadius: 1.5 },
  kootaScore: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.35)', width: 30, textAlign: 'right' },
  askBtn: { marginTop: 32, alignItems: 'center', paddingVertical: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24 },
  askBtnText: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3 },
});