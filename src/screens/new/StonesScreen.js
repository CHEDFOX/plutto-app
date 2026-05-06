import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from '../../theme/design';

export default function StonesScreen({ kundliData, language, navigation }) {
  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.headerLabel}>YOUR STONES</Text>
        </View>

        {/* Dasha Stone */}
        <View style={s.stoneCard}>
          <View style={s.stoneImage}>
            <View style={s.stoneCircle} />
          </View>
          <View style={s.stoneInfo}>
            <Text style={s.stoneName}>Red Coral</Text>
            <Text style={s.stoneHindi}>Moonga · 5.25 carat</Text>
            <Text style={s.stoneReason}>Mars dasha lord stone</Text>
          </View>
        </View>

        {/* Wearing details */}
        <View style={s.detailsGrid}>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>FINGER</Text>
            <Text style={s.detailValue}>Ring finger</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>HAND</Text>
            <Text style={s.detailValue}>Right</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>METAL</Text>
            <Text style={s.detailValue}>Gold</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>DAY</Text>
            <Text style={s.detailValue}>Tuesday</Text>
          </View>
        </View>

        {/* Activation */}
        <View style={s.activationCard}>
          <Text style={s.activationLabel}>ACTIVATION MUHURTA</Text>
          <Text style={s.activationDate}>Next: Tuesday, May 13 · 6:42 AM</Text>
          <Text style={s.activationMantra}>Om Angarakaya Namaha × 108</Text>
        </View>

        <View style={s.sep} />

        {/* Consult */}
        <TouchableOpacity style={s.consultBtn}>
          <Text style={s.consultText}>Consult the Oracle about stones</Text>
          <Text style={s.consultArrow}>→</Text>
        </TouchableOpacity>

        <View style={s.sep} />

        {/* Store Categories */}
        <Text style={s.sectionLabel}>GEMSTONE STORE</Text>
        {['Career & Success', 'Love & Relationships', 'Health & Protection', 'Wealth & Prosperity', 'Spiritual Growth'].map((cat, i) => (
          <TouchableOpacity key={i} style={s.storeRow}>
            <Text style={s.storeRowText}>{cat}</Text>
            <Text style={s.storeRowArrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  content: { paddingBottom: 20 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerLabel: { fontSize: 12, letterSpacing: 3, color: C.t2 },

  stoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stoneImage: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5, borderColor: C.b1,
    alignItems: 'center', justifyContent: 'center',
  },
  stoneCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stoneInfo: { flex: 1 },
  stoneName: { fontFamily: 'PlayfairDisplay', fontSize: 20, fontWeight: '300', color: C.t1 },
  stoneHindi: { fontSize: 10, letterSpacing: 1.5, color: C.t3, marginTop: 3, textTransform: 'uppercase' },
  stoneReason: { fontSize: 11, color: C.t2, marginTop: 6, fontWeight: '300' },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  detailItem: { width: '50%', marginBottom: 16 },
  detailLabel: { fontSize: 8, letterSpacing: 2, color: C.t4, textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: C.t2, marginTop: 3, fontWeight: '300' },

  activationCard: {
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 6,
    marginBottom: 20,
  },
  activationLabel: { fontSize: 9, letterSpacing: 2.5, color: C.t3 },
  activationDate: { fontSize: 13, color: C.t1, marginTop: 6, fontWeight: '300' },
  activationMantra: { fontSize: 11, color: C.t3, marginTop: 6, fontStyle: 'italic', fontWeight: '300' },

  sep: { height: 0.5, backgroundColor: C.b1, marginVertical: 4 },

  consultBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 18,
  },
  consultText: { fontSize: 13, color: C.t1, fontWeight: '300' },
  consultArrow: { fontSize: 16, color: C.t3 },

  sectionLabel: { fontSize: 9, letterSpacing: 3, color: C.t3, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  storeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 0.5, borderBottomColor: C.b2,
  },
  storeRowText: { fontSize: 13, color: C.t2, fontWeight: '300' },
  storeRowArrow: { fontSize: 14, color: C.t4 },
});