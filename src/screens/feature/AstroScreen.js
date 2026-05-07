import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function AstroScreen({ kundliData, onFeaturePress }) {
  const webviewRef = useRef(null);
  const mdLabel = kundliData?.dasha?.mahadasha || 'Jupiter';
  const adLabel = kundliData?.dasha?.antardasha || 'Venus';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html,body { background:#000; width:100%; height:100%; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,sans-serif; color:#fff; }
::-webkit-scrollbar { display:none; }
</style>
</head>
<body>
<script>
const RAW_KUNDLI = ${JSON.stringify(kundliData || {})};

const DEFAULT_PLANETS = [
  { id:"Su", name:"Sun",     symbol:"\u2609", color:"#FFD700", size:18, orbitRadius:95,  speed:0.008, sign:"Leo",         degree:15.23, house:1,  nakshatra:"Magha",            pada:2, dignity:"Own Sign",  strength:0.85 },
  { id:"Mo", name:"Moon",    symbol:"\u263D", color:"#C0C0C0", size:16, orbitRadius:115, speed:0.012, sign:"Cancer",      degree:22.45, house:12, nakshatra:"Ashlesha",         pada:4, dignity:"Own Sign",  strength:0.92 },
  { id:"Ma", name:"Mars",    symbol:"\u2642", color:"#FF4500", size:14, orbitRadius:135, speed:0.006, sign:"Aries",       degree:8.67,  house:9,  nakshatra:"Ashwini",          pada:3, dignity:"Own Sign",  strength:0.78 },
  { id:"Me", name:"Mercury", symbol:"\u263F", color:"#50C878", size:13, orbitRadius:155, speed:0.015, sign:"Virgo",       degree:3.12,  house:2,  nakshatra:"Uttara Phalguni",  pada:1, dignity:"Exalted",   strength:0.95 },
  { id:"Ju", name:"Jupiter", symbol:"\u2643", color:"#FFA500", size:20, orbitRadius:175, speed:0.004, sign:"Sagittarius", degree:28.9,  house:5,  nakshatra:"Uttara Ashadha",   pada:1, dignity:"Own Sign",  strength:0.88 },
  { id:"Ve", name:"Venus",   symbol:"\u2640", color:"#FF69B4", size:15, orbitRadius:195, speed:0.01,  sign:"Pisces",      degree:12.34, house:8,  nakshatra:"Uttara Bhadrapada",pada:2, dignity:"Exalted",   strength:0.91 },
  { id:"Sa", name:"Saturn",  symbol:"\u2644", color:"#6A5ACD", size:17, orbitRadius:215, speed:0.002, sign:"Aquarius",    degree:19.78, house:7,  nakshatra:"Shatabhisha",      pada:3, dignity:"Own Sign",  strength:0.72 },
  { id:"Ra", name:"Rahu",    symbol:"\u260A", color:"#4169E1", size:12, orbitRadius:228, speed:0.003, sign:"Taurus",      degree:5.56,  house:10, nakshatra:"Krittika",         pada:1, dignity:"Neutral",   strength:0.55 },
  { id:"Ke", name:"Ketu",    symbol:"\u260B", color:"#8B4513", size:12, orbitRadius:228, speed:0.003, sign:"Scorpio",     degree:5.56,  house:4,  nakshatra:"Anuradha",         pada:2, dignity:"Neutral",   strength:0.50 },
];

const livePlanets = RAW_KUNDLI?.planets || RAW_KUNDLI?.raw?.planets || null;

const PLANETS = DEFAULT_PLANETS.map(d => {
  const live = livePlanets ? (livePlanets[d.id] || livePlanets[d.name] || {}) : {};
  return {
    ...d,
    sign:      live.sign      || d.sign,
    degree:    live.degree    != null ? live.degree    : d.degree,
    house:     live.house     != null ? live.house     : d.house,
    nakshatra: live.nakshatra || d.nakshatra,
    pada:      live.pada      != null ? live.pada      : d.pada,
    dignity:   live.dignity   || d.dignity,
    strength:  live.strength  != null ? live.strength  : d.strength,
  };
});
const TRANSIT_PLANETS = [
  { id:"t-Sa", symbol:"\u2644", color:"#6A5ACD", size:10, orbitRadius:252, speed:0.001 },
  { id:"t-Ju", symbol:"\u2643", color:"#FFA500", size:12, orbitRadius:264, speed:0.002 },
  { id:"t-Ra", symbol:"\u260A", color:"#4169E1", size:9,  orbitRadius:276, speed:0.0015 },
];
const HOUSES = Array.from({length:12},(_,i)=>({number:i+1,signSymbol:["\u2648","\u2649","\u264A","\u264B","\u264C","\u264D","\u264E","\u264F","\u2650","\u2651","\u2652","\u2653"][i]}));
const YOGAS = [{name:"Gajakesari",planets:["Mo","Ju"]},{name:"Budhaditya",planets:["Su","Me"]}];
const FEATURES = [
  {id:"daily", name:"Today",        icon:"\u25C9", desc:"Daily horoscope",       accent:"#FFD700"},
  {id:"dasha", name:"Dasha",        icon:"\u27F3", desc:"${mdLabel} \u00B7 ${adLabel}", accent:"#FFA500"},
  {id:"match", name:"Kundli Match", icon:"\u26AF", desc:"Two charts, one truth", accent:"#FF69B4"},
  {id:"remedy",name:"Remedies",     icon:"\u2727", desc:"3 planets seek balance",accent:"#50C878"},
];

// ======= STARFIELD =======
const sc = document.createElement('canvas');
sc.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
document.body.appendChild(sc);
const sx=sc.getContext('2d');
const dpr=window.devicePixelRatio||1;
const W=window.innerWidth,H=window.innerHeight;
sc.width=W*dpr; sc.height=H*dpr; sx.scale(dpr,dpr);

const ST=[{r:255,g:252,b:248},{r:190,g:210,b:255},{r:240,g:238,b:232},{r:170,g:195,b:255},{r:230,g:220,b:205},{r:210,g:225,b:255}];
const rndC=()=>ST[Math.floor(Math.random()*ST.length)];
const mkStars=(n,cfg)=>Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,...cfg()}));
const dust=mkStars(400,()=>({size:Math.random()*0.5+0.1,color:rndC(),opacity:Math.random()*0.12+0.02}));
const bg=mkStars(200,()=>({size:Math.random()*0.9+0.3,color:rndC(),baseOpacity:Math.random()*0.3+0.08,twinkleSpeed:Math.random()*0.006+0.001,twinkleAmount:Math.random()*0.12+0.04,phase:Math.random()*Math.PI*2}));
const mid=mkStars(60,()=>({size:Math.random()*1.1+0.6,color:rndC(),baseOpacity:Math.random()*0.4+0.2,twinkleSpeed:Math.random()*0.01+0.003,twinkleAmount:Math.random()*0.18+0.06,phase:Math.random()*Math.PI*2,hasDiffraction:Math.random()>0.65}));
const fg=mkStars(14,()=>({size:Math.random()*1.3+1.0,color:ST[Math.floor(Math.random()*3)],baseOpacity:Math.random()*0.3+0.5,twinkleSpeed:Math.random()*0.018+0.005,twinkleAmount:Math.random()*0.22+0.1,phase:Math.random()*Math.PI*2,hasDiffraction:true,glowRadius:Math.random()*10+5}));
const ss=[];
let sT=0;

function drawStar(c,star,t,twinkle){
  let op=star.opacity||star.baseOpacity||0.1;
  if(twinkle) op=star.baseOpacity+Math.sin(t*star.twinkleSpeed+star.phase)*star.twinkleAmount;
  if(op<=0.01)return;
  const{r,g,b}=star.color;
  if(star.glowRadius){
    const g2=c.createRadialGradient(star.x,star.y,0,star.x,star.y,star.glowRadius);
    g2.addColorStop(0,'rgba('+r+','+g+','+b+','+op*0.12+')');
    g2.addColorStop(1,'transparent');
    c.beginPath();c.arc(star.x,star.y,star.glowRadius,0,Math.PI*2);c.fillStyle=g2;c.fill();
  }
  if(star.hasDiffraction&&op>0.25){
    const sl=star.size*3.5,so=op*0.18;
    c.save();c.globalAlpha=so;c.strokeStyle='rgb('+r+','+g+','+b+')';c.lineWidth=0.4;
    c.beginPath();c.moveTo(star.x-sl,star.y);c.lineTo(star.x+sl,star.y);c.stroke();
    c.beginPath();c.moveTo(star.x,star.y-sl);c.lineTo(star.x,star.y+sl);c.stroke();
    c.restore();
  }
  const cg=c.createRadialGradient(star.x,star.y,0,star.x,star.y,star.size*1.2);
  cg.addColorStop(0,'rgba(255,255,255,'+Math.min(1,op*1.2)+')');
  cg.addColorStop(0.3,'rgba('+r+','+g+','+b+','+op+')');
  cg.addColorStop(1,'transparent');
  c.beginPath();c.arc(star.x,star.y,star.size*1.2,0,Math.PI*2);c.fillStyle=cg;c.fill();
}

function animStars(){
  sT++;
  const bgGrad=sx.createRadialGradient(W*0.35,H*0.35,0,W*0.5,H*0.5,Math.max(W,H));
  bgGrad.addColorStop(0,'rgb(4,4,6)');bgGrad.addColorStop(0.3,'rgb(2,2,4)');
  bgGrad.addColorStop(0.7,'rgb(1,1,2)');bgGrad.addColorStop(1,'rgb(0,0,0)');
  sx.fillStyle=bgGrad;sx.fillRect(0,0,W,H);
  dust.forEach(s=>drawStar(sx,s,sT));
  bg.forEach(s=>drawStar(sx,s,sT,true));
  mid.forEach(s=>drawStar(sx,s,sT,true));
  fg.forEach(s=>drawStar(sx,s,sT,true));
  if(Math.random()<0.001){
    const a=Math.random()*0.6+0.3;
    ss.push({x:Math.random()*W,y:Math.random()*H*0.4,vx:Math.cos(a)*(Math.random()*5+6),vy:Math.sin(a)*(Math.random()*5+6),life:1,tLen:Math.random()*50+30});
  }
  for(let i=ss.length-1;i>=0;i--){
    const s=ss[i];s.x+=s.vx;s.y+=s.vy;s.life-=0.022;
    if(s.life<=0){ss.splice(i,1);continue;}
    const tx=s.x-s.vx*s.tLen*0.12,ty=s.y-s.vy*s.tLen*0.12;
    const sg=sx.createLinearGradient(s.x,s.y,tx,ty);
    sg.addColorStop(0,'rgba(255,255,255,'+s.life*0.9+')');sg.addColorStop(1,'transparent');
    sx.beginPath();sx.moveTo(s.x,s.y);sx.lineTo(tx,ty);sx.strokeStyle=sg;sx.lineWidth=1.2;sx.stroke();
  }
  requestAnimationFrame(animStars);
}
animStars();

// ======= ORBITAL CHART =======
const cc=document.createElement('canvas');
cc.style.cssText='position:absolute;z-index:1;cursor:pointer;';
document.body.appendChild(cc);
const ctx=cc.getContext('2d');
const angs=PLANETS.map((_,i)=>(i/PLANETS.length)*Math.PI*2);
const tAngs=TRANSIT_PLANETS.map((_,i)=>(i/TRANSIT_PLANETS.length)*Math.PI*2+Math.PI);
let pPos=[];
let selPlanet=null;
let cSize=0;

function resizeChart(){
  cSize=Math.min(window.innerWidth,window.innerHeight*0.62,430);
  const top=window.innerHeight*0.07;
  cc.style.left=((window.innerWidth-cSize)/2)+'px';
  cc.style.top=top+'px';
  cc.width=cSize*2;cc.height=cSize*2;
  cc.style.width=cSize+'px';cc.style.height=cSize+'px';
}
resizeChart();

function drawChart(){
  const ds=cSize*2,cx=ds/2,cy=ds/2,sc2=ds/860;
  ctx.clearRect(0,0,ds,ds);

  // Chart glow
  const cbg=ctx.createRadialGradient(cx,cy,0,cx,cy,220*sc2*2);
  cbg.addColorStop(0,'rgba(255,248,220,0.012)');cbg.addColorStop(1,'transparent');
  ctx.beginPath();ctx.arc(cx,cy,220*sc2*2,0,Math.PI*2);ctx.fillStyle=cbg;ctx.fill();

  // Houses
  HOUSES.forEach((h,i)=>{
    const sa=((i*30-105)*Math.PI)/180,ma=((i*30-90)*Math.PI)/180;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(sa)*48*sc2*2,cy+Math.sin(sa)*48*sc2*2);
    ctx.lineTo(cx+Math.cos(sa)*84*sc2*2,cy+Math.sin(sa)*84*sc2*2);
    ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=0.5;ctx.stroke();
    ctx.font='300 '+(7.5*sc2*2)+'px -apple-system,sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.1)';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(h.number,cx+Math.cos(ma)*66*sc2*2,cy+Math.sin(ma)*66*sc2*2);
    ctx.font='300 '+(9*sc2*2)+'px -apple-system,sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.045)';
    ctx.fillText(h.signSymbol,cx+Math.cos(ma)*250*sc2*2,cy+Math.sin(ma)*250*sc2*2);
  });

  // Orbit rings
  [95,115,135,155,175,195,215].forEach((r,i)=>{
    ctx.beginPath();ctx.arc(cx,cy,r*sc2*2,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,'+(0.012+i*0.002)+')';ctx.lineWidth=0.5;ctx.stroke();
  });

  // Transit ring dashed
  ctx.beginPath();ctx.arc(cx,cy,265*sc2*2,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.02)';ctx.lineWidth=0.5;
  ctx.setLineDash([1.5*sc2*2,5*sc2*2]);ctx.stroke();ctx.setLineDash([]);

  // Yoga lines
  YOGAS.forEach(yoga=>{
    const p1=PLANETS.find(p=>p.id===yoga.planets[0]);
    const p2=PLANETS.find(p=>p.id===yoga.planets[1]);
    if(!p1||!p2)return;
    const i1=PLANETS.indexOf(p1),i2=PLANETS.indexOf(p2);
    const x1=cx+Math.cos(angs[i1])*p1.orbitRadius*sc2*2,y1=cy+Math.sin(angs[i1])*p1.orbitRadius*sc2*2;
    const x2=cx+Math.cos(angs[i2])*p2.orbitRadius*sc2*2,y2=cy+Math.sin(angs[i2])*p2.orbitRadius*sc2*2;
    const yg=ctx.createLinearGradient(x1,y1,x2,y2);
    yg.addColorStop(0,p1.color+'18');yg.addColorStop(0.5,'rgba(255,255,255,0.03)');yg.addColorStop(1,p2.color+'18');
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=yg;ctx.lineWidth=0.7;ctx.stroke();
  });

  // Center
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,36*sc2*2);
  cg.addColorStop(0,'rgba(255,248,220,0.05)');cg.addColorStop(1,'transparent');
  ctx.beginPath();ctx.arc(cx,cy,36*sc2*2,0,Math.PI*2);ctx.fillStyle=cg;ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,26*sc2*2,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,248,220,0.06)';ctx.lineWidth=0.5;ctx.stroke();
  ctx.font='600 '+(8.5*sc2*2)+'px -apple-system,sans-serif';
  ctx.fillStyle='rgba(255,248,220,0.4)';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('ASC',cx,cy);

  // Natal planets
  const positions=[];
  PLANETS.forEach((planet,i)=>{
    angs[i]+=planet.speed*0.2;
    const x=cx+Math.cos(angs[i])*planet.orbitRadius*sc2*2;
    const y=cy+Math.sin(angs[i])*planet.orbitRadius*sc2*2;
    const isSel=selPlanet&&selPlanet.id===planet.id;
    positions.push({cssX:x/2,cssY:y/2,planet,hitR:Math.max(planet.size*2.2,28)});
    const glowR=(isSel?planet.size*4.5:planet.size*2.5)*sc2*2;
    const glow=ctx.createRadialGradient(x,y,0,x,y,glowR);
    glow.addColorStop(0,planet.color+(isSel?'30':'14'));glow.addColorStop(1,'transparent');
    ctx.beginPath();ctx.arc(x,y,glowR,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
    const pulse=1+Math.sin(Date.now()*0.0012*planet.strength)*0.1*planet.strength;
    const coreR=planet.size*sc2*2*0.32*pulse;
    ctx.beginPath();ctx.arc(x,y,coreR,0,Math.PI*2);
    ctx.fillStyle=planet.color;ctx.shadowColor=planet.color;ctx.shadowBlur=8*sc2*2*planet.strength;
    ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(x,y,coreR*0.3,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,'+(0.35+planet.strength*0.3)+')';ctx.fill();
    ctx.font=(planet.size*0.55*sc2*2)+'px -apple-system,sans-serif';
    ctx.fillStyle='rgba(255,255,255,'+(isSel?0.9:0.6)+')';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(planet.symbol,x,y-planet.size*sc2*2*0.55);
  });
  pPos=positions;

  // Transit planets
  TRANSIT_PLANETS.forEach((planet,i)=>{
    tAngs[i]+=planet.speed*0.2;
    const x=cx+Math.cos(tAngs[i])*planet.orbitRadius*sc2*2;
    const y=cy+Math.sin(tAngs[i])*planet.orbitRadius*sc2*2;
    const glow=ctx.createRadialGradient(x,y,0,x,y,planet.size*2*sc2*2);
    glow.addColorStop(0,planet.color+'0D');glow.addColorStop(1,'transparent');
    ctx.beginPath();ctx.arc(x,y,planet.size*2*sc2*2,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
    ctx.beginPath();ctx.arc(x,y,planet.size*sc2*2*0.22,0,Math.PI*2);ctx.fillStyle=planet.color+'45';ctx.fill();
    ctx.font=(planet.size*0.5*sc2*2)+'px -apple-system,sans-serif';
    ctx.fillStyle=planet.color+'35';ctx.textAlign='center';
    ctx.fillText(planet.symbol,x,y-planet.size*sc2*2*0.45);
  });

  requestAnimationFrame(drawChart);
}
drawChart();

cc.addEventListener('click',e=>{
  const rect=cc.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  let closest=null,closestD=Infinity;
  pPos.forEach(pos=>{
    const dx=mx-pos.cssX,dy=my-pos.cssY,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<pos.hitR&&dist<closestD){closest=pos.planet;closestD=dist;}
  });
  selPlanet=closest;
  if(closest)showPanel(closest); else hidePanel();
});

// ======= UI OVERLAY =======
const ui=document.createElement('div');
ui.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:2;pointer-events:none;display:flex;flex-direction:column;max-width:430px;margin:0 auto;';
document.body.appendChild(ui);

// Header
const hdr=document.createElement('div');
hdr.style.cssText='padding:54px 32px 0;display:flex;justify-content:space-between;align-items:baseline;flex-shrink:0;';
hdr.innerHTML='<span style="font-size:10px;letter-spacing:3px;color:rgba(255,248,220,0.12);">\u2727</span>'
  +'<span style="font-size:10px;color:rgba(255,248,220,0.25);letter-spacing:0.5px;font-weight:500;">\u2643 ${mdLabel} \u00B7 \u2640 ${adLabel}</span>';
ui.appendChild(hdr);

const spacer=document.createElement('div');
spacer.style.flex='1';
ui.appendChild(spacer);

// Bottom
const bot=document.createElement('div');
bot.style.cssText='flex-shrink:0;pointer-events:auto;';
ui.appendChild(bot);

// Yoga pills
const yr=document.createElement('div');
yr.style.cssText='display:flex;justify-content:center;gap:10px;padding:0 32px;margin-bottom:16px;';
YOGAS.forEach(y=>{
  const p=document.createElement('div');
  p.style.cssText='padding:6px 16px;border-radius:20px;background:rgba(255,215,0,0.025);border:1px solid rgba(255,215,0,0.06);font-size:10px;color:rgba(255,215,0,0.45);letter-spacing:1px;font-weight:600;';
  p.textContent='\u2726 '+y.name;
  yr.appendChild(p);
});
bot.appendChild(yr);

// Feature cards
const fs=document.createElement('div');
fs.style.cssText='display:flex;gap:14px;overflow-x:auto;padding:0 32px 4px;-webkit-overflow-scrolling:touch;';
FEATURES.forEach(f=>{
  const card=document.createElement('div');
  card.style.cssText='min-width:150px;padding:20px 22px;border-radius:22px;background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.03);cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent;';
  card.innerHTML='<span style="font-size:22px;color:'+f.accent+';display:block;margin-bottom:12px;">'+f.icon+'</span>'
    +'<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:4px;">'+f.name+'</div>'
    +'<div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.5;">'+f.desc+'</div>';
  card.addEventListener('touchstart',()=>{card.style.background='linear-gradient(150deg,'+f.accent+'0C,'+f.accent+'04)';card.style.borderColor=f.accent+'25';},{passive:true});
  card.addEventListener('touchend',()=>{
    card.style.background='rgba(255,255,255,0.015)';card.style.borderColor='rgba(255,255,255,0.03)';
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'feature',id:f.id}));
  });
  fs.appendChild(card);
});
bot.appendChild(fs);

// Tab dots
const tb=document.createElement('div');
tb.style.cssText='display:flex;justify-content:center;align-items:center;gap:40px;padding:18px 0 34px;';
['chat','astro','profile'].forEach(t=>{
  const d=document.createElement('div');
  d.style.cssText='width:7px;height:7px;border-radius:4px;background:'+(t==='astro'?'#fff':'rgba(255,255,255,0.12)')+';';
  tb.appendChild(d);
});
bot.appendChild(tb);

// ======= PLANET PANEL =======
const ov=document.createElement('div');
ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:10;display:none;';
ov.addEventListener('click',hidePanel);
document.body.appendChild(ov);

const pnl=document.createElement('div');
pnl.style.cssText='position:fixed;bottom:0;left:0;right:0;background:rgba(4,4,8,0.97);border-top:1px solid rgba(255,255,255,0.05);border-radius:28px 28px 0 0;padding:20px 32px 48px;z-index:11;max-width:430px;margin:0 auto;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);';
document.body.appendChild(pnl);

function showPanel(planet){
  const DC={
    'Exalted':{bg:'rgba(255,215,0,0.08)',c:'#FFD700',br:'rgba(255,215,0,0.15)'},
    'Own Sign':{bg:'rgba(80,200,120,0.06)',c:'#50C878',br:'rgba(80,200,120,0.14)'},
    'Debilitated':{bg:'rgba(255,69,0,0.06)',c:'#FF4500',br:'rgba(255,69,0,0.14)'},
    'Neutral':{bg:'rgba(255,255,255,0.03)',c:'#8A8A8E',br:'rgba(255,255,255,0.06)'},
  };
  const dc=DC[planet.dignity]||DC['Neutral'];
  const ord=n=>n+(['st','nd','rd'][n-1]||'th');
  const yogas=YOGAS.filter(y=>y.planets.includes(planet.id));
  pnl.innerHTML=
    '<div style="width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);margin:0 auto 28px;"></div>'
    +'<div style="display:flex;align-items:center;gap:18px;margin-bottom:28px;">'
      +'<div style="width:52px;height:52px;border-radius:26px;background:radial-gradient(circle,'+planet.color+'18,transparent);border:1px solid '+planet.color+'20;display:flex;align-items:center;justify-content:center;font-size:26px;">'+planet.symbol+'</div>'
      +'<div style="flex:1;"><div style="font-size:22px;font-weight:600;color:#fff;">'+planet.name+'</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:4px;">'+planet.degree.toFixed(2)+'&deg; '+planet.sign+' &middot; Pada '+planet.pada+'</div></div>'
      +'<span style="padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;background:'+dc.bg+';color:'+dc.c+';border:1px solid '+dc.br+';">'+planet.dignity+'</span>'
    +'</div>'
    +[['House',ord(planet.house)+' House'],['Sign',planet.sign],['Nakshatra',planet.nakshatra]].map(([l,v])=>
      '<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.025);">'
      +'<span style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:1.2px;text-transform:uppercase;font-weight:500;">'+l+'</span>'
      +'<span style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.85);">'+v+'</span></div>'
    ).join('')
    +'<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.025);">'
      +'<span style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:1.2px;text-transform:uppercase;font-weight:500;">Strength</span>'
      +'<div style="display:flex;align-items:center;gap:12px;">'
        +'<div style="width:80px;height:3px;border-radius:2px;background:rgba(255,255,255,0.04);">'
          +'<div style="width:'+Math.round(planet.strength*100)+'%;height:3px;border-radius:2px;background:linear-gradient(90deg,'+planet.color+','+planet.color+'60);"></div>'
        +'</div>'
        +'<span style="color:'+planet.color+';font-size:13px;font-weight:600;">'+Math.round(planet.strength*100)+'%</span>'
      +'</div></div>'
    +(yogas.length?'<div style="margin-top:24px;"><div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1.5px;text-transform:uppercase;font-weight:600;margin-bottom:12px;">Active Yogas</div>'
      +yogas.map(y=>'<div style="padding:12px 16px;border-radius:14px;background:rgba(255,215,0,0.03);border:1px solid rgba(255,215,0,0.06);font-size:13px;font-weight:500;margin-bottom:8px;color:rgba(255,215,0,0.6);">\u2726 '+y.name+' Yoga</div>').join('')+'</div>':'')
    +'<button onclick="hidePanel()" style="width:100%;padding:16px;margin-top:28px;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:14px;font-weight:500;cursor:pointer;">Close</button>';
  ov.style.display='block';
  setTimeout(()=>{pnl.style.transform='translateY(0)';},10);
}

function hidePanel(){
  pnl.style.transform='translateY(100%)';
  ov.style.display='none';
  selPlanet=null;
}
</script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'feature' && onFeaturePress) {
              onFeaturePress({ id: data.id });
            }
          } catch (e) {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
});