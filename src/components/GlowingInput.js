import React, { useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { colors } from '../theme';

const PARTICLE_COUNT = 18;

// ─── Particle Send Button ───
// Transparent circle with thin white border, gold particles wandering inside
const ParticleSendButton = ({ onPress, isThinking }) => {
  // Each particle has x, y animated values that loop randomly
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(Math.random() * 24 - 12),
      y: new Animated.Value(Math.random() * 24 - 12),
      size: 1 + Math.random() * 1.8,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  ).current;

  useEffect(() => {
    const anims = particles.map(p => {
      const speed = isThinking ? 400 : 2500;
      const range = isThinking ? 14 : 10;
      const loopX = Animated.loop(
        Animated.sequence([
          Animated.timing(p.x, { toValue: (Math.random() - 0.5) * range, duration: speed + Math.random() * speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(p.x, { toValue: (Math.random() - 0.5) * range, duration: speed + Math.random() * speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      const loopY = Animated.loop(
        Animated.sequence([
          Animated.timing(p.y, { toValue: (Math.random() - 0.5) * range, duration: speed + Math.random() * speed * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(p.y, { toValue: (Math.random() - 0.5) * range, duration: speed + Math.random() * speed * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loopX.start();
      loopY.start();
      return { loopX, loopY };
    });
    return () => anims.forEach(a => { a.loopX.stop(); a.loopY.stop(); });
  }, [isThinking]);

  return (
    <TouchableOpacity style={s.particleBtn} onPress={onPress} activeOpacity={0.7}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.size,
            backgroundColor: colors.gold,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }}
        />
      ))}
    </TouchableOpacity>
  );
};


export default function GlowingInput({ value, onChangeText, onSend, placeholder, isThinking, fontFamily }) {
  const hasText = value && value.trim().length > 0;

  return (
    <View style={s.wrap} onStartShouldSetResponder={() => true}>
      <View style={s.box}>
        <TextInput
          style={[s.input, fontFamily && { fontFamily }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
          maxLength={500}
          blurOnSubmit={false}
          returnKeyType="send"
          onSubmitEditing={() => { if (value?.trim()) onSend(value); }}
        />
        {hasText && (
          <ParticleSendButton
            onPress={() => onSend(value)}
            isThinking={isThinking}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(8,8,12,0.85)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.25)',
    paddingLeft: 22,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '300',
    color: '#fff',
    maxHeight: 110,
    paddingVertical: 10,
  },
  particleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    overflow: 'hidden',
  },
});