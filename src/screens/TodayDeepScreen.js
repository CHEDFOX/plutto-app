import React,{useState,useRef,useCallback,useEffect} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,Animated,Easing,Dimensions,Platform} from 'react-native';
let VC=null;try{VC=require('expo-av').Video}catch(_){try{const E=require('expo-video');VC=E.VideoView||E.Video}catch(__){}}
let getMediaUri;try{({getMediaUri}=require('../config/mediaCache'))}catch(_){getMediaUri=p=>'https://api.plutto.space/static/'+p}
const{width:SW,height:SH}=Dimensions.get('window'),W=a=>`rgba(255,255,255,${a})`,GOLD='#D4AF37';
const SYS=['vedic','kp','western','chinese','numerology'],IMG_H=[160,130,180,140,150];
const VIDS=['transitions/lens_1.mp4','transitions/lens_2.mp4','transitions/lens_3.mp4','transitions/lens_4.mp4','transitions/lens_5.mp4'];
const pick=()=>VIDS[Math.floor(Math.random()*VIDS.length)];
function CTA({text,onPress}){const b=useRef(new Animated.Value(.08)).current;useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(b,{toValue:.18,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(b,{toValue:.08,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false})])).start()},[]);return<TouchableOpacity activeOpacity={.6} onPress={onPress}><Animated.View style={[ms.ctaBox,{borderColor:b.interpolate({inputRange:[.08,.18],outputRange:[W(.08),W(.18)]})}]}><Text style={ms.ctaL}>{text}</Text><Text style={ms.ctaA}>→</Text></Animated.View></TouchableOpacity>}
function Reveal({visible,delay=0,sa=false,children}){const o=useRef(new Animated.Value(sa?1:0)).current,t=useRef(new Animated.Value(sa?0:30)).current;useEffect(()=>{if(visible&&!sa){o.setValue(0);t.setValue(30);Animated.parallel([Animated.timing(o,{toValue:1,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}),Animated.timing(t,{toValue:0,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()}},[visible]);if(!visible)return null;return<Animated.View style={{opacity:o,transform:[{translateY:t}]}}>{children}</Animated.View>}
function ImageSpace({height}){const f=useRef(new Animated.Value(0)).current;useEffect(()=>{Animated.timing(f,{toValue:1,duration:1200,delay:300,useNativeDriver:true}).start()},[]);return<Animated.View style={[ms.imgSpace,{height,opacity:f}]}/>}

export default function TodayDeepScreen({visible,onClose,todayData,onImpulse}){
  const[cs,setCs]=useState(0),[exp,setExp]=useState({}),[scrollLock,setScrollLock]=useState(false);
  const sl=useRef(new Animated.Value(SH)).current,fa=useRef(new Animated.Value(0)).current,pF=useRef(new Animated.Value(1)).current,pS=useRef(new Animated.Value(0)).current;
  const cO=useRef(new Animated.Value(1)).current,bO=useRef(new Animated.Value(1)).current,vO=useRef(new Animated.Value(1)).current;
  const vr=useRef(null),tr=useRef(false),csR=useRef(0),tmr=useRef(null),scRef=useRef(null),vidUri=useRef(getMediaUri(pick()));
  useEffect(()=>{csR.current=cs},[cs]);
  useEffect(()=>{if(visible){setCs(0);setExp({});setScrollLock(false);pF.setValue(1);pS.setValue(0);cO.setValue(1);bO.setValue(1);vO.setValue(1);tr.current=false;Animated.parallel([Animated.spring(sl,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fa,{toValue:1,duration:300,useNativeDriver:true})]).start()}else{Animated.parallel([Animated.timing(sl,{toValue:SH,duration:250,easing:Easing.bezier(.4,0,1,1),useNativeDriver:true}),Animated.timing(fa,{toValue:0,duration:200,useNativeDriver:true})]).start()}},[visible]);
  const doTrans=useCallback(()=>{if(tmr.current){clearTimeout(tmr.current);tmr.current=null}Animated.timing(vO,{toValue:0,duration:400,useNativeDriver:true}).start(()=>{setTimeout(()=>{const n=(csR.current+1)%SYS.length;pF.setValue(0);pS.setValue(30);setCs(n);csR.current=n;cO.setValue(1);bO.setValue(1);vO.setValue(1);tr.current=false;vidUri.current=getMediaUri(pick());scRef.current?.scrollTo({y:0,animated:false});setScrollLock(false);Animated.parallel([Animated.timing(pF,{toValue:1,duration:500,useNativeDriver:true}),Animated.timing(pS,{toValue:0,duration:500,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()},400)})},[]);
  const trigL=useCallback(()=>{if(tr.current)return;tr.current=true;setScrollLock(true);scRef.current?.scrollTo({y:0,animated:true});setTimeout(()=>{Animated.parallel([Animated.timing(cO,{toValue:0,duration:400,easing:Easing.out(Easing.quad),useNativeDriver:true}),Animated.timing(bO,{toValue:0,duration:300,useNativeDriver:true})]).start(()=>{tmr.current=setTimeout(doTrans,4000);try{vr.current?.setPositionAsync?.(0);vr.current?.playAsync?.()}catch(e){}if(!VC)setTimeout(doTrans,500)})},300)},[doTrans]);
  const hPB=useCallback(st=>{if(st.didJustFinish)doTrans()},[doTrans]);
  const tBack=useCallback(n=>{onImpulse?.();Animated.timing(pF,{toValue:0,duration:200,useNativeDriver:true}).start(()=>{pS.setValue(-20);setCs(n);csR.current=n;cO.setValue(1);bO.setValue(1);vO.setValue(1);tr.current=false;scRef.current?.scrollTo({y:0,animated:false});Animated.parallel([Animated.timing(pF,{toValue:1,duration:450,useNativeDriver:true}),Animated.timing(pS,{toValue:0,duration:450,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()})},[onImpulse]);
  const rev=useCallback(k=>{setExp(p=>({...p,[k]:(p[k]||0)+1}))},[]);
  if(!visible||!todayData)return null;
  const rd=todayData.reading||todayData;
  return<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <Animated.View style={[ms.bk,{opacity:fa}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
    <Animated.View style={[ms.sh,{transform:[{translateY:sl}]}]}>
      <View style={ms.hW}><View style={ms.h}/></View>
      <TouchableOpacity style={ms.xB} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={ms.xT}>✕</Text></TouchableOpacity>
      <ScrollView ref={scRef} showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false} scrollEnabled={!scrollLock}>
        <Animated.View style={{opacity:pF,transform:[{translateY:pS}]}}>
          <Animated.View style={{opacity:cO}}>
            {(()=>{const sk=SYS[cs],sd=rd[sk];if(!sd)return null;
              const lv=exp[sk]||0,isL=cs===SYS.length-1,sa=lv>0,si=cs;
              const hasDeeper=Boolean(sd.deeper),hasDo=Boolean(sd.do?.length>0||sd.dont?.length>0),hasClosing=Boolean(sd.closing);
              return<View style={ms.rW}>
                {cs>0?<TouchableOpacity onPress={()=>tBack(cs-1)} style={{alignSelf:'flex-start',paddingVertical:6,paddingRight:20,marginBottom:12}}><Text style={{fontSize:24,color:W(.25),fontWeight:'200'}}>‹</Text></TouchableOpacity>:null}
                {sd.headline?<Reveal visible={true} sa={sa}><Text style={ms.headline}>{sd.headline}</Text></Reveal>:null}
                {si===0?<Reveal visible={true} delay={sa?0:200} sa={sa}><ImageSpace height={IMG_H[si]}/></Reveal>:null}
                {si===4?<Reveal visible={true} delay={sa?0:200} sa={sa}><ImageSpace height={IMG_H[si]}/></Reveal>:null}
                {sd.reading?<Reveal visible={true} delay={sa?0:300} sa={sa}><Text style={ms.reading}>{sd.reading}</Text></Reveal>:null}
                {si===1&&lv>=1?<Reveal visible={true} sa={sa}><ImageSpace height={IMG_H[si]}/></Reveal>:null}
                {lv===0&&(hasDeeper||hasDo)?<Reveal visible={true} delay={sa?0:500} sa={sa}><CTA text={sd.cta_deeper||sd.cta_next||'Go deeper'} onPress={()=>rev(sk)}/></Reveal>:null}
                {lv>=1&&hasDeeper?<Reveal visible={true} sa={sa}><Text style={ms.deeper}>{sd.deeper}</Text></Reveal>:null}
                {si===2&&lv>=1?<Reveal visible={true} sa={sa}><ImageSpace height={IMG_H[si]}/></Reveal>:null}
                {lv===1&&hasDo?<Reveal visible={true} sa={sa}><CTA text={sd.cta_verdict||'What to hold, what to release'} onPress={()=>rev(sk)}/></Reveal>:null}
                {lv===1&&!hasDo&&isL&&hasClosing?<Reveal visible={true} sa={sa}><CTA text={sd.cta_verdict||'The unified truth'} onPress={()=>rev(sk)}/></Reveal>:null}
                {lv>=2&&hasDo?<Reveal visible={true} sa={sa}><View style={ms.vW}>{sd.do?.length>0?<View style={ms.vC}><Text style={ms.vL}>Do</Text>{sd.do.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}{sd.dont?.length>0?<View style={ms.vC}><Text style={ms.vL}>Don't</Text>{sd.dont.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}</View></Reveal>:null}
                {si===3&&lv>=2?<Reveal visible={true} sa={sa}><ImageSpace height={IMG_H[si]}/></Reveal>:null}
                {isL&&lv>=2&&hasClosing?<Reveal visible={true} delay={sa?0:300} sa={sa}><View style={ms.clW}><View style={ms.clB}/><Text style={ms.clT}>{sd.closing}</Text></View></Reveal>:null}
              </View>})()}
          </Animated.View>
          {(()=>{const sk=SYS[cs],sd=rd[sk],lv=exp[sk]||0,isL=cs===SYS.length-1;
            if(!sd||isL)return null;
            const hasDeeper=Boolean(sd.deeper),hasDo=Boolean(sd.do?.length>0||sd.dont?.length>0);
            const done=lv>=2||(lv>=1&&!hasDo)||(lv===0&&!hasDeeper&&!hasDo);
            if(!done)return null;
            return<Animated.View style={{opacity:vO,paddingHorizontal:28}}>
              <Animated.View style={{opacity:bO}}><CTA text={sd.cta_next||'Change the lens'} onPress={trigL}/></Animated.View>
              <TouchableOpacity activeOpacity={.8} onPress={trigL}><View style={ms.lVH}>{VC?<VC ref={vr} source={{uri:vidUri.current}} style={[ms.lV,{transform:[{rotate:'180deg'}]}]} resizeMode="cover" shouldPlay={false} isLooping={false} volume={0} onPlaybackStatusUpdate={hPB} onError={()=>doTrans()}/>:null}</View></TouchableOpacity>
            </Animated.View>})()}
        </Animated.View>
        <View style={{height:80}}/>
      </ScrollView>
    </Animated.View>
  </View>
}
const ms=StyleSheet.create({bk:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},sh:{position:'absolute',bottom:0,left:0,right:0,height:SH*.92,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:.5,borderColor:W(.05)},hW:{alignItems:'center',paddingTop:8,paddingBottom:4,zIndex:20},h:{width:40,height:4,borderRadius:2,backgroundColor:W(.45)},xB:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(.2),fontWeight:'300'},sC:{paddingBottom:40,paddingTop:24},rW:{paddingHorizontal:28},headline:{fontFamily:'PlayfairDisplay',fontSize:26,lineHeight:36,color:W(.92),marginBottom:20},reading:{fontSize:16,lineHeight:28,color:W(.78),fontWeight:'300',marginBottom:24},deeper:{fontSize:15,lineHeight:26,color:W(.62),fontWeight:'300',marginBottom:28},ctaBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(.1),paddingVertical:20,paddingHorizontal:24,marginVertical:28},ctaL:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(.88),fontStyle:'italic',flex:1,marginRight:14},ctaA:{fontSize:16,color:W(.3),fontWeight:'200'},vW:{flexDirection:'row',marginVertical:12,gap:40},vC:{flex:1},vL:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,color:W(.28),marginBottom:16,letterSpacing:2,textTransform:'uppercase'},vI:{fontSize:15,lineHeight:26,color:W(.78),fontWeight:'400',marginBottom:6},clW:{marginTop:44,paddingTop:32},clB:{width:24,height:1,backgroundColor:GOLD,alignSelf:'center',marginBottom:28,opacity:.4},clT:{fontFamily:'PlayfairDisplay',fontSize:18,lineHeight:28,color:GOLD,textAlign:'center',fontStyle:'italic',opacity:.85},lVH:{width:'100%',height:120,borderRadius:4,overflow:'hidden',backgroundColor:'transparent',marginTop:4},lV:{width:'100%',height:'100%'},imgSpace:{width:'100%',marginVertical:24}});