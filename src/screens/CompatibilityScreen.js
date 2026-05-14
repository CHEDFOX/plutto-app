import React,{useState,useRef,useCallback,useEffect,useMemo} from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ScrollView,TextInput,Animated,Easing,Dimensions,PanResponder,Platform,UIManager} from 'react-native';
let VC=null;try{VC=require('expo-av').Video}catch(_){try{const E=require('expo-video');VC=E.VideoView||E.Video}catch(__){}}
if(Platform.OS==='android'&&UIManager.setLayoutAnimationEnabledExperimental)UIManager.setLayoutAnimationEnabledExperimental(true);
const{width:SW,height:SH}=Dimensions.get('window'),W=a=>`rgba(255,255,255,${a})`,GOLD='#D4AF37',API='https://api.plutto.space/api/public',TVID='https://api.plutto.space/static/transitions/lens_change.mp4';
const SYS=['vedic','kp','western','chinese','numerology'],MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],GEN=['Male','Female','Other'];
function CTA({text,onPress}){const b=useRef(new Animated.Value(.08)).current;useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(b,{toValue:.18,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(b,{toValue:.08,duration:3e3,easing:Easing.inOut(Easing.sin),useNativeDriver:false})])).start()},[]);return<TouchableOpacity activeOpacity={.6} onPress={onPress}><Animated.View style={[zs.cB,{borderColor:b.interpolate({inputRange:[.08,.18],outputRange:[W(.08),W(.18)]})}]}><Text style={zs.cL}>{text}</Text><Text style={zs.cA}>→</Text></Animated.View></TouchableOpacity>}
function Reveal({visible,delay=0,skipAnim:sk=false,children}){const o=useRef(new Animated.Value(sk?1:0)).current,t=useRef(new Animated.Value(sk?0:30)).current;useEffect(()=>{if(visible&&!sk){o.setValue(0);t.setValue(30);Animated.parallel([Animated.timing(o,{toValue:1,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true}),Animated.timing(t,{toValue:0,duration:700,delay,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()}},[visible]);if(!visible)return null;return<Animated.View style={{opacity:o,transform:[{translateY:t}]}}>{children}</Animated.View>}
function Verdict({d,n}){return<View style={zs.vW}><View style={zs.vC}><Text style={zs.vL}>Do</Text>{(d||[]).map((x,i)=><Text key={i} style={zs.vI}>{x}</Text>)}</View><View style={zs.vC}><Text style={zs.vL}>Don't</Text>{(n||[]).map((x,i)=><Text key={i} style={zs.vI}>{x}</Text>)}</View></View>}
function TypeWriter({text,speed=40,style}){const[s,setS]=useState(0),w=useMemo(()=>(text||'').split(' '),[text]);useEffect(()=>{setS(0);if(!text)return;let i=0;const t=setInterval(()=>{i++;setS(i);if(i>=w.length)clearInterval(t)},speed);return()=>clearInterval(t)},[text]);return<Text style={style}>{w.slice(0,s).join(' ')}</Text>}

function RingPicker({items,radius:R,nodeSize:NS=28,fontSize:FS=12,onSelect,initialIndex:II=0}){
const C=items.length,ST=(2*Math.PI)/C,B=Math.PI/2,ctr=R+NS;const rot=useRef(-II*ST),la=useRef(0),vel=useRef(0),wd=useRef(false),[rv,setRv]=useState(-II*ST);
const snap=useCallback(idx=>{const tg=-idx*ST,df=tg-rot.current,sn=rot.current+df-Math.round(df/(2*Math.PI))*2*Math.PI,st=rot.current,dl=sn-st;let s=0;const a=()=>{s++;const t=Math.min(s/14,1);rot.current=st+dl*(1-Math.pow(1-t,3));setRv(rot.current);t<1?requestAnimationFrame(a):(rot.current=sn,setRv(sn),onSelect&&onSelect(idx))};requestAnimationFrame(a)},[onSelect,ST]);
const snapN=useCallback(r=>{const n=((r%(2*Math.PI))+2*Math.PI)%(2*Math.PI);let ci=0,cd=1/0;for(let i=0;i<C;i++){const p=((B+i*ST+n)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),d=Math.min(Math.abs(p-B),2*Math.PI-Math.abs(p-B));d<cd&&(cd=d,ci=i)}snap(ci)},[snap,ST,C]);
const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:e=>{la.current=Math.atan2(e.nativeEvent.locationY-ctr,e.nativeEvent.locationX-ctr);vel.current=0;wd.current=false},onPanResponderMove:e=>{wd.current=true;const a=Math.atan2(e.nativeEvent.locationY-ctr,e.nativeEvent.locationX-ctr);let d=a-la.current;d>Math.PI&&(d-=Math.PI*2);d<-Math.PI&&(d+=Math.PI*2);vel.current=d;rot.current+=d;setRv(rot.current);la.current=a},onPanResponderRelease:e=>{if(!wd.current){let b=-1,bd=1/0;for(let i=0;i<C;i++){const a=B+i*ST+rot.current,px=ctr+R*Math.cos(a),py=ctr+R*Math.sin(a),d=Math.sqrt((e.nativeEvent.locationX-px)**2+(e.nativeEvent.locationY-py)**2);d<bd&&(bd=d,b=i)}bd<NS*1.5&&b>=0&&snap(b);return}const v=vel.current;if(Math.abs(v)>.02){const st=rot.current,dl=v*10;let s=0;const dc=()=>{s++;const t=Math.min(s/18,1);rot.current=st+dl*(1-Math.pow(1-t,2));setRv(rot.current);t<1?requestAnimationFrame(dc):snapN(rot.current)};requestAnimationFrame(dc)}else snapN(rot.current)}})).current;
const sz=(R+NS)*2;return<View style={{width:sz,height:sz,position:'absolute'}}>{items.map((item,i)=>{const a=B+i*ST+rv,n=((rv%(2*Math.PI))+2*Math.PI)%(2*Math.PI),p=((B+i*ST+n)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),iS=Math.min(Math.abs(p-B),2*Math.PI-Math.abs(p-B))<.15,x=ctr+R*Math.cos(a)-NS/2,y=ctr+R*Math.sin(a)-NS/2,nd=Math.min(Math.abs(a-B),2*Math.PI-Math.abs(a-B)),op=iS?1:.15+.35*(1-nd/Math.PI);return<View key={i} style={{position:'absolute',left:x,top:y,width:NS,height:NS,alignItems:'center',justifyContent:'center',opacity:op}}><Text style={{fontSize:iS?FS+3:FS,color:iS?GOLD:W(.3),fontWeight:iS?'500':'200'}}>{item}</Text></View>})}<View {...pan.panHandlers} style={{position:'absolute',width:sz,height:sz,zIndex:5}}/></View>}

function YearArc({onSelect,initialYear:IY=1990}){const yrs=useMemo(()=>Array.from({length:86},(_,i)=>1940+i),[]),sr=useRef(null),IW=52,CO=SW/2-IW/2,[sel,setSel]=useState(IY);useEffect(()=>{const i=yrs.indexOf(IY);i>=0&&setTimeout(()=>sr.current?.scrollTo({x:i*IW,animated:false}),100)},[]);const hs=useCallback(e=>{const x=e.nativeEvent.contentOffset.x,i=Math.round(x/IW),yr=yrs[Math.max(0,Math.min(i,yrs.length-1))];yr!==sel&&(setSel(yr),onSelect&&onSelect(yr))},[sel,onSelect]);return<View style={ys.w}><View style={ys.l}/><ScrollView ref={sr} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:CO}} snapToInterval={IW} decelerationRate="fast" onMomentumScrollEnd={hs} onScrollEndDrag={hs}>{yrs.map(yr=><View key={yr} style={[ys.i,{width:IW}]}><Text style={[ys.t,yr===sel&&ys.ts]}>{yr}</Text></View>)}</ScrollView></View>}

function ParticleField({color1:c1,color2:c2,score=50,driftProgress:dp=0,locked:lk=false}){
const PC=14,CR=55,PR=1.2,FO=.3+(score/100)*.35,ov=dp*FO,GAP=CR*2*(1-ov),CX1=SW/2-GAP/2,CX2=SW/2+GAP/2,CY=CR+16;
const ps=useRef([]),fr=useRef(null),[tk,setTk]=useState(0),fc=useRef(0),pr=useRef({cx1:65,cx2:SW-65,lk:false});pr.current={cx1:CX1,cx2:CX2,lk};
useEffect(()=>{const p=[];for(let i=0;i<PC*2;i++){const c=i<PC?1:2,cx=c===1?65:SW-65,a=Math.random()*Math.PI*2,d=Math.random()*(CR-PR*2);p.push({x:cx+Math.cos(a)*d,y:CY+Math.sin(a)*d,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,circle:c,color:c===1?c1:c2,trapped:false,pass:false})}ps.current=p;
const step=()=>{const p=ps.current,{cx1,cx2,lk}=pr.current;for(let i=0;i<p.length;i++){const q=p[i],d1=Math.sqrt((q.x-cx1)**2+(q.y-CY)**2),d2=Math.sqrt((q.x-cx2)**2+(q.y-CY)**2),inI=d1<CR&&d2<CR;
if(lk){if(inI&&!q.trapped){q.trapped=true;q.color=GOLD;q.pass=false}if(!q.trapped&&inI){const oc=q.circle===1?cx2:cx1,dO=Math.sqrt((q.x-oc)**2+(q.y-CY)**2);if(dO>.1){const nx=(q.x-oc)/dO,ny=(q.y-CY)/dO;q.x=oc+nx*(CR+PR);q.y=CY+ny*(CR+PR);const dt=q.vx*nx+q.vy*ny;q.vx-=2*dt*nx;q.vy-=2*dt*ny}}}
else{if(inI&&!q.trapped&&!q.pass){Math.random()<.005?(q.trapped=true,q.color=GOLD):q.pass=true}if(!inI&&q.pass)q.pass=false}
const sm=q.trapped?2:1;q.x+=q.vx*sm;q.y+=q.vy*sm;
if(q.trapped){const nd1=Math.sqrt((q.x-cx1)**2+(q.y-CY)**2),nd2=Math.sqrt((q.x-cx2)**2+(q.y-CY)**2);if(nd1>CR-PR){const nx=(q.x-cx1)/nd1,ny=(q.y-CY)/nd1;q.x=cx1+nx*(CR-PR);q.y=CY+ny*(CR-PR);const dt=q.vx*nx+q.vy*ny;q.vx-=2*dt*nx;q.vy-=2*dt*ny}if(nd2>CR-PR){const nx=(q.x-cx2)/nd2,ny=(q.y-CY)/nd2;q.x=cx2+nx*(CR-PR);q.y=CY+ny*(CR-PR);const dt=q.vx*nx+q.vy*ny;q.vx-=2*dt*nx;q.vy-=2*dt*ny}}
else{const cx=q.circle===1?cx1:cx2,dx=q.x-cx,dy=q.y-CY,dist=Math.sqrt(dx*dx+dy*dy);if(dist>CR-PR){const nx=dx/dist,ny=dy/dist;q.x=cx+nx*(CR-PR);q.y=CY+ny*(CR-PR);const dt=q.vx*nx+q.vy*ny;q.vx-=2*dt*nx;q.vy-=2*dt*ny;q.vx*=1.01;q.vy*=1.01}q.x+=(cx-(q.x-dx))*.02}
const spd=Math.sqrt(q.vx**2+q.vy**2),mx=q.trapped?3:2.5;spd>mx&&(q.vx=q.vx/spd*mx,q.vy=q.vy/spd*mx);spd<.3&&(q.vx+=(Math.random()-.5)*.5,q.vy+=(Math.random()-.5)*.5)}
for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const dx=p[j].x-p[i].x,dy=p[j].y-p[i].y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<PR*4&&dist>.1){const nx=dx/dist,ny=dy/dist,dv=p[i].vx*nx+p[i].vy*ny-p[j].vx*nx-p[j].vy*ny;dv>0&&(p[i].vx-=dv*nx*.8,p[i].vy-=dv*ny*.8,p[j].vx+=dv*nx*.8,p[j].vy+=dv*ny*.8)}}
fc.current++;fc.current%2===0&&setTk(t=>t+1);fr.current=requestAnimationFrame(step)};fr.current=requestAnimationFrame(step);return()=>{fr.current&&cancelAnimationFrame(fr.current)}},[c1,c2]);
return<View style={pf.c}><View style={[pf.ci,{left:CX1-CR,top:CY-CR,width:CR*2,height:CR*2,borderRadius:CR,borderColor:`${c1}25`}]}/><View style={[pf.ci,{left:CX2-CR,top:CY-CR,width:CR*2,height:CR*2,borderRadius:CR,borderColor:`${c2}25`}]}/>{ps.current.map((q,i)=><View key={i} style={{position:'absolute',left:q.x-PR,top:q.y-PR,width:PR*2,height:PR*2,borderRadius:PR,backgroundColor:q.color,opacity:q.trapped?.9:.6}}/>)}</View>}

const PF_H=150;
export default function CompatibilityScreen({visible,onClose,kundliData,onImpulse}){
const[phase,setPhase]=useState('date'),[day,setDay]=useState(15),[month,setMonth]=useState(6),[year,setYear]=useState(1990),[hour,setHour]=useState(12),[gender,setGender]=useState(''),[pName,setPName]=useState(''),[result,setResult]=useState(null),[curSys,setCurSys]=useState(0),[expLvl,setExpLvl]=useState({}),[drift,setDrift]=useState(0);
const driftStarted=useRef(false);
useEffect(()=>{const mx=new Date(year,month,0).getDate();day>mx&&setDay(mx)},[month,year]);
const sl=useRef(new Animated.Value(SH)).current,fa=useRef(new Animated.Value(0)).current,pF=useRef(new Animated.Value(1)).current,pS=useRef(new Animated.Value(0)).current,vr=useRef(null),cO=useRef(new Animated.Value(1)).current,bO=useRef(new Animated.Value(1)).current,vO=useRef(new Animated.Value(1)).current,tr=useRef(false);
useEffect(()=>{if(visible){setPhase('date');setDay(15);setMonth(6);setYear(1990);setHour(12);setGender('');setPName('');setResult(null);setCurSys(0);setExpLvl({});setDrift(0);driftStarted.current=false;pF.setValue(1);pS.setValue(0);Animated.parallel([Animated.spring(sl,{toValue:0,tension:65,friction:11,useNativeDriver:true}),Animated.timing(fa,{toValue:1,duration:300,useNativeDriver:true})]).start()}else Animated.parallel([Animated.timing(sl,{toValue:SH,duration:250,easing:Easing.bezier(.4,0,1,1),useNativeDriver:true}),Animated.timing(fa,{toValue:0,duration:200,useNativeDriver:true})]).start()},[visible]);
useEffect(()=>{if(result&&!driftStarted.current){driftStarted.current=true;const st=Date.now(),dur=12e3,step=()=>{const t=Math.min((Date.now()-st)/dur,1),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;setDrift(e);t<1&&requestAnimationFrame(step)};requestAnimationFrame(step)}},[result]);
const confirmDate=useCallback(()=>{onImpulse&&onImpulse();setPhase('time')},[onImpulse]);
const confirmTime=useCallback(()=>{if(!pName.trim())return;onImpulse&&onImpulse();setPhase('reading');fetchC()},[day,month,year,hour,gender,pName,onImpulse]);
const fetchC=useCallback(async()=>{const p1=kundliData?.raw?.birth_details||{};try{const r=await fetch(`${API}/compatibility-deep`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({person1:{year:p1.year,month:p1.month,day:p1.day,hour:p1.hour,minute:p1.minute,lat:p1.latitude,lng:p1.longitude},person2:{year,month,day,hour,minute:0,lat:p1.latitude||28.6,lng:p1.longitude||77.2,name:pName,gender}})});setResult(await r.json())}catch(e){console.log(e)}},[kundliData,day,month,year,hour,gender,pName]);
const trigLens=useCallback(()=>{if(tr.current)return;tr.current=true;Animated.parallel([Animated.timing(cO,{toValue:0,duration:400,easing:Easing.out(Easing.quad),useNativeDriver:true}),Animated.timing(bO,{toValue:0,duration:300,useNativeDriver:true})]).start(()=>{vr.current?.playAsync?vr.current.playAsync():finL()})},[]);
const finL=useCallback(()=>{Animated.timing(vO,{toValue:0,duration:400,useNativeDriver:true}).start(()=>{setTimeout(()=>{const n=curSys+1;pF.setValue(0);pS.setValue(30);setCurSys(n);cO.setValue(1);bO.setValue(1);vO.setValue(1);tr.current=false;Animated.parallel([Animated.timing(pF,{toValue:1,duration:500,useNativeDriver:true}),Animated.timing(pS,{toValue:0,duration:500,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()},400)})},[curSys]);
const hPB=useCallback(st=>{st.didJustFinish&&finL()},[finL]);
const tBack=useCallback(n=>{onImpulse&&onImpulse();Animated.timing(pF,{toValue:0,duration:200,useNativeDriver:true}).start(()=>{pS.setValue(-20);setCurSys(n);cO.setValue(1);bO.setValue(1);vO.setValue(1);tr.current=false;Animated.parallel([Animated.timing(pF,{toValue:1,duration:450,useNativeDriver:true}),Animated.timing(pS,{toValue:0,duration:450,easing:Easing.bezier(.25,.1,.25,1),useNativeDriver:true})]).start()})},[onImpulse]);
const revMore=useCallback(k=>{setExpLvl(p=>({...p,[k]:(p[k]||0)+1}))},[]);
const editD=useCallback(()=>setPhase('date'),[]),editT=useCallback(()=>setPhase('time'),[]);
if(!visible)return null;
const ds=`${day} ${MO[month-1]} ${year}`,ts=`${hour}:00`,nv=pName.trim().length>0,OR=Math.min(SW*.36,140),IR=OR*.58,RCS=(OR+30)*2;
const cc1=result?.person1_color||'#E8A040',cc2=result?.person2_color||'#4A9E9E',sc=result?.reading?.[SYS[curSys]]?.score||50,isLk=drift>=.99;
return<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
<Animated.View style={[ms.bk,{opacity:fa}]}><TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/></Animated.View>
<Animated.View style={[ms.sh,{transform:[{translateY:sl}]}]}>
<View style={ms.hW}><View style={ms.h}/></View>
<TouchableOpacity style={ms.xB} onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={ms.xT}>✕</Text></TouchableOpacity>
{phase==='reading'&&<Animated.View style={[ms.pfFixed,{opacity:cO}]} pointerEvents="none"><ParticleField color1={cc1} color2={cc2} score={sc} driftProgress={drift} locked={isLk}/></Animated.View>}
<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ms.sC} bounces={false}>
{phase==='date'&&<View style={ms.iP}>
<View style={[ms.rA,{height:RCS+60}]}><View style={[ms.sL,{left:RCS/2-.25,top:RCS/2,height:OR+30}]}/>
<View style={{width:RCS,height:RCS,alignItems:'center',justifyContent:'center'}}>
<RingPicker items={Array.from({length:31},(_,i)=>i+1)} radius={OR} nodeSize={26} fontSize={11} onSelect={i=>setDay(i+1)} initialIndex={day-1}/>
<RingPicker items={MO} radius={IR} nodeSize={24} fontSize={9} onSelect={i=>setMonth(i+1)} initialIndex={month-1}/>
</View></View>
<YearArc onSelect={setYear} initialYear={year}/>
<View style={ms.tA}><Text style={ms.bL}>They were born on</Text><Text style={ms.dB}>{ds}</Text>
<TouchableOpacity onPress={confirmDate} style={ms.yB} activeOpacity={.6}><Text style={ms.yBT}>Yes</Text></TouchableOpacity></View></View>}

{phase==='time'&&<View style={ms.iP}>
<View style={ms.pW}><Text style={ms.pL}>born on </Text><TouchableOpacity onPress={editD}><Text style={ms.pG}>{ds}</Text></TouchableOpacity></View>
<View style={[ms.rA,{height:RCS+20}]}><View style={[ms.sL,{left:RCS/2-.25,top:RCS/2,height:OR+10}]}/>
<View style={{width:RCS,height:RCS,alignItems:'center',justifyContent:'center'}}>
<RingPicker items={Array.from({length:24},(_,i)=>i)} radius={OR*.85} nodeSize={30} fontSize={12} onSelect={i=>setHour(i)} initialIndex={hour}/>
</View></View>
<View style={ms.gR}>{GEN.map(g=><TouchableOpacity key={g} onPress={()=>setGender(g)} style={[ms.gB,gender===g&&ms.gBS]} activeOpacity={.6}><Text style={[ms.gT,gender===g&&ms.gTS]}>{g}</Text></TouchableOpacity>)}</View>
<View style={ms.nW}><Text style={ms.nL}>Name</Text><TextInput style={ms.nI} placeholder="Enter their name" placeholderTextColor={W(.2)} value={pName} onChangeText={setPName} autoCapitalize="words"/></View>
<View style={ms.tA}><Text style={ms.bL}>born at</Text><Text style={ms.dB}>{ts}</Text>
<TouchableOpacity onPress={confirmTime} style={[ms.yB,!nv&&{opacity:.2,borderColor:W(.04)}]} activeOpacity={.6} disabled={!nv}><Text style={[ms.yBT,!nv&&{color:W(.15)}]}>Yes</Text></TouchableOpacity></View></View>}

{phase==='reading'&&<View style={{paddingTop:PF_H+28}}>
<Text style={ms.pND}>{pName}</Text>
{result?.reading&&<>
{curSys===0&&<Reveal visible={true}><TypeWriter text={result.reading.hook_title} speed={60} style={ms.hkT}/><TypeWriter text={result.reading.hook_body} speed={35} style={ms.hkB}/></Reveal>}
<Animated.View style={{opacity:pF,transform:[{translateY:pS}]}}>
<Animated.View style={{opacity:cO}}>
{(()=>{const sk=SYS[curSys],sd=result.reading[sk];if(!sd)return null;const lv=expLvl[sk]||0,iL=curSys===SYS.length-1,sa=lv>0;
return<View style={ms.rW}>
{curSys>0&&<TouchableOpacity onPress={()=>tBack(curSys-1)} style={{alignSelf:'flex-start',paddingVertical:6,paddingRight:20,marginBottom:8}}><Text style={{fontSize:24,color:W(.25),fontWeight:'200'}}>‹</Text></TouchableOpacity>}
{sd.headline&&<Reveal visible={true} skipAnim={sa}><Text style={ms.sysHead}>{sd.headline}</Text></Reveal>}
<Reveal visible={true} delay={sa?0:200} skipAnim={sa}><Text style={ms.oL}>{sd.one_line}</Text></Reveal>
{lv===0&&<Reveal visible={true} delay={sa?0:400} skipAnim={sa}><CTA text="What this connection holds" onPress={()=>revMore(sk)}/></Reveal>}
{lv>=1&&<Reveal visible={true} skipAnim={sa}><Text style={ms.rT}>{sd.reading}</Text></Reveal>}
{lv===1&&<Reveal visible={true} skipAnim={sa}><CTA text="The hard truth" onPress={()=>revMore(sk)}/></Reveal>}
{lv>=2&&<><Reveal visible={true} skipAnim={sa}><Text style={ms.dT}>{sd.deeper}</Text></Reveal>
<Reveal visible={true} delay={sa?0:150} skipAnim={sa}><Verdict d={sd.do} n={sd.dont}/></Reveal>
{iL&&sd.closing&&<Reveal visible={true} delay={sa?0:300} skipAnim={sa}><View style={ms.clW}><View style={ms.clB}/><Text style={ms.clT}>{sd.closing}</Text></View></Reveal>}</>}
</View>})()}
</Animated.View>
{(()=>{const sk=SYS[curSys],lv=expLvl[sk]||0,iL=curSys===SYS.length-1;if(lv<2||iL)return null;
return<Animated.View style={{opacity:vO,paddingHorizontal:28}}>
<Animated.View style={{opacity:bO}}><CTA text="Change the lens" onPress={trigLens}/></Animated.View>
<TouchableOpacity activeOpacity={.8} onPress={trigLens}><View style={ms.lVH}>{VC&&<VC ref={vr} source={{uri:TVID}} style={[ms.lV,{transform:[{rotate:'180deg'}]}]} resizeMode="cover" shouldPlay={false} isLooping={false} volume={0} onPlaybackStatusUpdate={hPB} onError={()=>finL()}/>}</View></TouchableOpacity>
</Animated.View>})()}
</Animated.View></>}
</View>}
<View style={{height:80}}/>
</ScrollView></Animated.View></View>}

const zs=StyleSheet.create({cB:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:W(.1),paddingVertical:18,paddingHorizontal:22,marginVertical:22},cL:{fontFamily:'PlayfairDisplay',fontSize:16,lineHeight:22,color:W(.88),fontStyle:'italic',flex:1,marginRight:14},cA:{fontSize:16,color:W(.3),fontWeight:'200'},vW:{flexDirection:'row',marginVertical:8,gap:40},vC:{flex:1},vL:{fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:11,color:W(.28),marginBottom:14,letterSpacing:2,textTransform:'uppercase'},vI:{fontSize:15,lineHeight:24,color:W(.78),fontWeight:'400',marginBottom:4}});
const ys=StyleSheet.create({w:{marginTop:16,height:44,justifyContent:'center'},l:{position:'absolute',left:SW/2-.25,top:0,bottom:0,width:.5,backgroundColor:W(.08),zIndex:1},i:{justifyContent:'center',alignItems:'center',height:44},t:{fontSize:13,color:W(.18),fontWeight:'200'},ts:{color:GOLD,fontWeight:'300'}});
const pf=StyleSheet.create({c:{height:PF_H,width:SW,alignSelf:'center'},ci:{position:'absolute',borderWidth:.5}});
const ms=StyleSheet.create({bk:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.85)'},sh:{position:'absolute',bottom:0,left:0,right:0,height:SH*.92,backgroundColor:'#040404',borderTopLeftRadius:24,borderTopRightRadius:24,borderTopWidth:.5,borderColor:W(.05)},hW:{alignItems:'center',paddingTop:8,paddingBottom:4,zIndex:20},h:{width:40,height:4,borderRadius:2,backgroundColor:W(.15)},xB:{position:'absolute',top:14,right:20,zIndex:10},xT:{fontSize:18,color:W(.2),fontWeight:'300'},sC:{paddingBottom:40},
pfFixed:{position:'absolute',top:40,left:0,right:0,zIndex:5},
iP:{alignItems:'center',paddingTop:20},rA:{alignItems:'center',justifyContent:'center'},sL:{position:'absolute',width:.5,backgroundColor:W(.12)},
tA:{alignItems:'center',paddingTop:24,gap:10},bL:{fontSize:12,color:W(.25),fontWeight:'200',letterSpacing:1},dB:{fontFamily:'PlayfairDisplay',fontSize:24,color:W(.92),letterSpacing:.5},
yB:{paddingVertical:11,paddingHorizontal:36,marginTop:12,borderWidth:1,borderColor:W(.25),borderRadius:24},yBT:{fontSize:14,color:W(.7),fontWeight:'400',letterSpacing:2},
pW:{flexDirection:'row',alignItems:'baseline',marginBottom:12},pL:{fontSize:11,color:W(.25),fontWeight:'200',letterSpacing:1},pG:{fontSize:12,color:GOLD,fontWeight:'400',letterSpacing:.5,textDecorationLine:'underline',textDecorationColor:GOLD+'40'},
gR:{flexDirection:'row',gap:12,marginTop:16},gB:{paddingVertical:8,paddingHorizontal:18,borderWidth:.5,borderColor:W(.06),borderRadius:20},gBS:{borderColor:GOLD+'40',backgroundColor:GOLD+'08'},gT:{fontSize:11,color:W(.25),fontWeight:'300'},gTS:{color:GOLD},
nW:{marginTop:20,alignItems:'center'},nL:{fontSize:10,color:W(.2),letterSpacing:2,fontWeight:'300',marginBottom:6},nI:{width:SW*.6,borderBottomWidth:1,borderBottomColor:W(.12),paddingVertical:10,fontSize:15,color:W(.8),fontWeight:'300',textAlign:'center'},
pND:{fontSize:13,color:W(.4),fontWeight:'300',textAlign:'center',letterSpacing:1,marginBottom:16},
sysHead:{fontFamily:'PlayfairDisplay',fontSize:22,lineHeight:32,color:W(.88),marginBottom:10,paddingHorizontal:28},
hkT:{fontFamily:'PlayfairDisplay',fontSize:24,lineHeight:34,color:W(.9),marginBottom:14,paddingHorizontal:28},hkB:{fontSize:14,lineHeight:24,color:W(.5),fontWeight:'300',marginBottom:24,paddingHorizontal:28},
rW:{paddingHorizontal:28},oL:{fontSize:14,lineHeight:22,color:W(.55),fontWeight:'300',marginBottom:16},rT:{fontSize:15,lineHeight:26,color:W(.72),fontWeight:'300',marginBottom:16},dT:{fontSize:14,lineHeight:24,color:W(.58),fontWeight:'300',marginBottom:20},
clW:{marginTop:36,paddingTop:28},clB:{width:24,height:1,backgroundColor:GOLD,alignSelf:'center',marginBottom:24,opacity:.4},clT:{fontFamily:'PlayfairDisplay',fontSize:18,lineHeight:28,color:GOLD,textAlign:'center',fontStyle:'italic',opacity:.85},
lVH:{width:'100%',height:120,borderRadius:4,overflow:'hidden',backgroundColor:W(.02),marginTop:4},lV:{width:'100%',height:'100%'}});