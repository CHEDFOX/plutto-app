import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  Animated, Easing, Dimensions, PanResponder,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.12)';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';
const MEDIA = 'https://api.plutto.space/static/readings/lifestory';

const WHEEL_SIZE = Math.min(SW * 0.85, 360);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 26;
const NODE_SIZE = 38;
const BOTTOM = Math.PI / 2;
const BOOK_SIZE = ORBIT_R * 0.9;
const CLIP_W = BOOK_SIZE * 0.7;
const CLIP_H = CLIP_W * (16 / 9);

const BOOK_STATIC = { uri: MEDIA + '/book_static.png' };
const BOOK_OPEN = { uri: MEDIA + '/book_open.png' };

function StaticLines({ count, selectedIndex }) {
  if (count < 3) return null;
  const lines = [], step = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    const j = (i + 2) % count, a1 = BOTTOM + i * step, a2 = BOTTOM + j * step, r = ORBIT_R - 10;
    const isSel = i === selectedIndex || j === selectedIndex;
    lines.push(<Line key={i} x1={WHEEL_R + r * Math.cos(a1)} y1={WHEEL_R + r * Math.sin(a1)} x2={WHEEL_R + r * Math.cos(a2)} y2={WHEEL_R + r * Math.sin(a2)} stroke={isSel ? GOLD : 'white'} strokeWidth={isSel ? 0.6 : 0.3} opacity={isSel ? 0.2 : 0.04} />);
  }
  return <>{lines}</>;
}

function TypewriterText({ text, style, speed = 55 }) {
  const [displayed, setDisplayed] = useState('');
  const words = text ? text.split(' ') : [];
  const idx = useRef(0);
  useEffect(() => { setDisplayed(''); idx.current = 0; if (!text) return;
    const t = setInterval(() => { idx.current++; if (idx.current <= words.length) setDisplayed(words.slice(0, idx.current).join(' ')); else clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <Text style={style}>{displayed}</Text>;
}

function TurningLoader() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const deg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (<View style={{width:36,height:36,alignItems:'center',justifyContent:'center',alignSelf:'center',marginVertical:30}}>
    <Animated.View style={{position:'absolute',width:36,height:36,alignItems:'center',transform:[{rotate:deg}]}}><View style={{width:1.5,height:10,borderRadius:1,backgroundColor:GOLD,opacity:0.4}}/></Animated.View>
    {[0.15,0.08,0.04].map((op,i)=>{const d=spin.interpolate({inputRange:[0,1],outputRange:[String(-(i+1)*25)+'deg',String(360-(i+1)*25)+'deg']});
      return <Animated.View key={i} style={{position:'absolute',width:36,height:36,alignItems:'center',transform:[{rotate:d}]}}><View style={{width:1.5,height:10,borderRadius:1,backgroundColor:GOLD,opacity:op}}/></Animated.View>;})}
  </View>);
}

export default function LifeStoryScreen({ visible, onClose, kundliData }) {
  const [chapters, setChapters] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [reading, setReading] = useState(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [bookPhase, setBookPhase] = useState('static');
  const everTapped = useRef(false);
  const clipBTimer = useRef(null);
  const pendingTap = useRef(null);
  const clipPlaying = useRef(false);

  var playerA = useVideoPlayer(MEDIA + '/clip_reading.mp4', function(p) { p.loop = false; p.muted = true; });
  var playerB = useVideoPlayer(MEDIA + '/clip_scroll.mp4', function(p) { p.loop = false; p.muted = true; });

  // ClipA end: if pending tap -> play clipB first; else show content + start 8s timer
  useEffect(function() { if (!playerA) return;
    var sub = playerA.addListener('playToEnd', function() { clipPlaying.current = false;
      if (pendingTap.current !== null) { playClipBAuto(); return; }
      setBookPhase('clipADone'); setShowContent(true);
      clipBTimer.current = setTimeout(function() { playClipBAuto(); }, 8000);
    }); return function() { sub.remove(); };
  }, [playerA]);

  // ClipB end: if pending tap -> process new chapter (plays clipA)
  useEffect(function() { if (!playerB) return;
    var sub = playerB.addListener('playToEnd', function() { clipPlaying.current = false; setBookPhase('clipBDone');
      if (pendingTap.current !== null) { var idx = pendingTap.current; pendingTap.current = null; processNewChapter(idx); }
    }); return function() { sub.remove(); };
  }, [playerB]);

  var playClipA = useCallback(function() { if (clipBTimer.current) { clearTimeout(clipBTimer.current); clipBTimer.current = null; }
    clipPlaying.current = true; setBookPhase('clipA'); if (playerA) { playerA.currentTime = 0; playerA.play(); }
  }, [playerA]);

  var playClipBAuto = useCallback(function() { if (clipBTimer.current) { clearTimeout(clipBTimer.current); clipBTimer.current = null; }
    clipPlaying.current = true; setBookPhase('clipB'); if (playerB) { playerB.currentTime = 0; playerB.play(); }
  }, [playerB]);

  var processNewChapter = useCallback(function(idx) { setSelectedIdx(idx); setShowContent(false); setReading(null); doSpin(); playClipA(); fetchChapterReading(idx + 1); }, [playClipA]);

  var wheelSpin = useRef(new Animated.Value(0)).current;
  var doSpin = useCallback(function() { var c = wheelSpin._value || 0;
    Animated.timing(wheelSpin, { toValue: c + (1 + Math.random() * 2) * 2 * Math.PI, duration: 1200 + Math.random() * 600, easing: Easing.bezier(0.2, 0, 0.1, 1), useNativeDriver: true }).start();
  }, []);
  var wheelDeg = wheelSpin.interpolate({ inputRange: [-100, 0, 100], outputRange: ['-18000deg', '0deg', '18000deg'] });
  var counterDeg = wheelSpin.interpolate({ inputRange: [-100, 0, 100], outputRange: ['18000deg', '0deg', '-18000deg'] });

  var slideAnim = useRef(new Animated.Value(SH)).current;
  var fadeAnim = useRef(new Animated.Value(0)).current;
  var sY = useRef(new Animated.Value(0)).current;
  var sS = useRef(0);
  var sPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: function() { return true; },
    onMoveShouldSetPanResponder: function() { return true; },
    onPanResponderGrant: function() { sY.stopAnimation(function(v) { sS.current = v; }); },
    onPanResponderMove: function(_, g) { if (sS.current + g.dy >= 0) sY.setValue(sS.current + g.dy); },
    onPanResponderRelease: function(_, g) {
      if (g.dy > 120 || g.vy > 0.5) Animated.timing(sY, { toValue: SH, duration: 300, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }).start(function() { sY.setValue(0); onClose(); });
      else Animated.spring(sY, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }).start();
    },
  })).current;

  useEffect(function() { if (visible) { setSelectedIdx(null); setReading(null); setShowContent(false); setBookPhase('static'); everTapped.current = false; pendingTap.current = null; clipPlaying.current = false;
    if (clipBTimer.current) clearTimeout(clipBTimer.current); sY.setValue(0); wheelSpin.setValue(0);
    fetchLifeStory(); Animated.parallel([Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }), Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })]).start();
  } else { if (clipBTimer.current) clearTimeout(clipBTimer.current); Animated.parallel([Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: true }), Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true })]).start(); } }, [visible]);

  var fetchLifeStory = useCallback(async function() { setLoadingStory(true); try { var r = await fetch(API_BASE + '/life-story', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }) }); setChapters((await r.json()).chapters || []); } catch (e) { console.log('err', e); } setLoadingStory(false); }, [kundliData]);

  var fetchChapterReading = useCallback(async function(ci) { setLoadingChapter(true); setReading(null); try { var r = await fetch(API_BASE + '/life-story/chapter', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapter_index: ci, kundli_data: kundliData || { raw: { birth_details: { year: 1976, month: 7, day: 28, hour: 9, minute: 30, latitude: 25.35, longitude: 74.64 } } } }) }); setReading(await r.json()); } catch (e) { console.log('err', e); } setLoadingChapter(false); }, [kundliData]);

  var handleTap = useCallback(function(idx) {
    if (clipBTimer.current) { clearTimeout(clipBTimer.current); clipBTimer.current = null; }
    // First ever tap: show open image briefly, then play clipA
    if (!everTapped.current) { everTapped.current = true; setBookPhase('open'); setTimeout(function() { processNewChapter(idx); }, 700); return; }
    // Clip playing: queue tap, hide content
    if (clipPlaying.current) { pendingTap.current = idx; setShowContent(false); setReading(null); return; }
    // Content showing (clipA done): play clipB first, queue new chapter
    if (bookPhase === 'clipADone') { pendingTap.current = idx; setShowContent(false); setReading(null); playClipBAuto(); return; }
    // ClipB already done: go straight to new chapter (clipA)
    processNewChapter(idx);
  }, [bookPhase, processNewChapter, playClipBAuto]);

  if (!visible) return null;
  var sel = selectedIdx !== null ? chapters[selectedIdx] : null;
  var C = chapters.length || 1;
  var ST = (2 * Math.PI) / C;
  var clipATop = bookPhase === 'clipA' || bookPhase === 'clipADone';
  var showImg = bookPhase === 'static' || bookPhase === 'open';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.bg, { opacity: fadeAnim }]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} /></Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: Animated.add(slideAnim, sY) }] }]}>
        <View {...sPan.panHandlers} style={s.hZone}><View style={s.handle} /></View>
        <TouchableOpacity style={s.xBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}><Text style={s.xT}>+</Text></TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sc} bounces={false}>

          {loadingStory ? <TurningLoader /> : chapters.length > 0 ? (
            <View style={[wh.wrap, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R + NODE_SIZE / 2} stroke="white" strokeWidth={0.4} fill="none" opacity={0.04} />
                <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R - NODE_SIZE / 2} stroke="white" strokeWidth={0.3} fill="none" opacity={0.03} strokeDasharray="3,8" />
              </Svg>

              <View style={wh.bookC} pointerEvents="none">
                <View style={wh.bookClip}>
                  <VideoView player={playerB} style={[wh.m, wh.ms, { zIndex: clipATop ? 1 : 2 }]} contentFit="cover" nativeControls={false} />
                  <VideoView player={playerA} style={[wh.m, wh.ms, { zIndex: clipATop ? 2 : 1 }]} contentFit="cover" nativeControls={false} />
                  {showImg && <Image source={bookPhase === 'static' ? BOOK_STATIC : BOOK_OPEN} style={[wh.m, wh.ms, { zIndex: 3 }]} resizeMode="cover" />}
                </View>
              </View>

              <Animated.View style={[wh.rot, { transform: [{ rotate: wheelDeg }] }]} pointerEvents="box-none">
                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill} pointerEvents="none"><StaticLines count={C} selectedIndex={selectedIdx} /></Svg>
                {chapters.map(function(ch, i) { var a = BOTTOM + i * ST, x = WHEEL_R + ORBIT_R * Math.cos(a) - NODE_SIZE / 2, y = WHEEL_R + ORBIT_R * Math.sin(a) - NODE_SIZE / 2, is = i === selectedIdx;
                  return (<TouchableOpacity key={ch.index} activeOpacity={0.7} onPress={function() { handleTap(i); }} style={[wh.node, { left: x, top: y, borderColor: is ? ch.color : W(0.06), borderWidth: is ? 1.5 : 0.5, backgroundColor: is ? ch.color + '18' : 'transparent' }]}>
                    <Animated.View style={{ transform: [{ rotate: counterDeg }], alignItems: 'center' }}><Text style={[wh.nN, is && { color: ch.color, fontSize: 13 }]}>{ch.index}</Text><Text style={[wh.nL, is && { color: W(0.6) }]} numberOfLines={1}>{ch.lord}</Text></Animated.View>
                  </TouchableOpacity>); })}
              </Animated.View>
            </View>
          ) : null}

          {sel ? (<View style={rs.c}>{showContent ? (<>
            <View style={rs.h}><View style={[rs.bd,{backgroundColor:sel.color+'20',borderColor:sel.color+'40'}]}><Text style={[rs.bt,{color:sel.color}]}>Ch {sel.index}</Text></View>
              <View style={rs.ht}><Text style={[rs.ct,{color:sel.color}]}>{sel.title}</Text><Text style={rs.ca}>Age {sel.start_age} - {sel.end_age} | {sel.duration_years}y | {sel.lord}</Text></View></View>
            <View style={[rs.st,sel.status==='current'&&rs.stC,sel.status==='past'&&rs.stP]}><Text style={rs.stT}>{sel.status==='current'?'YOU ARE HERE':sel.status==='past'?'COMPLETED':'AHEAD'}</Text></View>
            <View style={rs.tb}><Text style={rs.tl}>THEME</Text><Text style={rs.tt}>{sel.theme}</Text><View style={rs.dv}/><Text style={rs.tl}>CORE LESSON</Text><Text style={rs.lt}>{sel.lesson}</Text></View>
            {loadingChapter?<TurningLoader/>:reading&&reading.reading?<TypewriterText text={reading.reading} style={rs.rt} speed={55}/>:sel.deep_description?<TypewriterText text={sel.deep_description} style={rs.rt} speed={55}/>:null}
            <View style={rs.yb}><Text style={rs.yl}>{sel.start_year}</Text><View style={rs.yln}>{sel.status==='current'&&<View style={[rs.yp,{width:Math.min(100,Math.max(5,((new Date().getFullYear()-sel.start_year)/(sel.end_year-sel.start_year))*100))+'%'}]}/>}</View><Text style={rs.yl}>{sel.end_year}</Text></View>
          </>) : <TurningLoader />}</View>
          ) : (<View style={rs.c}><View style={rs.em}><Text style={rs.et}>Tap a chapter to begin</Text></View></View>)}
          <View style={{height:60}}/>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const wh=StyleSheet.create({
  wrap:{alignSelf:'center',marginTop:16,marginBottom:8},
  rot:{position:'absolute',top:0,left:0,width:WHEEL_SIZE,height:WHEEL_SIZE},
  node:{position:'absolute',width:NODE_SIZE,height:NODE_SIZE,borderRadius:NODE_SIZE/2,alignItems:'center',justifyContent:'center'},
  nN:{fontSize:11,fontWeight:'500',color:W(0.4)},nL:{fontSize:6.5,color:W(0.2),marginTop:1},
  bookC:{position:'absolute',top:WHEEL_R-BOOK_SIZE*0.45,left:WHEEL_R-CLIP_W/2,zIndex:0},
  bookClip:{width:CLIP_W,height:CLIP_H,borderRadius:6,overflow:'hidden',backgroundColor:'#000'},
  m:{width:CLIP_W,height:CLIP_H+30,position:'absolute',left:0},ms:{top:-15},
});

const rs=StyleSheet.create({
  c:{paddingHorizontal:24,paddingTop:20,minHeight:200},
  em:{alignItems:'center',paddingTop:20},et:{fontSize:13,color:W(0.12),letterSpacing:1.5,fontWeight:'300'},
  h:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:14},
  bd:{width:44,height:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center'},bt:{fontSize:12,fontWeight:'600'},ht:{flex:1},
  ct:{fontFamily:'PlayfairDisplay',fontSize:22},ca:{fontSize:12,color:W(0.3),marginTop:4,fontWeight:'300'},
  st:{alignSelf:'flex-start',borderWidth:0.5,borderColor:W(0.08),borderRadius:6,paddingHorizontal:10,paddingVertical:5,marginBottom:18},
  stC:{borderColor:GOLD_DIM,backgroundColor:'rgba(212,175,55,0.04)'},stP:{borderColor:W(0.06),backgroundColor:W(0.01)},
  stT:{fontSize:9,color:W(0.3),letterSpacing:2,fontWeight:'500'},
  tb:{borderWidth:0.5,borderColor:W(0.04),borderRadius:12,padding:18,marginBottom:20,backgroundColor:W(0.008)},
  tl:{fontSize:8,color:W(0.12),letterSpacing:2.5,fontWeight:'600',marginBottom:6},
  tt:{fontSize:14,color:W(0.55),lineHeight:22,fontWeight:'300'},dv:{height:0.5,backgroundColor:W(0.04),marginVertical:14},
  lt:{fontSize:14,color:GOLD,lineHeight:22,fontWeight:'300',fontStyle:'italic'},
  rt:{fontSize:15,color:W(0.75),lineHeight:25,fontWeight:'300',marginBottom:22},
  yb:{flexDirection:'row',alignItems:'center',gap:10,paddingTop:12,borderTopWidth:0.5,borderTopColor:W(0.04)},
  yl:{fontSize:11,color:W(0.2)},yln:{flex:1,height:2,backgroundColor:W(0.04),borderRadius:1,overflow:'hidden'},
  yp:{height:'100%',backgroundColor:GOLD,borderRadius:1,opacity:0.5},
});

const s=StyleSheet.create({
  bg:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.8)'},
  sheet:{position:'absolute',bottom:0,left:0,right:0,height:SH*0.92,backgroundColor:'#060606',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:0.5,borderColor:W(0.06)},
  hZone:{alignItems:'center',paddingTop:8,paddingBottom:8,zIndex:20},handle:{width:40,height:4,borderRadius:2,backgroundColor:W(0.15)},
  xBtn:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(0.25),fontWeight:'300',transform:[{rotate:'45deg'}]},
  sc:{paddingTop:12,paddingBottom:40},
});
