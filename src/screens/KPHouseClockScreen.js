/**
 * KP HOUSE CLOCK — Vedic-style smooth rotation + progressive disclosure.
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

const CLOCK_SIZE = Math.min(SW * 0.88, 360);
const CLOCK_R = CLOCK_SIZE / 2;
const ORBIT_R = CLOCK_R - 30;
const SEG_SIZE = 48;
const SEG_SEL = 62;
const COUNT = 12;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM = Math.PI / 2;

const VERDICT_COLORS = { 'Fruitful': '#50C878', 'Barren': '#C85050', 'Semi-fruitful': '#C89850', 'Unknown': '#888' };

function RevealCTA({ text, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={cs.ctaTouch}>
      <View style={cs.ctaBox}><Text style={cs.ctaText}>{text}</Text><Text style={cs.ctaArrow}>→</Text></View>
    </TouchableOpacity>
  );
}

function ClockFace() {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const r1 = ORBIT_R + (isMajor ? 14 : 10), r2 = ORBIT_R + (isMajor ? 20 : 14);
    ticks.push(<Line key={i} x1={CLOCK_R+r1*Math.cos(angle)} y1={CLOCK_R+r1*Math.sin(angle)} x2={CLOCK_R+r2*Math.cos(angle)} y2={CLOCK_R+r2*Math.sin(angle)} stroke="white" strokeWidth={isMajor?0.8:0.3} opacity={isMajor?0.12:0.04}/>);
  }
  return (
    <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} style={StyleSheet.absoluteFill}>
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R+22} stroke={W(0.06)} strokeWidth={0.5} fill="none"/>
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={ORBIT_R-SEG_SIZE/2-4} stroke={W(0.04)} strokeWidth={0.5} fill="none"/>
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={6} fill={W(0.04)} stroke={W(0.08)} strokeWidth={0.5}/>
      <Circle cx={CLOCK_R} cy={CLOCK_R} r={2} fill={GOLD} opacity={0.2}/>
      {ticks}
    </Svg>
  );
}

export default function KPHouseClockScreen({ visible, onClose, kundliData }) {
  const [houses, setHouses] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [loadingRead, setLoadingRead] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0);

  // Vedic-style rotation: raw ref + useState
  const rot = useRef(0);
  const [rotVal, setRotVal] = useState(0);
  const lastAng = useRef(0);
  const vel = useRef(0);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHouses([]);setReading(null);setHasInteracted(false);setSelectedIdx(0);setRevealLevel(0);
      rot.current=0;setRotVal(0);
      fetchHouses();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SH, duration: 250, easing: Easing.bezier(0.4,0,1,1), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchHouses = useCallback(async () => {
    setLoadingHouses(true);
    try {
      const r = await fetch(`${API_BASE}/kp-house-clock`, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ kundli_data: kundliData || { raw: { birth_details: { year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64 }}}})});
      setHouses((await r.json()).houses || []);
    } catch(e) { console.log('KP err:', e); }
    setLoadingHouses(false);
  }, [kundliData]);

  const fetchReading = useCallback(async (houseNum) => {
    setLoadingRead(true);setReading(null);setRevealLevel(0);
    try {
      const r = await fetch(`${API_BASE}/kp-house-clock/read`, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ house: houseNum, kundli_data: kundliData || { raw: { birth_details: { year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64 }}}})});
      setReading(await r.json());
    } catch(e) { console.log('KP read err:', e); }
    setLoadingRead(false);
  }, [kundliData]);

  const animateTo = useCallback((idx) => {
    const target=-idx*ANGLE_STEP, diff=target-rot.current;
    const snap=rot.current+diff-Math.round(diff/(2*Math.PI))*2*Math.PI;
    const start=rot.current, delta=snap-start;
    let step=0;
    const anim=()=>{step++;const t=Math.min(step/18,1);rot.current=start+delta*(1-Math.pow(1-t,3));setRotVal(rot.current);
      if(t<1)requestAnimationFrame(anim);
      else{rot.current=snap;setRotVal(snap);setSelectedIdx(idx);setHasInteracted(true);
        if(houses[idx])fetchReading(houses[idx].house);}};
    requestAnimationFrame(anim);
  },[houses,fetchReading]);

  const snapToNearest = useCallback((r)=>{
    const norm=((r%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
    let ci=0,cd=Infinity;
    for(let i=0;i<COUNT;i++){const pa=((BOTTOM+i*ANGLE_STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);const d=Math.min(Math.abs(pa-BOTTOM),2*Math.PI-Math.abs(pa-BOTTOM));if(d<cd){cd=d;ci=i;}}
    animateTo(ci);
  },[animateTo]);

  const wasDrag=useRef(false);
  const pan=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:(e)=>{lastAng.current=Math.atan2(e.nativeEvent.locationY-CLOCK_R,e.nativeEvent.locationX-CLOCK_R);vel.current=0;wasDrag.current=false;},
    onPanResponderMove:(e)=>{wasDrag.current=true;const a=Math.atan2(e.nativeEvent.locationY-CLOCK_R,e.nativeEvent.locationX-CLOCK_R);
      let d=a-lastAng.current;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;vel.current=d;rot.current+=d;setRotVal(rot.current);lastAng.current=a;},
    onPanResponderRelease:(e)=>{if(!wasDrag.current){
      // Tap: find closest house
      let best=-1,bd=Infinity;
      for(let i=0;i<COUNT;i++){const a=BOTTOM+i*ANGLE_STEP+rot.current;const px=CLOCK_R+ORBIT_R*Math.cos(a);const py=CLOCK_R+ORBIT_R*Math.sin(a);
        const d=Math.sqrt((e.nativeEvent.locationX-px)**2+(e.nativeEvent.locationY-py)**2);if(d<bd){bd=d;best=i;}}
      if(bd<SEG_SIZE*1.2&&best>=0)animateTo(best);return;}
      const v=vel.current;if(Math.abs(v)>0.02){const target=rot.current+v*12,start=rot.current,delta=target-start;let step=0;
        const decay=()=>{step++;const t=Math.min(step/20,1);rot.current=start+delta*(1-Math.pow(1-t,2));setRotVal(rot.current);if(t<1)requestAnimationFrame(decay);else snapToNearest(rot.current);};
        requestAnimationFrame(decay);}else snapToNearest(rot.current);},
  })).current;

  const reveal = useCallback(() => {
    LayoutAnimation.configureNext({ duration:400, create:{type:LayoutAnimation.Types.easeInEaseOut,property:LayoutAnimation.Properties.opacity}, update:{type:LayoutAnimation.Types.easeInEaseOut}});
    setRevealLevel(prev=>prev+1);
  }, []);

  if (!visible) return null;
  const selected = houses[selectedIdx] || null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop,{opacity:fadeAnim}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
      <Animated.View style={[s.sheet,{transform:[{translateY:slideAnim}]}]}>
        <View style={s.handleWrap}><View style={s.handle}/></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={s.closeText}>✕</Text></TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} bounces={false}>
          {loadingHouses ? (
            <View style={s.loadCenter}><ActivityIndicator color={GOLD} size="small"/></View>
          ) : houses.length > 0 ? (
            <>
              {/* Clock Wheel */}
              <View style={[hs.clockWrap,{width:CLOCK_SIZE,height:CLOCK_SIZE}]}>
                <ClockFace/>
                <View style={hs.indicator}><View style={hs.indicatorDiamond}/></View>

                {houses.map((h,i)=>{
                  const a=BOTTOM+i*ANGLE_STEP+rotVal;
                  const isSel=i===selectedIdx&&hasInteracted;
                  const size=isSel?SEG_SEL:SEG_SIZE;
                  const x=CLOCK_R+ORBIT_R*Math.cos(a)-size/2,y=CLOCK_R+ORBIT_R*Math.sin(a)-size/2;
                  const dist=Math.abs(a-BOTTOM),nd=Math.min(dist,2*Math.PI-dist);
                  const op=isSel?1:0.25+0.45*(1-nd/Math.PI);
                  const vc=VERDICT_COLORS[h.verdict]||'#888';
                  return(<View key={h.house} style={[hs.segment,{left:x,top:y,width:size,height:size,borderRadius:size/2,opacity:op,
                    borderColor:isSel?GOLD:W(0.06),borderWidth:isSel?1.5:0.5,backgroundColor:isSel?`${vc}15`:W(0.01)}]}>
                    <Text style={[hs.segNum,isSel&&{color:GOLD,fontSize:16}]}>{h.house}</Text>
                    <Text style={[hs.segArea,isSel&&{color:W(0.6)}]} numberOfLines={1}>{h.area}</Text>
                    <View style={[hs.verdictDot,{backgroundColor:vc}]}/>
                  </View>);
                })}
                <View {...pan.panHandlers} style={[hs.touchZone,{width:CLOCK_SIZE,height:CLOCK_SIZE}]}/>
              </View>

              {/* Reading — Progressive */}
              <View style={rs.container}>
                {!hasInteracted?(
                  <Text style={rs.emptyText}>Spin the clock to open a house</Text>
                ):selected?(
                  <>
                    <View style={rs.header}>
                      <View style={[rs.houseNum,{borderColor:VERDICT_COLORS[selected.verdict]||W(0.1)}]}>
                        <Text style={[rs.houseNumText,{color:VERDICT_COLORS[selected.verdict]}]}>{selected.house}</Text>
                      </View>
                      <View style={rs.headerInfo}>
                        <Text style={rs.areaTitle}>{selected.area}</Text>
                        <Text style={rs.governs}>{selected.governs}</Text>
                      </View>
                    </View>
                    <Text style={rs.cuspLine}>{selected.sign} {selected.degree}° · {selected.nakshatra}{selected.occupants?.length>0?` · ${selected.occupants.join(', ')}`:''}</Text>

                    {loadingRead?(
                      <View style={rs.loadWrap}><ActivityIndicator color={GOLD} size="small"/><Text style={rs.loadText}>Opening house {selected.house}...</Text></View>
                    ):reading?(
                      <>
                        {/* STAGE 1: Life Area */}
                        {reading.life_area_text&&<View style={rs.layer}><Text style={rs.layerText}>{reading.life_area_text}</Text></View>}

                        {revealLevel===0&&reading.verdict_text&&<RevealCTA text="What the sub-lord chain reveals" onPress={reveal}/>}

                        {/* STAGE 2: Verdict */}
                        {revealLevel>=1&&reading.verdict_text&&(
                          <View style={rs.layer}>
                            <View style={[rs.verdictBadge,{backgroundColor:`${VERDICT_COLORS[selected.verdict]}15`,borderColor:`${VERDICT_COLORS[selected.verdict]}40`}]}>
                              <Text style={[rs.verdictBadgeText,{color:VERDICT_COLORS[selected.verdict]}]}>{selected.verdict} · {selected.strength}</Text>
                            </View>
                            <Text style={rs.layerText}>{reading.verdict_text}</Text>
                          </View>
                        )}

                        {revealLevel===1&&<RevealCTA text="The complete chain" onPress={reveal}/>}

                        {/* STAGE 3: Chain + Insight */}
                        {revealLevel>=2&&(
                          <View style={rs.layer}>
                            <View style={rs.chainRow}>
                              {['sign_lord','nakshatra_lord','sub_lord','sub_sub_lord'].map((key,i)=>(
                                <React.Fragment key={key}>
                                  {i>0&&<Text style={rs.chainArrow}>→</Text>}
                                  <View style={[rs.chainLink,key==='sub_lord'&&rs.chainLinkMain]}>
                                    <Text style={[rs.chainLinkLabel,key==='sub_lord'&&{color:GOLD,opacity:0.5}]}>{['SIGN','STAR','SUB','SS'][i]}</Text>
                                    <Text style={[rs.chainLinkValue,key==='sub_lord'&&{color:GOLD}]}>{selected.chain?.[key]}</Text>
                                  </View>
                                </React.Fragment>
                              ))}
                            </View>
                            {reading.insight_text&&<Text style={[rs.layerText,{marginTop:14}]}>{reading.insight_text}</Text>}
                          </View>
                        )}
                      </>
                    ):null}
                  </>
                ):null}
              </View>
            </>
          ):null}
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
const hs=StyleSheet.create({
  clockWrap:{alignSelf:'center',marginTop:16,marginBottom:8},
  touchZone:{position:'absolute',top:0,left:0,zIndex:5},
  segment:{position:'absolute',alignItems:'center',justifyContent:'center'},
  segNum:{fontSize:13,color:W(0.35),fontWeight:'500'},
  segArea:{fontSize:6.5,color:W(0.18),marginTop:1,letterSpacing:0.3},
  verdictDot:{width:4,height:4,borderRadius:2,marginTop:3,opacity:0.5},
  indicator:{position:'absolute',bottom:-16,left:CLOCK_R-6,alignItems:'center',zIndex:10},
  indicatorDiamond:{width:10,height:10,backgroundColor:GOLD,opacity:0.5,transform:[{rotate:'45deg'}],borderRadius:2},
});
const rs=StyleSheet.create({
  container:{paddingHorizontal:24,paddingTop:24,minHeight:200},
  emptyText:{fontSize:13,color:W(0.12),letterSpacing:1.5,fontWeight:'300',textAlign:'center',marginTop:30},
  header:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:10},
  houseNum:{width:46,height:46,borderRadius:23,borderWidth:1.5,alignItems:'center',justifyContent:'center',backgroundColor:W(0.01)},
  houseNumText:{fontSize:18,fontWeight:'600'},
  headerInfo:{flex:1},
  areaTitle:{fontFamily:'PlayfairDisplay',fontSize:24,color:W(0.85),letterSpacing:0.5},
  governs:{fontSize:12,color:W(0.25),marginTop:4,lineHeight:18,fontWeight:'300'},
  cuspLine:{fontSize:11,color:W(0.15),letterSpacing:0.5,fontWeight:'300',marginBottom:18},
  layer:{marginBottom:22},
  layerText:{fontSize:14,color:W(0.65),lineHeight:22,fontWeight:'300'},
  verdictBadge:{alignSelf:'flex-start',borderWidth:0.5,borderRadius:6,paddingHorizontal:10,paddingVertical:5,marginBottom:10},
  verdictBadgeText:{fontSize:11,fontWeight:'500',letterSpacing:0.5},
  chainRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  chainLink:{alignItems:'center',gap:3},
  chainLinkMain:{backgroundColor:'rgba(212,175,55,0.06)',borderRadius:8,paddingHorizontal:8,paddingVertical:4},
  chainLinkLabel:{fontSize:7,color:W(0.12),letterSpacing:2,fontWeight:'600'},
  chainLinkValue:{fontSize:13,color:W(0.5),fontWeight:'400'},
  chainArrow:{fontSize:12,color:W(0.08),fontWeight:'200'},
  loadWrap:{alignItems:'center',paddingTop:20,gap:14},
  loadText:{fontSize:11,color:W(0.18),letterSpacing:1.5,fontWeight:'300'},
});
const s=StyleSheet.create({
  backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.8)'},
  sheet:{position:'absolute',bottom:0,left:0,right:0,height:SH*0.92,backgroundColor:'#060606',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:0.5,borderColor:W(0.06)},
  handleWrap:{alignItems:'center',paddingTop:10,paddingBottom:4},
  handle:{width:36,height:3.5,borderRadius:2,backgroundColor:W(0.1)},
  closeBtn:{position:'absolute',top:14,right:20,zIndex:10},
  closeText:{fontSize:18,color:W(0.25),fontWeight:'300'},
  scrollContent:{paddingTop:12,paddingBottom:40},
  loadCenter:{alignItems:'center',paddingTop:60},
});