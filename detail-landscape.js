// V65: project world-map drainage, cliffs and crossings into each local tile.
// Generated from the exact same world coordinates as the atlas. Geometry is
// clipped at each tile border so adjacent city/detail maps join seamlessly.
import * as T from './vendor/three.module.js';
import {riverSegmentsNear,lineToDetail,rockSites,worldToDetail} from './landscape-shared.js?v=65c';

const clip=(a,b)=>{
 let u0=0,u1=1;const dx=b.x-a.x,dz=b.z-a.z;
 for(const [p,q] of [[-dx,a.x+75],[dx,75-a.x],[-dz,a.z+65],[dz,65-a.z]]){
  if(Math.abs(p)<1e-9){if(q<0)return null;continue}
  const t=q/p;
  if(p<0)u0=Math.max(u0,t);else u1=Math.min(u1,t);
  if(u0>u1)return null;
 }
 const point=t=>({x:a.x+dx*t,z:a.z+dz*t,width:a.width+(b.width-a.width)*t});
 return [point(u0),point(u1)];
};
export function createDetailLandscape(game,tile,height){
 const group=new T.Group();group.name='V65 shared landscape';group.userData.landscape=true;
 const rivers=[],banks=[],passages=[];
 for(const source of riverSegmentsNear(game,tile)){
  const pts=lineToDetail(tile,source.points);
  for(let i=1;i<pts.length;i++){
   const part=clip(pts[i-1],pts[i]);if(!part)continue;
   const [a,b]=part,dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
   // Width is measured in atlas metres then projected into local dimensions.
   const nx=-dz/len,nz=dx/len;
   const edge=(p,side)=>{
    const w=Math.min(19,p.width*2.35),x=p.x+nx*side*w,z=p.z+nz*side*w;
    return [x,height(x,z)+.19,z];
   };
   const l=edge(a,1),r=edge(a,-1),ll=edge(b,1),rr=edge(b,-1);
   rivers.push(...l,...r,...ll,...ll,...r,...rr);
   banks.push(...l,...ll,...r,...rr);
  }
  const cell=source.cell;
  if(cell.bridge||cell.ford){
   const start=worldToDetail(tile,cell.x,cell.z);
   if(Math.abs(start.x)<75&&Math.abs(start.z)<65)passages.push({p:start,cell,pts});
  }
 }
 if(rivers.length){
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(rivers,3));
  const water=new T.Mesh(geometry,new T.MeshBasicMaterial({color:'#488da5',transparent:true,opacity:.92,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));
  water.renderOrder=5;group.add(water);
 }
 if(banks.length){
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(banks,3));
  const shore=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#c5d9bb',transparent:true,opacity:.78}));
  shore.renderOrder=6;group.add(shore);
 }
 for(const {p,cell,pts} of passages){
  const a=pts[0],b=pts[1]||a;
  const m=new T.Mesh(new T.PlaneGeometry(cell.bridge?12:6,cell.bridge?22:12),new T.MeshBasicMaterial({color:cell.bridge?'#aa8965':'#c7c19f',side:T.DoubleSide,transparent:true,opacity:cell.bridge?.91:.63,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.rotation.z=Math.atan2(b.z-a.z,b.x-a.x);m.position.set(p.x,height(p.x,p.z)+.32,p.z);m.renderOrder=7;group.add(m);
 }
 const sites=rockSites(game,tile);
 if(sites.length){
  const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#878d88',roughness:1,flatShading:true}),sites.length),dummy=new T.Object3D();
  sites.forEach((site,i)=>{
   const p=worldToDetail(tile,site.x,site.z),size=Math.max(2,site.size*.47);
   dummy.position.set(p.x,height(p.x,p.z)+size*.34,p.z);
   dummy.scale.set(size*1.25,size*.93,size);
   dummy.rotation.y=site.angle;dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
   rocks.setColorAt(i,new T.Color(site.snow?'#b9c3c0':i%2?'#717a78':'#8a8d85'));
  });
  rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=false;rocks.receiveShadow=true;group.add(rocks);
 }
 group.userData.riverVertexCount=rivers.length/3;
 group.userData.rockCount=sites.length;
 return group;
}
