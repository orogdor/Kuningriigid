// V152: procedural world-map models (trees, shrubs, cacti, rocks, settlements).
// Built once in code as small vertex-coloured meshes and shared by all instances,
// so they cost no downloads and few triangles. Presentation only: no gameplay data changes.
import * as T from './vendor/three.module.js';
import {addWind} from './atmosphere-v158.js?v=158a';

export const WORLD_MODEL_MATERIAL=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0,side:T.DoubleSide});
// V158: settlements keep a still copy; trees, shrubs and rocks sway in the wind
export const SETTLEMENT_MATERIAL=WORLD_MODEL_MATERIAL.clone();
addWind(WORLD_MODEL_MATERIAL,{strength:.03,from:.35,key:'wind-world'});
const CACHE=new Map();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const sst=t=>{t=clamp(t);return t*t*(3-2*t)};
function hash(x,y,z){const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s);}
function noise(x,y,z){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=sst(x-ix),fy=sst(y-iy),fz=sst(z-iz);
 const L=(a,b,t)=>a+(b-a)*t,h=(a,b,c)=>hash(ix+a,iy+b,iz+c);
 return L(L(L(h(0,0,0),h(1,0,0),fx),L(h(0,1,0),h(1,1,0),fx),fy),L(L(h(0,0,1),h(1,0,1),fx),L(h(0,1,1),h(1,1,1),fx),fy),fz);
}
const C=hex=>new T.Color(hex);
const mix=(a,b,t)=>a.clone().lerp(b,clamp(t));

// Small mesh builder: parts are welded (smooth) or faceted, transformed, optionally displaced,
// and coloured per vertex by a function of local (unit) and model-space position.
class Builder{
 constructor(){this.pos=[];this.col=[];this.idx=[];}
 part(geo,{at=[0,0,0],rot=[0,0,0],scale=[1,1,1],displace=0,freq=2,seed=0,weld=true,shape=null,color}){
  const src=geo.attributes.position,local=[],index=[];
  if(weld){const map=new Map(),remap=[];
   for(let i=0;i<src.count;i++){const x=src.getX(i),y=src.getY(i),z=src.getZ(i),k=Math.round(x*1e4)+','+Math.round(y*1e4)+','+Math.round(z*1e4);
    let n=map.get(k);if(n===undefined){n=local.length;local.push(new T.Vector3(x,y,z));map.set(k,n);}remap.push(n);}
   const gi=geo.index;if(gi)for(let i=0;i<gi.count;i++)index.push(remap[gi.getX(i)]);else for(let i=0;i<src.count;i++)index.push(remap[i]);
  }else{
   const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position;
   for(let i=0;i<p.count;i++){local.push(new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)));index.push(i);}
  }
  const m=new T.Matrix4().compose(new T.Vector3(...at),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale));
  const base=this.pos.length/3;
  for(const v of local){
   const unit=v.clone();
   if(shape)shape(v);
   if(displace){const d=1+(noise(v.x*freq+seed,v.y*freq+seed*.7,v.z*freq-seed)-.5)*2*displace;v.multiplyScalar(d);}
   const w=v.clone().applyMatrix4(m),c=color(unit,w);
   this.pos.push(w.x,w.y,w.z);this.col.push(c.r,c.g,c.b);
  }
  for(const i of index)this.idx.push(base+i);
  geo.dispose();return this;
 }
 // raw quad strips (fronds, roofs): points are model-space Vector3
 tri(a,b,c,color){const base=this.pos.length/3;for(const p of [a,b,c]){this.pos.push(p.x,p.y,p.z);const k=color(p);this.col.push(k.r,k.g,k.b);}this.idx.push(base,base+1,base+2);return this;}
 quad(a,b,c,d,color){return this.tri(a,b,c,color).tri(a,c,d,color);}
 build(name){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.pos,3));g.setAttribute('color',new T.Float32BufferAttribute(this.col,3));
  g.setIndex(this.idx);g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();g.userData.shared=true;g.userData.modelName=name;return g;
 }
}
const ico=(r,detail)=>new T.IcosahedronGeometry(r,detail);
const cyl=(rt,rb,h,seg,hs=1)=>new T.CylinderGeometry(rt,rb,h,seg,hs);
const cone=(r,h,seg)=>new T.ConeGeometry(r,h,seg,1);
const lodDetail=lod=>lod==='high'?1:0;

function bark(dark,light){return (u,w)=>mix(C(dark),C(light),sst(w.y/1.2)*.6+noise(w.x*9,w.y*9,w.z*9)*.4);}
function trunkPart(b,h,r0,r1,lod,dark='#3d2c1f',light='#6b5038',lean=[0,0]){
 b.part(cyl(r1,r0,h,lod==='low'?5:7,2),{at:[lean[0]*h/2,h/2,lean[1]*h/2],rot:[lean[1],0,-lean[0]],color:bark(dark,light),weld:true});
 if(lod!=='low')b.part(cone(r0*1.9,r0*2.2,7),{at:[0,r0*1.0,0],color:bark(dark,light)});
}

// Broadleaf (oak / lime): split trunk, a crown of lumpy leaf masses with dark undersides.
function oak(lod,variant=0){
 const b=new Builder(),rand=(i)=>hash(i*3.1+variant*17,i*1.7,variant*5.3);
 const leafDark=C(variant?'#2f5226':'#355a2a'),leafMid=C(variant?'#56803a':'#4e7a35'),leafLight=C(variant?'#9cb85a':'#86a64c');
 trunkPart(b,1.15,.13,.075,lod);
 if(lod!=='low')for(const s of [-1,1])b.part(cyl(.035,.06,.62,5),{at:[s*.2,1.12,s*.05],rot:[s*.15,0,-s*.75],color:bark('#3d2c1f','#6b5038')});
 const blobs=[[0,1.78,0,.80],[.58,1.55,.18,.56],[-.55,1.6,-.22,.6],[.12,1.5,-.6,.52],[-.22,1.52,.55,.54],[.05,2.22,.08,.52],[.45,2.0,-.3,.42],[-.4,2.02,.32,.44]];
 const n=lod==='high'?8:lod==='medium'?6:4;
 for(let i=0;i<n;i++){const [x,y,z,r]=blobs[i],sx=1+(rand(i)-.5)*.25;
  b.part(ico(1,lodDetail(lod)),{at:[x,y,z],scale:[r*sx,r*.82,r*(2-sx)],displace:.22,freq:2.3,seed:i*3+variant,
   color:(u,w)=>{const top=sst((w.y-1.05)/1.45),under=sst(-u.y*1.6),spot=noise(w.x*4.2,w.y*4.2,w.z*4.2);
    return mix(mix(leafDark,leafMid,top*1.2),leafLight,Math.max(0,top-.45)*1.4+spot*.18).multiplyScalar(1-under*.38);}});
 }
 return b;
}
// Birch: slim pale trunk with dark marks, tall loose oval crown in fresher green.
function birch(lod){
 const b=new Builder();
 b.part(cyl(.045,.075,1.7,lod==='low'?5:6,3),{at:[0,.85,0],color:(u,w)=>{const mark=noise(w.x*14,w.y*22,w.z*14)>.68?.35:1;return C('#ddd8c8').multiplyScalar(mark*(.8+.2*sst(w.y)));}});
 const leafDark=C('#3c6430'),leafLight=C('#a8c262');
 const blobs=[[0,1.95,0,.48],[.18,1.55,.1,.4],[-.16,1.65,-.12,.42],[0,2.38,.02,.34],[.12,2.1,-.18,.32],[-.1,2.15,.2,.33]];
 const n=lod==='high'?6:lod==='medium'?4:3;
 for(let i=0;i<n;i++){const [x,y,z,r]=blobs[i];
  b.part(ico(1,lodDetail(lod)),{at:[x,y,z],scale:[r,r*1.35,r],displace:.24,freq:2.8,seed:40+i,
   color:(u,w)=>{const top=sst((w.y-1.3)/1.3),under=sst(-u.y*1.6);return mix(leafDark,leafLight,top*.9+noise(w.x*5,w.y*5,w.z*5)*.25).multiplyScalar(1-under*.3);}});
 }
 return b;
}
// Conifer: drooping, ragged tiers of needles, dark inside and lighter at the tips.
function pine(lod,variant=0){
 const b=new Builder(),seg=lod==='high'?11:lod==='medium'?9:7;
 const dark=C(variant?'#1f3a2e':'#25412f'),mid=C(variant?'#36584a':'#3b5f40'),tip=C(variant?'#5d806c':'#678a58');
 trunkPart(b,.75,.085,.05,lod,'#3a2a1e','#5e4532');
 const tiers=lod==='low'?[[.45,.6,.95],[1.05,.44,.85],[1.6,.3,.8],[2.15,.17,.8]]:[[.42,.62,.85],[.86,.53,.8],[1.28,.44,.75],[1.68,.35,.72],[2.06,.26,.68],[2.42,.16,.62]];
 tiers.forEach(([y,r,h],k)=>{
  b.part(cone(1,1,seg),{at:[(hash(k,variant,1)-.5)*.04,y+h/2,(hash(k,variant,2)-.5)*.04],scale:[r,h,r],
   shape:v=>{if(v.y<-.49){const a=Math.atan2(v.z,v.x),j=Math.round((a+Math.PI)/(Math.PI*2)*seg),ragged=(j%2?1.14:.86)+(hash(j,k,variant)-.5)*.15;v.x*=ragged;v.z*=ragged;v.y-=.16*(ragged-.7);}},
   weld:true,color:(u,w)=>{const out=sst(Math.hypot(u.x,u.z)*1.2),low=1-sst(u.y+.5);return mix(mix(dark,mid,out),tip,out*sst((w.y-.3)/2.3)*.9-low*.2+noise(w.x*6,w.y*6,w.z*6)*.12);}});
 });
 return b;
}
// Palm: segmented curved trunk, arching fronds with a V-shaped fold, a few coconuts.
function palm(lod){
 const b=new Builder(),rings=lod==='low'?5:8,sides=lod==='low'?5:6,pts=[];
 for(let i=0;i<=rings;i++){const t=i/rings;pts.push(new T.Vector3(.55*t*t,2.45*t,.12*t*t));}
 const bark=(p)=>C('#7a6448').multiplyScalar(.75+.25*noise(p.x*7,p.y*14,p.z*7));
 const ringAt=(i)=>{const p=pts[i],r=(.11-.045*i/rings)*(i%2?1.0:1.12),out=[];for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2;out.push(new T.Vector3(p.x+Math.cos(a)*r,p.y,p.z+Math.sin(a)*r));}return out;};
 let prev=ringAt(0);for(let i=1;i<=rings;i++){const cur=ringAt(i);for(let s=0;s<sides;s++){const s2=(s+1)%sides;b.quad(prev[s],prev[s2],cur[s2],cur[s],bark);}prev=cur;}
 const top=pts[rings],fronds=lod==='high'?9:lod==='medium'?7:5,steps=lod==='low'?3:5;
 const leaf=(p)=>{const d=p.distanceTo(top);return mix(C('#3e6a2c'),C('#8aa649'),sst(d/1.4)*.8+noise(p.x*5,p.y*5,p.z*5)*.2);};
 for(let f=0;f<fronds;f++){
  const a=f/fronds*Math.PI*2+hash(f,3,1)*.4,dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),side=new T.Vector3(-dir.z,0,dir.x),len=1.25+hash(f,1,1)*.35;
  let last=null;
  for(let i=0;i<=steps;i++){const t=i/steps,wdt=.26*Math.sin(Math.PI*Math.min(.98,t*.9+.06));
   const c=top.clone().addScaledVector(dir,len*t).add(new T.Vector3(0,.32*Math.sin(t*Math.PI*.8)-.75*t*t,0));
   const row=[c.clone().addScaledVector(side,wdt).add(new T.Vector3(0,-.07,0)),c.clone().add(new T.Vector3(0,.03,0)),c.clone().addScaledVector(side,-wdt).add(new T.Vector3(0,-.07,0))];
   if(last){b.quad(last[0],last[1],row[1],row[0],leaf);b.quad(last[1],last[2],row[2],row[1],leaf);}last=row;}
 }
 if(lod!=='low')for(let k=0;k<3;k++){const a=k*2.1;b.part(ico(.075,0),{at:[top.x+Math.cos(a)*.1,top.y-.1,top.z+Math.sin(a)*.1],color:()=>C('#5b4026')});}
 return b;
}
// Saguaro cactus with ribs and two arms.
function cactus(lod){
 const b=new Builder(),seg=lod==='low'?6:10;
 const ribbed=v=>{const a=Math.atan2(v.z,v.x),j=Math.round((a+Math.PI)/(Math.PI*2)*seg);if(j%2){v.x*=.86;v.z*=.86;}};
 const col=(u,w)=>{const a=Math.atan2(u.z,u.x),j=Math.round((a+Math.PI)/(Math.PI*2)*seg);return C('#5f8c58').multiplyScalar((j%2?.78:1)*(.85+.15*sst(w.y/1.8)));};
 b.part(cyl(.16,.18,1.65,seg,3),{at:[0,.82,0],shape:ribbed,color:col});
 b.part(new T.SphereGeometry(.16,seg,4,0,Math.PI*2,0,Math.PI/2),{at:[0,1.645,0],color:col});
 for(const [s,y,h] of [[1,.7,.55],[-1,.95,.42]]){
  b.part(cyl(.1,.1,.32,seg),{at:[s*.24,y,0],rot:[0,0,Math.PI/2],shape:ribbed,color:col});
  b.part(cyl(.1,.1,h,seg),{at:[s*.4,y+h/2,0],shape:ribbed,color:col});
  b.part(new T.SphereGeometry(.1,seg,3,0,Math.PI*2,0,Math.PI/2),{at:[s*.4,y+h,0],color:col});
 }
 return b;
}
// Boulder group: faceted weathered stone with moss and lichen on top.
function rock(lod){
 const b=new Builder();
 const stone=(u,w)=>{const top=sst(u.y*1.5-.1),n=noise(w.x*5,w.y*5,w.z*5);
  return mix(C('#6f6e68'),C('#a3a196'),n*.7+top*.3).lerp(C('#6d7c4f'),top*sst(n*1.6-.5)*.55).multiplyScalar(.78+.22*sst(u.y+.6));};
 b.part(ico(1,lodDetail(lod)),{at:[0,.32,0],scale:[1.05,.62,.85],displace:.28,freq:1.4,seed:7,weld:false,color:stone});
 b.part(ico(1,0),{at:[.82,.16,.42],scale:[.42,.32,.38],displace:.3,freq:2,seed:11,weld:false,color:stone});
 if(lod!=='low')b.part(ico(1,0),{at:[-.7,.12,-.5],scale:[.3,.22,.28],displace:.3,freq:2,seed:19,weld:false,color:stone});
 return b;
}
// Low shrub clump.
function shrub(lod){
 const b=new Builder();
 for(const [x,z,r] of [[0,0,.42],[.32,.18,.3],[-.28,.16,.32],[.05,-.3,.3]].slice(0,lod==='low'?2:4))
  b.part(ico(1,0),{at:[x,r*.65,z],scale:[r,r*.75,r],displace:.25,freq:3,seed:x*9+z,color:(u,w)=>mix(C('#344f28'),C('#7d9a4a'),sst(w.y/.6)*.8+noise(w.x*8,w.y*8,w.z*8)*.25).multiplyScalar(1-sst(-u.y*1.5)*.3)});
 return b;
}
const BUILDERS={oak:l=>oak(l,0),lime:l=>oak(l,1),birch,pine:l=>pine(l,0),spruce:l=>pine(l,1),palm,cactus,rock,shrub};
export const WORLD_MODEL_NAMES=Object.keys(BUILDERS);
export function getWorldModel(name,lod='high'){
 const key=name+':'+lod;if(CACHE.has(key))return CACHE.get(key);
 const make=BUILDERS[name];if(!make)throw Error('Unknown V152 world model '+name);
 const geo=make(lod).build(name+'_v152');CACHE.set(key,geo);return geo;
}

// ---------------------------------------------------------------- settlements
// One merged mesh per (team, era, size): houses with pitched roofs and chimneys, a central
// landmark (longhouse, temple, church, town hall, factory, towers), lanes and an era wall.
const SETTLEMENT_CACHE=new Map();
function boxPart(b,x,y,z,w,h,d,color,ry=0){b.part(new T.BoxGeometry(1,1,1),{at:[x,y+h/2,z],rot:[0,ry,0],scale:[w,h,d],weld:false,color:(u,p)=>C(color).multiplyScalar(.8+.2*sst(u.y+.5))});}
function gableRoof(b,x,y,z,w,d,h,color,ry=0){
 // ridge along local x; two sloped planes + two gable triangles, slight overhang
 const cs=Math.cos(ry),sn=Math.sin(ry),P=(lx,ly,lz)=>new T.Vector3(x+lx*cs+lz*sn,y+ly,z-lx*sn+lz*cs);
 const ow=w/2+.25,od=d/2+.3,base=C(color),shade=p=>base.clone().multiplyScalar(.82+.18*noise(p.x*3,p.y*3,p.z*3));
 const a=P(-ow,0,-od),bb=P(ow,0,-od),c=P(ow,h,0),dd=P(-ow,h,0),e=P(-ow,0,od),f=P(ow,0,od);
 b.quad(a,bb,c,dd,p=>shade(p).multiplyScalar(.86));b.quad(f,e,dd,c,shade);
 const wall=p=>base.clone().multiplyScalar(.7);b.tri(P(-w/2,0,-d/2),P(-w/2,0,d/2),P(-w/2,h*.92,0),wall);b.tri(P(w/2,0,d/2),P(w/2,0,-d/2),P(w/2,h*.92,0),wall);
}
function hipRoof(b,x,y,z,w,d,h,color){const P=(lx,ly,lz)=>new T.Vector3(x+lx,y+ly,z+lz),o=.25,c=C(color),r=w/2+o,s=d/2+o,t=P(0,h,0),k=Math.min(w,d)*.18;
 const A=P(-r,0,-s),B=P(r,0,-s),Cc=P(r,0,s),D=P(-r,0,s),L=P(-k,h,0),R=P(k,h,0),sh=f=>p=>c.clone().multiplyScalar(f);
 b.quad(A,B,R,L,sh(.82));b.quad(Cc,D,L,R,sh(1));b.tri(B,Cc,R,sh(.92));b.tri(D,A,L,sh(.9));}
function house(b,x,z,w,d,h,era,ry,rnd,accent){
 const walls=era===0?'#8d7656':era<=2?(rnd>.5?'#cbbb98':'#b9a27a'):era<=4?(rnd>.6?'#e2d9c4':rnd>.3?'#cfc0a0':'#b8a58a'):era===5?(rnd>.5?'#9a5a43':'#a5674b'):(rnd>.5?'#b8c2c6':'#d4d6d0');
 const roof=era===0?'#8a7448':era<=2?(rnd>.4?'#9c7f4a':'#86683f'):era<=4?(rnd>.5?'#9c4c35':'#7d3e2e'):era===5?'#4c4d52':'#5d6870';
 if(era>=6){boxPart(b,x,0,z,w,h*2.4,d,walls,ry);boxPart(b,x,h*2.4,z,w*.92,.25,d*.92,'#6f7c80',ry);return;}
 boxPart(b,x,0,z,w,h,d,walls,ry);
 if(era===0){b.part(cone(1,1,8),{at:[x,h+1.1,z],scale:[w*.72,2.2,w*.72],color:(u,p)=>C(roof).multiplyScalar(.8+.2*noise(p.x*4,p.y*4,p.z*4))});return;}
 gableRoof(b,x,h,z,w,d,Math.min(w,d)*.62,rnd<.12&&accent?accent:roof,ry);
 if(era>=3&&rnd>.45){const cs=Math.cos(ry),sn=Math.sin(ry),lx=w*.25;boxPart(b,x+lx*cs,h,z-lx*sn,.32,Math.min(w,d)*.62+.35,.32,'#7a6f66',ry);}
}
function landmark(b,era,accent){
 if(era===0){boxPart(b,0,0,0,7,1.6,3.2,'#7f6a4c');gableRoof(b,0,1.6,0,7,3.2,2.2,'#7b6a40');b.part(cyl(.25,.3,4.5,6),{at:[3.4,2.25,2.4],color:()=>C('#5b4632')});return;}
 if(era<=2){ // temple / chieftain hall on a plinth
  boxPart(b,0,0,0,7.5,.6,5.5,'#a59e8c');for(let i=0;i<6;i++)for(const s of [-1,1])b.part(cyl(.2,.22,2.6,6),{at:[-3+i*1.2,1.9,s*2.2],color:()=>C('#e4dcc8')});
  boxPart(b,0,.6,0,6.6,2.6,3.6,'#d8cfb8');gableRoof(b,0,3.2,0,7,4.6,1.5,era===2?accent:'#a3683f');return;}
 if(era<=4){ // church with tower / town hall
  boxPart(b,0,0,0,7,3.4,3.6,'#ddd5c3');gableRoof(b,0,3.4,0,7,3.6,2.4,'#7f3c2c');
  boxPart(b,-4.1,0,0,2.4,7.4,2.4,'#d2c9b5');b.part(cone(1,1,4),{at:[-4.1,9.3,0],rot:[0,Math.PI/4,0],scale:[1.9,3.8,1.9],color:()=>C(era===4?'#5f7b77':accent)});return;}
 if(era===5){ // factory with chimneys
  boxPart(b,0,0,0,8,3.6,4.6,'#8f5141');for(let i=0;i<3;i++)gableRoof(b,-2.7+i*2.7,3.6,0,2.6,4.6,1.3,'#4b4c50',Math.PI/2);
  for(const x of [-3,3.2])b.part(cyl(.42,.6,9,8),{at:[x,4.5,-1.6],color:(u,p)=>C('#7b4636').multiplyScalar(p.y>8.4?.45:1)});return;}
 // modern towers
 [[0,0,3.6,14,3.6],[-4.2,1.5,2.8,10,2.8],[3.8,-1.8,3,11.5,3]].forEach(([x,z,w,h,d],i)=>{boxPart(b,x,0,z,w,h,d,i===0?'#8fb0bd':'#a9b8bd');
  for(let k=1;k<h/1.5;k++)boxPart(b,x,k*1.5-.08,z,w+.06,.12,d+.06,'#3e5a68');boxPart(b,x,h,z,w*.6,.6,d*.6,'#6c7a7e');});
}
function wall(b,era,R){
 if(era<1)return;
 const n=era<=1?20:28,stone=era>=2,h=era<=1?1.4:era<=4?2.2:0,col=era<=1?'#6e5638':'#a19b8c';
 if(era>=5)return;
 for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,gate=i===Math.round(n*.25);if(gate)continue;
  const x0=Math.cos(a0)*R,z0=Math.sin(a0)*R,x1=Math.cos(a1)*R,z1=Math.sin(a1)*R,len=Math.hypot(x1-x0,z1-z0);
  boxPart(b,(x0+x1)/2,0,(z0+z1)/2,len+.1,h,stone?.7:.45,col,-Math.atan2(z1-z0,x1-x0));
  if(stone&&i%(n/4|0)===2){b.part(cyl(1,1.1,h+1.6,8),{at:[x0,(h+1.6)/2,z0],color:()=>C('#9b9587')});b.part(cone(1.3,1.6,8),{at:[x0,h+2.4,z0],color:()=>C(era>=3?'#7f3c2c':'#8a7448')});}
 }
}
export function settlementGeometry(team,era,size=1){
 const key=team+':'+era+':'+size;if(SETTLEMENT_CACHE.has(key))return SETTLEMENT_CACHE.get(key);
 const accent=['#3f8f8a','#b9573f','#7d5fb0','#b8952f'][team],b=new Builder(),R=era<=1?13:14;
 // ground: trodden earth / paving disc
 b.part(new T.CylinderGeometry(R+1.2,R+2.4,.35,28,1),{at:[0,-.02,0],color:(u,p)=>C(era>=5?'#8b8f88':era>=3?'#a39a80':'#8d8665').multiplyScalar(.9+.1*noise(p.x*.4,0,p.z*.4))});
 // two crossing lanes
 if(era>=1){boxPart(b,0,.3,0,2*R+1,.06,2,era>=5?'#5e6467':'#b8a983');boxPart(b,0,.3,0,2,.06,2*R+1,era>=5?'#5e6467':'#b8a983');}
 const lm=b.pos.length;landmark(b,era,accent);for(let i=lm;i<b.pos.length;i+=3){b.pos[i]*=1.3;b.pos[i+1]*=1.3;b.pos[i+2]*=1.3;}
 const count=[8,11,13,15,16,12,8][era]+Math.round(size*2);
 let placed=0;const spots=[];
 for(let i=0;i<140&&placed<count;i++){
  const a=hash(i,team,era)*Math.PI*2,r=5+hash(i,era,7)*(R-6.6),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(spots.some(([px,pz])=>Math.hypot(px-x,pz-z)<3.6))continue;
  if(Math.abs(x)<1.6||Math.abs(z)<1.6)continue; // keep lanes free
  if(Math.abs(x)<6.8&&Math.abs(z)<4.6)continue; // landmark
  spots.push([x,z]);
  const rnd=hash(i,3,team),w=era===0?2.9:3.1+rnd*1.6,d=era===0?2.9:2.5+hash(i,5,era)*1.0,h=era===0?1.5:2.0+rnd*(era>=3?2.0:1.0);
  const ry=Math.round(Math.atan2(z,x)/(Math.PI/2))*(Math.PI/2)+(era<=2?(rnd-.5)*.7:0);
  house(b,x,z,w,d,h,era,ry,rnd,accent);placed++;
 }
 wall(b,era,R);
 // a few trees in the yards (early eras) / small parks (later)
 const leaf=C('#4b7535');for(let i=0;i<(era>=5?3:5);i++){const a=hash(i,9,era)*6.28,r=R-1.2,x=Math.cos(a)*r*.82,z=Math.sin(a)*r*.82;
  b.part(ico(1,0),{at:[x,1.5,z],scale:[.95,1.1,.95],displace:.2,freq:2,seed:i,color:(u)=>leaf.clone().multiplyScalar(.75+.35*sst(u.y+.4))});
  b.part(cyl(.12,.16,1,5),{at:[x,.5,z],color:()=>C('#5b4430')});}
 const g=b.build('settlement_v152_'+key);SETTLEMENT_CACHE.set(key,g);return g;
}

// ---------------------------------------------------------------- V158 resource sites (detail map)
// Raw deposits and extraction sites drawn in the same soft, vertex-coloured style as the rest.
const DEPOSIT={stone:['#8f8d84','#b5b2a6',null],ore:['#5a4034','#8a5a44','#a4472f'],copper:['#6f6252','#8f7a62','#3f8f6e'],tin:['#8d9493','#b8c0bf','#3b3f44'],
 clay:['#8a5a3c','#b37b55',null],gems:['#7a7884','#a19fab','#9a63d6'],oil:['#1d1c1a','#2c2a27',null]};
const SITE_CACHE=new Map();
function stoneColor(k){const [dark,light,vein]=DEPOSIT[k]||DEPOSIT.stone;return (u,w)=>{const n=noise(w.x*3.1,w.y*3.1,w.z*3.1),top=sst(u.y*1.4);
 let c=mix(C(dark),C(light),n*.6+top*.4);if(vein&&noise(w.x*5.3+9,w.y*5.3,w.z*5.3)>.66)c=mix(c,C(vein),.75);if(top>.6&&k!=='oil'&&k!=='clay')c.lerp(C('#6f7d4f'),sst(noise(w.x*4,1,w.z*4)*1.8-.9)*.5);return c.multiplyScalar(.8+.2*sst(u.y+.6));};}
function boulders(b,k,n,R,size,seed=0){for(let i=0;i<n;i++){const a=i*2.399+seed,r=i===0?0:R*(.45+hash(i,seed,3)*.55),s=(i===0?size:size*(.4+hash(i,seed,5)*.45));
 b.part(ico(1,1),{at:[Math.cos(a)*r,s*.38,Math.sin(a)*r],rot:[0,a,0],scale:[s,s*(.55+hash(i,seed,7)*.3),s*(.75+hash(i,seed,9)*.3)],displace:.3,freq:1.5,seed:i+seed*7,weld:false,color:stoneColor(k)});}}
function siteBox(b,x,y,z,w,h,d,c,ry=0){boxPart(b,x,y,z,w,h,d,c,ry);}
function siteCyl(b,x,y,z,r,h,c,rx=0,rz=0,seg=8){b.part(cyl(r,r,h,seg),{at:[x,y,z],rot:[rx,0,rz],color:()=>C(c)});}
function cart(b,x,z,ry,load){b.part(new T.BoxGeometry(1.3,.55,.9),{at:[x,.75,z],rot:[0,ry,0],color:()=>C('#7a5a3a')});
 b.part(ico(.5,0),{at:[x,1.1,z],rot:[0,ry,0],scale:[1.1,.55,.75],color:stoneColor(load)});
 for(const s of [-1,1])for(const t of [-1,1])siteCyl(b,x+Math.cos(ry)*s*.45-Math.sin(ry)*t*.5,.3,z-Math.sin(ry)*s*.45-Math.cos(ry)*t*.5,.26,.08,'#3c3a36',0,Math.PI/2);}
function rails(b,z0,z1,x=0){for(const s of [-.45,.45])siteBox(b,x+s,.02,(z0+z1)/2,.08,.08,Math.abs(z1-z0),'#5d5f60');for(let z=Math.min(z0,z1);z<Math.max(z0,z1);z+=.7)siteBox(b,x,0,z,1.25,.06,.22,'#6b4e33');}
export function depositGeometry(kind){const key='dep:'+kind;if(SITE_CACHE.has(key))return SITE_CACHE.get(key);const b=new Builder();
 if(kind==='clay'){b.part(new T.SphereGeometry(2.6,16,6,0,Math.PI*2,0,Math.PI/2),{at:[0,-.05,0],scale:[1,.32,.85],displace:.08,freq:1.2,color:(u,w)=>mix(C('#8a5a3c'),C('#b8805a'),noise(w.x*2,0,w.z*2)).multiplyScalar(.85+.15*sst(u.y))});
  b.part(new T.CircleGeometry(.9,14),{at:[1.2,.25,.6],rot:[-Math.PI/2,0,0],color:()=>C('#5e4a3a')});}
 else if(kind==='oil'){b.part(new T.CircleGeometry(2.2,20),{at:[0,.05,0],rot:[-Math.PI/2,0,0],displace:.12,freq:1.5,color:(u,w)=>mix(C('#121110'),C('#2d2a26'),noise(w.x*3,0,w.z*3))});boulders(b,'stone',4,2.4,.6,3);}
 else{boulders(b,kind,kind==='stone'?9:8,2.0,1.45,kind.length);
  if(kind==='gems')for(let i=0;i<7;i++){const a=i*.9,r=.6+hash(i,4,4)*.8;b.part(cone(.16,.7+hash(i,2,2)*.5,5),{at:[Math.cos(a)*r,.9+hash(i,3,3)*.4,Math.sin(a)*r],rot:[(hash(i,5,5)-.5)*.8,0,(hash(i,6,6)-.5)*.8],color:()=>C(i%2?'#b07ae6':'#8a5bd0')});}
  if(kind==='stone')for(let i=0;i<3;i++)siteBox(b,1.8+i*.15,i*.45,1.6,.9,.45,.6,'#b7b3a6',.3*i);}
 const g=b.build(key);SITE_CACHE.set(key,g);return g;}
export function miningSiteGeometry(type,kind,age){const key='site:'+type+':'+kind+':'+Math.min(6,age);if(SITE_CACHE.has(key))return SITE_CACHE.get(key);
 const b=new Builder(),modern=age>=5,timber=modern?'#6d7678':'#6b4e33',underground=age>=3&&!['quarry','claypit'].includes(type);
 if(type==='quarry'){ // rock face with cut benches, blocks and a crane
  b.part(ico(1,1),{at:[0,.4,-1.6],scale:[3.6,2.3,1.8],displace:.22,freq:1.2,seed:2,weld:false,color:stoneColor('stone')});
  for(let i=0;i<3;i++)siteBox(b,-1+i*1.1,0,-.2+i*.1,1.0,1.6-i*.45,1.2,'#b9b5a8');
  for(let i=0;i<5;i++)siteBox(b,-2.4+(i%3)*1.0,Math.floor(i/3)*.55,1.8,.9,.55,.65,'#bdb8aa',(i%2)*.2);
  siteCyl(b,2.4,1.9,.2,.1,3.8,timber);b.part(cyl(.07,.07,3.2,6),{at:[1.5,3.4,.2],rot:[0,0,1.1],color:()=>C(timber)});siteCyl(b,.65,2.6,.2,.02,1.6,'#c9b58a');siteBox(b,.65,1.6,.2,.6,.4,.5,'#bdb8aa');
  cart(b,2.6,2.6,.4,'stone');}
 else if(type==='claypit'){ // wet pit, clay heaps, bricks drying on pallets
  b.part(new T.RingGeometry(1.4,3.2,20,1),{at:[0,.08,0],rot:[-Math.PI/2,0,0],color:(u,w)=>mix(C('#7a5038'),C('#9c6b4a'),noise(w.x*2,0,w.z*2))});
  b.part(new T.CircleGeometry(1.4,18),{at:[0,.06,0],rot:[-Math.PI/2,0,0],color:()=>C('#4c6d70')});
  for(let i=0;i<3;i++)b.part(new T.SphereGeometry(.7,10,5,0,Math.PI*2,0,Math.PI/2),{at:[-2.4+i*.9,.08,-2.4],scale:[1,.6,1],color:()=>C('#a8704a')});
  for(let r=0;r<2;r++){siteBox(b,2.6,0,-1+r*1.4,1.6,.12,1.0,'#7a5a3a');for(let i=0;i<8;i++)siteBox(b,2.0+(i%4)*.4,.12+Math.floor(i/4)*.2,-1.25+r*1.4+(i%2)*.4,.32,.18,.22,'#b06a45');}}
 else{ // mines: tunnel mouth in a hillock, or a headframe for deep mines
  if(!underground){b.part(new T.SphereGeometry(3.2,16,7,0,Math.PI*2,0,Math.PI/2),{at:[0,0,-1.6],scale:[1,.7,.85],displace:.12,freq:1.3,color:(u,w)=>mix(C('#6f7552'),C('#8d8a6a'),noise(w.x*1.5,w.y,w.z*1.5)).multiplyScalar(.85+.15*sst(u.y))});
   siteBox(b,0,0,.8,2.0,2.1,.2,'#1a1816');for(const s of [-1,1])siteBox(b,s*1.05,0,.95,.22,2.3,.22,timber);siteBox(b,0,2.2,.95,2.5,.25,.3,timber);
   rails(b,1,4.2);cart(b,0,3.0,0,kind);}
  else{for(const s of [-1,1]){b.part(cyl(.11,.13,6.2,6),{at:[s*1.3,3.0,-1.4],rot:[0,0,-s*.14],color:()=>C(timber)});b.part(cyl(.09,.09,5.4,6),{at:[s*1.1,2.6,-.2],rot:[.45,0,-s*.1],color:()=>C(timber)});}
   siteBox(b,0,5.8,-1.4,2.8,.25,.3,timber);b.part(new T.TorusGeometry(.75,.08,6,16),{at:[0,6.3,-1.4],color:()=>C('#454a4c')});
   siteBox(b,-2.6,0,1.2,2.2,2.6,2.0,modern?'#8a9497':'#9a5a44');b.part(new T.BoxGeometry(1,1,1),{at:[-2.6,3.4,1.2],scale:[2.4,1.6,2.2],color:()=>C('#5b6168')});siteCyl(b,-3.4,3.8,.5,.3,4.6,modern?'#7d8588':'#8a4c3a');
   rails(b,-.6,4.2);cart(b,0,2.8,0,kind);}
  // spoil heap of the mined rock
  b.part(new T.ConeGeometry(1.4,1.1,9),{at:[3.0,.55,-1.0],displace:.15,freq:2,color:stoneColor(kind)});}
 // tool shed (all sites)
 siteBox(b,3.1,0,2.9,1.4,1.1,1.1,modern?'#7c898a':'#97754c');b.part(new T.BoxGeometry(1,1,1),{at:[3.1,1.2,2.9],rot:[0,0,0],scale:[1.6,.12,1.3],color:()=>C('#5b4a3a')});
 const g=b.build(key);SITE_CACHE.set(key,g);return g;}
