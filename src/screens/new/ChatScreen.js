import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from '../../theme/design';
import { useSystem } from '../../context/SystemContext';
import ArcSelector from '../../components/ArcSelector';

const API = 'https://api.plutto.space/api/public';

export default function ChatScreen({ kundliData, language }) {
  const { system } = useSystem();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef();

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          kundli_data: kundliData,
          language: language || 'en',
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const reply = data.response || data.message || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', text: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.', ts: Date.now() }]);
    }
    setLoading(false);
  }, [input, loading, kundliData, language, messages]);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.msgWrap, isUser && s.msgWrapUser]}>
        <View style={[s.msgBubble, isUser && s.msgBubbleUser]}>
          <Text style={[s.msgText, isUser && s.msgTextUser]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      <View style={s.headerArea}>
        <ArcSelector />
        <View style={s.systemRow}>
          <Text style={s.systemName}>{system.name}</Text>
          <Text style={s.systemSub}>{system.sub}</Text>
        </View>
        <View style={s.sep} />
      </View>

      {messages.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyDot} />
          <Text style={s.emptyText}>ASK ANYTHING</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.messagesList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.2)" />
        </View>
      )}

      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="ask anything..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
          <Text style={s.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.void },
  headerArea: { paddingTop: Platform.OS === 'ios' ? 56 : 36 },
  systemRow: { alignItems: 'center', paddingBottom: 12 },
  systemName: { fontFamily: 'PlayfairDisplay', fontSize: 18, fontWeight: '300', color: C.t1 },
  systemSub: { fontSize: 9, letterSpacing: 2.5, color: C.t3, marginTop: 3, textTransform: 'uppercase' },
  sep: { height: 0.5, backgroundColor: C.b1 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 40 },
  emptyText: { fontSize: 11, letterSpacing: 3, color: C.t4 },

  messagesList: { padding: 20, paddingBottom: 10 },
  msgWrap: { marginBottom: 16, alignItems: 'flex-start' },
  msgWrapUser: { alignItems: 'flex-end' },
  msgBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: C.b1,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  msgBubbleUser: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: C.b2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  msgText: { fontSize: 14, fontWeight: '300', color: C.t2, lineHeight: 22 },
  msgTextUser: { color: C.t1 },

  loadingWrap: { paddingVertical: 8, alignItems: 'flex-start', paddingLeft: 28 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 0.5,
    borderTopColor: C.b1,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '300',
    color: C.t1,
    borderWidth: 0.5,
    borderColor: C.b1,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendIcon: { fontSize: 16, color: C.t2, marginTop: -1 },
});