import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import Starfield from '../../components/Starfield';

const { width: SCREEN_W } = Dimensions.get('window');

// --- HELPERS ---
function buildData(kundliData) {
  const raw = kundliData?.raw || kundliData || {};
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return {
    today: {
      date: dateStr,
      tithi: raw.tithi || 'Shukla Panchami',
      nakshatra: raw.moonNakshatra || raw.nakshatra || 'Magha',
      yoga: raw.yoga || 'Siddha',
      karana: raw.karana || 'Baalava',
      moonSign: raw.moonSign || 'Leo',
    },
    mahadasha: raw.dasha?.mahadasha || kundliData?.dasha?.mahadasha || 'Jupiter',
    antardasha: raw.dasha?.antardasha || kundliData?.dasha?.antardasha || 'Saturn',
    oracleMessage: 'The stars align favorably for action and intention today. What you initiate carries forward momentum for weeks. Move with confidence but not haste.',
  };
}

const LIFE_AREAS = [
  { name: 'Career', score: 0.82, icon: '⬡', color: '#FFA500', insight: 'Jupiter transiting your 10th — promotion energy is building. Take initiative today.' },
  { name: 'Relationships', score: 0.55, icon: '♡', color: '#FF69B4', insight: 'Moon in your 2nd house creates emotional sensitivity. Be mindful of words with loved ones.' },
  { name: 'Health', score: 0.71, icon: '✦', color: '#50C878', insight: 'Mars aspect on the 6th house lord gives good vitality. Ideal day for physical activity.' },
  { name: 'Finances', score: 0.65, icon: '◇', color: '#FFD700', insight: 'Venus-Jupiter aspect favors investments. Avoid impulsive purchases after 4 PM.' },
  { name: 'Spiritual', score: 0.90, icon: '☸', color: '#6A5ACD', insight: 'Siddha yoga today amplifies meditation. Morning hours before 7 AM are especially potent.' },
];

const TRANSITS = [
  { planet: 'Moon', symbol: '☽', color: '#C0C0C0', sign: 'Leo', house: 2, effect: 'Emotional focus on family and finances. Good for important conversations.', type: 'positive' },
{ planet: 'Saturn', symbol: '\u2644', color: '#6A5ACD', sign: 'Pisces', house: 8, effect: "Deep transformation continues. Don't resist changes - they serve your growth.", type: 'neutral' },
  { planet: 'Jupiter', symbol: '♃', color: '#FFA500', sign: 'Taurus', house: 10, effect: 'Career blessings active. Authority figures are favorable toward you.', type: 'positive' },
];

const MUHURTA = [
  { time: '5:45 — 7:15 AM', name: 'Brahma Muhurta', quality: 'excellent', desc: 'Best for meditation, prayer, study' },
  { time: '9:30 — 11:00 AM', name: 'Abhijit Muhurta', quality: 'excellent', desc: 'Most auspicious window — start important work' },
  { time: '2:00 — 3:30 PM', name: 'Rahu Kaal', quality: 'avoid', desc: 'Avoid starting new ventures' },
  { time: '6:00 — 7:30 PM', name: 'Godhuli', quality: 'good', desc: 'Good for social activities and travel' },
];

// --- SUB COMPONENTS ---
function PanchPill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function LifeAreaBar({ area, index, visible }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
        Animated.timing(widthAnim, { toValue: area.score, duration: 900, delay: index * 80 + 200, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.lifeAreaRow}>
          <Text style={[styles.lifeAreaIcon, { color: area.color }]}>{area.icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.lifeAreaTop}>
              <Text style={styles.lifeAreaName}>{area.name}</Text>
              <Text style={[styles.lifeAreaScore, { color: area.color }]}>{Math.round(area.score * 100)}%</Text>
            </View>
            <View style={styles.lifeBarBg}>
              <Animated.View style={[styles.lifeBarFill, { width: barWidth, backgroundColor: area.color }]} />
            </View>
          </View>
        </View>
        {expanded && (
          <View style={[styles.lifeAreaInsight, { borderLeftColor: area.color }]}>
            <Text style={styles.lifeAreaInsightText}>{area.insight}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function TransitRow({ transit, index, visible }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, [visible]);
  const typeColor = transit.type === 'positive' ? '#50C878' : transit.type === 'neutral' ? '#FFD700' : '#FF4500';
  return (
    <Animated.View style={[styles.transitRow, { opacity: fadeAnim }]}>
      <Text style={[styles.transitSymbol, { color: transit.color }]}>{transit.symbol}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.transitTop}>
          <Text style={styles.transitPlanet}>{transit.planet}</Text>
          <Text style={styles.transitMeta}>in {transit.sign} · {transit.house}H</Text>
          <View style={[styles.transitDot, { backgroundColor: typeColor }]} />
        </View>
        <Text style={styles.transitEffect}>{transit.effect}</Text>
      </View>
    </Animated.View>
  );
}

function MuhurtaRow({ muhurta }) {
  const qs = {
    excellent: { bg: 'rgba(80,200,120,0.06)', border: 'rgba(80,200,120,0.12)', color: '#50C878', dot: '#50C878' },
    good: { bg: 'rgba(255,215,0,0.05)', border: 'rgba(255,215,0,0.1)', color: '#FFD700', dot: '#FFD700' },
    avoid: { bg: 'rgba(255,69,0,0.05)', border: 'rgba(255,69,0,0.1)', color: '#FF4500', dot: '#FF4500' },
  }[muhurta.quality];

  return (
    <View style={[styles.muhurtaRow, { backgroundColor: qs.bg, borderColor: qs.border }]}>
      <View style={[styles.muhurtaDot, { backgroundColor: qs.dot }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.muhurtaTop}>
          <Text style={[styles.muhurtaName, { color: qs.color }]}>{muhurta.name}</Text>
          <Text style={styles.muhurtaTime}>{muhurta.time}</Text>
        </View>
        <Text style={styles.muhurtaDesc}>{muhurta.desc}</Text>
      </View>
    </View>
  );
}

// --- MAIN ---
export default function DailyHoroscopeScreen({ kundliData, onClose }) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const data = buildData(kundliData);
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_W, duration: 250, useNativeDriver: true }).start(() => onClose?.());
  };

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'transits', label: 'Transits' },
    { id: 'timing', label: 'Timing' },
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <Starfield />
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Horoscope</Text>
        </View>

        {/* Date & Panchanga */}
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>{data.today.date}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PanchPill label="Tithi" value={data.today.tithi} />
              <PanchPill label="Nakshatra" value={data.today.nakshatra} />
              <PanchPill label="Yoga" value={data.today.yoga} />
              <PanchPill label="Karana" value={data.today.karana} />
              <PanchPill label="Moon" value={data.today.moonSign} />
            </View>
          </ScrollView>
        </View>

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          {sections.map(s => (
            <TouchableOpacity key={s.id} onPress={() => setActiveSection(s.id)}
              style={[styles.sectionTab, activeSection === s.id && styles.sectionTabActive]}>
              <Text style={[styles.sectionTabText, activeSection === s.id && styles.sectionTabTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {activeSection === 'overview' && (
            <>
              {/* Oracle */}
              <View style={styles.oracleCard}>
                <Text style={styles.oracleLabel}>✦ Oracle's Message</Text>
                <Text style={styles.oracleText}>{data.oracleMessage}</Text>
              </View>

              {/* Dasha context */}
              <View style={styles.dashaRow}>
                <View style={[styles.dashaCard, { borderColor: 'rgba(255,165,0,0.08)' }]}>
                  <Text style={styles.dashaCardLabel}>Mahadasha</Text>
                  <View style={styles.dashaCardInner}>
                    <Text style={[styles.dashaSymbol, { color: '#FFA500' }]}>♃</Text>
                    <Text style={styles.dashaLord}>{data.mahadasha}</Text>
                  </View>
                </View>
                <View style={[styles.dashaCard, { borderColor: 'rgba(106,90,205,0.08)' }]}>
                  <Text style={styles.dashaCardLabel}>Antardasha</Text>
                  <View style={styles.dashaCardInner}>
                    <Text style={[styles.dashaSymbol, { color: '#6A5ACD' }]}>♄</Text>
                    <Text style={styles.dashaLord}>{data.antardasha}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeading}>Life Areas Today</Text>
              {LIFE_AREAS.map((area, i) => (
                <LifeAreaBar key={area.name} area={area} index={i} visible={visible} />
              ))}
            </>
          )}

          {activeSection === 'transits' && (
            <>
              <Text style={styles.sectionHeading}>Active Transits on Your Chart</Text>
              {TRANSITS.map((t, i) => (
                <TransitRow key={t.planet} transit={t} index={i} visible={visible} />
              ))}
              <View style={styles.sadeSatiCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sadeSatiTitle}>Sade Sati</Text>
                  <Text style={styles.sadeSatiSub}>7.5 year Saturn transit</Text>
                </View>
                <View style={styles.sadeSatiBadge}>
                  <Text style={styles.sadeSatiBadgeText}>Not Active</Text>
                </View>
              </View>
            </>
          )}

          {activeSection === 'timing' && (
            <>
              <Text style={styles.sectionHeading}>Today's Muhurta Windows</Text>
              {MUHURTA.map((m, i) => <MuhurtaRow key={i} muhurta={m} />)}
              <View style={styles.sunsetRow}>
                <View style={styles.sunCard}>
                  <Text style={styles.sunLabel}>Sunrise</Text>
                  <Text style={[styles.sunTime, { color: 'rgba(255,215,0,0.7)' }]}>6:28 AM</Text>
                </View>
                <View style={styles.sunCard}>
                  <Text style={styles.sunLabel}>Sunset</Text>
                  <Text style={[styles.sunTime, { color: 'rgba(255,105,180,0.7)' }]}>6:14 PM</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 50 },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, maxWidth: 430, alignSelf: 'center' },
  header: { paddingTop: 54, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 0 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 16, color: 'rgba(255,255,255,0.4)' },
  headerTitle: { fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600' },
  dateSection: { paddingHorizontal: 32, paddingTop: 20 },
  dateText: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  pillLabel: { fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 3 },
  pillValue: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '400' },
  sectionTabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 32, paddingTop: 20 },
  sectionTab: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  sectionTabActive: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
  sectionTabText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, color: 'rgba(255,255,255,0.3)' },
  sectionTabTextActive: { color: 'rgba(255,255,255,0.8)' },
  scrollContent: { padding: 32, paddingTop: 20, paddingBottom: 40 },
  oracleCard: { padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,248,220,0.025)', borderWidth: 1, borderColor: 'rgba(255,248,220,0.05)', marginBottom: 24 },
  oracleLabel: { fontSize: 8, letterSpacing: 2, color: 'rgba(255,248,220,0.35)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 },
  oracleText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 22, letterSpacing: 0.2, fontWeight: '300', fontStyle: 'italic' },
  dashaRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  dashaCard: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  dashaCardLabel: { fontSize: 8, letterSpacing: 1.2, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 },
  dashaCardInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dashaSymbol: { fontSize: 16 },
  dashaLord: { fontSize: 14, fontWeight: '600', color: '#fff' },
  sectionHeading: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 16 },
  lifeAreaRow: { flexDirection: 'row', alignItems: 'center' },
  lifeAreaIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  lifeAreaTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lifeAreaName: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  lifeAreaScore: { fontSize: 12, fontWeight: '600' },
  lifeBarBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)' },
  lifeBarFill: { height: 3, borderRadius: 2 },
  lifeAreaInsight: { marginTop: 10, paddingLeft: 12, borderLeftWidth: 2 },
  lifeAreaInsightText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 16, letterSpacing: 0.2 },
  transitRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  transitSymbol: { fontSize: 20, marginTop: 2 },
  transitTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  transitPlanet: { fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  transitMeta: { fontSize: 10, color: 'rgba(255,255,255,0.2)' },
  transitDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 'auto' },
  transitEffect: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, letterSpacing: 0.2 },
  sadeSatiCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: 'rgba(80,200,120,0.03)', borderWidth: 1, borderColor: 'rgba(80,200,120,0.08)', marginTop: 20 },
  sadeSatiTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.2 },
  sadeSatiSub: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 },
  sadeSatiBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(80,200,120,0.08)', borderWidth: 1, borderColor: 'rgba(80,200,120,0.15)' },
  sadeSatiBadgeText: { fontSize: 11, fontWeight: '600', color: '#50C878' },
  muhurtaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, marginBottom: 6 },
  muhurtaDot: { width: 6, height: 6, borderRadius: 3 },
  muhurtaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  muhurtaName: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  muhurtaTime: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 },
  muhurtaDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.2 },
  sunsetRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  sunCard: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  sunLabel: { fontSize: 8, letterSpacing: 1.2, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 },
  sunTime: { fontSize: 16, fontWeight: '300' },
});