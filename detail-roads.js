import {detailTrailWidth} from './road-width-v89.js';
import {buildingClearance} from './navigation.js?v=1754a';
// V59: Shared terrain-following road ribbons on detail maps.
// World edges are projected through the local walkable navigation mesh;
// local footpaths connect adjacent cells that have accumulated enough traffic.
import * as T from './vendor/three.module.js';
import {trailMaterial} from './landscape-v149.js?v=162a';
import {COLS,ROWS} from './campaign.js';
import {roadLevel,roadStrength} from './roads.js?v=59';
import {roadCurve,worldToDetail,segmentTouchesTile} from './landscape-shared.js?v=123a';

const COLORS=['#000000','#b09a73','#bea982','#9e9585','#8f9291'];
// V149: ribbons carry an across coordinate (uv.x -1..1) so the trail shader can soften the
// edges and add trodden-earth grain; the visible path width matches the previous hard band.
function appendRibbon(vertices,colors,a,b,width,color,height,uvs=null){
 const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
 if(length<.01)return;
 const w=width*(uvs?1.3:1),nx=-dz/length*w*.5,nz=dx/length*w*.5;
 // extend each segment slightly so neighbouring links overlap into one continuous path
 const ex=uvs?dx/length*w*.25:0,ez=uvs?dz/length*w*.25:0;
 const A={x:a.x-ex,z:a.z-ez},B={x:b.x+ex,z:b.z+ez};
 const points=[
  [A.x+nx,A.z+nz,-1],[B.x+nx,B.z+nz,-1],[B.x-nx,B.z-nz,1],
  [A.x+nx,A.z+nz,-1],[B.x-nx,B.z-nz,1],[A.x-nx,A.z-nz,1]
 ];
 for(const [x,z,u] of points){vertices.push(x,height(x,z)+.3,z);colors.push(color.r,color.g,color.b);if(uvs)uvs.push(u,0)}
}
function roadMesh(vertices,colors,uvs=null){
 const group=new T.Group();
 if(!vertices.length)return group;
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 if(uvs){geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();}
 geo.computeBoundingSphere();
 const mesh=new T.Mesh(geo,uvs?trailMaterial(false):new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.86,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3}));
 mesh.renderOrder=8;
 group.add(mesh);
 return group;
}
// V175.4: never render a world's trade/army road straight through a solid
// palisade. Follow the local walkable navigation (prefer worn footpaths) to
// the gate if the direct ribbon would cross a wall; otherwise stop drawing.
export function navigableWorldRoadV1754(nav,a,b){
 if(nav.open(a.x,a.z)&&nav.open(b.x,b.z)&&nav.clear(a,b))return [a,b];
 const from=nav.nearest(a,8),to=nav.nearest(b,8);
 if(!from||!to)return [];
 const path=nav.route(from,to,{preferRoads:true});
 if(!path||!path.length)return [];
 const result=[from,...path],direct=Math.hypot(a.x-b.x,a.z-b.z);
 const length=result.slice(1).reduce((n,p,i)=>
  n+Math.hypot(p.x-result[i].x,p.z-result[i].z),0);
 if(length>Math.max(22,direct*4+8))return [];
 return result.every((p,i)=>i===0||nav.clear(result[i-1],p))?result:[];
}
export function createDetailWorldRoads(game,tile,nav,height){
 const vertices=[],colors=[];
 // Never disclose roads on the opposite side of the fog of war.
 if(!game.seen(0,tile))return roadMesh(vertices,colors);
 for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const other={c:tile.c+dc,r:tile.r+dr};
  if(other.c<0||other.r<0||other.c>=COLS||other.r>=ROWS||!game.seen(0,other))continue;
  const level=roadLevel(roadStrength(game.s,tile,other,game.s.time));
  if(!level)continue;
  // Match the atlas road exactly. Road centerlines are derived from the
  // same world tile centers and bend; no independent local path generation.
  const points=roadCurve(game,tile,other,12),color=new T.Color(COLORS[level]);
  const width=1.8+level*1.1;
  for(let i=1;i<points.length;i++){
   if(!segmentTouchesTile(tile,points[i-1],points[i],0))continue;
   const p=worldToDetail(tile,points[i-1].x,points[i-1].z);
   const q=worldToDetail(tile,points[i].x,points[i].z);
   const safe=navigableWorldRoadV1754(nav,p,q);
   for(let j=1;j<safe.length;j++)
    appendRibbon(vertices,colors,safe[j-1],safe[j],width,color,height);
  }
 }
 return roadMesh(vertices,colors);
}
// V173 3.2b: the road mesh is wider than its navigable centreline.
// Keep its *actual corner vertices* outside the collision envelopes of huts,
// workshops and fishing platforms. Never erase traffic heat as a visual fix.
function clearRibbonWidth(a,b,width,blockers){
 const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
 if(len<.01)return 0;
 const near=blockers.filter(o=>
  Math.min(a.x,b.x)<=o.b.x+o.f.rx+3&&Math.max(a.x,b.x)>=o.b.x-o.f.rx-3&&
  Math.min(a.z,b.z)<=o.b.z+o.f.rz+3&&Math.max(a.z,b.z)>=o.b.z-o.f.rz-3);
 if(!near.length)return width;
 const nx=-dz/len,nz=dx/len;
 for(const factor of [1,.8,.6,.4,.25]){
  const w=width*factor*1.3,ex=dx/len*w*.25,ez=dz/len*w*.25;
  const corners=[
   {x:a.x-ex+nx*w*.5,z:a.z-ez+nz*w*.5},
   {x:a.x-ex-nx*w*.5,z:a.z-ez-nz*w*.5},
   {x:b.x+ex+nx*w*.5,z:b.z+ez+nz*w*.5},
   {x:b.x+ex-nx*w*.5,z:b.z+ez-nz*w*.5}
  ];
  if(corners.every(p=>near.every(o=>
    Math.abs(p.x-o.b.x)>=o.f.rx-.6||Math.abs(p.z-o.b.z)>=o.f.rz-.6)))return width*factor;
 }
 return 0;
}
export function createDetailTrailLinks(spots,nav,height){
 const vertices=[],colors=[],uvs=[];
 // Treat a real gate as two physical posts, not one solid building.
 // Traffic already knows where the clear central doorway is; its visible
 // ribbon must be permitted between those posts but never through them.
 const blockers=(nav.buildings?.()||[]).filter(b=>b.hp>0&&!b.virtual).flatMap(b=>{
  if(b.type==='woodgate'||b.type==='gatehouse'){
   const wide=b.type==='woodgate'&&b.extendedPalisadeV166,
    offset=wide?5.2:2.55,post=wide?1.6:2.2;
   return [-1,1].map(sign=>b.wallAxis?
    {b:{x:b.x,z:b.z+sign*offset},f:{rx:.95,rz:post}}:
    {b:{x:b.x+sign*offset,z:b.z},f:{rx:post,rz:.95}});
  }
  return [{b,f:buildingClearance(b)}];
 }).filter(o=>o.f);
 // Do not paint legacy traffic that lies beneath newly sized building footprints.
 const levels=new Map(spots.map(({key})=>[key,nav.roadLevel(key)])
  .filter(([key,level])=>level>0&&nav.open(nav.point(key).x,nav.point(key).z)));
 for(const [key,level] of levels){
  const a=nav.point(key);
  for(const [dx,dz] of [[1,0],[0,1],[1,1],[-1,1]]){
   const x=a.x+dx,z=a.z+dz;
   if(nav.index(x,z)<0)continue;
   const other=nav.index(x,z),otherLevel=levels.get(other);
   if(!otherLevel||!nav.clear(a,{x,z}))continue;
   const useLevel=Math.min(level,otherLevel);
   // Leave room beside the building walls and exterior props.
   const width=clearRibbonWidth(a,{x,z},detailTrailWidth(useLevel),blockers);
   if(width<=0)continue;
   appendRibbon(vertices,colors,a,{x,z},width,new T.Color(COLORS[useLevel]),height,uvs);
  }
 }
 return roadMesh(vertices,colors,uvs);
}
