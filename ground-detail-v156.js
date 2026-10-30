// V156: livelier detail-map ground cover.
// Meadow grass clumps, wild flowers, pebbles and stones, shrubs and ferns, and in woodland
// stumps, fallen logs and mushrooms. Placement is clustered with noise (meadows, bare patches,
// flower drifts), avoids rivers, roads and building plots, and everything is instanced:
// one draw call per kind. Presentation only.
import * as T from './vendor/three.module.js';
import {DETAIL_TILE_X,DETAIL_TILE_Z} from './detail-scale-v123.js';
import {addWind} from './atmosphere-v158.js?v=161a';

const MAT=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0,side:T.DoubleSide});
addWind(MAT,{strength:.35,from:.05,key:'wind-ground'});
const GEO=new Map();
const hash=(a,b,c)=>{const s=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return s-Math.floor(s);};
function vnoise(x,z,seed){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),h=(a,b)=>hash(ix+a,iz+b,seed);
 return (h(0,0)*(1-u)+h(1,0)*u)*(1-v)+(h(0,1)*(1-u)+h(1,1)*u)*v;}
const fbm=(x,z,seed)=>vnoise(x,z,seed)*.6+vnoise(x*2.1,z*2.1,seed+7)*.3+vnoise(x*4.3,z*4.3,seed+13)*.1;

// --- geometry helpers (vertex coloured, merged)
function merged(parts){const pos=[],col=[];for(const [g,color] of parts){const p=(g.index?g.toNonIndexed():g).attributes.position,c=typeof color==='function'?null:new T.Color(color);
 for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));const k=c||color(p.getX(i),p.getY(i),p.getZ(i));col.push(k.r,k.g,k.b);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();g.computeBoundingSphere();g.userData.shared=true;return g;}
function blade(w,h,lean,rot){
 // Narrow, bent blades give a softer silhouette in first person.
 const g=new T.BufferGeometry(),c=Math.cos(rot),s=Math.sin(rot),P=(x,y,z)=>[x*c+z*s,y,-x*s+z*c],p=[];
 for(let k=0;k<3;k++){const t=k/3,u=(k+1)/3,half=t=>w*.5*(1-t*.9),shift=t=>lean*t*t;
  const a=P(shift(t)-half(t),h*t,0),b=P(shift(t)+half(t),h*t,0),d=P(shift(u)-half(u),h*u,0),e=P(shift(u)+half(u),h*u,0);p.push(...a,...b,...e,...a,...e,...d);}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));return g;}
export function grassGeo(kind='short'){
 const parts=[],n=kind==='tall'?12:10;
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+hash(i,kind.length,1)*.5,h=(kind==='tall'?.68:.36)*(.65+hash(i,2,kind.length)*.65),lean=(.15+hash(i,3,1)*.34)*h;
  const g=blade(.035+hash(i,4,1)*.025,h,lean,a);g.translate(Math.cos(a)*.035,0,Math.sin(a)*.035);
  const base=new T.Color('#354b29'),tip=new T.Color(kind==='tall'?'#9c9963':'#789056');
  parts.push([g,(x,y)=>base.clone().lerp(tip,Math.min(1,y/h))]);}
 return merged(parts);}
function flowerGeo(petal='#ffffff'){const parts=[];for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,r=.12+hash(i,9,2)*.12,h=.35+hash(i,5,2)*.25;
  const stem=new T.CylinderGeometry(.012,.016,h,3,1,true);stem.translate(Math.cos(a)*r,h/2,Math.sin(a)*r);parts.push([stem,'#4c6a34']);
  const head=new T.CircleGeometry(.075,5);head.rotateX(-Math.PI/2+.35);head.translate(Math.cos(a)*r,h,Math.sin(a)*r);parts.push([head,petal]);
  const eye=new T.CircleGeometry(.025,3);eye.rotateX(-Math.PI/2+.35);eye.translate(Math.cos(a)*r,h+.005,Math.sin(a)*r);parts.push([eye,'#e8c23c']);}
 for(let i=0;i<3;i++){const g=blade(.07,.3,.06,i*2.1);parts.push([g,(x,y)=>new T.Color('#3e5a2c').lerp(new T.Color('#86a656'),y/.3)]);}
 return merged(parts);}
function stoneGeo(seed){const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=.78+hash(Math.round(x*9),Math.round(y*9)+seed,Math.round(z*9))*.4;p.setXYZ(i,x*k,Math.max(-.2,y*k*.55),z*k*.85);}
 return merged([[g,(x,y,z)=>new T.Color('#7c7a72').lerp(new T.Color('#a8a596'),Math.max(0,y)*1.4).lerp(new T.Color('#6f7d4f'),y>.3&&hash(Math.round(x*5),3,Math.round(z*5))>.5?.45:0)]]);}
function shrubGeo(){
 // Irregular woody branches with individual leaves, merged into one instanced mesh.
 const parts=[];
 for(let i=0;i<14;i++){
  const a=i*2.399,rad=.12+(i%4)*.10,x=Math.cos(a)*rad,z=Math.sin(a)*rad,h=.48+(i%5)*.10;
  const stem=new T.CylinderGeometry(.008,.017,h,4);stem.translate(x,h/2,z);parts.push([stem,'#554b30']);
  for(let j=0;j<6;j++){const y=.18+j*.10,ang=a+j*2.1,r=.06+(j%3)*.035;
   const leaf=blade(.11,.23,.06,ang);leaf.rotateZ(j%2?.35:-.35);leaf.translate(x+Math.cos(ang)*r,y,z+Math.sin(ang)*r);
   const base=new T.Color('#314927'),tip=new T.Color((i+j)%3?'#70834d':'#526c39');parts.push([leaf,(xx,yy)=>base.clone().lerp(tip,Math.min(1,Math.max(0,(yy-y)/.23)))]);
  }
 }
 return merged(parts);}
function fernGeo(){const parts=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2,g=new T.PlaneGeometry(.22,.9,1,3),p=g.attributes.position;
  for(let k=0;k<p.count;k++){const y=p.getY(k)+.45;p.setXYZ(k,p.getX(k)*(1-y*.8),y*.55,y*y*.5+y*.2);}g.rotateY(a);parts.push([g,(x,y)=>new T.Color('#2e5527').lerp(new T.Color('#79a24a'),y/.55)]);}return merged(parts);}
function stumpGeo(){const t=new T.CylinderGeometry(.32,.42,.45,9);t.translate(0,.22,0);const top=new T.CircleGeometry(.32,9);top.rotateX(-Math.PI/2);top.translate(0,.451,0);
 return merged([[t,'#5b4330'],[top,'#c9a979']]);}
function logGeo(){const t=new T.CylinderGeometry(.22,.26,2.6,8);t.rotateZ(Math.PI/2);t.translate(0,.22,0);const e=new T.CircleGeometry(.22,8);e.rotateY(Math.PI/2);e.translate(1.301,.22,0);
 return merged([[t,(x,y)=>new T.Color('#4d3a2a').lerp(new T.Color('#5f6b3a'),y>.38?.6:0)],[e,'#b8955f']]);}
function mushroomGeo(){const parts=[];for(const [x,z,s] of [[0,0,1],[.18,.1,.7],[-.12,.15,.55]]){const st=new T.CylinderGeometry(.03*s,.04*s,.16*s,5);st.translate(x,.08*s,z);
  const cap=new T.SphereGeometry(.09*s,7,4,0,Math.PI*2,0,Math.PI/2);cap.translate(x,.15*s,z);parts.push([st,'#efe6d0'],[cap,'#b8432e']);}return merged(parts);}
function geo(name){if(!GEO.has(name))GEO.set(name,name.startsWith('flower:')?flowerGeo(name.slice(7)):{grass:()=>grassGeo('short'),tall:()=>grassGeo('tall'),flower:flowerGeo,stone:()=>stoneGeo(1),shrub:shrubGeo,fern:fernGeo,stump:stumpGeo,log:logGeo,mushroom:mushroomGeo}[name]());return GEO.get(name);}

const FLOWERS=['#f4f1e6','#f2d24a','#b58ad6','#e6795c','#8fb1e6','#f3a6c4'];
const BUDGET={low:{grass:900,tall:120,flower:60,stone:40,shrub:16,fern:20,wood:6},medium:{grass:3400,tall:520,flower:200,stone:90,shrub:36,fern:50,wood:14},high:{grass:6500,tall:1100,flower:420,stone:150,shrub:60,fern:90,wood:24}};

// avoid: optional {segments:[[x0,z0,x1,z1,halfWidth]...], rects:[[x,z,rx,rz]...]} in local units
// V161 opts: fraction (share of the full density, for layered/neighbour cover), salt (a different
// but equally natural scatter), deferred (return {group,steps} so the caller can spread the work
// over several frames instead of one long freeze).
export function createGroundCoverV156(tile,height,quality='medium',avoid={},opts={}){
 const fraction=opts.fraction??1,steps=[];
 const group=new T.Group();group.userData.groundCoverV156=true;if(!tile.land)return opts.deferred?{group,steps}:group;
 const budget=BUDGET[quality]||BUDGET.medium,seed=((tile.c*193+tile.r*337)%20000)+(opts.salt||0)*7919,woods=tile.biome==='forest'||tile.biome==='taiga'||tile.biome==='jungle',
  dry=['steppe','desert','tundra','mesa','coastal_steppe'].includes(tile.biome),hills=tile.mountain||tile.biome==='hills';
 const W=DETAIL_TILE_X-4,D=DETAIL_TILE_Z-4,segs=avoid.segments||[],rects=avoid.rects||[];
 const blocked=(x,z)=>{for(const [x0,z0,x1,z1,hw] of segs){const dx=x1-x0,dz=z1-z0,l=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-x0)*dx+(z-z0)*dz)/l));if(Math.hypot(x0+dx*t-x,z0+dz*t-z)<hw)return true;}
  for(const [cx,cz,rx,rz] of rects)if(Math.abs(x-cx)<rx&&Math.abs(z-cz)<rz)return true;return false;};
 const dummy=new T.Object3D(),col=new T.Color();
 // rejection sampling against a clustering field so meadows, clearings and drifts form
 function place(name,count,{field,scale,tint,yOff=0,tilt=0}){
  count=Math.round(count*fraction);if(count<1)return null;
  const mesh=new T.InstancedMesh(geo(name),MAT,Math.max(1,count));let n=0,tries=0;
  while(n<count&&tries<count*6){tries++;const i=tries+name.length*977;
   const x=(hash(i,seed,1)-.5)*W,z=(hash(i,seed,2)-.5)*D;if(hash(i,seed,3)>field(x,z))continue;if(blocked(x,z))continue;
   const y=height(x,z);if(!(y>-50))continue;const s=scale(i);
   dummy.position.set(x,y+yOff*s,z);dummy.rotation.set((hash(i,seed,5)-.5)*tilt,hash(i,seed,4)*6.283,(hash(i,seed,6)-.5)*tilt);dummy.scale.setScalar(s);dummy.updateMatrix();
   mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n,tint(i,x,z,col));n++;}
  mesh.count=n;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.userData.groundCoverV156=name;if(n)group.add(mesh);return mesh;}
 const P=(...args)=>steps.push(()=>place(...args));
 const meadow=(x,z)=>fbm(x/38,z/38,seed+11),flowerDrift=(x,z)=>fbm(x/22,z/22,seed+29),stony=(x,z)=>fbm(x/30,z/30,seed+47);
 const grassTint=(i,x,z,c)=>{const m=meadow(x,z);c.setRGB(1,1,1);if(dry)c.setRGB(1.08,1.0,.72);c.multiplyScalar(.82+m*.32);if(m<.35)c.lerp(new T.Color(1.1,1.02,.72),.4);return c;};
 P('grass',budget.grass,{field:(x,z)=>.25+meadow(x,z)*.9,scale:i=>.8+hash(i,seed,7)*.65,tint:grassTint});
 P('tall',budget.tall,{field:(x,z)=>Math.max(0,meadow(x,z)-.45)*2.4,scale:i=>.8+hash(i,seed,8)*.65,tint:grassTint});
 // each flower colour is its own small batch so stems stay green; drifts of one colour form naturally
 if(!dry||tile.biome==='steppe')FLOWERS.forEach((c,k)=>P('flower:'+c,Math.round(budget.flower/FLOWERS.length*(k<2?1.6:.8)),{field:(x,z)=>Math.max(0,flowerDrift(x,z)-.5)*3.2*(Math.floor(fbm(x/45,z/45,seed+61+k)*3)===1?1:.25),
  scale:i=>1.3+hash(i,seed,9)*.8,tint:(i,x,z,c2)=>c2.setScalar(.9+hash(i,seed,10)*.2)}));
 P('stone',Math.round(budget.stone*(hills?2:dry?1.4:1)),{field:(x,z)=>.15+Math.max(0,stony(x,z)-.4)*1.8,scale:i=>(.18+Math.pow(hash(i,seed,11),3)*(hills?1.6:.9)),yOff:-.05,tilt:.4,
  tint:(i,x,z,c)=>c.setScalar(.85+hash(i,seed,12)*.3)});
 P('shrub',Math.round(budget.shrub*(woods?1.6:dry?.6:1)),{field:(x,z)=>.2+Math.max(0,.55-meadow(x,z))*1.5,scale:i=>.6+hash(i,seed,13)*.8,tint:(i,x,z,c)=>c.setScalar(.85+hash(i,seed,14)*.3)});
 if(!dry)P('fern',Math.round(budget.fern*(woods?2.2:.6)),{field:(x,z)=>woods?.8:Math.max(0,.5-meadow(x,z)),scale:i=>.8+hash(i,seed,15)*.9,tint:(i,x,z,c)=>c.setScalar(.85+hash(i,seed,16)*.3)});
 if(woods||tile.biome==='grassland'||tile.biome==='lush_river'){const k=woods?1:.35;
  P('stump',Math.round(budget.wood*k),{field:()=>.7,scale:i=>.8+hash(i,seed,17)*.6,tint:(i,x,z,c)=>c.setScalar(1)});
  P('log',Math.round(budget.wood*k*.6),{field:()=>.7,scale:i=>.7+hash(i,seed,18)*.5,yOff:-.04,tint:(i,x,z,c)=>c.setScalar(1)});
  if(woods)P('mushroom',budget.wood*2,{field:()=>.7,scale:i=>1+hash(i,seed,19),tint:(i,x,z,c)=>c.setScalar(1)});}
 if(opts.deferred)return {group,steps};
 for(const f of steps)f();
 return group;
}
export function disposeGroundCover(group){group?.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
export const groundCoverBudgetV156=q=>BUDGET[q]||BUDGET.medium;
