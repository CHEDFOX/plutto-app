import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Easing, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import { chatSideStream } from '../api/backend';
import GlowingInput from '../components/GlowingInput';
import { UserBubble, OracleBubble } from '../components/MessageBubble';
import ChatVoiceToggle from '../components/ChatVoiceToggle';
import BirthInputFlow from '../components/BirthInputFlow';
import ShapeIntro from '../components/ShapeIntro';
import { t } from '../i18n';
import VoiceChatScreen from './VoiceChatScreen';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

const KOOTA_COLORS = [
  '#D4AF37', '#C9A030', '#BF9228', '#B48320',
  '#AA7518', '#9F6610', '#955808', '#8A4A00',
];

const KOOTA_NAMES = ['Varna', 'Vashya', 'Tara', 'Yoni', 'Maitri', 'Gana', 'Bhakoot', 'Nadi'];
const KOOTA_MAX = [1, 2, 3, 4, 5, 6, 7, 8]; // total 36


// ─── PIE CHART ───
const ResonanceChart = ({ kootas, total, maxScore, percentage, onDone }) => {
  const anims = useRef(KOOTA_MAX.map(() => new Animated.Value(0))).current;
  const centerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger-fill each segment
    const sequence = anims.map((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    );
    Animated.stagger(150, [
      ...sequence,
      Animated.timing(centerOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();

    // Auto-transition to chat after 5 seconds
    const timer = setTimeout(() => onDone?.(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const cx = 120, cy = 120, r = 90, r2 = 60;
  let startAngle = -90; // start from top

  const segments = (kootas || []).map((k, i) => {
    const maxPts = k.max || KOOTA_MAX[i] || 4;
    const score = k.score || 0;
    const sweepAngle = (maxPts / 36) * 360;
    const fillAngle = (score / maxPts) * sweepAngle;

    const seg = { startAngle, sweepAngle, fillAngle, score, max: maxPts, name: k.name || KOOTA_NAMES[i] };
    startAngle += sweepAngle;
    return seg;
  });

  const arcPath = (cx, cy, r, r2, startDeg, sweepDeg) => {
    if (sweepDeg <= 0) return '';
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + sweepDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const x3 = cx + r2 * Math.cos(e), y3 = cy + r2 * Math.sin(e);
    const x4 = cx + r2 * Math.cos(s), y4 = cy + r2 * Math.sin(s);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${x3},${y3} A${r2},${r2},0,${large},0,${x4},${y4} Z`;
  };

  return (
    <View style={pc.wrap}>
      <Svg width={240} height={240} viewBox="0 0 240 240">
        {/* Background segments (dark) */}
        {segments.map((seg, i) => (
          <Path
            key={`bg-${i}`}
            d={arcPath(cx, cy, r, r2, seg.startAngle, seg.sweepAngle - 1)}
            fill="rgba(255,255,255,0.04)"
          />
        ))}
        {/* Filled segments (gold) */}
        {segments.map((seg, i) => (
          seg.fillAngle > 0 ? (
            <Path
              key={`fill-${i}`}
              d={arcPath(cx, cy, r, r2, seg.startAngle, seg.fillAngle)}
              fill={KOOTA_COLORS[i]}
              opacity={0.85}
            />
          ) : null
        ))}
      </Svg>

      {/* Center score */}
      <Animated.View style={[pc.center, { opacity: centerOpacity }]}>
        <Text style={pc.score}>{total || 0}</Text>
        <Text style={pc.scoreMax}>/ {maxScore || 36}</Text>
        <Text style={pc.pct}>{Math.round(percentage || 0)}%</Text>
      </Animated.View>

      {/* Koota labels */}
      <View style={pc.labels}>
        {segments.map((seg, i) => (
          <View key={i} style={pc.labelRow}>
            <View style={[pc.labelDot, { backgroundColor: KOOTA_COLORS[i] }]} />
            <Text style={pc.labelName}>{seg.name}</Text>
            <Text style={pc.labelScore}>{seg.score}/{seg.max}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const pc = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 40 },
  center: { position: 'absolute', top: 40, left: 0, right: 0, height: 240, alignItems: 'center', justifyContent: 'center' },
  score: { color: '#fff', fontSize: 36, fontWeight: '200', letterSpacing: 2 },
  scoreMax: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '300', marginTop: -4 },
  pct: { color: colors.gold, fontSize: 13, fontWeight: '400', marginTop: 8, letterSpacing: 1 },
  labels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20, paddingHorizontal: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', width: '45%', marginVertical: 3, marginHorizontal: 4 },
  labelDot: { width: 4, height: 4, borderRadius: 2, marginRight: 6 },
  labelName: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '300', flex: 1 },
  labelScore: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' },
});


// ─── MAIN SCREEN ───
export default function CosmicBondScreen({ kundliData, language, fontFamily, onReturnToCenter, isVisible }) {
  const [phase, setPhase] = useState('hidden'); // hidden | intro | input | chart | chat
  const [partnerType, setPartnerType] = useState('life');

  // Reset to intro when becoming visible, hide when leaving
  useEffect(() => {
    if (isVisible) {
      setPartnerData(null);
      setMatchResult(null);
      setMessages([]);
      setInputText('');
      contextSent.current = false;
      // Small delay so the black screen renders first
      requestAnimationFrame(() => setPhase('intro'));
    } else {
      setPhase('hidden');
    }
  }, [isVisible]);
  const [partnerData, setPartnerData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [mode, setMode] = useState('chat');
  const scrollRef = useRef(null);
  const contextSent = useRef(false);

  const handleBirthSubmit = async (data) => {
    if (data.partnerType) setPartnerType(data.partnerType);
    setPartnerData(data);
    setPhase('loading');

    try {
      const raw = kundliData?.raw?.birth_details || {};
      const r = await fetch('https://api.plutto.space/api/public/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundli_data: kundliData,
          partner: { year: data.year, month: data.month, day: data.day, hour: data.hour, minute: data.minute, lat: data.lat, lng: data.lng },
        }),
      });
      const result = await r.json();
      if (result.success && result.data) {
        setMatchResult(result.data);
        setPhase('chart');
      } else {
        setPhase('chat'); // skip chart on error
      }
    } catch (e) {
      setPhase('chat');
    }
  };

  // Build context string for Oracle
  const getContext = () => {
    if (!partnerData || !matchResult) return '';
    const kootaStr = (matchResult.kootas || []).map(k => `${k.name}: ${k.score}/${k.max}`).join(', ');
    return `[Context: The user is asking about their ${partnerType === 'life' ? 'life partner' : partnerType} relationship with someone born ${partnerData.day}/${partnerData.month}/${partnerData.year} at ${partnerData.place || 'unknown place'}. Ashtakoota score: ${matchResult.total_score}/${matchResult.max_score} (${Math.round(matchResult.percentage)}%). Kootas: ${kootaStr}. ${matchResult.has_major_dosha ? 'WARNING: Major dosha detected.' : ''} Answer about this bond specifically.]\n\n`;
  };

  const streamResponse = useCallback(async (userText, baseMessages) => {
    setIsThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let oracleIdx = -1;
    let accumulated = '';
    let firstDelta = false;

    try {
      // Build partner chart data from birth details
      const partnerChart = partnerData ? {
        raw: { birth_details: { year: partnerData.year, month: partnerData.month, day: partnerData.day, hour: partnerData.hour, minute: partnerData.minute, latitude: partnerData.lat, longitude: partnerData.lng }, ascendant: 'unknown' }
      } : {};
      // Inject match context into first message
      const ctx = !contextSent.current && matchResult ? getContext() : '';
      if (ctx) contextSent.current = true;
      const msgWithCtx = ctx ? ctx + userText : userText;
      const stream = chatSideStream(msgWithCtx, kundliData, partnerChart, partnerData?.place || 'Partner', 'bond', baseMessages, language);
      for await (const event of stream) {
        if (event.type === 'delta') {
          if (!firstDelta) {
            firstDelta = true;
            setIsThinking(false);
            setMessages(prev => { oracleIdx = prev.length; return [...prev, { role: 'oracle', content: '', hook: '', streaming: true }]; });
          }
          accumulated += event.text;
          setMessages(prev => {
            if (oracleIdx < 0 || oracleIdx >= prev.length) return prev;
            const next = [...prev]; next[oracleIdx] = { ...next[oracleIdx], content: accumulated }; return next;
          });
        } else if (event.type === 'done') {
          const finalText = event.response?.length >= accumulated.length ? event.response : accumulated;
          setMessages(prev => {
            if (oracleIdx < 0 || oracleIdx >= prev.length) return [...prev, { role: 'oracle', content: finalText, hook: event.hook || '', streaming: false }];
            const next = [...prev]; next[oracleIdx] = { ...next[oracleIdx], content: finalText, hook: event.hook || '', streaming: false }; return next;
          });
          setIsThinking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'oracle', content: t('starsUnclear', language), hook: '' }]);
    }
  }, [kundliData, language, matchResult, partnerData, partnerType]);

  const sendMessage = useCallback((text) => {
    if (!text?.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    const cur = [...messages, userMsg];
    setMessages(cur);
    setInputText('');
    streamResponse(text.trim(), cur);
  }, [messages, streamResponse]);

  const handleHookTap = useCallback((hookText) => {
    streamResponse('Tell me more about: ' + hookText, messages);
  }, [messages, streamResponse]);

  const handleVoiceConv = useCallback((vc) => { if (vc?.length > 0) setMessages(p => [...p, ...vc]); }, []);

  const clearSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('hidden');
    setPartnerData(null);
    setMatchResult(null);
    setMessages([]);
    setInputText('');
    contextSent.current = false;
    onReturnToCenter?.();
  };

  if (showVoice) {
    // Build custom kundli with partner context for voice
    const voiceKundli = { ...kundliData, _bondContext: getContext() };
    return <VoiceChatScreen language={language} kundliData={voiceKundli} onClose={() => setShowVoice(false)} onConversationUpdate={handleVoiceConv} />;
  }

  return (
    <View style={s.container}>
      {/* Header — only in non-intro/input phases */}
      {phase !== 'intro' && phase !== 'input' && (
        <View style={s.header}>
          <TouchableOpacity onPress={clearSession} style={s.clearBtn} activeOpacity={0.6}>
            <Text style={s.clearText}>✕</Text>
          </TouchableOpacity>
          {phase === 'chat' && (
            <ChatVoiceToggle mode={mode} onChange={(m) => { setMode(m); if (m === 'voice') setShowVoice(true); }} />
          )}
        </View>
      )}

      {/* Phase: Intro animation */}
      {phase === 'intro' && (
        <ShapeIntro variant="bond" language={language} onComplete={() => setPhase('input')} />
      )}

      {/* Phase: Input */}
      {phase === 'input' && (
        <BirthInputFlow
          language={language}
          showPartnerType
          onComplete={handleBirthSubmit}
        />
      )}

      {/* Phase: Loading */}
      {phase === 'loading' && (
        <View style={s.centerWrap}>
          <View style={s.loadingDot} />
        </View>
      )}

      {/* Phase: Chart */}
      {phase === 'chart' && matchResult && (
        <ResonanceChart
          kootas={matchResult.kootas}
          total={matchResult.total_score}
          maxScore={matchResult.max_score}
          percentage={matchResult.percentage}
          onDone={() => setPhase('chat')}
        />
      )}

      {/* Phase: Chat */}
      {phase === 'chat' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={s.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m, i) =>
              m.role === 'user'
                ? <UserBubble key={i} text={m.content} />
                : <OracleBubble key={i} text={m.content} hook={m.hook} onHookTap={handleHookTap} fontFamily={fontFamily} isStreaming={m.streaming} />
            )}
          </ScrollView>
          <GlowingInput
            value={inputText}
            onChangeText={setInputText}
            onSend={() => sendMessage(inputText)}
            placeholder={t('askAboutBond', language)}
            isThinking={isThinking}
            fontFamily={fontFamily}
          />
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8, zIndex: 10 },
  clearBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: 'rgba(255,255,255,0.35)', fontSize: 18, fontWeight: '200' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  chatContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
});