import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { colors } from '../theme';
import { getRealtimeDashboard } from '../api/backend';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────
// DATA CARD COMPONENT
// ─────────────────────────────────────────────
const DataCard = ({ label, value, accent }) => (
  <View style={s.dataCard}>
    <Text style={s.dataLabel}>{label}</Text>
    <Text style={[s.dataValue, accent && { color: colors.gold }]}>{value}</Text>
  </View>
);

// ─────────────────────────────────────────────
// TRIO DISPLAY (number, color, direction)
// ─────────────────────────────────────────────
const TrioItem = ({ label, value }) => (
  <View style={s.trioItem}>
    <View style={s.trioCircle}>
      <Text style={s.trioValue}>{value}</Text>
    </View>
    <Text style={s.trioLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────
// ALERT ITEM
// ─────────────────────────────────────────────
const AlertItem = ({ text }) => (
  <View style={s.alertItem}>
    <View style={s.alertDot} />
    <Text style={s.alertText}>{text}</Text>
  </View>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function LuckyDashboardScreen({ kundliData, language = 'en', onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const result = await getRealtimeDashboard(kundliData);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  // Extract display values
  const day = data?.day || new Date().toLocaleDateString('en', { weekday: 'long' });
  const dayPlanet = data?.day_planet || '';
  const luckyNum = data?.personal_day_number || '—';
  const luckyColor = data?.lucky_color?.split(',')[0]?.trim() || '—';
  const luckyDir = data?.lucky_direction || '—';
  const hora = data?.current_hora || '—';
  const choghadiya = data?.choghadiya || {};
  const abhijit = data?.abhijit_muhurta || {};
  const rahuKalam = data?.rahu_kalam || '';
  const biorhythm = data?.biorhythm || {};
  const alerts = data?.planetary_alerts || [];
  const advice = data?.quick_advice || '';
  const sadeSati = data?.sade_sati || '';

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="small" color={colors.white} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerDay}>{day}</Text>
          {dayPlanet ? <Text style={s.headerPlanet}>{dayPlanet}'s Day</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Lucky Trio ── */}
        <View style={s.trioRow}>
          <TrioItem label="Number" value={String(luckyNum)} />
          <TrioItem label="Color" value={luckyColor} />
          <TrioItem label="Direction" value={luckyDir} />
        </View>

        {/* ── Quick Advice ── */}
        {advice ? (
          <View style={s.adviceCard}>
            <Text style={s.adviceText}>{advice}</Text>
          </View>
        ) : null}

        {/* ── Time Windows ── */}
        <Text style={s.sectionTitle}>Time Windows</Text>

        <View style={s.timeGrid}>
          <DataCard label="Current Hora" value={hora} />
          <DataCard
            label="Choghadiya"
            value={`${choghadiya.name || '—'}`}
            accent={choghadiya.nature === 'Best'}
          />
        </View>

        {abhijit?.is_active && (
          <View style={s.abhijitCard}>
            <Text style={s.abhijitLabel}>Abhijit Muhurta Active</Text>
            <Text style={s.abhijitTime}>
              {abhijit.start} – {abhijit.end}
            </Text>
            <Text style={s.abhijitDesc}>Best window for new beginnings</Text>
          </View>
        )}

        {rahuKalam ? (
          <View style={s.rahuCard}>
            <Text style={s.rahuLabel}>Rahu Kalam</Text>
            <Text style={s.rahuTime}>{rahuKalam}</Text>
            <Text style={s.rahuDesc}>Avoid starting new activities</Text>
          </View>
        ) : null}

        {/* ── Biorhythm ── */}
        <View style={s.bioCard}>
          <View>
            <Text style={s.bioLabel}>Biorhythm</Text>
            <Text style={s.bioStatus}>{biorhythm.status || '—'}</Text>
          </View>
          <Text style={s.bioScore}>{biorhythm.score?.toFixed(0) || '—'}</Text>
        </View>

        {/* ── Sade Sati ── */}
        {sadeSati && sadeSati !== 'Not Active' && (
          <View style={s.sadeCard}>
            <Text style={s.sadeLabel}>Sade Sati</Text>
            <Text style={s.sadeStatus}>{sadeSati}</Text>
          </View>
        )}

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Planetary Alerts</Text>
            {alerts.map((alert, i) => (
              <AlertItem key={i} text={alert} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    fontWeight: '200',
    color: colors.white,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerDay: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 1,
  },
  headerPlanet: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // ── Trio ──
  trioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
  },
  trioItem: {
    alignItems: 'center',
    gap: 10,
  },
  trioCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trioValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  trioLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Advice ──
  adviceCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
    marginBottom: 28,
    alignItems: 'center',
  },
  adviceText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gold,
    letterSpacing: 0.3,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginTop: 8,
  },

  // ── Time Grid ──
  timeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dataCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.2,
  },

  // ── Abhijit ──
  abhijitCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(52,199,89,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.15)',
    marginBottom: 12,
  },
  abhijitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    letterSpacing: 0.5,
  },
  abhijitTime: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
    marginTop: 4,
  },
  abhijitDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },

  // ── Rahu ──
  rahuCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,59,48,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.1)',
    marginBottom: 20,
  },
  rahuLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    letterSpacing: 0.5,
  },
  rahuTime: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
    marginTop: 4,
  },
  rahuDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },

  // ── Bio ──
  bioCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  bioLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bioStatus: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
    marginTop: 4,
  },
  bioScore: {
    fontSize: 28,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.5)',
  },

  // ── Sade Sati ──
  sadeCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,165,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.1)',
    marginBottom: 20,
  },
  sadeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFA500',
    letterSpacing: 0.5,
  },
  sadeStatus: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.white,
    marginTop: 4,
  },

  // ── Alerts ──
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 19,
    letterSpacing: 0.1,
  },
});
