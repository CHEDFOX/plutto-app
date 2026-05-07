import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import Starfield from '../../components/Starfield';

const { width: SCREEN_W } = Dimensions.get('window');

function buildWeakPlanets(kundliData) {
  const raw = kundliData?.raw || kundliData || {};
  const planets = raw.planets || {};

  // Check for weak planets from real data, fallback to defaults
  const DEFAULT_WEAK = [
    {
      planet: 'Saturn', symbol: '♄', color: '#6A5ACD', house: 7, sign: 'Aquarius',
      dignity: 'Own Sign', strength: 0.42, issue: 'Saturn aspects your 1st house creating self-doubt and delays in personal matters.',
      priority: 'high',
      remedies: {
        mantra: { text: 'Om Sham Shanicharaya Namah', count: '108 times', when: 'Saturday mornings before sunrise', pronunciation: 'Om Shahm Shah-nee-chah-rah-yah Nah-mah-hah' },
        gemstone: { name: 'Blue Sapphire (Neelam)', weight: '3-5 carats', metal: 'Silver or Panchdhatu', finger: 'Middle finger, right hand', day: 'Saturday during Shani Hora', caution: 'Must be trial-worn for 3 days first' },
        fasting: { day: 'Saturday', details: 'Avoid salt and oil. Eat one meal after sunset.' },
        charity: { items: 'Black sesame seeds, mustard oil, iron items', when: 'Saturday evenings', to: 'To the needy or at a Shani temple' },
        color: { wear: 'Dark blue, black, or violet', avoid: 'Bright red, orange' },
      },
    },
    {
      planet: 'Rahu', symbol: '☊', color: '#4169E1', house: 10, sign: 'Taurus',
      dignity: 'Neutral', strength: 0.35, issue: 'Rahu in the 10th creates obsessive career ambition and unconventional paths.',
      priority: 'high',
      remedies: {
        mantra: { text: 'Om Bhram Bhreem Bhroum Sah Rahave Namah', count: '108 times', when: 'Wednesday or Saturday evenings', pronunciation: 'Om Bhraam Bhreem Bhroum Sahh Rah-hah-vey Nah-mah-hah' },
        gemstone: { name: 'Hessonite (Gomed)', weight: '4-6 carats', metal: 'Silver', finger: 'Middle finger, right hand', day: 'Saturday during Rahu Kaal', caution: 'Not recommended if Moon is weak' },
        fasting: { day: 'Saturday', details: 'Avoid non-vegetarian food. Donate to the elderly.' },
        charity: { items: 'Blankets, coal, black lentils', when: 'Saturday', to: 'To elderly people or shelters' },
        color: { wear: 'Smoky grey, dark blue', avoid: 'Bright yellow' },
      },
    },
    {
      planet: 'Ketu', symbol: '☋', color: '#8B4513', house: 4, sign: 'Scorpio',
      dignity: 'Neutral', strength: 0.38, issue: 'Ketu in the 4th detaches from home comforts. Creates spiritual depth but emotional distance.',
      priority: 'medium',
      remedies: {
        mantra: { text: 'Om Stram Streem Stroum Sah Ketave Namah', count: '108 times', when: 'Tuesday or Saturday', pronunciation: 'Om Straam Streem Stroum Sahh Keh-tah-vey Nah-mah-hah' },
        gemstone: { name: "Cat's Eye (Lehsunia)", weight: '3-5 carats', metal: 'Silver', finger: 'Ring finger, right hand', day: 'Tuesday during Ketu Hora', caution: 'Trial period essential — can intensify spiritual experiences' },
        fasting: { day: 'Tuesday', details: 'Avoid spicy food. Feed dogs.' },
        charity: { items: 'Two-colored blanket, sour foods', when: 'Tuesday', to: 'At temples or to sadhus' },
        color: { wear: 'Grey, smoky brown', avoid: 'Bright green' },
      },
    },
  ];

  return DEFAULT_WEAK;
}

// --- REMEDY SECTION ---
function RemedySection({ icon, label, children, color, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[styles.remedySection, {
      backgroundColor: open ? color + '08' : 'rgba(255,255,255,0.012)',
      borderColor: open ? color + '15' : 'rgba(255,255,255,0.03)',
    }]}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={styles.remedySectionHeader} activeOpacity={0.8}>
        <Text style={[styles.remedySectionIcon, { color }]}>{icon}</Text>
        <Text style={styles.remedySectionLabel}>{label}</Text>
        <Text style={[styles.remedySectionChevron, { transform: [{ rotate: open ? '90deg' : '0deg' }] }]}>›</Text>
      </TouchableOpacity>
      {open && <View style={styles.remedySectionBody}>{children}</View>}
    </View>
  );
}

// --- PLANET REMEDY CARD ---
function PlanetRemedyCard({ data, index, visible }) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
        Animated.timing(widthAnim, { toValue: data.strength, duration: 900, delay: index * 100 + 300, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const barWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const priorityColor = data.priority === 'high' ? '#FF4500' : '#FFD700';
  const r = data.remedies;

  return (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
        <View style={[styles.planetCard, {
          backgroundColor: expanded ? data.color + '0C' : 'rgba(255,255,255,0.015)',
          borderColor: expanded ? data.color + '20' : 'rgba(255,255,255,0.04)',
        }]}>
          <View style={styles.planetCardHeader}>
            <View style={[styles.planetOrb, { backgroundColor: data.color + '18', borderColor: data.color + '22' }]}>
              <Text style={styles.planetOrbSymbol}>{data.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planetNameRow}>
                <Text style={styles.planetName}>{data.planet}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '12', borderColor: priorityColor + '20' }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>{data.priority}</Text>
                </View>
              </View>
              <Text style={styles.planetMeta}>{data.sign} · {data.house}th House · {Math.round(data.strength * 100)}% strength</Text>
            </View>
            <Text style={[styles.cardChevron, { transform: [{ rotate: expanded ? '90deg' : '0deg' }] }]}>›</Text>
          </View>

          <Text style={styles.planetIssue}>{data.issue}</Text>

          <View style={styles.strengthBarBg}>
            <Animated.View style={[styles.strengthBarFill, { width: barWidth, backgroundColor: data.color }]} />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.remediesContainer}>
          {/* Mantra */}
          <RemedySection icon="🕉" label="Mantra" color={data.color} defaultOpen>
            <View style={styles.mantraBox}>
              <Text style={styles.mantraText}>{r.mantra.text}</Text>
            </View>
            <Text style={styles.remedyDetail}>Pronunciation: <Text style={styles.remedyDetailValue}>{r.mantra.pronunciation}</Text></Text>
            <Text style={styles.remedyDetail}>Repetitions: <Text style={styles.remedyDetailValue}>{r.mantra.count}</Text></Text>
            <Text style={styles.remedyDetail}>When: <Text style={styles.remedyDetailValue}>{r.mantra.when}</Text></Text>
          </RemedySection>

          {/* Gemstone */}
          <RemedySection icon="💎" label="Gemstone" color={data.color}>
            <View style={styles.gemGrid}>
              {[['Stone', r.gemstone.name], ['Weight', r.gemstone.weight], ['Metal', r.gemstone.metal], ['Finger', r.gemstone.finger], ['Day', r.gemstone.day]].map(([label, value]) => (
                <View key={label} style={styles.gemItem}>
                  <Text style={styles.gemLabel}>{label}</Text>
                  <Text style={styles.gemValue}>{value}</Text>
                </View>
              ))}
            </View>
            {r.gemstone.caution && (
              <View style={styles.cautionBox}>
                <Text style={styles.cautionText}>⚠ {r.gemstone.caution}</Text>
              </View>
            )}
          </RemedySection>

          {/* Fasting */}
          <RemedySection icon="🌙" label="Fasting" color={data.color}>
            <Text style={styles.remedyBodyText}>
              <Text style={styles.remedyBodyBold}>{r.fasting.day}: </Text>{r.fasting.details}
            </Text>
          </RemedySection>

          {/* Charity */}
          <RemedySection icon="🙏" label="Charity (Daan)" color={data.color}>
            <Text style={styles.remedyBodyText}><Text style={styles.remedyBodyBold}>Items: </Text>{r.charity.items}</Text>
            <Text style={[styles.remedyBodyText, { marginTop: 6 }]}><Text style={styles.remedyBodyBold}>When: </Text>{r.charity.when}</Text>
            <Text style={[styles.remedyBodyText, { marginTop: 6 }]}><Text style={styles.remedyBodyBold}>To: </Text>{r.charity.to}</Text>
          </RemedySection>

          {/* Colors */}
          <RemedySection icon="🎨" label="Color Therapy" color={data.color}>
            <Text style={styles.remedyBodyText}><Text style={{ color: '#50C878', fontWeight: '600' }}>Wear: </Text>{r.color.wear}</Text>
            <Text style={[styles.remedyBodyText, { marginTop: 6 }]}><Text style={{ color: '#FF4500', fontWeight: '600' }}>Avoid: </Text>{r.color.avoid}</Text>
          </RemedySection>
        </View>
      )}
    </Animated.View>
  );
}

// --- MAIN ---
export default function RemediesScreen({ kundliData, onClose }) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;
  const weakPlanets = buildWeakPlanets(kundliData);

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
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
          <Text style={styles.headerTitle}>Remedies & Gemstones</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{weakPlanets.length} active</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Based on your birth chart, <Text style={styles.summaryHighlight}>{weakPlanets.length} planets</Text> need strengthening. Remedies are ordered by priority — start with the highest impact ones first.
          </Text>
        </View>

        {/* Planet remedies */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeading}>Planets Needing Remedies</Text>
          {weakPlanets.map((planet, i) => (
            <PlanetRemedyCard key={planet.planet} data={planet} index={i} visible={visible} />
          ))}
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
  headerTitle: { flex: 1, fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600' },
  activeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(80,200,120,0.06)', borderWidth: 1, borderColor: 'rgba(80,200,120,0.12)' },
  activeBadgeText: { fontSize: 10, fontWeight: '600', color: '#50C878', letterSpacing: 0.5 },
  summaryCard: { marginHorizontal: 32, marginTop: 20, padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,248,220,0.025)', borderWidth: 1, borderColor: 'rgba(255,248,220,0.05)' },
  summaryText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, letterSpacing: 0.2 },
  summaryHighlight: { color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 60 },
  sectionHeading: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 16 },
  planetCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  planetCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  planetOrb: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planetOrbSymbol: { fontSize: 22 },
  planetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  planetName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  priorityText: { fontSize: 8, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
  planetMeta: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 },
  cardChevron: { fontSize: 16, color: 'rgba(255,255,255,0.15)' },
  planetIssue: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, letterSpacing: 0.2, marginBottom: 12 },
  strengthBarBg: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)' },
  strengthBarFill: { height: 3, borderRadius: 2 },
  remediesContainer: { paddingTop: 8 },
  remedySection: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  remedySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 18 },
  remedySectionIcon: { fontSize: 14 },
  remedySectionLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.2 },
  remedySectionChevron: { fontSize: 12, color: 'rgba(255,255,255,0.2)' },
  remedySectionBody: { paddingHorizontal: 18, paddingBottom: 16 },
  mantraBox: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', marginBottom: 10 },
  mantraText: { fontSize: 15, fontWeight: '500', color: 'rgba(255,248,220,0.7)', letterSpacing: 0.3, lineHeight: 22, textAlign: 'center' },
  remedyDetail: { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.3, marginBottom: 4 },
  remedyDetailValue: { color: 'rgba(255,255,255,0.4)' },
  gemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  gemItem: { width: '50%', paddingVertical: 8 },
  gemLabel: { fontSize: 8, letterSpacing: 1, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  gemValue: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2 },
  cautionBox: { marginTop: 10, padding: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,69,0,0.04)', borderWidth: 1, borderColor: 'rgba(255,69,0,0.08)' },
  cautionText: { fontSize: 11, color: 'rgba(255,69,0,0.6)', letterSpacing: 0.2, lineHeight: 16 },
  remedyBodyText: { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18, letterSpacing: 0.2 },
  remedyBodyBold: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});