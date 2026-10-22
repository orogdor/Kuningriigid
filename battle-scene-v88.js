import * as T from './vendor/three.module.js';
import {BATTLEFIELD as F} from './battlefield-v88.js';
export function createBattleBoundary(height){const group=new T.Group();group.name='3x3 battle area and retreat ring';group.userData.battleBoundary=true;group.userData.landscape=true;group.userData.field={...F};
 const line=(a,b,color,opacity=1)=>{const pts=[];for(let i=0;i<=240;i++){const t=i/240,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;pts.push(new T.Vector3(x,Math.max(.35,height(x,z))+.7,z));}const l=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false}));l.renderOrder=20;group.add(l);};
 for(const [a,b]of [[{x:F.minX,z:F.minZ},{x:F.maxX,z:F.minZ}],[{x:F.maxX,z:F.minZ},{x:F.maxX,z:F.maxZ}],[{x:F.maxX,z:F.maxZ},{x:F.minX,z:F.maxZ}],[{x:F.minX,z:F.maxZ},{x:F.minX,z:F.minZ}]])line(a,b,'#ff3535');
 for(let i=1;i<F.columns;i++){line({x:F.minX+i*F.tileWidth,z:F.minZ},{x:F.minX+i*F.tileWidth,z:F.maxZ},'#e8deb4',.18);line({x:F.minX,z:F.minZ+i*F.tileDepth},{x:F.maxX,z:F.minZ+i*F.tileDepth},'#e8deb4',.18);}
 return group;
}
export function batchBattleDecoration(root){root.updateMatrixWorld(true);const groups=new Map(),inverse=root.matrixWorld.clone().invert();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.userData.terrain||Array.isArray(o.material))return;const key=o.geometry.uuid+':'+o.material.uuid,list=groups.get(key)||[];list.push(o);groups.set(key,list);});
 for(const list of groups.values()){if(list.length<4)continue;const first=list[0],mesh=new T.InstancedMesh(first.geometry,first.material,list.length);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.userData.battleDecoration=true;for(let i=0;i<list.length;i++){const o=list[i];mesh.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));o.removeFromParent();}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();root.add(mesh);}
}
