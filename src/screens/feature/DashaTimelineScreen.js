import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import Starfield from '../../components/Starfield';

const { width: SCREEN_W } = Dimensions.get('window');

const PLANET_META = {
  Sun: { color: '#FFD700', symbol: '☉', years: 6 },
  Moon: { color: '#C0C0C0', symbol: '☽', years: 10 },
  Mars: { color: '#FF4500', symbol: '♂', years: 7 },
  Rahu: { color: '#4169E1', symbol: '☊', years: 18 },
  Jupiter: { color: '#FFA500', symbol: '♃', years: 16 },
  Saturn: { color: '#6A5ACD', symbol: '♄', years: 19 },
  Mercury: { color: '#50C878', symbol: '☿', years: 17 },
  Ketu: { color: '#8B4513', symbol: '☋', years: 7 },
  Venus: { color: '#FF69B4', symbol: '♀', years: 20 },
};

const MAHADASHAS = [
  {
    lord: 'Mars', start: '1998-03-15', end: '2005-03-15',
    meaning: 'A period of drive, ambition, and physical energy.',
    antardashas: [
      { lord: 'Mars', start: '1998-03-15', end: '1998-10-12' },
      { lord: 'Rahu', start: '1998-10-12', end: '1999-10-30' },
      { lord: 'Jupiter', start: '1999-10-30', end: '2000-10-06' },
      { lord: 'Saturn', start: '2000-10-06', end: '2001-11-14' },
      { lord: 'Mercury', start: '2001-11-14', end: '2002-11-11' },
      { lord: 'Ketu', start: '2002-11-11', end: '2003-04-10' },
      { lord: 'Venus', start: '2003-04-10', end: '2004-06-10' },
      { lord: 'Sun', start: '2004-06-10', end: '2004-10-16' },
      { lord: 'Moon', start: '2004-10-16', end: '2005-03-15' },
    ],
  },
  {
    lord: 'Rahu', start: '2005-03-15', end: '2023-03-15',
    meaning: '18 years of transformation, foreign connections, and unconventional paths.',
    antardashas: [
      { lord: 'Rahu', start: '2005-03-15', end: '2007-11-27' },
      { lord: 'Jupiter', start: '2007-11-27', end: '2010-04-22' },
      { lord: 'Saturn', start: '2010-04-22', end: '2013-02-28' },
      { lord: 'Mercury', start: '2013-02-28', end: '2015-09-16' },
      { lord: 'Ketu', start: '2015-09-16', end: '2016-10-04' },
      { lord: 'Venus', start: '2016-10-04', end: '2019-10-04' },
      { lord: 'Sun', start: '2019-10-04', end: '2020-08-28' },
      { lord: 'Moon', start: '2020-08-28', end: '2022-02-28' },
      { lord: 'Mars', start: '2022-02-28', end: '2023-03-15' },
    ],
  },
  {
    lord: 'Jupiter', start: '2023-03-15', end: '2039-03-15',
    meaning: 'Wisdom, expansion, and spiritual growth. Jupiter brings blessings in creativity and knowledge.',
    antardashas: [
      { lord: 'Jupiter', start: '2023-03-15', end: '2025-05-03' },
      { lord: 'Saturn', start: '2025-05-03', end: '2027-11-15' },
      { lord: 'Mercury', start: '2027-11-15', end: '2030-02-19' },
      { lord: 'Ketu', start: '2030-02-19', end: '2031-01-26' },
      { lord: 'Venus', start: '2031-01-26', end: '2033-09-26' },
      { lord: 'Sun', start: '2033-09-26', end: '2034-07-14' },
      { lord: 'Moon', start: '2034-07-14', end: '2035-11-14' },
      { lord: 'Mars', start: '2035-11-14', end: '2036-10-21' },
      { lord: 'Rahu', start: '2036-10-21', end: '2039-03-15' },
    ],
  },
  {
    lord: 'Saturn', start: '2039-03-15', end: '2058-03-15',
    meaning: 'Discipline, karma, and mastery. Saturn brings lessons in partnerships.',
    antardashas: [
      { lord: 'Saturn', start: '2039-03-15', end: '2042-03-18' },
      { lord: 'Mercury', start: '2042-03-18', end: '2044-11-27' },
      { lord: 'Ketu', start: '2044-11-27', end: '2046-01-06' },
      { lord: 'Venus', start: '2046-01-06', end: '2049-03-06' },
      { lord: 'Sun', start: '2049-03-06', end: '2050-02-16' },
      { lord: 'Moon', start: '2050-02-16', end: '2051-09-16' },
      { lord: 'Mars', start: '2051-09-16', end: '2052-10-25' },
      { lord: 'Rahu', start: '2052-10-25', end: '2055-09-01' },
      { lord: 'Jupiter', start: '2055-09-01', end: '2058-03-15' },
    ],
  },
];

function parseDate(str) { return new Date(str); }
function yearsBetween(a, b) { return (parseDate(b) - parseDate(a)) / (1000 * 60 * 60 * 24 * 365.25); }
function progressBetween(a, b) {
  const now = Date.now();
  const start = parseDate(a).getTime();
  const end = parseDate(b).getTime();
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}
function formatDate(str) {
  const d = parseDate(str);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getCurrentPeriod() {
  const now = new Date();
  let mahadasha = MAHADASHAS[MAHADASHAS.length - 1];
  let antardasha = mahadasha.antardashas[0];
  for (const md of MAHADASHAS) {
    if (parseDate(md.start) <= now && now <= parseDate(md.end)) {
      mahadasha = md;
      for (const ad of md.antardashas) {
        if (parseDate(ad.start) <= now && now <= parseDate(ad.end)) {
          antardasha = ad;
          break;
        }
      }
      break;
    }
  }
  return { mahadasha, antardasha };
}

const CURRENT = getCurrentPeriod();
const TOTAL_YEARS = yearsBetween(MAHADASHAS[0].start, MAHADASHAS[MAHADASHAS.length - 1].end);
const TIMELINE_BLOCK_H = 72;
const MIN_BLOCK_W = 60;

// --- DASHA BLOCK ---
function DashaBlock({ md, isActive, isExpanded, onTap, totalSpanYears }) {
  const meta = PLANET_META[md.lord] || { color: '#fff', symbol: '?' };
  const years = yearsBetween(md.start, md.end);
  const progress = isActive ? progressBetween(md.start, md.end) : 0;
  const blockW = Math.max(MIN_BLOCK_W, (years / totalSpanYears) * (SCREEN_W * 2.4));

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.8}>
      <View style={[styles.dashaBlock, {
        width: blockW,
        borderColor: isActive ? meta.color + '30' : (isExpanded ? meta.color + '20' : 'rgba(255,255,255,0.04)'),
        backgroundColor: isActive ? meta.color + '0A' : (isExpanded ? meta.color + '06' : 'rgba(255,255,255,0.015)'),
      }]}>
        {/* Symbol */}
        <Text style={[styles.dashaBlockSymbol, { color: meta.color + (isActive ? 'D0' : isExpanded ? '90' : '50') }]}>
          {meta.symbol}
        </Text>
        {/* Lord */}
        <Text style={[styles.dashaBlockLord, { color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
          {md.lord}
        </Text>
        {/* Years */}
        <Text style={[styles.dashaBlockYears, { color: isActive ? meta.color + '80' : 'rgba(255,255,255,0.2)' }]}>
          {years.toFixed(0)}y
        </Text>
        {/* Active indicator */}
        {isActive && (
          <View style={styles.dashaActiveIndicator}>
            <View style={[styles.dashaActiveDot, { backgroundColor: meta.color }]} />
          </View>
        )}
        {/* Progress fill */}
        {(isActive || isExpanded) && (
          <View style={styles.dashaProgress}>
            <View style={[styles.dashaProgressFill, {
              width: `${(isActive ? progress : 1) * 100}%`,
              backgroundColor: meta.color,
            }]} />
          </View>
        )}
        {/* Date */}
        <Text style={styles.dashaBlockDate}>{parseDate(md.start).getFullYear()}</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- ANTARDASHA DETAIL ---
function AntardashaDetail({ mahadasha, visible }) {
  if (!mahadasha) return null;
  const now = new Date();
  const meta = PLANET_META[mahadasha.lord] || { color: '#fff' };

  return (
    <View style={styles.antarSection}>
      <View style={styles.antarHeader}>
        <View style={[styles.antarColorDot, { backgroundColor: meta.color }]} />
        <Text style={styles.antarTitle}>{mahadasha.lord} Mahadasha</Text>
      </View>
      <Text style={styles.antarMeaning}>{mahadasha.meaning}</Text>

      <View style={styles.antarList}>
        {mahadasha.antardashas.map((ad, i) => {
          const adMeta = PLANET_META[ad.lord] || { color: '#fff', symbol: '?' };
          const isCurrent = parseDate(ad.start) <= now && now <= parseDate(ad.end);
          const duration = yearsBetween(ad.start, ad.end);
          const adProgress = isCurrent ? progressBetween(ad.start, ad.end) : 0;

          return (
            <View key={i} style={[styles.antarRow, isCurrent && { backgroundColor: adMeta.color + '06', borderColor: adMeta.color + '25' }]}>
              <View style={[styles.antarSymbolOrb, {
                backgroundColor: adMeta.color + (isCurrent ? '20' : '10'),
                borderColor: adMeta.color + (isCurrent ? '30' : '15'),
              }]}>
                <Text style={[styles.antarSymbol, { color: adMeta.color }]}>{adMeta.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.antarRowTop}>
                  <Text style={[styles.antarLord, { color: isCurrent ? '#fff' : 'rgba(255,255,255,0.5)' }]}>{ad.lord}</Text>
                  <Text style={[styles.antarDuration, { color: isCurrent ? adMeta.color + '90' : 'rgba(255,255,255,0.2)' }]}>
                    {duration.toFixed(1)}y
                  </Text>
                </View>
                <Text style={styles.antarDates}>{formatDate(ad.start)} — {formatDate(ad.end)}</Text>
                {isCurrent && (
                  <View style={styles.antarProgressBar}>
                    <View style={[styles.antarProgressFill, { width: `${adProgress * 100}%`, backgroundColor: adMeta.color }]} />
                  </View>
                )}
              </View>
              {isCurrent && (
                <View style={[styles.nowBadge, { backgroundColor: adMeta.color + '15', borderColor: adMeta.color + '25' }]}>
                  <Text style={[styles.nowBadgeText, { color: adMeta.color }]}>NOW</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- MAIN ---
export default function DashaTimelineScreen({ kundliData, onClose }) {
  const [expandedMd, setExpandedMd] = useState(CURRENT.mahadasha);
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;
  const timelineRef = useRef(null);

  const currentMeta = PLANET_META[CURRENT.mahadasha.lord] || { color: '#FFA500', symbol: '♃' };
  const currentAdMeta = PLANET_META[CURRENT.antardasha.lord] || { color: '#6A5ACD', symbol: '♄' };
  const mdProgress = progressBetween(CURRENT.mahadasha.start, CURRENT.mahadasha.end);

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
    // Scroll to current
    setTimeout(() => {
      const currentIdx = MAHADASHAS.indexOf(CURRENT.mahadasha);
      let offset = 0;
      for (let i = 0; i < currentIdx; i++) {
        const y = yearsBetween(MAHADASHAS[i].start, MAHADASHAS[i].end);
        offset += Math.max(MIN_BLOCK_W, (y / TOTAL_YEARS) * (SCREEN_W * 2.4)) + 8;
      }
      timelineRef.current?.scrollTo({ x: Math.max(0, offset - SCREEN_W * 0.3), animated: true });
    }, 600);
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_W, duration: 250, useNativeDriver: true }).start(() => onClose?.());
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <Starfield />
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dasha Timeline</Text>
        </View>

        {/* Current period summary */}
        <View style={styles.currentCard}>
          <View style={[styles.currentCardInner, {
            borderColor: currentMeta.color + '15',
            backgroundColor: currentMeta.color + '08',
          }]}>
            <View style={styles.currentTop}>
              <View>
                <Text style={styles.currentLabel}>Current Period</Text>
                <View style={styles.currentPeriodRow}>
                  <Text style={[styles.currentMdSymbol, { color: currentMeta.color }]}>{currentMeta.symbol}</Text>
                  <Text style={styles.currentMdLord}>{CURRENT.mahadasha.lord}</Text>
                  <Text style={styles.currentDot}>·</Text>
                  <Text style={[styles.currentAdSymbol, { color: currentAdMeta.color }]}>{currentAdMeta.symbol}</Text>
                  <Text style={styles.currentAdLord}>{CURRENT.antardasha.lord}</Text>
                </View>
              </View>
              <View>
                <Text style={[styles.currentPct, { color: currentMeta.color }]}>{Math.round(mdProgress * 100)}%</Text>
                <Text style={styles.currentPctLabel}>complete</Text>
              </View>
            </View>
            <View style={styles.currentProgressBg}>
              <View style={[styles.currentProgressFill, { width: `${mdProgress * 100}%`, backgroundColor: currentMeta.color }]} />
            </View>
            <View style={styles.currentDates}>
              <Text style={styles.currentDate}>{formatDate(CURRENT.mahadasha.start)}</Text>
              <Text style={styles.currentDate}>{formatDate(CURRENT.mahadasha.end)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.timelineLabel}>Life Timeline</Text>

        {/* Horizontal timeline */}
        <ScrollView
          ref={timelineRef}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineScroll}
          style={styles.timelineContainer}
        >
          {MAHADASHAS.map((md, i) => (
            <DashaBlock
              key={i}
              md={md}
              isActive={md === CURRENT.mahadasha}
              isExpanded={md === expandedMd}
              onTap={() => setExpandedMd(expandedMd === md ? null : md)}
              totalSpanYears={TOTAL_YEARS}
            />
          ))}
        </ScrollView>

        {/* Antardasha scrollable */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <AntardashaDetail mahadasha={expandedMd} visible={!!expandedMd} />
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 50 },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, maxWidth: 430, alignSelf: 'center' },
  header: { paddingTop: 54, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 16, color: 'rgba(255,255,255,0.4)' },
  headerTitle: { fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600' },
  currentCard: { paddingHorizontal: 32, paddingTop: 24 },
  currentCardInner: { padding: 20, borderRadius: 20, borderWidth: 1 },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  currentLabel: { fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 8 },
  currentPeriodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentMdSymbol: { fontSize: 22 },
  currentMdLord: { fontSize: 20, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  currentDot: { fontSize: 14, color: 'rgba(255,255,255,0.2)' },
  currentAdSymbol: { fontSize: 14 },
  currentAdLord: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  currentPct: { fontSize: 22, fontWeight: '200', textAlign: 'right' },
  currentPctLabel: { fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3, textAlign: 'right' },
  currentProgressBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)' },
  currentProgressFill: { height: 3, borderRadius: 2 },
  currentDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  currentDate: { fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 },
  timelineLabel: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', fontWeight: '600', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 12 },
  timelineContainer: { flexShrink: 0 },
  timelineScroll: { paddingHorizontal: 32, gap: 8, paddingBottom: 8 },
  dashaBlock: {
    height: TIMELINE_BLOCK_H, borderRadius: 16, borderWidth: 1,
    padding: 12, justifyContent: 'space-between',
  },
  dashaBlockSymbol: { fontSize: 18, marginBottom: 2 },
  dashaBlockLord: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  dashaBlockYears: { fontSize: 9, letterSpacing: 0.3 },
  dashaBlockDate: { fontSize: 8, color: 'rgba(255,255,255,0.15)', letterSpacing: 0.3 },
  dashaActiveIndicator: { position: 'absolute', top: 10, right: 10 },
  dashaActiveDot: { width: 6, height: 6, borderRadius: 3 },
  dashaProgress: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 4 },
  dashaProgressFill: { height: 2, borderRadius: 1 },
  antarSection: { paddingHorizontal: 32, paddingTop: 20 },
  antarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  antarColorDot: { width: 8, height: 8, borderRadius: 4 },
  antarTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.2 },
  antarMeaning: { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 18, letterSpacing: 0.2, marginBottom: 20 },
  antarList: { gap: 6 },
  antarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.015)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)',
  },
  antarSymbolOrb: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  antarSymbol: { fontSize: 14 },
  antarRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  antarLord: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  antarDuration: { fontSize: 10, letterSpacing: 0.3 },
  antarDates: { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.3 },
  antarProgressBar: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 8 },
  antarProgressFill: { height: 2, borderRadius: 1 },
  nowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  nowBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
});