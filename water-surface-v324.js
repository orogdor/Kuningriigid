// One clipped surface for ocean, tidal channel and river. No overlapping
// transparent ribbons at the outlet and no per-tile coastline masks.
import * as T from './vendor/three.module.js';
import {baseHeight,riverNear,visibleRiverHeight,visualElevation,estuaryAtV324} from './continuous-landscape.js';
import {SEA_LEVEL_V324} from './estuary-v324.js';
import {seaMaterial} from './sea-v158.js';
import {ORIGIN_X,ORIGIN_Z,WORLD_WIDTH,WORLD_DEPTH} from './campaign.js';
import {DETAIL_X,DETAIL_Z,DETAIL_Y} from './detail-scale-v123.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function waterSampleV324(game,x,z){
 const natural=baseHeight(game,x,z),near=riverNear(game,x,z),estuary=estuaryAtV324(game,x,z);
 const blend=estuary?.influence||0;
 const width=near.width+(estuary?estuary.width-near.width:0)*blend;
 const distance=near.distance+(estuary?estuary.distance-near.distance:0)*blend;
 const oceanDepth=SEA_LEVEL_V324-natural;
 const channel=Number.isFinite(distance)?width-distance:-100;
 const riverLevel=visibleRiverHeight(game,x,z,near.waterHeight);
 // Ocean pixels stay exactly on sea level. The tidal channel has already
 // settled to this level before the natural coastline is crossed.
 const sea=smooth(oceanDepth/1.2),level=riverLevel+(SEA_LEVEL_V324-riverLevel)*sea;
 const wet=Math.max(oceanDepth,channel),ground=visualElevation(game,x,z);
 const river=(1-sea)*(1-(estuary?.seaMix||0)*blend);
 return {x,z,y:oceanDepth>=1.2?SEA_LEVEL_V324:level,wet,
  depth:Math.max(.015,level-ground),river};
}
export function* unifiedWaterStepsV324(game,{tile=null,halfX=112.5,halfZ=97.5,segments=80,
 minX=ORIGIN_X,maxX=ORIGIN_X+WORLD_WIDTH,minZ=ORIGIN_Z,maxZ=ORIGIN_Z+WORLD_DEPTH,worldStep=25}={}){
 const detail=!!tile,sx=detail?DETAIL_X:1,sz=detail?DETAIL_Z:1;
 if(detail){minX=tile.x-halfX/sx;maxX=tile.x+halfX/sx;minZ=tile.z-halfZ/sz;maxZ=tile.z+halfZ/sz;}
 const nx=detail?segments:Math.ceil((maxX-minX)/worldStep),nz=detail?segments:Math.ceil((maxZ-minZ)/worldStep);
 const dx=(maxX-minX)/nx,dz=(maxZ-minZ)/nz;
 const vertices=[],depths=[],rivers=[],indices=[],lookup=new Map();
 const emit=p=>{
  const key=p.x.toFixed(6)+','+p.z.toFixed(6);let i=lookup.get(key);if(i!==undefined)return i;
  i=depths.length;lookup.set(key,i);
  vertices.push(detail?(p.x-tile.x)*sx:p.x,detail?(p.y-.7)*DETAIL_Y:p.y,detail?(p.z-tile.z)*sz:p.z);
  depths.push(p.depth);rivers.push(p.river);return i;
 };
 const clip=tri=>{
  const out=[];for(let i=0;i<tri.length;i++){
   const a=tri[i],b=tri[(i+1)%tri.length];if(a.wet>=0)out.push(a);
   if((a.wet>=0)!==(b.wet>=0)){
    const t=a.wet/(a.wet-b.wet),p={};for(const k of ['x','z','y','depth','river'])p[k]=a[k]+(b[k]-a[k])*t;
    // Shared linear clipping gives both triangles the identical shoreline.
    p.wet=0;out.push(p);
   }
  }return out;
 };
 const emitTriangle=tri=>{const polygon=clip(tri);if(polygon.length<3)return;
  const ids=polygon.map(emit);for(let k=1;k<ids.length-1;k++)indices.push(ids[0],ids[k],ids[k+1]);};
 const cache=new Map();
 const at=(x,z)=>{const key=x.toFixed(6)+','+z.toFixed(6);let p=cache.get(key);if(!p){p=waterSampleV324(game,x,z);cache.set(key,p);}return p;};
 function* quad(x,z,w,h,depth=0){
  const a=at(x,z),b=at(x+w,z),c=at(x,z+h),d=at(x+w,z+h);
  if(!detail){
   const cx=x+w/2,cz=z+h/2,near=riverNear(game,cx,cz),estuary=estuaryAtV324(game,cx,cz);
   const channel=near.distance<near.width+Math.hypot(w,h)*.6||(estuary&&estuary.distance<estuary.width+Math.hypot(w,h)*.6);
   const coastal=[a,b,c,d].some(p=>p.wet>=0)&&[a,b,c,d].some(p=>p.wet<0);
   if((channel&&depth<3)||(estuary&&channel&&depth<4)||(coastal&&depth<1)){
    yield* quad(x,z,w/2,h/2,depth+1);yield* quad(x+w/2,z,w/2,h/2,depth+1);
    yield* quad(x,z+h/2,w/2,h/2,depth+1);yield* quad(x+w/2,z+h/2,w/2,h/2,depth+1);return;
   }
  }
  emitTriangle([a,c,b]);emitTriangle([b,c,d]);
 }
 for(let iz=0;iz<nz;iz++){
  for(let ix=0;ix<nx;ix++){if(ix%16===0)yield;yield* quad(minX+ix*dx,minZ+iz*dz,dx,dz);}
  // Detail tiles are small; the atlas drops completed rows from the field cache.
  if(!detail&&cache.size>40000)cache.clear();yield;
 }
 if(!indices.length)return null;
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geo.setAttribute('aDepth',new T.Float32BufferAttribute(depths,1));geo.setAttribute('aRiver',new T.Float32BufferAttribute(rivers,1));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const mesh=new T.Mesh(geo,seaMaterial({scale:sx,scaleZ:sz,origin:tile||{x:0,z:0},unified:true}));
 mesh.name='V324 unified river and ocean';mesh.renderOrder=5;mesh.receiveShadow=true;
 mesh.userData.water=true;return mesh;
}
export function createUnifiedWaterV324(...args){const steps=unifiedWaterStepsV324(...args);let r;do{r=steps.next();}while(!r.done);return r.value;}
