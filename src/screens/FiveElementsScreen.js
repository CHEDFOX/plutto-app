/**
 * FIVE ELEMENTS WHEEL — Vedic-style smooth rotation + progressive disclosure.
 * Selected element grows. Pendulum swing kept.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const ELEMENTS = [
  { id: 'Wood',  glyph: '木', color: '#4A8C5C' },
  { id: 'Fire',  glyph: '火', color: '#CC4444' },
  { id: 'Earth', glyph: '土', color: '#B8860B' },
  { id: 'Metal', glyph: '金', color: '#A0A0A0' },
  { id: 'Water', glyph: '水', color: '#3366AA' },
];

const COUNT = 5;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM = Math.PI / 2;
const WHEEL_SIZE = Math.min(SW * 0.82, 340);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 32;
const NS = 52;
const NS_SEL = 68;

function RevealCTA({ text, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={cs.ctaTouch}>
      <View style={cs.ctaBox}><Text style={cs.ctaText}>{text}</Text><Text style={cs.ctaArrow}>→</Text></View>
    </TouchableOpacity>
  );
}

export default function FiveElementsScreen({ visible, onClose, kundliData }) {
  const [elementsData, setElementsData] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [dmElement, setDmElement] = useState('');
  const [yongShen, setYongShen] = useState('');
  const [revealLevel, setRevealLevel] = useState(0);

  // Vedic-style rotation
  const rot = useRef(0);
  const [rotVal, setRotVal] = useState(0);
  const lastAng = useRef(0);
  const vel = useRef(0);

  // Pendulum for selected
  const pendulum = useRef(new Animated.Value(0)).current;
  const [pendulumVal, setPendulumVal] = useState(0);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pendulum swing
  useEffect(() => {
    if (hasSpun) {
      const swing = Animated.loop(Animated.sequence([
        Animated.timing(pendulum, { toValue: 1, duration: 1800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
        Animated.timing(pendulum, { toValue: -1, duration: 1800, easing: Easing.bezier(0.37, 0, 0.63, 1), useNativeDriver: false }),
      ]));
      swing.start();
      const lid = pendulum.addListener(({ value }) => setPendulumVal(value));
      return () => { swing.stop(); pendulum.removeListener(lid); };
    }
  }, [hasSpun, selectedIdx]);

  useEffect(() => {
    if (visible) {
      setElementsData([]);setReading(null);setHasSpun(false);setSelectedIdx(0);setRevealLevel(0);
      rot.current=0;setRotVal(0);
      fetchElements();
      Animated.parallel([
        Animated.spring(slideAnim,{toValue:0,tension:65,friction:11,useNativeDriver:true}),
        Animated.timing(fadeAnim,{toValue:1,duration:300,useNativeDriver:true}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,{toValue:SH,duration:250,easing:Easing.bezier(0.4,0,1,1),useNativeDriver:true}),
        Animated.timing(fadeAnim,{toValue:0,duration:200,useNativeDriver:true}),
      ]).start();
    }
  }, [visible]);

  const fetchElements = useCallback(async () => {
    setLoadingAll(true);
    try {
      const r = await fetch(`${API_BASE}/five-elements`, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ kundli_data: kundliData || { raw: { birth_details: { year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64 }}}})});
      const data = await r.json();
      setElementsData(data.elements || []);
      setDmElement(data.day_master || '');
      setYongShen(data.yong_shen || '');
    } catch(e) { console.log('Five elements err:', e); }
    setLoadingAll(false);
  }, [kundliData]);

  const fetchReading = useCallback(async (elemName) => {
    setLoading(true);setReading(null);setRevealLevel(0);
    try {
      const r = await fetch(`${API_BASE}/five-elements/read`, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ element: elemName, kundli_data: kundliData || { raw: { birth_details: { year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64 }}}})});
      setReading(await r.json());
    } catch(e) { console.log('Element read err:', e); }
    setLoading(false);
  }, [kundliData]);

  const animateTo = useCallback((idx) => {
    const target=-idx*ANGLE_STEP, diff=target-rot.current;
    const snap=rot.current+diff-Math.round(diff/(2*Math.PI))*2*Math.PI;
    const start=rot.current, delta=snap-start;
    let step=0;
    const anim=()=>{step++;const t=Math.min(step/18,1);rot.current=start+delta*(1-Math.pow(1-t,3));setRotVal(rot.current);
      if(t<1)requestAnimationFrame(anim);
      else{rot.current=snap;setRotVal(snap);setSelectedIdx(idx);setHasSpun(true);
        fetchReading(ELEMENTS[idx].id);}};
    requestAnimationFrame(anim);
  },[fetchReading]);

  const snapToNearest = useCallback((r)=>{
    const norm=((r%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
    let ci=0,cd=Infinity;
    for(let i=0;i<COUNT;i++){const pa=((BOTTOM+i*ANGLE_STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);const d=Math.min(Math.abs(pa-BOTTOM),2*Math.PI-Math.abs(pa-BOTTOM));if(d<cd){cd=d;ci=i;}}
    animateTo(ci);
  },[animateTo]);

  const wasDrag=useRef(false);
  const pan=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:(e)=>{lastAng.current=Math.atan2(e.nativeEvent.locationY-WHEEL_R,e.nativeEvent.locationX-WHEEL_R);vel.current=0;wasDrag.current=false;},
    onPanResponderMove:(e)=>{wasDrag.current=true;const a=Math.atan2(e.nativeEvent.locationY-WHEEL_R,e.nativeEvent.locationX-WHEEL_R);
      let d=a-lastAng.current;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;vel.current=d;rot.current+=d;setRotVal(rot.current);lastAng.current=a;},
    onPanResponderRelease:(e)=>{if(!wasDrag.current){
      let best=-1,bd=Infinity;for(let i=0;i<COUNT;i++){const a=BOTTOM+i*ANGLE_STEP+rot.current;const px=WHEEL_R+ORBIT_R*Math.cos(a);const py=WHEEL_R+ORBIT_R*Math.sin(a);
        const d=Math.sqrt((e.nativeEvent.locationX-px)**2+(e.nativeEvent.locationY-py)**2);if(d<bd){bd=d;best=i;}}
      if(bd<NS*1.2&&best>=0)animateTo(best);return;}
      const v=vel.current;if(Math.abs(v)>0.02){const target=rot.current+v*12,start=rot.current,delta=target-start;let step=0;
        const decay=()=>{step++;const t=Math.min(step/20,1);rot.current=start+delta*(1-Math.pow(1-t,2));setRotVal(rot.current);if(t<1)requestAnimationFrame(decay);else snapToNearest(rot.current);};
        requestAnimationFrame(decay);}else snapToNearest(rot.current);},
  })).current;

  const reveal = useCallback(() => {
    LayoutAnimation.configureNext({duration:400,create:{type:LayoutAnimation.Types.easeInEaseOut,property:LayoutAnimation.Properties.opacity},update:{type:LayoutAnimation.Types.easeInEaseOut}});
    setRevealLevel(prev=>prev+1);
  }, []);

  if (!visible) return null;
  const selected = ELEMENTS[selectedIdx];
  const selData = reading?.element_data || elementsData.find(e => e.element === selected?.id) || {};

  // Production cycle lines (from rotVal state)
  const cycleLines = ELEMENTS.map((_,i) => {
    const a1=BOTTOM+i*ANGLE_STEP+rotVal, a2=BOTTOM+((i+1)%COUNT)*ANGLE_STEP+rotVal;
    return <Line key={i} x1={WHEEL_R+(ORBIT_R-12)*Math.cos(a1)} y1={WHEEL_R+(ORBIT_R-12)*Math.sin(a1)} x2={WHEEL_R+(ORBIT_R-12)*Math.cos(a2)} y2={WHEEL_R+(ORBIT_R-12)*Math.sin(a2)} stroke={W(0.04)} strokeWidth={0.6} strokeDasharray="4,8"/>;
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop,{opacity:fadeAnim}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
      <Animated.View style={[s.sheet,{transform:[{translateY:slideAnim}]}]}>
        <View style={s.handleWrap}><View style={s.handle}/></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={s.closeText}>✕</Text></TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} bounces={false}>
          {dmElement?<Text style={s.subtitle}>Day Master: {dmElement} · Medicine: {yongShen}</Text>:null}

          {loadingAll?(
            <View style={s.loadCenter}><ActivityIndicator color={GOLD} size="small"/></View>
          ):(
            <>
              {/* Wheel */}
              <View style={[es.wheelWrap,{width:WHEEL_SIZE,height:WHEEL_SIZE}]}>
                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill}>
                  <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R+NS/2+4} stroke={W(0.04)} strokeWidth={0.5} fill="none"/>
                  <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R*0.35} stroke={W(0.02)} strokeWidth={0.3} fill="none"/>
                  <Circle cx={WHEEL_R} cy={WHEEL_R} r={3} fill={W(0.06)}/>
                  {cycleLines}
                </Svg>
                <View style={es.indicator}><View style={es.indicatorDot}/></View>

                {ELEMENTS.map((e,i)=>{
                  const a=BOTTOM+i*ANGLE_STEP+rotVal;
                  const isSel=i===selectedIdx&&hasSpun;
                  const size=isSel?NS_SEL:NS;
                  const x=WHEEL_R+ORBIT_R*Math.cos(a)-size/2,y=WHEEL_R+ORBIT_R*Math.sin(a)-size/2;
                  const dist=Math.abs(a-BOTTOM),nd=Math.min(dist,2*Math.PI-dist);
                  const op=isSel?1:0.3+0.4*(1-nd/Math.PI);
                  const pendRot=isSel?`${pendulumVal*8}deg`:'0deg';
                  return(<View key={e.id} style={[es.node,{left:x,top:y,width:size,height:size,borderRadius:size/2,opacity:op,
                    borderColor:isSel?e.color:W(0.06),borderWidth:isSel?2:0.5,backgroundColor:isSel?`${e.color}18`:W(0.01),
                    transform:[{rotate:pendRot}]}]}>
                    <Text style={[es.glyph,{color:isSel?e.color:W(0.35),fontSize:isSel?28:18}]}>{e.glyph}</Text>
                    <Text style={[es.label,{color:isSel?W(0.7):W(0.15)}]}>{e.id}</Text>
                  </View>);
                })}
                <View {...pan.panHandlers} style={[es.touchZone,{width:WHEEL_SIZE,height:WHEEL_SIZE}]}/>
              </View>

              {/* Reading — Progressive */}
              <View style={rs.container}>
                {!hasSpun?(
                  <Text style={rs.emptyText}>Spin the wheel to explore an element</Text>
                ):loading?(
                  <View style={rs.loadWrap}><ActivityIndicator color={selected.color} size="small"/><Text style={rs.loadText}>Reading {selected.id}...</Text></View>
                ):(
                  <>
                    {/* Header */}
                    <View style={rs.header}>
                      <Text style={[rs.headerGlyph,{color:selected.color}]}>{selected.glyph}</Text>
                      <View style={rs.headerInfo}>
                        <Text style={[rs.elemName,{color:selected.color}]}>{selected.id}</Text>
                        <Text style={rs.archetype}>{selData.archetype}</Text>
                        <Text style={rs.meta}>{selData.season} · {selData.direction} · {selData.organ}</Text>
                      </View>
                    </View>

                    {/* Bar */}
                    <View style={rs.barWrap}>
                      <View style={[rs.bar,{width:`${Math.max(5,selData.percentage||0)}%`,backgroundColor:selected.color}]}/>
                      <Text style={rs.barLabel}>{selData.percentage||0}% in your chart</Text>
                    </View>

                    {/* STAGE 1: Badges */}
                    <View style={rs.badges}>
                      <View style={[rs.badge,{borderColor:`${selected.color}40`}]}><Text style={[rs.badgeText,{color:selected.color}]}>{selData.relation}</Text></View>
                      <View style={[rs.badge,
                        selData.is_yong_shen&&{borderColor:`${GOLD}50`,backgroundColor:`${GOLD}08`},
                        selData.is_ji_shen&&{borderColor:'#CC444440',backgroundColor:'#CC444408'},
                      ]}><Text style={[rs.badgeText,
                        selData.is_yong_shen&&{color:GOLD},
                        selData.is_ji_shen&&{color:'#CC4444'},
                      ]}>{selData.need}</Text></View>
                      {selData.is_yong_shen&&<View style={[rs.badge,{borderColor:`${GOLD}40`}]}><Text style={[rs.badgeText,{color:GOLD}]}>★ medicine</Text></View>}
                    </View>

                    {revealLevel===0&&reading?.reading&&<RevealCTA text="What this element means for you" onPress={reveal}/>}

                    {/* STAGE 2: Reading */}
                    {revealLevel>=1&&reading?.reading&&<Text style={rs.readingText}>{reading.reading}</Text>}

                    {revealLevel===1&&<RevealCTA text="The cycle and remedies" onPress={reveal}/>}

                    {/* STAGE 3: Cycle + Remedy */}
                    {revealLevel>=2&&(
                      <>
                        <View style={rs.cycleRow}>
                          <Text style={rs.cycleText}>generates {selData.generates}</Text>
                          <Text style={rs.cycleDot}>·</Text>
                          <Text style={rs.cycleText}>controls {selData.controls}</Text>
                          <Text style={rs.cycleDot}>·</Text>
                          <Text style={rs.cycleText}>fed by {selData.generated_by}</Text>
                        </View>
                        {selData.remedy&&(
                          <View style={rs.remedyBox}>
                            <Text style={rs.remedyLabel}>{selData.need==='need more'||selData.need==='lacking'?'TO INCREASE':'TO BALANCE'}</Text>
                            <Text style={rs.remedyText}>{selData.remedy}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            </>
          )}
          <View style={{height:60}}/>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const cs=StyleSheet.create({
  ctaTouch:{marginVertical:20},
  ctaBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(0.10),paddingVertical:18,paddingHorizontal:22},
  ctaText:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(0.85),fontStyle:'italic',flex:1,marginRight:14},
  ctaArrow:{fontSize:16,color:W(0.3),fontWeight:'200'},
});
const es=StyleSheet.create({
  wheelWrap:{alignSelf:'center',marginTop:16,marginBottom:8},
  touchZone:{position:'absolute',top:0,left:0,zIndex:5},
  node:{position:'absolute',alignItems:'center',justifyContent:'center'},
  glyph:{fontWeight:'300'},
  label:{fontSize:8,marginTop:2,letterSpacing:0.5,fontWeight:'400'},
  indicator:{position:'absolute',bottom:-14,left:WHEEL_R-5,alignItems:'center',zIndex:10},
  indicatorDot:{width:10,height:10,borderRadius:5,backgroundColor:GOLD,opacity:0.4},
});
const rs=StyleSheet.create({
  container:{paddingHorizontal:24,paddingTop:24,minHeight:200},
  emptyText:{fontSize:13,color:W(0.12),letterSpacing:1.5,fontWeight:'300',textAlign:'center',marginTop:30},
  loadWrap:{alignItems:'center',paddingTop:30,gap:14},
  loadText:{fontSize:11,color:W(0.18),letterSpacing:1.5,fontWeight:'300'},
  header:{flexDirection:'row',alignItems:'center',gap:16,marginBottom:16},
  headerGlyph:{fontSize:44,fontWeight:'200'},
  headerInfo:{flex:1},
  elemName:{fontFamily:'PlayfairDisplay',fontSize:26,letterSpacing:0.5},
  archetype:{fontSize:12,color:W(0.25),marginTop:3,fontWeight:'300',letterSpacing:1},
  meta:{fontSize:11,color:W(0.15),marginTop:3,fontWeight:'300'},
  barWrap:{height:20,borderRadius:10,backgroundColor:W(0.02),marginBottom:16,justifyContent:'center',overflow:'hidden'},
  bar:{position:'absolute',left:0,top:0,bottom:0,borderRadius:10,opacity:0.3},
  barLabel:{fontSize:10,color:W(0.3),textAlign:'center',letterSpacing:0.5,fontWeight:'400'},
  badges:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18},
  badge:{borderWidth:0.5,borderColor:W(0.08),borderRadius:6,paddingHorizontal:10,paddingVertical:5},
  badgeText:{fontSize:11,color:W(0.4),fontWeight:'400',letterSpacing:0.3},
  readingText:{fontSize:15,color:W(0.7),lineHeight:25,fontWeight:'300',marginBottom:20},
  cycleRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:18,flexWrap:'wrap'},
  cycleText:{fontSize:11,color:W(0.2),fontWeight:'300',letterSpacing:0.3},
  cycleDot:{fontSize:11,color:W(0.08)},
  remedyBox:{borderWidth:0.5,borderColor:W(0.04),borderRadius:10,padding:16,backgroundColor:W(0.008)},
  remedyLabel:{fontSize:8,color:W(0.1),letterSpacing:3,fontWeight:'600',marginBottom:8},
  remedyText:{fontSize:13,color:W(0.5),lineHeight:21,fontWeight:'300'},
});
const s=StyleSheet.create({
  backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.8)'},
  sheet:{position:'absolute',bottom:0,left:0,right:0,height:SH*0.92,backgroundColor:'#060606',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:0.5,borderColor:W(0.06)},
  handleWrap:{alignItems:'center',paddingTop:10,paddingBottom:4},
  handle:{width:36,height:3.5,borderRadius:2,backgroundColor:W(0.1)},
  closeBtn:{position:'absolute',top:14,right:20,zIndex:10},
  closeText:{fontSize:18,color:W(0.25),fontWeight:'300'},
  scrollContent:{paddingTop:12,paddingBottom:40},
  subtitle:{fontSize:11,color:W(0.15),textAlign:'center',marginTop:6,letterSpacing:1,fontWeight:'300'},
  loadCenter:{alignItems:'center',paddingTop:60},
});