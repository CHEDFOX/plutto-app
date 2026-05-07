import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { C } from '../../theme/design';
import { useSystem } from '../../context/SystemContext';

const PLANETS = [
  { id: 'su', glyph: '☉', name: 'Sun', sign: 'Cancer', deg: '11°32\'', house: 'H12', nak: 'Pushya', shadbala: 72, dignity: 'Friendly' },
  { id: 'mo', glyph: '☽', name: 'Moon', sign: 'Cancer', deg: '17°12\'', house: 'H12', nak: 'Ashlesha', shadbala: 85, dignity: 'Own Sign' },
  { id: 'ma', glyph: '♂', name: 'Mars', sign: 'Leo', deg: '8°18\'', house: 'H1', nak: 'Magha', shadbala: 91, dignity: 'Yogakaraka', isDasha: true },
  { id: 'me', glyph: '☿', name: 'Mercury', sign: 'Cancer', deg: '5°48\'', house: 'H12', nak: 'Pushya', shadbala: 45, dignity: 'Combust' },
  { id: 'ju', glyph: '♃', name: 'Jupiter', sign: 'Taurus', deg: '12°06\'', house: 'H10', nak: 'Rohini', shadbala: 68, dignity: 'Neutral' },
  { id: 've', glyph: '♀', name: 'Venus', sign: 'Cancer', deg: '22°24\'', house: 'H12', nak: 'Ashlesha', shadbala: 38, dignity: 'Enemy' },
  { id: 'sa', glyph: '♄', name: 'Saturn', sign: 'Cancer', deg: '13°12\'', house: 'H12', nak: 'Pushya', shadbala: 22, dignity: 'Debilitated', weak: true },
  { id: 'ra', glyph: '☊', name: 'Rahu', sign: 'Scorpio', deg: '8°30\'', house: 'H4', nak: 'Jyeshtha', shadbala: 50 },
  { id: 'ke', glyph: '☋', name: 'Ketu', sign: 'Taurus', deg: '8°30\'', house: 'H10', nak: 'Ashwini', shadbala: 50 },
];

function PlanetReading({ planet, onClose }) {
  return (
    <View style={[s.readingCard, planet.isDasha && { borderColor: C.gBorder }]}>
      <View style={s.readingHeader}>
        <View>
          <Text style={[s.readingTitle, planet.isDasha && { color: C.gold }]}>
            {planet.name} in {planet.sign}
          </Text>
          <Text style={s.readingPos}>
            {planet.deg} · {planet.house} · {planet.nak}
          </Text>
        </View>
      </View>
      <View style={s.readingTags}>
        <View style={[s.readingTag, planet.isDasha && { borderColor: C.gBorder }]}>
          <Text style={[s.readingTagText, planet.isDasha && { color: C.gText }, planet.weak && { color: C.weak }]}>
            {planet.dignity || 'NEUTRAL'}
          </Text>
        </View>
        <View style={[s.readingTag, planet.isDasha && { borderColor: C.gBorder }]}>
          <Text style={[s.readingTagText, planet.isDasha && { color: C.gText }, planet.weak && { color: C.weak }]}>
            SHADBALA {planet.shadbala}%
          </Text>
        </View>
        {planet.isDasha && (
          <View style={[s.readingTag, { borderColor: C.gBorder }]}>
            <Text style={[s.readingTagText, { color: C.gText }]}>DASHA LORD</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChartScreen({ kundliData, language }) {
  const { system } = useSystem();
  const [viewMode, setViewMode] = useState('circle');
  const [selectedPlanet, setSelectedPlanet] = useState(PLANETS[2]); // Mars default

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.triText}>☉ Leo  ☽ Cancer  ↑ Leo</Text>
          </View>
        </View>

        {/* Sub tabs */}
        <View style={s.subTabs}>
          <Text style={s.subTabActive}>Chart</Text>
          <Text style={s.subTab}>Saved</Text>
          <Text style={s.subTab}>Settings</Text>
        </View>
        <View style={s.sep} />

        {/* Toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity onPress={() => setViewMode('table')}>
            <Text style={[s.toggleText, viewMode === 'table' && s.toggleActive]}>TABLE</Text>
          </TouchableOpacity>
          <Text style={s.toggleDivider}>|</Text>
          <TouchableOpacity onPress={() => setViewMode('circle')}>
            <Text style={[s.toggleText, viewMode === 'circle' && s.toggleActive]}>CIRCLE</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'circle' ? (
          /* Circle Chart */
          <View style={s.chartWrap}>
            <Svg width={300} height={300} viewBox="0 0 300 300">
              <Circle cx={150} cy={150} r={135} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
              <Circle cx={150} cy={150} r={110} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
              <Circle cx={150} cy={150} r={70} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
              {/* Planet glyphs at approximate positions */}
              {PLANETS.map((p, i) => {
                const angle = (i * 40 + 30) * Math.PI / 180;
                const r = 95;
                const x = 150 + Math.cos(angle) * r;
                const y = 150 + Math.sin(angle) * r;
                return (
                  <G key={p.id} onPress={() => setSelectedPlanet(p)}>
                    <Circle cx={x} cy={y} r={p.isDasha ? 8 : 6}
                      fill={p.isDasha ? C.gFaint : 'rgba(255,255,255,0.03)'}
                      stroke={p.isDasha ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={0.5} />
                    <SvgText x={x} y={y + 3} textAnchor="middle"
                      fill={p.isDasha ? C.gold : 'rgba(255,255,255,0.7)'}
                      fontSize={p.isDasha ? 9 : 8}>{p.glyph}</SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        ) : (
          /* Table View */
          <View style={s.tableWrap}>
            {PLANETS.map(p => (
              <TouchableOpacity key={p.id} style={[s.tableRow, p.isDasha && s.tableRowGold]} onPress={() => setSelectedPlanet(p)}>
                <Text style={[s.tableGlyph, p.isDasha && { color: C.gold }]}>{p.glyph}</Text>
                <Text style={[s.tableName, p.isDasha && { color: C.gold }]}>{p.name}</Text>
                <Text style={s.tableSign}>{p.sign} {p.deg}</Text>
                <Text style={[s.tableHouse, p.isDasha && { color: C.gText }]}>{p.house}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Planet Reading */}
        {selectedPlanet && (
          <PlanetReading planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
        )}

        <TouchableOpacity style={s.detailsBtn}>
          <Text style={s.detailsBtnText}>DETAILS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 8,
  },
  triText: { fontSize: 13, color: C.t2, letterSpacing: 0.5 },
  subTabs: {
    flexDirection: 'row', gap: 24, paddingHorizontal: 20,
    paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.b1,
  },
  subTabActive: { fontSize: 12, letterSpacing: 2, color: C.t1, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: C.t2, paddingBottom: 10 },
  subTab: { fontSize: 12, letterSpacing: 2, color: C.t3, textTransform: 'uppercase', paddingBottom: 10 },
  sep: { height: 0.5, backgroundColor: C.b1 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 14, alignItems: 'center' },
  toggleText: { fontSize: 11, letterSpacing: 2.5, color: C.t3 },
  toggleActive: { color: C.t1, textDecorationLine: 'underline', textDecorationStyle: 'solid' },
  toggleDivider: { color: C.t4, fontSize: 12 },

  chartWrap: { alignItems: 'center', paddingVertical: 8 },

  tableWrap: { paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: C.b2 },
  tableRowGold: { borderLeftWidth: 2, borderLeftColor: 'rgba(212,175,55,0.3)' },
  tableGlyph: { width: 32, fontSize: 16, color: C.t2 },
  tableName: { flex: 1, fontSize: 13, color: C.t1, letterSpacing: 0.5 },
  tableSign: { fontSize: 12, color: C.t3, letterSpacing: 0.5 },
  tableHouse: { fontSize: 9, color: C.t3, letterSpacing: 1.5, marginLeft: 12, textTransform: 'uppercase' },

  readingCard: {
    borderWidth: 0.5, borderColor: C.b1, borderRadius: 2,
    padding: 20, marginHorizontal: 20, marginTop: 16,
  },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  readingTitle: { fontFamily: 'PlayfairDisplay', fontSize: 22, fontWeight: '300', color: C.t1 },
  readingPos: { fontSize: 10, letterSpacing: 2, color: C.t3, marginTop: 4, textTransform: 'uppercase' },
  readingTags: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  readingTag: { paddingHorizontal: 10, paddingVertical: 3, borderWidth: 0.5, borderColor: C.b1, borderRadius: 2 },
  readingTagText: { fontSize: 9, letterSpacing: 1.5, color: C.t3 },

  detailsBtn: { alignItems: 'center', paddingVertical: 20 },
  detailsBtnText: { fontSize: 10, letterSpacing: 2.5, color: C.t4, textDecorationLine: 'underline' },
});