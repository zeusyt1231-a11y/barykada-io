'use strict';
/* Barykada.io — server-side simulation (generated from single-player source) */
module.exports=function createGame(EMIT){
const TAU=Math.PI*2;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const easeOutBack=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const easeOutCubic=t=>1-Math.pow(1-t,3);
const pick=a=>a[Math.random()*a.length|0];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const MATS={foil:{name:'Folia',hp:50,col:'#cfe3ee',dk:'#7d97a8'},wood:{name:'Deska',hp:150,col:'#b47c46',dk:'#6f4824'},rust:{name:'Zardzewiała blacha',hp:250,col:'#94573a',dk:'#5a301c'},steel:{name:'Blacha stalowa',hp:350,col:'#b3bfcf',dk:'#5f6b7a'}};
const MATK=['foil','wood','rust','steel'];
const LOC={window:{m:1,name:'Okno',max:3},door:{m:1,name:'Drzwi',max:3}};
const SNAME={window:'Okno',door:'Drzwi',wall:'Ściana'};
const FAST={tape:{m:.2,name:'przyklejone taśmą',v:'Przyklej taśmą',note:'taśma: −80%'},staples:{m:.5,name:'przypięte zszywkami',v:'Przypnij zszywkami',note:'zszywki: −50%'},hammer:{m:1,name:'przybite gwoździami',v:'Przybij'},drill:{m:1.25,name:'przykręcone wkrętarką',v:'Przykręć',note:'wkręty: +25%'}};
const FXN={nails:'Gwoździe',staples:'Zszywki',tape:'Taśma',rope:'Lina'},FXAMT={nails:4,staples:5,tape:3,rope:3},FXCAP=16,FXK=['nails','staples','tape','rope'];
const PIECE={1:{type:'wall',name:'Ściana',hp:250},2:{type:'door',name:'Drzwi',hp:150},3:{type:'window',name:'Okno',hp:30}},BMAT=['wood','rust','steel'];
const TOOLN={hammer:'Młotek',drill:'Wkrętarka',crowbar:'Łom'};
const CLASSES={
  walker:{name:'Szwendacz',desc:'Zrównoważony umarlak',speed:152,dmg:6,pdmg:22,cd:.75,push:1,r:16,cost:0,skin:'#86b35e'},
  runner:{name:'Biegacz',desc:'Szybki, ale słabsze ciosy',speed:184,dmg:4.5,pdmg:17,cd:.55,push:.7,r:16,cost:3,skin:'#a6c86a'},
  brute:{name:'Kolos',desc:'Wolny, miażdży barykady',speed:124,dmg:13,pdmg:32,cd:1.05,push:2.1,r:16,cost:5,skin:'#6c9450'}
};
const MAXSK=5,MAXLVL=55;
const xpNeed=l=>80+l*18;
const COLORS=['#4a90d9','#d9534f','#f0ad4e','#5cb85c','#9b59b6','#e67e22','#1abc9c','#e84393'];
const BOT_NAMES=['Kometa','Pixel','Zenek','Rakieta','Nova','Turbo','Szczupak','Mgła','Grom','Bąbel','Orbit','Lis','Echo','Wilk','Iskra','Tytan','Fala','Cień','Kosmo','Bzyk','Meteor','Żbik','Pirat','Kruk','Sowa','Wir','Zorza','Atom','Stefan','Halina','Mirek','Gienek'];
const FURN={szafa:{w:70,h:26,col:'#7a5236',name:'Szafa',hp:260},lodowka:{w:34,h:34,col:'#d5dbe2',name:'Lodówka',hp:300},kanapa:{w:78,h:32,col:'#5d4a7e',name:'Kanapa',hp:200},
  stol:{w:54,h:38,col:'#8c6239',name:'Stół',hp:140},regal:{w:64,h:20,col:'#5f4a3a',name:'Regał',hp:180},skrzynia:{w:34,h:30,col:'#9b7444',name:'Skrzynia',hp:170}};

/* ================= map ================= */
const T=40,N=60,WS=T*N;
const G=0,ROAD=1,FLOOR=2,WALL=3,DOOR=4,WIN=5,TREE=6,PLAZA=7;
const tiles=new Uint8Array(N*N),tvar=new Float32Array(N*N),sblock=new Uint8Array(N*N),fblock=new Uint8Array(N*N);let fbT=0;
function buildFBlock(){fblock.fill(0);for(const f of furn){if(f.static||f.holder)continue;const l=f.x-f.w/2,r=f.x+f.w/2,t=f.y-f.h/2,b=f.y+f.h/2;
  for(let y=Math.floor(t/T);y<=Math.floor(b/T);y++)for(let x=Math.floor(l/T);x<=Math.floor(r/T);x++){if(x<0||y<0||x>=N||y>=N)continue;const m=9;if(r>x*T+m&&l<x*T+T-m&&b>y*T+m&&t<y*T+T-m)fblock[idx(x,y)]=1}}}
let structs=new Map(),houses=[],furn=[],items=[],players=[],parts=[],texts=[],trees=[];
const idx=(x,y)=>y*N+x;

function makeHouse(id,x0,y0,w,h){
  const Hs={id,x0,y0,w,h,open:[],cx:(x0+w/2)*T,cy:(y0+h/2)*T};
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
    const top=y===y0,bot=y===y0+h-1,lef=x===x0,rig=x===x0+w-1,edge=top||bot||lef||rig,i=idx(x,y);
    if(!edge){tiles[i]=FLOOR;continue}
    tiles[i]=WALL;const corner=(top||bot)&&(lef||rig);
    structs.set(i,{i,x,y,type:'wall',base:420,baseMax:420,open:false,broken:false,layers:[],house:id,axis:(top||bot)?'h':'v',
      inX:corner?null:x+(lef?1:rig?-1:0),inY:corner?null:y+(top?1:bot?-1:0),outX:corner?null:x-(lef?1:rig?-1:0),outY:corner?null:y-(top?1:bot?-1:0),hitT:0,corner});
  }
  let part=null;
  if(w>=9){const px=x0+Math.floor(w/2),gap=randi(y0+1,y0+h-3);part=px;
    for(let y=y0+1;y<y0+h-1;y++){if(y===gap||y===gap+1)continue;const i=idx(px,y);tiles[i]=WALL;
      structs.set(i,{i,x:px,y,type:'wall',base:200,baseMax:200,open:false,broken:false,layers:[],house:id,axis:'v',inX:null,inY:null,hitT:0,interior:true})}}
  const cand=[];
  for(let x=x0+1;x<x0+w-1;x++){if(x!==part){cand.push([x,y0]);cand.push([x,y0+h-1])}}
  for(let y=y0+1;y<y0+h-1;y++){cand.push([x0,y]);cand.push([x0+w-1,y])}
  shuffle(cand);const used=[];
  const ok=(x,y)=>used.every(([a,b])=>Math.abs(a-x)+Math.abs(b-y)>=3);
  let nd=randi(1,2),nw=randi(3,5);
  for(const [x,y] of cand){if(!ok(x,y))continue;const s=structs.get(idx(x,y));
    if(nd>0){nd--;s.type='door';s.base=s.baseMax=120;tiles[s.i]=DOOR}
    else if(nw>0){nw--;s.type='window';s.base=s.baseMax=30;tiles[s.i]=WIN}else break;
    used.push([x,y]);Hs.open.push(s)}
  houses.push(Hs);
  // furniture
  const keys=Object.keys(FURN);let n=randi(2,4);
  for(let a=0;a<60&&n>0;a++){const k=pick(keys),d=FURN[k],rot=Math.random()<.5;const fw=rot?d.h:d.w,fh=rot?d.w:d.h;
    const fx=rand((x0+1)*T+fw/2+2,(x0+w-1)*T-fw/2-2),fy=rand((y0+1)*T+fh/2+2,(y0+h-1)*T-fh/2-2);
    const f={k,x:fx,y:fy,w:fw,h:fh,col:d.col,name:d.name,holder:null,shake:0,static:false,hp:d.hp,max:d.hp,hitT:-9};
    if(rectHitsSolid(f)||furn.some(g=>rectOverlap(f,g,10)))continue;
    if(Hs.open.some(s=>s.inX!==null&&Math.abs((s.inX+.5)*T-fx)<fw/2+T*.8&&Math.abs((s.inY+.5)*T-fy)<fh/2+T*.8))continue;
    furn.push(f);n--}
}
function rectOverlap(a,b,m=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+m&&Math.abs(a.y-b.y)<(a.h+b.h)/2+m}
function rectHitsSolid(f){const x0=Math.floor((f.x-f.w/2)/T),x1=Math.floor((f.x+f.w/2-.01)/T),y0=Math.floor((f.y-f.h/2)/T),y1=Math.floor((f.y+f.h/2-.01)/T);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(solidT(x,y))return true;return false}

function genMap(){
  tiles.fill(G);structs=new Map();houses=[];furn=[];items=[];parts=[];texts=[];trees=[];
  for(let i=0;i<N*N;i++)tvar[i]=Math.random();
  for(let i=0;i<N;i++)for(const r of [19,20,39,40]){tiles[idx(i,r)]=ROAD;tiles[idx(r,i)]=ROAD}
  for(let y=21;y<=38;y++)for(let x=21;x<=38;x++)tiles[idx(x,y)]=PLAZA;
  const R=[[0,18],[21,38],[41,59]];let hid=0;
  for(let py=0;py<3;py++)for(let px=0;px<3;px++){if(px===1&&py===1)continue;
    const [a0,a1]=R[px],[b0,b1]=R[py],w=randi(7,10),h=randi(6,9);
    makeHouse(hid++,randi(a0+1,a1-w),randi(b0+1,b1-h),w,h)}
  // trees
  for(let a=0;a<400&&trees.length<46;a++){const x=randi(1,N-2),y=randi(1,N-2);let ok=true;
    for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++){const t=tiles[idx(clamp(x+dx,0,N-1),clamp(y+dy,0,N-1))];if(t!==G){ok=false;break}}
    if(ok){tiles[idx(x,y)]=TREE;trees.push({x:(x+.5)*T,y:(y+.5)*T,r:rand(30,40),c:randi(0,2)})}}
  // plaza decorations: fountain as static
  furn.push({k:'fontanna',x:30*T,y:30*T,w:96,h:96,col:'#59636e',name:'Fontanna',static:true,holder:null,shake:0,round:true});
  // cars
  const carCols=['#c0392b','#2c6fbb','#d4a017','#3d8b5a','#7f8c8d','#8e44ad'];
  for(let a=0;a<30&&furn.filter(f=>f.k==='car').length<5;a++){const horiz=Math.random()<.5,lane=pick([19,39]);let x,y;
    if(horiz){x=rand(2,N-2)*T;y=(lane+1)*T}else{x=(lane+1)*T;y=rand(2,N-2)*T}
    const f={k:'car',x,y,w:horiz?86:42,h:horiz?42:86,col:pick(carCols),name:'Wrak auta',static:true,holder:null,shake:0,horiz};
    const cxT=Math.floor(x/T),cyT=Math.floor(y/T);if([19,20,39,40].some(r=>Math.abs((horiz?cxT:cyT)-r)<4))continue;
    if(furn.some(g=>rectOverlap(f,g,30)))continue;furn.push(f)}
  sblock.fill(0);for(const f of furn){if(!f.static)continue;const m=T*.3;
    for(let y=Math.floor((f.y-f.h/2-m)/T);y<=Math.floor((f.y+f.h/2+m)/T);y++)for(let x=Math.floor((f.x-f.w/2-m)/T);x<=Math.floor((f.x+f.w/2+m)/T);x++){
      if(x<0||y<0||x>=N||y>=N)continue;const cx=(x+.5)*T,cy=(y+.5)*T;if(Math.abs(cx-f.x)<f.w/2+m&&Math.abs(cy-f.y)<f.h/2+m)sblock[idx(x,y)]=1}}
  spawnItems();
}
function lootRoll(){const r=Math.random()*100;return r<13?'foil':r<38?'wood':r<51?'rust':r<58?'steel':r<69?'nails':r<77?'staples':r<85?'tape':r<91?'rope':r<95?'hammer':r<97?'drill':'crowbar'}
function spawnItems(){
  const nIt=150;let hammers=0,drills=0;
  for(let i=0;i<nIt;i++){let type=lootRoll();if(i>=nIt-10){if(hammers<5)type='hammer';else if(drills<3)type='drill';else if(!items.some(o=>o.type==='crowbar')||i>=nIt-2)type='crowbar'}
    if(type==='hammer')hammers++;if(type==='drill')drills++;
    spawnOneItem(type,-10)}
}
function spawnOneItem(type,born){
    for(let a=0;a<40;a++){let x,y;
      if(Math.random()<.55){const h=pick(houses);x=rand((h.x0+1)*T+10,(h.x0+h.w-1)*T-10);y=rand((h.y0+1)*T+10,(h.y0+h.h-1)*T-10)}
      else{x=rand(T,WS-T);y=rand(T,WS-T);const t=tiles[idx(Math.floor(x/T),Math.floor(y/T))];if(t!==G&&t!==PLAZA&&t!==ROAD)continue}
      if(solidT(Math.floor(x/T),Math.floor(y/T))||tiles[idx(Math.floor(x/T),Math.floor(y/T))]>=WALL&&tiles[idx(Math.floor(x/T),Math.floor(y/T))]<=WIN)continue;
      if(furn.some(f=>Math.abs(f.x-x)<f.w/2+12&&Math.abs(f.y-y)<f.h/2+12))continue;
      items.push({id:++IID,type,x,y,born,ph:rand(0,TAU),claim:null,amt:FXAMT[type]||1});if(born>0)ring(x,y,'#ffffff',4,30,.6,2);return}
}

/* ================= structures ================= */
function sHp(s){let h=0;for(const l of s.layers)h+=l.hp;if(s.type==='wall'||!s.open)h+=s.base;return h}
function sMax(s){let h=0;for(const l of s.layers)h+=l.max;if(s.type==='wall'||!s.open)h+=s.baseMax;return h}
function blocking(s){return s.layers.length>0||(s.type==='wall'&&s.base>0)||(s.type!=='wall'&&!s.open&&s.base>0)}
function solidT(x,y){if(x<0||y<0||x>=N||y>=N)return true;const i=idx(x,y),t=tiles[i];if(t===TREE)return true;if(t<WALL||t>WIN)return false;return blocking(structs.get(i))}
function sAt(x,y){if(x<0||y<0||x>=N||y>=N)return null;return structs.get(idx(x,y))||null}
const breach=s=>s.type!=='wall'?!blocking(s):(s.base<=0&&!s.layers.length);
function layerHp(mat,s,fast,p){return Math.round(MATS[mat].hp*LOC[s.type].m*FAST[fast].m*(p?lvB(p):1))}

function demolish(s){const cx=(s.x+.5)*T,cy=(s.y+.5)*T,v=volAt(cx,cy);chips(cx,cy,'#7a5a3c',24,true);burst(cx,cy,'#5a4a3a',10,200,5,.7);sfx.brk(v);
  structs.delete(s.i);tiles[s.i]=s.under;ffDirty=true;structDel.push(s.i);dirty.delete(s.i);{const o=players.find(q=>q.id===s.owner);if(o&&!o.isBot)TO(o,()=>addText(cx,cy-20,'Ściana zniszczona!','#ff6b5b',16))}}
function hitStruct(s,dmg,src){
  s.hitT=1;const cx=(s.x+.5)*T,cy=(s.y+.5)*T,v=volAt(cx,cy);
  if(s.layers.length){const l=s.layers[s.layers.length-1];l.hp-=dmg;l.hitT=1;chips(cx,cy,MATS[l.mat].col,5);
    if(l.mat==='wood')sfx.wood(v);else sfx.metal(v);
    if(l.hp<=0){s.layers.pop();chips(cx,cy,MATS[l.mat].col,16,true);if(v>0)sfx.brk(v);ring(cx,cy,'#ffffff',8,50,.35,3);if(v>.4)shake(4*v);
      if(s.house!=null)for(const q of players)if(!q.isBot&&q.role==='s'&&inHouse(q)===s.house)TO(q,()=>addText(cx,cy-20,'Barykada pękła!','#ff6b5b',16))}}
  else if(s.type==='window'&&!s.open&&s.base>0){s.base-=dmg;noise(.08,.15*v,5000,0,'highpass');if(s.base<=0){s.base=0;s.open=true;s.broken=true;sfx.glass(v);ev({k:'glass',a:[cx|0,cy|0]});if(v>.4)shake(3*v)}}
  else if(s.type==='door'&&!s.open&&s.base>0){s.base-=dmg;sfx.wood(v);chips(cx,cy,'#7b5434',5);if(s.base<=0){s.base=0;s.open=true;s.broken=true;chips(cx,cy,'#7b5434',18,true);sfx.brk(v);if(v>.4)shake(5*v)}}
  else if(s.type==='wall'&&s.built&&s.base>0){s.base-=dmg;sfx.wood(v);chips(cx,cy,'#7a5a3c',5);if(s.base<=0){demolish(s);if(v>.4)shake(6*v)}}
  ffDirty=true;if(structs.has(s.i))DS(s);
}
/* ================= entities ================= */
let me=null,uid=1,time=0,phase='idle',phaseT=0,phaseMax=60,winner=null;
function lvB(p){return 1+(p.lvl-1)*.005}
function makePlayer(name,color,isBot,lvl,skills,cls){
  const p={id:uid++,name,color,isBot,lvl,x:0,y:0,vx:0,vy:0,r:16,ang:rand(0,TAU),role:'s',hp:100,sta:100,staT:-9,
    sk:skills,cls,alpha:false,inv:{foil:0,wood:0,rust:0,steel:0},fx:{nails:0,staples:0,tape:0,rope:0},bmode:0,bt:null,placeCd:0,tools:{hammer:false,drill:false,crowbar:false},sel:-1,remT:0,remS:null,hold:null,buildT:0,buildS:null,
    atkCd:0,swingT:0,stun:0,shoveCd:0,shoveT:0,lastHurt:-9,flash:0,turnT:-9,infections:0,built:0,diedAt:null,focus:null,
    walk:0,ai:{t:0,mode:'',path:null,goal:-1,repath:0,house:null,spot:null,stuck:0,lx:0,ly:0,slot:null,item:null,f:null}};
  return p;
}
function botSkills(l){const m=Math.min(MAXSK,Math.floor(l/9));const r=()=>randi(Math.max(0,m-2),m);return{s:{bag:r(),stam:r(),sprint:r(),str:r(),luck:r()},z:{str:r(),sprint:r()}}}
function pickBotClass(p){const r=Math.random();if(p.lvl>=15&&r<.25)return'brute';if(p.lvl>=8&&r<.55)return'runner';return'walker'}
function SS(p){const s=p.sk.s,lb=lvB(p),walk=148*(1+(p.lvl-1)*.002);return{speed:walk,sprint:walk*1.5*(1+.05*s.sprint),staMax:100*(1+.2*s.stam)*lb,drain:24*(1-.1*s.sprint),
  build:1.5/((1+.12*s.str)*lb),grip:(1+.18*s.str)*lb,shove:330*(1+.1*s.str),luck:s.luck*.08,cap:8+2*(s.bag||0)}}
function ZS(p){const c=CLASSES[p.cls],z=p.sk.z,lb=lvB(p),sp=c.speed*(1+(p.lvl-1)*.002);return{speed:sp,sprint:sp*1.3*(1+.06*z.sprint),staMax:100,drain:30*(1-.1*z.sprint),
  dmg:c.dmg*(1+.12*z.str)*lb*(p.alpha?1.25:1),pdmg:c.pdmg*(p.alpha?1.15:1),cd:c.cd,push:c.push*lb,r:c.r}}
const ST=p=>p.role==='s'?SS(p):ZS(p);
const invTotal=p=>p.inv.foil+p.inv.wood+p.inv.rust+p.inv.steel;
const survivors=()=>players.filter(p=>p.role==='s');
const zombies=()=>players.filter(p=>p.role==='z');
function inHouse(p){const tx=Math.floor(p.x/T),ty=Math.floor(p.y/T);for(const h of houses)if(tx>h.x0&&tx<h.x0+h.w-1&&ty>h.y0&&ty<h.y0+h.h-1)return h.id;return null}
/* ================= fx -> events ================= */
let CT=null,LP={x:0,y:0};
function ev(o){if(CT)o.to=CT.id;EMIT(o)}
function TO(p,fn){const o=CT;CT=p;try{fn()}finally{CT=o}}
function volAt(x,y){LP={x,y};return 1}
const sfx=new Proxy({},{get:(_,n)=>(v=1)=>ev({k:'snd',n,v:+v||1,x:LP.x,y:LP.y})});
function noise(...a){ev({k:'raw',f:'n',a,x:LP.x,y:LP.y})}
function tone(...a){ev({k:'raw',f:'t',a,x:LP.x,y:LP.y})}
function burst(x,y,col,n,spd,size,life){ev({k:'burst',a:[x|0,y|0,col,n,spd,size,life]})}
function chips(x,y,col,n,big){ev({k:'chips',a:[x|0,y|0,col,n,big?1:0]})}
function ring(x,y,col,r0,r1,life,w){ev({k:'ring',a:[x|0,y|0,col,r0,r1,life,w]})}
function addText(x,y,txt,col,size=16){ev({k:'text',a:[x|0,y|0,String(txt),col,size]})}
function shake(v){ev({k:'shake',v,x:LP.x,y:LP.y})}
function overlay(c){ev({k:'ov',c})}
function banner(t,s,col){ev({k:'banner',t,s:s||'',col})}
const updInv=()=>{},updRole=()=>{};
const dirty=new Set();let structDel=[];
function DS(s){dirty.add(typeof s==='number'?s:s.i)}

/* ================= pathfinding ================= */
class Heap{constructor(){this.a=[];this.p=[]}get size(){return this.a.length}
  push(v,pr){const a=this.a,p=this.p;a.push(v);p.push(pr);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(p[j]<=p[i])break;[a[i],a[j]]=[a[j],a[i]];[p[i],p[j]]=[p[j],p[i]];i=j}}
  pop(){const a=this.a,p=this.p,top=a[0];this.lp=p[0];const lv=a.pop(),lp=p.pop();if(a.length){a[0]=lv;p[0]=lp;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&p[l]<p[m])m=l;if(r<a.length&&p[r]<p[m])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];[p[i],p[m]]=[p[m],p[i]];i=m}}return top}}
const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function survPass(x,y){if(x<0||y<0||x>=N||y>=N)return false;const t=tiles[idx(x,y)];if(t===TREE||sblock[idx(x,y)]||fblock[idx(x,y)])return false;if(t<WALL||t>WIN)return true;const s=structs.get(idx(x,y));
  if(!blocking(s))return true;return s.type!=='wall'&&!s.layers.length&&s.base>0}
const gS=new Float64Array(N*N),came=new Int32Array(N*N),closedA=new Uint8Array(N*N);
function astar(sx,sy,gx,gy){
  if(!survPass(gx,gy)&&!fblock[idx(gx,gy)])return null;const gfb=fblock[idx(gx,gy)];fblock[idx(gx,gy)]=0;try{gS.fill(1e9);closedA.fill(0);const h=new Heap(),s=idx(sx,sy),g=idx(gx,gy);gS[s]=0;came[s]=-1;h.push(s,0);let it=0;
  while(h.size&&it++<4000){const c=h.pop();if(c===g){const path=[];let k=g;while(k!==s&&k!==-1){path.push(k);k=came[k]}return path.reverse()}
    if(closedA[c])continue;closedA[c]=1;const cx=c%N,cy=(c/N)|0;
    for(const [dx,dy,w] of DIRS){const nx=cx+dx,ny=cy+dy;if(!survPass(nx,ny))continue;if(dx&&dy&&(!survPass(cx+dx,cy)||!survPass(cx,cy+dy)))continue;
      const ni=idx(nx,ny),ng=gS[c]+w;if(ng<gS[ni]){gS[ni]=ng;came[ni]=c;h.push(ni,ng+Math.hypot(nx-gx,ny-gy))}}}
  return null}finally{fblock[idx(gx,gy)]=gfb}}
// zombie flow field: cost in seconds to reach nearest survivor
const flow=new Float64Array(N*N);let ffT=0,ffDirty=true;
const ZDPS=10,STEP=.27;
function buildFlow(){flow.fill(1e9);const h=new Heap();
  for(const p of players)if(p.role==='s'){const i=idx(clamp(Math.floor(p.x/T),0,N-1),clamp(Math.floor(p.y/T),0,N-1));flow[i]=0;h.push(i,0)}
  while(h.size){const c=h.pop();if(h.lp>flow[c]+1e-9)continue;const cd=flow[c];const cx=c%N,cy=(c/N)|0;
    for(const [dx,dy,w] of DIRS){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const ni=idx(nx,ny),t=tiles[ni];if(t===TREE||sblock[ni])continue;
      if(dx&&dy&&(solidT(cx+dx,cy)||solidT(cx,cy+dy)||sblock[idx(cx+dx,cy)]||sblock[idx(cx,cy+dy)]))continue;
      let cost=STEP*w;if(t>=WALL&&t<=WIN){const s=structs.get(ni);if(blocking(s)){if(s.type==='wall'&&!s.built)continue;cost+=sHp(s)/ZDPS}}
      const nd=cd+cost;if(nd<flow[ni]){flow[ni]=nd;h.push(ni,nd)}}}
  ffDirty=false}
function los(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/18);for(let i=1;i<n;i++){const x=lerp(a.x,b.x,i/n),y=lerp(a.y,b.y,i/n);if(solidT(Math.floor(x/T),Math.floor(y/T)))return false}return true}

/* ================= focus / interactions ================= */
function findFocus(p,reach=20){const fx=p.x+Math.cos(p.ang)*(p.r+14),fy=p.y+Math.sin(p.ang)*(p.r+14);let best=null,bd=1e9;
  const tx=Math.floor(fx/T),ty=Math.floor(fy/T);
  for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++){const s=sAt(x,y);if(!s)continue;const nx=clamp(fx,x*T,x*T+T),ny=clamp(fy,y*T,y*T+T);const d=Math.hypot(fx-nx,fy-ny);
    if(d<bd&&d<reach){bd=d;best=s}}return best}
function nearFurn(p){let best=null,bd=1e9;for(const f of furn){if(f.static||(f.holder&&f.holder!==p))continue;const nx=clamp(p.x,f.x-f.w/2,f.x+f.w/2),ny=clamp(p.y,f.y-f.h/2,f.y+f.h/2);const d=Math.hypot(p.x-nx,p.y-ny);if(d<p.r+16&&d<bd){bd=d;best=f}}return best}
function matToUse(p){const pref=MATK[p.sel];if(p.inv[pref]>0)return pref;for(let i=3;i>=0;i--)if(p.inv[MATK[i]]>0)return MATK[i];return null}
function fastOf(p){if(p.fx.nails>0&&p.tools.drill)return'drill';if(p.fx.nails>0&&p.tools.hammer)return'hammer';if(p.fx.staples>0)return'staples';if(p.fx.tape>0)return'tape';return null}
const fUses=p=>p.fx.tape+p.fx.staples+(p.tools.hammer||p.tools.drill?p.fx.nails:0);
function upMat(p){const pref=MATK[p.sel];if(pref&&pref!=='foil'&&p.inv[pref]>0)return pref;for(let i=3;i>=1;i--)if(p.inv[MATK[i]]>0)return MATK[i];return null}
function canUpgrade(p,s){return !!(s&&s.built&&s.type==='wall'&&s.ups.length<3&&upMat(p))}
function upgradeWall(p,s){const mat=upMat(p);if(!mat)return;p.inv[mat]--;const add=Math.round(MATS[mat].hp*lvB(p));s.base+=add;s.baseMax+=add;s.ups.push(mat);p.built++;DS(s);
  const cx=(s.x+.5)*T,cy=(s.y+.5)*T,v=volAt(cx,cy);chips(cx,cy,MATS[mat].col,10);ring(cx,cy,MATS[mat].col,6,40,.4,3);if(v>0)sfx.hammer(v);
  if(!p.isBot)TO(p,()=>{addText(cx,cy-18,'+'+add+' HP','#9be564',17);updInv(mat)});ffDirty=true}
function bTarget(p){let tx,ty;if(!p.isBot&&p.inp&&Number.isFinite(p.inp.btx)&&Number.isFinite(p.inp.bty)){tx=p.inp.btx|0;ty=p.inp.bty|0}
  else{tx=Math.floor((p.x+Math.cos(p.ang)*(p.r+26))/T);ty=Math.floor((p.y+Math.sin(p.ang)*(p.r+26))/T)}
  const r={tx,ty,ok:false,why:''};if(tx<1||ty<1||tx>=N-1||ty>=N-1){r.why='Poza mapą';return r}
  const cx=(tx+.5)*T,cy=(ty+.5)*T,i=idx(tx,ty),t=tiles[i];
  if(Math.hypot(cx-p.x,cy-p.y)>130){r.why='Za daleko';return r}
  if(!(t===G||t===ROAD||t===PLAZA||t===FLOOR)||sblock[i]){r.why='Tu nie można budować';return r}
  if(furn.some(f=>Math.abs(f.x-cx)<f.w/2+T/2-4&&Math.abs(f.y-cy)<f.h/2+T/2-4)){r.why='Zajęte przez mebel';return r}
  if(players.some(q=>{const nx=clamp(q.x,tx*T,tx*T+T),ny=clamp(q.y,ty*T,ty*T+T);return Math.hypot(q.x-nx,q.y-ny)<q.r-1})){r.why='Ktoś tu stoi';return r}
  if(p.fx.rope<=0){r.why='Potrzebujesz liny';return r}
  if(!BMAT.some(k=>p.inv[k]>0)){r.why='Potrzebujesz deski lub blachy';return r}
  r.ok=true;return r}
function placePiece(p,tx,ty,kind){const P=PIECE[kind],i=idx(tx,ty),under=tiles[i];const mat=BMAT.find(k=>p.inv[k]>0);if(!mat||p.fx.rope<=0)return;p.inv[mat]--;p.fx.rope--;
  const isS=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&tiles[idx(x,y)]>=WALL&&tiles[idx(x,y)]<=WIN;
  let axis;if(isS(tx-1,ty)||isS(tx+1,ty))axis='h';else if(isS(tx,ty-1)||isS(tx,ty+1))axis='v';else axis=Math.abs(p.x-(tx+.5)*T)>Math.abs(p.y-(ty+.5)*T)?'v':'h';
  let inX=tx,inY=ty;if(axis==='h')inY=ty+(p.y>(ty+.5)*T?1:-1);else inX=tx+(p.x>(tx+.5)*T?1:-1);
  tiles[i]=P.type==='wall'?WALL:P.type==='door'?DOOR:WIN;
  structs.set(i,{i,x:tx,y:ty,type:P.type,base:P.hp,baseMax:P.hp,open:false,broken:false,layers:[],house:null,axis,inX,inY,outX:null,outY:null,hitT:0,built:true,under,ups:[],born:time,owner:p.id});
  for(const o of items){if(Math.floor(o.x/T)===tx&&Math.floor(o.y/T)===ty){o.x=p.x;o.y=p.y}}
  const fix=(x,y)=>{const q=sAt(x,y);if(!q||!q.built)return;const hN=isS(x-1,y)+isS(x+1,y),vN=isS(x,y-1)+isS(x,y+1);if(hN===vN)return;const na=hN>vN?'h':'v';if(na!==q.axis){q.axis=na;
    if(q.type!=='wall'){q.inX=x;q.inY=y;if(na==='h')q.inY=y+(p.y>(y+.5)*T?1:-1);else q.inX=x+(p.x>(x+.5)*T?1:-1)}}};
  fix(tx,ty);fix(tx-1,ty);fix(tx+1,ty);fix(tx,ty-1);fix(tx,ty+1);for(const [a,b] of [[tx,ty],[tx-1,ty],[tx+1,ty],[tx,ty-1],[tx,ty+1]])if(a>=0&&b>=0&&a<N&&b<N&&structs.has(idx(a,b)))DS(idx(a,b));
  const cx=(tx+.5)*T,cy=(ty+.5)*T,v=volAt(cx,cy);chips(cx,cy,'#9b7444',10);ring(cx,cy,'#ffcf5c',8,44,.45,3);if(v>0){sfx.hammer(v);tone(300,.15,'triangle',.08*v,120,.08)}
  p.built++;if(!p.isBot)TO(p,()=>{addText(cx,cy-20,P.name+' postawiona','#ffcf5c',15);updInv(mat)});ffDirty=true}
function canBuild(p,s){return !!(s&&s.type!=='wall'&&s.layers.length<LOC[s.type].max&&matToUse(p)&&fastOf(p))}
function addLayer(p,s){const mat=matToUse(p),fast=fastOf(p);if(!mat||!fast)return;const hp=layerHp(mat,s,fast,p);
  p.inv[mat]--;if(fast==='tape')p.fx.tape--;else if(fast==='staples')p.fx.staples--;else p.fx.nails--;s.layers.push({mat,fast,hp,max:hp,seed:Math.random(),hitT:0,born:time});p.built++;DS(s);
  const cx=(s.x+.5)*T,cy=(s.y+.5)*T,v=volAt(cx,cy);chips(cx,cy,MATS[mat].col,8);ring(cx,cy,MATS[mat].col,6,34,.35,3);
  if(v>0){if(fast==='drill')sfx.drill(v);else sfx.hammer(v)}
  if(!p.isBot)TO(p,()=>{addText(cx,cy-18,'+'+hp+' HP','#9be564',17);updInv(mat)});
  for(const q of players){if(q===p)continue;/* push out anyone trapped */}
  ffDirty=true}
function canRemove(p,s){if(!s||s.type==='wall'||!s.layers.length)return null;const l=s.layers[s.layers.length-1];
  if(l.fast==='tape')return'tape';if(l.fast==='staples')return'staple';if(l.fast==='hammer')return p.tools.crowbar?'bar':'needbar';return'screw'}
const remTime=(p,k)=>(k==='tape'?1.1:k==='staple'?1.5:1.9)/((1+.12*p.sk.s.str)*lvB(p));
function removeLayer(p,s){const l=s.layers.pop();if(!l)return;DS(s);const cx=(s.x+.5)*T,cy=(s.y+.5)*T,v=volAt(cx,cy);
  if(invTotal(p)<SS(p).cap)p.inv[l.mat]++;else items.push({id:++IID,type:l.mat,x:p.x+rand(-14,14),y:p.y+rand(-14,14),born:time,ph:rand(0,TAU),claim:null,amt:1});
  chips(cx,cy,MATS[l.mat].col,10);ring(cx,cy,'#ff9a5c',6,36,.35,3);
  if(l.fast==='tape'||l.fast==='staples'){noise(.35,.25*v,5000,0,'highpass');noise(.25,.15*v,2500,.1,'bandpass')}else{tone(1400,.35,'sawtooth',.04*v,-900);noise(.2,.25*v,1500);sfx.wood(v*.7)}
  if(!p.isBot)TO(p,()=>{addText(cx,cy-18,(l.fast!=='hammer'?'Zdjęto: ':'Wyrwano: ')+MATS[l.mat].name,'#ffcf5c',15);updInv(l.mat)});
  ffDirty=true}
function toggleDoor(p,s){if(!s||s.type==='wall'||s.layers.length||s.broken)return false;
  if(s.open){for(const q of players){const nx=clamp(q.x,s.x*T,s.x*T+T),ny=clamp(q.y,s.y*T,s.y*T+T);if(Math.hypot(q.x-nx,q.y-ny)<q.r-2)return false}}
  s.open=!s.open;DS(s);const v=volAt((s.x+.5)*T,(s.y+.5)*T);if(s.type==='window')sfx.win(v);else sfx.door(v);ffDirty=true;return true}
function grab(p,f){if(!f||f.holder)return;p.hold=f;f.holder=p;f.ox=f.x-p.x;f.oy=f.y-p.y;if(!p.isBot)TO(p,()=>sfx.grip())}
function release(p,exhaust){const f=p.hold;if(!f)return;f.holder=null;p.hold=null;if(exhaust){addText(p.x,p.y-26,'Brak sił!','#ffcf5c',16);if(!p.isBot)TO(p,()=>{sfx.grip();shake(3)});}}
function shove(p){const S=SS(p);if(p.shoveCd>0||p.sta<25)return;p.sta-=25;p.staT=time;p.shoveCd=.9;p.shoveT=1;let hit=false;
  for(const z of players){if(z.role!=='z')continue;const d=dist(p,z),a=Math.atan2(z.y-p.y,z.x-p.x);if(d<p.r+z.r+30&&Math.abs(angDiff(p.ang,a))<1.1){
    const k=S.shove/CLASSES[z.cls].push;z.vx+=Math.cos(a)*k;z.vy+=Math.sin(a)*k;z.stun=.95/Math.sqrt(CLASSES[z.cls].push);hit=true;ring(z.x,z.y,'#ffffff',z.r,z.r*2.2,.3,3)}}
  const v=volAt(p.x,p.y);if(v>0)sfx.shove();if(hit&&!p.isBot)TO(p,()=>shake(3))}
function swing(p){const S=ZS(p);p.atkCd=S.cd;p.swingT=1;const v=volAt(p.x,p.y);if(v>0){sfx.swipe(v);if(Math.random()<.3)sfx.growl(v)}
  let hit=false;
  for(const q of players){if(q.role!=='s')continue;const d=dist(p,q),a=Math.atan2(q.y-p.y,q.x-p.x);
    if(d<p.r+q.r+24&&Math.abs(angDiff(p.ang,a))<1.15&&los(p,q)){hurt(q,S.pdmg,p,a);hit=true}}
  if(!hit){const s=findFocus(p,24);if(s&&blocking(s)&&(s.type!=='wall'||s.built))hitStruct(s,S.dmg,p);
    else{const fx=p.x+Math.cos(p.ang)*(p.r+10),fy=p.y+Math.sin(p.ang)*(p.r+10);
      for(const f of furn){if(f.static)continue;const h=circRect({x:fx,y:fy,r:16},f);if(!h)continue;hitFurn(f,S.dmg,p);break}}}}
function hitFurn(f,dmg,src){f.shake=1;f.hitT=time;const v=volAt(f.x,f.y);sfx.wood(v*.8);chips(f.x,f.y,f.col,5);
  if(f.holder&&f.holder.role==='s'){const hz=f.holder;hz.sta-=dmg*2.2/SS(hz).grip;hz.staT=time;if(hz.sta<=0){hz.sta=0;release(hz,true)}return}
  f.hp-=dmg*1.3;if(f.hp<=0){if(f.holder)release(f.holder);chips(f.x,f.y,f.col,24,true);burst(f.x,f.y,shade(f.col,-.3),10,200,5,.7);sfx.brk(v);if(v>.4)shake(5*v);furn.splice(furn.indexOf(f),1)}}
function hurt(q,dmg,src,a){if(q.role!=='s')return;q.hp-=dmg;q.lastHurt=time;q.flash=1;q.vx+=Math.cos(a)*220;q.vy+=Math.sin(a)*220;
  burst(q.x,q.y,'#c0392b',8,180,3.5,.6);if(!q.isBot)TO(q,()=>{shake(7);sfx.hurt();overlay('red')});
  if(q.hold&&Math.random()<.5)release(q,true);
  if(q.hp<=0)infect(q,src)}
function infect(q,src,alpha){
  release(q);q.role='z';q.alpha=!!alpha;q.cls=!q.isBot?(CLASSES[q.pcls]?q.pcls:'walker'):pickBotClass(q);q.r=CLASSES[q.cls].r;q.hp=100;q.sta=100;q.turnT=time;q.buildT=0;
  if(!alpha)q.diedAt=time;
  for(const k of MATK)for(let i=0;i<q.inv[k];i++)items.push({id:++IID,type:k,x:q.x+rand(-26,26),y:q.y+rand(-26,26),born:time,ph:rand(0,TAU),claim:null});
  for(const k of ['hammer','drill','crowbar'])if(q.tools[k])items.push({id:++IID,type:k,x:q.x+rand(-26,26),y:q.y+rand(-26,26),born:time,ph:rand(0,TAU),claim:null});
  for(const k of FXK)if(q.fx[k]>0)items.push({id:++IID,type:k,x:q.x+rand(-26,26),y:q.y+rand(-26,26),born:time,ph:rand(0,TAU),claim:null,amt:q.fx[k]});
  q.inv={foil:0,wood:0,rust:0,steel:0};q.fx={nails:0,staples:0,tape:0,rope:0};q.bmode=0;q.tools={hammer:false,drill:false,crowbar:false};q.remT=0;
  burst(q.x,q.y,'#7fbf4a',30,260,6,1.1);ring(q.x,q.y,'#9be564',q.r,q.r*5,.8,8);ring(q.x,q.y,'#ffffff',q.r,q.r*3,.4,3);
  const v=volAt(q.x,q.y);sfx.infect(Math.max(.25,v));
  if(src){src.infections++;ev({k:'feed',a:src.name,ac:'#9be564',v:'zaraził',b:q.name,bc:q.color,ids:[src.id,q.id]})}
  if(!q.isBot)TO(q,()=>{if(alpha){banner('TY JESTEŚ ZOMBIE!','Zaraź wszystkich ocalałych w 5 minut','#9be564')}else banner('ZARAŻONY!','Teraz polujesz na ocalałych','#9be564');overlay('green');shake(10)});
  if(src&&!src.isBot)TO(src,()=>{banner('ZARAŻENIE','+1 do drużyny zombie','#9be564');shake(5)})
  ffDirty=true;checkEnd()}

/* ================= bots ================= */
function goTo(p,gx,gy,it){
  const sx=clamp(Math.floor(p.x/T),0,N-1),sy=clamp(Math.floor(p.y/T),0,N-1),tx=clamp(Math.floor(gx/T),0,N-1),ty=clamp(Math.floor(gy/T),0,N-1),g=idx(tx,ty),ai=p.ai;
  if(ai.goal!==g||time>ai.repath){ai.goal=g;ai.repath=time+1.4+Math.random()*.4;ai.path=(sx===tx&&sy===ty)?[]:astar(sx,sy,tx,ty)}
  const path=ai.path;let wx=gx,wy=gy;
  if(path&&path.length){while(path.length){const c=path[0],cx=(c%N+.5)*T,cy=((c/N|0)+.5)*T;if(Math.hypot(p.x-cx,p.y-cy)<15&&path.length>1)path.shift();else break}
    if(path.length>1||Math.hypot(p.x-gx,p.y-gy)>T){const c=path[0];wx=(c%N+.5)*T;wy=((c/N|0)+.5)*T;
      const s=structs.get(c);if(s&&s.type!=='wall'&&!s.open&&!s.layers.length&&Math.hypot(p.x-wx,p.y-wy)<62){toggleDoor(p,s)}}}
  else if(path===null){ai.repath=Math.min(ai.repath,time+.6)}
  const dx=wx-p.x,dy=wy-p.y,d=Math.hypot(dx,dy);
  if(d>3){it.mx=dx/d;it.my=dy/d;if(d<12){it.mx*=d/12;it.my*=d/12}}
  return Math.hypot(p.x-gx,p.y-gy)}
function interiorPoint(h){return{x:rand((h.x0+1.6)*T,(h.x0+h.w-1.6)*T),y:rand((h.y0+1.6)*T,(h.y0+h.h-1.6)*T)}}
function houseSealed(h){return h.open.every(s=>s.layers.length>0)}
function survBot(p,dt,it){
  const ai=p.ai,S=SS(p);ai.t-=dt;
  if(!ai.house||(houseSealed(ai.house)&&inHouse(p)!==ai.house.id&&phase==='prep')){
    const cnt=houses.map(h=>players.filter(q=>q.ai.house===h&&q.role==='s').length);
    const cands=houses.filter(h=>!houseSealed(h));const pool=cands.length?cands:houses;
    ai.house=pool.reduce((b,h)=>{const sc=Math.abs(cnt[h.id]-1)*350+h.open.length*60+Math.hypot(h.cx-p.x,h.cy-p.y)*rand(.5,1);return !b||sc<b.sc?{h,sc}:b},null).h;ai.spot=interiorPoint(ai.house)}
  const H=ai.house,tot=invTotal(p),home=inHouse(p)===H.id;
  // threat
  let thr=null,td=1e9;if(phase==='night')for(const z of players)if(z.role==='z'){const d=dist(p,z);if(d<td&&d<300&&los(p,z)){td=d;thr=z}}
  if(ai.t<=0){ai.t=rand(.25,.4);
    const left=phaseT;
    if(phase==='prep'){
      const uses=fUses(p),hasTool=p.tools.hammer||p.tools.drill;
      if(((tot<4||uses<Math.min(tot,4))&&left>20)||((tot===0||uses===0)&&left>6)){
        let bi=null,bs=1e9;for(const o of items){if(o.claim&&o.claim!==p)continue;if(MATK.includes(o.type)?tot>=S.cap:FXK.includes(o.type)?p.fx[o.type]>=FXCAP:p.tools[o.type])continue;
          const need=uses<tot+2,fb=o.type==='tape'?(need?150:0):o.type==='staples'?(need?200:0):o.type==='nails'?(need?(hasTool?240:70):0):(o.type==='hammer'||o.type==='drill')&&!hasTool?(p.fx.nails>0?420:170):0;
          const d=Math.hypot(o.x-p.x,o.y-p.y)+Math.hypot(o.x-H.cx,o.y-H.cy)*.35-(o.type==='steel'?140:o.type==='rust'?60:o.type==='foil'?-120:0)-fb-(MATK.includes(o.type)&&uses>tot?60:0);if(d<bs){bs=d;bi=o}}
        if(ai.item&&ai.item.claim===p)ai.item.claim=null;ai.item=bi;if(bi){bi.claim=p;ai.mode='loot'}else ai.mode=tot&&uses?'build':'home'}
      else ai.mode=tot&&uses?'build':'home'}
    else{
      if(thr&&td<190)ai.mode='flee';
      else if(!home&&!houseSealed(H))ai.mode='home';
      else if(!home){ai.mode='roam'}
      else{const openDoor=H.open.find(s=>s.open&&!s.broken&&!s.layers.length);
        const zNear=players.some(z=>z.role==='z'&&Math.hypot(z.x-H.cx,z.y-H.cy)<520);
        const br=H.open.find(s=>breach(s));
        if(openDoor)ai.mode='close',ai.slot=openDoor;
        else if(tot>0&&fUses(p)>0)ai.mode='build';
        else if(br&&zNear&&(p.hold||furn.some(f=>!f.static&&!f.holder&&f.x>H.x0*T&&f.x<(H.x0+H.w)*T&&f.y>H.y0*T&&f.y<(H.y0+H.h)*T))){ai.mode='furn';ai.slot=br}
        else ai.mode='hide'}}
    if(ai.mode==='build'){let bs=null,bv=1e9;for(const s of H.open){if(s.layers.length>=LOC[s.type].max)continue;
        const busy=players.some(q=>q!==p&&q.ai.slot===s&&q.ai.mode==='build');const zn=players.some(z=>z.role==='z'&&Math.hypot(z.x-(s.inX+.5)*T,z.y-(s.inY+.5)*T)<70);
        const v=s.layers.length*100+sHp(s)*.2+(busy?300:0)+(zn?600:0)+Math.hypot((s.x+.5)*T-p.x,(s.y+.5)*T-p.y)*.3;if(v<bv){bv=v;bs=s}}
      if(bs)ai.slot=bs;else ai.mode='hide'}
    if(p.hold&&ai.mode!=='furn')release(p);
  }
  const m=ai.mode;
  if(m==='loot'&&ai.item){if(!items.includes(ai.item)){ai.t=0}else goTo(p,ai.item.x,ai.item.y,it)}
  else if(m==='build'&&ai.slot){const s=ai.slot,gx=(s.inX+.5)*T,gy=(s.inY+.5)*T;const d=goTo(p,gx,gy,it);
    if(d<26){it.mx*=.2;it.my*=.2;it.ang=Math.atan2((s.y+.5)*T-p.y,(s.x+.5)*T-p.x);it.act=true}}
  else if(m==='close'&&ai.slot){const s=ai.slot,gx=(s.inX+.5)*T,gy=(s.inY+.5)*T;const d=goTo(p,gx,gy,it);if(d<30){it.ang=Math.atan2((s.y+.5)*T-p.y,(s.x+.5)*T-p.x);if(toggleDoor(p,s))ai.t=0}}
  else if(m==='flee'&&thr){let ax=p.x-thr.x,ay=p.y-thr.y;const l=Math.hypot(ax,ay)||1;
    if(home){let best=null,bd=-1;for(let k=0;k<6;k++){const q=interiorPoint(H);const d=Math.hypot(q.x-thr.x,q.y-thr.y);if(d>bd){bd=d;best=q}}ai.spot=best;goTo(p,best.x,best.y,it)}
    else{it.mx=ax/l;it.my=ay/l}
    it.sprint=p.sta>15;if(td<p.r+thr.r+22&&p.sta>30){it.ang=Math.atan2(thr.y-p.y,thr.x-p.x);it.shove=true}}
  else if(m==='furn'&&ai.slot){const s=ai.slot,tgx=(s.inX+.5)*T,tgy=(s.inY+.5)*T;
    if(!p.hold){let bf=null,bd=1e9;for(const f of furn){if(f.static||f.holder)continue;if(!(f.x>H.x0*T&&f.x<(H.x0+H.w)*T&&f.y>H.y0*T&&f.y<(H.y0+H.h)*T))continue;const d=Math.hypot(f.x-p.x,f.y-p.y);if(d<bd){bd=d;bf=f}}
      if(bf){goTo(p,bf.x,bf.y,it);const nx=clamp(p.x,bf.x-bf.w/2,bf.x+bf.w/2),ny=clamp(p.y,bf.y-bf.h/2,bf.y+bf.h/2);if(Math.hypot(p.x-nx,p.y-ny)<p.r+12){grab(p,bf)}}}
    else{const f=p.hold;const d=goTo(p,tgx-f.ox,tgy-f.oy,it);it.ang=Math.atan2((s.y+.5)*T-p.y,(s.x+.5)*T-p.x);if(d<20){it.mx*=.3;it.my*=.3}
      if(!players.some(z=>z.role==='z'&&Math.hypot(z.x-H.cx,z.y-H.cy)<600)&&ai.t<=.05)release(p)}
    it.grab=true}
  else if(m==='roam'){const z=players.filter(q=>q.role==='z').sort((a,b)=>dist(a,p)-dist(b,p))[0];
    const alt=houses.filter(h=>!houseSealed(h)).sort((a,b)=>Math.hypot(a.cx-p.x,a.cy-p.y)-Math.hypot(b.cx-p.x,b.cy-p.y))[0];
    if(alt&&alt!==H){ai.house=alt;ai.spot=interiorPoint(alt)}else if(z){const l=dist(p,z)||1;it.mx=(p.x-z.x)/l;it.my=(p.y-z.y)/l;it.sprint=dist(p,z)<260&&p.sta>20}}
  else{if(!ai.spot||Math.random()<.002)ai.spot=interiorPoint(H);const d=goTo(p,ai.spot.x,ai.spot.y,it);if(d<20){it.mx=it.my=0}}
  if(!it.ang&&(it.mx||it.my))it.ang=Math.atan2(it.my,it.mx);
  if(phase==='prep'&&phaseT<10&&m!=='build')it.sprint=p.sta>40&&!home;
}
function zombBot(p,dt,it){const S=ZS(p),ai=p.ai;
  let tg=null,td=1e9;for(const q of players)if(q.role==='s'){const d=dist(p,q);if(d<td){td=d;tg=q}}
  if(!tg)return;
  if(td<230&&los(p,tg)){const a=Math.atan2(tg.y-p.y,tg.x-p.x);it.mx=Math.cos(a);it.my=Math.sin(a);it.ang=a;it.act=td<p.r+tg.r+20;it.sprint=p.sta>25;return}
  const cx=clamp(Math.floor(p.x/T),0,N-1),cy=clamp(Math.floor(p.y/T),0,N-1);let bn=-1,bv=flow[idx(cx,cy)];
  for(const [dx,dy] of DIRS){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;if(dx&&dy&&(solidT(cx+dx,cy)||solidT(cx,cy+dy)))continue;const v=flow[idx(nx,ny)];if(v<bv-1e-4){bv=v;bn=idx(nx,ny)}}
  if(bn<0){if(ai.stuck>1){it.mx=rand(-1,1);it.my=rand(-1,1)}return}
  const nx=bn%N,ny=bn/N|0,wx=(nx+.5)*T,wy=(ny+.5)*T;const a=Math.atan2(wy-p.y,wx-p.x);it.mx=Math.cos(a);it.my=Math.sin(a);it.ang=a;
  const s=structs.get(bn);if(s&&blocking(s)){const rx=clamp(p.x,nx*T,nx*T+T),ry=clamp(p.y,ny*T,ny*T+T);if(Math.hypot(p.x-rx,p.y-ry)<p.r+16){it.act=true;it.mx*=.4;it.my*=.4}}
  else if(Math.hypot(p.vx,p.vy)<20&&ai.stuck>.6){it.act=true}
  it.sprint=td<420&&p.sta>40;
  if(ai.stuck>1.6){it.mx+=rand(-1,1);it.my+=rand(-1,1)}}

let beatT=0,growlT=0;
let respT=3;
function update(dt){
  time+=dt;respT-=dt;if(respT<=0){respT=phase==='prep'?2.2:4.5;if(phase!=='end'&&items.length<175)spawnOneItem(lootRoll(),time)}fbT-=dt;if(fbT<=0){fbT=.5;buildFBlock()}
  if(phase==='prep'){phaseT-=dt;if(phaseT<=0)startNight()}
  else if(phase==='night'){phaseT-=dt;if(phaseT<=0)endRound('s')}
  else if(phase==='end'){phaseT-=dt;if(phaseT<=0){startRound();return}}
  if(phase==='night'||phase==='end'){ffT-=dt;if(ffT<=0||ffDirty&&ffT<.25){ffT=.4;buildFlow()}}
  for(const p of players){
    CT=null;const S=ST(p),it=p.isBot?(p.role==='s'?(phase==='idle'?{mx:0,my:0}:(()=>{const o={mx:0,my:0,ang:0};survBot(p,dt,o);return o})()):(()=>{const o={mx:0,my:0,ang:0};zombBot(p,dt,o);return o})()):netIntent(p);
    if(phase==='end'){it.mx*=.0;it.my*=.0;it.act=false}
    if(it.ang)p.ang+=angDiff(p.ang,it.ang)*Math.min(1,dt*(p.isBot?10:25));
    p.stun=Math.max(0,p.stun-dt);p.atkCd=Math.max(0,p.atkCd-dt);p.swingT=Math.max(0,p.swingT-dt*4);p.shoveCd=Math.max(0,p.shoveCd-dt);p.shoveT=Math.max(0,p.shoveT-dt*4);p.flash=Math.max(0,p.flash-dt*5);
    let sp=S.speed;const moving=Math.hypot(it.mx,it.my)>.1;
    if(it.sprint&&moving&&p.sta>1&&!p.hold){sp=S.sprint;p.sta-=S.drain*dt;p.staT=time}
    if(p.hold){sp*=.6;if(moving){if(p.sta>0){p.sta=Math.max(0,p.sta-(p.role==='s'?15/SS(p).grip:15)*dt);p.staT=time}else{sp=0;if(!p.isBot&&Math.random()<dt*2)TO(p,()=>addText(p.x,p.y-30,'Brak siły, by przesunąć','#ffcf5c',14))}}}
    if(p.role==='s'&&(p.buildT>0||p.remT>0))sp*=.35;if(p.stun>0)sp=0;
    const k=1-Math.exp(-dt*(p.stun>0?2:10));p.vx=lerp(p.vx,it.mx*sp,k);p.vy=lerp(p.vy,it.my*sp,k);
    if(time-p.staT>.7)p.sta=Math.min(S.staMax,p.sta+(p.role==='s'?20:26)*dt);
    if(p.role==='s'&&time-p.lastHurt>5)p.hp=Math.min(100,p.hp+3*dt);
    // actions
    if(p.role==='s'){
      const f=findFocus(p);p.focus=f;
      if(!p.isBot&&phase==='end')p.bmode=0;
      p.placeCd=Math.max(0,p.placeCd-dt);
      if(p.bmode){p.bt=bTarget(p);if(it.act&&p.bt.ok&&p.placeCd<=0&&phase!=='end'){placePiece(p,p.bt.tx,p.bt.ty,p.bmode);p.placeCd=.45}p.buildT=0;p.buildS=null}
      else if(it.act&&phase!=='end'&&(canBuild(p,f)||canUpgrade(p,f))){if(p.buildS!==f){p.buildS=f;p.buildT=0}p.buildT+=dt;
        if(Math.random()<dt*4){const v=volAt(p.x,p.y);if(v>0){fastOf(p)==='drill'?sfx.drill(v*.6):sfx.hammer(v*.6)}}
        if(p.buildT>=S.build){if(f.built&&f.type==='wall')upgradeWall(p,f);else addLayer(p,f);p.buildT=0}}
      else{p.buildT=0;p.buildS=null}
      if(it.e&&f)toggleDoor(p,f);
      if(it.shove)shove(p);
      if(p.isBot){if(it.grab&&!p.hold){const g=nearFurn(p);if(g)grab(p,g)}else if(!it.grab&&p.hold)release(p)}
      else if(it.grab){if(p.hold)release(p);else{const g=nearFurn(p);if(g)grab(p,g)}}
      const rk=it.rem&&phase!=='end'?canRemove(p,f):null;
      if(rk==='tape'||rk==='staple'||rk==='bar'){if(p.remS!==f){p.remS=f;p.remT=0}p.remT+=dt;if(Math.random()<dt*3){const v=volAt(p.x,p.y);if(v>0)noise(.1,.08*v,rk==='bar'?1200:4000)}
        if(p.remT>=remTime(p,rk)){removeLayer(p,f);p.remT=0}}else{p.remT=0;p.remS=null}
    }else{p.focus=findFocus(p,24);if(it.act&&p.atkCd<=0&&p.stun<=0&&phase==='night')swing(p)}
    // move
    const dx=p.vx*dt,dy=p.vy*dt;
    if(p.hold){const f=p.hold;f.x+=dx;f.y+=dy;const c=resolveRect(f,p);p.x+=dx+c.x;p.y+=dy+c.y}else{p.x+=dx;p.y+=dy}
    const c2=collideTiles(p);if(p.hold){p.hold.x+=c2.x;p.hold.y+=c2.y;if(Math.abs(c2.x)+Math.abs(c2.y)>0)resolveRect(p.hold,p)}
    // stuck detection (bots)
    if(p.isBot){const mv=Math.hypot(p.x-p.ai.lx,p.y-p.ai.ly);p.ai.stuck=mv<dt*25&&moving?p.ai.stuck+dt:Math.max(0,p.ai.stuck-dt*2);p.ai.lx=p.x;p.ai.ly=p.y;if(p.ai.stuck>2.5){p.ai.repath=0;p.ai.stuck=0}}
    p.walk+=Math.hypot(p.vx,p.vy)*dt*.06;
  }
  // player-player
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j];const dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r,d2=dx*dx+dy*dy;
    if(d2<rr*rr&&d2>0){const d=Math.sqrt(d2),o=(rr-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o}}
  // player-furniture
  for(const p of players){for(const f of furn){if(f===p.hold)continue;const h=circRect(p,f);if(!h)continue;
    if(f.static||f.holder){p.x+=h.nx*h.pen;p.y+=h.ny*h.pen;
      if(f.holder&&p.role==='z'&&f.holder.role==='s'&&phase==='night'){const hz=f.holder,zs=ZS(p),hs=SS(hz);hz.sta-=30*zs.push/hs.grip*dt;hz.staT=time;f.shake=1;
        if(Math.random()<dt*2){const v=volAt(f.x,f.y);if(v>0)noise(.15,.12*v,500)}
        if(hz.sta<=0){hz.sta=0;const fx=f;release(hz,true);fx.x-=h.nx*8;fx.y-=h.ny*8}}}
    else if(p.role==='s'){p.x+=h.nx*h.pen;p.y+=h.ny*h.pen}
    else{const share=clamp(.35*ZS(p).push,.2,.8);f.x-=h.nx*h.pen*share;f.y-=h.ny*h.pen*share;p.x+=h.nx*h.pen*(1-share);p.y+=h.ny*h.pen*(1-share);resolveRect(f,null);f.shake=Math.max(f.shake,.3)}}
    collideTiles(p)}
  for(const f of furn)f.shake=Math.max(0,f.shake-dt*4);
  // items
  for(let i=items.length-1;i>=0;i--){const o=items[i];for(const p of players){if(p.role!=='s')continue;if(Math.hypot(p.x-o.x,p.y-o.y)>p.r+14)continue;
    if(FXK.includes(o.type)){if(p.fx[o.type]>=FXCAP)continue;p.fx[o.type]=Math.min(FXCAP,p.fx[o.type]+(o.amt||FXAMT[o.type]));if(!p.isBot)TO(p,()=>{addText(o.x,o.y-14,'+ '+FXN[o.type]+' ('+p.fx[o.type]+')','#e8f1e4',14);sfx.pick();updInv(o.type)});}
    else if(o.type==='hammer'||o.type==='drill'||o.type==='crowbar'){if(p.tools[o.type]||(p.isBot&&o.type==='crowbar'))continue;p.tools[o.type]=true;if(!p.isBot)TO(p,()=>{addText(o.x,o.y-14,TOOLN[o.type]+'!','#ffcf5c',18);sfx.pick();updInv(o.type)});}
    else{if(invTotal(p)>=SS(p).cap){if(!p.isBot&&Math.random()<dt*3)TO(p,()=>addText(p.x,p.y-30,'Plecak pełny','#ff9a5c',14));continue}
      let t=o.type;const L=SS(p).luck;if(t!=='steel'&&Math.random()<L){t=MATK[MATK.indexOf(t)+1];if(!p.isBot)TO(p,()=>{addText(o.x,o.y-30,'Fart! '+MATS[t].name,'#9be564',17);sfx.lucky()});}
      p.inv[t]++;if(!p.isBot)TO(p,()=>{addText(o.x,o.y-14,'+ '+MATS[t].name,'#e8f1e4',14);sfx.pick();updInv(t)});}
    burst(o.x,o.y,'#ffffff',6,120,2.5,.4);if(o.claim)o.claim.ai.item=null;items.splice(i,1);break}}
  // structs
  for(const s of structs.values()){if(s.hitT>0)s.hitT=Math.max(0,s.hitT-dt*5);for(const l of s.layers)if(l.hitT>0)l.hitT=Math.max(0,l.hitT-dt*5)}
  if(phase==='night'){growlT-=dt;if(growlT<=0){growlT=rand(2,5);const z=pick(zombies());if(z){const v=volAt(z.x,z.y);if(v>.05)sfx.growl(v*.7)}}}
}
function collideTiles(o){const x0=o.x,y0=o.y;
  for(let pass=0;pass<2;pass++){const tx0=Math.floor((o.x-o.r)/T),tx1=Math.floor((o.x+o.r)/T),ty0=Math.floor((o.y-o.r)/T),ty1=Math.floor((o.y+o.r)/T);
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(!solidT(tx,ty))continue;const rx=tx*T,ry=ty*T,nx=clamp(o.x,rx,rx+T),ny=clamp(o.y,ry,ry+T);
      let dx=o.x-nx,dy=o.y-ny;const d2=dx*dx+dy*dy;if(d2>=o.r*o.r)continue;
      if(d2>1e-6){const d=Math.sqrt(d2),pn=o.r-d;o.x+=dx/d*pn;o.y+=dy/d*pn}
      else{const l=o.x-rx,r=rx+T-o.x,t=o.y-ry,b=ry+T-o.y,m=Math.min(l,r,t,b);if(m===l)o.x=rx-o.r;else if(m===r)o.x=rx+T+o.r;else if(m===t)o.y=ry-o.r;else o.y=ry+T+o.r}}}
  o.x=clamp(o.x,o.r,WS-o.r);o.y=clamp(o.y,o.r,WS-o.r);return{x:o.x-x0,y:o.y-y0}}
function circRect(o,f){if(f.round){const dx=o.x-f.x,dy=o.y-f.y,d=Math.hypot(dx,dy),rr=o.r+f.w/2;if(d>=rr||d===0)return null;return{nx:dx/d,ny:dy/d,pen:rr-d}}
  const nx=clamp(o.x,f.x-f.w/2,f.x+f.w/2),ny=clamp(o.y,f.y-f.h/2,f.y+f.h/2);const dx=o.x-nx,dy=o.y-ny,d2=dx*dx+dy*dy;if(d2>=o.r*o.r)return null;
  if(d2>1e-6){const d=Math.sqrt(d2);return{nx:dx/d,ny:dy/d,pen:o.r-d}}
  const l=o.x-(f.x-f.w/2),r=f.x+f.w/2-o.x,t=o.y-(f.y-f.h/2),b=f.y+f.h/2-o.y,m=Math.min(l,r,t,b);
  return m===l?{nx:-1,ny:0,pen:l+o.r}:m===r?{nx:1,ny:0,pen:r+o.r}:m===t?{nx:0,ny:-1,pen:t+o.r}:{nx:0,ny:1,pen:b+o.r}}
function resolveRect(f,holder){const x0=f.x,y0=f.y;
  for(let it=0;it<4;it++){let moved=false;const l=f.x-f.w/2,r=f.x+f.w/2,t=f.y-f.h/2,b=f.y+f.h/2;
    for(let ty=Math.floor(t/T);ty<=Math.floor((b-.01)/T)&&!moved;ty++)for(let tx=Math.floor(l/T);tx<=Math.floor((r-.01)/T);tx++){if(!solidT(tx,ty))continue;
      const rx=tx*T,ry=ty*T,ox=Math.min(r,rx+T)-Math.max(l,rx),oy=Math.min(b,ry+T)-Math.max(t,ry);if(ox<=0||oy<=0)continue;
      if(ox<oy)f.x+=f.x<rx+T/2?-ox:ox;else f.y+=f.y<ry+T/2?-oy:oy;moved=true;break}
    if(!moved)for(const g of furn){if(g===f)continue;if(!rectOverlap(f,g))continue;const ox=(f.w+g.w)/2-Math.abs(f.x-g.x),oy=(f.h+g.h)/2-Math.abs(f.y-g.y);
      if(ox<oy)f.x+=f.x<g.x?-ox:ox;else f.y+=f.y<g.y?-oy:oy;moved=true;break}
    if(!moved)break}
  f.x=clamp(f.x,f.w/2,WS-f.w/2);f.y=clamp(f.y,f.h/2,WS-f.h/2);return{x:f.x-x0,y:f.y-y0}}


let IID=0,FID=0;
function netIntent(p){const q=p.inp||{},e=p.edges||{},it={mx:0,my:0,sprint:false,act:false,grab:false,ang:p.ang,shove:false,e:false,rem:false};
  if(phase==='end')return it;let mx=+q.mx||0,my=+q.my||0;const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}it.mx=mx;it.my=my;
  if(Number.isFinite(q.ang))it.ang=q.ang||1e-6;it.sprint=!!q.spr;it.act=!!q.act;it.rem=!!q.rem;
  it.grab=e.grab>0;it.shove=e.shove>0;it.e=e.e>0;e.grab=e.shove=e.e=0;
  if(Number.isInteger(q.sel)&&q.sel>=-1&&q.sel<=3)p.sel=q.sel;
  if(p.role==='s'&&Number.isInteger(q.bmode)&&q.bmode>=0&&q.bmode<=3)p.bmode=q.bmode;else if(p.role!=='s')p.bmode=0;
  return it}

/* ================= rounds (server) ================= */
const humans=new Map(); // id -> {id,name,color,prof,ready,inp,edges}
function profOf(h){const pr=h.prof||{};const cl=v=>Math.max(0,Math.min(MAXSK,v|0));
  return{lvl:Math.max(1,Math.min(MAXLVL,pr.lvl|0||1)),sk:{s:{bag:cl(pr.s&&pr.s.bag),stam:cl(pr.s&&pr.s.stam),sprint:cl(pr.s&&pr.s.sprint),str:cl(pr.s&&pr.s.str),luck:cl(pr.s&&pr.s.luck)},z:{str:cl(pr.z&&pr.z.str),sprint:cl(pr.z&&pr.z.sprint)}},
    cls:CLASSES[pr.cls]?pr.cls:'walker'}}
function makeHumanPlayer(h){const pr=profOf(h);const p=makePlayer(h.name,h.color,false,pr.lvl,pr.sk,'walker');p.id=h.id;p.pcls=pr.cls;p.inp=h.inp;p.edges=h.edges;return p}
function spawnPlaza(p){for(let a=0;a<30;a++){p.x=rand(22.5*T,37.5*T);p.y=rand(22.5*T,37.5*T);if(Math.hypot(p.x-30*T,p.y-30*T)>80&&players.every(q=>q===p||dist(p,q)>40))break}p.ang=Math.atan2(p.y-30*T,p.x-30*T)}
const TARGET=12;
function fillBots(){const used=new Set(players.map(p=>p.name));while(players.length<TARGET){let nmB=pick(BOT_NAMES);let g=0;while(used.has(nmB)&&g++<40)nmB=pick(BOT_NAMES);used.add(nmB);
    const b=makePlayer(nmB,pick(COLORS),true,1,botSkills(1),'walker');b.id=uid++;players.push(b);spawnPlaza(b)}}
function startRound(){
  genMap();furn.forEach(f=>f.id=++FID);players=[];winner=null;ffDirty=true;dirty.clear();structDel=[];
  for(const h of humans.values())if(h.ready){const p=makeHumanPlayer(h);players.push(p);spawnPlaza(p)}
  fillBots();phase='prep';phaseT=phaseMax=60;
  EMIT({k:'newround'});
  for(const p of players)if(!p.isBot)TO(p,()=>banner('ZBIERAJ I BARYKADUJ','Masz 60 sekund, zanim zapadnie noc','#ffcf5c'));
}
function startNight(){phase='night';phaseT=phaseMax=300;nightStart=time;const cnt=players.length>=8&&Math.random()<.35?2:1;const al=shuffle(players.slice()).slice(0,cnt);
  for(const a of al)infect(a,null,true);
  sfx.alarm();ev({k:'shake',v:8,g:1});overlay('red');
  for(const p of players)if(!p.isBot&&!al.includes(p))TO(p,()=>banner('NOC NADESZŁA',(cnt>1?al.map(a=>a.name).join(' i ')+' są zombie':al[0].name+' jest zombie')+' — przetrwaj 5 minut','#ff6b5b'));
  for(const a of al)ev({k:'feed',a:a.name,ac:'#9be564',v:cnt>1?'jest jednym z pierwszych zombie':'stał się pierwszym zombie',ids:[a.id]});
  for(const p of players)if(p.role==='s'&&p.hold&&p.isBot)release(p)}
function checkEnd(){if(phase==='night'&&survivors().length===0)endRound('z')}
function endRound(w){if(phase==='end')return;phase='end';winner=w;phaseT=phaseMax=12;
  for(const p of players){if(p.isBot)continue;const surv=p.role==='s'&&w==='s';
    TO(p,()=>{if(w==='s'){if(p.role==='s'){sfx.win();banner('PRZETRWAŁEŚ!','Świt nadszedł','#ffcf5c')}else{sfx.lose();banner('OCALALI WYTRWALI','Zabrakło czasu','#ff6b5b')}}
      else{if(p.alpha||p.diedAt!==null)sfx.win();else sfx.lose();banner('ZOMBIE WYGRYWAJĄ','Nikt nie przetrwał','#9be564')}
      ev({k:'end',w,surv,role:p.role,alpha:p.alpha,built:p.built,inf:p.infections,surT:p.diedAt!==null?Math.max(0,p.diedAt-nightStart):p.alpha?0:300})});
    const h=humans.get(p.id);if(h)h.ready=false}}
let nightStart=0;
const _startNight=startNight;

/* ================= API ================= */
function addHuman(h){humans.set(h.id,h);h.edges=h.edges||{grab:0,shove:0,e:0};h.inp=h.inp||{}}
function spawnHuman(id){const h=humans.get(id);if(!h)return;h.ready=true;if(phase==='end'||players.some(p=>p.id===id))return;
  const p=makeHumanPlayer(h);
  const botIdx=players.findIndex(q=>q.isBot&&(phase==='prep'?q.role==='s':true)&&!q.alpha);
  if(players.length>=TARGET&&botIdx>=0){const b=players[botIdx];if(b.hold)release(b);if(b.ai.item)b.ai.item.claim=null;players.splice(botIdx,1)}
  players.push(p);spawnPlaza(p);
  if(phase==='night'){p.role='z';p.cls=p.pcls;p.r=CLASSES[p.cls].r;p.diedAt=time;p.turnT=time;TO(p,()=>banner('NOC TRWA','Dołączasz jako zombie — zarażaj ocalałych','#9be564'))}
  else TO(p,()=>banner('ZBIERAJ I BARYKADUJ',Math.ceil(phaseT)+' s do zmroku','#ffcf5c'));
  ev({k:'feed',a:p.name,ac:p.color,v:'dołączył do gry',ids:[p.id]})}
function removeHuman(id){const h=humans.get(id);humans.delete(id);const i=players.findIndex(p=>p.id===id);
  if(i>=0){const p=players[i];if(p.hold)release(p);for(const o of items)if(o.claim===p)o.claim=null;players.splice(i,1);
    if(phase!=='end'&&players.length<TARGET)fillBots();
    if(phase==='night'){if(zombies().length===0&&survivors().length)infect(pick(survivors()),null,true);checkEnd()}}}
function humanCount(){return humans.size}
function step(dt){if(phase==='idle')startRound();update(dt)}
const r1=v=>Math.round(v*10)/10;
function serS(s){return{i:s.i,x:s.x,y:s.y,t:s.type,b:Math.round(s.base),bm:Math.round(s.baseMax),o:s.open?1:0,br:s.broken?1:0,a:s.axis,ix:s.inX,iy:s.inY,bu:s.built?1:0,u:s.under,up:s.ups||[],in:s.interior?1:0,h:s.house,
  L:s.layers.map(l=>[l.mat,l.fast,Math.round(l.hp),Math.round(l.max),r1(l.seed)])}}
function serF(f){return{id:f.id,k:f.k,x:Math.round(f.x),y:Math.round(f.y),w:f.w,h:f.h,col:f.col,name:f.name,st:f.static?1:0,rd:f.round?1:0,hz:f.horiz?1:0,hp:f.hp|0,max:f.max|0}}
const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
function mapMsg(){for(const o of items)if(!o.id)o.id=++IID;return{t:'map',tiles:b64(tiles),sblock:b64(sblock),structs:[...structs.values()].map(serS),houses:houses.map(h=>({id:h.id,x0:h.x0,y0:h.y0,w:h.w,h:h.h})),
  trees,furn:furn.map(serF),items:items.map(o=>[o.id,o.type,o.x|0,o.y|0]),ph:phase,pt:r1(phaseT),pm:phaseMax}}
function roster(){return players.map(p=>[p.id,p.name,p.color,p.isBot?1:0,p.lvl])}
let lastItemsSig='';
function snapshotCommon(){for(const o of items)if(!o.id)o.id=++IID;
  const sig=items.length+':'+(items.length?items[items.length-1].id:0)+':'+items.reduce((a,o)=>a+o.id,0);let I;if(sig!==lastItemsSig){lastItemsSig=sig;I=items.map(o=>[o.id,o.type,o.x|0,o.y|0])}
  const S=[...dirty].filter(i=>structs.has(i)).map(i=>serS(structs.get(i)));dirty.clear();const SD=structDel;structDel=[];
  const P=players.map(p=>{const fl=(p.hold?1:0)|(p.shoveT>0?2:0)|(p.stun>0?4:0)|(p.flash>.05?8:0)|(invTotal(p)>0?16:0)|(p.tools.drill?32:0)|(p.buildT>0?64:0)|(p.remT>0?128:0)|(p.tools.crowbar?256:0)|(p.alpha?512:0);
    return[p.id,Math.round(p.x),Math.round(p.y),r1(p.ang*10)/10,p.role==='z'?1:0,p.role==='z'?Object.keys(CLASSES).indexOf(p.cls):0,Math.round(p.hp),fl,r1(p.swingT),r1(p.walk),Math.round(p.vx),Math.round(p.vy)]});
  const F=furn.map(f=>[f.id,Math.round(f.x),Math.round(f.y),Math.round(f.hp||0),f.holder?f.holder.id:0,f.shake>.05?1:0]);
  return{ph:phase,pt:r1(phaseT),pm:phaseMax,w:winner,P,F,S,SD,I}}
function snapshotMe(id){const p=players.find(q=>q.id===id);if(!p)return null;const S=ST(p);
  return{id,inv:p.inv,fx:p.fx,tools:p.tools,sta:r1(p.sta),stm:r1(S.staMax),hp:r1(p.hp),sel:p.sel,bm:p.bmode,bt:p.bmode&&p.bt?p.bt:null,f:p.focus?p.focus.i:-1,
    hold:p.hold?p.hold.id:0,bp:p.buildT>0&&p.role==='s'?r1(p.buildT/SS(p).build*100)/100:0,rp:p.remT>0&&p.remS?r1(p.remT/remTime(p,canRemove(p,p.remS)||'bar')*100)/100:0,
    cap:p.role==='s'?SS(p).cap:0,acd:r1(p.atkCd),cd:S.cd||0,dmg:S.dmg?Math.round(S.dmg):0,pdmg:S.pdmg?Math.round(S.pdmg):0,cls:p.cls,pcls:p.pcls,alpha:p.alpha?1:0,lvl:p.lvl,role:p.role,
    sp:Math.round(Math.hypot(p.vx,p.vy)),build:p.role==='s'?r1(SS(p).build*100)/100:0,str:p.sk.s.str,built:p.built,inf:p.infections}}
return{addHuman,spawnHuman,removeHuman,humanCount,step,mapMsg,roster,snapshotCommon,snapshotMe,get phase(){return phase},get players(){return players},humans,
  _debug:{get structs(){return structs},get items(){return items},get furn(){return furn},setPhaseT(v){phaseT=v}}};

};
