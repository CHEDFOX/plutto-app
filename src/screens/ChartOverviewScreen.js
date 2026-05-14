import React,{useState,useRef,useCallback,useEffect} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,Animated,Easing,Dimensions,Platform,PanResponder} from 'react-native';
import MediaView from '../components/MediaView';
const{width:SW,height:SH}=Dimensions.get('window'),W=a=>`rgba(255,255,255,${a})`,GOLD='#D4AF37';
const SYS=['vedic','kp','western','chinese','numerology'];
const VIDS=['transitions/lens_1.mp4','transitions/lens_2.mp4','transitions/lens_3.mp4','transitions/lens_4.mp4','transitions/lens_5.mp4'];
const pick=()=>VIDS[Math.floor(Math.random()*VIDS.length)];
function CTA({text,onPress}){const b=useRef(new Animated.Value(.08)).current;useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(b,{toValue:.18,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(b,{toValue:.08,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false})])).start()},[]);return<TouchableOpacity activeOpacity={.6} onPress={onPress}><Animated.View style={[ms.ctaBox,{borderColor:b.interpolate({inputRange:[.08,.18],outputRange:[W(.08),W(.18)]})}]}><Text style={ms.ctaL}>{text}</Text><Text style={ms.ctaA}>→</Text></Animated.View></TouchableOpacity>}
function Reveal({visible,delay=0,sa=false,children}){const o=useRef(new Animated.Value(sa?1:0)).current,t=useRef(new Animated.Value(sa?0:30)).current;useEffect(()=>{if(visible&&!sa){o.setValue(0);t.setValue(30);Animated.parallel([Animated.timing(o,{toValue:1,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}),Animated.timing(t,{toValue:0,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()}},[visible]);if(!visible)return null;return<Animated.View style={{opacity:o,transform:[{translateY:t}]}}>{children}</Animated.View>}
function MediaSlot({section,system,slot,height}){
  const[ok,setOk]=useState(false);const[tryIdx,setTryIdx]=useState(0);
  const exts=['.jpg','.png','.mp4','.gif'];
  const path=`readings/${section}/${system}/slot_${slot}`+exts[tryIdx];
  return<View style={{width:'100%',height:ok?height:0,marginVertical:ok?24:0}}>
    <MediaView uri={path} style={{width:'100%',height}} onLoaded={()=>setOk(true)} onFailed={()=>{if(tryIdx<exts.length-1)setTryIdx(tryIdx+1)}}/>
  </View>
}

export default function ChartOverviewScreen({visible,onClose,chartData,onImpulse}){
  const[cs,setCs]=useState(0),[exp,setExp]=useState({}),[trans,setTrans]=useState(false);
  const sl=useRef(new Animated.Value(SH)).current,fa=useRef(new Animated.Value(0)).current,cF=useRef(new Animated.Value(1)).current;
  const csR=useRef(0),scRef=useRef(null);const[vidSrc,setVidSrc]=useState(pick);
  useEffect(()=>{csR.current=cs},[cs]);
  const hPan=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dy)>10,onPanResponderRelease:(_,g)=>{if(g.dy>60)onClose?.()}})).current;
  useEffect(()=>{if(visible){setCs(0);setExp({});setTrans(false);cF.setValue(1);Animated.parallel([Animated.spring(sl,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fa,{toValue:1,duration:300,useNativeDriver:true})]).start()}else{Animated.parallel([Animated.timing(sl,{toValue:SH,duration:250,easing:Easing.bezier(.4,0,1,1),useNativeDriver:true}),Animated.timing(fa,{toValue:0,duration:200,useNativeDriver:true})]).start()}},[visible]);
  const finishTrans=useCallback(()=>{const n=(csR.current+1)%SYS.length;setCs(n);csR.current=n;setTrans(false);setVidSrc(pick());scRef.current?.scrollTo({y:0,animated:false});cF.setValue(0);Animated.timing(cF,{toValue:1,duration:600,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}).start()},[]);
  const trigLens=useCallback(()=>{if(trans)return;onImpulse?.();Animated.timing(cF,{toValue:0,duration:300,useNativeDriver:true}).start(()=>{scRef.current?.scrollTo({y:0,animated:false});setTrans(true)})},[trans,onImpulse]);
  const tBack=useCallback(n=>{onImpulse?.();Animated.timing(cF,{toValue:0,duration:200,useNativeDriver:true}).start(()=>{setCs(n);csR.current=n;scRef.current?.scrollTo({y:0,animated:false});cF.setValue(0);Animated.timing(cF,{toValue:1,duration:450,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}).start()})},[onImpulse]);
  const rev=useCallback(k=>{setExp(p=>({...p,[k]:(p[k]||0)+1}))},[]);
  if(!visible||!chartData)return null;
  return<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <Animated.View style={[ms.bk,{opacity:fa}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
    <Animated.View style={[ms.sh,{transform:[{translateY:sl}]}]}>
      <View {...hPan.panHandlers} style={ms.hW}><View style={ms.h}/></View>
      <TouchableOpacity style={ms.xB} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={ms.xT}>✕</Text></TouchableOpacity>
      <ScrollView ref={scRef} showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false} scrollEnabled={!trans}>
        {trans?<View style={ms.vidWrap}><MediaView uri={vidSrc} style={{width:'100%',height:'100%'}} autoPlay onFailed={finishTrans}/></View>:null}
        {!trans?<Animated.View style={{opacity:cF}}>
          {(()=>{const sk=SYS[cs],sd=chartData[sk];if(!sd)return null;
            const lv=exp[sk]||0,isL=cs===SYS.length-1,sa=lv>0,si=cs;
            const hasDeeper=Boolean(sd.deeper),hasDo=Boolean(sd.do?.length>0||sd.dont?.length>0),hasClosing=Boolean(sd.closing);
            const done=lv>=2||(lv>=1&&!hasDo)||(lv===0&&!hasDeeper&&!hasDo);
            const IMG_H=[180,150,140,170,160];
            return<View style={ms.rW}>
              {cs>0?<TouchableOpacity onPress={()=>tBack(cs-1)} style={{alignSelf:'flex-start',paddingVertical:6,paddingRight:20,marginBottom:12}}><Text style={{fontSize:24,color:W(.25),fontWeight:'200'}}>‹</Text></TouchableOpacity>:null}
              {sd.headline?<Reveal visible={true} sa={sa}><Text style={ms.headline}>{sd.headline}</Text></Reveal>:null}
              {sd.glance?<Reveal visible={true} delay={sa?0:200} sa={sa}><Text style={ms.glance}>{sd.glance}</Text></Reveal>:null}
              {sd.snapshot?<Reveal visible={true} delay={sa?0:400} sa={sa}><Text style={ms.snapshot}>{sd.snapshot}</Text></Reveal>:null}
              {(si===0||si===1)?<Reveal visible={true} delay={sa?0:500} sa={sa}><MediaSlot section="chart" system={sk} slot={0} height={IMG_H[si]}/></Reveal>:null}
              {sd.reading?<Reveal visible={true} delay={sa?0:600} sa={sa}><Text style={ms.reading}>{sd.reading}</Text></Reveal>:null}
              {si===2?<Reveal visible={true} delay={sa?0:700} sa={sa}><MediaSlot section="chart" system={sk} slot={1} height={IMG_H[si]}/></Reveal>:null}
              {lv===0&&(hasDeeper||hasDo)?<Reveal visible={true} delay={sa?0:800} sa={sa}><CTA text={sd.cta_deeper||sd.cta_next||'Go deeper'} onPress={()=>rev(sk)}/></Reveal>:null}
              {lv>=1&&hasDeeper?<Reveal visible={true} sa={sa}><Text style={ms.deeper}>{sd.deeper}</Text></Reveal>:null}
              {si===3&&lv>=1?<Reveal visible={true} sa={sa}><MediaSlot section="chart" system={sk} slot={2} height={IMG_H[si]}/></Reveal>:null}
              {lv===1&&hasDo?<Reveal visible={true} sa={sa}><CTA text={sd.cta_verdict||'What you should know'} onPress={()=>rev(sk)}/></Reveal>:null}
              {lv===1&&!hasDo&&isL&&hasClosing?<Reveal visible={true} sa={sa}><CTA text={sd.cta_verdict||'The unified truth'} onPress={()=>rev(sk)}/></Reveal>:null}
              {lv>=2&&hasDo?<Reveal visible={true} sa={sa}><View style={ms.vW}>{sd.do?.length>0?<View style={ms.vC}><Text style={ms.vL}>Do</Text>{sd.do.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}{sd.dont?.length>0?<View style={ms.vC}><Text style={ms.vL}>Don't</Text>{sd.dont.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}</View></Reveal>:null}
              {si===4&&lv>=2?<Reveal visible={true} sa={sa}><MediaSlot section="chart" system={sk} slot={3} height={IMG_H[si]}/></Reveal>:null}
              {isL&&lv>=2&&hasClosing?<Reveal visible={true} delay={sa?0:300} sa={sa}><View style={ms.clW}><View style={ms.clB}/><Text style={ms.clT}>{sd.closing}</Text></View></Reveal>:null}
              {done&&!isL?<CTA text={sd.cta_next||'Change the lens'} onPress={trigLens}/>:null}
            </View>})()}
        </Animated.View>:null}
        <View style={{height:80}}/>
      </ScrollView>
    </Animated.View>
  </View>
}
const ms=StyleSheet.create({bk:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},sh:{position:'absolute',bottom:0,left:0,right:0,height:SH*.92,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:.5,borderColor:W(.05)},hW:{alignItems:'center',paddingTop:10,paddingBottom:8,zIndex:20},h:{width:44,height:5,borderRadius:3,backgroundColor:W(.45)},xB:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(.2),fontWeight:'300'},sC:{paddingBottom:40,paddingTop:20},rW:{paddingHorizontal:28},headline:{fontFamily:'PlayfairDisplay',fontSize:26,lineHeight:36,color:W(.92),marginBottom:20},glance:{fontSize:15,lineHeight:24,color:W(.7),fontWeight:'300',fontStyle:'italic',marginBottom:20},snapshot:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,lineHeight:20,color:W(.3),letterSpacing:.5,marginBottom:24},reading:{fontSize:16,lineHeight:28,color:W(.78),fontWeight:'300',marginBottom:24},deeper:{fontSize:15,lineHeight:26,color:W(.62),fontWeight:'300',marginBottom:28},ctaBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(.1),paddingVertical:20,paddingHorizontal:24,marginVertical:28},ctaL:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(.88),fontStyle:'italic',flex:1,marginRight:14},ctaA:{fontSize:16,color:W(.3),fontWeight:'200'},vW:{flexDirection:'row',marginVertical:12,gap:40},vC:{flex:1},vL:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,color:W(.28),marginBottom:16,letterSpacing:2,textTransform:'uppercase'},vI:{fontSize:15,lineHeight:26,color:W(.78),fontWeight:'400',marginBottom:6},clW:{marginTop:44,paddingTop:32},clB:{width:24,height:1,backgroundColor:GOLD,alignSelf:'center',marginBottom:28,opacity:.4},clT:{fontFamily:'PlayfairDisplay',fontSize:18,lineHeight:28,color:GOLD,textAlign:'center',fontStyle:'italic',opacity:.85},vidWrap:{width:SW*.75,height:SW*.42,alignSelf:'center',borderRadius:8,overflow:'hidden',marginTop:SH*.45}});