import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { colors, spacing } from '../theme';
import { chatWithOracle, chatWithOracleStream } from '../api/backend';
import VoiceChatScreen from './VoiceChatScreen';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import FeaturesTab from '../components/FeaturesTab';
import FeatureSkyScreen from './FeatureSkyScreen';
import Starfield from '../components/Starfield';
import ChatVoiceToggle from '../components/ChatVoiceToggle';
import GlowingInput from '../components/GlowingInput';
import { UserBubble, OracleBubble } from '../components/MessageBubble';
import { t } from '../i18n';

const { width: SW, height: SH } = Dimensions.get('window');
const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

// ─── STAR BACKGROUND ───
const StarField = () => {
  const stars = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i, left: Math.random() * SW, top: Math.random() * SH,
      size: Math.random() * 1.2 + 0.3, opacity: Math.random() * 0.15 + 0.03,
    })), []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => <View key={s.id} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: s.size / 2, backgroundColor: colors.white, opacity: s.opacity }} />)}
    </View>
  );
};

// ─── TAB ICONS ───
const ChatIcon = ({ active }) => (
  <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', shadowColor: '#fff', shadowOpacity: active ? 0.4 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
  </View>
);
const YouIcon = ({ active }) => (
  <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', shadowColor: '#fff', shadowOpacity: active ? 0.4 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
  </View>
);
const FeaturesIcon = ({ active }) => {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { const s = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })); s.start(); return () => s.stop(); }, []);
  const lc = active ? colors.gold : 'rgba(212,175,55,0.4)';
  return (
    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: 8 }, (_, i) => {
        const tr = Animated.add(rot, new Animated.Value(-i * 0.035)).interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        const op = active ? (1 - i / 8) * 0.5 : (1 - i / 8) * 0.15;
        return (<Animated.View key={i} style={{ position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: tr }] }}><View style={{ position: 'absolute', top: 0, width: 1, height: 7, borderRadius: 0.5, backgroundColor: lc, opacity: op }} /></Animated.View>);
      })}
      <Animated.View style={{ position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <View style={{ position: 'absolute', top: 0, width: 1.5, height: 8, borderRadius: 0.75, backgroundColor: active ? colors.gold : 'rgba(212,175,55,0.5)', shadowColor: colors.gold, shadowOpacity: active ? 0.6 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
    </View>
  );
};

// ─── CHART FINGERPRINT (always rotating) ───
const ChartFingerprint = ({ kundliData, size = 70 }) => {
  const planets = kundliData?.planets || kundliData?.raw?.planets || {};
  const r = size * 0.38, c = size / 2, ds = 2.5;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { const s = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })); s.start(); return () => s.stop(); }, []);
  const pts = useMemo(() => ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n => {
    const h = (planets[n] || {}).house || 1;
    const a = ((h - 1) * 30 + 15) * (Math.PI / 180) - Math.PI / 2;
    return { n, x: c + Math.cos(a) * r, y: c + Math.sin(a) * r };
  }), [planets, size]);
  const lns = useMemo(() => pts.map((p, i) => {
    const nx = pts[(i + 1) % pts.length];
    const dx = nx.x - p.x, dy = nx.y - p.y;
    return { x: p.x, y: p.y, l: Math.sqrt(dx * dx + dy * dy), a: Math.atan2(dy, dx) * (180 / Math.PI), k: `${i}` };
  }), [pts]);
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <View style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, borderWidth: 0.3, borderColor: 'rgba(255,255,255,0.08)', left: c - r, top: c - r }} />
      {lns.map(l => <View key={l.k} style={{ position: 'absolute', left: l.x, top: l.y, width: l.l, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: `${l.a}deg` }], transformOrigin: 'left center' }} />)}
      {pts.map(p => <View key={p.n} style={{ position: 'absolute', left: p.x - ds / 2, top: p.y - ds / 2, width: ds, height: ds, borderRadius: ds / 2, backgroundColor: 'rgba(255,255,255,0.6)' }} />)}
      <View style={{ position: 'absolute', left: c - 1.5, top: c - 1.5, width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.gold }} />
    </Animated.View>
  );
};

// ─── PREMIUM SOUL MAP ───
const SoulMap = ({ soulProfile, language = 'en' }) => {
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const centerScale = useRef(new Animated.Value(1)).current;
  const lightWave = useRef(new Animated.Value(0)).current;
  const lightOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacities = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
  const wordColors = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const revealTimeout = useRef(null);
  const autoInterval = useRef(null);
  const lastRevealed = useRef([]);
  const latin = isLatinScript(language);

  // Breathing center — 4 second cycle
  const breathAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(breathAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    b.start();
    return () => b.stop();
  }, []);
  const breathScale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  // Orbiting dot — 20 second revolution
  const orbitAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const o = Animated.loop(Animated.timing(orbitAnim, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: false }));
    o.start();
    return () => o.stop();
  }, []);

  // Traveling particles — 4 lines, staggered 8 second travel
  const particleAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const particleOpacities = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const runParticles = () => {
      [0, 1, 2, 3].forEach((i) => {
        const delay = i * 2000;
        setTimeout(() => {
          particleAnims[i].setValue(0);
          particleOpacities[i].setValue(0);
          Animated.parallel([
            Animated.timing(particleAnims[i], { toValue: 1, duration: 6000, easing: Easing.out(Easing.ease), useNativeDriver: false }),
            Animated.sequence([
              Animated.timing(particleOpacities[i], { toValue: 1, duration: 500, useNativeDriver: false }),
              Animated.delay(4000),
              Animated.timing(particleOpacities[i], { toValue: 0, duration: 1500, useNativeDriver: false }),
            ]),
          ]).start();
        }, delay);
      });
    };
    runParticles();
    const interval = setInterval(runParticles, 10000);
    return () => clearInterval(interval);
  }, []);

  // Default labels and revealed text
  const defaultLabels = {
    en: ['dharma', 'karma', 'kama', 'moksha'],
    hi: ['धर्म', 'कर्म', 'काम', 'मोक्ष'],
    zh: ['法', '业', '欲', '解脱'],
    es: ['dharma', 'karma', 'deseo', 'libertad'],
    pt: ['dharma', 'karma', 'desejo', 'libertação'],
    ja: ['ダルマ', 'カルマ', '欲望', '解脱'],
  };
  const labels = defaultLabels[language] || defaultLabels.en;
  const defaultRevealed = {
    en: ['sacred path', 'walk your road', 'heart speaks', 'journey home'],
    hi: ['पवित्र मार्ग', 'अपना रास्ता चलो', 'हृदय बोलता है', 'घर की यात्रा'],
    es: ['camino sagrado', 'anda tu camino', 'el corazón habla', 'viaje al hogar'],
    pt: ['caminho sagrado', 'siga seu caminho', 'o coração fala', 'jornada ao lar'],
    zh: ['神圣之路', '走你的路', '心在说话', '回家之旅'],
    ja: ['聖なる道', '道を歩め', '心が語る', '帰路の旅'],
  };
  const revealed = soulProfile
    ? [soulProfile.dharma, soulProfile.karma, soulProfile.kama, soulProfile.moksha]
    : defaultRevealed[language] || defaultRevealed.en;

  const [displayTexts, setDisplayTexts] = useState(labels);

  const pickRandom = () => {
    const avail = [0, 1, 2, 3].filter(i => !lastRevealed.current.includes(i));
    const pool = avail.length > 0 ? avail : [0, 1, 2, 3];
    const idx = pool[Math.floor(Math.random() * pool.length)];
    lastRevealed.current.push(idx);
    if (lastRevealed.current.length > 2) lastRevealed.current.shift();
    return idx;
  };

  const revealOne = (idx) => {
    if (revealedIndex >= 0) {
      const prev = revealedIndex;
      Animated.timing(wordColors[prev], { toValue: 0, duration: 300, useNativeDriver: false }).start();
      Animated.timing(wordOpacities[prev], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
        setDisplayTexts(p => { const n = [...p]; n[prev] = labels[prev]; return n; });
        Animated.timing(wordOpacities[prev], { toValue: 1, duration: 300, useNativeDriver: false }).start();
      });
    }
    setTimeout(() => {
      // Rush particle to the word
      particleAnims[idx].setValue(0);
      particleOpacities[idx].setValue(1);
      Animated.parallel([
        Animated.timing(particleAnims[idx], { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(particleOpacities[idx], { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
      ]).start();

      Animated.timing(wordOpacities[idx], { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setDisplayTexts(p => { const n = [...p]; n[idx] = revealed[idx]; return n; });
        Animated.timing(wordColors[idx], { toValue: 1, duration: 400, useNativeDriver: false }).start();
        Animated.timing(wordOpacities[idx], { toValue: 1, duration: 400, useNativeDriver: false }).start();
      });
      setRevealedIndex(idx);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
      revealTimeout.current = setTimeout(() => {
        Animated.timing(wordColors[idx], { toValue: 0, duration: 500, useNativeDriver: false }).start();
        Animated.timing(wordOpacities[idx], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
          setDisplayTexts(p => { const n = [...p]; n[idx] = labels[idx]; return n; });
          Animated.timing(wordOpacities[idx], { toValue: 1, duration: 300, useNativeDriver: false }).start();
        });
        setRevealedIndex(-1);
      }, 5000);
    }, revealedIndex >= 0 ? 350 : 0);
  };

  // Auto reveal all 4 every 4 minutes
  useEffect(() => {
    autoInterval.current = setInterval(() => {
      [0, 1, 2, 3].forEach((i) => {
        setTimeout(() => {
          particleAnims[i].setValue(0); particleOpacities[i].setValue(1);
          Animated.parallel([
            Animated.timing(particleAnims[i], { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.sequence([Animated.delay(300), Animated.timing(particleOpacities[i], { toValue: 0, duration: 200, useNativeDriver: false })]),
          ]).start();
          Animated.timing(wordOpacities[i], { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
            setDisplayTexts(p => { const n = [...p]; n[i] = revealed[i]; return n; });
            Animated.timing(wordColors[i], { toValue: 1, duration: 400, useNativeDriver: false }).start();
            Animated.timing(wordOpacities[i], { toValue: 1, duration: 400, useNativeDriver: false }).start();
          });
        }, i * 400);
      });
      setTimeout(() => {
        [0, 1, 2, 3].forEach((i) => {
          Animated.timing(wordColors[i], { toValue: 0, duration: 500, useNativeDriver: false }).start();
          Animated.timing(wordOpacities[i], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
            setDisplayTexts(p => { const n = [...p]; n[i] = labels[i]; return n; });
            Animated.timing(wordOpacities[i], { toValue: 1, duration: 300, useNativeDriver: false }).start();
          });
        });
        setRevealedIndex(-1);
      }, 10000);
    }, 240000);
    return () => { if (autoInterval.current) clearInterval(autoInterval.current); };
  }, []);

  const centerGold = useRef(new Animated.Value(0)).current;

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Gold flash
    centerGold.setValue(1);
    Animated.timing(centerGold, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    // Scale bounce
    Animated.sequence([
      Animated.timing(centerScale, { toValue: 0.7, duration: 80, useNativeDriver: false }),
      Animated.timing(centerScale, { toValue: 1.15, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.timing(centerScale, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
    lightWave.setValue(0); lightOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(lightWave, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(lightOpacity, { toValue: 0.4, duration: 150, useNativeDriver: false }),
        Animated.timing(lightOpacity, { toValue: 0, duration: 450, useNativeDriver: false }),
      ]),
    ]).start();
    revealOne(pickRandom());
  };

  useEffect(() => () => {
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    if (autoInterval.current) clearInterval(autoInterval.current);
  }, []);

  const lightScale = lightWave.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });
  const orbitDeg = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ws = latin ? {} : { letterSpacing: 0 };

  // Line + particle positions: top, left, right, bottom
  const lineLen = 50;
  const lineData = [
    { x1: 0, y1: -8, x2: 0, y2: -(8 + lineLen), dir: 'v', sign: -1 },   // top (dharma)
    { x1: -8, y1: 0, x2: -(8 + lineLen), y2: 0, dir: 'h', sign: -1 },   // left (karma)
    { x1: 8, y1: 0, x2: 8 + lineLen, y2: 0, dir: 'h', sign: 1 },        // right (kama)
    { x1: 0, y1: 8, x2: 0, y2: 8 + lineLen, dir: 'v', sign: 1 },         // bottom (moksha)
  ];

  const renderWord = (idx) => {
    const textColor = wordColors[idx].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.5)', 'rgba(212,175,55,0.9)'],
    });
    const isRevealed = displayTexts[idx] !== labels[idx];
    const isSide = idx === 1 || idx === 2;
    return (
      <View style={[_sm.wordWrap, isSide && _sm.wordWrapSide]}>
        <Animated.Text
          style={[_sm.word, isRevealed && _sm.wordRevealed, ws, { opacity: wordOpacities[idx], color: textColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {displayTexts[idx]}
        </Animated.Text>
      </View>
    );
  };

  const centerBorder = centerGold.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.45)', 'rgba(212,175,55,0.9)'],
  });

  return (
    <View style={_sm.container}>
      {/* Top — dharma */}
      {renderWord(0)}

      {/* Middle */}
      <View style={_sm.middleRow}>
        {renderWord(1)}

        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={_sm.centerArea}>
            {lineData.map((ld, i) => (
              <View key={`line-${i}`} style={{
                position: 'absolute',
                left: ld.dir === 'h' ? (ld.sign < 0 ? -(lineLen) : 8) : -0.15,
                top: ld.dir === 'v' ? (ld.sign < 0 ? -(lineLen) : 8) : -0.15,
                width: ld.dir === 'h' ? lineLen : 0.3,
                height: ld.dir === 'v' ? lineLen : 0.3,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }} />
            ))}

            {lineData.map((ld, i) => {
              const travel = particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, lineLen * ld.sign] });
              return (
                <Animated.View key={`particle-${i}`} style={{
                  position: 'absolute',
                  left: ld.dir === 'h' ? undefined : -1,
                  top: ld.dir === 'v' ? undefined : -1,
                  width: 2, height: 2, borderRadius: 1,
                  backgroundColor: colors.gold,
                  opacity: particleOpacities[i],
                  transform: ld.dir === 'h' ? [{ translateX: travel }] : [{ translateY: travel }],
                }} />
              );
            })}

            <Animated.View style={[_sm.lightWave, { opacity: lightOpacity, transform: [{ scale: lightScale }] }]} />

            <Animated.View style={{ position: 'absolute', width: 60, height: 60, transform: [{ rotate: orbitDeg }] }}>
              <View style={{ position: 'absolute', top: 0, left: 29, width: 2, height: 2, borderRadius: 1, backgroundColor: colors.gold, opacity: 0.08 }} />
            </Animated.View>

            <Animated.View style={[_sm.centerDot, { borderColor: centerBorder, transform: [{ scale: Animated.multiply(centerScale, breathScale) }] }]} />
          </View>
        </TouchableWithoutFeedback>

        {renderWord(2)}
      </View>

      {/* Bottom — moksha */}
      {renderWord(3)}
    </View>
  );
};

const _sm = StyleSheet.create({
  container: { width: 320, height: 220, alignItems: 'center', justifyContent: 'center' },
  wordWrap: { width: 200, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  wordWrapSide: { flex: 1, width: undefined },
  word: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'lowercase', textAlign: 'center' },
  wordRevealed: { fontSize: 9, letterSpacing: 0.5 },
  middleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 20 },
  centerArea: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  centerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  lightWave: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,248,220,0.08)' },
});

// ─── ARCHETYPES (fallback) ───
const ARCHETYPES = {
  Aries: { en: 'The Pioneer', hi: 'अग्रणी', es: 'El Pionero', pt: 'O Pioneiro', zh: '先驱者', ja: '先駆者' },
  Taurus: { en: 'The Sensualist', hi: 'रसिक', es: 'El Sensualista', pt: 'O Sensualista', zh: '感官家', ja: '感覚主義者' },
  Gemini: { en: 'The Storyteller', hi: 'कथावाचक', es: 'El Narrador', pt: 'O Contador', zh: '故事家', ja: '語り部' },
  Cancer: { en: 'The Nurturer', hi: 'पालनकर्ता', es: 'El Protector', pt: 'O Protetor', zh: '养育者', ja: '育成者' },
  Leo: { en: 'The Luminary', hi: 'प्रकाशमान', es: 'El Luminario', pt: 'O Luminário', zh: '发光体', ja: '輝く者' },
  Virgo: { en: 'The Analyst', hi: 'विश्लेषक', es: 'El Analista', pt: 'O Analista', zh: '分析家', ja: '分析者' },
  Libra: { en: 'The Harmonist', hi: 'सामंजस्यकर्ता', es: 'El Armonizador', pt: 'O Harmonizador', zh: '和谐者', ja: '調和者' },
  Scorpio: { en: 'The Alchemist', hi: 'रसायनी', es: 'El Alquimista', pt: 'O Alquimista', zh: '炼金术士', ja: '錬金術師' },
  Sagittarius: { en: 'The Philosopher', hi: 'दार्शनिक', es: 'El Filósofo', pt: 'O Filósofo', zh: '哲学家', ja: '哲学者' },
  Capricorn: { en: 'The Architect', hi: 'वास्तुकार', es: 'El Arquitecto', pt: 'O Arquiteto', zh: '建筑师', ja: '建築家' },
  Aquarius: { en: 'The Visionary', hi: 'द्रष्टा', es: 'El Visionario', pt: 'O Visionário', zh: '远见者', ja: '先見者' },
  Pisces: { en: 'The Mystic', hi: 'रहस्यवादी', es: 'El Místico', pt: 'O Místico', zh: '神秘者', ja: '神秘家' },
};

// ─── ORACLE MESSAGE ───
const OracleMessage = ({ text, hook, onHookTap, fontFamily }) => (
  <View style={s.oracleBubble}>
    <Text style={[s.oracleText, fontFamily && { fontFamily }]}>{text}</Text>
    {hook ? (
      <TouchableOpacity style={s.hookContainer} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (onHookTap) onHookTap(hook); }}>
        <Text style={s.hookText}>{hook}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── EMPTY CHAT ───
const STARTERS = {
  en: [{ text: 'Marriage', query: 'Will I have a happy married life?' }, { text: 'Career', query: 'How is my career looking?' }, { text: 'Today', query: 'What does today hold for me?' }],
  hi: [{ text: 'विवाह', query: 'क्या मेरी शादी सुखी होगी?' }, { text: 'करियर', query: 'मेरा करियर कैसा रहेगा?' }, { text: 'आज', query: 'आज मेरे लिए क्या है?' }],
  es: [{ text: 'Amor', query: '¿Tendré un matrimonio feliz?' }, { text: 'Carrera', query: '¿Cómo se ve mi carrera?' }, { text: 'Hoy', query: '¿Qué me depara hoy?' }],
  pt: [{ text: 'Amor', query: 'Terei um casamento feliz?' }, { text: 'Carreira', query: 'Como está minha carreira?' }, { text: 'Hoje', query: 'O que o dia de hoje reserva?' }],
  zh: [{ text: '婚姻', query: '我的婚姻会幸福吗？' }, { text: '事业', query: '我的事业前景如何？' }, { text: '今天', query: '今天会怎样？' }],
  ja: [{ text: '結婚', query: '幸せな結婚ができますか？' }, { text: 'キャリア', query: 'キャリアの見通しは？' }, { text: '今日', query: '今日はどんな日？' }],
};
const EMPTY_TITLE = { en: 'Ask The Oracle', hi: 'ऑरेकल से पूछें', es: 'Pregunta al Oráculo', pt: 'Pergunte ao Oráculo', zh: '问神谕', ja: 'オラクルに聞く' };
const EMPTY_SUB = { en: 'or choose a topic', hi: 'या विषय चुनें', es: 'o elige un tema', pt: 'ou escolha um tema', zh: '或选择话题', ja: 'またはトピックを選択' };
const EmptyChat = ({ onSelect, language }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const latin = isLatinScript(language);
  const starters = STARTERS[language] || STARTERS.en;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={[s.emptyContainer, { opacity: fadeAnim }]}>
      <Text style={[s.emptyTitle, !latin && { letterSpacing: 0, fontWeight: '400' }]}>{EMPTY_TITLE[language] || EMPTY_TITLE.en}</Text>
      <Text style={[s.emptySubtitle, !latin && { letterSpacing: 0 }]}>{EMPTY_SUB[language] || EMPTY_SUB.en}</Text>
      <View style={s.starterRow}>
        {starters.map(item => <TouchableOpacity key={item.text} style={s.starterPill} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(item.query); }}><Text style={[s.starterText, !latin && { letterSpacing: 0 }]}>{item.text}</Text></TouchableOpacity>)}
      </View>
    </Animated.View>
  );
};

// ─── MODALS ───
const LANG_LIST = [{ code: 'en', name: 'English' }, { code: 'hi', name: 'हिंदी' }, { code: 'zh', name: '中文' }, { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' }, { code: 'ja', name: '日本語' }];
const LanguagePicker = ({ visible, current, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={s.modalContent}>
        {LANG_LIST.map(l => <TouchableOpacity key={l.code} style={[s.langOption, current === l.code && s.langOptionActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(l.code); }}><Text style={[s.langOptionText, current === l.code && s.langOptionTextActive]}>{l.name}</Text></TouchableOpacity>)}
      </View>
    </TouchableOpacity>
  </Modal>
);
const TYPO_LIST = [{ id: 'sans', name: 'Sans', preview: 'The stars speak to you', font: undefined }, { id: 'serif', name: 'Serif', preview: 'The stars speak to you', font: 'NotoSerif' }, { id: 'classic', name: 'Classic', preview: 'The stars speak to you', font: 'PlayfairDisplay' }];
const TypographyPicker = ({ visible, current, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={s.modalContent}>
        {TYPO_LIST.map(t => <TouchableOpacity key={t.id} style={[s.langOption, current === t.id && s.langOptionActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(t.id); }}><Text style={[s.typoName, current === t.id && s.langOptionTextActive]}>{t.name}</Text><Text style={[s.typoPreview, t.font && { fontFamily: t.font }]}>{t.preview}</Text></TouchableOpacity>)}
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─── YOU TAB ───
const YouTab = ({ userData, kundliData, language, onLogout, fontFamily }) => {
  const latin = isLatinScript(language);

  const soulProfile = kundliData?.soul_profile || kundliData?.soulProfile;
  const rawAsc = (typeof kundliData?.raw?.ascendant === 'string') ? kundliData.raw.ascendant : (kundliData?.raw?.ascendant?.rashi_english || kundliData?.ascendant || '');
  const RASHI_MAP = {1:'Aries',2:'Taurus',3:'Gemini',4:'Cancer',5:'Leo',6:'Virgo',7:'Libra',8:'Scorpio',9:'Sagittarius',10:'Capricorn',11:'Aquarius',12:'Pisces'};
  const ascendant = RASHI_MAP[rawAsc] || (typeof rawAsc === 'string' ? rawAsc.charAt(0).toUpperCase() + rawAsc.slice(1).toLowerCase() : 'Pisces');
  const archetype = ARCHETYPES[ascendant]?.[language] || ARCHETYPES[ascendant]?.en || soulProfile?.archetype || 'Seeker';

  const handleLeave = () => {
    Alert.alert(
      '',
      'Leave this space?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => { if (onLogout) onLogout(); } },
      ],
      { userInterfaceStyle: 'dark' }
    );
  };

  return (
    <View style={s.youContainer}>
      <View style={s.youHeader}>
        <ChartFingerprint kundliData={kundliData} size={70} />
        <Text style={[s.youName, !latin && { letterSpacing: 0, fontWeight: '400' }]}>{userData?.name || 'Seeker'}</Text>
        <Text style={[s.youArchetype, !latin && { letterSpacing: 0 }]}>{archetype}</Text>
      </View>
      <View style={s.youCenterSection}>
        <SoulMap soulProfile={soulProfile} language={language} />
      </View>
      <View style={s.youBottomSection}>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleLeave(); }}>
          <Text style={s.logoutText}>LEAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── FEATURES TAB (imported from components/FeaturesTab.js) ───

// ─── MAIN ───
export default function HomeScreen({ language = 'en', userData, birthData, kundliData, onLogout, onLanguageChange, onNavigate, chatMessages = [], onMessagesChange, fontFamily, typography = 'sans', onTypographyChange, onTabChange }) {
  const [activeTab, setActiveTab] = useState('chat');

  const switchTab = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [messages, setMessages] = useState(chatMessages);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (onMessagesChange) onMessagesChange(messages); }, [messages]);
  const latin = isLatinScript(language);

  // Streaming send: appends an oracle message immediately with empty content,
  // then mutates that same message's content as deltas arrive (real-time reveal).
  const streamOracleResponse = useCallback(async (userText, baseMessages) => {
    setIsThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Try streaming first
      let gotData = false;
      let oracleIdx = -1;
      let accumulated = '';

      try {
        const stream = chatWithOracleStream(userText, kundliData, baseMessages, language);
        for await (const event of stream) {
          if (event.type === 'delta') {
            if (!gotData) {
              gotData = true;
              setIsThinking(false);
              setMessages(prev => {
                oracleIdx = prev.length;
                return [...prev, { role: 'oracle', content: '', hook: '', streaming: true }];
              });
            }
            accumulated += event.text;
            setMessages(prev => {
              if (oracleIdx < 0 || oracleIdx >= prev.length) return prev;
              const next = [...prev];
              next[oracleIdx] = { ...next[oracleIdx], content: accumulated };
              return next;
            });
          } else if (event.type === 'done') {
            const finalText = event.response && event.response.length >= accumulated.length ? event.response : accumulated;
            setMessages(prev => {
              if (oracleIdx < 0 || oracleIdx >= prev.length)
                return [...prev, { role: 'oracle', content: finalText, hook: event.hook || '', streaming: false }];
              const next = [...prev];
              next[oracleIdx] = { ...next[oracleIdx], content: finalText, hook: event.hook || '', streaming: false };
              return next;
            });
            setIsThinking(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
        }
        // Stream ended — if we got data, done
        if (gotData) { setIsThinking(false); return; }
      } catch (streamErr) {
        // Stream failed, fall through to non-streaming
      }

      // Fallback: non-streaming (same endpoint voice chat uses)
      const result = await chatWithOracle(userText, kundliData, baseMessages, language);
      if (result?.success && result?.data?.response) {
        setMessages(prev => [...prev, { role: 'oracle', content: result.data.response, hook: result.data.hook || '', streaming: false }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setMessages(prev => [...prev, { role: 'oracle', content: t('starsUnclear', language), hook: '' }]);
      }
      setIsThinking(false);
    } catch (e) {
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'oracle', content: t('starsUnclear', language), hook: '' }]);
    }
  }, [kundliData, language]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    const cur = [...messages, userMsg];
    setMessages(cur);
    setInputText('');
    streamOracleResponse(text.trim(), cur);
  }, [messages, streamOracleResponse]);

  const handleHookTap = useCallback((hookText) => {
    streamOracleResponse("Tell me more about: " + hookText, messages);
  }, [messages, streamOracleResponse]);
  const handleVoiceConv = useCallback((vc) => { if (vc?.length > 0) setMessages(p => [...p, ...vc]); }, []);
  if (showVoiceChat) return <VoiceChatScreen language={language} kundliData={kundliData} onClose={() => { setShowVoiceChat(false); onTabChange?.('chat'); }} onConversationUpdate={handleVoiceConv} />;

  return (
    <View style={s.container}>
      <Starfield />
      {activeTab === 'chat' && (
        <KeyboardAvoidingView style={s.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <View style={s.topBar}>
            <ChatVoiceToggle
              mode="chat"
              onChange={(target) => {
                if (target === 'voice') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowVoiceChat(true);
                  onTabChange?.('voice');
                }
              }}
            />
          </View>
          {messages.length === 0 && !isThinking ? <View style={{ flex: 1 }} /> : (
            <ScrollView ref={scrollRef} style={s.messagesScroll} contentContainerStyle={s.messagesContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {messages.map((msg, i) => msg.role === 'user'
                ? <UserBubble key={i} text={msg.content} />
                : <OracleBubble key={i} text={msg.content} hook={msg.hook} onHookTap={handleHookTap} fontFamily={fontFamily} isNew={false} isStreaming={msg.streaming} />
              )}
              {isThinking && <View style={s.thinkingWrap}><View style={s.thinkingDots}><View style={[s.tDot, { opacity: 0.4 }]} /><View style={[s.tDot, { opacity: 0.6 }]} /><View style={[s.tDot, { opacity: 0.8 }]} /></View></View>}
            </ScrollView>
          )}
          <View style={s.inputWrap}>
            <GlowingInput
              value={inputText}
              onChangeText={setInputText}
              onSend={(txt) => { if (txt.trim()) sendMessage(txt); }}
              placeholder={t('askAnything', language)}
              isThinking={isThinking}
              fontFamily={fontFamily}
            />
          </View>
        </KeyboardAvoidingView>
      )}
      <View style={activeTab === 'features' ? { flex: 1 } : { position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <FeatureSkyScreen language={language} kundliData={kundliData} onBack={() => switchTab('chat')} isVisible={activeTab === 'features'} />
      </View>
      {activeTab === 'you' && <YouTab userData={userData} kundliData={kundliData} language={language} onLogout={onLogout} fontFamily={fontFamily} />}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem} onPress={() => switchTab('chat')}><ChatIcon active={activeTab === 'chat'} /></TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => switchTab('features')}><FeaturesIcon active={activeTab === 'features'} /></TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => switchTab('you')}><YouIcon active={activeTab === 'you'} /></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  topBar: { alignItems: 'center', justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 24, paddingBottom: 4 },
  voiceIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  voiceDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  chatArea: { flex: 1 }, messagesScroll: { flex: 1 }, messagesContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '78%', marginBottom: 16 },
  userText: { fontSize: 15, lineHeight: 21, color: colors.void },
  oracleBubble: { alignSelf: 'flex-start', maxWidth: '85%', marginBottom: 20 },
  oracleText: { fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.88)' },  // fontFamily applied inline
  hookContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  hookText: { fontSize: 14, lineHeight: 20, color: colors.gold, fontStyle: 'italic' },
  thinkingWrap: { alignSelf: 'flex-start', paddingVertical: 8 }, thinkingDots: { flexDirection: 'row', gap: 4 },
  tDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 28, fontWeight: '200', color: colors.white, letterSpacing: 2 },  // fontFamily applied inline
  emptySubtitle: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, marginTop: 8 },
  starterRow: { flexDirection: 'row', gap: 10, marginTop: 32 },
  starterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  starterText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3 },
  inputWrap: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 12 : 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, paddingLeft: 18, paddingRight: 6, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  textInput: { flex: 1, fontSize: 15, color: colors.white, maxHeight: 100, paddingVertical: 10 },  // fontFamily applied inline
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendArrow: { fontSize: 17, fontWeight: '600', color: colors.void, marginTop: -1 },
  featuresContainer: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 80 : 60 },
  featuresTitle: { fontSize: 28, fontWeight: '200', color: colors.white, letterSpacing: 1, marginBottom: 32 },
  featureCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  featureCardDisabled: { opacity: 0.5 }, featureTitle: { fontSize: 17, fontWeight: '400', color: colors.white },
  featureTitleDisabled: { color: colors.silver }, featureSubtitle: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  featureArrow: { fontSize: 24, fontWeight: '200', color: 'rgba(255,255,255,0.25)' },
  featureSoon: { fontSize: 10, fontWeight: '400', color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5, textTransform: 'uppercase' },
  youContainer: { flex: 1 },
  youHeader: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 8 },
  youName: { fontSize: 22, fontWeight: '200', color: colors.white, letterSpacing: 3, textTransform: 'uppercase', marginTop: 12 },
  youArchetype: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginTop: 4 },
  youCenterSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  youBottomSection: { paddingBottom: Platform.OS === 'ios' ? 8 : 4 },
  settingsSection: { paddingHorizontal: 32, marginBottom: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  settingLabel: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  settingValue: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.3)' },
  lockRow: { alignItems: 'center', paddingVertical: 16 },
  lockIcon: { fontSize: 20, opacity: 0.35 },
  lockIconActive: { opacity: 0.8 },
  inlinePasscode: { alignItems: 'center', paddingVertical: 12 },
  logoutBtn: { alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)', marginHorizontal: 32 },
  logoutText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,80,80,0.5)', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: colors.abyss, borderRadius: 20, padding: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', width: '100%', maxWidth: 280 },
  langOption: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  langOptionActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  langOptionText: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  langOptionTextActive: { color: colors.white, fontWeight: '400' },
  typoName: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  typoPreview: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 4 },
  tabBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 20, gap: 48 },
  tabItem: { padding: 12 },
});