import React,{useState,useRef,useCallback,useEffect,useMemo} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,Animated,Easing,Dimensions,PanResponder,Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MediaView from '../components/MediaView';
let VC=null;try{VC=require('expo-av').Video}catch(_){try{const E=require('expo-video');VC=E.VideoView||E.Video}catch(__){}}
let getMediaUri;try{({getMediaUri}=require('../config/mediaCache'))}catch(_){getMediaUri=p=>'https://api.plutto.space/static/'+p}
const{width:SW,height:SH}=Dimensions.get('window'),W=a=>`rgba(255,255,255,${a})`,GOLD='#D4AF37';
const API='https://api.plutto.space/api/public';
const SYS=['vedic','kp','western','chinese','numerology'],SYS_L=['Vedic','KP','Western','Chinese','Numerology'];
const WR=[118,128,122,95,108],NSZ=[38,32,36,44,40],CACHE_TTL=7*24*60*60*1000,REFRESH_AT=6*24*60*60*1000;
const VIDS=['transitions/lens_1.mp4','transitions/lens_2.mp4','transitions/lens_3.mp4','transitions/lens_4.mp4','transitions/lens_5.mp4'];
const pick=()=>getMediaUri(VIDS[Math.floor(Math.random()*VIDS.length)]);
function CTA({text,onPress}){const b=useRef(new Animated.Value(.08)).current;useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(b,{toValue:.18,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(b,{toValue:.08,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false})])).start()},[]);return<TouchableOpacity activeOpacity={.6} onPress={onPress}><Animated.View style={[ms.ctaBox,{borderColor:b.interpolate({inputRange:[.08,.18],outputRange:[W(.08),W(.18)]})}]}><Text style={ms.ctaL}>{text}</Text><Text style={ms.ctaA}>→</Text></Animated.View></TouchableOpacity>}
function Reveal({visible,delay=0,children}){const o=useRef(new Animated.Value(0)).current,t=useRef(new Animated.Value(24)).current;useEffect(()=>{if(visible){o.setValue(0);t.setValue(24);Animated.parallel([Animated.timing(o,{toValue:1,duration:600,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}),Animated.timing(t,{toValue:0,duration:600,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()}},[visible]);if(!visible)return null;return<Animated.View style={{opacity:o,transform:[{translateY:t}]}}>{children}</Animated.View>}

// Node — tries to load image for ANY system. If image exists on backend, shows it. Otherwise text only.
function WheelNode({n,x,y,sz,atTop,special,op,sysName,showImg}){
  const txtO=useRef(new Animated.Value(1)).current;
  const imgO=useRef(new Animated.Value(0)).current;
  const[imgExists,setImgExists]=useState(false);
  const imgUri='planets/'+sysName+'/'+n.id+'.png';
  const shouldAnimate=atTop&&showImg&&imgExists;

  useEffect(()=>{
    if(shouldAnimate){
      Animated.parallel([Animated.timing(txtO,{toValue:0,duration:400,useNativeDriver:true}),Animated.timing(imgO,{toValue:1,duration:500,delay:200,useNativeDriver:true})]).start();
    }else{
      Animated.parallel([Animated.timing(txtO,{toValue:1,duration:300,useNativeDriver:true}),Animated.timing(imgO,{toValue:0,duration:300,useNativeDriver:true})]).start();
    }
  },[shouldAnimate]);

  const innerSz=sz*0.65;
  return<View style={{position:'absolute',left:x,top:y,width:sz,height:sz,borderRadius:sz/2,borderWidth:atTop?1.5:.5,borderColor:atTop?GOLD:special?GOLD+'35':W(.06),backgroundColor:atTop?GOLD+'0C':'transparent',alignItems:'center',justifyContent:'center',opacity:op}}>
    <Animated.View style={{opacity:txtO,alignItems:'center',justifyContent:'center'}}>
      <Text style={{fontSize:atTop?12:8,color:atTop?GOLD:special?GOLD:W(.4),fontWeight:atTop?'500':'300'}} numberOfLines={1}>{n.label}</Text>
      {atTop&&n.sign?<Text style={{fontSize:7,color:W(.4),marginTop:1}} numberOfLines={1}>{n.sign}</Text>:null}
    </Animated.View>
    {atTop?<Animated.View style={{position:'absolute',opacity:imgO}}>
      <MediaView uri={imgUri} style={{width:innerSz,height:innerSz}} rounded onLoaded={()=>setImgExists(true)} onFailed={()=>setImgExists(false)}/>
    </Animated.View>:null}
  </View>
}

function MediaSlot({section,system,slot,height}){
  const[ok,setOk]=useState(false);const[tryIdx,setTryIdx]=useState(0);
  const exts=['.jpg','.png','.mp4','.gif'];
  const path='readings/'+section+'/'+system+'/slot_'+slot+exts[tryIdx];
  return<View style={{width:'100%',height:ok?height:0,marginVertical:ok?24:0}}>
    <MediaView uri={path} style={{width:'100%',height}} onLoaded={()=>setOk(true)} onFailed={()=>{if(tryIdx<exts.length-1)setTryIdx(tryIdx+1)}}/>
  </View>
}
function Wheel({nodes,radius,nodeSize,onSelect,sysIndex,sysName,selectedIdx,showImg}){
  const COUNT=nodes.length,STEP=(2*Math.PI)/COUNT,TOP=-Math.PI/2,center=radius+nodeSize+10,size=center*2;
  const rotRef=useRef(0);const[rv,setRv]=useState(0);const lastAng=useRef(0);const velRef=useRef(0);const wasDrag=useRef(false);const prevD=useRef(0);
  useEffect(()=>{rotRef.current=0;setRv(0)},[sysIndex]);
  const snapTo=useCallback(idx=>{const tg=-idx*STEP,df=tg-rotRef.current,sn=rotRef.current+df-Math.round(df/(2*Math.PI))*2*Math.PI,st=rotRef.current,dl=sn-st;let s=0;const anim=()=>{s++;const t=Math.min(s/16,1);rotRef.current=st+dl*(1-Math.pow(1-t,3));setRv(rotRef.current);if(t<1)requestAnimationFrame(anim);else{rotRef.current=sn;setRv(sn);if(onSelect)onSelect(idx)}};requestAnimationFrame(anim)},[onSelect,STEP]);
  const snapNearest=useCallback(()=>{const norm=((rotRef.current%(2*Math.PI))+2*Math.PI)%(2*Math.PI);let ci=0,cd=Infinity;for(let i=0;i<COUNT;i++){const pa=((TOP+i*STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),topA=((TOP%(2*Math.PI))+2*Math.PI)%(2*Math.PI),d=Math.min(Math.abs(pa-topA),2*Math.PI-Math.abs(pa-topA));if(d<cd){cd=d;ci=i}}snapTo(ci)},[snapTo,STEP,COUNT]);
  const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:e=>{lastAng.current=Math.atan2(e.nativeEvent.locationY-center,e.nativeEvent.locationX-center);velRef.current=0;wasDrag.current=false;prevD.current=0},onPanResponderMove:e=>{wasDrag.current=true;const a=Math.atan2(e.nativeEvent.locationY-center,e.nativeEvent.locationX-center);let d=a-lastAng.current;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;velRef.current=d;rotRef.current+=d;setRv(rotRef.current);lastAng.current=a;if(prevD.current!==0&&((prevD.current>0&&d<0)||(prevD.current<0&&d>0)))snapNearest();prevD.current=d},onPanResponderRelease:e=>{if(!wasDrag.current){let best=-1,bd=Infinity;for(let i=0;i<COUNT;i++){const a=TOP+i*STEP+rotRef.current,px=center+radius*Math.cos(a),py=center+radius*Math.sin(a),d=Math.sqrt((e.nativeEvent.locationX-px)**2+(e.nativeEvent.locationY-py)**2);if(d<bd){bd=d;best=i}}if(bd<nodeSize*2&&best>=0)snapTo(best);return}if(Math.abs(velRef.current)>.015){const st=rotRef.current,dl=velRef.current*10;let s=0;const dc=()=>{s++;const t=Math.min(s/18,1);rotRef.current=st+dl*(1-Math.pow(1-t,2));setRv(rotRef.current);if(t<1)requestAnimationFrame(dc);else snapNearest()};requestAnimationFrame(dc)}else snapNearest()}}),[center,radius,nodeSize,COUNT,STEP,snapTo,snapNearest]);
  if(!COUNT)return null;
  return<View style={{width:size,height:size,alignSelf:'center'}}>{nodes.map((n,i)=>{const a=TOP+i*STEP+rv,norm=((rv%(2*Math.PI))+2*Math.PI)%(2*Math.PI),pa=((TOP+i*STEP+norm)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),topA=((TOP%(2*Math.PI))+2*Math.PI)%(2*Math.PI),dist=Math.min(Math.abs(pa-topA),2*Math.PI-Math.abs(pa-topA)),atTop=dist<.2,special=Boolean(n.is_mulank||n.is_bhagyank||n.is_day_master),op=atTop?1:0.25+0.5*(1-dist/Math.PI),x=center+radius*Math.cos(a)-nodeSize/2,y=center+radius*Math.sin(a)-nodeSize/2,sz=atTop?nodeSize*1.4:nodeSize,off=(sz-nodeSize)/2;return<WheelNode key={n.id+'_'+sysIndex} n={n} x={x-off} y={y-off} sz={sz} atTop={atTop} special={special} op={op} sysName={sysName} showImg={atTop&&i===selectedIdx&&showImg}/>})}<View {...pan.panHandlers} style={{position:'absolute',width:size,height:size,zIndex:5}}/></View>
}

export default function CoreChartScreen({visible,onClose,kundliData,onImpulse}){
  const[data,setData]=useState(null),[curSys,setCurSys]=useState(0),[selIdx,setSelIdx]=useState(null),[revLvl,setRevLvl]=useState(0),[trans,setTrans]=useState(false),[showImg,setShowImg]=useState(true);
  const csRef=useRef(0),scrollRef=useRef(null),vRef=useRef(null),tmr=useRef(null);
  const sl=useRef(new Animated.Value(SH)).current,fadeA=useRef(new Animated.Value(0)).current,cF=useRef(new Animated.Value(1)).current,wF=useRef(new Animated.Value(1)).current;
  const[vidSrc,setVidSrc]=useState(pick);
  useEffect(()=>{csRef.current=curSys},[curSys]);
  const hPan=useRef(PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dy)>10,onPanResponderRelease:(_,g)=>{if(g.dy>60)onClose?.()}})).current;
  const fetchData=useCallback(async()=>{const r=await fetch(`${API}/core-chart`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kundli_data:kundliData})});return await r.json()},[kundliData]);
  useEffect(()=>{if(!visible||!kundliData)return;setCurSys(0);csRef.current=0;setSelIdx(null);setRevLvl(0);setTrans(false);setShowImg(true);cF.setValue(1);wF.setValue(1);Animated.parallel([Animated.spring(sl,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fadeA,{toValue:1,duration:300,useNativeDriver:true})]).start();const bd=kundliData?.raw?.birth_details||{},ck=`core_chart_${bd.year}_${bd.month}_${bd.day}`;(async()=>{try{const c=await AsyncStorage.getItem(ck);if(c){const{data:cd,ts}=JSON.parse(c);if(cd?.wheels&&Date.now()-ts<CACHE_TTL){setData(cd);if(Date.now()-ts>REFRESH_AT)fetchData().then(f=>{if(f?.wheels){setData(f);AsyncStorage.setItem(ck,JSON.stringify({data:f,ts:Date.now()}))}}).catch(()=>{});return}}const f=await fetchData();setData(f);if(f?.wheels)AsyncStorage.setItem(ck,JSON.stringify({data:f,ts:Date.now()}))}catch(e){try{setData(await fetchData())}catch(_){}}})()},[visible,kundliData]);
  useEffect(()=>{if(trans){setTimeout(()=>{try{vRef.current?.setPositionAsync?.(0);vRef.current?.playAsync?.()}catch(e){}},300)}},[trans]);
  const onScroll=useCallback(e=>{setShowImg(e.nativeEvent.contentOffset.y<30)},[]);
  const close=useCallback(()=>{Animated.parallel([Animated.timing(sl,{toValue:SH,duration:250,easing:Easing.bezier(.4,0,1,1),useNativeDriver:true}),Animated.timing(fadeA,{toValue:0,duration:200,useNativeDriver:true})]).start(()=>onClose?.())},[onClose]);
  const onNodeSelect=useCallback(idx=>{onImpulse?.();setSelIdx(idx);setRevLvl(0);setShowImg(true);scrollRef.current?.scrollTo({y:0,animated:true})},[onImpulse]);
  const finishTrans=useCallback(()=>{if(tmr.current){clearTimeout(tmr.current);tmr.current=null}const n=(csRef.current+1)%SYS.length;setCurSys(n);csRef.current=n;setSelIdx(null);setRevLvl(0);setTrans(false);setShowImg(true);setVidSrc(pick());scrollRef.current?.scrollTo({y:0,animated:false});wF.setValue(0);cF.setValue(0);Animated.timing(wF,{toValue:1,duration:500,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}).start(()=>{Animated.timing(cF,{toValue:1,duration:400,useNativeDriver:true}).start()})},[]);
  const trigLens=useCallback(()=>{if(trans)return;onImpulse?.();Animated.timing(cF,{toValue:0,duration:300,useNativeDriver:true}).start(()=>{Animated.timing(wF,{toValue:0,duration:250,useNativeDriver:true}).start(()=>{scrollRef.current?.scrollTo({y:0,animated:false});setTrans(true);tmr.current=setTimeout(finishTrans,4500);if(!VC)setTimeout(finishTrans,800)})})},[trans,onImpulse,finishTrans]);
  const hPB=useCallback(st=>{if(st.didJustFinish)finishTrans()},[finishTrans]);
  if(!visible)return null;
  const wheels=data?.wheels||{},readings=data?.readings||{},sk=SYS[curSys],sW=wheels[sk]||{nodes:[]},sR=readings[sk]||{};
  const nodes=sW.nodes||[],nd=selIdx!==null&&nodes[selIdx]?nodes[selIdx]:null,nr=nd&&sR[nd.id]?sR[nd.id]:null;
  const hl=sR.headline||'',isLast=curSys===SYS.length-1,imgP=[1,0,2,1,0][curSys],R=WR[curSys],N=NSZ[curSys];
  const hasWhat=Boolean(nr&&nr.what),hasSig=Boolean(nr&&nr.significance),hasEffect=Boolean(nr&&nr.effect),hasDo=Boolean(nr&&(nr.do?.length>0||nr.dont?.length>0));
  const special=Boolean(nd&&(nd.is_mulank||nd.is_bhagyank||nd.is_day_master));
  let effLvl=revLvl;if(effLvl===0&&!hasSig&&hasEffect)effLvl=1;if(effLvl===1&&!hasSig)effLvl=2;
  const fullyRevealed=effLvl>=2||(effLvl===0&&!hasSig&&!hasEffect);
  return<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <Animated.View style={[ms.bk,{opacity:fadeA}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1}/></Animated.View>
    <Animated.View style={[ms.sh,{transform:[{translateY:sl}]}]}>
      <View {...hPan.panHandlers} style={ms.hW}><View style={ms.h}/></View>
      <TouchableOpacity style={ms.xB} onPress={close} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={ms.xT}>✕</Text></TouchableOpacity>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false} scrollEnabled={!trans} onScroll={onScroll} scrollEventThrottle={60}>
        {trans?<View style={ms.vidWrap}><MediaView uri={vidSrc} style={{width:'100%',height:'100%'}} autoPlay onFinish={finishTrans} onFailed={finishTrans}/></View>:null}
        {!trans?<View>
          <Text style={ms.sysLabel}>{SYS_L[curSys]}</Text>
          <Animated.View style={{opacity:wF}}><Wheel nodes={nodes} radius={R} nodeSize={N} onSelect={onNodeSelect} sysIndex={curSys} sysName={sk} selectedIdx={selIdx} showImg={showImg}/></Animated.View>
          <Animated.View style={{opacity:cF}}>
            {hl?<Text style={ms.hl}>{hl}</Text>:null}
            {nr?<View style={{paddingHorizontal:28}}>
              <Reveal visible={true}><Text style={[ms.nT,special?{color:GOLD}:null]}>{nr.title||nd.label}</Text></Reveal>
              {hasWhat?<Reveal visible={true}><Text style={ms.nW}>{nr.what}</Text>{imgP===0?<MediaSlot section='core' system={sk} slot={0} height={[150,140,160,145,155][curSys]}/>:null}</Reveal>:null}
              {effLvl===0&&hasSig?<Reveal visible={true} delay={200}><CTA text={nr.cta_significance||"Why it matters"} onPress={()=>setRevLvl(1)}/></Reveal>:null}
              {effLvl===0&&!hasSig&&hasEffect?<Reveal visible={true} delay={200}><CTA text={nr.cta_effect||"How it affects you now"} onPress={()=>setRevLvl(2)}/></Reveal>:null}
              {effLvl>=1&&hasSig?<Reveal visible={true}><Text style={ms.nS}>{nr.significance}</Text>{imgP===1?<MediaSlot section='core' system={sk} slot={1} height={[160,150,140,170,145][curSys]}/>:null}</Reveal>:null}
              {effLvl===1&&hasEffect?<Reveal visible={true} delay={200}><CTA text={nr.cta_effect||"How it affects you now"} onPress={()=>setRevLvl(2)}/></Reveal>:null}
              {effLvl>=2&&hasEffect?<Reveal visible={true}><Text style={ms.nE}>{nr.effect}</Text>{imgP===2?<MediaSlot section='core' system={sk} slot={2} height={[140,155,150,160,145][curSys]}/>:null}</Reveal>:null}
              {effLvl>=2&&hasDo?<Reveal visible={true}><View style={ms.vW}>{nr.do?.length>0?<View style={ms.vC}><Text style={ms.vL}>Do</Text>{nr.do.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}{nr.dont?.length>0?<View style={ms.vC}><Text style={ms.vL}>Don't</Text>{nr.dont.map((x,i)=><Text key={i} style={ms.vI}>{x}</Text>)}</View>:null}</View></Reveal>:null}
            </View>:null}
            {selIdx===null&&data?<View style={{paddingHorizontal:28,paddingTop:20}}><Text style={ms.pr}>{sR.prompt_text||'Spin the wheel'}</Text></View>:null}
            {nr&&fullyRevealed&&!isLast?<View style={{paddingHorizontal:28,paddingTop:8}}><CTA text={'See through '+SYS_L[(curSys+1)%5]+' eyes'} onPress={trigLens}/></View>:null}
            {nr&&fullyRevealed&&isLast?<View style={{paddingHorizontal:28}}><View style={ms.clW}><View style={ms.clB}/><Text style={ms.clT}>{(readings.numerology||{}).closing||'Every system sees the same you.'}</Text></View></View>:null}
          </Animated.View>
        </View>:null}
        <View style={{height:100}}/>
      </ScrollView>
    </Animated.View>
  </View>
}
const ms=StyleSheet.create({bk:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},sh:{position:'absolute',bottom:0,left:0,right:0,height:SH*.95,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:.5,borderColor:W(.05)},hW:{alignItems:'center',paddingTop:10,paddingBottom:8,zIndex:20},h:{width:44,height:5,borderRadius:3,backgroundColor:W(.45)},xB:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(.2),fontWeight:'300'},sC:{paddingBottom:40},sysLabel:{fontSize:9,letterSpacing:4,color:W(.15),fontWeight:'400',textTransform:'uppercase',textAlign:'center',marginBottom:4,marginTop:8},hl:{fontFamily:'PlayfairDisplay',fontSize:20,lineHeight:30,color:W(.85),textAlign:'center',paddingHorizontal:40,marginTop:16,marginBottom:8},nT:{fontFamily:'PlayfairDisplay',fontSize:18,lineHeight:26,color:W(.88),marginBottom:12,marginTop:16},nW:{fontSize:14,lineHeight:24,color:W(.72),fontWeight:'300',marginBottom:14},nS:{fontSize:14,lineHeight:24,color:W(.6),fontWeight:'300',marginBottom:14},nE:{fontSize:14,lineHeight:24,color:W(.55),fontWeight:'300',fontStyle:'italic',marginBottom:16},pr:{fontSize:12,color:W(.15),fontWeight:'200',textAlign:'center',letterSpacing:1},ctaBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(.1),paddingVertical:20,paddingHorizontal:24,marginVertical:22},ctaL:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(.88),fontStyle:'italic',flex:1,marginRight:14},ctaA:{fontSize:16,color:W(.3),fontWeight:'200'},vW:{flexDirection:'row',marginVertical:12,gap:40},vC:{flex:1},vL:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,color:W(.28),marginBottom:16,letterSpacing:2,textTransform:'uppercase'},vI:{fontSize:15,lineHeight:26,color:W(.78),fontWeight:'400',marginBottom:6},clW:{marginTop:36,paddingTop:28},clB:{width:24,height:1,backgroundColor:GOLD,alignSelf:'center',marginBottom:24,opacity:.4},clT:{fontFamily:'PlayfairDisplay',fontSize:17,lineHeight:26,color:GOLD,textAlign:'center',fontStyle:'italic',opacity:.85},vidWrap:{width:SW*.75,height:SW*.42,alignSelf:'center',borderRadius:8,overflow:'hidden',marginTop:SH*.45},vid:{width:'100%',height:'100%'}});