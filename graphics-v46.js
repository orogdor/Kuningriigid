// V46 procedural environment and age-appropriate small props.
// The models are generated as real Three.js geometry: no flat image impostors.
import * as T from './vendor/three.module.js';
import {DETAIL_TILE_X,DETAIL_TILE_Z} from './detail-scale-v123.js';
const geoCache=new Map(),matCache=new Map(),accentCache=new Map();
function geo(k,fn){if(!geoCache.has(k)){const g=fn();g.userData.shared=true;geoCache.set(k,g)}return geoCache.get(k)}
function mat(c,metal=false){const k=c+metal;if(!matCache.has(k))matCache.set(k,new T.MeshStandardMaterial({color:c,roughness:metal?.43:.94,metalness:metal?.35:0}));return matCache.get(k)}
function add(group,key,color,x,y,z,sx,sy,sz){const g=key==='cube'?geo('cube',()=>new T.BoxGeometry(1,1,1)):key==='rock'?geo('rock',()=>new T.DodecahedronGeometry(1,0)):key==='cone'?geo('cone',()=>new T.ConeGeometry(1,1,6)):geo('barrel',()=>new T.CylinderGeometry(1,1,1,9));const m=new T.Mesh(g,mat(color,key==='barrel'&&color==='#687981'));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
const palette=['#668e80','#ad8065','#9585b2','#b9a061'];
/** Building props use a cached mesh template and shared geometries to avoid allocations per house. */
export function createArchitecturalDetails(type,team,age){const key=type+':'+team+':'+age;let template=accentCache.get(key);if(!template){template=new T.Group();const g=template,modern=age>=5,stone=age>=2,industry=['steelworks','engineworks','railstation','oilwell','refinery','powerplant','autofactory','airfield','smelter','smith'].includes(type),isNature=['farm','forester','lumber','hunter'].includes(type);const earth=stone?'#a9a69b':'#8d8067';
 // Walkway and thresholds vary with technology but never block characters.
 for(let i=0;i<4;i++){const xx=Math.sin(i*4.1)*.34,zz=2.1+i*.52;const slab=add(g,'cube',modern?'#7e9296':earth,xx,.035,zz,stone?1.12:.75,.065,stone?.65:.45);slab.rotation.y=Math.sin(i*2.4)*.12}
 if(!industry&&type!=='bridge'&&type!=='harbor'){
  for(let side of [-1,1]){const z=1.95;add(g,'cube',stone?'#72766f':'#795d43',side*2.5,.34,z,.13,.72,.14);add(g,'cube',stone?'#72766f':'#927752',side*2.5,.60,z-.32,.12,.08,.65)}
  for(let i=0;i<2;i++){const x=i?2.6:-2.6,z=-1.7+i*.9;add(g,'rock',isNature?'#507849':'#6f8062',x,.35,z,.55,.45,.54);add(g,'rock','#748851',x+.22,.51,z-.15,.35,.36,.31)}
 }
 if(isNature){for(let i=0;i<4;i++){const x=1.7+(i%2)*.5,z=-1.6+Math.floor(i/2)*.6;const bush=add(g,'cone',age>=3?'#66844a':'#77924e',x,.42,z,.24,.8,.24);bush.rotation.y=i*2}}
 else if(type==='warehouse'||type==='market'||type==='cellar'||type==='hall'){
  for(let i=0;i<3;i++){const x=-2+i*.73;add(g,'cube','#886640',x,.26,2.05,.55,.50,.54);add(g,'cube','#b69661',x,.53,2.05,.5,.06,.50)}
 }
 if(industry&&age>=4){for(let i=0;i<3;i++){const x=-2+i*1.8,z=2.8;add(g,'barrel','#687981',x,.47,z,.30,.86,.3);add(g,'cube','#4b575a',x,.95,z,.65,.08,.65)}for(let x of [-2.7,2.7])add(g,'cube','#4d6161',x,.42,1.9,.75,.72,.65)}
 if(age>=3&&type!=='bridge'&&type!=='harbor'){for(let x of [-2.25,2.25]){add(g,'cube',modern?'#687981':'#6f6350',x,1.04,2.25,.12,1.8,.12);add(g,'rock',modern?'#b9e7db':'#edb96a',x,1.95,2.25,.20,.25,.20)}}
 if(age===0&&type!=='bridge'){for(let x of [-2.45,2.45]){add(g,'barrel','#76513a',x,.42,1.3,.11,.84,.11);add(g,'cone','#e5a350',x,.97,1.3,.15,.42,.15)}}
 accentCache.set(key,template)}return template.clone(true)}
// One draw call per ground-cover type. Placement is deterministic per tile and seed.
const grassGeo=geo('grassV46',()=>{const g=new T.BufferGeometry();const p=[];for(let k=0;k<3;k++){const a=k*Math.PI/3,dx=Math.cos(a)*.24,dz=Math.sin(a)*.24;p.push(-dx,0,-dz,dx,0,dz,0,.9,0)}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g});
const pebbleGeo=geo('pebbleV46',()=>new T.DodecahedronGeometry(1,0));
function hash(x,y,seed){const v=Math.sin(x*127.13+y*311.71+seed*37.1)*43758.5453;return v-Math.floor(v)}
export function createGroundCover(tile,height,quality='medium'){
 const group=new T.Group();if(!tile.land)return group;const isWoodland=tile.biome==='forest',isHills=tile.mountain||tile.biome==='hills',base=(tile.c*193+tile.r*337)%20000;
 const n=quality==='low'?85:quality==='high'?430:250,grass=new T.InstancedMesh(grassGeo,new T.MeshStandardMaterial({color:'#c5d2a7',side:T.DoubleSide,roughness:1}),n),dummy=new T.Object3D();grass.frustumCulled=true;grass.userData.groundCoverV46=true;
 const tint=['#486f44','#5d8046','#79904e','#a1a66c','#8b9157'];
 for(let i=0;i<n;i++){const x=(hash(i,base,10)-.5)*(DETAIL_TILE_X-3),z=(hash(i,base,20)-.5)*(DETAIL_TILE_Z-3),h=height(x,z);dummy.position.set(x,h+.045,z);dummy.scale.setScalar(.6+hash(i,base,30)*1.6);dummy.rotation.set(0,hash(i,base,40)*6.283,0);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new T.Color(tint[Math.floor(hash(i,base,50)*tint.length)]))}
 grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;group.add(grass);
 const rocksCount=quality==='low'?18:quality==='high'?85:48,rocks=new T.InstancedMesh(pebbleGeo,mat(isHills?'#8e968c':'#978f7b'),rocksCount);
 for(let i=0;i<rocksCount;i++){const x=(hash(i,base,60)-.5)*(DETAIL_TILE_X-4),z=(hash(i,base,70)-.5)*(DETAIL_TILE_Z-4),h=height(x,z),sz=.22+hash(i,base,80)*(isHills?1.4:.55);dummy.position.set(x,h+.12*sz,z);dummy.scale.set(sz,.23*sz,sz*.7);dummy.rotation.set(0,hash(i,base,90)*6.283,0);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}rocks.instanceMatrix.needsUpdate=true;rocks.userData.groundCoverV46=true;group.add(rocks);
 return group;
}
export function estimateGroundDetailBudget(quality='medium'){return {grass:quality==='low'?85:quality==='high'?430:250,rocks:quality==='low'?18:quality==='high'?85:48,drawCalls:2}}
