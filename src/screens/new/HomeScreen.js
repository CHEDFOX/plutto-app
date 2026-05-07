import React, { useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C, SYSTEMS } from '../../theme/design';
import { useSystem } from '../../context/SystemContext';
import ArcSelector from '../../components/ArcSelector';

const { width: SW } = Dimensions.get('window');
const GRID_PAD = 12;
const GAP = 8;
const COL_W = (SW - GRID_PAD * 2 - GAP * 5) / 6; // 6-col grid

// ─── FEATURE DEFINITIONS ───
const FEATURES = [
  // Row: FULL — Chart preview
  { id: 'chart-preview', title: 'Birth chart', sub: 'Your complete chart — tap to explore', span: 6, height: 110, hero: true, showChart: true },
  // Row: FULL — Today
  { id: 'daily-vibe', title: 'Your sky today', sub: 'Moon in Uttara Phalguni · Mars–Jupiter dasha', span: 6, height: 90, showData: 'today' },
  // Row: HALF + HALF
  { id: 'power-hours', title: 'Power hours', sub: 'Best windows today', span: 3, height: 80, showData: 'hours' },
  { id: 'soul-profile', title: 'Soul profile', sub: null, span: 3, height: 80, showData: 'soul' },
  // Row: FULL — Bond
  { id: 'cosmic-bond', title: 'Cosmic bond', sub: 'Check compatibility with anyone', span: 6, height: 70 },
  // Row: 2/3 + 1/3
  { id: 'name-lab', title: 'Name lab', sub: 'Analyze and correct any name', span: 4, height: 90, showData: 'name' },
  { id: 'active-yogas', title: 'Yogas', sub: null, span: 2, height: 90, showData: 'yogas' },
  // Row: 1/3 + 2/3
  { id: 'planet-strength', title: 'Strength', sub: null, span: 2, height: 90, showData: 'strength' },
  { id: 'another-sky', title: 'Another sky', sub: "Read anyone else's chart", span: 4, height: 90 },
  // Row: HALF + HALF
  { id: 'career-path', title: 'Career path', sub: null, span: 3, height: 80, showData: 'career' },
  { id: 'money-calendar', title: 'Money calendar', sub: null, span: 3, height: 80, showData: 'money' },
  // Row: FULL — Dasha
  { id: 'dasha-timeline', title: 'Dasha timeline', sub: null, span: 6, height: 65, showData: 'dasha' },
  // Row: HALF + HALF
  { id: 'muhurta-finder', title: 'Muhurta', sub: 'Find the right time', span: 3, height: 70 },
  { id: 'weekly-forecast', title: 'Weekly', sub: null, span: 3, height: 70, showData: 'weekly' },
  // Row: 1/3 + 1/3 + 1/3
  { id: 'health-map', title: 'Health', sub: '6th/8th house', span: 2, height: 65 },
  { id: 'danger-radar', title: 'Danger', sub: 'Radar ahead', span: 2, height: 65 },
  { id: 'eclipse-impact', title: 'Eclipse', sub: 'Next impact', span: 2, height: 65 },
  // Row: 2/3 + 1/3
  { id: 'nakshatra-profile', title: 'Nakshatra', sub: 'Pushya · The Nourisher', span: 4, height: 70 },
  { id: 'personal-deities', title: 'Deities', sub: 'Ishta devata', span: 2, height: 70 },
  // Row: 1/3 + 1/3 + 1/3
  { id: 'nadi-reading', title: 'Nadi', sub: null, span: 2, height: 60 },
  { id: 'cosmic-novel', title: 'Novel', sub: null, span: 2, height: 60 },
  { id: 'vastu', title: 'Vastu', sub: null, span: 2, height: 60 },
];

// ─── MINI DATA PREVIEWS ───
function TodayData() {
  return (
    <View style={s.dataRow}>
      <View><Text style={s.dataBig}>72</Text><Text style={s.dataLabel}>ENERGY</Text></View>
      <View><Text style={s.dataBig}>ACT</Text><Text style={s.dataLabel}>WORD</Text></View>
      <View><Text style={s.dataBig}>U.Phal</Text><Text style={s.dataLabel}>NAKSHATRA</Text></View>
    </View>
  );
}

function HoursData() {
  return (
    <View style={s.hoursRow}>
      {[0.03, 0.08, 0.12, 0.03, 0.07].map((op, i) => (
        <View key={i} style={[s.hourBlock, { backgroundColor: `rgba(255,255,255,${op})` }]} />
      ))}
    </View>
  );
}

function SoulData() {
  return <Text style={s.serifItalic}>The Quiet Fire</Text>;
}

function YogasData() {
  return (
    <View style={s.tagRow}>
      <View style={s.tag}><Text style={s.tagText}>Budhaditya</Text></View>
      <View style={s.tag}><Text style={s.tagText}>+5</Text></View>
    </View>
  );
}

function StrengthData() {
  const bars = [
    { label: 'Ma', pct: 91 },
    { label: 'Mo', pct: 85 },
    { label: 'Sa', pct: 22, weak: true },
  ];
  return (
    <View style={{ marginTop: 6 }}>
      {bars.map((b, i) => (
        <View key={i} style={s.barRow}>
          <Text style={[s.barLabel, b.weak && { color: C.weak }]}>{b.label}</Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${b.pct}%`, backgroundColor: b.weak ? C.weak : 'rgba(255,255,255,0.2)' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DashaData() {
  return (
    <View>
      <View style={s.dashaRow}>
        {[1, 3, 1, 1.5, 2.5, 2].map((flex, i) => (
          <View key={i} style={[s.dashaBlock, { flex, backgroundColor: i === 2 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)' }]} />
        ))}
      </View>
      <Text style={[s.dataLabel, { marginTop: 4 }]}>Mars · 2019–2026</Text>
    </View>
  );
}

function MoneyData() {
  return (
    <View style={s.moneyGrid}>
      {[0.06, 0.1, 0.03, 0.08, 0.12, 0.03, 0.07, 0.1, 0.04, 0.09, 0.03, 0.11, 0.04, 0.08].map((op, i) => (
        <View key={i} style={[s.moneyCell, { backgroundColor: `rgba(255,255,255,${op})` }]} />
      ))}
    </View>
  );
}

function CareerData() {
  return <Text style={s.serifItalic}>Leadership in technology</Text>;
}

function WeeklyData() {
  return <Text style={s.serifItalic}>Thursday brings an opening</Text>;
}

function NameData() {
  return (
    <View style={s.nameBox}>
      <Text style={s.nameScore}>Score: 64/100 · 3 corrections</Text>
    </View>
  );
}

function ChartPreview() {
  return (
    <View style={s.chartPreviewWrap}>
      <View style={s.chartCircle}>
        <View style={s.chartInner}>
          <Text style={s.chartAsc}>ASC</Text>
        </View>
      </View>
    </View>
  );
}

function getDataComponent(type) {
  switch (type) {
    case 'today': return <TodayData />;
    case 'hours': return <HoursData />;
    case 'soul': return <SoulData />;
    case 'yogas': return <YogasData />;
    case 'strength': return <StrengthData />;
    case 'dasha': return <DashaData />;
    case 'money': return <MoneyData />;
    case 'career': return <CareerData />;
    case 'weekly': return <WeeklyData />;
    case 'name': return <NameData />;
    default: return null;
  }
}

// ─── FEATURE CARD ───
function FeatureCard({ feature, onPress }) {
  const colWidth = (SW - GRID_PAD * 2 + GAP) / 6;
  const width = colWidth * feature.span - GAP;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(feature.id)}
      style={[
        s.card,
        { width, minHeight: feature.height },
        feature.hero && { backgroundColor: C.card },
      ]}
    >
      {feature.showChart && <ChartPreview />}
      <Text style={feature.hero ? s.cardTitleHero : s.cardTitle}>{feature.title}</Text>
      {feature.sub && <Text style={s.cardSub}>{feature.sub}</Text>}
      {feature.showData && (
        <View style={{ marginTop: 8 }}>
          {getDataComponent(feature.showData)}
        </View>
      )}
      {!feature.showData && !feature.showChart && !feature.sub && (
        <View style={{ flex: 1 }} />
      )}
    </TouchableOpacity>
  );
}

// ─── HOME SCREEN ───
export default function HomeScreen({ kundliData, userData, language, navigation }) {
  const { system } = useSystem();

  const handleFeaturePress = useCallback((featureId) => {
    if (featureId === 'chart-preview') {
      // TODO: open chart inline
      return;
    }
    if (featureId === 'cosmic-bond' || featureId === 'another-sky') {
      // TODO: navigate to bond/another sky flow
      return;
    }
    // TODO: navigate to feature detail
    console.log('Feature:', featureId);
  }, [navigation]);

  // Build rows from FEATURES
  const rows = useMemo(() => {
    const result = [];
    let i = 0;
    while (i < FEATURES.length) {
      const row = [];
      let colsUsed = 0;
      while (i < FEATURES.length && colsUsed + FEATURES[i].span <= 6) {
        row.push(FEATURES[i]);
        colsUsed += FEATURES[i].span;
        i++;
      }
      result.push(row);
    }
    return result;
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        

        {/* Arc System Selector */}
        <ArcSelector />

        

        {/* Separator */}
        <View style={s.separator} />

        {/* Section Label */}
        <Text style={s.sectionLabel}>TODAY</Text>

        {/* Bento Grid */}
        <View style={s.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.gridRow}>
              {row.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onPress={handleFeaturePress}
                />
              ))}
            </View>
          ))}
        </View>

        {/* All Features Link */}
        <TouchableOpacity style={s.allFeaturesBtn}>
          <Text style={s.allFeaturesText}>ALL 90+ FEATURES →</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 4,
  },
  greeting: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 15,
    fontWeight: '300',
    color: C.t1,
  },
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.b1,
  },

  // System name
  systemNameWrap: { alignItems: 'center', paddingBottom: 14 },
  systemName: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 22,
    fontWeight: '300',
    color: C.t1,
    letterSpacing: 1,
  },
  systemSub: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: C.t3,
    marginTop: 3,
    textTransform: 'uppercase',
  },

  // Separator
  separator: { height: 0.5, backgroundColor: C.b1 },

  // Section label
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: C.t3,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Grid
  grid: { paddingHorizontal: GRID_PAD },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },

  // Card
  card: {
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 6,
    padding: 14,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  cardTitleHero: {
    fontSize: 15,
    fontWeight: '300',
    fontFamily: 'PlayfairDisplay',
    color: C.t1,
  },
  cardSub: {
    fontSize: 10,
    fontWeight: '300',
    color: C.t3,
    marginTop: 3,
    lineHeight: 16,
  },

  // Data previews
  dataRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  dataBig: {
    fontSize: 18,
    fontWeight: '200',
    fontFamily: 'PlayfairDisplay',
    color: 'rgba(255,255,255,0.6)',
  },
  dataLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: C.t4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  serifItalic: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 13,
    fontWeight: '300',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },

  // Hours
  hoursRow: { flexDirection: 'row', gap: 2, marginTop: 8 },
  hourBlock: { flex: 1, height: 18, borderRadius: 2 },

  // Tags
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 2,
  },
  tagText: { fontSize: 9, color: C.t2, letterSpacing: 0.5 },

  // Bars
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  barLabel: { fontSize: 7, color: C.t3, width: 14, letterSpacing: 0.5 },
  barTrack: { flex: 1, height: 2, backgroundColor: C.b2, borderRadius: 1, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 1 },

  // Dasha
  dashaRow: { flexDirection: 'row', gap: 1, height: 14 },
  dashaBlock: { borderRadius: 1 },

  // Money grid
  moneyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    marginTop: 6,
  },
  moneyCell: {
    width: (SW - GRID_PAD * 2 - GAP * 3) / 7 / 2 - 2,
    height: 7,
    borderRadius: 1,
  },

  // Name
  nameBox: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 3,
  },
  nameScore: { fontSize: 10, color: C.t3, letterSpacing: 0.5 },

  // Chart preview
  chartPreviewWrap: { alignItems: 'center', marginVertical: 4 },
  chartCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 0.5,
    borderColor: C.b3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: C.b1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartAsc: { fontSize: 7, letterSpacing: 1, color: C.t4 },

  // All features
  allFeaturesBtn: {
    marginHorizontal: GRID_PAD,
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  allFeaturesText: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: C.t4,
  },
});