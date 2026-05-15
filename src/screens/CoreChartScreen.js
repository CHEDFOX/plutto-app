/**
 * CORE CHART SCREEN
 * - Wheel centered on open; first node tap shifts it to top.
 * - Tapping any node opens NodeCard (what + significance). Auto only first time per node.
 * - Re-tap same node = card re-appears. Card swipe-any-direction or tap-outside to dismiss.
 * - After dismiss, readings panel shows effect + do/dont only.
 * - System-specific connection lines glow briefly on node selection.
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Animated, Easing, Dimensions, PanResponder, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line, Circle, Path, G } from 'react-native-svg';
import MediaView from '../components/MediaView';

let BlurView; try { BlurView = require('expo-blur').BlurView } catch (_) { BlurView = null }
let LinearGradient; try { LinearGradient = require('expo-linear-gradient').LinearGradient } catch (_) { LinearGradient = null }
let getMediaUri; try { ({ getMediaUri } = require('../config/mediaCache')) } catch (_) { getMediaUri = p => 'https://api.plutto.space/static/' + p }

const { width: SW, height: SH } = Dimensions.get('window');
const W = a => `rgba(255,255,255,${a})`;
const GOLD = '#D4AF37';
const API = 'https://api.plutto.space/api/public';
const SYS = ['vedic', 'kp', 'western', 'chinese', 'numerology'];
const SYS_L = ['Vedic', 'KP', 'Western', 'Chinese', 'Numerology'];
const WR = [118, 128, 122, 95, 108], NSZ = [38, 32, 36, 44, 40];
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000, REFRESH_AT = 6 * 24 * 60 * 60 * 1000;
const VIDS = ['transitions/lens_1.mp4', 'transitions/lens_2.mp4', 'transitions/lens_3.mp4', 'transitions/lens_4.mp4', 'transitions/lens_5.mp4'];
const pick = () => getMediaUri(VIDS[Math.floor(Math.random() * VIDS.length)]);

// Per-system fallback colour for card background if image missing
const SYSTEM_BG = {
  vedic: '#1a0f08',
  kp: '#0f1620',
  western: '#15101e',
  chinese: '#0d1812',
  numerology: '#1a1408',
};

const W_ASPECTS = { 60: '#8BB4D9', 90: '#D98B8B', 120: '#8BD99B', 180: '#FFFFFF' };
const CN_COLORS = ['#7BB87B', '#D98B8B', '#D9B97B', '#C7C7C7', '#7B9BD9'];

// ─── CTA breathing button ──────────────────────────────────────────────────
function CTA({ text, onPress }) {
  const b = useRef(new Animated.Value(0.08)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(b, { toValue: 0.18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(b, { toValue: 0.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}>
      <Animated.View style={[ms.ctaBox, { borderColor: b.interpolate({ inputRange: [0.08, 0.18], outputRange: [W(0.08), W(0.18)] }) }]}>
        <Text style={ms.ctaL}>{text}</Text><Text style={ms.ctaA}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Reveal — fade+slide on mount ─────────────────────────────────────────
function Reveal({ visible, delay = 0, children }) {
  const o = useRef(new Animated.Value(0)).current, t = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    if (visible) {
      o.setValue(0); t.setValue(24);
      Animated.parallel([
        Animated.timing(o, { toValue: 1, duration: 600, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 600, delay, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return <Animated.View style={{ opacity: o, transform: [{ translateY: t }] }}>{children}</Animated.View>;
}

// ─── Wheel node ───────────────────────────────────────────────────────────
function WheelNode({ n, x, y, sz, atTop, special, op, sysName, showImg }) {
  const txtO = useRef(new Animated.Value(1)).current;
  const imgO = useRef(new Animated.Value(0)).current;
  const [imgExists, setImgExists] = useState(false);
  const shouldAnimate = atTop && showImg && imgExists;
  useEffect(() => {
    if (shouldAnimate) {
      Animated.parallel([
        Animated.timing(txtO, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(imgO, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(txtO, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(imgO, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [shouldAnimate]);
  const innerSz = sz * 0.65;
  return (
    <View style={{
      position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz / 2,
      borderWidth: atTop ? 1.5 : 0.8,
      borderColor: atTop ? GOLD : special ? GOLD + '60' : W(0.22),
      backgroundColor: atTop ? GOLD + '0C' : 'transparent',
      alignItems: 'center', justifyContent: 'center', opacity: op,
    }}>
      <Animated.View style={{ opacity: txtO, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{
          fontSize: atTop ? 12 : 9,
          color: atTop ? GOLD : special ? GOLD : W(0.78),
          fontWeight: atTop ? '500' : '400',
        }} numberOfLines={1}>{n.label}</Text>
        {atTop && n.sign ? <Text style={{ fontSize: 7, color: W(0.4), marginTop: 1 }} numberOfLines={1}>{n.sign}</Text> : null}
      </Animated.View>
      {atTop ? (
        <Animated.View style={{ position: 'absolute', opacity: imgO }}>
          <MediaView uri={'planets/' + sysName + '/' + n.id + '.png'} style={{ width: innerSz, height: innerSz }} rounded onLoaded={() => setImgExists(true)} onFailed={() => setImgExists(false)} />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Connection lines overlay (system-specific) ───────────────────────────
function WheelConnections({ selectedIdx, nodes, radius, nodeSize, system }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const COUNT = nodes?.length || 0;
  const STEP = COUNT > 0 ? (2 * Math.PI) / COUNT : 0;
  const TOP = -Math.PI / 2;
  const center = radius + nodeSize + 10;
  const size = center * 2;

  useEffect(() => {
    if (selectedIdx == null || !COUNT) { opacity.setValue(0); return; }
    opacity.setValue(0);
    Animated.sequence([
      Animated.delay(150),
      Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(opacity, { toValue: 0, duration: 1000, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
    ]).start();
  }, [selectedIdx, system]);

  const shapes = useMemo(() => {
    if (selectedIdx == null || !COUNT) return null;
    const pos = nodes.map((_, i) => {
      const a = TOP + (i - selectedIdx) * STEP;
      return { x: center + radius * Math.cos(a), y: center + radius * Math.sin(a), idx: i };
    });
    const sel = pos[selectedIdx];
    const out = [];
    if (system === 'vedic') {
      pos.forEach(p => { if (p.idx !== selectedIdx) out.push(<Line key={p.idx} x1={sel.x} y1={sel.y} x2={p.x} y2={p.y} stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.55} />); });
    } else if (system === 'kp') {
      [1, 2, 3, 4].forEach(ring => out.push(<Circle key={'r' + ring} cx={sel.x} cy={sel.y} r={radius * 0.22 * ring} stroke="#FFFFFF" strokeWidth={0.5} strokeOpacity={Math.max(0.05, 0.35 - ring * 0.07)} strokeDasharray={[3, 5]} fill="none" />));
      pos.forEach(p => { if (p.idx !== selectedIdx) out.push(<Circle key={'d' + p.idx} cx={p.x} cy={p.y} r={2} fill="#FFFFFF" fillOpacity={0.5} />); });
    } else if (system === 'western') {
      pos.forEach(p => {
        if (p.idx === selectedIdx) return;
        const offset = Math.abs(p.idx - selectedIdx);
        const norm = Math.min(offset, COUNT - offset);
        const deg = (norm * 360) / COUNT;
        let color = null;
        for (const t of [60, 90, 120, 180]) if (Math.abs(deg - t) < 360 / COUNT / 2 + 1) { color = W_ASPECTS[t]; break; }
        if (color) out.push(<Line key={p.idx} x1={sel.x} y1={sel.y} x2={p.x} y2={p.y} stroke={color} strokeWidth={0.7} strokeOpacity={0.65} />);
      });
    } else if (system === 'chinese') {
      pos.forEach(p => {
        if (p.idx === selectedIdx) return;
        const mx = (sel.x + p.x) / 2 + (center - (sel.x + p.x) / 2) * 0.35;
        const my = (sel.y + p.y) / 2 + (center - (sel.y + p.y) / 2) * 0.35;
        out.push(<Path key={p.idx} d={`M${sel.x},${sel.y} Q${mx},${my} ${p.x},${p.y}`} stroke={CN_COLORS[p.idx % CN_COLORS.length]} strokeWidth={0.7} strokeOpacity={0.5} fill="none" />);
      });
    } else if (system === 'numerology') {
      const step = COUNT > 5 ? 2 : 1;
      let cur = selectedIdx;
      const visited = new Set([selectedIdx]);
      for (let k = 0; k < COUNT - 1; k++) {
        const nxt = (cur + step) % COUNT;
        if (visited.has(nxt)) break;
        out.push(<Line key={k} x1={pos[cur].x} y1={pos[cur].y} x2={pos[nxt].x} y2={pos[nxt].y} stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.45} />);
        visited.add(nxt); cur = nxt;
      }
    }
    return out;
  }, [selectedIdx, system, COUNT, STEP, center, radius]);

  if (selectedIdx == null || !COUNT || !shapes) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, opacity }}>
      <Svg width={size} height={size}><G>{shapes}</G></Svg>
    </Animated.View>
  );
}

// ─── Media slot for readings ──────────────────────────────────────────────
function MediaSlot({ section, system, slot, height }) {
  const [ok, setOk] = useState(false); const [tryIdx, setTryIdx] = useState(0);
  const exts = ['.jpg', '.png', '.mp4', '.gif'];
  return (
    <View style={{ width: '100%', height: ok ? height : 0, marginVertical: ok ? 24 : 0 }}>
      <MediaView uri={'readings/' + section + '/' + system + '/slot_' + slot + exts[tryIdx]} style={{ width: '100%', height }}
        onLoaded={() => setOk(true)} onFailed={() => { if (tryIdx < exts.length - 1) setTryIdx(tryIdx + 1) }} />
    </View>
  );
}

// ─── Wheel ────────────────────────────────────────────────────────────────
function Wheel({ nodes, radius, nodeSize, onSelect, sysIndex, sysName, selectedIdx, showImg }) {
  const COUNT = nodes.length, STEP = (2 * Math.PI) / COUNT, TOP = -Math.PI / 2;
  const center = radius + nodeSize + 10, size = center * 2;
  const rotRef = useRef(0); const [rv, setRv] = useState(0);
  const lastAng = useRef(0); const velRef = useRef(0); const wasDrag = useRef(false); const prevD = useRef(0);
  useEffect(() => { rotRef.current = 0; setRv(0); }, [sysIndex]);

  const snapTo = useCallback(idx => {
    const tg = -idx * STEP, df = tg - rotRef.current;
    const sn = rotRef.current + df - Math.round(df / (2 * Math.PI)) * 2 * Math.PI;
    const st = rotRef.current, dl = sn - st; let s = 0;
    const anim = () => {
      s++; const t = Math.min(s / 16, 1);
      rotRef.current = st + dl * (1 - Math.pow(1 - t, 3));
      setRv(rotRef.current);
      if (t < 1) requestAnimationFrame(anim);
      else { rotRef.current = sn; setRv(sn); onSelect?.(idx); }
    };
    requestAnimationFrame(anim);
  }, [onSelect, STEP]);

  const snapNearest = useCallback(() => {
    const norm = ((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let ci = 0, cd = Infinity;
    for (let i = 0; i < COUNT; i++) {
      const pa = ((TOP + i * STEP + norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const topA = ((TOP % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const d = Math.min(Math.abs(pa - topA), 2 * Math.PI - Math.abs(pa - topA));
      if (d < cd) { cd = d; ci = i; }
    }
    snapTo(ci);
  }, [snapTo, STEP, COUNT]);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      lastAng.current = Math.atan2(e.nativeEvent.locationY - center, e.nativeEvent.locationX - center);
      velRef.current = 0; wasDrag.current = false; prevD.current = 0;
    },
    onPanResponderMove: e => {
      wasDrag.current = true;
      const a = Math.atan2(e.nativeEvent.locationY - center, e.nativeEvent.locationX - center);
      let d = a - lastAng.current;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      velRef.current = d; rotRef.current += d; setRv(rotRef.current);
      lastAng.current = a;
      if (prevD.current !== 0 && ((prevD.current > 0 && d < 0) || (prevD.current < 0 && d > 0))) snapNearest();
      prevD.current = d;
    },
    onPanResponderRelease: e => {
      if (!wasDrag.current) {
        let best = -1, bd = Infinity;
        for (let i = 0; i < COUNT; i++) {
          const a = TOP + i * STEP + rotRef.current;
          const px = center + radius * Math.cos(a), py = center + radius * Math.sin(a);
          const d = Math.sqrt((e.nativeEvent.locationX - px) ** 2 + (e.nativeEvent.locationY - py) ** 2);
          if (d < bd) { bd = d; best = i; }
        }
        if (bd < nodeSize * 2 && best >= 0) snapTo(best);
        return;
      }
      if (Math.abs(velRef.current) > 0.015) {
        const st = rotRef.current, dl = velRef.current * 10; let s = 0;
        const dc = () => {
          s++; const t = Math.min(s / 18, 1);
          rotRef.current = st + dl * (1 - Math.pow(1 - t, 2));
          setRv(rotRef.current);
          if (t < 1) requestAnimationFrame(dc); else snapNearest();
        };
        requestAnimationFrame(dc);
      } else snapNearest();
    },
  }), [center, radius, nodeSize, COUNT, STEP, snapTo, snapNearest]);

  if (!COUNT) return null;
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <WheelConnections selectedIdx={selectedIdx} nodes={nodes} radius={radius} nodeSize={nodeSize} system={sysName} />
      {nodes.map((n, i) => {
        const a = TOP + i * STEP + rv;
        const norm = ((rv % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const pa = ((TOP + i * STEP + norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const topA = ((TOP % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const dist = Math.min(Math.abs(pa - topA), 2 * Math.PI - Math.abs(pa - topA));
        const atTop = dist < 0.2;
        const special = Boolean(n.is_mulank || n.is_bhagyank || n.is_day_master);
        const op = atTop ? 1 : 0.85;
        const x = center + radius * Math.cos(a) - nodeSize / 2;
        const y = center + radius * Math.sin(a) - nodeSize / 2;
        const sz = atTop ? nodeSize * 1.4 : nodeSize;
        const off = (sz - nodeSize) / 2;
        return <WheelNode key={n.id + '_' + sysIndex} n={n} x={x - off} y={y - off} sz={sz} atTop={atTop} special={special} op={op} sysName={sysName} showImg={atTop && i === selectedIdx && showImg} />;
      })}
      <View {...pan.panHandlers} style={{ position: 'absolute', width: size, height: size, zIndex: 5 }} />
    </View>
  );
}

// ─── NodeCard — floating compact card with blurry image bg ────────────────
function NodeCard({ visible, system, nodeId, label, title, what, significance, special, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(SH * 0.3)).current;
  const mounted = useRef(false);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => {
    if (visible) {
      mounted.current = true;
      setImgOk(false);
      tx.setValue(0);
      ty.setValue(SH * 0.3);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
        Animated.spring(ty, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else if (mounted.current) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(ty, { toValue: SH * 0.5, duration: 280, useNativeDriver: true }),
      ]).start(() => { tx.setValue(0); });
    }
  }, [visible, nodeId]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
    onPanResponderMove: (_, g) => { tx.setValue(g.dx); ty.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
      const vel = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
      if (dist > 110 || vel > 1.1) {
        const angle = Math.atan2(g.dy || 0.001, g.dx);
        const exitX = Math.cos(angle) * (SW + 200);
        const exitY = Math.sin(angle) * (SH + 200);
        Animated.parallel([
          Animated.timing(tx, { toValue: exitX, duration: 240, useNativeDriver: true }),
          Animated.timing(ty, { toValue: exitY, duration: 240, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => onDismiss?.());
      } else {
        Animated.parallel([
          Animated.spring(tx, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
          Animated.spring(ty, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
        ]).start();
      }
    },
  }), [onDismiss]);

  if (!visible && !mounted.current) return null;

  const imgPath = system && nodeId ? `cards/${system}/${nodeId}.jpg` : null;
  const bgColor = SYSTEM_BG[system] || '#0a0a0a';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'box-none' : 'none'}>
      {/* Backdrop (blurs underlying wheel + readings) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          {BlurView ? (
            <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
          )}
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Card */}
      <View style={ms.cardWrap} pointerEvents={visible ? 'box-none' : 'none'}>
        <Animated.View {...pan.panHandlers} style={[ms.card, { backgroundColor: bgColor, opacity, transform: [{ translateX: tx }, { translateY: ty }] }]}>
          {imgPath ? (
            <MediaView uri={imgPath} style={StyleSheet.absoluteFill} resizeMode="cover" onLoaded={() => setImgOk(true)} onFailed={() => setImgOk(false)} />
          ) : null}
          {LinearGradient ? (
            <LinearGradient colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
          )}

          {label ? (
            <View style={ms.cardLabel}><Text style={ms.cardLabelText}>{label.toUpperCase()}</Text></View>
          ) : null}

          <TouchableOpacity style={ms.cardX} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={ms.cardXT}>✕</Text>
          </TouchableOpacity>

          <View style={ms.cardBody}>
            {title ? <Text style={[ms.cardTitle, special ? { color: GOLD } : null]} numberOfLines={3}>{title}</Text> : null}
            {what ? <Text style={ms.cardWhat}>{what}</Text> : null}
            {significance ? <Text style={ms.cardSig}>{significance}</Text> : null}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
export default function CoreChartScreen({ visible, onClose, kundliData, onImpulse }) {
  const [data, setData] = useState(null);
  const [curSys, setCurSys] = useState(0);
  const [selIdx, setSelIdx] = useState(null);
  const [trans, setTrans] = useState(false);
  const [showImg, setShowImg] = useState(true);
  const [cardVisible, setCardVisible] = useState(false);
  const csRef = useRef(0);
  const scrollRef = useRef(null);
  const tmr = useRef(null);
  const hasSelected = useRef(false);

  const sl = useRef(new Animated.Value(SH)).current;
  const fadeA = useRef(new Animated.Value(0)).current;
  const cF = useRef(new Animated.Value(1)).current;
  const wF = useRef(new Animated.Value(1)).current;
  const wheelTopSpace = useRef(new Animated.Value(SH * 0.18)).current;
  const readingsOp = useRef(new Animated.Value(0)).current;

  const [vidSrc, setVidSrc] = useState(pick);
  useEffect(() => { csRef.current = curSys; }, [curSys]);

  const hPan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
    onPanResponderRelease: (_, g) => { if (g.dy > 60) onClose?.() },
  })).current;

  const fetchData = useCallback(async () => {
    const r = await fetch(`${API}/core-chart`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kundli_data: kundliData }),
    });
    return await r.json();
  }, [kundliData]);

  useEffect(() => {
    if (!visible || !kundliData) return;
    setCurSys(0); csRef.current = 0;
    setSelIdx(null); setTrans(false); setShowImg(true); setCardVisible(false);
    hasSelected.current = false;
    cF.setValue(1); wF.setValue(1);
    wheelTopSpace.setValue(SH * 0.18);
    readingsOp.setValue(0);
    Animated.parallel([
      Animated.spring(sl, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(fadeA, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const bd = kundliData?.raw?.birth_details || {};
    const ck = `core_chart_v2_${bd.year}_${bd.month}_${bd.day}`;
    (async () => {
      try {
        const c = await AsyncStorage.getItem(ck);
        if (c) {
          const { data: cd, ts } = JSON.parse(c);
          if (cd?.wheels && Date.now() - ts < CACHE_TTL) {
            setData(cd);
            if (Date.now() - ts > REFRESH_AT) fetchData().then(f => { if (f?.wheels) { setData(f); AsyncStorage.setItem(ck, JSON.stringify({ data: f, ts: Date.now() })); } }).catch(() => {});
            return;
          }
        }
        const f = await fetchData(); setData(f);
        if (f?.wheels) AsyncStorage.setItem(ck, JSON.stringify({ data: f, ts: Date.now() }));
      } catch (e) { try { setData(await fetchData()); } catch (_) {} }
    })();
  }, [visible, kundliData]);

  const onScroll = useCallback(e => { setShowImg(e.nativeEvent.contentOffset.y < 30); }, []);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(sl, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }),
      Animated.timing(fadeA, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }, [onClose]);

  const onNodeSelect = useCallback(idx => {
    onImpulse?.();
    setSelIdx(idx);
    setShowImg(true);
    setCardVisible(true);
    readingsOp.setValue(0);
    if (!hasSelected.current) {
      hasSelected.current = true;
      Animated.timing(wheelTopSpace, { toValue: 12, duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false }).start();
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [onImpulse]);

  const dismissCard = useCallback(() => {
    setCardVisible(false);
    Animated.timing(readingsOp, { toValue: 1, duration: 500, delay: 180, useNativeDriver: true }).start();
  }, []);

  const finishTrans = useCallback(() => {
    if (tmr.current) { clearTimeout(tmr.current); tmr.current = null; }
    const n = (csRef.current + 1) % SYS.length;
    setCurSys(n); csRef.current = n;
    setSelIdx(null); setTrans(false); setShowImg(true); setCardVisible(false);
    readingsOp.setValue(0);
    wheelTopSpace.setValue(SH * 0.18);
    hasSelected.current = false;
    setVidSrc(pick());
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    wF.setValue(0); cF.setValue(0);
    Animated.timing(wF, { toValue: 1, duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start(() => {
      Animated.timing(cF, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  const trigLens = useCallback(() => {
    if (trans) return;
    onImpulse?.();
    Animated.timing(cF, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      Animated.timing(wF, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        setTrans(true);
        tmr.current = setTimeout(finishTrans, 4500);
      });
    });
  }, [trans, onImpulse, finishTrans]);

  if (!visible) return null;

  const wheels = data?.wheels || {}, readings = data?.readings || {};
  const sk = SYS[curSys];
  const sW = wheels[sk] || { nodes: [] };
  const sR = readings[sk] || {};
  const nodes = sW.nodes || [];
  const nd = selIdx !== null && nodes[selIdx] ? nodes[selIdx] : null;
  const nr = nd && sR[nd.id] ? sR[nd.id] : null;
  const hl = sR.headline || '';
  const isLast = curSys === SYS.length - 1;
  const R = WR[curSys], N = NSZ[curSys];
  const hasEffect = Boolean(nr && nr.effect);
  const hasDo = Boolean(nr && (nr.do?.length > 0 || nr.dont?.length > 0));
  const special = Boolean(nd && (nd.is_mulank || nd.is_bhagyank || nd.is_day_master));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[ms.bk, { opacity: fadeA }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[ms.sh, { transform: [{ translateY: sl }] }]}>
        <View {...hPan.panHandlers} style={ms.hW}><View style={ms.h} /></View>
        <TouchableOpacity style={ms.xB} onPress={close} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={ms.xT}>✕</Text>
        </TouchableOpacity>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false} scrollEnabled={!trans} onScroll={onScroll} scrollEventThrottle={60}>
          {trans ? (
            <View style={ms.vidWrap}>
              <MediaView uri={vidSrc} style={{ width: '100%', height: '100%' }} autoPlay onFinish={finishTrans} onFailed={finishTrans} />
            </View>
          ) : null}
          {!trans ? (
            <View>
              <Animated.View style={{ height: wheelTopSpace }} />
              {hasSelected.current ? <Text style={ms.sysLabel}>{SYS_L[curSys]}</Text> : null}
              <Animated.View style={{ opacity: wF }}>
                <Wheel nodes={nodes} radius={R} nodeSize={N} onSelect={onNodeSelect} sysIndex={curSys} sysName={sk} selectedIdx={selIdx} showImg={showImg} />
              </Animated.View>
              <Animated.View style={{ opacity: Animated.multiply(cF, readingsOp) }}>
                {hl ? <Text style={ms.hl}>{hl}</Text> : null}
                {nr ? (
                  <View style={{ paddingHorizontal: 28 }}>
                    <Reveal visible={true}><Text style={[ms.nT, special ? { color: GOLD } : null]}>{nr.title || nd.label}</Text></Reveal>
                    {hasEffect ? <Reveal visible={true} delay={100}><Text style={ms.nE}>{nr.effect}</Text></Reveal> : null}
                    {hasEffect ? <MediaSlot section='core' system={sk} slot={0} height={[150, 140, 160, 145, 155][curSys]} /> : null}
                    {hasDo ? (
                      <Reveal visible={true} delay={250}>
                        <View style={ms.vW}>
                          {nr.do?.length > 0 ? <View style={ms.vC}><Text style={ms.vL}>Do</Text>{nr.do.map((x, i) => <Text key={i} style={ms.vI}>{x}</Text>)}</View> : null}
                          {nr.dont?.length > 0 ? <View style={ms.vC}><Text style={ms.vL}>Don't</Text>{nr.dont.map((x, i) => <Text key={i} style={ms.vI}>{x}</Text>)}</View> : null}
                        </View>
                      </Reveal>
                    ) : null}
                  </View>
                ) : null}
                {nr && hasEffect && !isLast ? <View style={{ paddingHorizontal: 28, paddingTop: 8 }}><CTA text={'See through ' + SYS_L[(curSys + 1) % 5] + ' eyes'} onPress={trigLens} /></View> : null}
                {nr && hasEffect && isLast ? <View style={{ paddingHorizontal: 28 }}><View style={ms.clW}><View style={ms.clB} /><Text style={ms.clT}>{(readings.numerology || {}).closing || 'Every system sees the same you.'}</Text></View></View> : null}
              </Animated.View>
            </View>
          ) : null}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      <NodeCard
        visible={cardVisible}
        system={sk}
        nodeId={nd?.id}
        label={nd?.label}
        title={nr?.title || nd?.label}
        what={nr?.what}
        significance={nr?.significance}
        special={special}
        onDismiss={dismissCard}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  bk: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  sh: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SH * 0.95, backgroundColor: '#040404', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, borderColor: W(0.05) },
  hW: { alignItems: 'center', paddingTop: 10, paddingBottom: 8, zIndex: 20 },
  h: { width: 44, height: 5, borderRadius: 3, backgroundColor: W(0.45) },
  xB: { position: 'absolute', top: 14, right: 20, zIndex: 10 },
  xT: { fontSize: 18, color: W(0.2), fontWeight: '300' },
  sC: { paddingBottom: 40 },
  sysLabel: { fontSize: 9, letterSpacing: 4, color: W(0.15), fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4, marginTop: 8 },
  hl: { fontFamily: 'PlayfairDisplay', fontSize: 20, lineHeight: 30, color: W(0.85), textAlign: 'center', paddingHorizontal: 40, marginTop: 16, marginBottom: 8 },
  nT: { fontFamily: 'PlayfairDisplay', fontSize: 18, lineHeight: 26, color: W(0.88), marginBottom: 12, marginTop: 16 },
  nE: { fontSize: 14, lineHeight: 24, color: W(0.7), fontWeight: '300', fontStyle: 'italic', marginBottom: 16 },
  ctaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: W(0.1), paddingVertical: 20, paddingHorizontal: 24, marginVertical: 22 },
  ctaL: { fontFamily: 'PlayfairDisplay', fontSize: 16, lineHeight: 22, color: W(0.88), fontStyle: 'italic', flex: 1, marginRight: 14 },
  ctaA: { fontSize: 16, color: W(0.3), fontWeight: '200' },
  vW: { flexDirection: 'row', marginVertical: 12, gap: 40 },
  vC: { flex: 1 },
  vL: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: W(0.28), marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' },
  vI: { fontSize: 15, lineHeight: 26, color: W(0.78), fontWeight: '400', marginBottom: 6 },
  clW: { marginTop: 36, paddingTop: 28 },
  clB: { width: 24, height: 1, backgroundColor: GOLD, alignSelf: 'center', marginBottom: 24, opacity: 0.4 },
  clT: { fontFamily: 'PlayfairDisplay', fontSize: 17, lineHeight: 26, color: GOLD, textAlign: 'center', fontStyle: 'italic', opacity: 0.85 },
  vidWrap: { width: SW * 0.75, height: SW * 0.42, alignSelf: 'center', borderRadius: 8, overflow: 'hidden', marginTop: SH * 0.45 },

  cardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: SW * 0.86, height: SH * 0.62, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 24 },
  cardLabel: { position: 'absolute', top: 18, left: 18, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6 },
  cardLabelText: { fontSize: 9, letterSpacing: 3, color: W(0.85), fontWeight: '500' },
  cardX: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cardXT: { fontSize: 14, color: W(0.85), fontWeight: '300' },
  cardBody: { position: 'absolute', bottom: 28, left: 28, right: 28 },
  cardTitle: { fontFamily: 'PlayfairDisplay', fontSize: 32, lineHeight: 40, color: '#FFFFFF', marginBottom: 14 },
  cardWhat: { fontSize: 14, lineHeight: 23, color: W(0.88), fontWeight: '300', marginBottom: 12 },
  cardSig: { fontSize: 13, lineHeight: 22, color: W(0.65), fontWeight: '300' },
});