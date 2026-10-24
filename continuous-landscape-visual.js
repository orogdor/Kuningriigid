import {detailWorldRoadWidth} from './road-width-v89.js';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';
// V67: one topology for each river system and each road network. The atlas
// and detailed view are different projections of exactly the same vertices,
// NEVER independently drawn rectangular per-tile water/road chunks.
import * as T from './vendor/three.module.js';
import {waterMaterial,roadMaterial,animate} from './landscape-v149.js?v=157a';
import {createCrossingNetwork} from './landscape-polish-v84.js?v=85a';
import {riverNear,localToWorld} from './continuous-landscape.js?v=123a';
import {getRivers,roadNetwork,surface,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=123a';
const colors=['#000000','#bba078','#c0aa83','#aaa497','#9eacae'];
const V=(arr,p)=>arr.push(p.x,p.y,p.z);
const field=(game,x,z,view,tile)=>view==='world'?{x,z}:{...worldToLocal(tile,x,z)};
const elev=(game,x,z,view)=>surface(game,x,z,view);
const pos=(game,x,z,y,view,tile)=>({...field(game,x,z,view,tile),y:projectHeight(y,view)});
function join(pts,game,scope,tile,kind,level=1){
 // V149: atlas roads are drawn wider so they read at map scale (centre lines are unchanged).
 const isRiver=kind==='river',wBase=isRiver?0:[0,.85,1.1,1.4,1.75][level],out=[];
 for(let i=0;i<pts.length;i++){
  const p=pts[i],before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
  const tX=after.x-before.x,tZ=after.z-before.z,d=Math.hypot(tX,tZ)||1;
  const nx=-tZ/d,nz=tX/d,width=isRiver?p.width:scope==='detail'?detailWorldRoadWidth(level)/2/Math.hypot(nx*DETAIL_X,nz*DETAIL_Z):wBase;
  const left={x:p.x+nx*width,z:p.z+nz*width},right={x:p.x-nx*width,z:p.z-nz*width};
  const outer=isRiver?width+Math.max(1.4,width*.32)*(1+.24*Math.sin(p.x*.17+p.z*.13)):width*1.6;
  const outerL={x:p.x+nx*outer,z:p.z+nz*outer},outerR={x:p.x-nx*outer,z:p.z-nz*outer};
  const waterHeight=Math.max(.85,baseHeight(game,p.x,p.z)-(2.4+Math.min(2.1,p.width*.20)));
  const innerY=isRiver?projectHeight(waterHeight,scope):elev(game,p.x,p.z,scope)+(scope==='world'?1.32:.396);
  const edgeY=isRiver?innerY:elev(game,p.x,p.z,scope)+(scope==='world'?1.3:.39);
  const bankY=(v)=>elev(game,v.x,v.z,scope)+(scope==='world'?.12:.036);
  out.push({
   m:{...field(game,p.x,p.z,scope,tile),y:innerY},
   l:{...field(game,left.x,left.z,scope,tile),y:edgeY},
   r:{...field(game,right.x,right.z,scope,tile),y:edgeY},
   ol:{...field(game,outerL.x,outerL.z,scope,tile),y:bankY(outerL)},
   or:{...field(game,outerR.x,outerR.z,scope,tile),y:bankY(outerR)}
  });
 }
 return out;
}
function tri(arr,a,b,c){V(arr,a);V(arr,b);V(arr,c)}
function strip(arr,a,b,c,d){tri(arr,a,b,c);tri(arr,c,b,d)}
function buffers(vertices,color,{standard=false,opacity=1,shade=null,alpha=null}={}){
 if(!vertices.length)return null;
 // Weld shared vertices into an indexed mesh. Consecutive river/road
 // sections now share actual vertices and normals, instead of separate
 // face triangles placed edge-to-edge (which caused faceting and seams).
 const unique=[],indices=[],lookup=new Map();
 for(let i=0;i<vertices.length;i+=3){
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
 for(let i=0,j=0;i<unique.length;i+=3,j+=stride){const c=shade?shade(unique[i],unique[i+1],unique[i+2]):tint;vertexColors[j]=c.r;vertexColors[j+1]=c.g;vertexColors[j+2]=c.b;if(alpha)vertexColors[j+3]=alpha(unique[i],unique[i+1],unique[i+2])}
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
export function createRiverNetwork(game,scope='world',tile=null,quality='medium'){
 const group=new T.Group();group.name='V67 continuous watershed network';group.userData.landscape=true;
 const water=[],banks=[],fordShoals=[];
 let shallowCrossings=0;
 let riverCount=0,sections=0;
 // A single clipped scalar-field mesh unions ALL tributaries. Every shared
 // grid coordinate has one height; overlapping ribbons and junction fans vanish.
 const step=2.5,cells=new Set(),nodes=new Map();
 for(const edge of getRivers(game)){
  if(!visible(tile,edge.points))continue;riverCount++;
  for(const p of edge.points){
   const radius=p.width*1.55+step*2;
   for(let gz=Math.floor((p.z-radius)/step);gz<=Math.ceil((p.z+radius)/step);gz++)for(let gx=Math.floor((p.x-radius)/step);gx<=Math.ceil((p.x+radius)/step);gx++)cells.add(gx+','+gz);
  }
 }
 const node=(gx,gz)=>{
  const key=gx+','+gz;if(nodes.has(key))return nodes.get(key);
  const x=gx*step,z=gz*step,near=riverNear(game,x,z),w=near.width||1;
  const distance=Math.min(100,near.distance);
  const p={x,z,d:distance-w,outer:distance-w*1.40,shore:.30-game.atlasHeight(x,z),width:w};nodes.set(key,p);return p;
 };
 const clip=(polygon,key,invert=false)=>{
  const result=[];for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],va=(invert?-1:1)*a[key],vb=(invert?-1:1)*b[key];
   if(va<=0)result.push(a);
   if((va<=0)!==(vb<=0)){const t=va/(va-vb),p={};for(const k of ['x','z','d','outer','shore','width'])p[k]=a[k]+(b[k]-a[k])*t;result.push(p)}
  }return result;
 };
 const emit=(polygon,array,isWater)=>{
  const points=polygon.map(p=>{
   // V152: rivers run on through the beach into the sea; near the mouth the surface settles just above
   // sea level and its colour fades to the shallow-sea tone, so it flows into the sea instead of stopping at the shore.
   let y=isWater?riverNear(game,p.x,p.z).waterHeight||.86:surface(game,p.x,p.z)+.10;
   if(isWater){const m=mouthBlend(game,p.x,p.z);if(m<1)y=.78+(y-.78)*m;}
   return {...field(game,p.x,p.z,scope,tile),y:projectHeight(y,scope)};
  });for(let k=1;k<points.length-1;k++)tri(array,points[0],points[k],points[k+1]);
 };
 for(const key of cells){
  const [x,z]=key.split(',').map(Number),a=node(x,z),b=node(x+1,z),c=node(x,z+1),d=node(x+1,z+1);
  for(const triangle of [[a,c,b],[b,c,d]]){
   const land=clip(triangle,'shore');if(land.length<3)continue;
   emit(clip(land,'d'),water,true);
   emit(clip(clip(land,'outer'),'d',true),banks,false);
   sections++;
  }
 }
 // Submerged pale gravel shoals highlight truly walkable low-water passages.
 // Geometry and water depth come from the same centreline in both projections.
 for(const edge of getRivers(game)){
  if(!edge.c.ford||edge.c.bridge||!visible(tile,edge.points))continue;
  const first=edge.points[0],second=edge.points[1]||edge.points[0],len=Math.hypot(second.x-first.x,second.z-first.z)||1;
  const tx=(second.x-first.x)/len,tz=(second.z-first.z)/len,nx=-tz,nz=tx;
  const width=Math.max(1.5,Math.min(first.width*.83,first.width-.35));
  let last=null;
  for(const at of [-9,-5,0,5,9]){
   const size=width*(Math.abs(at)>=9?.48:Math.abs(at)>=5?.85:1);
   const pts=[-size,size].map(offset=>{
    const x=edge.c.x+tx*at+nx*offset,z=edge.c.z+tz*at+nz*offset;
    return {...field(game,x,z,scope,tile),y:projectHeight((riverNear(game,x,z).waterHeight||.86)+.065,scope)};
   });
   if(last)strip(fordShoals,last[0],last[1],pts[0],pts[1]);
   last=pts;
  }
  shallowCrossings++;
 }
 // V149: wet, dark mud at the waterline that dries and fades into the surrounding land.
 const toWorld=(x,z)=>scope==='world'?{x,z}:localToWorld(tile,x,z);
 const mud=new T.Color('#5a523f'),damp=new T.Color('#6e6a4c');
 const bankMesh=buffers(banks,'#6e6a4c',{standard:true,shade:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z),t=Math.max(0,Math.min(1,(near.distance-near.width)/Math.max(.6,near.width*.4)));
  return mud.clone().lerp(damp,t).multiplyScalar(.92+.16*Math.sin(p.x*.37+Math.sin(p.z*.29)*2));
 },alpha:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z),t=Math.max(0,Math.min(1,(near.distance-near.width)/Math.max(.6,near.width*.4)));
  return Math.pow(1-t,1.6)*.80;
 }});
 const deep=new T.Color('#1d4a57'),shallowCol=new T.Color('#4f7f74'),seaCol=new T.Color('#62a6a3');
 const waterMesh=buffers(water,'#2d7584',{standard:true,opacity:.94,shade:(x,y,z)=>{
  const p=toWorld(x,z),near=riverNear(game,p.x,p.z);
  const edge=Math.min(1,near.distance/Math.max(1,near.width));
  return deep.clone().lerp(shallowCol,Math.pow(edge,2.2)*.85).lerp(seaCol,1-mouthBlend(game,p.x,p.z)).multiplyScalar(.97+.03*Math.sin(p.x*.11+p.z*.07));
 }});
 if(waterMesh){
  waterMesh.material.dispose();waterMesh.material=waterMaterial(scope,tile);animate(waterMesh);
  const pos=waterMesh.geometry.attributes.position,flow=new Float32Array(pos.count*2),shore=new Float32Array(pos.count);
  for(let i=0;i<pos.count;i++){
   const p=toWorld(pos.getX(i),pos.getZ(i)),f=riverFlow(game,p.x,p.z);
   const near=riverNear(game,p.x,p.z),speed=Math.max(.45,Math.min(1.35,1.5-(near.width||3)*.09));
   flow[i*2]=f.x*speed;flow[i*2+1]=f.z*speed;shore[i]=Math.max(0,Math.min(1,near.distance/Math.max(.5,near.width)));
  }
  waterMesh.geometry.setAttribute('aFlow',new T.BufferAttribute(flow,2));waterMesh.geometry.setAttribute('aShore',new T.BufferAttribute(shore,1));
 }
 const shallowMesh=buffers(fordShoals,'#aaa47e',{standard:false,opacity:.40});
 if(shallowMesh){shallowMesh.name='shallow walkable ford shoals';shallowMesh.renderOrder=11;group.add(shallowMesh)}
 if(bankMesh){bankMesh.name='continuous river banks';bankMesh.renderOrder=8;group.add(bankMesh)}
 if(waterMesh){waterMesh.name='continuous water surface';waterMesh.renderOrder=9;group.add(waterMesh)}
 group.userData.riverEdges=riverCount;
 group.userData.shallowFordCount=shallowCrossings;
 group.userData.riverVertexCount=water.length/3;
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
export function createUnifiedRoadNetwork(game,scope='world',tile=null,obstacles=null){
 const group=new T.Group();group.name='V67 continuous road graph';group.userData.roadNetwork=true;
 // V149: one lit ribbon per road (soft verge | bed | soft verge) with across/along UVs; the
 // surface (ruts, gravel, cobbles, flagstones) is drawn by the road shader from the road level.
 const pos=[],uv=[],lvl=[],index=[],centrelines=[];
 let roads=0,beds=0;
 for(const edge of roadNetwork(game)){
  if(!visible(tile,edge.points))continue;
  const pts=scope!=='world'&&obstacles?.length?steerAroundPlots(edge.points,tile,obstacles,detailWorldRoadWidth(edge.level)*.8+1.2):edge.points;
  if(scope!=='world'&&tile)centrelines.push(pts.map(p=>worldToLocal(tile,p.x,p.z)));
  const xs=join(pts,game,scope,tile,'road',edge.level);
  let along=0,base=pos.length/3;
  for(let i=0;i<xs.length;i++){
   if(i){const p=pts[i],q=pts[i-1];along+=Math.hypot(p.x-q.x,p.z-q.z);}
   const x=xs[i];
   for(const [v,u] of [[x.ol,-1.5],[x.l,-1],[x.r,1],[x.or,1.5]]){pos.push(v.x,v.y,v.z);uv.push(u,along);lvl.push(edge.level)}
   if(i){const r0=base+(i-1)*4,r1=base+i*4;for(let k=0;k<3;k++)index.push(r0+k,r0+k+1,r1+k,r1+k,r0+k+1,r1+k+1);beds+=2}
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
 group.traverse(o=>{if(!o.geometry?.userData.sharedLandscape)o.geometry?.dispose();if(o.material&&!Array.isArray(o.material)&&!o.material.userData.sharedLandscape)o.material.dispose()});
}
