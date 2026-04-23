import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { colors, spacing } from '../theme';
import { markUserAsPaid } from '../api/userService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

const CONTENT = {
  en: {
    title: 'See What The Stars',
    subtitle: 'Hold For You',
    button: 'Turn The Key',
    welcome: ['You', 'Were', 'Meant', 'To', 'Be', 'Here'],
  },
  hi: {
    title: 'तारों ने संजो रखा है',
    subtitle: 'आपके लिए कुछ',
    button: 'कुंजी घुमाएँ',
    welcome: ['आप', 'यहीं', 'होने', 'थे'],
  },
  zh: {
    title: '星辰为你守护着',
    subtitle: '属于你的一切',
    button: '转动钥匙',
    welcome: ['你', '本就', '在', '这里'],
  },
  es: {
    title: 'Las estrellas guardan',
    subtitle: 'algo para ti',
    button: 'Gira la llave',
    welcome: ['Tú', 'ibas', 'a', 'estar', 'aquí'],
  },
  pt: {
    title: 'As estrelas guardam',
    subtitle: 'algo para você',
    button: 'Gire a chave',
    welcome: ['Você', 'ia', 'estar', 'aqui'],
  },
  ja: {
    title: '星があなたのために',
    subtitle: '何かを守っている',
    button: '鍵を回す',
    welcome: ['あなたは', 'ここに', 'いる', 'はずだった'],
  },
};

// Welcome — words appear centered one by one, hold, then drift apart and fade
const WelcomeReveal = ({ words, onComplete, language }) => {
  const latin = isLatinScript(language);
  const wordAnims = useRef(
    words.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(8),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  const anchorIndex = Math.floor(words.length / 2);

  useEffect(() => {
    const staggerDelay = 400;

    words.forEach((_, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(wordAnims[i].opacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wordAnims[i].translateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, i * staggerDelay);
    });

    const allAppearedTime = words.length * staggerDelay + 500;
    const holdTime = allAppearedTime + 2500;

    setTimeout(() => {
      const driftAnims = words.map((_, i) => {
        const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.6;
        const randomY = (Math.random() - 0.5) * 60;

        return Animated.parallel([
          Animated.timing(wordAnims[i].opacity, {
            toValue: 0,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wordAnims[i].translateX, {
            toValue: randomX,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wordAnims[i].translateY, {
            toValue: randomY,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wordAnims[i].scale, {
            toValue: 0.6,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(driftAnims).start(() => {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      });
    }, holdTime);
  }, []);

  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeTextBlock}>
        {words.map((word, i) => {
          const isAnchor = i === anchorIndex;
          return (
            <Animated.Text
              key={i}
              style={[
                styles.welcomeWord,
                {
                  fontSize: isAnchor ? 30 : 24,
                  color: isAnchor ? colors.gold : 'rgba(255,255,255,0.85)',
                  fontWeight: latin ? '200' : '400',
                  letterSpacing: latin ? (isAnchor ? 4 : 2) : 0,
                  opacity: wordAnims[i].opacity,
                  transform: [
                    { translateY: wordAnims[i].translateY },
                    { translateX: wordAnims[i].translateX },
                    { scale: wordAnims[i].scale },
                  ],
                },
              ]}
            >
              {word}
            </Animated.Text>
          );
        })}
      </View>
    </View>
  );
};

export default function PaymentScreen({ onComplete, language = 'en' }) {
  const [paymentDone, setPaymentDone] = useState(false);
  const [isKeyTurning, setIsKeyTurning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyRotation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonDrop = useRef(new Animated.Value(0)).current;
  const content = CONTENT[language] || CONTENT.en;
  const latin = isLatinScript(language);
  const textStyle = latin ? {} : { letterSpacing: 0, fontWeight: '400' };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePayment = async () => {
    if (isKeyTurning) return;
    setIsKeyTurning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Step 1: Pause
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Step 2: Rotate 90 degrees — like turning a real key
      Animated.timing(keyRotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Step 3: Drop straight down off screen
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(buttonDrop, {
              toValue: 1,
              duration: 500,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(async () => {
            await markUserAsPaid();
            setPaymentDone(true);
          });
        }, 200);
      });
    }, 400);
  };

  const buttonRotate = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });
  const buttonTranslateX = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  const dropY = buttonDrop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });
  const rotateY = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  if (paymentDone) {
    return (
      <View style={styles.container}>
        <WelcomeReveal words={content.welcome} onComplete={onComplete} language={language} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.title, textStyle]}>{content.title}</Text>
        <Text style={[styles.subtitle, textStyle]}>{content.subtitle}</Text>
        <TouchableOpacity activeOpacity={1} onPress={handlePayment} disabled={isKeyTurning}>
          <Animated.View style={[styles.payButton, {
            transform: [
              { scale: buttonScale },
              { rotate: buttonRotate },
              { translateX: buttonTranslateX },
              { translateY: Animated.add(rotateY, dropY) },
            ],
          }]}>
            <Text style={[styles.payButtonText, !latin && { letterSpacing: 0 }]}>{content.button}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '200',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  payButton: {
    marginTop: spacing.xxl * 3,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl * 1.5,
    backgroundColor: colors.white,
    borderRadius: 30,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.void,
    letterSpacing: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeTextBlock: {
    alignItems: 'center',
    gap: 6,
  },
  welcomeWord: {
    textAlign: 'center',
  },
});