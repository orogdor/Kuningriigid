import {detailWorldRoadWidth} from './road-width-v89.js';
// V67: one topology for each river system and each road network. The atlas
// and detailed view are different projections of exactly the same vertices,
// NEVER independently drawn rectangular per-tile water/road chunks.
import * as T from './vendor/three.module.js';
import {landscapeMaterial} from './landscape-material-v85.js?v=85a';
import {createCrossingNetwork} from './landscape-polish-v84.js?v=85a';
import {riverNear,localToWorld} from './continuous-landscape.js?v=123a';
import {getRivers,roadNetwork,surface,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=123a';
const colors=['#000000','#bba078','#c0aa83','#aaa497','#9eacae'];
const V=(arr,p)=>arr.push(p.x,p.y,p.z);
const field=(game,x,z,view,tile)=>view==='world'?{x,z}:{...worldToLocal(tile,x,z)};
const elev=(game,x,z,view)=>surface(game,x,z,view);
const pos=(game,x,z,y,view,tile)=>({...field(game,x,z,view,tile),y:projectHeight(y,view)});
function join(pts,game,scope,tile,kind,level=1){
 const isRiver=kind==='river',wBase=isRiver?0:[0,4.4,5.5,7.4,9.4][level],out=[];
 for(let i=0;i<pts.length;i++){
  const p=pts[i],before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
  const tX=after.x-before.x,tZ=after.z-before.z,d=Math.hypot(tX,tZ)||1;
  const nx=-tZ/d,nz=tX/d,width=isRiver?p.width:scope==='detail'?detailWorldRoadWidth(level)/2/Math.hypot(nx*3,nz*2.6):wBase;
  const left={x:p.x+nx*width,z:p.z+nz*width},right={x:p.x-nx*width,z:p.z-nz*width};
  const outer=isRiver?width+Math.max(1.4,width*.32)*(1+.24*Math.sin(p.x*.17+p.z*.13)):width*1.23;
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
function buffers(vertices,color,{standard=false,opacity=1,shade=null}={}){
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
 const tint=new T.Color(color),vertexColors=new Float32Array(unique.length);
 for(let i=0;i<vertexColors.length;i+=3){const c=shade?shade(unique[i],unique[i+1],unique[i+2]):tint;vertexColors[i]=c.r;vertexColors[i+1]=c.g;vertexColors[i+2]=c.b}
 geo.setAttribute('color',new T.Float32BufferAttribute(vertexColors,3));
 const mat=standard?new T.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.10,transparent:opacity!==1,opacity,side:T.DoubleSide,depthWrite:opacity===1}):new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:opacity!==1,opacity,depthWrite:opacity===1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 return new T.Mesh(geo,mat);
}
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
  const p={x,z,d:distance-w,outer:distance-w*1.40,shore:1.12-game.atlasHeight(x,z),width:w};nodes.set(key,p);return p;
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
   const y=isWater?riverNear(game,p.x,p.z).waterHeight||.86:surface(game,p.x,p.z)+.10;
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
 const bankMesh=buffers(banks,'#b2a68a',{standard:true}),waterMesh=buffers(water,'#2d7584',{standard:true,opacity:.94,shade:(x,y,z)=>{
  const p=scope==='world'?{x,z}:localToWorld(tile,x,z),near=riverNear(game,p.x,p.z);
  const shallow=Math.min(1,near.distance/Math.max(1,near.width));
  return new T.Color('#245d73').lerp(new T.Color('#76b6ae'),Math.pow(shallow,2)*.68).multiplyScalar(.96+.04*Math.sin(p.x*.11+p.z*.07));
 }});
 if(waterMesh){waterMesh.material.dispose();waterMesh.material=landscapeMaterial('water',scope,tile);}
 const shallowMesh=buffers(fordShoals,'#aaa47e',{standard:false,opacity:.40});
 if(shallowMesh){shallowMesh.name='shallow walkable ford shoals';shallowMesh.renderOrder=11;group.add(shallowMesh)}
 if(bankMesh){bankMesh.name='continuous river banks';group.add(bankMesh)}
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
export function createUnifiedRoadNetwork(game,scope='world',tile=null){
 const group=new T.Group();group.name='V67 continuous road graph';group.userData.roadNetwork=true;
 const beds=[],verges=[],ruts=[];
 let roads=0;
 for(const edge of roadNetwork(game)){
  if(!visible(tile,edge.points))continue;
  const xs=join(edge.points,game,scope,tile,'road',edge.level);
   for(let i=1;i<xs.length;i++){
   const a=xs[i-1],b=xs[i];
   strip(beds,a.l,a.r,b.l,b.r);
   strip(verges,a.ol,a.l,b.ol,b.l);strip(verges,a.r,a.or,b.r,b.or);
  }
  roads++;
 }
 const verge=buffers(verges,'#675d4d',{opacity:.87}),road=buffers(beds,'#b7a080',{opacity:.98});
 if(verge){verge.name='continuous road verge';group.add(verge)}
 if(road){road.name='continuous road pavement';road.renderOrder=10;group.add(road)}
 group.userData.detailWidthRatio=scope==='detail'?2:null;group.userData.roadEdges=roads;group.userData.roadVertexCount=beds.length/3;
 return group;
}
export function disposeNetwork(group){
 if(!group)return;
 group.traverse(o=>{if(!o.geometry?.userData.sharedLandscape)o.geometry?.dispose();if(o.material&&!Array.isArray(o.material)&&!o.material.userData.sharedLandscape)o.material.dispose()});
}
