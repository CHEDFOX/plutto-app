/**
 * THE WORD
 *
 * Small topic cards scattered. Tap one → others vanish,
 * selected gets gold border. Response appears around it.
 * Disappears after 10s, cards return. Asked topics gone 7 days.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ActivityIndicator, AsyncStorage,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';
const COOLDOWN_KEY = '@the_word_cooldowns';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const ALL_TOPICS = [
  'love', 'money', 'travel', 'health', 'career', 'marriage',
  'children', 'fame', 'enemies', 'property', 'education', 'luck',
  'friendship', 'spirituality', 'secrets', 'inheritance', 'promotion',
  'court case', 'debt', 'foreign', 'vehicle', 'surgery', 'business',
  'passion', 'freedom',
];

// Image spot per topic index — varied
const IMG_SPOTS = [
  { dx: 100, dy: -60 }, { dx: -80, dy: 50 }, { dx: 110, dy: 40 },
  { dx: -100, dy: -50 }, { dx: 90, dy: 60 }, { dx: -70, dy: -40 },
  { dx: 80, dy: -70 }, { dx: -90, dy: 30 }, { dx: 100, dy: 50 },
  { dx: -110, dy: -60 }, { dx: 70, dy: 40 }, { dx: -80, dy: -30 },
  { dx: 90, dy: -50 }, { dx: -100, dy: 60 }, { dx: 110, dy: -40 },
  { dx: -70, dy: 50 }, { dx: 80, dy: 30 }, { dx: -90, dy: -70 },
  { dx: 100, dy: -30 }, { dx: -80, dy: 40 }, { dx: 70, dy: -60 },
  { dx: -100, dy: 50 }, { dx: 90, dy: 30 }, { dx: -110, dy: -40 },
  { dx: 80, dy: 60 },
];

const ANSWER_COLORS = {
  yes: '#50C878',
  no: '#C85050',
  maybe: '#C89850',
};


// ─── Single Topic Card ───
function TopicCard({ topic, index, isSelected, isHidden, onPress, response, cardLayouts, imgSpot }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const responseOpacity = useRef(new Animated.Value(0)).current;

  // Hide/show animation
  useEffect(() => {
    if (isHidden) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isHidden]);

  // Response fade in
  useEffect(() => {
    if (response) {
      Animated.timing(responseOpacity, { toValue: 1, duration: 600, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }).start();
    } else {
      responseOpacity.setValue(0);
    }
  }, [response]);

  return (
    <Animated.View style={[cs.cardWrap, { opacity }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !isHidden && onPress(topic)}
        disabled={isHidden}
        style={[
          cs.card,
          isSelected && cs.cardSelected,
        ]}
      >
        <Text style={[cs.cardText, isSelected && cs.cardTextSelected]}>{topic}</Text>
      </TouchableOpacity>

      {/* Response overlay near the card */}
      {response && (
        <Animated.View style={[cs.responseWrap, { opacity: responseOpacity }]}>
          <View style={[cs.answerBadge, { backgroundColor: `${ANSWER_COLORS[response.answer] || W(0.1)}15`, borderColor: `${ANSWER_COLORS[response.answer] || W(0.1)}40` }]}>
            <Text style={[cs.answerText, { color: ANSWER_COLORS[response.answer] || W(0.5) }]}>
              {response.answer}
            </Text>
          </View>
          <Text style={cs.responseLine}>{response.line}</Text>
          {/* Image placeholder at varied spot */}
          <View style={[cs.imgZone, { left: imgSpot.dx > 0 ? imgSpot.dx - 80 : undefined, right: imgSpot.dx <= 0 ? Math.abs(imgSpot.dx) - 80 : undefined, top: imgSpot.dy }]}>
            <View style={cs.imgPlaceholder} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}


// ─── Main Component ───
export default function TheWordScreen({ visible, onClose, kundliData }) {
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldowns, setCooldowns] = useState({});

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);

  // Load cooldowns
  useEffect(() => {
    loadCooldowns();
  }, []);

  const loadCooldowns = async () => {
    try {
      const stored = await AsyncStorage?.getItem?.(COOLDOWN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean expired
        const now = Date.now();
        const cleaned = {};
        for (const [topic, timestamp] of Object.entries(parsed)) {
          if (now - timestamp < SEVEN_DAYS) cleaned[topic] = timestamp;
        }
        setCooldowns(cleaned);
      }
    } catch (e) {}
  };

  const saveCooldown = async (topic) => {
    try {
      const updated = { ...cooldowns, [topic]: Date.now() };
      setCooldowns(updated);
      await AsyncStorage?.setItem?.(COOLDOWN_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Filter available topics
  useEffect(() => {
    const now = Date.now();
    const available = ALL_TOPICS.filter(t => {
      const cd = cooldowns[t];
      return !cd || (now - cd >= SEVEN_DAYS);
    });
    setAvailableTopics(available);
  }, [cooldowns]);

  // Open/close
  useEffect(() => {
    if (visible) {
      setSelectedTopic(null);
      setResponse(null);
      loadCooldowns();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Handle topic press
  const handleTopicPress = useCallback(async (topic) => {
    if (selectedTopic || loading) return;
    setSelectedTopic(topic);
    setLoading(true);

    try {
      const r = await fetch(`${API_BASE}/the-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } },
        }),
      });
      const data = await r.json();
      setResponse(data);
      saveCooldown(topic);

      // Auto-dismiss after 10 seconds
      dismissTimer.current = setTimeout(() => {
        setSelectedTopic(null);
        setResponse(null);
        setLoading(false);
      }, 10000);
    } catch (e) {
      console.log('The word error:', e);
      setSelectedTopic(null);
    }
    setLoading(false);
  }, [selectedTopic, loading, kundliData, cooldowns]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handleWrap}><View style={s.handle} /></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={s.inner}>
          {/* Title */}
          <Text style={s.title}>The Word</Text>
          <Text style={s.subtitle}>tap a question the universe will answer</Text>

          {/* Cards grid */}
          <View style={cs.grid}>
            {availableTopics.map((topic, i) => {
              const isSelected = selectedTopic === topic;
              const isHidden = selectedTopic !== null && !isSelected;
              const imgSpot = IMG_SPOTS[i % IMG_SPOTS.length];

              return (
                <TopicCard
                  key={topic}
                  topic={topic}
                  index={i}
                  isSelected={isSelected}
                  isHidden={isHidden}
                  onPress={handleTopicPress}
                  response={isSelected ? response : null}
                  imgSpot={imgSpot}
                />
              );
            })}
          </View>

          {/* Loading indicator */}
          {loading && !response && (
            <View style={s.loadOverlay}>
              <ActivityIndicator color={GOLD} size="small" />
            </View>
          )}

          {/* Empty state */}
          {availableTopics.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>All questions asked.</Text>
              <Text style={s.emptySub}>New ones return after 7 days.</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}


// ─── Card styles ───
const cs = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 10,
  },
  cardWrap: {
    position: 'relative',
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: W(0.06),
    backgroundColor: W(0.01),
  },
  cardSelected: {
    borderColor: `${GOLD}40`,
    backgroundColor: `${GOLD}06`,
  },
  cardText: {
    fontSize: 13,
    color: W(0.4),
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  cardTextSelected: {
    color: GOLD,
    opacity: 0.7,
  },

  // Response
  responseWrap: {
    position: 'absolute',
    top: 50,
    left: -40,
    width: SW * 0.65,
    alignItems: 'flex-start',
    gap: 8,
    zIndex: 10,
  },
  answerBadge: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  responseLine: {
    fontSize: 14,
    color: W(0.7),
    lineHeight: 22,
    fontWeight: '300',
    fontFamily: 'PlayfairDisplay',
  },

  // Image zone
  imgZone: {
    position: 'absolute',
  },
  imgPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: W(0.02),
    backgroundColor: W(0.005),
  },
});

// ─── Sheet styles ───
const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.88,
    backgroundColor: '#030303', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: W(0.05),
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 3.5, borderRadius: 2, backgroundColor: W(0.08) },
  closeBtn: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  closeText: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  inner: { flex: 1, paddingTop: 16 },
  title: { fontFamily: 'PlayfairDisplay', fontSize: 22, color: W(0.8), textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: W(0.12), textAlign: 'center', marginTop: 6, letterSpacing: 1.5, fontWeight: '300' },
  loadOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontFamily: 'PlayfairDisplay', fontSize: 17, color: W(0.4) },
  emptySub: { fontSize: 12, color: W(0.12), fontWeight: '300' },
});
