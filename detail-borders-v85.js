import * as T from './vendor/three.module.js';
import {surface,worldToLocal,projectHeight} from './continuous-landscape.js?v=123a';
const colors=['#65d6d0','#ed8f70','#bba1ef','#eed474'];
// Only the outer perimeter of each city; district seams stay unmarked.
export function createDetailBorders(game,tile){
 const group=new T.Group();group.name='city territory borders';group.userData.landscape=true;
 game.refreshTerritory();const byTeam=new Map();
 const owner=p=>game.territory.get(p.c+':'+p.r);
 for(const cell of game.cells){
  if(Math.abs(cell.x-tile.x)>165||Math.abs(cell.z-tile.z)>165||!game.seen(0,cell))continue;
  const city=owner(cell);if(!city)continue;
  for(const [dc,dr,dx,dz]of [[-1,0,-25,-25],[1,0,25,-25],[0,-1,-25,-25],[0,1,-25,25]]){
   const other=owner({c:cell.c+dc,r:cell.r+dr});if(other?.id===city.id)continue;
   // Avoid duplicate opposing borders, while retaining the visible city's edge.
   if(other&&other.id<city.id&&game.seen(0,{c:cell.c+dc,r:cell.r+dr}))continue;
   const vertices=byTeam.get(city.team)||[];byTeam.set(city.team,vertices);
   const x=cell.x+dx,z=cell.z+dz,vx=dc===0?50:0,vz=dr===0?50:0;
   for(let i=0;i<50;i++){
    const t0=i/50,t1=(i+1)/50,half=.30;
    const pt=(t,side)=>{const X=x+vx*t+(dc?half*side:0),Z=z+vz*t+(dr?half*side:0),p=worldToLocal(tile,X,Z);return [p.x,projectHeight(Math.max(.95,surface(game,X,Z))+.55,'detail'),p.z]};
    const a=pt(t0,-1),b=pt(t0,1),c=pt(t1,-1),d=pt(t1,1);vertices.push(...a,...c,...b,...b,...c,...d);
   }
  }
 }
 for(const [team,vertices]of byTeam){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const mat=new T.MeshBasicMaterial({color:colors[team%4],side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});const mesh=new T.Mesh(geo,mat);mesh.name='territory team '+team;mesh.renderOrder=12;group.add(mesh)}
 group.userData.borderTeams=byTeam.size;return group;
}
