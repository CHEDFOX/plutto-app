import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { STARS } from '../utils/starSeed';

const { width: SW, height: SH } = Dimensions.get('window');

const SINGULARITY_X = -30;
const SINGULARITY_Y = SH / 2;

class ParticleSystem {
  constructor() {
    // Use starSeed positions — matches the static splash.png exactly
    this.particles = STARS.map((s, i) => ({
      id: i,
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      size: s.size * 2,
      opacity: s.baseOpacity,
      consumed: false,
    }));
  }

  update() {
    const G = 18;
    this.particles.forEach(p => {
      if (p.consumed) return;
      const dx = SINGULARITY_X - p.x;
      const dy = SINGULARITY_Y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        p.consumed = true;
        p.opacity = 0;
        return;
      }
      const forceMag = G * (25000 / (dist * dist + 20));
      const nx = dx / dist;
      const ny = dy / dist;
      p.vx += nx * forceMag;
      p.vy += ny * forceMag;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx;
      p.y += p.vy;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      p.opacity = Math.min(1, 0.3 + speed * 0.015);
      p.size = Math.max(0.1, (dist / SW) * 1.8);
    });
  }

  getState() {
    return this.particles.filter(p => !p.consumed);
  }

  allConsumed() {
    return this.particles.every(p => p.consumed);
  }
}

export default function SplashScreen({ onComplete }) {
  const [, forceUpdate] = useState(0);
  const [phase, setPhase] = useState('still');
  const systemRef = useRef(null);
  const frameRef = useRef(null);
  const completedRef = useRef(false);

  if (!systemRef.current) {
    systemRef.current = new ParticleSystem();
  }

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Stars sit still for 1.5s, then start pulling
    const stillTimer = setTimeout(() => setPhase('pulling'), 1500);
    const failsafe = setTimeout(complete, 4000);
    return () => { clearTimeout(stillTimer); clearTimeout(failsafe); };
  }, []);

  useEffect(() => {
    if (phase !== 'pulling') return;
    const animate = () => {
      systemRef.current.update();
      forceUpdate(n => n + 1);
      if (systemRef.current.allConsumed()) { complete(); return; }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  const particles = systemRef.current.getState();

  return (
    <View style={st.container}>
      {particles.map(p => (
        <View key={p.id} style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          opacity: p.opacity,
          backgroundColor: '#fff',
        }} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});