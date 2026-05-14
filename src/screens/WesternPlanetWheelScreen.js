/**
 * WESTERN PLANET WHEEL — Vedic-style rotation, image in selected circle, progressive disclosure.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, ActivityIndicator, PanResponder, Image, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const PLANETS = [
  {id:'Sun',glyph:'☉',color:'#E8A317'},{id:'Moon',glyph:'☽',color:'#C0C0C0'},
  {id:'Mercury',glyph:'☿',color:'#70A870'},{id:'Venus',glyph:'♀',color:'#D0A0C0'},
  {id:'Mars',glyph:'♂',color:'#CC5544'},{id:'Jupiter',glyph:'♃',color:'#CCAA33'},
  {id:'Saturn',glyph:'♄',color:'#5577AA'},{id:'Uranus',glyph:'⛢',color:'#40B0B0'},
  {id:'Neptune',glyph:'♆',color:'#7080CC'},{id:'Pluto',glyph:'♇',color:'#886666'},
];

const COUNT = PLANETS.length;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const BOTTOM = Math.PI / 2;
const WHEEL_SIZE = Math.min(SW * 0.85, 350);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 30;
const NS = 40;
const NS_SEL = 58;

const ASPECT_COLORS = { conjunction:'#FFFFFF', opposition:'#CC4444', trine:'#44AA44', square:'#CC4444', sextile:'#4488CC', quincunx:'#AA8844' };

function RevealCTA({ text, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={cs.ctaTouch}>
      <View style={cs.ctaBox}><Text style={cs.ctaText}>{text}</Text><Text style={cs.ctaArrow}>→</Text></View>
    </TouchableOpacity>
  );
}

export default function WesternPlanetWheelScreen({ visible, onClose, kundliData }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0);

  const rot = useRef(0);
  const [rotVal, setRotVal] = useState(0);
  const lastAng = useRef(0);
  const vel = useRef(0);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const glyphOpacity = useRef(new Animated.Value(1)).current;

  useEffect(()=>{if(visible){setReading(null);setHasSpun(false);setSelectedIdx(0);setRevealLevel(0);
    rot.current=0;setRotVal(0);imgOpacity.setValue(0);glyphOpacity.setValue(1);
    Animated.parallel([Animated.spring(slideAnim,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fadeAnim,{toValue:1,duration:300,useNativeDriver:true})]).start();
  }else{Animated.parallel([Animated.timing(slideAnim,{toValue:SH,duration:250,easing:Easing.bezier(0.4,0,1,1),useNativeDriver:true}),Animated.timing(fadeAnim,{toValue:0,duration:200,useNativeDriver:true})]).start();}
  },[visible]);

  const fetchReading = useCallback(async(name)=>{
    setLoading(true);setReading(null);setRevealLevel(0);
    try{const r=await fetch(`${API_BASE}/western-planet`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({planet:name,kundli_data:kundliData||{raw:{birth_details:{year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64}}}})});
      setReading(await r.json());
    }catch(e){console.log('W planet err:',e);}setLoading(false);
  },[kundliData]);

  const animateTo = useCallback((idx)=>{
    const target=-idx*ANGLE_STEP, diff=target-rot.current;
    const snap=rot.current+diff-Math.round(diff/(2*Math.PI))*2*Math.PI;
    const start=rot.current, delta=snap-start;
    glyphOpacity.setValue(1);imgOpacity.setValue(0);
    let step=0;
    const anim=()=>{step++;const t=Math.min(step/18,1);rot.current=start+delta*(1-Math.pow(1-t,3));setRotVal(rot.current);
      if(t<1)requestAnimationFrame(anim);
      else{rot.current=snap;setRotVal(snap);setSelectedIdx(idx);setHasSpun(true);fetchReading(PLANETS[idx].id);
        Animated.parallel([
          Animated.timing(glyphOpacity,{toValue:0,duration:500,useNativeDriver:true}),
          Animated.timing(imgOpacity,{toValue:1,duration:600,delay:200,useNativeDriver:true}),
        ]).start();}};
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

  if(!visible)return null;
  const selected=PLANETS[selectedIdx];
  const aspects=reading?.planet_data?.aspects||[];

  return(
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.backdrop,{opacity:fadeAnim}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
      <Animated.View style={[s.sheet,{transform:[{translateY:slideAnim}]}]}>
        <View style={s.handleWrap}><View style={s.handle}/></View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={s.closeText}>✕</Text></TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} bounces={false}>
          {/* Wheel */}
          <View style={[ws.wrap,{width:WHEEL_SIZE,height:WHEEL_SIZE}]}>
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} style={StyleSheet.absoluteFill}>
              <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R+NS/2} stroke={W(0.04)} strokeWidth={0.5} fill="none"/>
              <Circle cx={WHEEL_R} cy={WHEEL_R} r={ORBIT_R*0.4} stroke={W(0.02)} strokeWidth={0.3} fill="none" strokeDasharray="2,6"/>
              <Circle cx={WHEEL_R} cy={WHEEL_R} r={3} fill={W(0.06)}/>
              {/* Aspect lines */}
              {hasSpun&&aspects.map((a,i)=>{
                const oi=PLANETS.findIndex(p=>p.id===a.other_planet);if(oi<0)return null;
                const a1=BOTTOM+selectedIdx*ANGLE_STEP+rotVal,a2=BOTTOM+oi*ANGLE_STEP+rotVal;
                return <Line key={i} x1={WHEEL_R+(ORBIT_R-8)*Math.cos(a1)} y1={WHEEL_R+(ORBIT_R-8)*Math.sin(a1)} x2={WHEEL_R+(ORBIT_R-8)*Math.cos(a2)} y2={WHEEL_R+(ORBIT_R-8)*Math.sin(a2)} stroke={ASPECT_COLORS[a.aspect]||W(0.15)} strokeWidth={a.tight?1.2:0.6} opacity={a.tight?0.4:0.15}/>;
              })}
            </Svg>
            <View style={ws.indicator}><View style={ws.triUp}/></View>

            {PLANETS.map((p,i)=>{
              const a=BOTTOM+i*ANGLE_STEP+rotVal;
              const isSel=i===selectedIdx&&hasSpun;
              const size=isSel?NS_SEL:NS;
              const x=WHEEL_R+ORBIT_R*Math.cos(a)-size/2,y=WHEEL_R+ORBIT_R*Math.sin(a)-size/2;
              const dist=Math.abs(a-BOTTOM),nd=Math.min(dist,2*Math.PI-dist);
              const op=isSel?1:0.25+0.45*(1-nd/Math.PI);
              return(<View key={p.id} style={[ws.node,{left:x,top:y,width:size,height:size,borderRadius:size/2,opacity:op,
                borderColor:isSel?p.color:W(0.06),borderWidth:isSel?1.5:0.5,backgroundColor:isSel?`${p.color}12`:'transparent'}]}>
                {isSel?(
                  <>
                    <Animated.Text style={[ws.glyphText,{color:p.color,fontSize:20,opacity:glyphOpacity}]}>{p.glyph}</Animated.Text>
                    <Animated.View style={[ws.imgInCircle,{opacity:imgOpacity}]}>
                      <Image source={{uri:`https://api.plutto.space/static/planets/${p.id}.png`}} style={ws.imgCircleImg} resizeMode="contain"/>
                    </Animated.View>
                  </>
                ):(
                  <Text style={[ws.glyphText,{color:W(0.4),fontSize:16}]}>{p.glyph}</Text>
                )}
                {!isSel&&<Text style={[ws.labelText,{color:W(0.15)}]} numberOfLines={1}>{p.id}</Text>}
              </View>);
            })}
            <View {...pan.panHandlers} style={[ws.touchZone,{width:WHEEL_SIZE,height:WHEEL_SIZE}]}/>
          </View>

          {/* Reading — Progressive */}
          <View style={rs.container}>
            {!hasSpun?(
              <Text style={rs.emptyText}>Spin the wheel to select a planet</Text>
            ):loading?(
              <View style={rs.loadWrap}><ActivityIndicator color={GOLD} size="small"/><Text style={rs.loadText}>Reading {selected.id}...</Text></View>
            ):reading?(
              <>
                <View style={rs.header}>
                  <Text style={[rs.planetGlyph,{color:selected.color}]}>{selected.glyph}</Text>
                  <View style={rs.headerInfo}>
                    <Text style={rs.planetName}>{selected.id}</Text>
                    <Text style={rs.planetMeta}>{reading.planet_data?.sign} · House {reading.planet_data?.house} · {reading.planet_data?.degree}°{reading.planet_data?.is_retrograde?' · Retrograde':''}</Text>
                    {reading.planet_data?.archetype&&<Text style={rs.archetype}>{reading.planet_data.archetype}</Text>}
                  </View>
                </View>

                {/* STAGE 1: Significance */}
                {reading.significance&&<Text style={rs.sigText}>{reading.significance}</Text>}

                {revealLevel===0&&aspects.length>0&&<RevealCTA text="See every aspect connection" onPress={reveal}/>}

                {/* STAGE 2: Aspect legend + readings */}
                {revealLevel>=1&&aspects.length>0&&(
                  <>
                    <View style={rs.legendRow}>
                      {[['△ trine','#44AA44'],['□ square','#CC4444'],['☌ conj','#FFFFFF'],['⚹ sextile','#4488CC']].map(([l,c])=>(
                        <Text key={l} style={[rs.legendItem,{color:c}]}>{l}</Text>
                      ))}
                    </View>
                    {reading.aspects_reading&&reading.aspects_reading.split('\n').filter(l=>l.trim()).map((line,i)=>{
                      const asp=aspects[i];
                      return(<View key={i} style={rs.aspectRow}>
                        <View style={[rs.aspectDot,{backgroundColor:asp?ASPECT_COLORS[asp.aspect]||W(0.15):W(0.1)}]}/>
                        <Text style={rs.aspectLine}>{line}</Text>
                      </View>);
                    })}
                  </>
                )}
              </>
            ):null}
          </View>
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
const ws=StyleSheet.create({
  wrap:{alignSelf:'center',marginTop:16,marginBottom:8},
  touchZone:{position:'absolute',top:0,left:0,zIndex:5},
  node:{position:'absolute',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  glyphText:{fontWeight:'300'},
  labelText:{fontSize:7,marginTop:1,letterSpacing:0.3},
  indicator:{position:'absolute',bottom:-16,left:WHEEL_R-7,alignItems:'center',zIndex:10},
  triUp:{width:0,height:0,borderLeftWidth:6,borderRightWidth:6,borderBottomWidth:9,borderLeftColor:'transparent',borderRightColor:'transparent',borderBottomColor:GOLD,opacity:0.5,transform:[{rotate:'180deg'}]},
  imgInCircle:{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},
  imgCircleImg:{width:'75%',height:'75%',borderRadius:100},
});
const rs=StyleSheet.create({
  container:{paddingHorizontal:24,paddingTop:24,minHeight:200},
  emptyText:{fontSize:13,color:W(0.12),letterSpacing:1.5,fontWeight:'300',textAlign:'center',marginTop:30},
  loadWrap:{alignItems:'center',paddingTop:30,gap:14},
  loadText:{fontSize:11,color:W(0.18),letterSpacing:1.5,fontWeight:'300'},
  header:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:18},
  planetGlyph:{fontSize:38,fontWeight:'200'},
  headerInfo:{flex:1},
  planetName:{fontFamily:'PlayfairDisplay',fontSize:24,color:W(0.85),letterSpacing:0.5},
  planetMeta:{fontSize:12,color:W(0.25),marginTop:4,fontWeight:'300'},
  archetype:{fontSize:11,color:GOLD,opacity:0.4,marginTop:3,letterSpacing:1.5,fontWeight:'400'},
  sigText:{fontSize:15,color:W(0.7),lineHeight:25,fontWeight:'300',marginBottom:22},
  legendRow:{flexDirection:'row',gap:14,marginBottom:18,flexWrap:'wrap'},
  legendItem:{fontSize:10,fontWeight:'400',letterSpacing:0.5,opacity:0.5},
  aspectRow:{flexDirection:'row',gap:10,marginBottom:14},
  aspectDot:{width:6,height:6,borderRadius:3,marginTop:7,opacity:0.6},
  aspectLine:{fontSize:13,color:W(0.55),lineHeight:21,fontWeight:'300',flex:1},
});
const s=StyleSheet.create({
  backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.8)'},
  sheet:{position:'absolute',bottom:0,left:0,right:0,height:SH*0.92,backgroundColor:'#060606',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:0.5,borderColor:W(0.06)},
  handleWrap:{alignItems:'center',paddingTop:10,paddingBottom:4},
  handle:{width:36,height:3.5,borderRadius:2,backgroundColor:W(0.1)},
  closeBtn:{position:'absolute',top:14,right:20,zIndex:10},
  closeText:{fontSize:18,color:W(0.25),fontWeight:'300'},
  scrollContent:{paddingTop:12,paddingBottom:40},
});