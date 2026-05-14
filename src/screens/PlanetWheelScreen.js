import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, PanResponder, Image, LayoutAnimation, Platform, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const W = (a) => `rgba(255,255,255,${a})`;
const API_BASE = 'https://api.plutto.space/api/public';

const PLANETS = [
  {id:'Sun',glyph:'☉',color:'#E88317'},{id:'Moon',glyph:'☽',color:'#D0D0D0'},
  {id:'Mars',glyph:'♂',color:'#D04040'},{id:'Mercury',glyph:'☿',color:'#5DAE5D'},
  {id:'Jupiter',glyph:'♃',color:'#E0A820'},{id:'Venus',glyph:'♀',color:'#E8D8E8'},
  {id:'Saturn',glyph:'♄',color:'#5577BB'},{id:'Rahu',glyph:'☊',color:'#8899AA'},
  {id:'Ketu',glyph:'☋',color:'#A09080'},
];

const COUNT = PLANETS.length;
const ANGLE_STEP = (2 * Math.PI) / COUNT;
const WHEEL_SIZE = Math.min(SW * 0.82, 340);
const WHEEL_R = WHEEL_SIZE / 2;
const ORBIT_R = WHEEL_R - 32;
const PS = 44;
const PS_SEL = 62; // selected size — bigger
const BOTTOM = Math.PI / 2;

// CTA component
function RevealCTA({ text, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={cs.ctaTouch}>
      <View style={cs.ctaBox}>
        <Text style={cs.ctaText}>{text}</Text>
        <Text style={cs.ctaArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

// Loader
function TurningLoader() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const deg = spin.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] });
  return (<View style={{alignItems:'center',justifyContent:'center',alignSelf:'center',marginVertical:30,width:36,height:36}}>
    <Animated.View style={{position:'absolute',width:36,height:36,alignItems:'center',transform:[{rotate:deg}]}}><View style={{width:1.5,height:10,borderRadius:1,backgroundColor:GOLD,opacity:0.4}}/></Animated.View>
  </View>);
}

export default function PlanetWheelScreen({ visible, onClose, kundliData }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0); // 0=nothing, 1=about, 2=significance, 3=full

  const rot = useRef(0);
  const [rotVal, setRotVal] = useState(0);
  const lastAng = useRef(0);
  const vel = useRef(0);

  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const glyphOpacity = useRef(new Animated.Value(1)).current;

  const sY = useRef(new Animated.Value(0)).current;
  const sS = useRef(0);
  const sPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true, onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:()=>{sY.stopAnimation(v=>{sS.current=v;});},
    onPanResponderMove:(_,g)=>{if(sS.current+g.dy>=0)sY.setValue(sS.current+g.dy);},
    onPanResponderRelease:(_,g)=>{if(g.dy>120||g.vy>0.5)Animated.timing(sY,{toValue:SH,duration:300,easing:Easing.bezier(0.4,0,1,1),useNativeDriver:true}).start(()=>{sY.setValue(0);onClose();});
      else Animated.spring(sY,{toValue:0,tension:100,friction:12,useNativeDriver:true}).start();},
  })).current;

  useEffect(()=>{if(visible){setReading(null);setHasSpun(false);setSelectedIndex(0);setRevealLevel(0);
    rot.current=0;setRotVal(0);sY.setValue(0);imgOpacity.setValue(0);glyphOpacity.setValue(1);
    Animated.parallel([Animated.spring(slideAnim,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fadeAnim,{toValue:1,duration:300,useNativeDriver:true})]).start();
  }else{Animated.parallel([Animated.timing(slideAnim,{toValue:SH,duration:250,easing:Easing.bezier(0.4,0,1,1),useNativeDriver:true}),Animated.timing(fadeAnim,{toValue:0,duration:200,useNativeDriver:true})]).start();}
  },[visible]);

  const animateTo = useCallback((idx)=>{
    const target=-idx*ANGLE_STEP, diff=target-rot.current;
    const snap=rot.current+diff-Math.round(diff/(2*Math.PI))*2*Math.PI;
    const start=rot.current, delta=snap-start;
    // Fade glyph out, image in
    Animated.timing(glyphOpacity,{toValue:1,duration:0,useNativeDriver:true}).start();
    Animated.timing(imgOpacity,{toValue:0,duration:0,useNativeDriver:true}).start();
    let step=0;
    const anim=()=>{step++;const t=Math.min(step/18,1);rot.current=start+delta*(1-Math.pow(1-t,3));setRotVal(rot.current);
      if(t<1)requestAnimationFrame(anim);
      else{rot.current=snap;setRotVal(snap);setSelectedIndex(idx);setHasSpun(true);setRevealLevel(0);fetchReading(PLANETS[idx].id);
        // Now animate: glyph out, image in
        Animated.parallel([
          Animated.timing(glyphOpacity,{toValue:0,duration:500,useNativeDriver:true}),
          Animated.timing(imgOpacity,{toValue:1,duration:600,delay:200,useNativeDriver:true}),
        ]).start();
      }};
    requestAnimationFrame(anim);
  },[]);

  const snapToNearest = useCallback((r)=>{
    const norm=((r%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
    let ci=0,cd=Infinity;
    for(let i=0;i<COUNT;i++){const pa=((BOTTOM+i*ANGLE_STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);const d=Math.min(Math.abs(pa-BOTTOM),2*Math.PI-Math.abs(pa-BOTTOM));if(d<cd){cd=d;ci=i;}}
    animateTo(ci);
  },[animateTo]);

  const findTapped = useCallback((tx,ty)=>{
    let best=-1,bd=Infinity;
    for(let i=0;i<COUNT;i++){const a=BOTTOM+i*ANGLE_STEP+rot.current;const px=WHEEL_R+ORBIT_R*Math.cos(a);const py=WHEEL_R+ORBIT_R*Math.sin(a);
      const d=Math.sqrt((tx-px)**2+(ty-py)**2);if(d<bd){bd=d;best=i;}}
    return bd<PS*1.2?best:-1;
  },[]);

  const wasDrag=useRef(false);
  const pan=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:(e)=>{lastAng.current=Math.atan2(e.nativeEvent.locationY-WHEEL_R,e.nativeEvent.locationX-WHEEL_R);vel.current=0;wasDrag.current=false;},
    onPanResponderMove:(e)=>{wasDrag.current=true;const a=Math.atan2(e.nativeEvent.locationY-WHEEL_R,e.nativeEvent.locationX-WHEEL_R);
      let d=a-lastAng.current;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;vel.current=d;rot.current+=d;setRotVal(rot.current);lastAng.current=a;},
    onPanResponderRelease:(e)=>{if(!wasDrag.current){const idx=findTapped(e.nativeEvent.locationX,e.nativeEvent.locationY);if(idx>=0)animateTo(idx);return;}
      const v=vel.current;if(Math.abs(v)>0.02){const target=rot.current+v*12,start=rot.current,delta=target-start;let step=0;
        const decay=()=>{step++;const t=Math.min(step/20,1);rot.current=start+delta*(1-Math.pow(1-t,2));setRotVal(rot.current);if(t<1)requestAnimationFrame(decay);else snapToNearest(rot.current);};
        requestAnimationFrame(decay);}else snapToNearest(rot.current);},
  })).current;

  const fetchReading = useCallback(async(planetName)=>{
    setLoading(true);setReading(null);
    try{const r=await fetch(`${API_BASE}/planet-detail`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({planet:planetName,kundli_data:kundliData||{raw:{birth_details:{year:1976,month:7,day:28,hour:9,minute:30,latitude:25.35,longitude:74.64}}}})});
      setReading(await r.json());
    }catch(e){console.log('Planet err:',e);}setLoading(false);
  },[kundliData]);

  const reveal = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setRevealLevel(prev => prev + 1);
  }, []);

  if(!visible)return null;
  const selected=PLANETS[selectedIndex];

  return(
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.bg,{opacity:fadeAnim}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
      <Animated.View style={[s.sheet,{transform:[{translateY:Animated.add(slideAnim,sY)}]}]}>
        <View {...sPan.panHandlers} style={s.hZone}><View style={s.handle}/></View>
        <TouchableOpacity style={s.xBtn} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={s.xT}>✕</Text></TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sc} bounces={false}>
          {/* WHEEL */}
          <View style={[ws.wrap,{width:WHEEL_SIZE,height:WHEEL_SIZE}]}>
            <View style={[ws.ring,{width:ORBIT_R*2+PS,height:ORBIT_R*2+PS,borderRadius:ORBIT_R+PS/2,left:WHEEL_R-ORBIT_R-PS/2,top:WHEEL_R-ORBIT_R-PS/2}]}/>
            <View style={[ws.inner,{width:ORBIT_R*1.1,height:ORBIT_R*1.1,borderRadius:ORBIT_R*0.55,left:WHEEL_R-ORBIT_R*0.55,top:WHEEL_R-ORBIT_R*0.55}]}/>
            <View style={ws.ind}><View style={ws.triUp}/></View>

            {PLANETS.map((p,i)=>{
              const a=BOTTOM+i*ANGLE_STEP+rotVal;
              const isSel=i===selectedIndex&&hasSpun;
              const size=isSel?PS_SEL:PS;
              const x=WHEEL_R+ORBIT_R*Math.cos(a)-size/2,y=WHEEL_R+ORBIT_R*Math.sin(a)-size/2;
              const dist=Math.abs(a-BOTTOM),nd=Math.min(dist,2*Math.PI-dist);
              const op=isSel?1:0.4+0.4*(1-nd/Math.PI);
              return(<View key={p.id} style={[ws.planet,{left:x,top:y,width:size,height:size,borderRadius:size/2,opacity:op,
                borderColor:isSel?GOLD:W(0.08),borderWidth:isSel?1.5:0.5,backgroundColor:isSel?`${GOLD}12`:'transparent'}]}>
                {isSel?(
                  <>
                    <Animated.Text style={[ws.glyph,{opacity:glyphOpacity,fontSize:isSel?22:18}]}>{p.glyph}</Animated.Text>
                    <Animated.View style={[ws.imgInCircle,{opacity:imgOpacity}]}>
                      <Image source={{uri:`https://api.plutto.space/static/planets/${p.id}.png`}} style={ws.imgCircleImg} resizeMode="contain"/>
                    </Animated.View>
                  </>
                ):(
                  <Text style={ws.glyph}>{p.glyph}</Text>
                )}
                {!isSel&&<Text style={[ws.label,{color:W(0.2)}]} numberOfLines={1}>{p.id}</Text>}
              </View>);
            })}
            <View {...pan.panHandlers} style={ws.touch}/>
          </View>

          {/* READING — Progressive Disclosure */}
          <View style={rs.container}>
            {!hasSpun?<View style={{height:40}}/>:loading?<TurningLoader/>:reading?(
              <>
                {/* Header — always visible */}
                <View style={rs.header}>
                  <Text style={[rs.glyph,{color:selected.color}]}>{selected.glyph}</Text>
                  <View style={rs.headerText}>
                    <Text style={rs.planetName}>{selected.id}</Text>
                    {reading.planet_data&&<Text style={rs.meta}>{reading.planet_data.sign} · H{reading.planet_data.house} · {reading.planet_data.nakshatra}</Text>}
                  </View>
                </View>

                {reading.planet_data&&(
                  <View style={rs.badges}>
                    <View style={[rs.badge,reading.planet_data.status==='STRONG'&&rs.badgeG,reading.planet_data.status==='WEAK'&&rs.badgeR]}>
                      <Text style={rs.badgeT}>{reading.planet_data.strength}% · {reading.planet_data.status}</Text></View>
                    <View style={rs.badge}><Text style={rs.badgeT}>{reading.planet_data.dignity_label}</Text></View>
                  </View>
                )}

                {/* STAGE 1: About — What is this planet */}
                {reading.about&&(
                  <View style={rs.section}>
                    <Text style={rs.readText}>{reading.about}</Text>
                  </View>
                )}

                {/* CTA to stage 2 */}
                {revealLevel === 0 && reading.significance && (
                  <RevealCTA text="How it shapes your life" onPress={reveal} />
                )}

                {/* STAGE 2: Significance + Lore */}
                {revealLevel >= 1 && (
                  <>
                    {reading.significance&&<View style={rs.section}><Text style={rs.readText}>{reading.significance}</Text></View>}

                    {reading.planet_data?.lore&&(
                      <View style={rs.loreRow}>
                        <View style={rs.loreFact}><Text style={rs.loreL}>DEITY</Text><Text style={rs.loreV}>{reading.planet_data.lore.deity}</Text></View>
                        <View style={rs.loreDiv}/>
                        <View style={rs.loreFact}><Text style={rs.loreL}>ARCHETYPE</Text><Text style={rs.loreV}>{reading.planet_data.lore.archetype}</Text></View>
                        <View style={rs.loreFact}><Text style={rs.loreL}>ELEMENT</Text><Text style={rs.loreV}>{reading.planet_data.lore.element}</Text></View>
                      </View>
                    )}
                  </>
                )}

                {/* CTA to stage 3 */}
                {revealLevel === 1 && reading.current_effect && (
                  <RevealCTA text="What it governs right now" onPress={reveal} />
                )}

                {/* STAGE 3: Current effect + Transit + Yogas */}
                {revealLevel >= 2 && (
                  <>
                    {reading.current_effect&&<View style={rs.section}><Text style={rs.readText}>{reading.current_effect}</Text></View>}

                    {reading.planet_data?.lore?.rules&&(
                      <View style={rs.rulerRow}>
                        <View style={rs.rulerFact}><Text style={rs.loreL}>RULES</Text><Text style={rs.rulerV}>{reading.planet_data.lore.rules}</Text></View>
                        <View style={rs.rulerFact}><Text style={rs.loreL}>EXALTED</Text><Text style={rs.rulerV}>{reading.planet_data.lore.exalts_in}</Text></View>
                        <View style={rs.rulerFact}><Text style={rs.loreL}>DEBILITATED</Text><Text style={rs.rulerV}>{reading.planet_data.lore.debilitates_in}</Text></View>
                      </View>
                    )}

                    {reading.planet_data?.edu&&(
                      <View style={rs.factsRow}>
                        <View style={rs.fact}><Text style={rs.factL}>Day</Text><Text style={rs.factV}>{reading.planet_data.edu.day}</Text></View>
                        <View style={rs.factDiv}/><View style={rs.fact}><Text style={rs.factL}>Gem</Text><Text style={rs.factV}>{reading.planet_data.edu.gem}</Text></View>
                        <View style={rs.factDiv}/><View style={rs.fact}><Text style={rs.factL}>Color</Text><Text style={rs.factV}>{reading.planet_data.edu.color}</Text></View>
                      </View>
                    )}

                    {reading.planet_data?.transit_sign&&(
                      <View style={rs.transitBox}><Text style={rs.transitL}>CURRENT TRANSIT</Text>
                        <Text style={rs.transitT}>{selected.id} transiting {reading.planet_data.transit_sign}{reading.planet_data.transit_nakshatra?` (${reading.planet_data.transit_nakshatra})`:''}{reading.planet_data.transit_retrograde?' — RETROGRADE':''}</Text>
                      </View>
                    )}

                    {reading.planet_data?.yogas?.length>0&&(
                      <View style={rs.yogaBox}><Text style={rs.transitL}>YOGAS</Text>
                        {reading.planet_data.yogas.map((y,i)=><Text key={i} style={rs.yogaT}>{y.name}{y.effect?` — ${y.effect}`:''}</Text>)}
                      </View>
                    )}
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
  ring:{position:'absolute',borderWidth:0.5,borderColor:W(0.06)},
  inner:{position:'absolute',borderWidth:0.5,borderColor:W(0.03),borderStyle:'dashed'},
  planet:{position:'absolute',alignItems:'center',justifyContent:'center',paddingTop:2,overflow:'hidden'},
  glyph:{fontSize:18,color:W(0.6),fontWeight:'300'},
  label:{fontSize:7,fontWeight:'400',letterSpacing:0.3,marginTop:1},
  touch:{position:'absolute',top:0,left:0,width:WHEEL_SIZE,height:WHEEL_SIZE,zIndex:5},
  ind:{position:'absolute',bottom:-14,left:WHEEL_R-6,alignItems:'center',zIndex:10},
  triUp:{width:0,height:0,borderLeftWidth:6,borderRightWidth:6,borderBottomWidth:8,borderLeftColor:'transparent',borderRightColor:'transparent',borderBottomColor:GOLD,opacity:0.4},
  imgInCircle:{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},
  imgCircleImg:{width:'75%',height:'75%',borderRadius:100},
});

const rs=StyleSheet.create({
  container:{paddingHorizontal:20,paddingTop:16},
  header:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:14},
  glyph:{fontSize:32,fontWeight:'300'},headerText:{flex:1},
  planetName:{fontSize:26,fontFamily:'PlayfairDisplay',color:W(0.85),letterSpacing:0.5},
  meta:{fontSize:12,color:W(0.3),marginTop:3,fontWeight:'300',letterSpacing:0.5},
  badges:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:16},
  badge:{borderWidth:0.5,borderColor:W(0.08),borderRadius:6,paddingHorizontal:10,paddingVertical:4},
  badgeG:{borderColor:'#50C87830',backgroundColor:'#50C87808'},badgeR:{borderColor:'#C8505030',backgroundColor:'#C8505008'},
  badgeT:{fontSize:10,color:W(0.4),fontWeight:'500',letterSpacing:0.8},
  section:{marginBottom:16},
  readText:{fontSize:15,color:W(0.7),lineHeight:25,fontWeight:'300'},
  loreRow:{flexDirection:'row',borderTopWidth:0.5,borderBottomWidth:0.5,borderColor:W(0.04),paddingVertical:14,marginBottom:16,gap:4},
  loreFact:{flex:1,alignItems:'center',gap:4},loreDiv:{width:0.5,height:28,backgroundColor:W(0.06),alignSelf:'center'},
  loreL:{fontSize:8,color:W(0.1),letterSpacing:2,fontWeight:'500'},loreV:{fontSize:12,color:W(0.5),fontWeight:'300',textAlign:'center'},
  rulerRow:{flexDirection:'row',gap:8,marginBottom:14,flexWrap:'wrap'},rulerFact:{flex:1,minWidth:80},rulerV:{fontSize:11,color:W(0.35),fontWeight:'300',marginTop:3},
  factsRow:{flexDirection:'row',borderTopWidth:0.5,borderBottomWidth:0.5,borderColor:W(0.04),paddingVertical:12,marginBottom:14},
  fact:{flex:1,alignItems:'center',gap:4},factL:{fontSize:8,color:W(0.1),letterSpacing:2,fontWeight:'500'},factV:{fontSize:13,color:W(0.5),fontWeight:'300'},
  factDiv:{width:0.5,height:24,backgroundColor:W(0.06),alignSelf:'center'},
  transitBox:{borderWidth:0.5,borderColor:W(0.04),borderRadius:10,padding:14,marginBottom:14},
  transitL:{fontSize:8,color:W(0.1),letterSpacing:2,fontWeight:'500',marginBottom:6},transitT:{fontSize:13,color:W(0.45),lineHeight:20,fontWeight:'300'},
  yogaBox:{borderWidth:0.5,borderColor:W(0.04),borderRadius:10,padding:14,marginBottom:14},yogaT:{fontSize:12,color:W(0.4),lineHeight:18,fontWeight:'300',marginTop:4},
});

const s=StyleSheet.create({
  bg:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},
  sheet:{position:'absolute',bottom:0,left:0,right:0,height:SH*0.92,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:0.5,borderColor:W(0.05)},
  hZone:{alignItems:'center',paddingTop:8,paddingBottom:8,zIndex:20},handle:{width:40,height:4,borderRadius:2,backgroundColor:W(0.15)},
  xBtn:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(0.2),fontWeight:'300'},
  sc:{paddingBottom:40},
});