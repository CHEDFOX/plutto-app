import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';


// ─── Traveling light that orbits the oracle bubble border ───
const TravelingLight = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
      pointerEvents="none"
    >
      {/* The glowing dot — positioned at top center, orbits via parent rotation */}
      <View style={tl.dot} />
    </Animated.View>
  );
};

const tl = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212,175,55,0.5)',
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});


// ─── User Bubble — almost transparent ───
export function UserBubble({ text }) {
  return (
    <View style={s.userWrap}>
      <View style={s.userBubble}>
        <Text style={s.userText}>{text}</Text>
      </View>
    </View>
  );
}


// ─── Oracle Bubble — transparent with traveling light border ───
export function OracleBubble({ text, hook, onHookTap, fontFamily, isStreaming }) {
  const hookOpacity = useRef(new Animated.Value(0)).current;
  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (prevStreamingRef.current === true && isStreaming === false && hook) {
      Animated.timing(hookOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } else if (!isStreaming && hook) {
      hookOpacity.setValue(1);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, hook]);

  return (
    <View style={s.oracleWrap}>
      <View style={s.oracleBubble}>
        {/* Traveling light */}
        <TravelingLight />

        <Text style={[s.oracleText, fontFamily && { fontFamily }]}>{text}</Text>
        {hook && !isStreaming ? (
          <Animated.View style={{ opacity: hookOpacity }}>
            <TouchableOpacity
              style={s.hookContainer}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onHookTap) onHookTap(hook);
              }}
            >
              <Text style={s.hookText}>{hook}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}


const s = StyleSheet.create({
  // ── User ──
  userWrap: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userText: {
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '300',
  },

  // ── Oracle ──
  oracleWrap: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 20,
  },
  oracleBubble: {
    backgroundColor: 'rgba(8,8,12,0.5)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212,175,55,0.12)',
    overflow: 'hidden',
  },
  oracleText: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '300',
  },
  hookContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212,175,55,0.15)',
  },
  hookText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gold,
    fontStyle: 'italic',
  },
});