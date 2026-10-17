// V49 articulated, hand-profiled quadrilateral character meshes.
// The same source quad data is exported as GLB and used directly here, without GLTF network fetches.
import * as T from './vendor/three.module.js';
import {PEOPLE_MESHES} from './models-v49/mesh-data.js';
const geometryCache=new Map();
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:0,side:T.DoubleSide});
export const PERSON_RIG_PIVOTS={head:[0,1.32,0],leftArm:[-.265,1.16,0],rightArm:[.265,1.16,0],leftLeg:[-.135,.77,0],rightLeg:[.135,.77,0]};
export const V49_PEOPLE=Object.freeze(Object.keys(PEOPLE_MESHES));
export function characterGeometry(archetype,section){
 const key=archetype+':'+section;
 if(geometryCache.has(key))return geometryCache.get(key);
 const parts=PEOPLE_MESHES[archetype]?.[section];if(!parts)throw Error('Unknown character mesh: '+key);
 const verts=[],indices=[],colors=[];let offset=0;
 for(const p of parts){
  const c=new T.Color(p.c);
  for(const v of p.v){verts.push(...v);colors.push(c.r,c.g,c.b)}
  for(const [a,b,d,e] of p.q){
   if(a!==b&&b!==d&&d!==a)indices.push(offset+a,offset+b,offset+d);
   if(a!==d&&d!==e&&e!==a)indices.push(offset+a,offset+d,offset+e);
  }
  offset+=p.v.length;
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();geo.userData.shared=true;geo.userData.archetype=archetype;geo.userData.section=section;
 geometryCache.set(key,geo);return geo;
}
export function createV49CharacterRig(root,archetype='villager'){
 if(!PEOPLE_MESHES[archetype])archetype='villager';
 const body=new T.Group();root.add(body);
 const sections={};
 for(const section of ['body','head','leftArm','rightArm','leftLeg','rightLeg']){
  const pivot=new T.Group(),coords=PERSON_RIG_PIVOTS[section]||[0,0,0];pivot.position.set(...coords);
  const mesh=new T.Mesh(characterGeometry(archetype,section),material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.isV49Human=true;
  pivot.add(mesh);body.add(pivot);sections[section]=pivot;
 }
 const rig={body,head:sections.head,legs:[sections.leftLeg,sections.rightLeg],arms:[sections.leftArm,sections.rightArm],archetype};
 body.userData.v49Rig=rig;return rig;
}
export function characterQuadCount(archetype){return Object.values(PEOPLE_MESHES[archetype]||{}).reduce((total,parts)=>total+parts.reduce((n,p)=>n+p.q.length,0),0)}
