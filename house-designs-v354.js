// V354: buildings drawn by the house designer (majaehitaja/) inside the game.
// A hidden designer page builds each model once. The finished meshes arrive as
// plain buffers with their textures and are shared by every copy of that
// building. The previous game model stays as the distant level of detail.
import * as T from './vendor/three.module.js';

const FRAME_URL=new URL('./majaehitaja/index.html?embed=1&worker=1&textures=medium',import.meta.url).href;
// Designer ids (catalog keys) in majaehitaja/index.html.
const DESIGNER_IDS=new Set(['hall','house','hunter','fisher','farm','lumber','mason','pottery_kiln','study','barracks','watchtower','archery','palisade','woodgate','quarry','claypit','well','pasture','field',
 'library','scriptorium','market','warehouse','cellar','vegetable_garden','flax_farm','weaver','cartwright','coppermine','tinmine','bronze_foundry','road_depot','harbor','bridge','forester','saw','mill','bakery','gatehouse','reinforced_wall','stonewall','stonetower',
 'academy','smith','smelter','mine','coal','stable','watermill','siegeworkshop','orchard','gem_mine','jeweler',
 'hall@1','house@1','hunter@1','fisher@1','farm@1','lumber@1','mason@1','pottery_kiln@1','barracks@1','archery@1','woodgate@1','quarry@1','claypit@1','well@1','pasture@1','field@1',
 'hall@2','house@2','hunter@2','fisher@2','farm@2','lumber@2','mason@2','pottery_kiln@2','barracks@2','archery@2','woodgate@2','quarry@2','claypit@2','well@2','pasture@2','field@2',
 'library@2','market@2','warehouse@2','cellar@2','vegetable_garden@2','flax_farm@2','weaver@2','cartwright@2','coppermine@2','tinmine@2','bronze_foundry@2','road_depot@2','harbor@2','bridge@2','forester@2','saw@2','mill@2','bakery@2','gatehouse@2','reinforced_wall@2','stonewall@2','stonetower@2']);
const ERA_OF={library:1,scriptorium:1,market:1,warehouse:1,cellar:1,vegetable_garden:1,flax_farm:1,weaver:1,cartwright:1,coppermine:1,tinmine:1,bronze_foundry:1,road_depot:1,harbor:1,bridge:1,forester:1,saw:1,mill:1,bakery:1,gatehouse:1,reinforced_wall:1,stonewall:1,stonetower:1,
 academy:2,smith:2,smelter:2,mine:2,coal:2,stable:2,watermill:2,siegeworkshop:2,orchard:2,gem_mine:2,jeweler:2};
// Game objects with their own geometry rules (drawn walls, fields, piers,
// bridges, tower guards, the doubled market square) keep their game model.
const KEEP_GAME_MODEL=new Set(['palisade','woodgate','gatehouse','stonewall','reinforced_wall','stonetower','watchtower','field','bridge','pasture','fisher','harbor','market','road']);
// Half extents of each building lot in game units (navigation.js FOOTPRINTS).
const LOT={hall:[5.6,5.0],house:[4,3.6],warehouse:[5.6,5],cellar:[5,4.4],study:[5,5],lumber:[4.8,5],quarry:[4.6,5],hunter:[4.6,5],farm:[4.8,5],well:[3.2,3.2],
 barracks:[5,5],saw:[5,5],mill:[4.8,5],bakery:[5,5],archery:[5,5],forester:[4.8,5],claypit:[4.7,4.4],pottery_kiln:[4.7,4.6],mason:[4.8,5],cartwright:[5,6],coppermine:[5,6],
 tinmine:[5,6],bronze_foundry:[5.3,6],road_depot:[5.2,5],scriptorium:[5,5],smith:[5,6],smelter:[5,6],coal:[5,6],mine:[5,6],watermill:[6,5],siegeworkshop:[5,6]};
const METRE=1/1.05; // one game unit is about 1.05 m
// Beyond this camera distance the old, lighter game model is drawn. It follows
// the graphics "view distance" so phones keep their frame rate.
const NEAR_DISTANCE=(()=>{let view='far';try{view=JSON.parse(localStorage.getItem('kingdoms-graphics-v226')||'{}').viewDistance||view;}catch{}
 return {near:140,medium:240,far:380,ultra:560}[view]??380;})();
// ?houses=old or localStorage kingdoms-house-designs-v354=off keeps the old models.
const START_ENABLED=(()=>{try{return new URLSearchParams(location.search).get('houses')!=='old'&&localStorage.getItem('kingdoms-house-designs-v354')!=='off';}catch{return true;}})();

const state={enabled:START_ENABLED,frame:null,ready:null,next:1,waiting:new Map(),cache:new Map(),revision:0,listeners:new Set(),loader:new T.TextureLoader(),textures:new Map()};

export function setHouseDesignsEnabledV354(on){if(state.enabled===!!on)return;state.enabled=!!on;try{localStorage.setItem('kingdoms-house-designs-v354',on?'on':'off');}catch{}state.revision++;notify();}
export function houseDesignsEnabledV354(){return state.enabled;}
export function onHouseDesignsChangedV354(listener){state.listeners.add(listener);return ()=>state.listeners.delete(listener);}
function notify(){for(const listener of state.listeners){try{listener()}catch(error){console.warn('V354',error)}}}

// The designer building id for a game building type at a game age (0–2).
export function designerIdV354(type,age){
 if(age==null||age<0||age>2||KEEP_GAME_MODEL.has(type))return null;
 for(let era=age;era>=0;era--){const id=era?type+'@'+era:type;if(DESIGNER_IDS.has(id)&&(era>0||(ERA_OF[type]??0)<=age))return id;}
 return null;
}
export function canDesignV354(type,age){return Boolean(designerIdV354(type,age));}

function frame(){
 if(state.frame)return state.ready;
 const iframe=document.createElement('iframe');
 iframe.title='Hoonete mudelid';iframe.setAttribute('aria-hidden','true');iframe.tabIndex=-1;
 Object.assign(iframe.style,{position:'fixed',left:'-10000px',top:'0',width:'480px',height:'360px',border:'0',opacity:'0',pointerEvents:'none'});
 iframe.src=FRAME_URL;
 state.frame=iframe;
 state.ready=new Promise(resolve=>{
  const receive=event=>{
   if(event.origin!==location.origin||event.source!==iframe.contentWindow||event.data?.source!=='kuningriigid-designer')return;
   if(event.data.type==='ready')resolve();
   if(event.data.type==='model'){state.waiting.get(event.data.requestId)?.(event.data);state.waiting.delete(event.data.requestId);}
  };
  addEventListener('message',receive);
 });
 document.body.append(iframe);
 return state.ready;
}
async function requestModel(id,design){
 await frame();
 return new Promise(resolve=>{
  const requestId=state.next++;state.waiting.set(requestId,resolve);
  state.frame.contentWindow.postMessage({source:'kuningriigid-game',type:'model',requestId,id,design},location.origin);
 });
}

function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
const designKeys=new WeakMap();
// Saved designs are replaced, never edited in place, so the key is kept per object.
export function designKeyV354(design){
 if(!design)return null;
 let key=designKeys.get(design);
 if(!key){key='design:'+design.id+':'+hashText(JSON.stringify(design));designKeys.set(design,key);}
 return key;
}

function texture(ref,packet){
 const entry=ref&&packet.textures[ref];if(!entry)return null;
 const key=entry.url??ref+':'+packet.key;
 if(state.textures.has(key))return state.textures.get(key);
 let t;
 if(entry.url){t=state.loader.load(entry.url);t.flipY=entry.flipY;}
 else if(entry.bitmap){t=new T.Texture(entry.bitmap);t.flipY=false;t.needsUpdate=true;}
 else return null;
 t.wrapS=entry.wrapS;t.wrapT=entry.wrapT;t.repeat.set(...entry.repeat);t.offset.set(...entry.offset);t.rotation=entry.rotation||0;
 if(entry.srgb)t.colorSpace=T.SRGBColorSpace;
 t.anisotropy=4;t.name='V354 '+(entry.url?entry.url.split('/textures/')[1]:ref);
 if(entry.url)state.textures.set(key,t);
 return t;
}
function material(desc,packet){
 const common={color:desc.color,opacity:desc.opacity,transparent:desc.transparent,depthWrite:desc.depthWrite,side:desc.side,vertexColors:desc.vertexColors,alphaTest:desc.alphaTest};
 const m=desc.type==='MeshBasicMaterial'?new T.MeshBasicMaterial(common):
  new T.MeshStandardMaterial({...common,roughness:desc.roughness,metalness:desc.metalness,emissive:desc.emissive,emissiveIntensity:desc.emissiveIntensity});
 if(m.isMeshBasicMaterial){const t=texture(desc.map,packet);if(t)m.map=t;m.name='V354 '+(desc.name||desc.type);return m;}
 for(const slot of ['map','normalMap','roughnessMap','bumpMap','alphaMap','emissiveMap','aoMap']){const t=texture(desc[slot],packet);if(t)m[slot]=t;}
 if(m.normalMap&&desc.normalScale)m.normalScale.set(...desc.normalScale);
 if(m.bumpMap)m.bumpScale=desc.bumpScale??1;
 m.name='V354 '+(desc.name||desc.type);
 return m;
}
function template(packet){
 const group=new T.Group();group.name='V354 designer model';
 const box=new T.Box3(),local=new T.Box3();
 for(const part of packet.meshes){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(part.positions,3));
  g.setAttribute('normal',new T.BufferAttribute(part.normals,3));
  g.setAttribute('uv',new T.BufferAttribute(part.uvs,2));
  if(part.colors)g.setAttribute('color',new T.BufferAttribute(part.colors,3));
  g.setIndex(new T.BufferAttribute(part.indices,1));
  g.computeBoundingBox();g.computeBoundingSphere();g.userData.houseDesignV354=true;
  const mesh=new T.Mesh(g,material(part.material,packet));
  mesh.castShadow=part.cast&&!part.material.transparent;mesh.receiveShadow=true;mesh.name='V354 '+(part.material.name||'part');
  // Low decals (contact shade, yard ground) never decide the size.
  if(!part.material.transparent){local.copy(g.boundingBox);if(local.max.y>.06)box.union(local);}
  group.add(mesh);
 }
 if(box.isEmpty())box.setFromObject(group);
 return {group,box,footprint:packet.footprint,collision:packet.collision||[]};
}
function placedTemplate(entry,type){
 const {group,box,collision}=entry.template;
 const [rx,rz]=LOT[type]??[4.8,5];
 const w=Math.max(.1,box.max.x-box.min.x),d=Math.max(.1,box.max.z-box.min.z);
 const fit=Math.min(2*rx/(w*METRE),2*rz/(d*METRE));
 const scale=METRE*Math.max(.7,Math.min(1.3,fit));
 const root=new T.Group();root.name='V354 '+entry.id;
 const inner=new T.Group();
 for(const mesh of group.children){const copy=new T.Mesh(mesh.geometry,mesh.material);copy.castShadow=mesh.castShadow;copy.receiveShadow=true;copy.name=mesh.name;inner.add(copy);}
 inner.scale.setScalar(scale);
 inner.position.set(-(box.min.x+box.max.x)/2*scale,0,-(box.min.z+box.max.z)/2*scale);
 root.add(inner);
 // Wall segments [ax,az,bx,bz,radius] in the model's own frame (before its rotation).
 const ox=inner.position.x,oz=inner.position.z;
 const walls=collision.map(([ax,az,bx,bz,r])=>[ax*scale+ox,az*scale+oz,bx*scale+ox,bz*scale+oz,r*scale]);
 root.userData.houseDesignV354={id:entry.id,key:entry.key,scale,halfW:w*scale/2,halfD:d*scale/2,collision:walls};
 return root;
}

function load(key,id,design){
 let entry=state.cache.get(key);
 if(entry)return entry;
 entry={key,id,status:'pending',template:null,error:null};
 state.cache.set(key,entry);
 requestModel(id,design).then(reply=>{
  if(reply.error||!reply.model){entry.status='failed';entry.error=reply.error||'Mudel puudub';console.warn('V354 designer model',id,entry.error);return;}
  reply.model.key=key;
  entry.template=template(reply.model);entry.status='ready';
 }).catch(error=>{entry.status='failed';entry.error=String(error);}).finally(()=>{state.revision++;notify();});
 return entry;
}

// Stamp for stream rebuilds: changes when the model for this building finishes.
export function houseDesignStampV354(type,age,design){
 if(!state.enabled)return 'off';
 const id=design?.id&&canUseDesign(type,age,design)?design.id:designerIdV354(type,age);
 if(!id)return 'none';
 const key=design&&canUseDesign(type,age,design)?designKeyV354(design):'default:'+id;
 return key+':'+(state.cache.get(key)?.status??'new');
}
function canUseDesign(type,age,design){return Boolean(design?.id)&&design.id===designerIdV354(type,age);}

// Returns a model (designer level near, game model far), or null while the
// designer model is still being built or the type keeps its game model.
export function designedBuildingModelV354(type,age,design,gameModel){
 if(!state.enabled)return null;
 const own=canUseDesign(type,age,design);
 const id=own?design.id:designerIdV354(type,age);
 if(!id)return null;
 const entry=load(own?designKeyV354(design):'default:'+id,id,own?design:null);
 if(entry.status!=='ready')return null;
 const near=placedTemplate(entry,type);
 const lod=new T.LOD();lod.name='V354 '+id+' LOD';
 lod.addLevel(near,0);
 if(gameModel){gameModel.name||='V354 far game model';lod.addLevel(gameModel,NEAR_DISTANCE);}
 lod.userData.houseDesignV354=near.userData.houseDesignV354;
 if(gameModel)for(const key of ['stoneNearLOD','stoneModelV221'])if(gameModel.userData[key]!=null)lod.userData[key]=gameModel.userData[key];
 return lod;
}

// Starts building the default models a town will need, before they are seen.
export function preloadHouseDesignsV354(list){
 if(!state.enabled)return;
 for(const {type,age,design} of list){
  if(canUseDesign(type,age,design))load(designKeyV354(design),design.id,design);
  else{const id=designerIdV354(type,age);if(id)load('default:'+id,id,null);}
 }
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
 return {...counts,enabled:state.enabled,revision:state.revision};
}
