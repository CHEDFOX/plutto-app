import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle, G, Path, Text as SvgText, Defs, RadialGradient, Stop,
} from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_W * 0.78, 320);
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = SIZE * 0.42;

function buildPillars(kundliData) {
  const raw = kundliData?.raw || kundliData || {};
  return [
    { id: 'dharma', label: 'Dharma', meaning: 'Purpose & Righteousness', houses: [1, 5, 9], strength: 0.85, color: '#FFD700', insight: 'throne awaits', planet: 'Sun', planetSymbol: '☉', detail: 'Your 10th lord Sun sits in its own sign. You are meant to lead with authority and creative vision. Your dharma is to shine — not in ego, but in service of illumination.' },
    { id: 'karma', label: 'Karma', meaning: 'Action & Duty', houses: [2, 6, 10], strength: 0.72, color: '#6A5ACD', insight: 'silent architect', planet: 'Saturn', planetSymbol: '♄', detail: 'Saturn in the 7th house shapes your karma through relationships and partnerships. Your work is patience — building slowly what others rush to finish.' },
    { id: 'kama', label: 'Kama', meaning: 'Desire & Pleasure', houses: [3, 7, 11], strength: 0.91, color: '#FF69B4', insight: 'exalted longing', planet: 'Venus', planetSymbol: '♀', detail: 'Venus exalted in Pisces. Your desires run deep — not surface pleasures but transformative intimacy. You seek the kind of connection that changes both people forever.' },
    { id: 'moksha', label: 'Moksha', meaning: 'Liberation & Transcendence', houses: [4, 8, 12], strength: 0.68, color: '#00CED1', insight: 'dissolve to become', planet: 'Ketu', planetSymbol: '☋', detail: 'Ketu in Scorpio in the 4th house. Your path to liberation is through letting go of emotional security. The more you release attachment, the freer your spirit becomes.' },
  ];
}

function SoulMandala({ pillars, selectedPillar, onPillarTap }) {
  const quadrants = pillars.map((pillar, i) => {
    const startAngle = (i * Math.PI / 2) - Math.PI / 2;
    const endAngle = startAngle + Math.PI / 2;
    const isSelected = selectedPillar?.id === pillar.id;
    const radius = MAX_R * (0.6 + pillar.strength * 0.4);
    const x1 = CX + radius * Math.cos(startAngle);
    const y1 = CY + radius * Math.sin(startAngle);
    const x2 = CX + radius * Math.cos(endAngle);
    const y2 = CY + radius * Math.sin(endAngle);
    const arcPath = `M ${CX} ${CY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    const midAngle = startAngle + Math.PI / 4;
    const labelR = radius * 0.55;
    const lx = CX + Math.cos(midAngle) * labelR;
    const ly = CY + Math.sin(midAngle) * labelR;
    const dotCount = Math.round(pillar.strength * 8);
    const dots = [];
    for (let d = 0; d < dotCount; d++) {
      const dotAngle = startAngle + (d + 0.5) * (Math.PI / 2) / 8;
      dots.push({ x: CX + Math.cos(dotAngle) * (radius + 4), y: CY + Math.sin(dotAngle) * (radius + 4) });
    }
    return { pillar, isSelected, arcPath, lx, ly, dots };
  });

  const handlePress = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    const x = locationX - CX; const y = locationY - CY;
    let angle = Math.atan2(y, x);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    const normalized = angle + Math.PI / 2;
    const quadrant = Math.floor((normalized / (Math.PI * 2)) * 4) % 4;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < MAX_R * 1.05 && dist > 20) {
      const pillar = pillars[quadrant];
      onPillarTap(selectedPillar?.id === pillar?.id ? null : pillar);
    } else { onPillarTap(null); }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={CX} cy={CY} r={MAX_R + 8} stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} fill="none" />
        {quadrants.map(({ pillar, isSelected, arcPath, lx, ly, dots }) => (
          <G key={pillar.id}>
            <Path d={arcPath} fill={pillar.color + (isSelected ? '18' : '08')} stroke={pillar.color + (isSelected ? '40' : '15')} strokeWidth={isSelected ? 1.5 : 0.8} />
            {dots.map((dot, di) => <Circle key={di} cx={dot.x} cy={dot.y} r={1.2} fill={pillar.color + '50'} />)}
            <SvgText x={lx} y={ly - 8} fill={pillar.color + (isSelected ? 'C0' : '60')} fontSize={isSelected ? 18 : 14} textAnchor="middle">{pillar.planetSymbol}</SvgText>
            <SvgText x={lx} y={ly + 8} fill={isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'} fontSize={isSelected ? 10 : 8} fontWeight={isSelected ? '600' : '300'} textAnchor="middle">{pillar.label.toLowerCase()}</SvgText>
            {isSelected && <SvgText x={lx} y={ly + 20} fill={pillar.color + '70'} fontSize={7} textAnchor="middle">{pillar.insight}</SvgText>}
          </G>
        ))}
        {[0,1,2,3].map(i => { const angle = (i*Math.PI/2)-Math.PI/2; return <Path key={i} d={`M ${CX} ${CY} L ${CX+Math.cos(angle)*(MAX_R+4)} ${CY+Math.sin(angle)*(MAX_R+4)}`} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />; })}
        <Circle cx={CX} cy={CY} r={24} fill="rgba(255,248,220,0.04)" />
        <Circle cx={CX} cy={CY} r={16} stroke="rgba(255,248,220,0.08)" strokeWidth={0.5} fill="none" />
        <SvgText x={CX} y={CY+2} fill="rgba(255,248,220,0.35)" fontSize={7} textAnchor="middle" fontWeight="300">ATMAN</SvgText>
      </Svg>
    </TouchableOpacity>
  );
}

function PillarPanel({ pillar, onClose }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: pillar ? 0 : 400, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
  }, [pillar]);
  if (!pillar) return null;
  const ordinal = n => n + (['st','nd','rd'][n-1]||'th');
  return (
    <>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.panelHandle} />
        <View style={styles.panelHeader}>
          <View style={[styles.panelOrb, { backgroundColor: pillar.color+'18', borderColor: pillar.color+'22' }]}>
            <Text style={styles.panelSymbol}>{pillar.planetSymbol}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelLabel}>{pillar.label}</Text>
            <Text style={styles.panelMeaning}>{pillar.meaning}</Text>
          </View>
        </View>
        <View style={[styles.insightBox, { backgroundColor: pillar.color+'08', borderColor: pillar.color+'12' }]}>
          <Text style={[styles.insightText, { color: pillar.color }]}>"{pillar.insight}"</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Planet</Text>
            <View style={styles.statInner}>
              <Text style={[styles.statSymbol, { color: pillar.color }]}>{pillar.planetSymbol}</Text>
              <Text style={styles.statValue}>{pillar.planet}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Strength</Text>
            <View style={styles.statInner}>
              <View style={styles.strengthBar}><View style={[styles.strengthFill, { width: `${pillar.strength*100}%`, backgroundColor: pillar.color }]} /></View>
              <Text style={[styles.strengthPct, { color: pillar.color }]}>{Math.round(pillar.strength*100)}%</Text>
            </View>
          </View>
        </View>
        <View style={styles.housesCard}>
          <Text style={styles.statLabel}>Houses</Text>
          <View style={styles.housesRow}>
            {pillar.houses.map(h => (
              <View key={h} style={[styles.housePill, { backgroundColor: pillar.color+'08', borderColor: pillar.color+'15' }]}>
                <Text style={[styles.houseText, { color: pillar.color+'90' }]}>{ordinal(h)}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.detailText}>{pillar.detail}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

export default function SoulMap({ kundliData, language }) {
  const [selectedPillar, setSelectedPillar] = useState(null);
  const pillars = buildPillars(kundliData);
  return (
    <View style={styles.wrapper}>
      <SoulMandala pillars={pillars} selectedPillar={selectedPillar} onPillarTap={setSelectedPillar} />
      <PillarPanel pillar={selectedPillar} onClose={() => setSelectedPillar(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 99 },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(4,4,8,0.97)', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 20, paddingBottom: 44, paddingHorizontal: 32 },
  panelHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'center', marginBottom: 28 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  panelOrb: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  panelSymbol: { fontSize: 26 },
  panelLabel: { fontSize: 20, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  panelMeaning: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: 0.4 },
  insightBox: { padding: 14, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
  insightText: { fontSize: 16, fontWeight: '300', letterSpacing: 1.5, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.015)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  statLabel: { fontSize: 8, letterSpacing: 1.2, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 },
  statInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statSymbol: { fontSize: 14 },
  statValue: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)' },
  strengthFill: { height: 3, borderRadius: 2 },
  strengthPct: { fontSize: 12, fontWeight: '600' },
  housesCard: { padding: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.015)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', marginBottom: 20 },
  housesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  housePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  houseText: { fontSize: 12, fontWeight: '500' },
  detailText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 22, letterSpacing: 0.2, marginBottom: 24 },
  closeBtn: { padding: 15, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 },
});