// V223.5: detailed, deterministic Stone Age craft sites streamed only near the camera.
// Procedural fallback assets. They are not presented as TRELLIS-generated meshes.
import * as T from './vendor/three.module.js';
import {LazyStoneLOD} from './stone-near-lod.js';

export const STONE_FOLLOWUP_TYPES=new Set(['claypit','pottery_kiln','pasture','mason']);
const mats=new Map();
const v=(x,y,z)=>new T.Vector3(x,y,z);
function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:1,metalness:0,side:T.DoubleSide}));return mats.get(color)}
function put(g,geo,color,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function box(g,x,y,z,w,h,d,color){return put(g,new T.BoxGeometry(1,1,1),color,x,y,z,w,h,d)}
function rock(g,x,y,z,sx,sy,sz,color){const m=put(g,new T.DodecahedronGeometry(1,0),color,x,y,z,sx,sy,sz);m.rotation.y=(x*17+z*9)%3;return m}
function cone(g,x,y,z,rb,rt,h,color,sides=9){return put(g,new T.CylinderGeometry(rt,rb,h,sides),color,x,y,z)}
function sphere(g,x,y,z,sx,sy,sz,color){return put(g,new T.IcosahedronGeometry(1,1),color,x,y,z,sx,sy,sz)}
function beam(g,a,b,r,color='#795537'){const A=v(...a),B=v(...b),d=B.clone().sub(A),m=put(g,new T.CylinderGeometry(r,r,d.length(),7),color,...A.clone().add(B).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());return m}
function seedRandom(seed){let n=(seed>>>0)||29173;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function soil(g,x,z,sx,sz,color){const m=sphere(g,x,.015,z,sx,.018,sz,color);m.castShadow=false}
function scatter(g,rnd,x,z,num,kind){for(let k=0;k<num;k++){const xx=x+(rnd()-.5)*4,zz=z+(rnd()-.5)*3.8;if(kind==='stone')rock(g,xx,.13,zz,.12+rnd()*.2,.12+rnd()*.16,.16+rnd()*.3,['#9e9b87','#b7b2a0','#797c71'][k%3]);else{beam(g,[xx,.05,zz],[xx+(.5-rnd())*.18,.22+rnd()*.25,zz+(.5-rnd())*.2],.025,k%3?'#7e8453':'#a9a06e')}}}
function fence(g,x1,z1,x2,z2,height=1.05){const n=Math.max(2,Math.ceil(Math.hypot(x2-x1,z2-z1)/.75));for(let j=0;j<=n;j++){const t=j/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;beam(g,[x,.05,z],[x,height+.06,z],.07,j%4?'#866341':'#9d764a')}for(const h of [.36,.74])beam(g,[x1,h,z1],[x2,h,z2],.065,'#67492e')}
function table(g,x,z,w=1.5,d=.8,h=.75){box(g,x,h,z,w,.17,d,'#82603d');for(const dx of [-.42,.42])for(const dz of [-.28,.28])beam(g,[x+dx*w,h-.1,z+dz*d],[x+dx*w,.06,z+dz*d],.065)}
function pot(g,x,y,z,s=.3,col='#b77d57'){cone(g,x,y+s*.54,z,s*.74,s*.53,s,col,12);cone(g,x,y+s*1.04,z,s*.6,s*.6,s*.15,'#9e6646',12)}
function roof(g,x,y,z,w,d){const shade='#867347',alt='#9b8858';for(const side of [-1,1]){const m=box(g,x+side*w*.255,y+.24,z,w*.61,.22,d+.42,side<0?shade:alt);m.rotation.z=side*.43}
 for(let i=0;i<16;i++){const zz=z-d*.48+(d*.96*i/15);for(const side of [-1,1])beam(g,[x, y+.87,zz],[x+side*w*.50,y-.1,zz],.035,i%3?'#a59869':'#715f3f')}}
function shelter(g,x,z,w=3.5,d=2.5){for(const dx of [-w*.47,w*.47])for(const dz of [-d*.44,d*.44])beam(g,[x+dx,0,z+dz],[x+dx,2.55,z+dz],.13);roof(g,x,2.5,z,w,d);for(let i=0;i<5;i++)box(g,x-w*.41+i*w*.2,.35,z-d*.42,.12,.68,.15,'#73553c')}
function animal(g,x,z,rnd){const cow=rnd()>.4,mass=cow?1:.67,h=cow?1.18:.83;box(g,x,h,z,mass*1.65,mass*.84,mass*.91,cow?'#96785c':'#cabf9b');sphere(g,x,h+.24,z,.65*mass,.45*mass,.38*mass,cow?'#a78a6a':'#ddd0ad');
 sphere(g,x,h+.14,z+.64*mass,.38*mass,.40*mass,.39*mass,cow?'#a78b66':'#e1d4b6');sphere(g,x,h-.02,z+.86*mass,.27*mass,.20*mass,.26*mass,'#9e806b');
 for(const dx of [-.47,.47])for(const dz of [-.30,.32])beam(g,[x+dx*mass,h-.3*mass,z+dz*mass],[x+dx*mass,.1,z+dz*mass],.08*mass,'#665445');
 for(const dx of [-.32,.32]){sphere(g,x+dx*mass,h+.43*mass,z+.55*mass,.20*mass,.13*mass,.19*mass,cow?'#98735b':'#b4a080')}
 beam(g,[x,h+.1,z-.65*mass],[x+.22*mass,h-.2,z-1.1*mass],.05,'#71573d')}
function claypit(g,rnd){soil(g,0,0,5.1,4.4,'#876d51');soil(g,-.7,-.25,3.25,2.7,'#a17758');
 // Stepped excavation banks, open to the viewer at the front.
 for(let k=0;k<5;k++){const a=Math.PI*(.13+k*.20),x=Math.cos(a)*2.9,z=Math.sin(a)*2.25-.6;const m=box(g,x,.32,z,1.5,.56,.66,['#a47d5f','#ae8661','#ba9070','#947050'][k%4]);m.rotation.y=-a+Math.PI/2}
 for(let k=0;k<7;k++){const x=-2.05+k*.62;box(g,x,.12,-1.8+.13*Math.sin(k),.55,.20,.56,k%2?'#a88567':'#b79879')}
 soil(g,-.3,.2,2.3,1.7,'#705e4e');soil(g,.45,.38,1.0,.8,'#797064');
 for(let i=0;i<8;i++){const x=-1.6+rnd()*3.4,z=-.5+rnd()*2.1;rock(g,x,.15,z,.28,.17,.35,i%2?'#b18765':'#c39c79')}
 for(const xx of [-2.0,-1.2])beam(g,[xx,.03,-2.1],[xx,1.35,-1.65],.10);beam(g,[-2.05,1.15,-1.75],[-1.1,1.15,-1.75],.09);
 box(g,2.55,.25,1.6,1.5,.16,.9,'#76583e');for(let k=0;k<5;k++)pot(g,2.08+k*.25,.31,1.7,.23,k%2?'#be8d69':'#aa7454');
 for(let k=0;k<4;k++)rock(g,2.7+rnd()*.8,.4,-.8+rnd()*.9,.35,.25,.33,'#986f52');
 scatter(g,rnd,0,0,20,'stone')}
function pottery(g,rnd){soil(g,0,0,4.7,4.25,'#887054');shelter(g,-1.8,-.95,3.5,3.1);
 // Brick-fired kiln with broad dome and black fire door.
 cone(g,1.4,1.05,-.65,1.45,1.2,2.1,'#9b5e43',16);sphere(g,1.4,1.9,-.65,1.28,.72,1.28,'#ae7453');
 for(let i=0;i<3;i++){cone(g,1.4,2.65+i*.28,-.65,.35-i*.035,.32-i*.025,.28,i%2?'#8b5640':'#995d43',12)}
 const door=box(g,1.4,.64,.63,.82,.85,.09,'#271c17');door.rotation.x=-.06;box(g,1.4,.38,.70,.58,.22,.06,'#c26636');
 for(let j=0;j<13;j++){const a=j*2*Math.PI/13;rock(g,1.4+Math.cos(a)*1.25,.10,-.65+Math.sin(a)*1.23,.26,.17,.25,'#a88362')}
 table(g,-2.0,1.5,2.4,1.15);for(let i=0;i<7;i++)pot(g,-3.0+i*.34,.84,1.3+(i%2)*.4,.25+(i%3)*.04,i%2?'#ae7454':'#bb895c');
 for(let z=-2.5;z<2.1;z+=1.9)for(let x=-.5;x<=.55;x+=.8)pot(g,x,.07,z,.35,'#bf9772');
 for(let i=0;i<5;i++)beam(g,[.1+i*.08,.07,2.0],[1.3+i*.06,.22,2.4],.085,'#85623f');
 for(let i=0;i<6;i++)rock(g,-3+rnd()*1.6,.12,-3+rnd()*1.2,.24,.18,.25,'#ad795b');
 scatter(g,rnd,0,0,12,'grass')}
function pasture(g,rnd){soil(g,0,0,5.2,5.1,'#797a52');
 // The enclosure is fenced on three sides; the fourth is an entrance.
 for(const [x,z,X,Z] of [[-4,-4,4,-4],[-4,-4,-4,4],[4,-4,4,4],[-4,4,-1.3,4],[1.3,4,4,4]])fence(g,x,z,X,Z);
 shelter(g,-2.6,-2.35,2.7,2.5);for(let i=0;i<6;i++)box(g,-3.5+(i%3)*.5,.2,-2.8+Math.floor(i/3)*.48,.65,.3,.6,'#b09a59');
 box(g,2.35,.35,-2.8,2,.55,.63,'#81613e');box(g,2.35,.64,-2.8,1.8,.08,.44,'#a68c57');box(g,2.35,.68,-2.8,1.55,.03,.23,'#718872');
 for(const [x,z] of [[-1.1,-.4],[1.5,.8],[-.75,2.25]])animal(g,x,z,rnd);
 for(let i=0;i<34;i++){const x=(rnd()-.5)*7.3,z=(rnd()-.5)*7.4;beam(g,[x,.05,z],[x+.15,.18+rnd()*.14,z+.11],.025,i%3?'#a8a568':'#777f4b')}
 for(const x of [-.55,.55])beam(g,[x,.08,4],[x,1.3,4.4],.10);beam(g,[-.55,1.1,4.35],[.55,1.1,4.35],.09)}
function mason(g,rnd){soil(g,0,0,5.2,4.2,'#818078');shelter(g,-1.1,-1.35,4.9,3.5);
 for(let i=0;i<14;i++){const x=-3.4+(i%5)*.73,z=1.35+Math.floor(i/5)*.65;box(g,x,.23,z,.7,.4,.62,i%3?'#9fa194':'#c0bdad')}
 table(g,1.9,.2,2.0,1.15,.9);
 box(g,1.9,1.15,.2,1.30,.58,.76,'#b6b4a4');box(g,1.9,1.48,.2,1.02,.15,.56,'#d0cbbc');
 beam(g,[1.18,1.25,1.1],[2.15,1.72,1.1],.04,'#676963');beam(g,[2.6,1.0,.9],[2.35,1.9,1.0],.075,'#866039');
 for(let i=0;i<7;i++){const x=.8+(i%3)*.7,z=-2.85+Math.floor(i/3)*.48;rock(g,x,.26,z,.3,.23,.32,i%2?'#bbb9a9':'#898d83')}
 for(let i=0;i<7;i++){box(g,3.45,.24+i*.43,-2.6,.7,.43,1.25,i%2?'#aaa99b':'#949b8e')}
 for(let i=0;i<11;i++)rock(g,-3.5+rnd()*6.6,.10,2.8+rnd()*.8,.14,.11,.18,'#adae9e');
 scatter(g,rnd,-1,-1.1,12,'stone')}

export function createStoneFollowupDetail(type,seed=0){const g=new T.Group(),rnd=seedRandom((seed>>>0)^0x9e3779b9);
 if(type==='claypit')claypit(g,rnd);
 else if(type==='pottery_kiln')pottery(g,rnd);
 else if(type==='pasture')pasture(g,rnd);
 else if(type==='mason')mason(g,rnd);
 g.userData.stoneDetailedAsset=type;
 return g;
}
export function withStoneFollowupLOD(low,type,size,seed=0){
 const root=new LazyStoneLOD(low,async()=>{
  const detail=createStoneFollowupDetail(type,seed),bounds=new T.Box3().setFromObject(detail);
  const ext=bounds.getSize(new T.Vector3()),width=Math.max(ext.x,ext.z,.001),scale=size/width;
  detail.scale.setScalar(scale);
  detail.position.y=-bounds.min.y*scale;
  return detail;
 });
 Object.assign(root.userData,low.userData);
 root.userData.stoneNearLOD=true;
 root.userData.stoneFollowupV2235=type;
 return root;
}
