import React,{useState,useRef,useCallback,useEffect,useMemo} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,Animated,Easing,Dimensions,PanResponder,Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
let VC=null;try{VC=require('expo-av').Video}catch(_){try{const E=require('expo-video');VC=E.VideoView||E.Video}catch(__){}}
const{width:SW,height:SH}=Dimensions.get('window'),W=a=>`rgba(255,255,255,${a})`,GOLD='#D4AF37';
const API='https://api.plutto.space/api/public';
const VIDS=['transitions/lens_1.mp4','transitions/lens_2.mp4','transitions/lens_3.mp4','transitions/lens_4.mp4','transitions/lens_5.mp4'];
const pick=()=>VIDS[Math.floor(Math.random()*VIDS.length)];
let getMediaUri;try{({getMediaUri}=require('../config/mediaCache'))}catch(_){getMediaUri=p=>'https://api.plutto.space/static/'+p}
const SYS=['vedic','kp','western','chinese','numerology'],SYS_L=['Vedic','KP','Western','Chinese','Numerology'];
const WR=[118,128,122,95,108],NSZ=[38,32,36,44,40];
const CACHE_TTL=7*24*60*60*1000,REFRESH_AT=6*24*60*60*1000;

function CTA({text,onPress}){const b=useRef(new Animated.Value(.08)).current;useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(b,{toValue:.18,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(b,{toValue:.08,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false})])).start()},[]);return<TouchableOpacity activeOpacity={.6} onPress={onPress}><Animated.View style={[ms.ctaBox,{borderColor:b.interpolate({inputRange:[.08,.18],outputRange:[W(.08),W(.18)]})}]}><Text style={ms.ctaL}>{text}</Text><Text style={ms.ctaA}>→</Text></Animated.View></TouchableOpacity>}
function Reveal({visible,delay=0,children}){const o=useRef(new Animated.Value(0)).current,t=useRef(new Animated.Value(24)).current;useEffect(()=>{if(visible){o.setValue(0);t.setValue(24);Animated.parallel([Animated.timing(o,{toValue:1,duration:600,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}),Animated.timing(t,{toValue:0,duration:600,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()}},[visible]);if(!visible)return null;return<Animated.View style={{opacity:o,transform:[{translateY:t}]}}>{children}</Animated.View>}
function ImageSpace({height}){const f=useRef(new Animated.Value(0)).current;useEffect(()=>{Animated.timing(f,{toValue:1,duration:1200,delay:300,useNativeDriver:true}).start()},[]);return<Animated.View style={[ms.imgSpace,{height,opacity:f}]}><View style={ms.imgInner}/></Animated.View>}

function Wheel({nodes,radius,nodeSize,onSelect,sysIndex}){
  const COUNT=nodes.length;
  const STEP=(2*Math.PI)/COUNT,TOP=-Math.PI/2,center=radius+nodeSize+10,size=center*2;
  const rotRef=useRef(0);const[rv,setRv]=useState(0);const lastAng=useRef(0);const velRef=useRef(0);const wasDrag=useRef(false);const prevD=useRef(0);
  useEffect(()=>{rotRef.current=0;setRv(0)},[sysIndex]);
  const snapTo=useCallback(idx=>{const tg=-idx*STEP,df=tg-rotRef.current,sn=rotRef.current+df-Math.round(df/(2*Math.PI))*2*Math.PI,st=rotRef.current,dl=sn-st;let s=0;const anim=()=>{s++;const t=Math.min(s/16,1);rotRef.current=st+dl*(1-Math.pow(1-t,3));setRv(rotRef.current);if(t<1)requestAnimationFrame(anim);else{rotRef.current=sn;setRv(sn);if(onSelect)onSelect(idx)}};requestAnimationFrame(anim)},[onSelect,STEP]);
  const snapNearest=useCallback(()=>{const norm=((rotRef.current%(2*Math.PI))+2*Math.PI)%(2*Math.PI);let ci=0,cd=Infinity;for(let i=0;i<COUNT;i++){const pa=((TOP+i*STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),topA=((TOP%(2*Math.PI))+2*Math.PI)%(2*Math.PI),d=Math.min(Math.abs(pa-topA),2*Math.PI-Math.abs(pa-topA));if(d<cd){cd=d;ci=i}}snapTo(ci)},[snapTo,STEP,COUNT]);
  const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:e=>{lastAng.current=Math.atan2(e.nativeEvent.locationY-center,e.nativeEvent.locationX-center);velRef.current=0;wasDrag.current=false;prevD.current=0},
    onPanResponderMove:e=>{wasDrag.current=true;const a=Math.atan2(e.nativeEvent.locationY-center,e.nativeEvent.locationX-center);let d=a-lastAng.current;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;velRef.current=d;rotRef.current+=d;setRv(rotRef.current);lastAng.current=a;if(prevD.current!==0&&((prevD.current>0&&d<0)||(prevD.current<0&&d>0))){snapNearest()}prevD.current=d},
    onPanResponderRelease:e=>{if(!wasDrag.current){let best=-1,bd=Infinity;for(let i=0;i<COUNT;i++){const a=TOP+i*STEP+rotRef.current,px=center+radius*Math.cos(a),py=center+radius*Math.sin(a),d=Math.sqrt((e.nativeEvent.locationX-px)**2+(e.nativeEvent.locationY-py)**2);if(d<bd){bd=d;best=i}}if(bd<nodeSize*2&&best>=0)snapTo(best);return}if(Math.abs(velRef.current)>.015){const st=rotRef.current,dl=velRef.current*10;let s=0;const dc=()=>{s++;const t=Math.min(s/18,1);rotRef.current=st+dl*(1-Math.pow(1-t,2));setRv(rotRef.current);if(t<1)requestAnimationFrame(dc);else snapNearest()};requestAnimationFrame(dc)}else snapNearest()}
  }),[center,radius,nodeSize,COUNT,STEP,snapTo,snapNearest]);

  if(!COUNT)return null;
  return<View style={{width:size,height:size,alignSelf:'center'}}>
    {nodes.map((n,i)=>{const a=TOP+i*STEP+rv,norm=((rv%(2*Math.PI))+2*Math.PI)%(2*Math.PI),pa=((TOP+i*STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),topA=((TOP%(2*Math.PI))+2*Math.PI)%(2*Math.PI),dist=Math.min(Math.abs(pa-topA),2*Math.PI-Math.abs(pa-topA)),atTop=dist<.2,special=!!(n.is_mulank||n.is_bhagyank||n.is_day_master),op=atTop?1:.12+.4*(1-dist/Math.PI),x=center+radius*Math.cos(a)-nodeSize/2,y=center+radius*Math.sin(a)-nodeSize/2,sz=atTop?nodeSize*1.4:nodeSize,off=(sz-nodeSize)/2;
      return<View key={n.id+'_'+sysIndex} style={{position:'absolute',left:x-off,top:y-off,width:sz,height:sz,borderRadius:sz/2,borderWidth:atTop?1.5:.5,borderColor:atTop?GOLD:special?GOLD+'35':W(.05),backgroundColor:atTop?GOLD+'0C':'transparent',alignItems:'center',justifyContent:'center',opacity:op}}>
        <Text style={{fontSize:atTop?14:10,color:atTop?GOLD:special?GOLD:W(.35),fontWeight:atTop?'500':'300'}}>{n.label}</Text>
        {atTop&&n.sign?<Text style={{fontSize:8,color:W(.45),marginTop:1}}>{n.sign}{n.house?' H'+n.house:''}</Text>:null}
      </View>})}
    <View {...pan.panHandlers} style={{position:'absolute',width:size,height:size,zIndex:5}}/>
  </View>
}

export default function CoreChartScreen({visible,onClose,kundliData,onImpulse}){
  const[data,setData]=useState(null);
  const[curSys,setCurSys]=useState(0);
  const[selIdx,setSelIdx]=useState(null);
  const[revLvl,setRevLvl]=useState(0);
  const[inTrans,setInTrans]=useState(false);
  const csRef=useRef(0);const scrollRef=useRef(null);const vRef=useRef(null);const timerRef=useRef(null);
  const sl=useRef(new Animated.Value(SH)).current,fadeA=useRef(new Animated.Value(0)).current;
  const cF=useRef(new Animated.Value(1)).current,wF=useRef(new Animated.Value(1)).current;

  useEffect(()=>{csRef.current=curSys},[curSys]);

  const fetchData=useCallback(async()=>{const r=await fetch(`${API}/core-chart`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kundli_data:kundliData})});return await r.json()},[kundliData]);

  useEffect(()=>{
    if(!visible||!kundliData)return;
    setCurSys(0);csRef.current=0;setSelIdx(null);setRevLvl(0);setInTrans(false);cF.setValue(1);wF.setValue(1);
    Animated.parallel([Animated.spring(sl,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fadeA,{toValue:1,duration:300,useNativeDriver:true})]).start();
    const bd=kundliData?.raw?.birth_details||{},ck=`core_chart_${bd.year}_${bd.month}_${bd.day}`;
    (async()=>{
      try{
        const c=await AsyncStorage.getItem(ck);
        if(c){const{data:cd,ts}=JSON.parse(c);if(cd?.wheels&&Date.now()-ts<CACHE_TTL){setData(cd);console.log('[CoreChart] Loaded from cache');if(Date.now()-ts>REFRESH_AT)fetchData().then(f=>{if(f?.wheels){setData(f);AsyncStorage.setItem(ck,JSON.stringify({data:f,ts:Date.now()}))}}).catch(()=>{});return}}
        console.log('[CoreChart] Fetching fresh...');
        const f=await fetchData();
        console.log('[CoreChart] Got data, readings keys:',Object.keys(f?.readings||{}));
        setData(f);
        if(f?.wheels)AsyncStorage.setItem(ck,JSON.stringify({data:f,ts:Date.now()}));
      }catch(e){console.log('[CoreChart] Error:',e);try{setData(await fetchData())}catch(_){}}
    })();
  },[visible,kundliData]);

  const close=useCallback(()=>{
    if(timerRef.current)clearTimeout(timerRef.current);
    Animated.parallel([Animated.timing(sl,{toValue:SH,duration:250,easing:Easing.bezier(.4,0,1,1),useNativeDriver:true}),Animated.timing(fadeA,{toValue:0,duration:200,useNativeDriver:true})]).start(()=>onClose&&onClose());
  },[onClose]);

  const onNodeSelect=useCallback(idx=>{
    if(onImpulse)onImpulse();
    setSelIdx(idx);setRevLvl(0);
  },[onImpulse]);

  // Transition — the core function. Called after video or timeout.
  const doTransition=useCallback(()=>{
    if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null}
    Animated.timing(wF,{toValue:0,duration:250,useNativeDriver:true}).start(()=>{
      const next=(csRef.current+1)%SYS.length;
      setCurSys(next);csRef.current=next;setSelIdx(null);setRevLvl(0);
      wF.setValue(0);cF.setValue(0);
      Animated.timing(wF,{toValue:1,duration:500,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}).start(()=>{
        Animated.timing(cF,{toValue:1,duration:400,useNativeDriver:true}).start(()=>setInTrans(false));
      });
    });
  },[]);

  // Change lens — from button (scrolls up) or video tap (no scroll)
  const changeLens=useCallback((fromBottom)=>{
    if(inTrans)return;setInTrans(true);
    if(onImpulse)onImpulse();
    // Fade out content
    Animated.timing(cF,{toValue:0,duration:250,useNativeDriver:true}).start(()=>{
      const startTransition=()=>{
        // Try to play video, but set a 4s timeout as fallback
        timerRef.current=setTimeout(()=>{console.log('[CoreChart] Video timeout, forcing transition');doTransition()},4000);
        try{vRef.current?.setPositionAsync?.(0);vRef.current?.playAsync?.()}catch(e){}
        // If no video component at all, just transition immediately
        if(!VC){if(timerRef.current)clearTimeout(timerRef.current);setTimeout(doTransition,500)}
      };
      if(fromBottom){scrollRef.current?.scrollTo({y:0,animated:true});setTimeout(startTransition,400)}
      else{startTransition()}
    });
  },[inTrans,onImpulse,doTransition]);

  const handlePlayback=useCallback(st=>{
    if(st.didJustFinish){if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null}doTransition()}
  },[doTransition]);

  if(!visible)return null;

  const wheels=data?.wheels||{};
  const readings=data?.readings||{};
  const sk=SYS[curSys];
  const sysWheelData=wheels[sk]||{nodes:[]};
  const sysReadings=readings[sk]||{};
  const nodes=sysWheelData.nodes||[];
  const nd=selIdx!==null&&nodes[selIdx]?nodes[selIdx]:null;
  const nr=nd&&sysReadings[nd.id]?sysReadings[nd.id]:null;
  const hl=sysReadings.headline||'';
  const isLast=curSys===SYS.length-1;
  const imgP=[1,0,2,1,0][curSys];
  const R=WR[curSys],N=NSZ[curSys],wSz=(R+N+10)*2;

  // Smart reveal: what exists?
  const hasWhat=!!(nr&&nr.what);
  const hasSig=!!(nr&&nr.significance);
  const hasEffect=!!(nr&&nr.effect);
  const hasDo=!!(nr&&(nr.do?.length>0||nr.dont?.length>0));
  const special=!!(nd&&(nd.is_mulank||nd.is_bhagyank||nd.is_day_master));

  // Auto-advance if middle levels empty
  let effLvl=revLvl;
  if(effLvl===0&&!hasSig&&hasEffect)effLvl=1;// skip to effect CTA
  if(effLvl===1&&!hasSig)effLvl=2;
  const fullyRevealed=effLvl>=2||(effLvl===0&&!hasSig&&!hasEffect);

  return<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <Animated.View style={[ms.bk,{opacity:fadeA}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1}/></Animated.View>
    <Animated.View style={[ms.sh,{transform:[{translateY:sl}]}]}>
      <View style={ms.hW}><View style={ms.h}/></View>
      <TouchableOpacity style={ms.xB} onPress={close} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={ms.xT}>✕</Text></TouchableOpacity>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false}>
        <Text style={ms.sysLabel}>{SYS_L[curSys]}</Text>

        {/* WHEEL */}
        <Animated.View style={{opacity:wF}}>
          <View style={{position:'relative',alignItems:'center'}}>
            <Wheel nodes={nodes} radius={R} nodeSize={N} onSelect={onNodeSelect} sysIndex={curSys}/>
            <TouchableOpacity activeOpacity={.8} onPress={()=>changeLens(false)} style={{position:'absolute',top:wSz/2-35,left:SW/2-35,width:70,height:70,borderRadius:35,overflow:'hidden',zIndex:3}}>
              {VC?<VC ref={vRef} source={{uri:getMediaUri(pick())}} style={{width:70,height:70}} resizeMode="cover" shouldPlay={false} isLooping={false} volume={0} onPlaybackStatusUpdate={handlePlayback} onError={()=>doTransition()}/>:null}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* HEADLINE */}
        {hl&&!inTrans?<Animated.View style={{opacity:cF}}><Text style={ms.hl}>{hl}</Text></Animated.View>:null}

        {/* NODE READING */}
        {nr&&!inTrans?<Animated.View style={{opacity:cF,paddingHorizontal:28}}>
          {/* Title */}
          <Reveal visible={true}><Text style={[ms.nT,special?{color:GOLD}:null]}>{nr.title||nd.label}</Text></Reveal>

          {/* What */}
          {hasWhat?<Reveal visible={true}><Text style={ms.nW}>{nr.what}</Text>{imgP===0?<ImageSpace height={[150,140,160,145,155][curSys]}/>:null}</Reveal>:null}

          {/* CTA → significance */}
          {effLvl===0&&hasSig?<Reveal visible={true} delay={200}><CTA text={nr.cta_significance||"Why it matters"} onPress={()=>setRevLvl(1)}/></Reveal>:null}

          {/* CTA → effect (skip sig) */}
          {effLvl===0&&!hasSig&&hasEffect?<Reveal visible={true} delay={200}><CTA text={nr.cta_effect||"How it affects you now"} onPress={()=>setRevLvl(2)}/></Reveal>:null}

          {/* Significance */}
          {effLvl>=1&&hasSig?<Reveal visible={true}><Text style={ms.nS}>{nr.significance}</Text>{imgP===1?<ImageSpace height={[160,150,140,170,145][curSys]}/>:null}</Reveal>:null}

          {/* CTA → effect */}
          {effLvl===1&&hasEffect?<Reveal visible={true} delay={200}><CTA text={nr.cta_effect||"How it affects you now"} onPress={()=>setRevLvl(2)}/></Reveal>:null}

          {/* Effect */}
          {effLvl>=2&&hasEffect?<Reveal visible={true}><Text style={ms.nE}>{nr.effect}</Text>{imgP===2?<ImageSpace height={[140,155,150,160,145][curSys]}/>:null}</Reveal>:null}

          {/* Do/Dont */}
          {effLvl>=2&&hasDo?<Reveal visible={true}><View style={ms.vW}>
            {nr.do?.length>0?<View style={ms.vC}><Text style={ms.vL}>Do</Text>{nr.do.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}
            {nr.dont?.length>0?<View style={ms.vC}><Text style={ms.vL}>Don't</Text>{nr.dont.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}
          </View></Reveal>:null}
        </Animated.View>:null}

        {/* Prompt */}
        {selIdx===null&&!inTrans&&data?<Animated.View style={{opacity:cF,paddingHorizontal:28,paddingTop:20}}><Text style={ms.pr}>{sysReadings.prompt_text||"Spin the wheel"}</Text></Animated.View>:null}

        {/* LENS CHANGE */}
        {nr&&fullyRevealed&&!inTrans&&!isLast?<Animated.View style={{opacity:cF,paddingHorizontal:28,paddingTop:8}}><CTA text={'See through '+SYS_L[(curSys+1)%5]+' eyes'} onPress={()=>changeLens(true)}/></Animated.View>:null}

        {/* GOLD CLOSING */}
        {nr&&fullyRevealed&&isLast?<Animated.View style={{opacity:cF,paddingHorizontal:28}}><View style={ms.clW}><View style={ms.clB}/><Text style={ms.clT}>{(readings.numerology||{}).closing||'Every system sees the same you. The lens changes. You don\'t.'}</Text></View></Animated.View>:null}

        <View style={{height:100}}/>
      </ScrollView>
    </Animated.View>
  </View>
}

const ms=StyleSheet.create({
  bk:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},
  sh:{position:'absolute',bottom:0,left:0,right:0,height:SH*.95,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:.5,borderColor:W(.05)},
  hW:{alignItems:'center',paddingTop:8,paddingBottom:4,zIndex:20},h:{width:40,height:4,borderRadius:2,backgroundColor:W(.45)},
  xB:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(.2),fontWeight:'300'},
  sC:{paddingBottom:40},
  sysLabel:{fontSize:9,letterSpacing:4,color:W(.15),fontWeight:'400',textTransform:'uppercase',textAlign:'center',marginBottom:4,marginTop:8},
  hl:{fontFamily:'PlayfairDisplay',fontSize:20,lineHeight:30,color:W(.85),textAlign:'center',paddingHorizontal:40,marginTop:16,marginBottom:8},
  nT:{fontFamily:'PlayfairDisplay',fontSize:18,lineHeight:26,color:W(.88),marginBottom:12,marginTop:16},
  nW:{fontSize:14,lineHeight:24,color:W(.72),fontWeight:'300',marginBottom:14},
  nS:{fontSize:14,lineHeight:24,color:W(.6),fontWeight:'300',marginBottom:14},
  nE:{fontSize:14,lineHeight:24,color:W(.55),fontWeight:'300',fontStyle:'italic',marginBottom:16},
  pr:{fontSize:12,color:W(.15),fontWeight:'200',textAlign:'center',letterSpacing:1},
  ctaBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(.1),paddingVertical:18,paddingHorizontal:22,marginVertical:22},
  ctaL:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(.88),fontStyle:'italic',flex:1,marginRight:14},
  ctaA:{fontSize:16,color:W(.3),fontWeight:'200'},
  vW:{flexDirection:'row',marginVertical:8,gap:40},vC:{flex:1},
  vL:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,color:W(.28),marginBottom:14,letterSpacing:2,textTransform:'uppercase'},
  vI:{fontSize:15,lineHeight:24,color:W(.78),fontWeight:'400',marginBottom:4},
  clW:{marginTop:36,paddingTop:28},clB:{width:24,height:1,backgroundColor:GOLD,alignSelf:'center',marginBottom:24,opacity:.4},
  clT:{fontFamily:'PlayfairDisplay',fontSize:17,lineHeight:26,color:GOLD,textAlign:'center',fontStyle:'italic',opacity:.85},
  imgSpace:{width:'100%',borderRadius:6,overflow:'hidden',marginVertical:16},
  imgInner:{flex:1,backgroundColor:W(.03),borderWidth:.5,borderColor:W(.04),borderRadius:6},
});