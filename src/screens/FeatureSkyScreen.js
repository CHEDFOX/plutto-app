import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing, ScrollView, Keyboard,
} from 'react-native';
import Svg, { Path, Circle, Line, Ellipse, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { getFeature } from '../api/backend';

const { width: SW, height: SH } = Dimensions.get('window');
const ITEM_SIZE = 100;
const ITEM_GAP = 28;
const SNAP = ITEM_SIZE + ITEM_GAP;
const SIDE_PAD = (SW - ITEM_SIZE) / 2;
const SZ = 56;

const BASE_FEATURES = [
  { id: 'daily-vibe', name: 'Vibe' },
  { id: 'power-hours', name: 'Hours' },
  { id: 'planet-strength', name: 'Strength' },
  { id: 'soul-profile', name: 'Soul' },
  { id: 'rare-traits', name: 'Traits' },
  { id: 'personal-deities', name: 'Deity' },
  { id: 'danger-radar', name: 'Shadow' },
  { id: 'year-map', name: 'Year' },
  { id: 'cosmic-novel', name: 'Story' },
  { id: 'money-calendar', name: 'Wealth' },
  { id: 'festivals', name: 'Sacred' },
  { id: 'ideal-partner', name: 'Bond' },
  { id: 'active-yogas', name: 'Yogas' },
  { id: 'health-map', name: 'Health' },
  { id: 'career-path', name: 'Career' },
  { id: 'eclipse-impact', name: 'Eclipse' },
  { id: 'nadi-reading', name: 'Nadi' },
  { id: 'weekly-forecast', name: 'Week' },
  { id: 'numerology', name: 'Numbers' },
  { id: 'vastu', name: 'Vastu' },
  { id: 'nakshatra-profile', name: 'Star' },
];
const COUNT = BASE_FEATURES.length;
const FEATURES = [...BASE_FEATURES, ...BASE_FEATURES, ...BASE_FEATURES];
const INITIAL_OFFSET = COUNT * SNAP;

// ─── Static icons (white, while scrolling) ───
const V = { width: SZ, height: SZ, viewBox: '0 0 56 56' };
const WC = 'rgba(255,255,255,0.4)';
function StaticIcon({ id }) {
  switch (id) {
    case 'daily-vibe': return <Svg {...V}><Line x1={8} y1={36} x2={48} y2={36} stroke={WC} strokeWidth={0.8}/><Circle cx={28} cy={22} r={8} stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    case 'power-hours': return <Svg {...V}><Path d="M8 40 A24 24 0 0 1 48 40" stroke={WC} strokeWidth={0.8} fill="none"/><Line x1={28} y1={40} x2={20} y2={16} stroke={WC} strokeWidth={0.8} strokeLinecap="round"/><Line x1={8} y1={40} x2={48} y2={40} stroke={WC} strokeWidth={0.4}/></Svg>;
    case 'planet-strength': return <Svg {...V}><Path d="M28 6L32 20L46 20L34 28L38 42L28 33L18 42L22 28L10 20L24 20Z" stroke={WC} strokeWidth={0.8} fill="none" strokeLinejoin="round"/></Svg>;
    case 'soul-profile': return <Svg {...V}><Path d="M34 8A20 20 0 1 0 34 48A14 14 0 1 1 34 8" stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    case 'rare-traits': return <Svg {...V}><Circle cx={14} cy={14} r={2} fill={WC}/><Circle cx={38} cy={10} r={2.5} fill={WC}/><Circle cx={44} cy={30} r={2} fill={WC}/><Circle cx={28} cy={42} r={2.2} fill={WC}/><Circle cx={12} cy={36} r={1.8} fill={WC}/><Line x1={14} y1={14} x2={38} y2={10} stroke={WC} strokeWidth={0.4}/><Line x1={38} y1={10} x2={44} y2={30} stroke={WC} strokeWidth={0.4}/><Line x1={44} y1={30} x2={28} y2={42} stroke={WC} strokeWidth={0.4}/><Line x1={28} y1={42} x2={12} y2={36} stroke={WC} strokeWidth={0.4}/><Line x1={12} y1={36} x2={14} y2={14} stroke={WC} strokeWidth={0.4}/></Svg>;
    case 'personal-deities': return <Svg {...V}><Ellipse cx={28} cy={42} rx={14} ry={6} stroke={WC} strokeWidth={0.8} fill="none"/><Path d="M18 42L22 30L28 28L34 30L38 42" stroke={WC} strokeWidth={0.8} fill="none"/><Path d="M28 28Q24 18 28 10Q32 18 28 28" stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    case 'danger-radar': return <Svg {...V}><Circle cx={24} cy={28} r={18} stroke={WC} strokeWidth={0.8} fill="none"/><Circle cx={34} cy={28} r={16} stroke={WC} strokeWidth={0.5} fill="none" opacity={0.4}/></Svg>;
    case 'year-map': return <Svg {...V}><Circle cx={28} cy={28} r={20} stroke={WC} strokeWidth={0.8} fill="none"/><Circle cx={28} cy={28} r={4} stroke={WC} strokeWidth={0.4} fill="none"/>{[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return<Line key={i} x1={28+Math.cos(a)*4} y1={28+Math.sin(a)*4} x2={28+Math.cos(a)*20} y2={28+Math.sin(a)*20} stroke={WC} strokeWidth={0.3}/>})}</Svg>;
    case 'cosmic-novel': return <Svg {...V}><Path d="M14 10L14 44Q14 48 18 48L42 48Q38 48 38 44L38 14Q38 10 34 10L14 10Z" stroke={WC} strokeWidth={0.8} fill="none"/><Line x1={20} y1={20} x2={32} y2={20} stroke={WC} strokeWidth={0.3} opacity={0.3}/><Line x1={20} y1={26} x2={32} y2={26} stroke={WC} strokeWidth={0.3} opacity={0.3}/></Svg>;
    case 'money-calendar': return <Svg {...V}><Circle cx={28} cy={28} r={20} stroke={WC} strokeWidth={0.8} fill="none"/><Circle cx={28} cy={28} r={15} stroke={WC} strokeWidth={0.3} fill="none" opacity={0.3}/></Svg>;
    case 'festivals': return <Svg {...V}><Path d="M20 36Q20 18 28 12Q36 18 36 36" stroke={WC} strokeWidth={0.8} fill="none"/><Line x1={16} y1={36} x2={40} y2={36} stroke={WC} strokeWidth={0.8} strokeLinecap="round"/><Circle cx={28} cy={7} r={2} stroke={WC} strokeWidth={0.5} fill="none"/><Line x1={28} y1={9} x2={28} y2={12} stroke={WC} strokeWidth={0.6}/></Svg>;
    case 'ideal-partner': return <Svg {...V}><Ellipse cx={28} cy={28} rx={22} ry={10} stroke={WC} strokeWidth={0.4} fill="none" opacity={0.3}/><Circle cx={14} cy={28} r={4} stroke={WC} strokeWidth={0.8} fill="none"/><Circle cx={42} cy={28} r={3.5} stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    case 'active-yogas': return <Svg {...V}><Path d="M28 8L28 48M18 14L38 42M38 14L18 42" stroke={WC} strokeWidth={0.6} fill="none" strokeLinecap="round"/><Circle cx={28} cy={28} r={10} stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    case 'health-map': return <Svg {...V}><Ellipse cx={28} cy={16} rx={6} ry={7} stroke={WC} strokeWidth={0.8} fill="none"/><Path d="M22 23L22 38Q22 44 28 44Q34 44 34 38L34 23" stroke={WC} strokeWidth={0.8} fill="none"/><Line x1={14} y1={28} x2={22} y2={28} stroke={WC} strokeWidth={0.6}/><Line x1={34} y1={28} x2={42} y2={28} stroke={WC} strokeWidth={0.6}/></Svg>;
    case 'career-path': return <Svg {...V}><Path d="M12 44L28 12L44 44" stroke={WC} strokeWidth={0.8} fill="none" strokeLinejoin="round"/><Line x1={18} y1={32} x2={38} y2={32} stroke={WC} strokeWidth={0.5}/><Circle cx={28} cy={12} r={3} stroke={WC} strokeWidth={0.6} fill="none"/></Svg>;
    case 'eclipse-impact': return <Svg {...V}><Circle cx={24} cy={28} r={14} stroke={WC} strokeWidth={0.8} fill="none"/><Circle cx={32} cy={28} r={14} stroke={WC} strokeWidth={0.5} fill="none" opacity={0.3}/></Svg>;
    case 'nadi-reading': return <Svg {...V}><Path d="M14 44Q14 28 28 28Q42 28 42 12" stroke={WC} strokeWidth={0.8} fill="none" strokeLinecap="round"/><Circle cx={14} cy={44} r={3} stroke={WC} strokeWidth={0.5} fill="none"/><Circle cx={42} cy={12} r={3} stroke={WC} strokeWidth={0.5} fill="none"/></Svg>;
    case 'weekly-forecast': return <Svg {...V}>{[0,1,2,3,4,5,6].map(i=><Line key={i} x1={10+i*5.5} y1={40-Math.sin(i*0.9+1)*14} x2={10+i*5.5} y2={42} stroke={WC} strokeWidth={i===3?1.2:0.6} strokeLinecap="round"/>)}</Svg>;
    case 'numerology': return <Svg {...V}><Circle cx={28} cy={28} r={18} stroke={WC} strokeWidth={0.8} fill="none"/><Path d="M28 10L28 18M28 38L28 46M10 28L18 28M38 28L46 28" stroke={WC} strokeWidth={0.4}/><Circle cx={28} cy={28} r={4} stroke={WC} strokeWidth={0.5} fill="none"/></Svg>;
    case 'vastu': return <Svg {...V}><Rect x={12} y={12} width={32} height={32} stroke={WC} strokeWidth={0.8} fill="none"/><Line x1={28} y1={12} x2={28} y2={44} stroke={WC} strokeWidth={0.3}/><Line x1={12} y1={28} x2={44} y2={28} stroke={WC} strokeWidth={0.3}/><Line x1={12} y1={12} x2={44} y2={44} stroke={WC} strokeWidth={0.3}/><Line x1={44} y1={12} x2={12} y2={44} stroke={WC} strokeWidth={0.3}/></Svg>;
    case 'nakshatra-profile': return <Svg {...V}><Path d="M28 8L32 20L46 20L35 28L38 42L28 34L18 42L21 28L10 20L24 20Z" stroke={WC} strokeWidth={0.6} fill="none" strokeLinejoin="round"/><Circle cx={28} cy={28} r={4} stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
    default: return <Svg {...V}><Circle cx={28} cy={28} r={20} stroke={WC} strokeWidth={0.8} fill="none"/></Svg>;
  }
}

// ─── Animated icons (gold, loop continuously) ───
const G = '#D4AF37';
const GD = 'rgba(212,175,55,0.3)';
const BOX = { width: SZ, height: SZ, justifyContent: 'center', alignItems: 'center' };

function AnimHorizon() {
  const y = useRef(new Animated.Value(8)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(y, { toValue: -8, duration: 2500, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.timing(y, { toValue: 8, duration: 2500, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
  ])).start(); }, []);
  return <View style={BOX}><View style={{ position:'absolute', top: 34, left: 6, right: 6, height: 0.8, backgroundColor: G }}/><Animated.View style={{ position:'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 0.8, borderColor: G, transform:[{translateY:y}] }}/></View>;
}
function AnimSundial() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(rot, { toValue: 1, duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.timing(rot, { toValue: 0, duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
  ])).start(); }, []);
  const r = rot.interpolate({ inputRange:[0,1], outputRange:['-60deg','60deg'] });
  return <View style={BOX}><View style={{ position:'absolute', bottom: 8, left: 6, right: 6, height: 0.5, backgroundColor: GD }}/><View style={{ position:'absolute', bottom: 8, width: SZ-12, height: SZ/2, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderWidth: 0.8, borderColor: G, borderBottomWidth: 0 }}/><Animated.View style={{ position:'absolute', bottom: 8, width: 0.8, height: 24, backgroundColor: G, transformOrigin: 'bottom', transform:[{rotate:r}] }}/></View>;
}
function AnimStar() {
  const s = useRef(new Animated.Value(0.6)).current;
  const o = useRef(new Animated.Value(0.3)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.parallel([Animated.timing(s,{toValue:1.2,duration:1500,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(o,{toValue:1,duration:1500,useNativeDriver:true})]),
    Animated.parallel([Animated.timing(s,{toValue:0.6,duration:1500,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(o,{toValue:0.3,duration:1500,useNativeDriver:true})]),
  ])).start(); }, []);
  return <View style={BOX}><Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: G, opacity: o, transform:[{scale:s}], shadowColor: G, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset:{width:0,height:0} }}/></View>;
}
function AnimMoon() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(x, { toValue: -(SZ+4), duration: 4000, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.delay(500),
    Animated.timing(x, { toValue: 0, duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.delay(500),
  ])).start(); }, []);
  return <View style={[BOX, { borderRadius: SZ/2, overflow:'hidden' }]}><View style={{ width: SZ*0.6, height: SZ*0.6, borderRadius: SZ*0.3, backgroundColor: G, opacity: 0.35 }}/><Animated.View style={{ position:'absolute', width: SZ, height: SZ, borderRadius: SZ/2, backgroundColor:'#030308', transform:[{translateX:x}] }}/></View>;
}
function AnimConstellation() {
  const dots = [[14,12],[38,8],[44,28],[28,40],[12,34]];
  const ops = useRef(dots.map(()=>new Animated.Value(0.2))).current;
  useEffect(() => { ops.forEach((o,i) => { Animated.loop(Animated.sequence([
    Animated.delay(i*300),
    Animated.timing(o, { toValue: 1, duration: 800, useNativeDriver: true }),
    Animated.timing(o, { toValue: 0.2, duration: 800, useNativeDriver: true }),
  ])).start(); }); }, []);
  return <View style={BOX}>{dots.map((d,i)=><Animated.View key={i} style={{ position:'absolute', left: d[0]-2, top: d[1]-2, width: 4, height: 4, borderRadius: 2, backgroundColor: G, opacity: ops[i] }}/>)}</View>;
}
function AnimDiya() {
  const fl = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(fl, { toValue: 0.5, duration: 250+Math.random()*200, useNativeDriver: true }),
    Animated.timing(fl, { toValue: 1, duration: 250+Math.random()*200, useNativeDriver: true }),
  ])).start(); }, []);
  return <View style={BOX}><View style={{ position:'absolute', bottom: 8, width: 28, height: 8, borderRadius: 4, borderWidth: 0.8, borderColor: G }}/><View style={{ position:'absolute', bottom: 14, width: 0.8, height: 16, backgroundColor: GD }}/><Animated.View style={{ position:'absolute', bottom: 28, width: 8, height: 14, borderRadius: 4, backgroundColor: G, opacity: fl, transform:[{scaleY:fl}], shadowColor: G, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset:{width:0,height:0} }}/></View>;
}
function AnimEclipse() {
  const x = useRef(new Animated.Value(-20)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(x, { toValue: 6, duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.timing(x, { toValue: 28, duration: 2500, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.delay(400),
    Animated.timing(x, { toValue: 6, duration: 2500, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.timing(x, { toValue: -20, duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.delay(800),
  ])).start(); }, []);
  return <View style={[BOX, { overflow:'hidden' }]}><View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 0.8, borderColor: G }}/><Animated.View style={{ position:'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor:'#030308', borderWidth: 0.5, borderColor: GD, transform:[{translateX:x}] }}/></View>;
}
function AnimWheel() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(rot, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const r = rot.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  return <View style={BOX}><Animated.View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 0.8, borderColor: G, justifyContent:'center', alignItems:'center', transform:[{rotate:r}] }}><View style={{ position:'absolute', width: 0.5, height: 40, backgroundColor: GD }}/><View style={{ position:'absolute', width: 40, height: 0.5, backgroundColor: GD }}/><View style={{ position:'absolute', width: 0.5, height: 40, backgroundColor: GD, transform:[{rotate:'45deg'}] }}/><View style={{ position:'absolute', width: 0.5, height: 40, backgroundColor: GD, transform:[{rotate:'135deg'}] }}/><View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 0.5, borderColor: G }}/></Animated.View></View>;
}
function AnimScroll() {
  const h = useRef(new Animated.Value(4)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(h, { toValue: 36, duration: 2000, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: false }),
    Animated.delay(1000),
    Animated.timing(h, { toValue: 4, duration: 1500, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: false }),
    Animated.delay(500),
  ])).start(); }, []);
  return <View style={BOX}><Animated.View style={{ width: 24, height: h, borderWidth: 0.8, borderColor: G, borderRadius: 2 }}><View style={{ marginTop: 5, marginLeft: 4, width: 10, height: 0.5, backgroundColor: GD }}/><View style={{ marginTop: 3, marginLeft: 4, width: 12, height: 0.5, backgroundColor: GD }}/></Animated.View></View>;
}
function AnimCoin() {
  const sx = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(sx, { toValue: 0.1, duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
    Animated.timing(sx, { toValue: 1, duration: 900, easing: Easing.bezier(0.42, 0, 0.58, 1), useNativeDriver: true }),
  ])).start(); }, []);
  return <View style={BOX}><Animated.View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 0.8, borderColor: G, transform:[{scaleX:sx}], justifyContent:'center', alignItems:'center' }}><View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 0.3, borderColor: GD }}/></Animated.View></View>;
}
function AnimBell() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(rot, { toValue: 1, duration: 800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.timing(rot, { toValue: -1, duration: 800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.timing(rot, { toValue: 0, duration: 600, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.delay(400),
  ])).start(); }, []);
  const r = rot.interpolate({ inputRange:[-1,0,1], outputRange:['-12deg','0deg','12deg'] });
  return <View style={BOX}><Animated.View style={{ alignItems:'center', transform:[{rotate:r}], transformOrigin:'top center' }}><View style={{ width: 4, height: 4, borderRadius: 2, borderWidth: 0.5, borderColor: G }}/><View style={{ width: 0.8, height: 6, backgroundColor: G }}/><View style={{ width: 24, height: 28, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 0.8, borderColor: G, borderTopWidth: 0, alignItems:'center', justifyContent:'flex-end', paddingBottom: 2 }}><View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: G, opacity: 0.4 }}/></View></Animated.View></View>;
}
function AnimOrbits() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(rot, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const r = rot.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  return <View style={BOX}><View style={{ width: 36, height: 18, borderRadius: 9, borderWidth: 0.4, borderColor: GD, position:'absolute' }}/><Animated.View style={{ width: 40, height: 40, position:'absolute', transform:[{rotate:r}] }}><View style={{ position:'absolute', top: 0, left: 16, width: 8, height: 8, borderRadius: 4, borderWidth: 0.8, borderColor: G }}/><View style={{ position:'absolute', bottom: 0, right: 16, width: 7, height: 7, borderRadius: 3.5, borderWidth: 0.8, borderColor: G }}/></Animated.View></View>;
}
function AnimYogas() {
  const s = useRef(new Animated.Value(0.7)).current;
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.parallel([Animated.timing(s,{toValue:1.15,duration:2000,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(r,{toValue:1,duration:4000,easing:Easing.linear,useNativeDriver:true})]),
    Animated.parallel([Animated.timing(s,{toValue:0.7,duration:2000,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true})]),
  ])).start(); }, []);
  const rot = r.interpolate({ inputRange:[0,1], outputRange:['0deg','120deg'] });
  return <View style={BOX}><Animated.View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 0.8, borderColor: G, transform:[{scale:s},{rotate:rot}], justifyContent:'center', alignItems:'center' }}><View style={{ position:'absolute', width: 0.5, height: 28, backgroundColor: GD }}/><View style={{ position:'absolute', width: 0.5, height: 28, backgroundColor: GD, transform:[{rotate:'60deg'}] }}/><View style={{ position:'absolute', width: 0.5, height: 28, backgroundColor: GD, transform:[{rotate:'120deg'}] }}/></Animated.View></View>;
}
function AnimPulseBody() {
  const op = useRef(new Animated.Value(0.3)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(op, { toValue: 1, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.timing(op, { toValue: 0.3, duration: 1200, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
  ])).start(); }, []);
  return <View style={BOX}><Animated.View style={{ width: 18, height: 28, borderRadius: 9, borderWidth: 0.8, borderColor: G, opacity: op }}/><View style={{ position:'absolute', top: 10, width: 12, height: 12, borderRadius: 6, borderWidth: 0.8, borderColor: G }}/></View>;
}
function AnimRise() {
  const y = useRef(new Animated.Value(16)).current;
  const op = useRef(new Animated.Value(0.2)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.parallel([Animated.timing(y,{toValue:-8,duration:2500,easing:Easing.bezier(0, 0, 0.2, 1),useNativeDriver:true}),Animated.timing(op,{toValue:1,duration:1500,useNativeDriver:true})]),
    Animated.delay(500),
    Animated.parallel([Animated.timing(y,{toValue:16,duration:2000,easing:Easing.bezier(0.4, 0, 1, 1),useNativeDriver:true}),Animated.timing(op,{toValue:0.2,duration:1500,useNativeDriver:true})]),
    Animated.delay(300),
  ])).start(); }, []);
  return <View style={BOX}><View style={{ position:'absolute', bottom: 12, left: 10, right: 10, height: 0.5, backgroundColor: GD }}/><Animated.View style={{ width: 12, height: 18, borderWidth: 0.8, borderColor: G, borderRadius: 2, opacity: op, transform:[{translateY:y}] }}/></View>;
}
function AnimEclipseImpact() {
  const s = useRef(new Animated.Value(1)).current;
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.parallel([Animated.timing(s,{toValue:1.6,duration:2000,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(o,{toValue:0,duration:2000,useNativeDriver:true})]),
    Animated.parallel([Animated.timing(s,{toValue:1,duration:10,useNativeDriver:true}),Animated.timing(o,{toValue:0.5,duration:10,useNativeDriver:true})]),
    Animated.delay(600),
  ])).start(); }, []);
  return <View style={BOX}><View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 0.8, borderColor: G }}/><Animated.View style={{ position:'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 0.8, borderColor: G, opacity: o, transform:[{scale:s}] }}/></View>;
}
function AnimNadi() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(x, { toValue: 1, duration: 3000, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
    Animated.timing(x, { toValue: 0, duration: 3000, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: true }),
  ])).start(); }, []);
  const tx = x.interpolate({ inputRange:[0,1], outputRange:[-6,6] });
  return <View style={BOX}><View style={{ width: 0.8, height: 36, backgroundColor: GD, position:'absolute' }}/><Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: G, opacity: 0.7, transform:[{translateX:tx}], shadowColor: G, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset:{width:0,height:0} }}/></View>;
}
function AnimWeekBars() {
  const vals = useRef([0,1,2,3,4,5,6].map(()=>new Animated.Value(6+Math.random()*18))).current;
  useEffect(() => { vals.forEach((v,i) => { Animated.loop(Animated.sequence([
    Animated.delay(i*150),
    Animated.timing(v, { toValue: 8+Math.random()*20, duration: 1500+Math.random()*1000, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
    Animated.timing(v, { toValue: 6+Math.random()*14, duration: 1500+Math.random()*1000, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
  ])).start(); }); }, []);
  return <View style={[BOX, { flexDirection:'row', gap: 3, alignItems:'flex-end', paddingBottom: 10 }]}>
    {vals.map((h,i)=><Animated.View key={i} style={{ width: 3, height: h, borderRadius: 1.5, backgroundColor: i===3?G:GD }}/>)}
  </View>;
}
function AnimGrid() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(rot, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const r = rot.interpolate({ inputRange:[0,1], outputRange:['0deg','90deg'] });
  return <View style={BOX}><Animated.View style={{ width: 32, height: 32, borderWidth: 0.8, borderColor: G, transform:[{rotate:r}] }}><View style={{ position:'absolute', width: 32, height: 0.3, top: 10, backgroundColor: GD }}/><View style={{ position:'absolute', width: 32, height: 0.3, top: 20, backgroundColor: GD }}/><View style={{ position:'absolute', height: 32, width: 0.3, left: 10, backgroundColor: GD }}/><View style={{ position:'absolute', height: 32, width: 0.3, left: 20, backgroundColor: GD }}/></Animated.View></View>;
}
function AnimStarPulse() {
  const s = useRef(new Animated.Value(0.8)).current;
  const o = useRef(new Animated.Value(0.4)).current;
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.parallel([Animated.timing(s,{toValue:1.2,duration:1800,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(o,{toValue:1,duration:1800,useNativeDriver:true}),Animated.timing(r,{toValue:1,duration:3600,easing:Easing.linear,useNativeDriver:true})]),
    Animated.parallel([Animated.timing(s,{toValue:0.8,duration:1800,easing:Easing.bezier(0.37, 0, 0.63, 1),useNativeDriver:true}),Animated.timing(o,{toValue:0.4,duration:1800,useNativeDriver:true})]),
  ])).start(); }, []);
  const rot = r.interpolate({ inputRange:[0,1], outputRange:['0deg','72deg'] });
  return <View style={BOX}><Animated.View style={{ opacity: o, transform:[{scale:s},{rotate:rot}] }}><Svg width={40} height={40} viewBox="0 0 40 40"><Path d="M20 4L23 15L34 15L25 21L28 32L20 26L12 32L15 21L6 15L17 15Z" stroke={G} strokeWidth={0.8} fill="none" strokeLinejoin="round"/></Svg></Animated.View></View>;
}
function AnimNumbers() {
  const op1 = useRef(new Animated.Value(1)).current;
  const op2 = useRef(new Animated.Value(0)).current;
  const op3 = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.delay(1200),
    Animated.parallel([Animated.timing(op1,{toValue:0,duration:400,useNativeDriver:true}),Animated.timing(op2,{toValue:1,duration:400,useNativeDriver:true})]),
    Animated.delay(1200),
    Animated.parallel([Animated.timing(op2,{toValue:0,duration:400,useNativeDriver:true}),Animated.timing(op3,{toValue:1,duration:400,useNativeDriver:true})]),
    Animated.delay(1200),
    Animated.parallel([Animated.timing(op3,{toValue:0,duration:400,useNativeDriver:true}),Animated.timing(op1,{toValue:1,duration:400,useNativeDriver:true})]),
  ])).start(); }, []);
  const ns = { position:'absolute', fontSize: 24, fontWeight:'200', color: G, fontStyle:'italic' };
  return <View style={BOX}>
    <Animated.Text style={[ns, { opacity: op1 }]}>9</Animated.Text>
    <Animated.Text style={[ns, { opacity: op2 }]}>7</Animated.Text>
    <Animated.Text style={[ns, { opacity: op3 }]}>3</Animated.Text>
  </View>;
}

const ANIM_MAP = {
  'daily-vibe': AnimHorizon, 'power-hours': AnimSundial, 'planet-strength': AnimStar,
  'soul-profile': AnimMoon, 'rare-traits': AnimConstellation, 'personal-deities': AnimDiya,
  'danger-radar': AnimEclipse, 'year-map': AnimWheel, 'cosmic-novel': AnimScroll,
  'money-calendar': AnimCoin, 'festivals': AnimBell, 'ideal-partner': AnimOrbits,
  'active-yogas': AnimYogas, 'health-map': AnimPulseBody, 'career-path': AnimRise,
  'eclipse-impact': AnimEclipseImpact, 'nadi-reading': AnimNadi, 'weekly-forecast': AnimWeekBars,
  'numerology': AnimNumbers, 'vastu': AnimGrid, 'nakshatra-profile': AnimStarPulse,
};
function ActiveIcon({ id }) { const C = ANIM_MAP[id]; return C ? <C /> : <StaticIcon id={id} />; }

// ─── Deep space ───
const DeepSpace = () => {
  const stars = useRef(Array.from({ length: 160 }, () => ({
    x: Math.random()*SW, y: Math.random()*SH, sz: 0.3+Math.random()*0.9, op: 0.08+Math.random()*0.3,
  }))).current;
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {stars.map((s,i)=><View key={i} style={{position:'absolute',left:s.x,top:s.y,width:s.sz,height:s.sz,borderRadius:s.sz,backgroundColor:'#fff',opacity:s.op}}/>)}
  </View>;
};

// ─── Main ───
export default function FeatureSkyScreen({ kundliData, language = 'en', onBack, isVisible }) {
  const [centerIdx, setCenterIdx] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const [settled, setSettled] = useState(false); // start blank
  const [hasSettledOnce, setHasSettledOnce] = useState(false);

  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const lastFid = useRef('');
  const isAdj = useRef(false);
  const timer = useRef(null);

  const anchorOp = useRef(new Animated.Value(0)).current;
  const lineOp = useRef(new Animated.Value(0)).current;
  const holdOp = useRef(new Animated.Value(0)).current;
  const guideOp = useRef(new Animated.Value(0)).current;
  const nameOp = useRef(new Animated.Value(0)).current;

  const resetAnims = () => { [anchorOp,lineOp,holdOp,guideOp,nameOp].forEach(a=>a.setValue(0)); };

  const playReveal = () => {
    Animated.parallel([
      Animated.timing(nameOp, { toValue:1, duration:500, delay:200, useNativeDriver:true }),
      Animated.timing(anchorOp, { toValue:1, duration:500, delay:100, easing:Easing.bezier(0, 0, 0.2, 1), useNativeDriver:true }),
      Animated.timing(lineOp, { toValue:1, duration:500, delay:400, easing:Easing.bezier(0, 0, 0.2, 1), useNativeDriver:true }),
      Animated.timing(holdOp, { toValue:1, duration:400, delay:650, easing:Easing.bezier(0, 0, 0.2, 1), useNativeDriver:true }),
      Animated.timing(guideOp, { toValue:1, duration:400, delay:850, easing:Easing.bezier(0, 0, 0.2, 1), useNativeDriver:true }),
    ]).start();
  };

  const handleScrollBegin = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSettled(false);
    resetAnims();
  }, []);

  const handleScrollEnd = useCallback((e) => {
    if (isAdj.current) return;
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SNAP);
    if (idx < COUNT*0.5 || idx >= COUNT*2.5) {
      isAdj.current = true;
      const ri = ((idx%COUNT)+COUNT)%COUNT;
      scrollRef.current?.scrollTo({ x:(COUNT+ri)*SNAP, animated:false });
      setTimeout(()=>{isAdj.current=false;},50);
    }
    setSettled(true);
    setHasSettledOnce(true);
    timer.current = setTimeout(playReveal, 200);
  }, []);

  const handleScroll = useCallback((e) => {
    const ri = ((Math.round(e.nativeEvent.contentOffset.x/SNAP)%COUNT)+COUNT)%COUNT;
    if (ri !== centerIdx) { setCenterIdx(ri); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
  }, [centerIdx]);

  useEffect(() => {
    const fid = BASE_FEATURES[centerIdx]?.id;
    if (!fid || fid === lastFid.current) return;
    lastFid.current = fid;
    setLoading(true); setData(null); setMathOpen(false);
    getFeature(fid, kundliData, language).then(r=>{const d=r?.data||r;if(d?.anchor)setData(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [centerIdx, kundliData]);

  // No auto-reveal on mount — starts blank
  useEffect(() => { return ()=>{if(timer.current)clearTimeout(timer.current);}; }, []);

  // When becoming visible again: clear content, auto-reveal after pause if user doesn't scroll
  useEffect(() => {
    if (isVisible) {
      resetAnims();
      setSettled(false);
      setHasSettledOnce(false);
      // Auto-reveal after 1.5s if user doesn't scroll
      timer.current = setTimeout(() => {
        setSettled(true);
        setHasSettledOnce(true);
        playReveal();
      }, 1500);
    } else {
      if (timer.current) clearTimeout(timer.current);
      resetAnims();
      setSettled(false);
      setHasSettledOnce(false);
    }
  }, [isVisible]);

  return (
    <View style={st.root}>
      <DeepSpace />

      {/* Full-screen horizontal scroll — swipe works from anywhere */}
      <Animated.ScrollView
        ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP} decelerationRate="fast"
        contentOffset={{x:INITIAL_OFFSET,y:0}}
        contentContainerStyle={{paddingHorizontal:SIDE_PAD, alignItems:'center'}}
        style={st.fullScroll}
        onScroll={Animated.event([{nativeEvent:{contentOffset:{x:scrollX}}}],{useNativeDriver:true,listener:handleScroll})}
        onScrollBeginDrag={handleScrollBegin} onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {FEATURES.map((item,index)=>{
          const inp=[(index-2)*SNAP,(index-1)*SNAP,index*SNAP,(index+1)*SNAP,(index+2)*SNAP];
          const scale=scrollX.interpolate({inputRange:inp,outputRange:[0.55,0.8,1.5,0.8,0.55],extrapolate:'clamp'});
          const iOp=scrollX.interpolate({inputRange:inp,outputRange:[0.25,0.5,1,0.5,0.25],extrapolate:'clamp'});
          const ri=index%COUNT;
          const isC=ri===centerIdx;
          return (
            <Animated.View key={index} style={[st.item,{transform:[{scale}],opacity:iOp}]}>
              {isC ? <ActiveIcon id={item.id}/> : <StaticIcon id={item.id}/>}
              {isC && settled ? <Animated.Text style={[st.label,st.labelG,{opacity:nameOp}]}>{item.name}</Animated.Text> : !isC ? <Text style={st.label}>{item.name}</Text> : null}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Content — only when settled */}
      {settled && hasSettledOnce && (
        <View style={st.contentWrap} pointerEvents="box-none">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.contentInner}>
            {loading?<View style={st.loadWrap}><View style={st.loadDot}/></View>:data?(
              <View style={st.reading}>
                <Animated.Text style={[st.anchor,{opacity:anchorOp}]}>{data.anchor}</Animated.Text>
                <Animated.Text style={[st.line,{opacity:lineOp}]}>{data.line}</Animated.Text>
                {data.hold?<Animated.Text style={[st.hold,{opacity:holdOp}]}>{data.hold}</Animated.Text>:null}
                {data.guide?<Animated.View style={[st.guideSep,{opacity:guideOp}]}><Text style={st.guide}>{data.guide}</Text></Animated.View>:null}
                {data.thread?.fragment?<Animated.Text style={[st.thread,{opacity:guideOp}]}>{data.thread.fragment}</Animated.Text>:null}
                {data.math&&Object.keys(data.math).length>0&&(
                  <Animated.View style={{opacity:guideOp,width:'100%'}}>
                    <View style={st.mathTap} onTouchEnd={()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);setMathOpen(!mathOpen);}}><View style={st.mathDot}/></View>
                    {mathOpen&&<View style={st.mathDrawer}>{Object.entries(data.math).map(([k,v])=>{if(v==null||v==='')return null;const val=typeof v==='object'?JSON.stringify(v).slice(0,55):String(v);return<View key={k} style={st.mathRow}><Text style={st.mathKey}>{k.replace(/_/g,' ')}</Text><Text style={st.mathVal}>{val}</Text></View>;})}</View>}
                  </Animated.View>
                )}
              </View>
            ):null}
            <View style={{height:100}}/>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:{flex:1,backgroundColor:'#030308'},
  fullScroll:{position:'absolute',top:0,left:0,right:0,height:SH*0.5},
  item:{width:ITEM_SIZE,marginRight:ITEM_GAP,alignItems:'center',justifyContent:'center',height:ITEM_SIZE+10},
  label:{color:'rgba(255,255,255,0.2)',fontSize:9,fontWeight:'300',fontStyle:'italic',letterSpacing:2,marginTop:10},
  labelG:{color:'#D4AF37',opacity:0.85},
  contentWrap:{position:'absolute',top:SH*0.42,left:0,right:0,bottom:0},
  contentInner:{paddingHorizontal:36,paddingTop:10},
  loadWrap:{alignItems:'center',paddingVertical:40},
  loadDot:{width:3,height:3,borderRadius:1.5,backgroundColor:'rgba(255,255,255,0.15)'},
  reading:{alignItems:'center'},
  anchor:{color:'#fff',fontSize:22,fontWeight:'200',fontStyle:'italic',letterSpacing:1.5,textAlign:'center',marginBottom:18,lineHeight:30},
  line:{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:'300',fontStyle:'italic',textAlign:'center',lineHeight:21,marginBottom:18,paddingHorizontal:8},
  hold:{color:'rgba(255,255,255,0.45)',fontSize:12,fontWeight:'400',fontStyle:'italic',letterSpacing:0.8,textAlign:'center',opacity:0.85},
  guideSep:{marginTop:22,paddingTop:18,borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'rgba(255,255,255,0.04)',width:'100%'},
  guide:{color:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:'300',fontStyle:'italic',textAlign:'center',lineHeight:18},
  thread:{color:'rgba(212,175,55,0.5)',fontSize:11,fontWeight:'300',fontStyle:'italic',letterSpacing:0.3,textAlign:'center',marginTop:38,lineHeight:17},
  mathTap:{padding:14,alignItems:'center'},
  mathDot:{width:3,height:3,borderRadius:1.5,backgroundColor:'rgba(255,255,255,0.1)'},
  mathDrawer:{width:'100%',paddingVertical:8,borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'rgba(255,255,255,0.03)'},
  mathRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:2},
  mathKey:{color:'rgba(255,255,255,0.2)',fontSize:8,fontWeight:'500',letterSpacing:0.5,textTransform:'uppercase',flex:1},
  mathVal:{color:'rgba(255,255,255,0.2)',fontSize:8,fontFamily:'monospace',flex:1,textAlign:'right'},
});