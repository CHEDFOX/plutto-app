import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

const ICON_SIZE = 22;
const CIRCLE_SIZE = 36;
const TOGGLE_GAP = 56;

const ChatGlyph = ({ active }) => (
  <View style={{ width: ICON_SIZE, height: ICON_SIZE, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: 14, height: 14, borderRadius: 7, borderWidth: 1.5,
      borderColor: active ? colors.gold : 'rgba(255,255,255,0.3)',
    }} />
  </View>
);

const VoiceGlyph = ({ active }) => {
  const c = active ? colors.gold : 'rgba(255,255,255,0.3)';
  return (
    <View style={{ width: ICON_SIZE, height: ICON_SIZE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      {[6,12,16,12,6].map((h,i) => <View key={i} style={{ width: 1.5, height: h, borderRadius: 1, backgroundColor: c }} />)}
    </View>
  );
};

export default function ChatVoiceToggle({ mode, onChange }) {
  const slide = useRef(new Animated.Value(mode === 'voice' ? 1 : 0)).current;
  const brightness = useRef(new Animated.Value(1)).current;
  const dimRef = useRef(null);

  useEffect(() => {
    Animated.spring(slide, { toValue: mode === 'voice' ? 1 : 0, damping: 18, stiffness: 180, useNativeDriver: true }).start();
    brightness.setValue(1);
    if (dimRef.current) clearTimeout(dimRef.current);
    dimRef.current = setTimeout(() => {
      Animated.timing(brightness, { toValue: 0.3, duration: 1200, useNativeDriver: true }).start();
    }, 2000);
    return () => { if (dimRef.current) clearTimeout(dimRef.current); };
  }, [mode]);

  const circleX = slide.interpolate({ inputRange: [0, 1], outputRange: [-TOGGLE_GAP / 2, TOGGLE_GAP / 2] });

  const tap = (target) => {
    if (target === mode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(target);
  };

  return (
    <View style={st.wrap}>
      <Animated.View style={[st.circle, { opacity: brightness, transform: [{ translateX: circleX }] }]} />
      <View style={st.row}>
        <TouchableOpacity onPress={() => tap('chat')} style={st.btn} activeOpacity={0.7} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <ChatGlyph active={mode === 'chat'} />
        </TouchableOpacity>
        <View style={{ width: TOGGLE_GAP - ICON_SIZE }} />
        <TouchableOpacity onPress={() => tap('voice')} style={st.btn} activeOpacity={0.7} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <VoiceGlyph active={mode === 'voice'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { padding: 8 },
  circle: {
    position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2, borderWidth: 1,
    borderColor: '#D4AF37',
    top: 8 + (ICON_SIZE + 16 - CIRCLE_SIZE) / 2,
  },
});