import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, Dimensions, Animated as RNAnimated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Canvas, Circle, Group, Path, Fill, Skia,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { STARS } from '../utils/starSeed';

const { width: SW, height: SH } = Dimensions.get('window');

// Timing --------------------------------------------------------------
const STILL_MS       = 800;
const CHAOS_MS       = 1500;
const FAILSAFE_MS    = 8000;
const EMPTY_HOLD_MS  = 1000;
const DISSOLVE_MS    = 800;

// Singularity
const SINGULARITY_X  = -30;
const SINGULARITY_Y  = SH / 2;
const CONSUMED_DIST  = 28;

// Chaos -------------------------------------------------------------
const CHAOS_SPEED_MIN = 6;
const CHAOS_SPEED_MAX = 15;
const CHAOS_DAMPING   = 0.998;
const COLLISION_R     = 4;
const TRAIL_LEN_CHAOS = 5;

// Pull -------------------------------------------------------------
const PULL_DAMPING       = 0.96;
const PULL_MAX_SPEED     = 16;
const VACUUM_SPEED       = 42;
const VACUUM_AT          = 0.80;
const VACUUM_IMPULSE     = 20;
const TRAIL_LEN_PULL_MAX = 14;
const G_FORCE_CONST      = 18;

// Haptic cadence
const CHAOS_HAPTIC_MIN_MS = 150;
const CHAOS_HAPTIC_MAX_MS = 250;
const PULL_HAPTIC_MS      = 100;

// Sizing
const SIZE_STILL_MULT  = 1.2;
const SIZE_MIN_STILL   = 0.5;
const SIZE_MOTION_MULT = 0.6;
const SIZE_MIN_MOTION  = 0.35;

// Brightness
const STILL_OPACITY_MIN  = 0.65;
const MOTION_OPACITY_MIN = 0.95;

// Trails
const TRAIL_OPACITY = 0.05;

const DRONE_URI = 'https://api.plutto.space/static/splash/drone.mp3';

class System {
  constructor() {
    this.particles = STARS.map((s, i) => ({
      id: i,
      x: s.x, y: s.y,
      vx: 0, vy: 0,
      baseSize: s.size,
      baseOpacity: s.baseOpacity,
      consumed: false,
      trail: [],
    }));
    this.vacuumApplied = false;
  }

  triggerChaos() {
    for (const p of this.particles) {
      const angle = Math.random() * Math.PI * 2;
      const speed = CHAOS_SPEED_MIN + Math.random() * (CHAOS_SPEED_MAX - CHAOS_SPEED_MIN);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    }
  }

  updateChaos() {
    for (const p of this.particles) {
      if (p.consumed) continue;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 1) { p.vx = Math.abs(p.vx); p.x = 1; }
      else if (p.x > SW - 1) { p.vx = -Math.abs(p.vx); p.x = SW - 1; }
      if (p.y < 1) { p.vy = Math.abs(p.vy); p.y = 1; }
      else if (p.y > SH - 1) { p.vy = -Math.abs(p.vy); p.y = SH - 1; }
      p.vx *= CHAOS_DAMPING;
      p.vy *= CHAOS_DAMPING;
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > TRAIL_LEN_CHAOS) p.trail.length = TRAIL_LEN_CHAOS;
    }
    const arr = this.particles;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      if (a.consumed) continue;
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        if (b.consumed) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < COLLISION_R * COLLISION_R && d2 > 0.001) {
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
          const vN = dvx * nx + dvy * ny;
          if (vN < 0) continue;
          a.vx -= vN * nx;
          a.vy -= vN * ny;
          b.vx += vN * nx;
          b.vy += vN * ny;
          const overlap = (COLLISION_R - d) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }

  applyVacuum() {
    if (this.vacuumApplied) return;
    this.vacuumApplied = true;
    for (const p of this.particles) {
      if (p.consumed) continue;
      const dx = SINGULARITY_X - p.x;
      const dy = SINGULARITY_Y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
      p.vx += (dx / d) * VACUUM_IMPULSE;
      p.vy += (dy / d) * VACUUM_IMPULSE;
    }
  }

  updatePull() {
    const cf = this.consumedFraction();
    if (cf >= VACUUM_AT) this.applyVacuum();
    const speedCap = this.vacuumApplied ? VACUUM_SPEED : PULL_MAX_SPEED;

    for (const p of this.particles) {
      if (p.consumed) continue;
      const dx = SINGULARITY_X - p.x;
      const dy = SINGULARITY_Y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONSUMED_DIST) {
        p.consumed = true;
        p.trail.length = 0;
        continue;
      }
      const forceMag = G_FORCE_CONST * (25000 / (dist * dist + 20));
      p.vx += (dx / dist) * forceMag;
      p.vy += (dy / dist) * forceMag;
      p.vx *= PULL_DAMPING;
      p.vy *= PULL_DAMPING;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > speedCap) {
        p.vx = (p.vx / speed) * speedCap;
        p.vy = (p.vy / speed) * speedCap;
      }
      const trailLen = Math.min(TRAIL_LEN_PULL_MAX, Math.max(2, Math.floor(speed * 0.7)));
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > trailLen) p.trail.length = trailLen;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  clearAll() {
    for (const p of this.particles) {
      p.consumed = true;
      p.trail.length = 0;
    }
  }

  consumedFraction() {
    let c = 0;
    for (const p of this.particles) if (p.consumed) c++;
    return c / this.particles.length;
  }

  allConsumed() {
    for (const p of this.particles) if (!p.consumed) return false;
    return true;
  }
}

export default function SplashScreen({ onComplete }) {
  const [, force] = useState(0);
  const [phase, setPhase] = useState('still');

  const sys = useRef(null);
  if (!sys.current) sys.current = new System();

  const frameRef = useRef(null);
  const doneRef  = useRef(false);

  const dissolve = useRef(new RNAnimated.Value(1)).current;
  const droneRef = useRef(null);

  // Audio drone — silent fallback if asset missing
  useEffect(() => {
    let live = true;
    let fadeId;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: DRONE_URI },
          { volume: 0, shouldPlay: true, isLooping: true }
        );
        if (!live) { sound.unloadAsync().catch(() => {}); return; }
        droneRef.current = sound;
        let v = 0;
        fadeId = setInterval(() => {
          v = Math.min(0.38, v + 0.02);
          sound.setVolumeAsync(v).catch(() => {});
          if (v >= 0.38) clearInterval(fadeId);
        }, 80);
      } catch (_) { /* silent */ }
    })();
    return () => {
      live = false;
      if (fadeId) clearInterval(fadeId);
      const s = droneRef.current;
      if (s) s.unloadAsync().catch(() => {});
    };
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    if (sys.current) sys.current.clearAll();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const s = droneRef.current;
    if (s) {
      let v = 0.38;
      const fid = setInterval(() => {
        v = Math.max(0, v - 0.05);
        s.setVolumeAsync(v).catch(() => {});
        if (v <= 0) { clearInterval(fid); s.stopAsync().catch(() => {}); }
      }, 30);
    }

    setPhase('done');
    force(n => n + 1);
    setTimeout(() => {
      RNAnimated.timing(dissolve, {
        toValue: 0,
        duration: DISSOLVE_MS,
        useNativeDriver: true,
      }).start(() => { if (onComplete) onComplete(); });
    }, EMPTY_HOLD_MS);
  }, [dissolve, onComplete]);

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => {
      sys.current.triggerChaos();
      setPhase('chaos');
    }, STILL_MS);

    const t2 = setTimeout(() => {
      setPhase('pull');
    }, STILL_MS + CHAOS_MS);

    const fs = setTimeout(finish, FAILSAFE_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fs);
    };
  }, [finish]);

  // Chaos haptics — broken/staccato
  useEffect(() => {
    if (phase !== 'chaos') return;
    let cancelled = false;
    function tick() {
      if (cancelled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setTimeout(tick, CHAOS_HAPTIC_MIN_MS + Math.random() * (CHAOS_HAPTIC_MAX_MS - CHAOS_HAPTIC_MIN_MS));
    }
    const startT = setTimeout(tick, 30);
    return () => { cancelled = true; clearTimeout(startT); };
  }, [phase]);

  // Pull haptics — smooth continuous-feeling
  useEffect(() => {
    if (phase !== 'pull') return;
    const iv = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    }, PULL_HAPTIC_MS);
    return () => clearInterval(iv);
  }, [phase]);

  // Animation loop
  useEffect(() => {
    if (phase !== 'chaos' && phase !== 'pull') return;
    const tick = () => {
      if (phase === 'chaos') sys.current.updateChaos();
      else sys.current.updatePull();
      force(n => (n + 1) % 1e9);
      if (phase === 'pull' && sys.current.allConsumed()) {
        finish();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [phase, finish]);

  const particles = sys.current.particles;
  const isStill = phase === 'still';

  const trails = [];
  for (const p of particles) {
    if (p.consumed || p.trail.length < 2) continue;
    const path = Skia.Path.Make();
    path.moveTo(p.x, p.y);
    for (const t of p.trail) path.lineTo(t.x, t.y);
    trails.push({ id: p.id, path });
  }

  return (
    <RNAnimated.View style={[st.container, { opacity: dissolve }]}>
      <StatusBar style="light" />
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color="#000000" />

        <Group>
          {trails.map(tr => (
            <Path
              key={`t${tr.id}`}
              path={tr.path}
              color={`rgba(255,255,255,${TRAIL_OPACITY})`}
              style="stroke"
              strokeWidth={0.5}
            />
          ))}
        </Group>

        <Group>
          {particles.map(p => {
            if (p.consumed) return null;
            const size = isStill
              ? Math.max(SIZE_MIN_STILL, p.baseSize * SIZE_STILL_MULT)
              : Math.max(SIZE_MIN_MOTION, p.baseSize * SIZE_MOTION_MULT);
            const opacity = isStill
              ? Math.max(STILL_OPACITY_MIN, p.baseOpacity)
              : Math.max(MOTION_OPACITY_MIN, p.baseOpacity);
            return (
              <Circle
                key={p.id}
                cx={p.x} cy={p.y}
                r={size}
                color={`rgba(255,255,255,${opacity})`}
              />
            );
          })}
        </Group>
      </Canvas>
    </RNAnimated.View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});