import React, { useState, useRef, useEffect } from 'react';
import { saveUserInfo, getUserProfile } from '../api/userService';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Easing,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing } from '../theme';
import { auth, supabase } from '../api/supabase';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

const STEPS = {
  NAME: 'name',
  PASSCODE: 'passcode',
  CONTACT: 'contact',
  VERIFY: 'verify',
};

const CONTENT = {
  en: {
    name: { title: 'The Name That Carries\nYour Essence', placeholder: 'Your Name' },
    passcode: { title: 'Create Your Sacred Key' },
    contact: { title: 'The Path Of Signal', emailPlaceholder: 'your@email.com', button: 'Send Link' },
    verify: { line1: 'In Your Email Lies', line2: 'The Door To The Universe.', line3: 'The Stars Await Your Step.', resend: 'Resend', infoTitle: 'A Link Has Been Sent To Your Mail.', infoSubtitle: 'Verify Your Presence' },
    continue: 'Continue',
    error: 'Something Went Wrong. Please Try Again.',
  },
  hi: {
    name: { title: 'वह नाम जो आपकी\nआत्मा को धारण करता है', placeholder: 'आपका नाम' },
    passcode: { title: 'एक गुप्त संकेत चुनें' },
    contact: { title: 'संपर्क का मार्ग', emailPlaceholder: 'your@email.com', button: 'लिंक भेजें' },
    verify: { line1: 'आपके संदेश में छिपा है', line2: 'ब्रह्मांड का द्वार।', line3: 'नक्षत्र आपके कदम की प्रतीक्षा करते हैं।', resend: 'पुनः भेजें', infoTitle: 'एक कड़ी आपके मेल पर भेजी गई है।', infoSubtitle: 'अपनी उपस्थिति की पुष्टि करें' },
    continue: 'आगे बढ़ें',
    error: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
  },
  zh: {
    name: { title: '承载你本质的\n名字', placeholder: '你的名字' },
    passcode: { title: '设定你的秘钥' },
    contact: { title: '连接的路径', emailPlaceholder: 'your@email.com', button: '发送链接' },
    verify: { line1: '你的邮件中藏着', line2: '通往宇宙之门。', line3: '星辰正等待你的到来。', resend: '重新发送', infoTitle: '链接已发送至你的邮箱。', infoSubtitle: '确认你的存在' },
    continue: '继续',
    error: '出现了一些问题，请重试。',
  },
  es: {
    name: { title: 'El nombre que lleva\ntu esencia', placeholder: 'Tu nombre' },
    passcode: { title: 'Elige tu clave secreta' },
    contact: { title: 'El camino de conexión', emailPlaceholder: 'tu@correo.com', button: 'Enviar enlace' },
    verify: { line1: 'En tu correo se esconde', line2: 'la puerta del universo.', line3: 'Los astros esperan tu llegada.', resend: 'Reenviar', infoTitle: 'Un enlace ha sido enviado.', infoSubtitle: 'Confirma tu presencia' },
    continue: 'Continuar',
    error: 'Algo salió mal. Intenta de nuevo.',
  },
  pt: {
    name: { title: 'O nome que carrega\nsua essência', placeholder: 'Seu nome' },
    passcode: { title: 'Escolha sua chave secreta' },
    contact: { title: 'O caminho da conexão', emailPlaceholder: 'seu@email.com', button: 'Enviar link' },
    verify: { line1: 'No seu email se esconde', line2: 'a porta do universo.', line3: 'Os astros aguardam sua chegada.', resend: 'Reenviar', infoTitle: 'Um link foi enviado.', infoSubtitle: 'Confirme sua presença' },
    continue: 'Continuar',
    error: 'Algo deu errado. Tente novamente.',
  },
  ja: {
    name: { title: 'あなたの本質を宿す\n名前', placeholder: 'お名前' },
    passcode: { title: '秘密の鍵を選んで' },
    contact: { title: 'つながりの道', emailPlaceholder: 'your@email.com', button: 'リンクを送信' },
    verify: { line1: 'あなたのメールに', line2: '宇宙への扉が隠されている。', line3: '星があなたの訪れを待っている。', resend: '再送信', infoTitle: 'リンクが送信されました。', infoSubtitle: 'あなたの存在を確認して' },
    continue: '続ける',
    error: '問題が発生しました。もう一度お試しください。',
  },
};

const ELEMENTS = [
  { empty: '◇', filled: '◆' },
  { empty: '○', filled: '●' },
  { empty: '△', filled: '▲' },
  { empty: '∼', filled: '≈' },
  { empty: '☆', filled: '★' },
];

const WaitingDots = ({ verified, onAnimationComplete }) => {
  const NUM_DOTS = 6;
  const RADIUS = 24;
  const dotAnims = useRef(Array.from({ length: NUM_DOTS }, () => ({ scale: new Animated.Value(1), opacity: new Animated.Value(0.3), x: new Animated.Value(0), y: new Animated.Value(0) }))).current;
  const [currentDot, setCurrentDot] = useState(0);
  const exitAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (verified) return;
    const pulse = () => {
      const dot = dotAnims[currentDot];
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot.scale, { toValue: 1.6, duration: 150, useNativeDriver: true }),
          Animated.timing(dot.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(dot.scale, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(dot.opacity, { toValue: 0.3, duration: 250, useNativeDriver: true }),
        ]),
      ]).start(() => setCurrentDot((prev) => (prev + 1) % NUM_DOTS));
    };
    const timer = setTimeout(pulse, 80);
    return () => clearTimeout(timer);
  }, [currentDot, verified]);

  useEffect(() => {
    if (!verified) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lineAnimations = dotAnims.map((dot, i) => {
      const targetX = (i - 2.5) * 12;
      return Animated.parallel([
        Animated.spring(dot.x, { toValue: targetX, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.spring(dot.y, { toValue: 0, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.timing(dot.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(dot.scale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(lineAnimations).start(() => {
      setTimeout(() => {
        Animated.timing(exitAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
          if (onAnimationComplete) onAnimationComplete();
        });
      }, 150);
    });
  }, [verified]);

  const getCircularPosition = (index) => {
    const angle = (index / NUM_DOTS) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS };
  };

  return (
    <View style={styles.dotsContainer}>
      {dotAnims.map((anim, i) => {
        const circlePos = getCircularPosition(i);
        const translateX = verified ? Animated.add(anim.x, exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH] })) : circlePos.x;
        const scaleX = exitAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1, 12] });
        return (
          <Animated.View key={i} style={[styles.dot, {
            backgroundColor: i === currentDot ? colors.gold : colors.white,
            transform: [
              { translateX: verified ? translateX : circlePos.x },
              { translateY: verified ? anim.y : circlePos.y },
              { scale: anim.scale },
              { scaleX: verified ? scaleX : 1 },
            ],
            opacity: anim.opacity,
          }]} />
        );
      })}
    </View>
  );
};

const InfoIcon = ({ onPress }) => (
  <TouchableOpacity style={styles.infoButton} onPress={onPress}>
    <View style={styles.infoIcon}><Text style={styles.infoIconText}>i</Text></View>
  </TouchableOpacity>
);

const InfoModal = ({ visible, onClose, content }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{content.infoTitle}</Text>
        <Text style={styles.modalSubtitle}>{content.infoSubtitle}</Text>
      </View>
    </TouchableOpacity>
  </Modal>
);

export default function AuthScreen({ onComplete, onBack, language = 'en' }) {
  const [step, setStep] = useState(STEPS.CONTACT);
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const userData = useRef(null);

  const elementScales = useRef(ELEMENTS.map(() => new Animated.Value(1))).current;
  const elementOpacities = useRef(ELEMENTS.map(() => new Animated.Value(1))).current;
  const elementTranslateY = useRef(ELEMENTS.map(() => new Animated.Value(0))).current;
  const elementFilled = useRef(ELEMENTS.map(() => new Animated.Value(0))).current;

  const content = CONTENT[language] || CONTENT.en;
  const latin = isLatinScript(language);
  const textStyle = latin ? {} : { letterSpacing: 0, fontWeight: '400' };

  useEffect(() => {
    if (step === STEPS.VERIFY) {
      Animated.timing(textFadeAnim, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }).start();
    }
  }, [step]);

  const handleAuthSuccess = async (user) => {
    // Check if existing user with profile
    try {
      const result = await getUserProfile();
      if (result?.success && result?.data?.name) {
        // Existing user — skip name step
        userData.current = { name: result.data.name, passcode: null, contact, contactType, user };
        setVerified(true);
        return;
      }
    } catch (e) { /* new user, continue */ }
    // New user — need name after animation
    userData.current = { user, contact, contactType };
    setVerified(true);
    setIsNewUser(true);
  };

  const [isNewUser, setIsNewUser] = useState(false);

  const handleExitAnimationComplete = () => {
    if (isNewUser) {
      // New user — go to name step
      setVerified(false);
      animateTransition(() => setStep(STEPS.NAME));
      return;
    }
    if (onComplete && userData.current) onComplete(userData.current);
  };

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && (url.includes('access_token') || url.includes('token='))) {
        try {
          let accessToken, refreshToken;
          if (url.includes('#')) {
            const params = new URLSearchParams(url.split('#')[1]);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          } else {
            const params = new URLSearchParams(url.split('?')[1]);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          }
          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (!error && data.session) handleAuthSuccess(data.session.user);
          }
        } catch (e) { console.error('Deep link error:', e); }
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    return () => subscription?.remove();
  }, [name, passcode, contact, contactType]);

  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) handleAuthSuccess(session.user);
    });
    return () => subscription.unsubscribe();
  }, [name, passcode, contact, contactType]);

  useEffect(() => {
    if (step === STEPS.VERIFY && !verified) {
      setCanResend(false);
      const timer = setTimeout(() => setCanResend(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [step, verified]);

  useEffect(() => {
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 300);
  }, [step]);

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleNameSubmit = async () => {
    if (name.trim().length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveUserInfo(name, null);
    const finalData = { ...userData.current, name, passcode: null };
    if (onComplete) onComplete(finalData);
  };

  const resetElements = () => {
    ELEMENTS.forEach((_, i) => {
      elementScales[i].setValue(1);
      elementOpacities[i].setValue(1);
      elementTranslateY[i].setValue(0);
      elementFilled[i].setValue(0);
    });
  };

  const handlePasscodeChange = (value) => {
    if (value.length <= 5) {
      setPasscode(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (value.length > 0 && value.length <= 5) {
        const idx = value.length - 1;
        elementFilled[idx].setValue(1);
        Animated.spring(elementScales[idx], { toValue: 1.2, tension: 300, friction: 6, useNativeDriver: true }).start(() => {
          Animated.spring(elementScales[idx], { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
        });
      }

      for (let i = value.length; i < 5; i++) {
        elementScales[i].setValue(1);
        elementFilled[i].setValue(0);
      }

      if (value.length === 5) {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          const smokeAnims = ELEMENTS.map((_, i) => {
            const delay = i * 80;
            return Animated.parallel([
              Animated.sequence([
                Animated.timing(elementScales[i], { toValue: 1.5, duration: 300, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(elementScales[i], { toValue: 0.3, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
              ]),
              Animated.timing(elementTranslateY[i], { toValue: -30, duration: 700, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(elementOpacities[i], { toValue: 0, duration: 500, delay: delay + 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            ]);
          });

          Animated.parallel(smokeAnims).start(() => {
            resetElements();
            // Store passcode securely
            SecureStore.setItemAsync('app_passcode', value).catch(() => {});
            animateTransition(() => setStep(STEPS.CONTACT));
          });
        }, 300);
      }
    }
  };

  const handleContactSubmit = async () => {
    if (contact.trim().length < 5) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const redirectUrl = 'https://auth.plutto.space/verify';
      let result;
      if (contactType === 'email') {
        result = await supabase.auth.signInWithOtp({ email: contact.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl } });
      } else {
        result = await auth.sendOTP(contact.trim());
      }
      if (result.error) { Alert.alert('Error', result.error.message || content.error); setIsLoading(false); return; }
      animateTransition(() => setStep(STEPS.VERIFY));
    } catch (error) { Alert.alert('Error', content.error); }
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const redirectUrl = 'https://auth.plutto.space/verify';
      if (contactType === 'email') {
        await supabase.auth.signInWithOtp({ email: contact.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl } });
      } else { await auth.sendOTP(contact.trim()); }
      setTimeout(() => setCanResend(true), 30000);
    } catch (error) { Alert.alert('Error', content.error); setCanResend(true); }
    setIsLoading(false);
  };

  const renderName = () => (
    <View style={styles.stepContainer}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.title, textStyle]}>{content.name.title}</Text>
      <TextInput ref={inputRef} style={[styles.textInput, !latin && { letterSpacing: 0 }]} value={name} onChangeText={setName} placeholder={content.name.placeholder} placeholderTextColor={colors.ash} autoCapitalize="words" autoCorrect={false} onSubmitEditing={handleNameSubmit} returnKeyType="next" />
      {name.trim().length >= 2 && (
        <TouchableOpacity style={styles.continueButton} onPress={handleNameSubmit}>
          <Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{content.continue}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPasscode = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPasscode(''); resetElements();
        animateTransition(() => setStep(STEPS.NAME));
      }}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.title, textStyle]}>{content.passcode.title}</Text>

      {/* Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPasscodeEnabled(!passcodeEnabled);
          if (passcodeEnabled) { setPasscode(''); resetElements(); }
        }}
        style={styles.toggleRow}
      >
        <View style={[styles.toggleTrack, passcodeEnabled && styles.toggleTrackOn]}>
          <Animated.View style={[styles.toggleThumb, passcodeEnabled && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      {passcodeEnabled ? (
        <>
          <View style={styles.passcodeContainer}>
            {ELEMENTS.map((el, i) => {
              const isFilled = passcode.length > i;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.elementBox,
                    isFilled && styles.elementBoxFilled,
                    {
                      transform: [
                        { scale: elementScales[i] },
                        { translateY: elementTranslateY[i] },
                      ],
                      opacity: elementOpacities[i],
                    },
                  ]}
                >
                  <Text style={[styles.elementSymbol, isFilled && styles.elementSymbolFilled]}>
                    {isFilled ? el.filled : el.empty}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
          <TextInput ref={inputRef} style={styles.hiddenInput} value={passcode} onChangeText={handlePasscodeChange} keyboardType="number-pad" maxLength={5} autoFocus />
        </>
      ) : (
        <TouchableOpacity
          style={[styles.continueButton, { marginTop: 40 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            SecureStore.deleteItemAsync('app_passcode').catch(() => {});
            animateTransition(() => setStep(STEPS.CONTACT));
          }}
        >
          <Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{content.continue}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContact = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onBack) onBack();
      }}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.title, textStyle]}>{content.contact.title}</Text>
      <TextInput ref={inputRef} style={[styles.textInput, !latin && { letterSpacing: 0 }]} value={contact} onChangeText={setContact} placeholder={content.contact.emailPlaceholder} placeholderTextColor={colors.ash} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} onSubmitEditing={handleContactSubmit} returnKeyType="send" editable={!isLoading} />
      {contact.trim().length >= 5 && (
        <TouchableOpacity style={[styles.continueButton, isLoading && styles.buttonDisabled]} onPress={handleContactSubmit} disabled={isLoading}>
          <Text style={[styles.continueText, !latin && { letterSpacing: 0 }]}>{isLoading ? '...' : content.contact.button}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderVerify = () => (
    <View style={styles.verifyContainer}>
      <InfoIcon onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowInfo(true); }} />
      <InfoModal visible={showInfo} onClose={() => setShowInfo(false)} content={content.verify} />
      <Animated.View style={[styles.verifyTextTop, { opacity: textFadeAnim }]}>
        <Text style={[styles.verifyLine1, textStyle]}>{content.verify.line1}</Text>
        <Text style={[styles.verifyLine2, textStyle]}>{content.verify.line2}</Text>
      </Animated.View>
      <WaitingDots verified={verified} onAnimationComplete={handleExitAnimationComplete} />
      <Animated.View style={[styles.verifyTextBottom, { opacity: textFadeAnim }]}>
        <Text style={[styles.verifyLine3, !latin && { letterSpacing: 0 }]}>{content.verify.line3}</Text>
      </Animated.View>
      {!verified && (
        <TouchableOpacity style={styles.resendLink} onPress={handleResend} disabled={!canResend || isLoading}>
          <Text style={[styles.resendText, canResend && styles.resendTextActive]}>{content.verify.resend}</Text>
        </TouchableOpacity>
      )}
      {!verified && (
        <TouchableOpacity style={styles.skipButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onComplete) onComplete({ name, passcode, contact, contactType: 'email', user: null });
        }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === STEPS.NAME && renderName()}
        {step === STEPS.PASSCODE && renderPasscode()}
        {step === STEPS.CONTACT && renderContact()}
        {step === STEPS.VERIFY && renderVerify()}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  stepContainer: { marginTop: SCREEN_HEIGHT * 0.25 },
  backButton: { position: 'absolute', top: -SCREEN_HEIGHT * 0.15, left: 0, padding: spacing.md, zIndex: 10 },
  backArrow: { fontSize: 32, fontWeight: '200', color: colors.silver },
  title: { fontSize: 24, fontWeight: '200', color: colors.white, textAlign: 'center', letterSpacing: 0.8, lineHeight: 36 },
  textInput: { fontSize: 18, fontWeight: '300', color: colors.gold, textAlign: 'center', paddingVertical: spacing.lg, marginTop: spacing.xxl, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.15)', letterSpacing: 0.3 },
  hiddenInput: { position: 'absolute', opacity: 0 },
  passcodeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, gap: spacing.md, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  toggleRow: { alignSelf: 'center', marginTop: 28, marginBottom: 8 },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackOn: { backgroundColor: 'rgba(212,175,55,0.35)' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.3)' },
  toggleThumbOn: { backgroundColor: colors.gold, alignSelf: 'flex-end' },
  elementBox: { width: 48, height: 48, borderRadius: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  elementBoxFilled: { borderColor: 'rgba(212,175,55,0.4)' },
  elementSymbol: { fontSize: 20, color: 'rgba(255,255,255,0.3)' },
  elementSymbolFilled: { color: colors.gold },
  continueButton: { marginTop: spacing.xxl, paddingVertical: spacing.md, alignItems: 'center' },
  continueText: { fontSize: 16, fontWeight: '400', color: colors.gold, letterSpacing: 0.5 },
  buttonDisabled: { opacity: 0.5 },
  verifyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoButton: { position: 'absolute', top: 60, left: 0, padding: spacing.md },
  infoIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  infoIconText: { fontSize: 13, fontWeight: '300', color: colors.silver, fontStyle: 'italic' },
  dotsContainer: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl },
  dot: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.white },
  verifyLine1: { fontSize: 16, fontWeight: '200', color: colors.silver, letterSpacing: 0.8, textAlign: 'center' },
  verifyLine2: { fontSize: 16, fontWeight: '200', color: colors.silver, letterSpacing: 0.8, textAlign: 'center', marginBottom: spacing.xl },
  verifyLine3: { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, textAlign: 'center' },
  resendLink: { position: 'absolute', bottom: 80, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  resendText: { fontSize: 13, fontWeight: '400', color: colors.ash },
  resendTextActive: { color: colors.gold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.abyss, borderRadius: 20, padding: spacing.xl, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', maxWidth: 300 },
  modalTitle: { fontSize: 15, fontWeight: '300', color: colors.white, textAlign: 'center', letterSpacing: 0.3, lineHeight: 22 },
  modalSubtitle: { fontSize: 13, fontWeight: '300', color: colors.silver, textAlign: 'center', marginTop: spacing.md, letterSpacing: 0.2 },
  skipButton: { position: 'absolute', bottom: 40, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  skipText: { fontSize: 12, color: colors.ash },
  verifyTextTop: { alignItems: 'center', marginBottom: spacing.xxl },
  verifyTextBottom: { alignItems: 'center', marginTop: spacing.xxl },
});