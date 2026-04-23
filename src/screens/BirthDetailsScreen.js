import React, { useState, useRef, useEffect } from 'react';
import { saveBirthData } from '../api/userService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { searchPlaces, getPlaceDetails } from '../api/backend';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);


const STEPS = {
  DATE: 'date',
  TIME: 'time',
  PLACE: 'place',
};

const CONTENT = {
  en: {
    date: { title: 'When Did You Arrive\nOn Earth?' },
    time: { title: 'What Time Did\nThe Stars Witness?' },
    place: { title: 'Where Did You Take\nYour First Breath?', placeholder: 'Search City...' },
    continue: 'Continue',
  },
  hi: {
    date: { title: 'आप धरती पर\nकब आए थे?' },
    time: { title: 'तारों ने आपको\nकिस समय देखा?' },
    place: { title: 'आपने पहली सांस\nकहाँ ली?', placeholder: 'शहर खोजें...' },
    continue: 'आगे बढ़ें',
  },
  zh: {
    date: { title: '你何时\n降临人间？' },
    time: { title: '星辰在何时\n见证了你？' },
    place: { title: '你在哪里\n吸入第一口气？', placeholder: '搜索城市...' },
    continue: '继续',
  },
  es: {
    date: { title: '¿Cuándo llegaste\na la Tierra?' },
    time: { title: '¿Qué momento\npresenciaron los astros?' },
    place: { title: '¿Dónde tomaste\ntu primer aliento?', placeholder: 'Buscar ciudad...' },
    continue: 'Continuar',
  },
  pt: {
    date: { title: 'Quando você\nchegou à Terra?' },
    time: { title: 'Que momento os\nastros testemunharam?' },
    place: { title: 'Onde você deu\nseu primeiro suspiro?', placeholder: 'Buscar cidade...' },
    continue: 'Continuar',
  },
  ja: {
    date: { title: 'いつこの世に\n降り立ちましたか？' },
    time: { title: '星が見届けた\nその瞬間は？' },
    place: { title: '最初の息を\nどこで吸いましたか？', placeholder: '都市を検索...' },
    continue: '続ける',
  },
};

const ScrollPicker = ({ data, selectedIndex, onSelect, itemHeight = 50 }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      scrollRef.current.scrollToOffset({ offset: selectedIndex * itemHeight, animated: false });
    }
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    if (index >= 0 && index < data.length && index !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(index);
    }
  };

  const renderItem = ({ item, index }) => {
    const distance = Math.abs(index - selectedIndex);
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.15;
    const isCenter = distance === 0;
    return (
      <View style={[styles.pickerItem, { height: itemHeight }]}>
        <Text style={[styles.pickerText, { opacity }, isCenter && styles.pickerTextSelected]}>{item}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.pickerContainer, { height: itemHeight * 5 }]}>
      <View style={[styles.pickerHighlight, { top: itemHeight * 2, height: itemHeight }]} />
      <FlatList
        ref={scrollRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: itemHeight * 2 }}
        getItemLayout={(data, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
      />
    </View>
  );
};

const generateDays = () => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const generateMonths = () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const generateYears = () => Array.from({ length: 100 }, (_, i) => String(2026 - i));
const generateHours = () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const generateMinutes = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function BirthDetailsScreen({ onComplete, onBack, language = 'en' }) {
  const [step, setStep] = useState(STEPS.DATE);
  const [dayIndex, setDayIndex] = useState(14);
  const [monthIndex, setMonthIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(25);
  const [hourIndex, setHourIndex] = useState(12);
  const [minuteIndex, setMinuteIndex] = useState(0);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const searchTimeout = useRef(null);
  const content = CONTENT[language] || CONTENT.en;
  const latin = isLatinScript(language);
  const textStyle = latin ? {} : { letterSpacing: 0, fontWeight: '400' };

  const days = generateDays();
  const months = generateMonths();
  const years = generateYears();
  const hours = generateHours();
  const minutes = generateMinutes();

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const handleDateContinue = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); animateTransition(() => setStep(STEPS.TIME)); };
  const handleTimeContinue = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); animateTransition(() => setStep(STEPS.PLACE)); };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === STEPS.DATE && onBack) { onBack(); }
    else if (step === STEPS.TIME) { animateTransition(() => setStep(STEPS.DATE)); }
    else if (step === STEPS.PLACE) { animateTransition(() => setStep(STEPS.TIME)); }
  };

  const handlePlaceSearch = async (query) => {
    setPlaceQuery(query);
    setSelectedPlace(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) { setPlaceResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchPlaces(query);
        if (data.predictions) {
          setPlaceResults(data.predictions.map(p => ({ id: p.place_id, name: p.structured_formatting?.main_text || p.description?.split(",")[0], fullName: p.description })));
        }
      } catch (error) { console.error('Places search error:', error); }
      setIsSearching(false);
    }, 300);
  };

  const handlePlaceSelect = async (place) => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlaceQuery(place.name);
    setPlaceResults([]);
    try {
      const data = await getPlaceDetails(place.id);
      if (data.result) {
        setSelectedPlace({ id: place.id, name: place.name, fullName: place.fullName, lat: data.result.geometry.location.lat, lng: data.result.geometry.location.lng });
      }
    } catch (error) {
      console.error('Place details error:', error);
      setSelectedPlace({ id: place.id, name: place.name, fullName: place.fullName });
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const birthData = { date: { day: days[dayIndex], month: months[monthIndex], monthIndex: monthIndex + 1, year: years[yearIndex] }, time: { hour: hours[hourIndex], minute: minutes[minuteIndex] }, place: selectedPlace };
    await saveBirthData(birthData);
    if (onComplete) onComplete(birthData);
  };

  const renderDate = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}><Text style={styles.backArrow}>‹</Text></TouchableOpacity>
      <Text style={[styles.title, textStyle]}>{content.date.title}</Text>
      <View style={styles.datePickerRow}>
        <ScrollPicker data={days} selectedIndex={dayIndex} onSelect={setDayIndex} />
        <ScrollPicker data={months} selectedIndex={monthIndex} onSelect={setMonthIndex} />
        <ScrollPicker data={years} selectedIndex={yearIndex} onSelect={setYearIndex} />
      </View>
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.continueButton} onPress={handleDateContinue}><Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{content.continue}</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderTime = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}><Text style={styles.backArrow}>‹</Text></TouchableOpacity>
      <Text style={[styles.title, textStyle]}>{content.time.title}</Text>
      <View style={styles.timePickerRow}>
        <ScrollPicker data={hours} selectedIndex={hourIndex} onSelect={setHourIndex} />
        <Text style={styles.timeSeparator}>:</Text>
        <ScrollPicker data={minutes} selectedIndex={minuteIndex} onSelect={setMinuteIndex} />
      </View>
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.continueButton} onPress={handleTimeContinue}><Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{content.continue}</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderPlace = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}><Text style={styles.backArrow}>‹</Text></TouchableOpacity>
      <Text style={[styles.title, textStyle]}>{content.place.title}</Text>
      <TextInput style={styles.searchInput} value={placeQuery} onChangeText={handlePlaceSearch} placeholder={content.place.placeholder} placeholderTextColor={colors.ash} autoCorrect={false} />
      {isSearching && <ActivityIndicator color={colors.silver} style={styles.loader} />}
      {placeResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {placeResults.map((place) => (
            <TouchableOpacity key={place.id} style={styles.resultItem} onPress={() => handlePlaceSelect(place)}>
              <Text style={styles.resultName}>{place.name}</Text>
              <Text style={styles.resultFullName} numberOfLines={1}>{place.fullName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.bottomSection}>
        {selectedPlace && <TouchableOpacity style={styles.continueButton} onPress={handleComplete}><Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{content.continue}</Text></TouchableOpacity>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === STEPS.DATE && renderDate()}
        {step === STEPS.TIME && renderTime()}
        {step === STEPS.PLACE && renderPlace()}
      </Animated.View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, step === STEPS.DATE && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === STEPS.TIME && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === STEPS.PLACE && styles.progressDotActive]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  stepContainer: { flex: 1, paddingTop: SCREEN_HEIGHT * 0.12 },
  backButton: { position: 'absolute', top: 50, left: 0, padding: spacing.md, zIndex: 10 },
  backArrow: { fontSize: 32, fontWeight: '200', color: colors.silver },
  title: { fontSize: 24, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 0.8, lineHeight: 36, marginTop: spacing.xxl },
  datePickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  timePickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  timeSeparator: { fontSize: 32, fontWeight: '200', color: colors.white, marginHorizontal: spacing.sm },
  pickerContainer: { width: 80, overflow: 'hidden' },
  pickerHighlight: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.abyss, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)', zIndex: -1 },
  pickerItem: { justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: 20, fontWeight: '300', color: colors.white, letterSpacing: 0.3 },
  pickerTextSelected: { color: '#D4AF37', fontWeight: '500', fontSize: 22, textShadowColor: 'rgba(212,175,55,0.5)', textShadowRadius: 8 },
  searchInput: { fontSize: 17, fontWeight: '300', color: colors.gold, textAlign: 'center', paddingVertical: spacing.lg, marginTop: spacing.xl, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.15)', letterSpacing: 0.3 },
  loader: { marginTop: spacing.md },
  resultsContainer: { marginTop: spacing.md, backgroundColor: colors.abyss, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 200 },
  resultItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  resultName: { fontSize: 16, color: colors.white, fontWeight: '400' },
  resultFullName: { fontSize: 12, color: colors.silver, marginTop: 2 },
  bottomSection: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  continueButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  continueText: { fontSize: 16, fontWeight: '400', color: colors.gold, letterSpacing: 0.5 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 50, gap: spacing.sm },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ash },
  progressDotActive: { backgroundColor: colors.white },
});