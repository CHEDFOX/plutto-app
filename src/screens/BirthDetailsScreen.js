import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanResponder,
} from 'react-native';
import { searchPlaces, getPlaceDetails } from '../api/backend';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';
import RemoteMedia from '../components/RemoteMedia';

const { width: SW, height: SH } = Dimensions.get('window');

const STEPS = { IDENTITY: 'identity', COMBINED: 'combined', PLACE: 'place', LOADING: 'loading' };

const GENDERS = ['male', 'female', 'other'];

const ROW_HEIGHT = 32;
const VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const WHEEL_COL_WIDTH = 76;

const TITLE_TOP = SH * 0.10;
const TOP_PAD = SH * 0.36;
const SECTION_GAP = SH * 0.14;
const CONTINUE_Y = SH * 0.88;

const DATE_WHEEL_TOP = TOP_PAD - WHEEL_HEIGHT / 2;
const TIME_WHEEL_TOP = TOP_PAD + WHEEL_HEIGHT / 2 + SECTION_GAP;

const WOBBLE_BASE_DELAY = 1500;
const WOBBLE_STAGGER = 180;
const WOBBLE_DISTANCE = ROW_HEIGHT * 0.7;
const WOBBLE_HALF_MS = 320;

const EDGE_SWIPE_ZONE = 28;
const EDGE_SWIPE_THRESHOLD = 60;

const LOADING_MIN_MS = 5500;

const BLOCKED_MOMENT = { year: 2002, month: 3, day: 23, hour: 6, minute: 45 };

const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = Array.from({ length: CURRENT_YEAR }, (_, i) => String(i + 1));
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const DEFAULTS = {
  dayIndex: 14,
  monthIndex: 0,
  yearIndex: 1999,
  hourIndex: 12,
  minuteIndex: 0,
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const WheelPicker = ({
  data, selectedIndex, onSelect, touched, onTouch, placeholderLabel, wobbleDelay,
  width = WHEEL_COL_WIDTH,
}) => {
  const ref = useRef(null);
  const isProgrammatic = useRef(false);
  const wobbleTimer = useRef(null);
  const wobbleBackTimer = useRef(null);
  const touchedRef = useRef(touched);
  const scrollY = useRef(new Animated.Value(selectedIndex * ROW_HEIGHT)).current;

  useEffect(() => { touchedRef.current = touched; }, [touched]);

  useEffect(() => {
    if (ref.current && selectedIndex >= 0) {
      ref.current.scrollToOffset({ offset: selectedIndex * ROW_HEIGHT, animated: false });
    }
    wobbleTimer.current = setTimeout(() => {
      if (touchedRef.current || !ref.current) return;
      isProgrammatic.current = true;
      const base = selectedIndex * ROW_HEIGHT;
      ref.current.scrollToOffset({ offset: base + WOBBLE_DISTANCE, animated: true });
      wobbleBackTimer.current = setTimeout(() => {
        if (!ref.current) return;
        ref.current.scrollToOffset({ offset: base, animated: true });
        setTimeout(() => { isProgrammatic.current = false; }, WOBBLE_HALF_MS);
      }, WOBBLE_HALF_MS);
    }, wobbleDelay);
    return () => {
      if (wobbleTimer.current) clearTimeout(wobbleTimer.current);
      if (wobbleBackTimer.current) clearTimeout(wobbleBackTimer.current);
    };
  }, []);

  const handleBeginDrag = () => { if (!touchedRef.current) onTouch(); };

  const handleMomentumEnd = (e) => {
    if (isProgrammatic.current) return;
    const offset = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offset / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (clamped !== selectedIndex) {
      Haptics.selectionAsync().catch(() => {});
      onSelect(clamped);
    }
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 2) * ROW_HEIGHT, (index - 1) * ROW_HEIGHT, index * ROW_HEIGHT,
      (index + 1) * ROW_HEIGHT, (index + 2) * ROW_HEIGHT,
    ];
    const rotateX = scrollY.interpolate({
      inputRange,
      outputRange: ['58deg', '30deg', '0deg', '-30deg', '-58deg'],
      extrapolate: 'clamp',
    });
    const scale = scrollY.interpolate({
      inputRange, outputRange: [0.62, 0.86, 1, 0.86, 0.62], extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange, outputRange: [0.08, 0.42, 1, 0.42, 0.08], extrapolate: 'clamp',
    });

    const isCenter = index === selectedIndex;
    const showPlaceholder = isCenter && !touched;

    return (
      <Animated.View style={[
        styles.row, { width, height: ROW_HEIGHT },
        { opacity, transform: [{ perspective: 600 }, { rotateX }, { scale }] },
      ]}>
        <Text style={[
          styles.rowText,
          isCenter && !showPlaceholder && styles.rowSelected,
          showPlaceholder && styles.rowPlaceholder,
        ]}>
          {showPlaceholder ? placeholderLabel : item}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={{ width, height: WHEEL_HEIGHT, overflow: 'hidden' }}>
      <AnimatedFlatList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, i) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * i, index: i })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: ROW_HEIGHT }}
      />
    </View>
  );
};

export default function BirthDetailsScreen({
  onComplete, onBack, prepareApp, content, loadingMediaPath,
}) {
  const [step, setStep] = useState(STEPS.IDENTITY);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);

  const [dayIndex, setDayIndex] = useState(DEFAULTS.dayIndex);
  const [monthIndex, setMonthIndex] = useState(DEFAULTS.monthIndex);
  const [yearIndex, setYearIndex] = useState(DEFAULTS.yearIndex);
  const [hourIndex, setHourIndex] = useState(DEFAULTS.hourIndex);
  const [minuteIndex, setMinuteIndex] = useState(DEFAULTS.minuteIndex);

  const [touched, setTouched] = useState({ day: false, month: false, year: false, hour: false, minute: false });

  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const searchTimeout = useRef(null);

  const markTouched = useCallback((key) => {
    setTouched((prev) => prev[key] ? prev : { ...prev, [key]: true });
  }, []);

  const allTouched = touched.day && touched.month && touched.year && touched.hour && touched.minute;

  const isBlockedMoment =
    allTouched &&
    Number(YEARS[yearIndex]) === BLOCKED_MOMENT.year &&
    monthIndex === BLOCKED_MOMENT.month &&
    Number(DAYS[dayIndex]) === BLOCKED_MOMENT.day &&
    Number(HOURS[hourIndex]) === BLOCKED_MOMENT.hour &&
    Number(MINUTES[minuteIndex]) === BLOCKED_MOMENT.minute;

  const canContinueCombined = allTouched && !isBlockedMoment;

  const animateTransition = (cb) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleCombinedContinue = () => {
    if (!canContinueCombined) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    animateTransition(() => setStep(STEPS.PLACE));
  };

  const canContinueIdentity = name.trim().length >= 1 && gender !== null;

  const handleIdentityContinue = () => {
    if (!canContinueIdentity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    animateTransition(() => setStep(STEPS.COMBINED));
  };

  const handleGenderTap = (g) => {
    Haptics.selectionAsync().catch(() => {});
    setGender(g);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step === STEPS.IDENTITY && onBack) { onBack(); return; }
    if (step === STEPS.COMBINED) { animateTransition(() => setStep(STEPS.IDENTITY)); return; }
    if (step === STEPS.PLACE) { animateTransition(() => setStep(STEPS.COMBINED)); }
  };

  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;

  const edgeSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) => {
        const startX = e.nativeEvent.pageX - g.dx;
        return (
          startX < EDGE_SWIPE_ZONE &&
          g.dx > 8 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5
        );
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > EDGE_SWIPE_THRESHOLD) handleBackRef.current();
      },
      onPanResponderTerminate: (_, g) => {
        if (g.dx > EDGE_SWIPE_THRESHOLD) handleBackRef.current();
      },
    })
  ).current;

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
          setPlaceResults(data.predictions.map(p => ({
            id: p.place_id,
            name: p.structured_formatting?.main_text || p.description?.split(',')[0],
            fullName: p.description,
          })));
        }
      } catch (err) { console.error('[birth/search]', err); }
      setIsSearching(false);
    }, 300);
  };

  const handlePlaceSelect = async (place) => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlaceQuery(place.name);
    setPlaceResults([]);
    try {
      const data = await getPlaceDetails(place.id);
      if (data.result) {
        setSelectedPlace({
          id: place.id, name: place.name, fullName: place.fullName,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        });
      }
    } catch (err) {
      console.error('[birth/details]', err);
      setSelectedPlace({ id: place.id, name: place.name, fullName: place.fullName });
    }
  };

  const handleComplete = async () => {
    if (!selectedPlace) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const birthData = {
      name: name.trim(),
      gender,
      date: {
        day: DAYS[dayIndex], month: MONTHS[monthIndex],
        monthIndex: monthIndex + 1, year: YEARS[yearIndex],
      },
      time: { hour: HOURS[hourIndex], minute: MINUTES[minuteIndex] },
      place: selectedPlace,
    };
    await saveBirthData(birthData);
    setStep(STEPS.LOADING);
    const [prepResult] = await Promise.all([
      prepareApp ? Promise.resolve(prepareApp(birthData)).catch(() => null) : Promise.resolve(null),
      new Promise((r) => setTimeout(r, LOADING_MIN_MS)),
    ]);
    if (onComplete) onComplete(birthData, prepResult);
  };

  const renderIdentity = () => (
    <View style={styles.stepRoot}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{content.identityTitle}</Text>

      <View style={styles.identityBlock}>
        <TextInput
          style={styles.identityNameInput}
          value={name}
          onChangeText={setName}
          placeholder={content.namePlaceholder}
          placeholderTextColor="rgba(255,255,255,0.22)"
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          returnKeyType="next"
        />

        <View style={styles.genderRow}>
          {GENDERS.map((g) => {
            const label = g === 'male' ? content.genderMale
              : g === 'female' ? content.genderFemale
              : content.genderOther;
            const selected = gender === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => handleGenderTap(g)}
                style={[styles.genderBtn, selected && styles.genderBtnSelected]}
                activeOpacity={0.7}
              >
                <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.continueWrap, { top: CONTINUE_Y - 22 }]}>
        <TouchableOpacity
          onPress={handleIdentityContinue}
          activeOpacity={canContinueIdentity ? 0.6 : 1}
          style={styles.continueBtn}
        >
          <Text style={[styles.continueText, !canContinueIdentity && styles.continueTextMuted]}>
            {content.continue}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCombined = () => (
    <View style={styles.stepRoot}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{content.combinedTitle}</Text>

      <View style={[styles.wheelRow, { top: DATE_WHEEL_TOP }]}>
        <WheelPicker data={DAYS} selectedIndex={dayIndex} onSelect={setDayIndex}
          touched={touched.day} onTouch={() => markTouched('day')}
          placeholderLabel={content.labels.day}
          wobbleDelay={WOBBLE_BASE_DELAY + WOBBLE_STAGGER * 0} />
        <WheelPicker data={MONTHS} selectedIndex={monthIndex} onSelect={setMonthIndex}
          touched={touched.month} onTouch={() => markTouched('month')}
          placeholderLabel={content.labels.month}
          wobbleDelay={WOBBLE_BASE_DELAY + WOBBLE_STAGGER * 1} />
        <WheelPicker data={YEARS} selectedIndex={yearIndex} onSelect={setYearIndex}
          touched={touched.year} onTouch={() => markTouched('year')}
          placeholderLabel={content.labels.year}
          wobbleDelay={WOBBLE_BASE_DELAY + WOBBLE_STAGGER * 2} />
      </View>

      <View style={[styles.wheelRow, { top: TIME_WHEEL_TOP }]}>
        <WheelPicker data={HOURS} selectedIndex={hourIndex} onSelect={setHourIndex}
          touched={touched.hour} onTouch={() => markTouched('hour')}
          placeholderLabel={content.labels.hour}
          wobbleDelay={WOBBLE_BASE_DELAY + WOBBLE_STAGGER * 3} />
        <Text style={styles.colon}>:</Text>
        <WheelPicker data={MINUTES} selectedIndex={minuteIndex} onSelect={setMinuteIndex}
          touched={touched.minute} onTouch={() => markTouched('minute')}
          placeholderLabel={content.labels.minute}
          wobbleDelay={WOBBLE_BASE_DELAY + WOBBLE_STAGGER * 4} />
      </View>

      <View style={[styles.continueWrap, { top: CONTINUE_Y - 22 }]}>
        <TouchableOpacity
          onPress={handleCombinedContinue}
          activeOpacity={canContinueCombined ? 0.6 : 1}
          style={styles.continueBtn}
        >
          <Text style={[styles.continueText, !canContinueCombined && styles.continueTextMuted]}>
            {content.continue}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlace = () => (
    <View style={styles.stepRoot}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{content.placeTitle}</Text>

      <View style={{ position: 'absolute', top: SH * 0.42, left: 0, right: 0, paddingHorizontal: spacing.xl }}>
        <TextInput
          style={styles.searchInput}
          value={placeQuery}
          onChangeText={handlePlaceSearch}
          placeholder={content.placePlaceholder}
          placeholderTextColor={colors.ash}
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator color={colors.silver} style={{ marginTop: spacing.md }} />}
        {placeResults.length > 0 && (
          <View style={styles.results}>
            {placeResults.map((p) => (
              <TouchableOpacity key={p.id} style={styles.resultItem} onPress={() => handlePlaceSelect(p)}>
                <Text style={styles.resultName}>{p.name}</Text>
                <Text style={styles.resultFull} numberOfLines={1}>{p.fullName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.continueWrap, { top: CONTINUE_Y - 22 }]}>
        {selectedPlace && (
          <TouchableOpacity onPress={handleComplete} style={styles.continueBtn} activeOpacity={0.6}>
            <Text style={[styles.continueText, styles.continueTextBright]}>
              {content.continue}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.stepRoot}>
      <View style={styles.loadingCenter}>
        {loadingMediaPath && <RemoteMedia path={loadingMediaPath} size={180} loop fadeIn />}
      </View>
    </View>
  );

  if (!content) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container} {...edgeSwipeResponder.panHandlers}>
      <Animated.View style={[styles.fadeWrap, { opacity: fadeAnim }]}>
        {step === STEPS.IDENTITY && renderIdentity()}
        {step === STEPS.COMBINED && renderCombined()}
        {step === STEPS.PLACE && renderPlace()}
        {step === STEPS.LOADING && renderLoading()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  fadeWrap: { flex: 1 },
  stepRoot: { flex: 1 },

  backBtn: { position: 'absolute', top: 50, left: 0, padding: spacing.md, zIndex: 10 },
  backArrow: { fontSize: 30, fontWeight: '200', color: colors.silver },

  title: {
    position: 'absolute',
    top: TITLE_TOP,
    left: 0, right: 0,
    fontSize: 20, fontWeight: '200',
    color: colors.white, textAlign: 'center',
    letterSpacing: 1.2, lineHeight: 30,
    paddingHorizontal: spacing.xl,
  },

  wheelRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    height: WHEEL_HEIGHT,
  },

  row: { justifyContent: 'center', alignItems: 'center' },
  rowText: {
    fontSize: 15, fontWeight: '300', color: colors.white,
    letterSpacing: 0.5, textAlign: 'center',
  },
  rowSelected: { fontSize: 14, fontWeight: '200', color: colors.gold },
  rowPlaceholder: {
    fontSize: 11, fontWeight: '500', color: '#FFFFFF', letterSpacing: 2,
  },

  colon: {
    fontSize: 22, fontWeight: '200', color: colors.silver,
    marginHorizontal: spacing.xs,
  },

  continueWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  continueBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  continueText: {
    fontSize: 12, fontWeight: '500', color: '#FFFFFF', letterSpacing: 3,
  },
  continueTextMuted: { color: 'rgba(255,255,255,0.18)' },
  continueTextBright: { color: '#FFFFFF' },

  searchInput: {
    fontSize: 13, fontWeight: '300', color: colors.white, textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.15)',
    letterSpacing: 1,
  },
  results: {
    marginTop: spacing.md, backgroundColor: colors.abyss,
    borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 220,
  },
  resultItem: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultName: { fontSize: 15, color: colors.white, fontWeight: '300' },
  resultFull: { fontSize: 11, color: colors.silver, marginTop: 2 },

  identityBlock: {
    position: 'absolute',
    top: SH * 0.30,
    left: 0, right: 0,
    paddingHorizontal: spacing.xl,
    alignItems: 'stretch',
  },
  identityNameInput: {
    fontSize: 18, fontWeight: '300',
    color: colors.white, textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.18)',
    letterSpacing: 0.4,
  },
  genderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.xl, gap: spacing.sm,
  },
  genderBtn: {
    flex: 1, paddingVertical: spacing.md,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24, alignItems: 'center',
  },
  genderBtnSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  genderLabel: {
    fontSize: 12, fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  genderLabelSelected: { color: colors.gold },

  loadingCenter: {
    position: 'absolute',
    top: SH * 0.38, left: 0, right: 0,
    alignItems: 'center',
  },
});