// V354: every Stone, Bronze and Iron Age building is drawn by the house designer
// (majaehitaja/). Each model is built once; the meshes are kept in IndexedDB
// between sessions and are shared by every copy of that building. Near the
// camera the full model is drawn, further away a lighter version of the same model.
// V355: the models are built by the designer's own code as a module of the game
// (house-builder-v355.js, generated from majaehitaja/index.html), with the
// game's three.js. No hidden designer page (iframe) any more, so the buildings
// are drawn in NativeThreeBridge as well.
import * as T from './vendor/three.module.js';

// Bump when the designer export changes, so cached models are rebuilt.
const MODEL_VERSION='361a';
// Designer ids (catalog keys) in majaehitaja/index.html.
const DESIGNER_IDS=new Set(['hall','house','hunter','fisher','farm','lumber','mason','pottery_kiln','study','barracks','watchtower','archery','palisade','woodgate','quarry','claypit','well','pasture','field',
 'library','scriptorium','market','warehouse','cellar','vegetable_garden','flax_farm','weaver','cartwright','coppermine','tinmine','bronze_foundry','road_depot','harbor','bridge','forester','saw','mill','bakery','gatehouse','reinforced_wall','stonewall','stonetower',
 'academy','smith','smelter','mine','coal','stable','watermill','siegeworkshop','orchard','gem_mine','jeweler',
 'hall@1','house@1','hunter@1','fisher@1','farm@1','lumber@1','mason@1','pottery_kiln@1','barracks@1','archery@1','woodgate@1','quarry@1','claypit@1','well@1','pasture@1','field@1',
 'hall@2','house@2','hunter@2','fisher@2','farm@2','lumber@2','mason@2','pottery_kiln@2','barracks@2','archery@2','woodgate@2','quarry@2','claypit@2','well@2','pasture@2','field@2',
 'library@2','market@2','warehouse@2','cellar@2','vegetable_garden@2','flax_farm@2','weaver@2','cartwright@2','coppermine@2','tinmine@2','bronze_foundry@2','road_depot@2','harbor@2','bridge@2','forester@2','saw@2','mill@2','bakery@2','gatehouse@2','reinforced_wall@2','stonewall@2','stonetower@2']);
// The game bridge follows the river banks; roads are not buildings.
const KEEP_GAME_MODEL=new Set(['bridge','road']);
// Drawn walls: one straight piece, 7 game units long, stretched by the game.
const WALL_PIECES={palisade:tier=>tier===2?'rampart':'palisadeLine',stonewall:()=>'stoneLine',reinforced_wall:()=>'highStone'};
// Half extents of each building lot in game units (navigation.js FOOTPRINTS).
const LOT={hall:[5.6,5.0],house:[4,3.6],warehouse:[5.6,5],cellar:[5,4.4],study:[5,5],lumber:[4.8,5],quarry:[4.6,5],hunter:[4.6,5],farm:[4.8,5],well:[3.2,3.2],
 barracks:[5,5],saw:[5,5],mill:[4.8,5],bakery:[5,5],archery:[5,5],forester:[4.8,5],claypit:[4.7,4.4],pottery_kiln:[4.7,4.6],mason:[4.8,5],cartwright:[5,6],coppermine:[5,6],
 tinmine:[5,6],bronze_foundry:[5.3,6],road_depot:[5.2,5],scriptorium:[5,5],smith:[5,6],smelter:[5,6],coal:[5,6],mine:[5,6],watermill:[6,5],siegeworkshop:[5,6],
 // the game draws the market twice as large (scale 2)
 market:[5.5,5.1],pasture:[4.8,4.8],fisher:[4.9,4.6],harbor:[5.3,8.3],gatehouse:[5.4,5.1],watchtower:[4.7,4.6],stonetower:[5.2,5.0],woodgate:[3.5,2.1],
 library:[5,5],academy:[5.2,5.2],stable:[5,6],orchard:[5,5],gem_mine:[5,6],jeweler:[5,5],vegetable_garden:[5,5],flax_farm:[5,5],weaver:[5,5]};
const METRE=1/1.05; // one game unit is about 1.05 m
// Quality follows the graphics settings (read at start-up):
//  - building detail: texture resolution of the three levels and how close the
//    camera must be before furniture inside a roofed building is drawn;
//  - view distance and LOD: where the light far level starts;
//  - texture filtering: anisotropy.
const GRAPHICS=(()=>{try{return JSON.parse(localStorage.getItem('kingdoms-graphics-v226')||'{}')||{};}catch{return {};}})();
const DETAIL=['low','medium','high'].includes(GRAPHICS.buildingDetail)?GRAPHICS.buildingDetail:'high';
// texture level of [near, middle, far]
const TEXTURE_LEVELS={high:['high','medium','low'],medium:['medium','low','low'],low:['medium','low','low']}[DETAIL];
const ANISOTROPY={low:1,medium:2,high:4}[GRAPHICS.texture]??4;
// Inside a roofed building furniture, floor and hearth are drawn only this close.
const INTERIOR_DISTANCE={low:25,medium:40,high:55}[DETAIL];
// Beyond this the far level (large parts only, low textures) is drawn.
const NEAR_DISTANCE=Math.round(({near:110,medium:180,far:280,ultra:420}[GRAPHICS.viewDistance]??280)*({performance:.75,balanced:1,quality:1.4}[GRAPHICS.lod]??1));
// ?houses=old draws the earlier game models (only for comparison while testing).
const START_ENABLED=(()=>{try{return new URLSearchParams(location.search).get('houses')!=='old';}catch{return true;}})();

const state={errorListeners:new Set(),reported:false,enabled:START_ENABLED,cache:new Map(),revision:0,listeners:new Set(),loader:new T.TextureLoader(),textures:new Map(),db:null};

export function houseDesignsEnabledV354(){return state.enabled;}
// Called once with the first error (shown to the player).
export function onHouseDesignErrorV354(listener){state.errorListeners.add(listener);}
export function onHouseDesignsChangedV354(listener){state.listeners.add(listener);return ()=>state.listeners.delete(listener);}
function notify(){for(const listener of state.listeners){try{listener()}catch(error){console.warn('V354',error)}}}

// The designer building id for a game building type at a game age (0–2). When
// the designer has no version for that age, the nearest one is used.
export function designerIdV354(type,age){
 if(age==null||age<0||age>2||KEEP_GAME_MODEL.has(type))return null;
 // A plain id is that building's first era; a later era adds '@1' or '@2'.
 for(let era=age;era>=1;era--)if(DESIGNER_IDS.has(type+'@'+era))return type+'@'+era;
 if(DESIGNER_IDS.has(type))return type;
 for(let era=age+1;era<=2;era++)if(DESIGNER_IDS.has(type+'@'+era))return type+'@'+era;
 return null;
}
export function canDesignV354(type,age){return state.enabled&&Boolean(designerIdV354(type,age));}

// The builder module is large (the designer's catalog and 3D code), so it is
// loaded only when the first building is needed. Models are made one after
// another; a model that fails falls back to the older game model.
let builder=null;
function houseBuilder(){
 builder??=import('./house-builder-v355.js?v=361a').catch(error=>{builder=null;throw error;});
 return builder;
}
async function requestModel(id,design,segment){
 try{const {buildHouseModelV355}=await houseBuilder();return {model:await buildHouseModelV355({id,design,segment})};}
 catch(error){return {error:String(error?.message||error)};}
}

// ---------------------------------------------------------------- IndexedDB
function database(){
 if(state.db)return state.db;
 state.db=new Promise(resolve=>{
  try{const open=indexedDB.open('kingdoms-house-models-v354',1);
   open.onupgradeneeded=()=>open.result.createObjectStore('models');
   open.onsuccess=()=>resolve(open.result);open.onerror=()=>resolve(null);}catch{resolve(null);}
 });
 return state.db;
}
async function readCached(key){
 const db=await database();if(!db)return null;
 return new Promise(resolve=>{try{const r=db.transaction('models').objectStore('models').get(MODEL_VERSION+':'+key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}catch{resolve(null);}});
}
async function bitmapBlob(bitmap){
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(bitmap.width,bitmap.height):Object.assign(document.createElement('canvas'),{width:bitmap.width,height:bitmap.height});
 canvas.getContext('2d').drawImage(bitmap,0,0);
 return canvas.convertToBlob?canvas.convertToBlob({type:'image/webp',quality:.92}):new Promise(r=>canvas.toBlob(r,'image/webp',.92));
}
async function writeCached(key,packet){
 const db=await database();if(!db)return;
 try{
  const textures={};
  for(const [ref,entry] of Object.entries(packet.textures)){const {bitmap,...rest}=entry;textures[ref]=bitmap?{...rest,blob:await bitmapBlob(bitmap)}:rest;}
  const strip=list=>(list||[]).map(({material,positions,normals,uvs,colors,indices,cast})=>({material,positions,normals,uvs,colors,indices,cast}));
  const value={meshes:strip(packet.meshes),mid:strip(packet.mid),far:strip(packet.far),textures,collision:packet.collision,footprint:packet.footprint};
  db.transaction('models','readwrite').objectStore('models').put(value,MODEL_VERSION+':'+key);
 }catch(error){console.warn('V354 model cache',error);}
}
async function fromCache(value){
 for(const entry of Object.values(value.textures))if(entry.blob){try{entry.bitmap=await createImageBitmap(entry.blob,{imageOrientation:'none'});}catch{}delete entry.blob;}
 return value;
}

// ---------------------------------------------------------------- building
function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
const designKeys=new WeakMap();
// Saved designs are replaced, never edited in place, so the key is kept per object.
export function designKeyV354(design){
 if(!design)return null;
 let key=designKeys.get(design);
 if(!key){key='design:'+design.id+':'+hashText(JSON.stringify(design));designKeys.set(design,key);}
 return key;
}

// ---------------------------------------------------------------- textures
// Hosts may redirect big files to another origin (raw.githack → GitHub), so
// images are always requested with CORS; otherwise WebGL refuses them.
// File textures are loaded only when a building level that uses them is first
// drawn, at that level's resolution. Until then the material shows the best
// version of the same file already in memory (or plain colour).
const loaded=new Map(),loading=new Map();
const levelUrl=(url,level)=>url.replace(/\/(high|medium|low)-/,'/'+level+'-');
const RANK={low:0,medium:1,high:2};
function setupTexture(t,entry,ref){
 t.wrapS=entry.wrapS;t.wrapT=entry.wrapT;t.repeat.set(...entry.repeat);t.offset.set(...entry.offset);t.rotation=entry.rotation||0;
 if(entry.srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=ANISOTROPY;t.name='V354 '+(entry.url?entry.url.split('/textures/')[1]:ref);
 return t;
}
function fileKey(entry,level){return levelUrl(entry.url,level)+(entry.crop?'#crop':'');}
// The best already loaded version of this file, if any.
function placeholder(entry,level){
 let best=null;
 for(const l of ['high','medium','low']){if(RANK[l]>RANK[level]&&best)break;const t=loaded.get(fileKey(entry,l));if(t)best=t;}
 return best;
}
function loadFile(entry,level,ref){
 const key=fileKey(entry,level);
 if(loaded.has(key))return Promise.resolve(loaded.get(key));
 if(!loading.has(key)){
  const url=levelUrl(entry.url,level);
  const job=new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';img.onload=()=>resolve(img);img.onerror=reject;img.src=url;})
   .catch(()=>level==='medium'?null:new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=levelUrl(entry.url,'medium');}).catch(()=>null))
   .then(img=>{
    if(!img)return null;
    let t;
    if(entry.crop){ // first tile of a variation atlas
     const edge=entry.crop.edge,size=img.height-edge*2; // every atlas level has an 8 px border
     const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
     canvas.getContext('2d').drawImage(img,edge,edge,size,size,0,0,size,size);
     t=new T.CanvasTexture(canvas);t.flipY=entry.flipY;
    }else{t=new T.Texture(img);t.flipY=entry.flipY;t.needsUpdate=true;}
    setupTexture(t,entry,ref);loaded.set(key,t);return t;
   });
  loading.set(key,job);
 }
 return loading.get(key);
}
function bitmapTexture(ref,entry,cache){
 if(!cache.has(ref)){const t=new T.Texture(entry.bitmap);t.flipY=false;t.needsUpdate=true;setupTexture(t,entry,ref);cache.set(ref,t);}
 return cache.get(ref);
}
// Called on the first draw of a mesh: brings in its material's textures.
function activate(renderer,scene,camera,geometry,material){
 state.bufferHeight=renderer.domElement.height;
 const pending=material?.userData?.texturesV354;if(!pending)return;
 material.userData.texturesV354=null;
 for(const [slot,entry,level,ref] of pending){
  const now=placeholder(entry,level);if(now&&!material[slot]){material[slot]=now;material.needsUpdate=true;}
  loadFile(entry,level,ref).then(t=>{if(t&&material[slot]!==t){material[slot]=t;material.needsUpdate=true;}});
 }
}
const SLOTS=['map','normalMap','roughnessMap','bumpMap','alphaMap','emissiveMap','aoMap'];
function material(desc,packet,level,bitmaps){
 const common={color:desc.color,opacity:desc.opacity,transparent:desc.transparent,depthWrite:desc.depthWrite,side:desc.side,vertexColors:desc.vertexColors,alphaTest:desc.alphaTest};
 const m=desc.type==='MeshBasicMaterial'?new T.MeshBasicMaterial(common):
  new T.MeshStandardMaterial({...common,roughness:desc.roughness,metalness:desc.metalness,emissive:desc.emissive,emissiveIntensity:desc.emissiveIntensity});
 m.name='V354 '+(desc.name||desc.type)+' · '+level;
 const pending=[];
 for(const slot of m.isMeshBasicMaterial?['map']:SLOTS){
  const ref=desc[slot],entry=ref&&packet.textures[ref];if(!entry)continue;
  if(entry.url)pending.push([slot,entry,level,ref]);
  else if(entry.bitmap)m[slot]=bitmapTexture(ref,entry,bitmaps);
 }
 if(pending.length)m.userData.texturesV354=pending;
 if(desc.normalScale)m.normalScale?.set(...desc.normalScale);
 if(desc.bumpMap)m.bumpScale=desc.bumpScale??1;
 return m;
}
function group(parts,packet,level,bitmaps,materials,box){
 const g=new T.Group();
 for(const part of parts||[]){
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(part.positions,3));
  geometry.setAttribute('normal',new T.BufferAttribute(part.normals,3));
  geometry.setAttribute('uv',new T.BufferAttribute(part.uvs,2));
  if(part.colors)geometry.setAttribute('color',new T.BufferAttribute(part.colors,3));
  geometry.setIndex(new T.BufferAttribute(part.indices,1));
  geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.houseDesignV354=true;
  const key=level+'|'+JSON.stringify(part.material);
  if(!materials.has(key))materials.set(key,material(part.material,packet,level,bitmaps));
  const mesh=new T.Mesh(geometry,materials.get(key));
  mesh.castShadow=part.cast&&!part.material.transparent;mesh.receiveShadow=true;mesh.name='V354 '+(part.material.name||'part');
  // Low decals (contact shade, yard ground) never decide the size.
  if(box&&!part.material.transparent&&geometry.boundingBox.max.y>.06)box.union(geometry.boundingBox);
  g.add(mesh);
 }
 return g;
}
function template(packet){
 const bitmaps=new Map(),materials=new Map(),box=new T.Box3();
 const near=group(packet.meshes,packet,TEXTURE_LEVELS[0],bitmaps,materials,box);
 const mid=packet.mid?.length?group(packet.mid,packet,TEXTURE_LEVELS[1],bitmaps,materials,null):null;
 const far=packet.far?.length?group(packet.far,packet,TEXTURE_LEVELS[2],bitmaps,materials,null):null;
 if(box.isEmpty())box.setFromObject(near);
 const triangles=g=>g?g.children.reduce((n,m)=>n+m.geometry.index.count/3,0):0;
 return {near,mid,far,box,footprint:packet.footprint,collision:packet.collision||[],stats:{near:triangles(near),mid:triangles(mid),far:triangles(far)}};
}
function copyOf(source,{shadow=false}={}){
 const g=new T.Group();
 for(const mesh of source.children){
  if(shadow&&!mesh.castShadow)continue;
  const copy=new T.Mesh(mesh.geometry,mesh.material);copy.name=mesh.name;
  if(shadow){copy.castShadow=true;copy.receiveShadow=false;copy.layers.set(SHADOW_LAYER);}
  else{copy.castShadow=false;copy.receiveShadow=true;copy.onBeforeRender=activate;}
  g.add(copy);
 }
 return g;
}
// Shadows come from a lighter copy of the building, drawn only into the shadow
// map (its own layer; the light's shadow camera sees that layer, the game camera
// does not). The shadow copy is one step coarser than what is on screen: the
// shadow map texel (6–30 cm) is coarser than the merge grid, so the shadow looks
// the same while the shadow pass draws far fewer triangles.
export const SHADOW_LAYER_V354=5;
const SHADOW_LAYER=SHADOW_LAYER_V354;
const lightChecks=new WeakMap();
// The lights of the scene must see the shadow layer. Checked every few seconds
// (lights can be replaced when the graphics settings change). Returns the size
// of one shadow map texel in metres (the sun follows the camera and zoom).
function shadowTexel(object){
 let root=object;while(root.parent)root=root.parent;
 const now=performance.now();let check=lightChecks.get(root);
 if(!check||now-check.time>3000){
  check={time:now,lights:root.children.filter(o=>o.isDirectionalLight&&o.shadow)};lightChecks.set(root,check);
  for(const o of check.lights)o.shadow.camera.layers.enable(SHADOW_LAYER);
 }
 let texel=1;
 for(const o of check.lights)if(o.castShadow){const c=o.shadow.camera;texel=Math.min(texel,(c.right-c.left)/Math.max(256,o.shadow.mapSize.x));}
 return texel;
}
// Level distances are set for a 1080-pixel-high picture. A smaller picture
// (phone, lower resolution setting, adaptive resolution) shows the same detail
// with fewer pixels, so the lighter levels can start sooner; never later.
const eye=new T.Vector3(),here=new T.Vector3(),TAN_BASE=Math.tan(43*Math.PI/360);
function pixelScale(camera){
 const h=state.bufferHeight||1080,fov=camera.isPerspectiveCamera?Math.tan(camera.fov*Math.PI/360):TAN_BASE;
 return Math.max(.45,Math.min(1,h/1080*TAN_BASE/fov));
}
// Identical buildings (same model) are drawn together: one instanced draw per
// part and level instead of one per building. Each building still keeps its own
// meshes (hidden) for picking with the mouse, bounds and the preview ghost.
// ?instancing=0 turns this off (comparison while testing).
const INSTANCING=(()=>{try{return new URLSearchParams(location.search).get('instancing')!=='0';}catch{return true;}})();
const scenes=new WeakMap();
const tmpMatrix=new T.Matrix4(),tmpSphere=new T.Sphere(),viewProjection=new T.Matrix4();
function sceneBatches(root){
 let entry=scenes.get(root);if(entry)return entry;
 const container=new T.Group();container.name='V354 instances';
 entry={container,batches:new Map(),frustum:new T.Frustum(),shadowFrustum:new T.Frustum(),shadowCulling:false,stamp:0};scenes.set(root,entry);root.add(container);
 // Every render of this scene starts empty; the buildings add themselves while
 // the renderer walks the scene, before anything is drawn. The container is kept
 // as the scene's last child so the buildings are visited before it.
 const before=root.onBeforeRender;
 root.onBeforeRender=function(renderer,scene,camera,...rest){
  for(const batch of entry.batches.values()){if(batch.count){batch.count=0;for(const mesh of batch.meshes){mesh.count=0;mesh.visible=false;}}}
  if(root.children[root.children.length-1]!==container){root.remove(container);root.add(container);}
  viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);entry.frustum.setFromProjectionMatrix(viewProjection);
  // Shadow copies outside the sun's shadow box are left out. The box is the one
  // drawn last frame (the sun follows the camera), so test with a margin.
  const sun=lightChecks.get(root)?.lights.find(o=>o.castShadow);
  entry.shadows=Boolean(sun&&renderer.shadowMap.enabled)||!lightChecks.has(root);
  entry.shadowCulling=Boolean(sun&&renderer.shadowMap.enabled);
  if(entry.shadowCulling){const c=sun.shadow.camera;c.updateMatrixWorld();viewProjection.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);entry.shadowFrustum.setFromProjectionMatrix(viewProjection);}
  return before.call(this,renderer,scene,camera,...rest);
 };
 return entry;
}
function batchFor(scene,source,shadow){
 const key=source.uuid+(shadow?':shadow':'');
 let batch=scene.batches.get(key);if(batch)return batch;
 batch={count:0,capacity:0,meshes:[],source,shadow,scene};scene.batches.set(key,batch);
 grow(batch,8);
 return batch;
}
function grow(batch,capacity){
 const old=batch.meshes;batch.meshes=[];
 const parts=batch.source.children.filter(m=>!batch.shadow||m.castShadow);
 parts.forEach((part,i)=>{
  const mesh=new T.InstancedMesh(part.geometry,part.material,capacity);
  mesh.name=part.name;mesh.frustumCulled=false;mesh.count=0;mesh.visible=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  if(batch.shadow){mesh.castShadow=true;mesh.receiveShadow=false;mesh.layers.set(SHADOW_LAYER);}
  else{mesh.castShadow=false;mesh.receiveShadow=true;mesh.onBeforeRender=activate;}
  if(old[i]){mesh.instanceMatrix.array.set(old[i].instanceMatrix.array.subarray(0,batch.capacity*16));batch.scene.container.remove(old[i]);old[i].dispose();}
  batch.meshes.push(mesh);batch.scene.container.add(mesh);
 });
 batch.capacity=capacity;
}
function addInstance(batch,matrix){
 if(batch.count>=batch.capacity)grow(batch,batch.capacity*2);
 const i=batch.count++;
 for(const mesh of batch.meshes){matrix.toArray(mesh.instanceMatrix.array,i*16);mesh.count=batch.count;mesh.visible=true;mesh.instanceMatrix.needsUpdate=true;}
}
const placedInfo=new WeakMap();
class HouseLOD extends T.LOD{
 update(camera){
  const levels=this.levels;
  if(this.forceLevelV354!=null){
   const f=Math.min(this.forceLevelV354,levels.length-1);levels.forEach((l,i)=>l.object.visible=i===f);this._currentLevel=f;
  }else if(levels.length>1){
   eye.setFromMatrixPosition(camera.matrixWorld);here.setFromMatrixPosition(this.matrixWorld);
   const distance=eye.distanceTo(here)/camera.zoom,scale=pixelScale(camera);
   levels[0].object.visible=true;let i=1;
   for(;i<levels.length;i++){
    let limit=levels[i].distance*scale;if(levels[i].object.visible)limit-=limit*levels[i].hysteresis;
    if(distance>=limit){levels[i-1].object.visible=false;levels[i].object.visible=true;}else break;
   }
   this._currentLevel=i-1;for(;i<levels.length;i++)levels[i].object.visible=false;
  }
  const info=placedInfo.get(this);if(!info)return;
  // one step coarser than on screen; two when the shadow texel is coarser than
  // the middle level's merge grid as well
  const step=shadowTexel(this)>.09?1:0;
  const level=this.getCurrentLevel(),shadowIndex=Math.min(info.shadowSources.length-1,level+step);
  // The building ghost (and anything else that gave this building its own
  // materials) is drawn on its own.
  let root=this;while(root.parent)root=root.parent;
  const instanced=INSTANCING&&root.isScene&&info.probe?.material===info.probeMaterial;
  if(instanced!==info.instanced){
   info.instanced=instanced;
   for(const l of levels)l.object.traverse(o=>{if(o.isMesh)o.visible=!instanced;});
  }
  for(const copy of info.shadowCopies)copy.visible=false;
  if(!instanced){info.shadowCopies[shadowIndex].visible=true;return;}
  const scene=sceneBatches(root);
  tmpMatrix.multiplyMatrices(this.matrixWorld,info.base);
  tmpSphere.copy(info.sphere).applyMatrix4(tmpMatrix);
  if(scene.shadowCulling){tmpSphere.radius=tmpSphere.radius*1.25+8;}
  if(scene.shadows!==false&&(!scene.shadowCulling||scene.shadowFrustum.intersectsSphere(tmpSphere)))addInstance(batchFor(scene,info.shadowSources[shadowIndex],true),tmpMatrix);
  tmpSphere.copy(info.sphere).applyMatrix4(tmpMatrix);
  if(scene.frustum.intersectsSphere(tmpSphere))addInstance(batchFor(scene,info.levelSources[level],false),tmpMatrix);
 }
}
// How the designer model is sized for the game.
function fitting(type){
 if(WALL_PIECES[type])return 'wall';
 if(type==='woodgate')return 'gate';
 if(type==='field')return 'field';
 return 'lot';
}
function placedTemplate(entry,type){
 const {near,mid,far,box,collision}=entry.template;
 const w=Math.max(.1,box.max.x-box.min.x),d=Math.max(.1,box.max.z-box.min.z);
 const fit=fitting(type);
 let sx,sz,sy;
 if(fit==='wall'){sx=sz=sy=METRE;}
 else if(fit==='gate'){sx=sz=sy=7/w;}
 else if(fit==='field'){sx=16/w;sz=16/d;sy=METRE;}
 else{const [rx,rz]=LOT[type]??[4.8,5];const s=METRE*Math.max(.7,Math.min(1.3,Math.min(2*rx/(w*METRE),2*rz/(d*METRE))));sx=sz=sy=s;}
 const cx=-(box.min.x+box.max.x)/2*sx,cz=-(box.min.z+box.max.z)/2*sz;
 const level=(source,options)=>{const g=copyOf(source,options);g.scale.set(sx,sy,sz);g.position.set(cx,0,cz);const root=new T.Group();root.add(g);return root;};
 const lod=new HouseLOD();lod.name='V354 '+entry.id;
 lod.addLevel(level(near),0);
 if(mid)lod.addLevel(level(mid),INTERIOR_DISTANCE,.08);
 if(far)lod.addLevel(level(far),NEAR_DISTANCE,.08);
 // shadow copy for each on-screen level: near→mid, mid→far, far→far
 const levelSources=[near,mid,far].filter(Boolean);
 const shadowSources=[mid??far??near,far??mid??near,far??mid??near].slice(0,levelSources.length);
 const made=new Map(),shadowCopies=shadowSources.map(source=>{if(!made.has(source)){const g=level(source,{shadow:true});g.name='V354 shadow';lod.add(g);made.set(source,g);}return made.get(source);});
 shadowCopies.forEach((copy,i)=>copy.visible=i===0);
 const base=new T.Matrix4().compose(new T.Vector3(cx,0,cz),new T.Quaternion(),new T.Vector3(sx,sy,sz));
 const sphere=box.getBoundingSphere(new T.Sphere());
 const probe=lod.levels[0].object.children[0].children[0];
 placedInfo.set(lod,{levelSources,shadowSources,shadowCopies,base,sphere,probe,probeMaterial:probe?.material,instanced:false});
 // Wall segments [ax,az,bx,bz,radius] in the model's own frame (before its rotation).
 const walls=collision.map(([ax,az,bx,bz,r])=>[ax*sx+cx,az*sz+cz,bx*sx+cx,bz*sz+cz,r*Math.min(sx,sz)]);
 lod.userData.houseDesignV354={id:entry.id,key:entry.key,scale:sx,halfW:w*sx/2,halfD:d*sz/2,collision:walls};
 return lod;
}

function load(key,id,design,segment){
 let entry=state.cache.get(key);
 if(entry)return entry;
 entry={key,id,status:'pending',template:null,error:null};
 state.cache.set(key,entry);
 (async()=>{
  const started=performance.now();
  let packet=await readCached(key).then(v=>v&&fromCache(v)).catch(()=>null);
  entry.cached=Boolean(packet);
  if(!packet){
   const reply=await requestModel(id,design,segment);
   entry.timings=reply.model?.timings??null;
   if(reply.error||!reply.model)throw new Error(reply.error||'No model');
   packet=reply.model;writeCached(key,packet);
  }
  entry.template=template(packet);entry.status='ready';entry.ms=Math.round(performance.now()-started);
 })().catch(error=>{entry.status='failed';entry.error=String(error?.message||error);console.warn('V354 designer model',id,entry.error);
  if(!state.reported){state.reported=true;for(const listener of state.errorListeners)try{listener(entry.error)}catch{}}})
  .finally(()=>{state.revision++;notify();});
 return entry;
}
function canUseDesign(type,age,design){return Boolean(design?.id)&&design.id===designerIdV354(type,age);}
function request(type,age,design,tier){
 const own=canUseDesign(type,age,design);
 const id=own?design.id:designerIdV354(type,age);
 if(!id)return null;
 const kind=WALL_PIECES[type]?.(tier);
 const segment=kind?{length:7/METRE,kind}:null;
 const key=(own?designKeyV354(design):'default:'+id)+(segment?':piece:'+kind:'');
 return {key,id,design:own?design:null,segment};
}

// Stamp for stream rebuilds: changes when the model for this building finishes.
export function houseDesignStampV354(type,age,design,tier){
 if(!state.enabled)return 'off';
 const r=request(type,age,design,tier);
 if(!r)return 'none';
 return r.key+':'+(state.cache.get(r.key)?.status??'new');
}

// The designer model for a building, or null while it is still being built.
export function designedBuildingModelV354(type,age,design,{tier=1}={}){
 if(!state.enabled)return null;
 const r=request(type,age,design,tier);
 if(!r)return null;
 const entry=load(r.key,r.id,r.design,r.segment);
 return entry.status==='ready'?placedTemplate(entry,type):null;
}
// True while the designer model of this building has failed to build.
export function designFailedV354(type,age,design,tier=1){const r=request(type,age,design,tier);return Boolean(r&&state.cache.get(r.key)?.status==='failed');}
// An empty stand-in while the designer model is being built.
export function pendingBuildingV354(type){const g=new T.Group();g.name='V354 pending '+type;g.userData.houseDesignPendingV354=true;return g;}

// Starts building the models a town needs, before they are seen.
export function preloadHouseDesignsV354(list){
 if(!state.enabled)return;
 for(const {type,age,design,tier} of list){const r=request(type,age,design,tier);if(r)load(r.key,r.id,r.design,r.segment);}
}
// Walk collision against a designer building's walls. model: the placed
// building root (position, rotation.y, scale); radius: walker radius.
export function hitsDesignedWallsV354(model,x,z,radius=.22){
 const walls=model?.userData?.houseDesignV354?.collision;if(!walls)return null;
 const dx=x-model.position.x,dz=z-model.position.z,a=model.rotation.y,c=Math.cos(a),s=Math.sin(a);
 const lx=(dx*c-dz*s)/(model.scale.x||1),lz=(dx*s+dz*c)/(model.scale.z||1);
 for(const [ax,az,bx,bz,r] of walls){
  const ex=bx-ax,ez=bz-az,len=ex*ex+ez*ez,t=len?Math.max(0,Math.min(1,((lx-ax)*ex+(lz-az)*ez)/len)):0;
  const px=ax+ex*t-lx,pz=az+ez*t-lz;if(px*px+pz*pz<(r+radius)*(r+radius))return true;
 }
 return false;
}
export function houseDesignStatusV354(){
 const counts={pending:0,ready:0,failed:0};for(const e of state.cache.values())counts[e.status]++;
 const triangles={};for(const e of state.cache.values())if(e.template)triangles[e.id]=e.template.stats;
 return {...counts,enabled:state.enabled,revision:state.revision,detail:DETAIL,textureLevels:TEXTURE_LEVELS,interiorDistance:INTERIOR_DISTANCE,nearDistance:NEAR_DISTANCE,
  texturesLoaded:[...loaded.keys()].map(k=>k.split('/textures/')[1]),triangles,
  // How long each model took (ms from asking to ready; the designer's own steps).
  times:Object.fromEntries([...state.cache.values()].filter(e=>e.ms!=null).map(e=>[e.id,{ms:e.ms,cached:e.cached,...(e.timings??{})}])),
  errors:[...state.cache.values()].filter(e=>e.error).map(e=>e.id+': '+e.error)};
}
