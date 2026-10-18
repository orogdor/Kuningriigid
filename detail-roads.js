// V59: Shared terrain-following road ribbons on detail maps.
// World edges are projected through the local walkable navigation mesh;
// local footpaths connect adjacent cells that have accumulated enough traffic.
import * as T from './vendor/three.module.js';
import {COLS,ROWS} from './campaign.js';
import {roadLevel,roadStrength} from './roads.js';

const COLORS=['#000000','#b09a73','#bea982','#9e9585','#8f9291'];
function appendRibbon(vertices,colors,a,b,width,color,height){
 const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
 if(length<.01)return;
 const nx=-dz/length*width*.5,nz=dx/length*width*.5;
 const points=[
  [a.x+nx,a.z+nz],[b.x+nx,b.z+nz],[b.x-nx,b.z-nz],
  [a.x+nx,a.z+nz],[b.x-nx,b.z-nz],[a.x-nx,a.z-nz]
 ];
 for(const [x,z] of points){vertices.push(x,height(x,z)+.3,z);colors.push(color.r,color.g,color.b)}
}
function roadMesh(vertices,colors){
 const group=new T.Group();
 if(!vertices.length)return group;
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geo.computeBoundingSphere();
 const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.86,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3}));
 mesh.renderOrder=8;
 group.add(mesh);
 return group;
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
  const start=nav.nearest({x:0,z:0},35),end=nav.nearest({x:dc*69,z:dr*59},14);
  if(!start||!end)continue;
  const path=nav.route(start,end);
  if(!path?.length)continue;
  const color=new T.Color(COLORS[level]),width=1.8+level*1.1;
  for(let i=1;i<path.length;i++)appendRibbon(vertices,colors,path[i-1],path[i],width,color,height);
 }
 return roadMesh(vertices,colors);
}
export function createDetailTrailLinks(spots,nav,height){
 const vertices=[],colors=[];
 const levels=new Map(spots.map(({key})=>[key,nav.roadLevel(key)]).filter(([,level])=>level>0));
 for(const [key,level] of levels){
  const a={x:key%145-72,z:Math.floor(key/145)-62};
  for(const [dx,dz] of [[1,0],[0,1],[1,1],[-1,1]]){
   const x=a.x+dx,z=a.z+dz;
   if(x< -72||x>72||z< -62||z>62)continue;
   const other=nav.index(x,z),otherLevel=levels.get(other);
   if(!otherLevel)continue;
   const useLevel=Math.min(level,otherLevel);
   const width=1.1+useLevel*.65;
   appendRibbon(vertices,colors,a,{x,z},width,new T.Color(COLORS[useLevel]),height);
  }
 }
 return roadMesh(vertices,colors);
}
