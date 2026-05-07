import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { transcribeAudio, chatWithOracleStream, chatWithOracle, textToSpeech } from '../api/backend';
import ChatVoiceToggle from '../components/ChatVoiceToggle';

const { width: SW, height: SH } = Dimensions.get('window');
const CX = SW / 2;
const CY = SH / 2;

const PARTICLE_COUNT = 450;
const SPHERE_RADIUS = 90;
const BUTTON_RADIUS = 26;
const SILENCE_MS = 1500;
const CALIBRATION_TICKS = 5;
const SPEECH_MARGIN = 0.15;
const SILENCE_STD = 0.045;

const STATE = {
  INIT: 'init',
  LISTENING: 'listening',
  COLLAPSING: 'collapsing',
  COLLAPSED: 'collapsed',
  DISPERSING: 'dispersing',
  WAITING: 'waiting',
  REFORMING: 'reforming',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

function buildParticles() {
  const particles = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const yNorm = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - yNorm * yNorm);
    const theta = phi * i;
    const xNorm = Math.cos(theta) * radiusAtY;
    const zNorm = Math.sin(theta) * radiusAtY;
    const homeX = xNorm * SPHERE_RADIUS;
    const homeY = yNorm * SPHERE_RADIUS;
    const depth = (zNorm + 1) / 2;
    // White at bottom, gold at top — gradient transition
    const goldChance = (yNorm + 1) / 2; // 0 at bottom, 1 at top
    const isGold = Math.random() < goldChance * 0.85;
    const wanderTargets = Array.from({ length: 4 }, () => ({
      x: (Math.random() - 0.5) * SW * 0.85,
      y: (Math.random() - 0.5) * SH * 0.7,
    }));
    const collAngle = Math.random() * Math.PI * 2;
    const collR = Math.random() * BUTTON_RADIUS * 0.7;
    particles.push({
      id: i,
      homeX, homeY, zNorm, depth,
      color: isGold ? colors.gold : '#FFFFFF',
      isGold,
      collX: Math.cos(collAngle) * collR,
      collY: Math.sin(collAngle) * collR,
      wanderTargets,
      size: 0.12 + depth * 0.35,
      sphereOpacity: 0.2 + depth * 0.8,
    });
  }
  particles.sort((a, b) => a.zNorm - b.zNorm);
  return particles;
}

const Particle = React.memo(({ particle, driver, wanderDriver, breathDriver, speakDriver }) => {
  const wanderX = wanderDriver.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      particle.wanderTargets[0].x, particle.wanderTargets[1].x,
      particle.wanderTargets[2].x, particle.wanderTargets[3].x,
    ],
  });
  const wanderY = wanderDriver.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      particle.wanderTargets[0].y, particle.wanderTargets[1].y,
      particle.wanderTargets[2].y, particle.wanderTargets[3].y,
    ],
  });

  const radialMag = Math.sqrt(particle.homeX ** 2 + particle.homeY ** 2) || 1;
  const dirX = particle.homeX / radialMag;
  const dirY = particle.homeY / radialMag;

  // ─── LISTENING BREATH ───
  // Slow, uniform (all particles move in sync), very subtle inward drift (5px max).
  // Reads as "the sphere is alive" — gentle, calm, not busy.
  const breathOffset = breathDriver.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -1, 0],
    extrapolate: 'clamp',
  });
  const breathDx = Animated.multiply(breathOffset, new Animated.Value(dirX * 5));
  const breathDy = Animated.multiply(breathOffset, new Animated.Value(dirY * 5));

  // ─── SPEAKING WAVE ───
  // Each particle has its own phase so waves ripple through the sphere.
  // Bigger inward motion (14px) and staggered — looks like the oracle's voice
  // traveling through the sphere.
  const phaseOffset = (particle.id % 32) / 32;
  const shiftedDriver = Animated.modulo(
    Animated.add(speakDriver, new Animated.Value(phaseOffset)),
    1
  );
  const speakOffset = shiftedDriver.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -0.5, -1, -0.5, 0],
    extrapolate: 'clamp',
  });
  const speakDx = Animated.multiply(speakOffset, new Animated.Value(dirX * 14));
  const speakDy = Animated.multiply(speakOffset, new Animated.Value(dirY * 14));

  // Driver 0 = sphere, 2 = dispersed. Particles stay at home position until
  // the wander takes over — no collapse-through-center artifact.
  const tx = driver.interpolate({
    inputRange: [0, 0.8, 2],
    outputRange: [particle.homeX, particle.homeX, 0],
    extrapolate: 'clamp',
  });
  const ty = driver.interpolate({
    inputRange: [0, 0.8, 2],
    outputRange: [particle.homeY, particle.homeY, 0],
    extrapolate: 'clamp',
  });
  // WanderMix kicks in smoothly as driver moves past 0.6 → full at 1.4
  const wanderMix = driver.interpolate({
    inputRange: [0, 0.6, 1.4, 2],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });
  // Breath/speak only apply when the sphere is assembled (driver near 0)
  const sphereMix = driver.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const finalX = Animated.add(
    Animated.add(tx, Animated.multiply(wanderX, wanderMix)),
    Animated.multiply(Animated.add(breathDx, speakDx), sphereMix)
  );
  const finalY = Animated.add(
    Animated.add(ty, Animated.multiply(wanderY, wanderMix)),
    Animated.multiply(Animated.add(breathDy, speakDy), sphereMix)
  );

  const scale = driver.interpolate({
    inputRange: [0, 2],
    outputRange: [1, 0.6],
  });
  const opacity = driver.interpolate({
    inputRange: [0, 2],
    outputRange: [particle.sphereOpacity, 0.35],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: CX,
        top: CY,
        width: particle.size * 2,
        height: particle.size * 2,
        marginLeft: -particle.size,
        marginTop: -particle.size,
        borderRadius: particle.size,
        backgroundColor: particle.color,
        opacity,
        transform: [
          { translateX: finalX },
          { translateY: finalY },
          { scale },
        ],
      }}
    />
  );
});

const GoldCore = ({ driver }) => {
  const opacity = driver.interpolate({
    inputRange: [0, 0.85, 1, 1.15, 2],
    outputRange: [0, 0, 1, 0, 0],
  });
  const scale = driver.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1, 1.5],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: CX - BUTTON_RADIUS,
        top: CY - BUTTON_RADIUS,
        width: BUTTON_RADIUS * 2,
        height: BUTTON_RADIUS * 2,
        borderRadius: BUTTON_RADIUS,
        backgroundColor: colors.gold,
        opacity,
        transform: [{ scale }],
        shadowColor: colors.gold,
        shadowOpacity: 0.95,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      }}
    />
  );
};

const SphereGlow = ({ driver }) => {
  const opacity = driver.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.35, 0, 0],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: CX - SPHERE_RADIUS * 0.5,
        top: CY - SPHERE_RADIUS * 0.5,
        width: SPHERE_RADIUS,
        height: SPHERE_RADIUS,
        borderRadius: SPHERE_RADIUS / 2,
        backgroundColor: 'rgba(255,200,120,0.18)',
        opacity,
        shadowColor: colors.gold,
        shadowOpacity: 0.5,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
};

export default function VoiceChatScreen({ onClose, onConversationUpdate, kundliData, language = 'en' }) {
  const particles = useMemo(() => buildParticles(), []);
  const [state, setState] = useState(STATE.INIT);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef([]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  const driver = useRef(new Animated.Value(0)).current;
  const wanderDriver = useRef(new Animated.Value(0)).current;
  const breathDriver = useRef(new Animated.Value(0)).current;
  const speakDriver = useRef(new Animated.Value(0)).current;
  const wanderLoop = useRef(null);
  const breathLoop = useRef(null);
  const speakLoop = useRef(null);

  const recording = useRef(null);
  const meteringInterval = useRef(null);
  const silenceStart = useRef(null);
  const hasSpoken = useRef(false);
  const isProcessing = useRef(false);
  const soundObject = useRef(null);

  // ─── KEY: tracks whether this voice screen is still the active mode.
  // Set to false on close/mode-switch. Pipeline checks this before playing audio.
  const isActiveRef = useRef(true);

  const transition = (target, duration = 800, easing = Easing.inOut(Easing.cubic)) => {
    return Animated.timing(driver, {
      toValue: target,
      duration,
      easing,
      useNativeDriver: true,
    });
  };

  const startWander = () => {
    stopWander();
    wanderDriver.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wanderDriver, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wanderDriver, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    wanderLoop.current = loop;
  };
  const stopWander = () => {
    if (wanderLoop.current) {
      wanderLoop.current.stop();
      wanderLoop.current = null;
    }
  };

  // ─── LISTENING BREATH — slow uniform, particles move in sync ───
  const startBreath = () => {
    stopBreath();
    breathDriver.setValue(0);
    const loop = Animated.loop(
      Animated.timing(breathDriver, {
        toValue: 1,
        duration: 5000,   // 5 sec full breath cycle (inhale+exhale)
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    breathLoop.current = loop;
  };
  const stopBreath = () => {
    if (breathLoop.current) {
      breathLoop.current.stop();
      breathLoop.current = null;
    }
    breathDriver.setValue(0);
  };

  // ─── SPEAKING WAVE — fast loop, each particle hits its phase at different moments ───
  const startSpeak = () => {
    stopSpeak();
    speakDriver.setValue(0);
    const loop = Animated.loop(
      Animated.timing(speakDriver, {
        toValue: 1,
        duration: 2400,   // 2.4 sec cycle; wave ripples across sphere continuously
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    speakLoop.current = loop;
  };
  const stopSpeak = () => {
    if (speakLoop.current) {
      speakLoop.current.stop();
      speakLoop.current = null;
    }
    speakDriver.setValue(0);
  };

  const startRecording = async () => {
    if (isProcessing.current || !isActiveRef.current) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setState(STATE.ERROR);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const preset = Audio.RecordingOptionsPresets?.HIGH_QUALITY;
      const { recording: rec } = await Audio.Recording.createAsync(preset);
      recording.current = rec;
      silenceStart.current = null;
      hasSpoken.current = false;

      setState(STATE.LISTENING);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startBreath(); // subtle slow inward breath while listening

      let calibrationSamples = [];
      let ambientFloor = null;
      let recentLevels = [];
      const ROLLING_WINDOW = 10;

      meteringInterval.current = setInterval(async () => {
        if (!recording.current || isProcessing.current) return;
        try {
          const status = await recording.current.getStatusAsync();
          let level = 0;
          if (status.metering !== undefined && status.metering !== null) {
            level = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          }
          if (ambientFloor === null) {
            calibrationSamples.push(level);
            if (calibrationSamples.length >= CALIBRATION_TICKS) {
              ambientFloor = Math.min(...calibrationSamples);
            }
            return;
          }
          recentLevels.push(level);
          if (recentLevels.length > ROLLING_WINDOW) recentLevels.shift();
          const avg = recentLevels.reduce((a, b) => a + b, 0) / recentLevels.length;
          const variance = recentLevels.reduce((s, v) => s + (v - avg) ** 2, 0) / recentLevels.length;
          const stdDev = Math.sqrt(variance);
          if (stateRef.current !== STATE.LISTENING) return;
          const speechThreshold = ambientFloor + SPEECH_MARGIN;
          if (level > speechThreshold) {
            hasSpoken.current = true;
            silenceStart.current = null;
          } else if (hasSpoken.current && stdDev < SILENCE_STD && recentLevels.length >= ROLLING_WINDOW) {
            if (!silenceStart.current) {
              silenceStart.current = Date.now();
            } else if (Date.now() - silenceStart.current > SILENCE_MS) {
              triggerAutoSend();
            }
          } else if (hasSpoken.current) {
            if (silenceStart.current) silenceStart.current = null;
          }
        } catch (e) {}
      }, 200);
    } catch (e) {
      setState(STATE.ERROR);
    }
  };

  // ─── Auto-send on silence: skip collapse entirely. Disperse sphere and send.
  const triggerAutoSend = async () => {
    if (stateRef.current !== STATE.LISTENING) return;
    if (meteringInterval.current) {
      clearInterval(meteringInterval.current);
      meteringInterval.current = null;
    }
    stopBreath(); // stop listening breath
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState(STATE.DISPERSING);
    isProcessing.current = true;

    let uri = null;
    try {
      await recording.current?.stopAndUnloadAsync();
      uri = recording.current?.getURI();
      recording.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e) {}

    // Disperse particles out across screen
    transition(2, 900, Easing.out(Easing.quad)).start(() => {
      setState(STATE.WAITING);
      startWander();
    });

    try {
      if (!uri) throw new Error('no audio uri');
      const tr = await transcribeAudio(uri);
      if (!tr.success || !tr.transcript?.trim()) throw new Error('empty transcript');
      const userText = tr.transcript.trim();
      const newConv = [...conversationRef.current, { role: 'user', content: userText }];
      setConversation(newConv);

      const cr = chatWithOracleStream(userText, kundliData, newConv, language);
      let fullResponse = '';
      let sentenceBuf = '';
      let firstTTSPromise = null;
      let remainderText = '';

      // Try streaming first, fall back to non-streaming
      try {
        for await (const ev of cr) {
            if (!isActiveRef.current) break;
          if (ev.type === 'delta') {
            fullResponse += ev.text;
            sentenceBuf += ev.text;
            if (!firstTTSPromise && sentenceBuf.length > 20 && /[.!?।]\s*$/.test(sentenceBuf.trim())) {
              firstTTSPromise = textToSpeech(sentenceBuf.trim());
              sentenceBuf = '';
            }
          } else if (ev.type === 'done') {
            if (ev.response) fullResponse = ev.response;
            break;
          }
        }
      } catch (streamErr) {
        console.log('[VOICE] Stream error:', streamErr.message);
      }

      // Fallback: if streaming yielded nothing, use regular call
      if (!fullResponse.trim() && isActiveRef.current) {
        const fallback = await chatWithOracle(userText, kundliData, newConv, language);
        if (fallback?.success && fallback?.data?.response) {
          fullResponse = fallback.data.response;
        } else if (fallback?.response) {
          fullResponse = fallback.response;
        }
      }
      if (!fullResponse.trim()) throw new Error('no oracle response');

      remainderText = sentenceBuf.trim();
      const oracleText = fullResponse;
      const updatedConv = [...newConv, { role: 'oracle', content: oracleText, hook: '' }];
      setConversation(updatedConv);

      // Get first TTS result (already in-flight since first sentence)
      let ttsResult = null;
      if (firstTTSPromise) {
        ttsResult = await firstTTSPromise;
        // Fire remainder TTS in parallel while first chunk plays
        if (remainderText && ttsResult?.success) {
          var remainderTTSPromise = textToSpeech(remainderText);
        }
      }
      // Fallback: TTS the full response if first-sentence TTS didn't fire
      if (!ttsResult?.success || !ttsResult?.audio) {
        ttsResult = await textToSpeech(oracleText);
      }
      const tts = ttsResult;
      if (!isActiveRef.current) return;
      if (!tts.success || !tts.audio) throw new Error('no tts audio');

      const audioUri = FileSystem.cacheDirectory + 'oracle_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(audioUri, tts.audio, { encoding: 'base64' });
      if (!isActiveRef.current) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      if (!isActiveRef.current) return;

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true, volume: 1.0 });
      soundObject.current = sound;

      if (!isActiveRef.current) {
        try { await sound.stopAsync(); } catch (e) {}
        try { await sound.unloadAsync(); } catch (e) {}
        soundObject.current = null;
        return;
      }

      // Audio is now playing — slowly reform sphere, then start speaking wave
      stopWander();
      setState(STATE.REFORMING);
      transition(0, 4500, Easing.out(Easing.quad)).start(() => {
        setState(STATE.SPEAKING);
        startSpeak();
      });

      await new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.didJustFinish || !isActiveRef.current) {
            try { sound.unloadAsync(); } catch (e) {}
            soundObject.current = null;
            resolve();
          }
        });
      });

      // Play remainder audio if sentence-chunked TTS was used
      if (typeof remainderTTSPromise !== 'undefined' && remainderTTSPromise && isActiveRef.current) {
        try {
          const remTTS = await remainderTTSPromise;
          if (remTTS?.success && remTTS?.audio && isActiveRef.current) {
            const remUri = FileSystem.cacheDirectory + 'oracle_rem_' + Date.now() + '.mp3';
            await FileSystem.writeAsStringAsync(remUri, remTTS.audio, { encoding: 'base64' });
            const { sound: remSound } = await Audio.Sound.createAsync({ uri: remUri }, { shouldPlay: true, volume: 1.0 });
            soundObject.current = remSound;
            await new Promise((res) => {
              remSound.setOnPlaybackStatusUpdate((s) => {
                if (s.didJustFinish || !isActiveRef.current) {
                  try { remSound.unloadAsync(); } catch (e) {}
                  soundObject.current = null;
                  res();
                }
              });
            });
          }
        } catch (e) {}
      }
      stopSpeak();

      // Reform particles back to sphere, THEN restart recording
      stopWander();
      if (!isActiveRef.current) { isProcessing.current = false; return; }
      setState(STATE.REFORMING);
      transition(0, 4500, Easing.out(Easing.cubic)).start(() => {
        isProcessing.current = false;
        if (isActiveRef.current) startRecording();
      });
    } catch (e) {
      stopWander();
      stopSpeak();
      if (!isActiveRef.current) return;
      setState(STATE.REFORMING);
      transition(0, 900, Easing.out(Easing.cubic)).start(() => {
        isProcessing.current = false;
        if (isActiveRef.current) startRecording();
      });
    }
  };

  // Manual tap on sphere = immediate auto-send (no collapse step)
  const handleSphereTap = () => {
    if (stateRef.current === STATE.LISTENING && hasSpoken.current) {
      triggerAutoSend();
    }
  };

  const cleanup = () => {
    isActiveRef.current = false;
    stopWander();
    stopBreath();
    stopSpeak();
    if (meteringInterval.current) {
      clearInterval(meteringInterval.current);
      meteringInterval.current = null;
    }
    try { recording.current?.stopAndUnloadAsync(); } catch (e) {}
    recording.current = null;
    // Stop and unload any in-flight audio
    if (soundObject.current) {
      try { soundObject.current.stopAsync(); } catch (e) {}
      try { soundObject.current.unloadAsync(); } catch (e) {}
      soundObject.current = null;
    }
  };

  useEffect(() => {
    isActiveRef.current = true;
    startRecording();
    return cleanup;
  }, []);

  // Toggle handler — pushing to chat side closes voice
  const handleToggleChange = (target) => {
    if (target === 'chat') {
      // Save conversation back to chat state
      if (onConversationUpdate && conversationRef.current.length > 0) {
        onConversationUpdate(conversationRef.current);
      }
      cleanup();
      if (onClose) onClose();
    }
  };

  const isListening = state === STATE.LISTENING;

  return (
    <View style={styles.container}>
      {particles.map((p) => (
        <Particle key={p.id} particle={p} driver={driver} wanderDriver={wanderDriver} breathDriver={breathDriver} speakDriver={speakDriver} />
      ))}

      {isListening && (
        <TouchableOpacity
          style={styles.sphereTapTarget}
          onPress={handleSphereTap}
          activeOpacity={1}
        />
      )}

      {/* Toggle at top center — replaces the X close button */}
      <View style={styles.topBar}>
        <ChatVoiceToggle mode="voice" onChange={handleToggleChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  sphereTapTarget: {
    position: 'absolute',
    left: CX - SPHERE_RADIUS - 30,
    top: CY - SPHERE_RADIUS - 30,
    width: (SPHERE_RADIUS + 30) * 2,
    height: (SPHERE_RADIUS + 30) * 2,
    borderRadius: SPHERE_RADIUS + 30,
  },
  sendTarget: {
    position: 'absolute',
    left: CX - BUTTON_RADIUS - 16,
    top: CY - BUTTON_RADIUS - 16,
    width: (BUTTON_RADIUS + 16) * 2,
    height: (BUTTON_RADIUS + 16) * 2,
    borderRadius: BUTTON_RADIUS + 16,
    zIndex: 10,
  },
});