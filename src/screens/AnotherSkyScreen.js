import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../theme';
import { chatSideStream, generateKundli } from '../api/backend';
import GlowingInput from '../components/GlowingInput';
import { UserBubble, OracleBubble } from '../components/MessageBubble';
import ChatVoiceToggle from '../components/ChatVoiceToggle';
import BirthInputFlow from '../components/BirthInputFlow';
import ShapeIntro from '../components/ShapeIntro';
import VoiceChatScreen from './VoiceChatScreen';
import * as Haptics from 'expo-haptics';
import { t } from '../i18n';


// ─── MAIN SCREEN ───
export default function AnotherSkyScreen({ kundliData, language, fontFamily, onReturnToCenter, isVisible }) {
  const [phase, setPhase] = useState('hidden'); // hidden | intro | input | chat
  const [otherData, setOtherData] = useState(null);
  const [otherKundli, setOtherKundli] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [mode, setMode] = useState('chat');
  const scrollRef = useRef(null);
  const contextSent = useRef(false);

  // Reset to intro when becoming visible, hide when leaving
  useEffect(() => {
    if (isVisible) {
      setOtherData(null);
      setOtherKundli(null);
      setMessages([]);
      setInputText('');
      contextSent.current = false;
      requestAnimationFrame(() => setPhase('intro'));
    } else {
      setPhase('hidden');
    }
  }, [isVisible]);

  const handleBirthSubmit = async (data) => {
    setOtherData(data);
    setPhase('loading');

    try {
      // Generate the other person's kundli
      const userData = { name: 'Other' };
      const birthDataFormatted = {
        date: { day: data.day, monthIndex: data.month, year: data.year },
        time: { hour: data.hour, minute: data.minute },
        place: { name: data.place, lat: data.lat, lng: data.lng },
      };
      const result = await generateKundli(userData, birthDataFormatted);

      if (result?.success && result?.data) {
        setOtherKundli(result.data);
      }
      setPhase('chat');
    } catch (e) {
      setPhase('chat');
    }
  };

  const getContext = () => {
    if (!otherData) return '';
    const chartStr = otherKundli ? JSON.stringify(otherKundli).slice(0, 800) : 'chart generation failed';
    return `[Context: The user is asking about ANOTHER PERSON's chart — someone born ${otherData.day}/${otherData.month}/${otherData.year} at ${otherData.hour}:${otherData.minute} in ${otherData.place || 'unknown'}. Their chart data: ${chartStr}. Answer about THIS OTHER PERSON's chart, not the user's own chart. The user wants to understand this other person's astrology.]\n\n`;
  };

  const streamResponse = useCallback(async (userText, baseMessages) => {
    setIsThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let oracleIdx = -1;
    let accumulated = '';
    let firstDelta = false;

    try {
      const stream = chatSideStream(userText, kundliData, otherKundli, otherData?.name || 'Other', 'other_sky', baseMessages, language);
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
  }, [kundliData, otherKundli, language, otherData]);

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
    setOtherData(null);
    setOtherKundli(null);
    setMessages([]);
    setInputText('');
    contextSent.current = false;
    onReturnToCenter?.();
  };

  if (showVoice) {
    const voiceKundli = otherKundli || kundliData;
    return <VoiceChatScreen language={language} kundliData={voiceKundli} onClose={() => setShowVoice(false)} onConversationUpdate={handleVoiceConv} />;
  }

  return (
    <View style={s.container}>
      {/* Header — only in chat phase */}
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
        <ShapeIntro variant="sky" language={language} onComplete={() => setPhase('input')} />
      )}

      {/* Phase: Input */}
      {phase === 'input' && (
        <BirthInputFlow onComplete={handleBirthSubmit} title="their birth date" />
      )}

      {/* Phase: Loading */}
      {phase === 'loading' && (
        <View style={s.centerWrap}>
          <View style={s.loadingDot} />
        </View>
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
            placeholder={t('askAboutChart', language)}
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