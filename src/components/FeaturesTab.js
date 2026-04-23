import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { tFeature, tCategory, t } from '../i18n';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW * 0.38;
const CARD_H = CARD_W * 1.15;

// ─── FEATURE CATEGORIES ───

const CATEGORIES = [
  {
    id: 'today', catKey: 'todayGuide',
    features: [
      { id: 'daily-vibe', color: '#8B5CF6' },
      { id: 'power-hours', color: '#3B82F6' },
      { id: 'planet-strength', color: '#10B981' },
      { id: 'weekly-forecast', color: '#06B6D4' },
      { id: 'festivals', color: '#F59E0B' },
    ],
  },
  {
    id: 'identity', catKey: 'knowYourself',
    features: [
      { id: 'soul-profile', color: '#D4AF37' },
      { id: 'rare-traits', color: '#14B8A6' },
      { id: 'nakshatra-profile', color: '#818CF8' },
      { id: 'active-yogas', color: '#F472B6' },
      { id: 'cosmic-novel', color: '#6366F1' },
      { id: 'numerology', color: '#A78BFA' },
    ],
  },
  {
    id: 'love', catKey: 'loveRelations',
    features: [
      { id: 'ideal-partner', color: '#F472B6' },
      { id: 'cosmic-match', color: '#EC4899' },
      { id: 'match-oracle', color: '#A855F7' },
    ],
  },
  {
    id: 'money', catKey: 'moneyCareer',
    features: [
      { id: 'money-calendar', color: '#22C55E' },
      { id: 'career-path', color: '#0EA5E9' },
      { id: 'gemstone-profile', color: '#6366F1' },
      { id: 'year-map', color: '#8B5CF6' },
      { id: 'danger-radar', color: '#EF4444' },
    ],
  },
  {
    id: 'deep', catKey: 'deepDive',
    features: [
      { id: 'health-map', color: '#10B981' },
      { id: 'eclipse-impact', color: '#F59E0B' },
      { id: 'nadi-reading', color: '#8B5CF6' },
      { id: 'vastu', color: '#D4AF37' },
      { id: 'personal-deities', color: '#F97316' },
    ],
  },
  {
    id: 'decisions', catKey: 'lifeDecisions',
    features: [
      { id: 'what-if', color: '#6366F1' },
      { id: 'find-muhurta', color: '#D4AF37' },
      { id: 'past-event', color: '#64748B' },
      { id: 'family-karma', color: '#A855F7' },
    ],
  },
];

// ─── FEATURE CARD ───

const FeatureCard = ({ feature, language, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: feature.color + '20' }]}
    activeOpacity={0.7}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(feature.id);
    }}
  >
    <View style={[styles.cardDot, { backgroundColor: feature.color + '40' }]} />
    <Text style={styles.cardLabel} numberOfLines={1}>{tFeature(feature.id, 'title', language)}</Text>
    <Text style={styles.cardSub} numberOfLines={1}>{tFeature(feature.id, 'sub', language)}</Text>
  </TouchableOpacity>
);

// ─── CATEGORY ROW ───

const CategoryRow = ({ category, language, onFeaturePress }) => (
  <View style={styles.rowContainer}>
    <Text style={styles.rowTitle}>
      {tCategory(category.catKey, language)}
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowScroll}
      decelerationRate="fast"
      snapToInterval={CARD_W + 12}
    >
      {category.features.map(f => (
        <FeatureCard key={f.id} feature={f} language={language} onPress={onFeaturePress} />
      ))}
    </ScrollView>
  </View>
);

// ─── MAIN ───

export default function FeaturesTab({ language, onNavigate, kundliData }) {
  const handleFeaturePress = useCallback((featureId) => {
    if (onNavigate) onNavigate(featureId);
  }, [onNavigate]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>
        {t('explore', language)}
      </Text>
      {CATEGORIES.map(cat => (
        <CategoryRow key={cat.id} category={cat} language={language} onFeaturePress={handleFeaturePress} />
      ))}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 60, paddingBottom: 120 },
  header: {
    fontSize: 28, fontWeight: '200', color: colors.white,
    letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 24,
  },
  rowContainer: { marginBottom: 28 },
  rowTitle: {
    fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 12,
  },
  rowScroll: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    padding: 16, justifyContent: 'space-between',
  },
  cardDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  cardLabel: {
    fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2, marginTop: 'auto',
  },
  cardSub: {
    fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.3, marginTop: 4,
  },
  bottomPad: { height: 40 },
});