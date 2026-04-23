import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';


const INTRO_TEXT = {
  bond: { en: 'The Bond', hi: 'बंधन', es: 'El Vínculo', pt: 'O Vínculo', zh: '缘分', ja: '絆' },
  sky: { en: 'Stars Of Your Loved Ones', hi: 'अपनों के सितारे', es: 'Estrellas De Tus Seres Queridos', pt: 'Estrelas Dos Seus Queridos', zh: '挚爱的星辰', ja: '大切な人の星' },
};
const { width: SW, height: SH } = Dimensions.get('window');

// ═══════════════════════════════════════
// MOON — Clean waxing/waning cycle
// ═══════════════════════════════════════
const MR = 42;
const MD = MR * 2;

function MoonIntro({ onComplete, language = 'en' }) {
  const phase = useRef(new Animated.Value(0)).current;
  const moonOp = useRef(new Animated.Value(0)).current;
  const goldOp = useRef(new Animated.Value(0)).current;
  const textOp = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  const shadowX = phase.interpolate({ inputRange: [0, 14], outputRange: [0, -(MD + 6)] });
  const brightness = phase.interpolate({ inputRange: [0, 3, 7, 14], outputRange: [0.08, 0.25, 0.45, 0.7] });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(moonOp, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(300),
      Animated.timing(phase, { toValue: 14, duration: 4500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(goldOp, { toValue: 0.2, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(500),
      Animated.timing(textOp, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.delay(1000),
      Animated.timing(textOp, { toValue: 0, duration: 500, useNativeDriver: false }),
      Animated.delay(200),
      Animated.timing(goldOp, { toValue: 0, duration: 400, useNativeDriver: false }),
      Animated.timing(phase, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.delay(300),
      Animated.timing(fadeOut, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
      Animated.delay(100),
    ]).start(() => { if (onComplete) onComplete(); });
  }, []);

  return (
    <Animated.View style={[st.container, { opacity: fadeOut }]}>
      <Animated.View style={{ opacity: moonOp }}>
        <View style={{ position: 'absolute', width: MD, height: MD, borderRadius: MR, shadowColor: '#fff', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }} />
        <View style={{ width: MD, height: MD, borderRadius: MR, overflow: 'hidden' }}>
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, borderRadius: MR, backgroundColor: '#E8E4DE', opacity: brightness }} />
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, borderRadius: MR, backgroundColor: '#D4AF37', opacity: goldOp }} />
          <Animated.View style={{ position: 'absolute', width: MD + 6, height: MD + 6, borderRadius: (MD + 6) / 2, backgroundColor: '#000', top: -3, transform: [{ translateX: shadowX }] }} />
        </View>
      </Animated.View>
      <Animated.Text style={[st.labelGold, { opacity: textOp, marginTop: 35 }]}>{INTRO_TEXT.bond[language] || INTRO_TEXT.bond.en}</Animated.Text>
    </Animated.View>
  );
}


// ═══════════════════════════════════════
// ANOTHER SKY — Particle Circle
// Circle appears, particles drift inside,
// text, particles accelerate + collide,
// implode to center, circle fades.
// ═══════════════════════════════════════
const CR = 50;
const PCOUNT = 24;

class ParticleSim {
  constructor() {
    this.particles = [];
    for (let i = 0; i < PCOUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (CR - 5);
      this.particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1.5 + Math.random() * 2,
        gold: Math.random() < 0.35,
        alive: true,
      });
    }
    this.speed = 1;
    this.imploding = false;
  }

  update() {
    this.particles.forEach(p => {
      if (!p.alive) return;

      if (this.imploding) {
        const dx = -p.x;
        const dy = -p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) { p.alive = false; return; }
        const force = 8;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else {
        // Random drift + speed multiplier
        p.vx += (Math.random() - 0.5) * 0.15 * this.speed;
        p.vy += (Math.random() - 0.5) * 0.15 * this.speed;
        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Bounce off circle boundary
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      const maxR = CR - p.size;
      if (dist > maxR && !this.imploding) {
        const nx = p.x / dist;
        const ny = p.y / dist;
        p.x = nx * maxR;
        p.y = ny * maxR;
        // Reflect velocity
        const dot = p.vx * nx + p.vy * ny;
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
        p.vx *= 0.8;
        p.vy *= 0.8;
      }
    });
  }

  allDead() { return this.particles.every(p => !p.alive); }
}

function ParticleCircleIntro({ onComplete, language = 'en' }) {
  const [, forceUpdate] = useState(0);
  const circleOp = useRef(new Animated.Value(0)).current;
  const textOp = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const simRef = useRef(new ParticleSim());
  const frameRef = useRef(null);
  const phaseRef = useRef('drift'); // drift | text | accel | implode | done
  const timerRef = useRef(null);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    Animated.timing(fadeOut, { toValue: 0, duration: 500, useNativeDriver: false }).start(() => {
      if (onComplete) onComplete();
    });
  };

  useEffect(() => {
    // Circle appears
    Animated.timing(circleOp, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    // Phase timeline
    // 0-1.5s: drift
    timerRef.current = setTimeout(() => {
      phaseRef.current = 'text';
      Animated.timing(textOp, { toValue: 1, duration: 600, useNativeDriver: false }).start();
    }, 1500);

    setTimeout(() => {
      // Text shown, now accelerate
      phaseRef.current = 'accel';
      simRef.current.speed = 8;
    }, 3000);

    setTimeout(() => {
      // Fade text
      Animated.timing(textOp, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }, 4500);

    setTimeout(() => {
      // Implode
      phaseRef.current = 'implode';
      simRef.current.imploding = true;
    }, 5000);

    setTimeout(() => {
      // Circle fades
      Animated.timing(circleOp, { toValue: 0, duration: 500, useNativeDriver: false }).start();
    }, 5500);

    // Failsafe
    setTimeout(finish, 7000);

    // Animation loop
    const animate = () => {
      simRef.current.update();
      forceUpdate(n => n + 1);
      if (simRef.current.allDead() && phaseRef.current === 'implode') {
        finish();
        return;
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const particles = simRef.current.particles.filter(p => p.alive);

  return (
    <Animated.View style={[st.container, { opacity: fadeOut }]}>
      {/* Circle */}
      <Animated.View style={{
        width: CR * 2, height: CR * 2, borderRadius: CR,
        borderWidth: 0.8, borderColor: 'rgba(255,255,255,0.35)',
        opacity: circleOp,
        justifyContent: 'center', alignItems: 'center',
      }}>
        {/* Particles */}
        {particles.map((p, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: CR + p.x - p.size / 2,
            top: CR + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.gold ? '#D4AF37' : '#fff',
            opacity: p.gold ? 0.7 : 0.5,
          }} />
        ))}
      </Animated.View>

      <Animated.Text style={[st.labelGold, { opacity: textOp, marginTop: 30 }]}>
        {INTRO_TEXT.sky[language] || INTRO_TEXT.sky.en}
      </Animated.Text>
    </Animated.View>
  );
}


export default function ShapeIntro({ variant = 'sky', onComplete, language = 'en' }) {
  if (variant === 'bond') return <MoonIntro onComplete={onComplete} language={language} />;
  return <ParticleCircleIntro onComplete={onComplete} language={language} />;
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  labelGold: { color: '#D4AF37', fontSize: 14, fontWeight: '200', fontStyle: 'italic', letterSpacing: 3, textAlign: 'center', opacity: 0.85 },
});