import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

const CONTENT = {
  en: {
    welcome: 'Welcome',
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    suggestions: {
      'ACTIVE': 'Today favors bold moves',
      'TRANSFORMATIVE': 'Let go of what no longer serves you',
      'PURIFYING': 'Clarity comes to those who seek truth',
      'CREATIVE': 'Your imagination is your greatest ally',
      'CURIOUS': 'Follow your questions',
      'INTENSE': 'Feel deeply but choose wisely',
      'RENEWING': 'Old patterns end and new ones begin',
      'NURTURING': 'Care for yourself first',
      'INTUITIVE': 'Your gut knows the way',
      'POWERFUL': 'Lead with wisdom not force',
      'JOYFUL': 'Pleasure is the path today',
      'SUPPORTIVE': 'Help given returns tenfold',
      'SKILLFUL': 'Excellence is in the details',
      'FLEXIBLE': 'Adaptability is your strength',
      'DETERMINED': 'Focus wins today',
      'DEVOTED': 'Loyalty deepens bonds',
      'PROTECTIVE': 'Guard what matters most',
      'INVINCIBLE': 'You are stronger than you know',
      'VICTORIOUS': 'Finish what you started',
      'RECEPTIVE': 'Listen more than you speak',
      'PROSPEROUS': 'Abundance flows to the grateful',
      'HEALING': 'Rest is productive today',
      'FIERY': 'Channel passion into purpose',
      'DEEP': 'Surface answers will not satisfy',
      'COMPASSIONATE': 'Kindness is your superpower',
      'BALANCED': 'Seek the middle path',
      'DEFAULT': 'Trust the journey ahead',
    },
  },
  hi: {
    welcome: 'स्वागत है',
    morning: 'सुप्रभात',
    afternoon: 'नमस्कार',
    evening: 'शुभ संध्या',
    suggestions: {
      'DEFAULT': 'यात्रा पर भरोसा करें',
      'RENEWING': 'पुराना खत्म नया शुरू',
      'NURTURING': 'पहले खुद की देखभाल करें',
      'POWERFUL': 'बुद्धि से नेतृत्व करें',
    },
  },
  zh: { welcome: '欢迎', morning: '早上好', afternoon: '下午好', evening: '晚上好', suggestions: { 'DEFAULT': '相信旅程' } },
  es: { welcome: 'Bienvenido', morning: 'Buenos Días', afternoon: 'Buenas Tardes', evening: 'Buenas Noches', suggestions: { 'DEFAULT': 'Confía en el viaje' } },
  pt: { welcome: 'Bem-vindo', morning: 'Bom Dia', afternoon: 'Boa Tarde', evening: 'Boa Noite', suggestions: { 'DEFAULT': 'Confie na jornada' } },
  ja: { welcome: 'ようこそ', morning: 'おはようございます', afternoon: 'こんにちは', evening: 'こんばんは', suggestions: { 'DEFAULT': '旅を信じて' } },
};

export default function DailyRitualScreen({ 
  onContinue, 
  userData, 
  kundliData, 
  language = 'en',
  isNewUser = false 
}) {
  const [loading, setLoading] = useState(!isNewUser);
  const [suggestion, setSuggestion] = useState('');
  const [phase, setPhase] = useState('greeting');
  
  const content = CONTENT[language] || CONTENT.en;
  const name = userData?.name || 'Seeker';
  const latin = isLatinScript(language);
  
  const greeting = isNewUser ? content.welcome : getGreeting();
  
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return content.morning;
    if (hour < 17) return content.afternoon;
    return content.evening;
  }

  // Animations
  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const suggestionOpacity = useRef(new Animated.Value(0)).current;
  const allFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isNewUser) {
      startNewUserAnimation();
    } else {
      fetchSuggestion();
    }
  }, []);

  const fetchSuggestion = async () => {
    try {
      const response = await fetch('https://api.plutto.space/api/public/daily-ritual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          kundli_data: kundliData || {},
        }),
      });
      
      const data = await response.json();
      const energy = data.success ? data.energy : 'DEFAULT';
      const suggestionText = content.suggestions[energy] || content.suggestions['DEFAULT'];
      
      setLoading(false);
      showSequence(suggestionText);
    } catch (error) {
      console.error('Daily ritual error:', error);
      setLoading(false);
      showSequence(content.suggestions['DEFAULT']);
    }
  };

  const showSequence = (suggestionText) => {
    // Step 1: Show name (after 500ms)
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.timing(nameOpacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, 500);

    // Step 2: Show suggestion (after 1800ms)
    setTimeout(() => {
      setSuggestion(suggestionText);
      Animated.timing(suggestionOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, 1800);

    // Step 3: Hold, then fade all and transition (after 4500ms)
    setTimeout(() => {
      Animated.timing(allFade, { toValue: 0, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
        if (onContinue) onContinue();
      });
    }, 4500);
  };

  const startNewUserAnimation = () => {
    // Name fades in
    setTimeout(() => {
      Animated.timing(nameOpacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, 500);

    // Hold, then transition
    setTimeout(() => {
      Animated.timing(allFade, { toValue: 0, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
        if (onContinue) onContinue();
      });
    }, 3000);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={{ opacity: allFade }}>
          <Text style={[styles.greeting, !latin && { letterSpacing: 0, fontWeight: '400' }]}>{greeting}</Text>
          <ActivityIndicator size="small" color={colors.silver} style={{ marginTop: 60 }} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.contentWrap, { opacity: allFade }]}>
        {/* Greeting */}
        <Animated.Text style={[styles.greeting, { opacity: greetingOpacity }, !latin && { letterSpacing: 0, fontWeight: '400' }]}>
          {greeting}
        </Animated.Text>

        {/* Name */}
        <Animated.Text style={[styles.name, { opacity: nameOpacity }, !latin && { letterSpacing: 0 }]}>
          {name}
        </Animated.Text>

        {/* Suggestion */}
        {suggestion ? (
          <Animated.Text style={[styles.suggestion, { opacity: suggestionOpacity }, !latin && { letterSpacing: 0 }]}>
            {suggestion}
          </Animated.Text>
        ) : null}
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
  contentWrap: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 1,
    textAlign: 'center',
  },
  name: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 12,
  },
  suggestion: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
});