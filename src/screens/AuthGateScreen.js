/**
 * AUTH GATE — single screen after splash.
 *
 * Layout: flex column. Title top with gold mark, flexible spacer, entry
 * stack at lower third. KeyboardAvoidingView pushes the stack cleanly.
 * Ambient Starfield drifts behind everything.
 *
 * Backend-controlled flow:
 *   content.authMode === 'otp_code'  → verify renders a 6-digit code input
 *   content.authMode === 'magic_link' → verify renders just "tap the link"
 *
 * Email → physics animation (EmailSendAnimation) → code entry.
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Easing,
  Dimensions, Platform, Keyboard, KeyboardAvoidingView, Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';

import { auth } from '../api/supabase';
import { GOOGLE_OAUTH, isGoogleConfigured } from '../config/auth';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';
import EmailSendAnimation from '../components/EmailSendAnimation';
import Starfield from '../components/Starfield';

WebBrowser.maybeCompleteAuthSession();

const { height: SH } = Dimensions.get('window');

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LEN = 6;
const TITLE_TOP_PAD = SH * 0.10;

export default function AuthGateScreen({ content }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState('entry');
  const [error, setError] = useState(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const arrival = useRef(new Animated.Value(0)).current;
  const verifyFade = useRef(new Animated.Value(0)).current;
  const entryFade = useRef(new Animated.Value(1)).current;
  const codeInputRef = useRef(null);

  const googleEnabled = isGoogleConfigured();
  const [, googleResp, promptGoogle] = Google.useIdTokenAuthRequest({
    clientId:         GOOGLE_OAUTH.webClientId,
    iosClientId:      GOOGLE_OAUTH.iosClientId,
    androidClientId:  GOOGLE_OAUTH.androidClientId,
  });

  const authMode = content?.authMode === 'magic_link' ? 'magic_link' : 'otp_code';
  const redirectTo = Linking.createURL('auth/callback');

  // Dummy animated values for Starfield (no scroll, no impulse on this screen).
  const zeroV = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(arrival, {
      toValue: 1,
      duration: 900,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [arrival]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  useEffect(() => {
    if (googleResp?.type === 'success' && googleResp.params?.id_token) {
      (async () => {
        const { error: err } = await auth.signInWithGoogle(googleResp.params.id_token);
        if (err) {
          console.log('[auth/google]', err.message || err);
          setError(content?.errorGeneric || 'Try again.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
      })();
    }
  }, [googleResp, content]);

  useEffect(() => {
    if (phase === 'verify') {
      Animated.parallel([
        Animated.timing(entryFade,  { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(verifyFade, { toValue: 1, duration: 360, delay: 120, useNativeDriver: true }),
      ]).start(() => {
        if (authMode === 'otp_code') codeInputRef.current?.focus?.();
      });
    } else if (phase === 'entry') {
      Animated.parallel([
        Animated.timing(verifyFade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(entryFade,  { toValue: 1, duration: 280, delay: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [phase, entryFade, verifyFade, authMode]);

  const emailOk = EMAIL_RX.test(email.trim());
  const codeOk = code.length === CODE_LEN && /^\d+$/.test(code);

  const handleEmailContinue = useCallback(async () => {
    if (!emailOk || phase !== 'entry') return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('sending');
    setError(null);

    const animMin = new Promise((r) => setTimeout(r, 1900));
    const apiCall = auth.sendEmailCode(email.trim(), redirectTo);
    const [, sendResult] = await Promise.all([animMin, apiCall]);

    if (sendResult?.error) {
      console.log('[auth/email]', sendResult.error.message || sendResult.error);
      setError(content?.errorGeneric || 'Try again.');
      setPhase('entry');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    setCode('');
    setPhase('verify');
  }, [email, emailOk, phase, content, redirectTo]);

  const handleVerifyCode = useCallback(async () => {
    if (!codeOk || phase !== 'verify') return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('verifying');
    setError(null);
    const { error: err } = await auth.verifyEmailCode(email.trim(), code);
    if (err) {
      console.log('[auth/verify]', err.message || err);
      setError(content?.errorGeneric || 'Try again.');
      setPhase('verify');
      setCode('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
  }, [email, code, codeOk, phase, content]);

  const handleResend = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError(null);
    await auth.sendEmailCode(email.trim(), redirectTo);
  }, [email, redirectTo]);

  const handleApple = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const nonceRaw = Math.random().toString(36).slice(2);
      const nonceHashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonceRaw,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: nonceHashed,
      });
      if (!credential.identityToken) throw new Error('no identity token');
      const { error: err } = await auth.signInWithApple(credential.identityToken, nonceRaw);
      if (err) {
        console.log('[auth/apple]', err.message || err);
        setError(content?.errorGeneric || 'Try again.');
      }
    } catch (e) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      console.log('[auth/apple]', e?.message || e);
      setError(content?.errorGeneric || 'Try again.');
    }
  }, [content]);

  const handleGoogle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!googleEnabled) {
      Alert.alert(
        'Google sign-in',
        'Add your OAuth client IDs to src/config/auth.js to enable.',
      );
      return;
    }
    promptGoogle().catch((e) => console.log('[auth/google]', e));
  }, [googleEnabled, promptGoogle]);

  if (!content) {
    return <View style={styles.container} />;
  }

  const translateY = arrival.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const showVerify = phase === 'verify' || phase === 'verifying';

  return (
    <View style={styles.container}>
      {/* Ambient starfield behind everything */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Starfield scrollY={zeroV} impulseX={zeroV} impulseY={zeroV} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavRoot}
      >
        <Animated.View style={[styles.flexCol, { opacity: arrival, transform: [{ translateY }] }]}>
          <View style={styles.titleBlock}>
            <View style={styles.titleMark} />
            <Text style={styles.title}>{content.title}</Text>
          </View>

          <View style={styles.spacer} />

          {!showVerify && (
            <Animated.View style={[styles.stack, { opacity: entryFade }]}>
              {appleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                  cornerRadius={28}
                  style={styles.appleBtn}
                  onPress={handleApple}
                />
              )}

              <TouchableOpacity onPress={handleGoogle} style={styles.googleBtn} activeOpacity={0.7}>
                <Text style={styles.googleText}>{content.google}</Text>
              </TouchableOpacity>

              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{content.divider}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
                placeholder={content.emailPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.22)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={phase === 'entry'}
              />

              {error && phase === 'entry' ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleEmailContinue}
                activeOpacity={emailOk ? 0.6 : 1}
                style={styles.continueRow}
              >
                <Text style={[styles.continueText, !emailOk && styles.continueTextMuted]}>
                  {content.continue}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {showVerify && (
            <Animated.View style={[styles.stack, { opacity: verifyFade }]}>
              <Text style={styles.verifyTitle}>{content.verifyTitle}</Text>
              <Text style={styles.verifyBody}>
                {authMode === 'magic_link'
                  ? (content.verifyBodyLink || '')
                  : (content.verifyBodyCode || '')}
              </Text>

              {authMode === 'otp_code' && (
                <>
                  <TextInput
                    ref={codeInputRef}
                    style={styles.codeInput}
                    value={code}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/\D/g, '').slice(0, CODE_LEN);
                      setCode(cleaned);
                      if (error) setError(null);
                    }}
                    placeholder="••••••"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    keyboardType="number-pad"
                    maxLength={CODE_LEN}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    editable={phase === 'verify'}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <TouchableOpacity
                    onPress={handleVerifyCode}
                    activeOpacity={codeOk ? 0.6 : 1}
                    style={styles.continueRow}
                  >
                    <Text style={[styles.continueText, !codeOk && styles.continueTextMuted]}>
                      {content.continue}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={handleResend} style={styles.resendBtn} activeOpacity={0.6}>
                <Text style={styles.resendText}>{content.verifyResend}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Text style={styles.terms}>{content.terms}</Text>
        </Animated.View>
      </KeyboardAvoidingView>

      {phase === 'sending' && (
        <View style={styles.sendOverlay} pointerEvents="none">
          <EmailSendAnimation />
        </View>
      )}
    </View>
  );
}

const SOCIAL_HEIGHT = 50;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  kavRoot: { flex: 1 },
  flexCol: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: TITLE_TOP_PAD,
    paddingBottom: spacing.lg,
  },

  titleBlock: { alignItems: 'center' },
  titleMark: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
    opacity: 0.7,
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 26,
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 36,
  },

  spacer: { flex: 1 },

  stack: { alignItems: 'stretch' },

  appleBtn: {
    width: '100%',
    height: SOCIAL_HEIGHT,
  },
  googleBtn: {
    marginTop: spacing.sm,
    height: SOCIAL_HEIGHT,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    fontWeight: '400',
    textTransform: 'lowercase',
  },

  emailInput: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.14)',
    letterSpacing: 0.4,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,200,180,0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  continueRow: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  continueTextMuted: {
    color: 'rgba(255,255,255,0.25)',
  },

  verifyTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.6,
    lineHeight: 28,
  },
  verifyBody: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  codeInput: {
    marginTop: spacing.xxl,
    fontSize: 28,
    fontWeight: '200',
    color: colors.white,
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.14)',
    letterSpacing: 12,
  },
  resendBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
  },
  resendText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    fontWeight: '400',
    textTransform: 'lowercase',
  },

  terms: {
    marginTop: spacing.lg,
    fontSize: 9,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
  },

  sendOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.void,
  },
});