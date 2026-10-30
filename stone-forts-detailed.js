// Detailed Stone Age fortifications. Existing collision, wall spans and damage stages remain authoritative.
import * as T from './vendor/three.module.js';
import {withStoneBuildingLOD} from './stone-near-lod.js?v=224';
const TYPES=new Set(['palisade','woodgate','watchtower']);
let openGateGeometry=null,wallSideGeometries=null;
function openGate(source){
 if(openGateGeometry)return openGateGeometry;
 const g=source.clone();g.computeBoundingBox();const b=g.boundingBox,size=b.getSize(new T.Vector3());
 const pos=g.getAttribute('position'),idx=g.index,keep=[];
 const half=size.x*.255,top=b.min.y+size.y*.78;
 for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),c=idx.getX(i+1),d=idx.getX(i+2);
  const x=(pos.getX(a)+pos.getX(c)+pos.getX(d))/3,y=(pos.getY(a)+pos.getY(c)+pos.getY(d))/3;
  if(y<top&&(Math.abs(x)<half||Math.abs(x)>size.x*.29))continue;keep.push(a,c,d);
 }
 g.setIndex(new T.BufferAttribute(new Uint32Array(keep),1));g.computeBoundingSphere();openGateGeometry=g;return g;
}
function wallSides(source){
 if(wallSideGeometries)return wallSideGeometries;
 const p=source.getAttribute('position'),idx=source.index,groups=[[],[]];source.computeBoundingBox();
 const size=source.boundingBox.getSize(new T.Vector3()),cut=size.x*.27;
 for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2),x=(p.getX(a)+p.getX(b)+p.getX(c))/3;
  if(x<-cut)groups[0].push(a,b,c);else if(x>cut)groups[1].push(a,b,c);
 }
 wallSideGeometries=groups.map(values=>{const g=new T.BufferGeometry();for(const name of Object.keys(source.attributes))g.setAttribute(name,source.getAttribute(name));g.setIndex(new T.BufferAttribute(new Uint32Array(values),1));g.computeBoundingBox();g.computeBoundingSphere();return g;});
 return wallSideGeometries;
}
export function stoneFortLOD(low,type,age,stage=0,tier=1,seed=0){
 if(!low||age!==0||stage||tier!==1||!TYPES.has(type))return low;
 low.updateMatrixWorld(true);const size=new T.Box3().setFromObject(low).getSize(new T.Vector3());
 const width=(type==='palisade'||type==='woodgate')?7.0:Math.max(size.x,size.z);
 const root=withStoneBuildingLOD(low,type,width,seed),build=root.build;
 root.build=async()=>{const mesh=await build();
  if(type==='woodgate'){
   mesh.geometry=openGate(mesh.geometry);
   const wall=await withStoneBuildingLOD(low,'palisade',7,seed).build();
   mesh.scale.y=wall.scale.y;
   for(const sideGeometry of wallSides(wall.geometry)){
    const side=new T.Mesh(sideGeometry,wall.material);side.scale.set(wall.scale.x/mesh.scale.x,wall.scale.y/mesh.scale.y,wall.scale.z/mesh.scale.z);side.castShadow=true;side.receiveShadow=true;mesh.add(side);
   }
  }
  if(type==='watchtower'){mesh.geometry.computeBoundingBox();const h=mesh.geometry.boundingBox.getSize(new T.Vector3()).y;if(h>0&&size.y>0)mesh.scale.y=size.y/h;}
  return mesh;
 };
 root.userData.stoneFortDetailed=type;return root;
}
