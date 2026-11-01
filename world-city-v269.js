// V269: Stone Age towns on the world map have the same layout as on the detail map: every building of
// the city is drawn at its real place and rotation with a very low-poly copy of its detail model
// (models-world-v269/, ~350-600 triangles, vertex colours, no textures; tools/world-lod-v269-blender.py).
// One InstancedMesh per building type and city keeps the draw calls low.
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';
import {STONE_SIZES} from './stone-sizes-v224.js';

const FILES=['peamaja','house','lumber','quarry','farm','well','hunter','fisher','pasture','mason','barracks','archery','claypit','pottery_kiln','study','watchtower','palisade','woodgate'];
// building type -> model; types without their own model borrow the closest one
const MODEL={hall:'peamaja',house:'house',lumber:'lumber',forester:'lumber',saw:'lumber',quarry:'quarry',farm:'farm',well:'well',hunter:'hunter',fisher:'fisher',
 pasture:'pasture',mason:'mason',barracks:'barracks',archery:'archery',claypit:'claypit',pottery_kiln:'pottery_kiln',study:'study',watchtower:'watchtower',
 palisade:'palisade',woodgate:'woodgate',stonewall:'palisade',stonetower:'watchtower',cellar:'house',storage:'house',warehouse:'house',mill:'farm',bakery:'house',
 coppermine:'quarry',tinmine:'quarry',bronze_foundry:'pottery_kiln',road_depot:'lumber'};
// footprint size (detail units) for types missing from STONE_SIZES
const EXTRA_SIZE={pasture:9,mason:8,claypit:7,pottery_kiln:6,watchtower:4,palisade:7,woodgate:6,stonewall:7,stonetower:5,cellar:5,storage:7,warehouse:8,mill:7,bakery:6,coppermine:8,tinmine:8,bronze_foundry:7,forester:7,saw:7,road_depot:7};
const EXAGGERATE=4.5; // 1:1 with the detail map relative to the tile (same factor as SPREAD)
const SPREAD=4.5;     // the layout is spread by the same uniform factor, so the town keeps its detail-map shape
const SKIP=new Set(['field','road','bridge']);

let assets=null,loading=null;
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0,flatShading:true,side:T.DoubleSide});
export function loadWorldCityModelsV269(){
 if(loading)return loading;
 loading=Promise.all(FILES.map(async n=>{
  const data=await loadGLB(new URL('./models-world-v269/'+n+'.glb',import.meta.url));
  const g=data.primitives[0].geometry;if(!g.getAttribute('normal'))g.computeVertexNormals();
  g.computeBoundingBox();const b=g.boundingBox,c=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3());
  g.translate(-c.x,-b.min.y,-c.z);const k=1/Math.max(size.x,size.z,1e-6);g.scale(k,k,k); // unit footprint, base on y=0
  g.userData.shared=true;return [n,g];
 })).then(list=>{assets=new Map(list);return true;}).catch(e=>{console.warn('V269 world city models',e);loading=null;return false;});
 return loading;
}
export const worldCityModelsReadyV269=()=>!!assets;
const footprint=t=>(STONE_SIZES[t]?.size??EXTRA_SIZE[t]??6);
export function worldCityStampV269(buildings){
 let s='';for(const b of buildings){if(SKIP.has(b.type)||b.hp<=0||b.virtual)continue;s+=b.type[0]+(b.ready?1:0)+Math.round(b.x)+','+Math.round(b.z)+';';}return s;
}
// buildings: detail-map buildings of the city (x,z relative to the tile centre); height(dx,dz): ground offset
export function createWorldCityV269(buildings,height=()=>0){
 if(!assets)return null;
 const byModel=new Map();
 for(const b of buildings){
  if(SKIP.has(b.type)||b.hp<=0||b.virtual)continue;
  const name=MODEL[b.type]||'house';(byModel.get(name)||byModel.set(name,[]).get(name)).push(b);
 }
 const group=new T.Group();group.name='V269 world city';group.userData.worldCityV269=true;
 const m=new T.Matrix4(),q=new T.Quaternion(),pos=new T.Vector3(),scl=new T.Vector3(),up=new T.Vector3(0,1,0);
 for(const [name,list] of byModel){
  const mesh=new T.InstancedMesh(assets.get(name),material,list.length);mesh.castShadow=true;mesh.receiveShadow=true;
  list.forEach((b,i)=>{
   const x=b.x/DETAIL_X*SPREAD,z=b.z/DETAIL_Z*SPREAD,size=footprint(b.type)/DETAIL_X*EXAGGERATE*(b.ready?1:.75);
   const rot=b.buildingRotationV228??b.wallAngleV175??b.shoreAngle??0;
   pos.set(x,height(x,z),z);q.setFromAxisAngle(up,rot);scl.set(size,size*(b.ready?1:.5),size);
   mesh.setMatrixAt(i,m.compose(pos,q,scl));
  });
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
 }
 return group;
}

// Hide world-map trees, shrubs and rocks that stand inside the town's buildings.
// root: the world scene; spots: [{x,z,r}] in world coordinates. Returns the number of hidden instances.
const ZERO=new T.Matrix4().makeScale(0,0,0);
export function clearNatureUnderTownV269(root,spots){
 if(!spots.length)return 0;let hidden=0;const m=new T.Matrix4(),p=new T.Vector3();
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const s of spots){minX=Math.min(minX,s.x-s.r);maxX=Math.max(maxX,s.x+s.r);minZ=Math.min(minZ,s.z-s.r);maxZ=Math.max(maxZ,s.z+s.r);}
 root.traverse(o=>{
  if(!o.isInstancedMesh||!(o.userData.v152Model||/^(world |atlas1000_(forest|rock))/.test(o.name||'')))return;
  o.updateMatrixWorld();let changed=false;
  for(let i=0;i<o.count;i++){
   o.getMatrixAt(i,m);p.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld);
   if(p.x<minX||p.x>maxX||p.z<minZ||p.z>maxZ)continue;
   if(spots.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<s.r)){o.setMatrixAt(i,ZERO);changed=true;hidden++;}
  }
  if(changed){o.instanceMatrix.needsUpdate=true;o.boundingSphere=null;}
 });
 return hidden;
}
// world-space footprints of a town's buildings (same placement as createWorldCityV269)
export function townSpotsV269(buildings,origin){
 const out=[];for(const b of buildings){if(SKIP.has(b.type)||b.hp<=0||b.virtual)continue;
  out.push({x:origin.x+b.x/DETAIL_X*SPREAD,z:origin.z+b.z/DETAIL_Z*SPREAD,r:footprint(b.type)/DETAIL_X*EXAGGERATE*.62});}
 return out;
}
