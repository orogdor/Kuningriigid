import {detailWorldRoadWidth} from './road-width-v89.js';
import {roadSurfaceLevelV216,roadWidthRatioV216,roadEdgeVarianceV216} from './road-appearance-v216.js';
import {DETAIL_X,DETAIL_Z,DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
// V67: one topology for each river system and each road network. The atlas
// and detailed view are different projections of exactly the same vertices,
// NEVER independently drawn rectangular per-tile water/road chunks.
import * as T from './vendor/three.module.js';
import {releaseMaterial} from './program-keep-v161.js';
import {waterMaterial,roadMaterial,animate} from './landscape-v149.js?v=2231';
import {createCrossingNetwork} from './landscape-polish-v84.js?v=2232';
import {riverNear,visibleRiverHeight,localToWorld,getRivers,roadNetwork,surface,visualSurface,visualElevation,visualProject,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=2232';
const colors=['#000000','#bba078','#c0aa83','#aaa497','#9eacae'];
const V=(arr,p)=>arr.push(p.x,p.y,p.z);
const field=(game,x,z,view,tile)=>view==='world'?{x,z}:{...worldToLocal(tile,x,z)};
const elev=(game,x,z,view,tile,ground)=>view==='world'?surface(game,x,z,view):ground?ground(worldToLocal(tile,x,z).x,worldToLocal(tile,x,z).z):visualSurface(game,x,z,view);
const vp=(game,y,view,x,z)=>view==='detail'?visualProject(game,y,x,z):projectHeight(y,view); // V161 drawing heights
const pos=(game,x,z,y,view,tile)=>({...field(game,x,z,view,tile),y:vp(game,y,view,x,z)});
function join(pts,game,scope,tile,kind,level=1,age=0,ground=null){
 // V149: atlas roads are drawn wider so they read at map scale (centre lines are unchanged).
 const isRiver=kind==='river',wBase=isRiver?0:[0,.85,1.1,1.4,1.75][level],out=[];
 for(let i=0;i<pts.length;i++){
  const p=pts[i],before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
  const tX=after.x-before.x,tZ=after.z-before.z,d=Math.hypot(tX,tZ)||1;
  const nx=-tZ/d,nz=tX/d;
  const width=isRiver?p.width:(
   scope==='detail'?detailWorldRoadWidth(level)/2/Math.hypot(nx*DETAIL_X,nz*DETAIL_Z):wBase
  )*roadWidthRatioV216(level,age)*roadEdgeVarianceV216(p.x,p.z);
  const left={x:p.x+nx*width,z:p.z+nz*width},right={x:p.x-nx*width,z:p.z-nz*width};
  const outer=isRiver?width+Math.max(1.4,width*.32)*(1+.24*Math.sin(p.x*.17+p.z*.13)):width*1.6;
  const outerL={x:p.x+nx*outer,z:p.z+nz*outer},outerR={x:p.x-nx*outer,z:p.z-nz*outer};
  const waterHeight=Math.max(.85,baseHeight(game,p.x,p.z)-(2.4+Math.min(2.1,p.width*.20)));
  // Lateral terrain samples: no flat raised motorway over rolling dirt.
  const lift=scope==='world'?.12:.018;
  const innerY=isRiver?vp(game,waterHeight,scope,p.x,p.z):elev(game,p.x,p.z,scope,tile,ground)+lift;
  const edgeY=v=>isRiver?innerY:elev(game,v.x,v.z,scope,tile,ground)+lift*.85;
  const bankY=v=>elev(game,v.x,v.z,scope,tile,ground)+(scope==='world'?.035:.014);
  out.push({
   m:{...field(game,p.x,p.z,scope,tile),y:innerY},
   l:{...field(game,left.x,left.z,scope,tile),y:edgeY(left)},
   r:{...field(game,right.x,right.z,scope,tile),y:edgeY(right)},
   ol:{...field(game,outerL.x,outerL.z,scope,tile),y:bankY(outerL)},
   or:{...field(game,outerR.x,outerR.z,scope,tile),y:bankY(outerR)}
  });
 }
 return out;
}
function tri(arr,a,b,c){V(arr,a);V(arr,b);V(arr,c)}
function strip(arr,a,b,c,d){tri(arr,a,b,c);tri(arr,c,b,d)}
function buffers(...args){const steps=buffersStepsV242(...args);let result;do{result=steps.next();}while(!result.done);return result.value;}
function* buffersStepsV242(vertices,color,{standard=false,opacity=1,shade=null,alpha=null}={}){
 if(!vertices.length)return null;
 // Weld shared vertices into an indexed mesh. Consecutive river/road
 // sections now share actual vertices and normals, instead of separate
 // face triangles placed edge-to-edge (which caused faceting and seams).
 const unique=[],indices=[],lookup=new Map();
 for(let i=0;i<vertices.length;i+=3){if(i&&i%576===0)yield;
  const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
  const key=Math.round(x*1000)+','+Math.round(y*1000)+','+Math.round(z*1000);
  let n=lookup.get(key);
  if(n===undefined){n=unique.length/3;unique.push(x,y,z);lookup.set(key,n)}
  indices.push(n);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(unique,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const tint=new T.Color(color),stride=alpha?4:3,vertexColors=new Float32Array(unique.length/3*stride);
 for(let i=0,j=0;i<unique.length;i+=3,j+=stride){if(i&&i%576===0)yield;const c=shade?shade(unique[i],unique[i+1],unique[i+2]):tint;vertexColors[j]=c.r;vertexColors[j+1]=c.g;vertexColors[j+2]=c.b;if(alpha)vertexColors[j+3]=alpha(unique[i],unique[i+1],unique[i+2])}
 geo.setAttribute('color',new T.Float32BufferAttribute(vertexColors,stride));
 const mat=standard?new T.MeshStandardMaterial({vertexColors:true,roughness:alpha?.95:.55,metalness:alpha?0:.10,transparent:opacity!==1||!!alpha,opacity,side:T.DoubleSide,depthWrite:opacity===1&&!alpha}):new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:opacity!==1,opacity,depthWrite:opacity===1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 return new T.Mesh(geo,mat);
}

// V149: downstream direction of the nearest river segment (edges run from a cell to riverTo).
const flowIndex=new WeakMap();
function riverFlow(game,x,z){
 let index=flowIndex.get(game);
 if(!index){index=new Map();for(const e of getRivers(game))for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i];
  const key=Math.floor((a.x+b.x)/2/40)+':'+Math.floor((a.z+b.z)/2/40),list=index.get(key)||[];list.push([a,b]);index.set(key,list)}flowIndex.set(game,index)}
 const cx=Math.floor(x/40),cz=Math.floor(z/40);let best=Infinity,dir={x:1,z:0};
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const [a,b] of index.get((cx+dx)+':'+(cz+dz))||[]){
  const vx=b.x-a.x,vz=b.z-a.z,l=vx*vx+vz*vz||1,t=Math.max(0,Math.min(1,((x-a.x)*vx+(z-a.z)*vz)/l)),d=Math.hypot(a.x+vx*t-x,a.z+vz*t-z);
  if(d<best){best=d;const n=Math.sqrt(l);dir={x:vx/n,z:vz/n}}
 }
 return dir;
}
const mouthBlend=(game,x,z)=>{const t=Math.max(0,Math.min(1,(game.atlasHeight(x,z)-.30)/3.7));return t*t*(3-2*t);};
function visible(tile,path,radius=110){if(!tile)return true;radius=tile.tacticalRadius||radius;return path.some(p=>Math.abs(p.x-tile.x)<radius&&Math.abs(p.z-tile.z)<radius)}
export function createRiverNetwork(...args){const steps=riverNetworkStepsV242(...args);let result;do{result=steps.next();}while(!result.done);return result.value;}
export function* riverNetworkStepsV242(game,scope='world',tile=null,quality='medium',ground=null){
 const group=new T.Group();group.name='V67 continuous watershed network';group.userData.landscape=true;
 const water=[],banks=[],dryBanks=[];
 let shallowCrossings=0;
 let riverCount=0,sections=0;
 // A single clipped scalar-field mesh unions ALL tributaries. Every shared
 // grid coordinate has one height; overlapping ribbons and junction fans vanish.
 const step=scope==='detail'?1.75:2.5,cells=new Set(),nodes=new Map();
 for(const edge of getRivers(game)){
  if(!visible(tile,edge.points))continue;riverCount++;
  for(const p of edge.points){yield;
   const radius=p.width*2.20+step*2;
   for(let gz=Math.floor((p.z-radius)/step);gz<=Math.ceil((p.z+radius)/step);gz++)for(let gx=Math.floor((p.x-radius)/step);gx<=Math.ceil((p.x+radius)/step);gx++)cells.add(gx+','+gz);
  }
 }
 const node=(gx,gz)=>{
  const key=gx+','+gz;if(nodes.has(key))return nodes.get(key);
  const x=gx*step,z=gz*step,near=riverNear(game,x,z),w=near.width||1;
  const distance=Math.min(100,near.distance);
  const p={x,z,d:distance-w,outer:distance-w*1.40,outerDry:distance-w*2.18,shore:.30-game.atlasHeight(x,z),width:w};nodes.set(key,p);return p;
 };
 const clip=(polygon,key,invert=false)=>{
  const result=[];for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],va=(invert?-1:1)*a[key],vb=(invert?-1:1)*b[key];
   if(va<=0)result.push(a);
   if((va<=0)!==(vb<=0)){const t=va/(va-vb),p={};for(const k of ['x','z','d','outer','outerDry','shore','width'])p[k]=a[k]+(b[k]-a[k])*t;result.push(p)}
  }return result;
 };
 const emit=(polygon,array,isWater)=>{
  const points=polygon.map(p=>{
   // V152: rivers run on through the beach into the sea; near the mouth the surface settles just above
   // sea level and its colour fades to the shallow-sea tone, so it flows into the sea instead of stopping at the shore.
   // V223.2: use exactly the same visible water level used by the
   // riverbed deformation (including the transition into the sea).
   let y=isWater?visibleRiverHeight(game,p.x,p.z):(scope==='world'?surface:visualElevation)(game,p.x,p.z)+.10;
   const q=scope==='detail'&&ground&&!isWater?worldToLocal(tile,p.x,p.z):null;
   return {...field(game,p.x,p.z,scope,tile),y:q?ground(q.x,q.z)+.012:vp(game,y,scope,p.x,p.z)};
  });for(let k=1;k<points.length-1;k++)tri(array,points[0],points[k],points[k+1]);
 };
 let batchV242=0;for(const key of cells){if(batchV242++%96===0)yield;
  const [x,z]=key.split(',').map(Number),a=node(x,z),b=node(x+1,z),c=node(x,z+1),d=node(x+1,z+1);
  for(const triangle of [[a,c,b],[b,c,d]]){
   const land=clip(triangle,'shore');if(land.length<3)continue;
   emit(clip(land,'d'),water,true);
   emit(clip(clip(land,'outer'),'d',true),banks,false);
   // V223: second, much softer bank band between wet mud and untouched meadow.
   // It is clipped using the same scalar field, so tributary joins remain seamless.
   emit(clip(clip(land,'outerDry'),'outer',true),dryBanks,false);
   sections++;
  }
 }
 // V223: actual fords are shallow in worldElevation(), and crossing stones
 // are supplied by createCrossingNetwork(). The old wide shoal billboard
 // was visually opaque (and narrow replacements looked like straight stripes).
 // Do not draw an extra flat surface on top of flowing water.
 for(const edge of getRivers(game)){
  if(edge.c.ford&&!edge.c.bridge&&visible(tile,edge.points))shallowCrossings++;
 }
 // V149: wet, dark mud at the waterline that dries and fades into the surrounding land.
 const toWorld=(x,z)=>scope==='world'?{x,z}:localToWorld(tile,x,z);
 const mud=new T.Color('#5a523f'),damp=new T.Color('#6e6a4c');
 const bankMesh=yield* buffersStepsV242(banks,'#6e6a4c',{standard:true,shade:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z),t=Math.max(0,Math.min(1,(near.distance-near.width)/Math.max(.6,near.width*.4)));
  return mud.clone().lerp(damp,t).multiplyScalar(.92+.16*Math.sin(p.x*.37+Math.sin(p.z*.29)*2));
 },alpha:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z),t=Math.max(0,Math.min(1,(near.distance-near.width)/Math.max(.6,near.width*.4)));
  return Math.pow(1-t,1.6)*.80;
 }});
 // Fine gravel, silty sand and grass mingle just beyond the wet mud.
 const gravel=new T.Color('#a99e80'),silt=new T.Color('#857e65');
 const dryMesh=yield* buffersStepsV242(dryBanks,'#a99e80',{standard:true,shade:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z);
  const t=Math.max(0,Math.min(1,(near.distance-near.width*1.4)/Math.max(.8,near.width*.78)));
  const grain=.5+.5*Math.sin(p.x*.89+p.z*.63+Math.sin(p.x*2.07)*1.3);
  return silt.clone().lerp(gravel,.25+.55*grain).multiplyScalar(.87+.13*t);
 },alpha:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z);
  const t=Math.max(0,Math.min(1,(near.distance-near.width*1.4)/Math.max(.8,near.width*.78)));
  return .54*Math.pow(1-t,1.3);
 }});
 const deep=new T.Color('#1d4a57'),shallowCol=new T.Color('#4f7f74'),seaCol=new T.Color('#62a6a3');
 const waterMesh=yield* buffersStepsV242(water,'#2d7584',{standard:true,opacity:.94,shade:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z);
  const edge=Math.min(1,near.distance/Math.max(1,near.width));
  return deep.clone().lerp(shallowCol,Math.pow(edge,2.2)*.85).lerp(seaCol,1-mouthBlend(game,p.x,p.z)).multiplyScalar(.97+.03*Math.sin(p.x*.11+p.z*.07));
 }});
 if(waterMesh){
  waterMesh.material.dispose();waterMesh.material=waterMaterial(scope,tile);animate(waterMesh);
  const pos=waterMesh.geometry.attributes.position,flow=new Float32Array(pos.count*2),shore=new Float32Array(pos.count);
  for(let i=0;i<pos.count;i++){if(i&&i%192===0)yield;
   const p=toWorld(pos.getX(i),pos.getZ(i)),f=riverFlow(game,p.x,p.z);
   const near=riverNear(game,p.x,p.z),speed=Math.max(.45,Math.min(1.35,1.5-(near.width||3)*.09));
   flow[i*2]=f.x*speed;flow[i*2+1]=f.z*speed;shore[i]=Math.max(0,Math.min(1,near.distance/Math.max(.5,near.width)));
  }
  waterMesh.geometry.setAttribute('aFlow',new T.BufferAttribute(flow,2));waterMesh.geometry.setAttribute('aShore',new T.BufferAttribute(shore,1));
 }
 if(dryMesh){dryMesh.name='V223 gravel and meadow river shoulders';dryMesh.renderOrder=7;group.add(dryMesh)}
 if(bankMesh){bankMesh.name='continuous river banks';bankMesh.renderOrder=8;group.add(bankMesh)}
 if(waterMesh){waterMesh.name='continuous water surface';waterMesh.renderOrder=9;group.add(waterMesh)}
 group.userData.riverEdges=riverCount;
 group.userData.shallowFordCount=shallowCrossings;
 group.userData.riverVertexCount=water.length/3;
 group.userData.dryBankVertexCount=dryBanks.length/3;
 group.userData.sections=sections;
 // Crossings remain independent STRUCTURES, but share river coordinates and
 // are only placed at actual fixed world passage locations.
 group.add(createCrossingNetwork(game,scope,tile,quality));
 return group;
}
// V157: on detail maps a road bends around building plots instead of running through them.
// The centre line is densified in local units, pushed out of every (inflated) plot rectangle and
// lightly smoothed, a few rounds; points outside the local map are left as they are.
function steerAroundPlots(points,tile,obstacles,margin){
 const local=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.45));
  for(let k=i===1?0:1;k<=n;k++){const t=k/n,p=worldToLocal(tile,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);local.push({x:p.x,z:p.z,width:a.width});}}
 const inMap=p=>Math.abs(p.x)<360&&Math.abs(p.z)<320;
 const push=p=>{let moved=false;for(const [cx,cz,rx,rz] of obstacles){const RX=rx+margin,RZ=rz+margin,dx=p.x-cx,dz=p.z-cz;if(Math.abs(dx)>=RX||Math.abs(dz)>=RZ)continue;
  const ox=RX-Math.abs(dx),oz=RZ-Math.abs(dz);if(ox<oz)p.x=cx+Math.sign(dx||1)*(RX+.05);else p.z=cz+Math.sign(dz||1)*(RZ+.05);moved=true;}return moved;};
 for(let round=0;round<8;round++){let any=false;for(let i=1;i<local.length-1;i++)if(inMap(local[i])&&push(local[i]))any=true;
  if(!any&&round>1)break;
  for(let pass=0;pass<2;pass++)for(let i=1;i<local.length-1;i++){const p=local[i];if(!inMap(p))continue;p.x=p.x*.5+(local[i-1].x+local[i+1].x)*.25;p.z=p.z*.5+(local[i-1].z+local[i+1].z)*.25;}}
 for(let i=1;i<local.length-1;i++)if(inMap(local[i]))push(local[i]);
 // thin back out to ~1.3 local units, then back to world coordinates
 const out=[];let last=null;for(const p of local){if(last&&Math.hypot(p.x-last.x,p.z-last.z)<1.3&&p!==local[local.length-1])continue;const w=localToWorld(tile,p.x,p.z);out.push({x:w.x,z:w.z,width:p.width});last=p;}
 return out;
}
// V175.1: paving in the local scene must never contain a triangle crossing
// a SOLID fortification or building. Paths still emerge from real world-road
// traffic. The world atlas remains unchanged; the detail ribbon is clipped
// against exactly the same footprint used by local navigation.
export function roadRibbonClearV175(a,b,obstacles=[],extra=0){
 if(!obstacles?.length)return true;
 const limit=Math.max(.02,extra);
 const len=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(len/.75));
 for(let i=0;i<=steps;i++){
  const t=i/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  if(obstacles.some(([cx,cz,rx,rz])=>Math.abs(x-cx)<rx+limit&&Math.abs(z-cz)<rz+limit))return false;
 }
 return true;
}
// Route the part of an existing strategic road inside the active tile through
// the same walkable grid as citizens. The outer road graph is preserved.
export function routeRoadThroughTileV182(points,tile,nav,preferNatural=false){
 const local=points.map(p=>worldToLocal(tile,p.x,p.z));
 const inside=p=>Math.abs(p.x)<=DETAIL_HALF_X+.1&&Math.abs(p.z)<=DETAIL_HALF_Z+.1;
 const first=local.findIndex(inside),last=local.findLastIndex(inside);
 if(first<0||last<=first)return null;
 // V223: when the hand-shaped world spline already clears the entire nav
 // corridor, preserve it. Re-running A* unconditionally had replaced every
 // gently curved road by orthogonal 1m-grid kinks even in empty countryside.
 if(preferNatural){
  let corridorClear=true,previous=null;
  for(let i=first;i<=last;i++){
   const p=local[i],before=local[Math.max(first,i-1)],after=local[Math.min(last,i+1)];
   const dx=after.x-before.x,dz=after.z-before.z,len=Math.hypot(dx,dz)||1;
   const nx=-dz/len,nz=dx/len;
   const left={x:p.x+nx*2.35,z:p.z+nz*2.35};
   const right={x:p.x-nx*2.35,z:p.z-nz*2.35};
   if(!nav.open(p.x,p.z)||!nav.open(left.x,left.z)||!nav.open(right.x,right.z)||
    (previous&&(!nav.clear(previous.p,p)||!nav.clear(previous.left,left)||!nav.clear(previous.right,right)))){
    corridorClear=false;break;
   }
   previous={p,left,right};
  }
  if(corridorClear)return null;
 }
 const a=nav.nearest(local[first],16),b=nav.nearest(local[last],16);
 if(!a||!b)return null;
 const path=nav.route(a,b,{preferRoads:true});if(!path?.length)return null;
 // V223: soften the stair-stepped A* centreline without cutting across walls
 // or buildings. Navigation and movement paths themselves are never changed.
 let smoothPath=path.map(p=>({x:p.x,z:p.z}));
 for(let pass=0;pass<5;pass++){
  const next=smoothPath.map(p=>({...p}));
  for(let i=1;i<smoothPath.length-1;i++){
   const prev=smoothPath[i-1],cur=smoothPath[i],after=smoothPath[i+1];
   const candidate={x:cur.x*.50+(prev.x+after.x)*.25,z:cur.z*.50+(prev.z+after.z)*.25};
   if(nav.open(candidate.x,candidate.z)&&nav.clear(prev,candidate)&&nav.clear(candidate,after))
    next[i]=candidate;
  }
  smoothPath=next;
 }
 const middle=smoothPath.map(p=>localToWorld(tile,p.x,p.z));
 return [...points.slice(0,first),...middle,...points.slice(last+1)];
}
function adjustRibbonForNavV182(x,nav){
 // Taper the road and verge at gates while retaining a visible continuous bed.
 for(let k=0;k<8;k++){
  if(nav.open(x.l.x,x.l.z)&&nav.open(x.r.x,x.r.z))break;
  for(const p of [x.l,x.r,x.ol,x.or]){p.x=x.m.x+(p.x-x.m.x)*.72;p.z=x.m.z+(p.z-x.m.z)*.72;}
 }
}
// V223.1: render sub-metre world-space road samples so that no long
// 18-metre detail segment can form a suspended straight chord over terrain.
export function densifyRoadV2231(points,maxStep=.62){
 if(points.length<2)return points;
 const out=[points[0]];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],count=Math.min(50,Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/maxStep)));
  for(let k=1;k<=count;k++){
   const t=k/count;
   out.push(k===count?b:{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,width:a.width??b.width});
  }
 }
 return out;
}
export function createUnifiedRoadNetwork(game,scope='world',tile=null,obstacles=null,ground=null){
 const group=new T.Group();group.name='V216 natural historical road network';group.userData.roadNetwork=true;
 // V149: one lit ribbon per road (soft verge | bed | soft verge) with across/along UVs; the
 // surface (ruts, gravel, cobbles, flagstones) is drawn by the road shader from the road level.
 const pos=[],uv=[],lvl=[],index=[],centrelines=[];
 const nav=scope==='detail'&&tile&&!game.s.battle?game.nav(tile):null;
 const owner=scope==='detail'&&tile?game.territoryOwner(tile):null;
 const dirt=scope==='detail'&&game.s.ages?.[owner?.team??0]===0;
 let roads=0,beds=0;
 for(const edge of roadNetwork(game)){
  if(!visible(tile,edge.points))continue;
  const routed=nav?routeRoadThroughTileV182(edge.points,tile,nav,true):null;
  const original=routed||(scope!=='world'&&obstacles?.length?steerAroundPlots(edge.points,tile,obstacles,detailWorldRoadWidth(edge.level)*.8+1.2):edge.points);
  const pts=densifyRoadV2231(original,scope==='detail'?.58:2.5);
  if(scope!=='world'&&tile)centrelines.push(pts.map(p=>worldToLocal(tile,p.x,p.z)));
  const roadTeam=scope==='detail'?owner?.team:
   (game.territoryOwner?.(edge.a)?.team??game.territoryOwner?.(edge.b)?.team??0);
  const roadAge=game.s.ages?.[roadTeam??0]??0;
  const surfaceLevel=roadSurfaceLevelV216(edge.level,roadAge);
  const xs=join(pts,game,scope,tile,'road',surfaceLevel,roadAge,ground);
  if(routed)for(const x of xs)if(nav.open(x.m.x,x.m.z))adjustRibbonForNavV182(x,nav);
  let along=0,base=pos.length/3;
  for(let i=0;i<xs.length;i++){
   if(i){const p=pts[i],q=pts[i-1];along+=Math.hypot(p.x-q.x,p.z-q.z);}
   const x=xs[i];
   for(const [v,u] of [[x.ol,-1.5],[x.l,-1],[x.r,1],[x.or,1.5]]){pos.push(v.x,v.y,v.z);uv.push(u,along);lvl.push(dirt?1:surfaceLevel)}
   if(i){
    const r0=base+(i-1)*4,r1=base+i*4;
    // A smooth curve can cut a blocked corner even if all the generated
    // centre points are legal. Sample the actual outer road ribbon too.
    const clear=routed&&nav.open(xs[i-1].m.x,xs[i-1].m.z)&&nav.open(xs[i].m.x,xs[i].m.z)?nav.clear(xs[i-1].m,xs[i].m):scope==='world'||!obstacles?.length||
      (roadRibbonClearV175(xs[i-1].m,xs[i].m,obstacles)&&
       roadRibbonClearV175(xs[i-1].ol,xs[i].ol,obstacles)&&
       roadRibbonClearV175(xs[i-1].or,xs[i].or,obstacles)&&
       roadRibbonClearV175(xs[i-1].l,xs[i].l,obstacles)&&
       roadRibbonClearV175(xs[i-1].r,xs[i].r,obstacles));
    if(clear){for(let k=0;k<3;k++)index.push(r0+k,r0+k+1,r1+k,r1+k,r0+k+1,r1+k+1);beds+=2;}
   }
  }
  roads++;
 }
 if(pos.length){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('aLevel',new T.Float32BufferAttribute(lvl,1));geo.setIndex(index);geo.computeVertexNormals();geo.computeBoundingSphere();
  const road=new T.Mesh(geo,roadMaterial(scope,tile));road.name='continuous road pavement';road.renderOrder=10;road.receiveShadow=true;group.add(road);
 }
 group.userData.centrelines=centrelines;group.userData.detailWidthRatio=scope==='detail'?2:null;group.userData.roadEdges=roads;group.userData.roadVertexCount=beds*3;
 return group;
}
export function disposeNetwork(group){
 if(!group)return;
 group.traverse(o=>{if(!o.geometry?.userData.sharedLandscape)o.geometry?.dispose();releaseMaterial(o.material)}); // V161: keep compiled programs
}
