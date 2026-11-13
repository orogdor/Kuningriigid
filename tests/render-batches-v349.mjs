// V349: fewer draw calls for the same picture.
//  1. rigid-part-batches-v349.js: marked parts are collected into instances
//     during the renderer's own scene walk, with exact matrices and fallbacks.
//  2. sapling-trees-v328.js: primitives with the same texture become one part.
//  3. assets/sapling-trees/*/far.glb: one primitive, one 1024x512 atlas.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {markRigidPartsV349,attachRigidPartBatchesV349,setRigidPartBatchingV349} from '../rigid-part-batches-v349.js';
import {createStoneEquipment,createStoneLoad} from '../stone-equipment-v234.js';
import {createSheepV255} from '../herding-v255.js';
import {createDogV274} from '../scout-dog-v274.js';
import {loadSaplingV328,mergeSameTextureV349} from '../sapling-trees-v328.js';

// ---- 1. rigid part batches -------------------------------------------------
const scene=new T.Scene(),api=attachRigidPartBatchesV349(scene),camera=new T.PerspectiveCamera(50,1,.1,5000);
camera.position.set(1234.4,80,-987.6);camera.updateMatrixWorld();
const flock=new T.Group();scene.add(flock);
const sheep=Array.from({length:6},(_,i)=>{const s=createSheepV255(i);s.position.set(1200+i*3,2,-1000+i);s.rotation.y=i*.7;flock.add(s);return s;});
const tools=['stone_hunter','stone_hunter','stone_builder'].map((k,i)=>{const t=createStoneEquipment(k);t.position.set(1210,1,-990+i);t.rotation.set(.3*i,1,.2);scene.add(t);return t;});
const basket=createStoneLoad('basket');basket.position.set(1215,1,-995);basket.visible=false;scene.add(basket);
const dog=createDogV274();dog.position.set(1220,0,-1001);scene.add(dog);
const mirrored=createStoneEquipment('stone_builder');mirrored.scale.x=-1;mirrored.position.set(1225,1,-990);scene.add(mirrored);
const sheared=new T.Group();sheared.scale.set(1,2,1);const tilt=new T.Group();tilt.rotation.z=.5;sheared.add(tilt);tilt.add(createStoneEquipment('stone_miner'));sheared.position.set(1226,1,-990);scene.add(sheared);
const plain=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());plain.position.set(1230,0,-990);scene.add(plain);
const glass=markRigidPartsV349(new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({transparent:true,opacity:.5})));scene.add(glass);
const main=new T.Frustum(),shadow=new T.Frustum(),renderer={isWebGLRenderer:true};
const everything=new T.Matrix4().makeOrthographic(-1e5,1e5,1e5,-1e5,-1e5,1e5);main.setFromProjectionMatrix(everything);shadow.setFromProjectionMatrix(everything);
// The renderer's protocol: update matrices, onBeforeRender, walk the scene in
// child order asking every visible mesh, then the shadow pass, onAfterRender.
function frame(){
 scene.updateMatrixWorld();scene.onBeforeRender(renderer,scene,camera,null);
 const drawn=[],shadowed=[];
 const walk=(o,frustum,list,test)=>{if(!o.visible)return;if(o.isMesh&&test(o)&&(!o.frustumCulled||o.intersectsFrustum(frustum)))list.push(o);for(const c of o.children)walk(c,frustum,list,test);};
 walk(scene,main,drawn,()=>true);walk(scene,shadow,shadowed,o=>o.castShadow);
 scene.onAfterRender(renderer,scene,camera);return {drawn,shadowed};
}
const marked=[];scene.traverse(o=>{if(o.isMesh&&Object.hasOwn(o,'intersectsFrustum')&&!o.isInstancedMesh)marked.push(o);});
let {drawn,shadowed}=frame();
assert.equal(scene.children.at(-1),api.holder,'the batch holder is walked last');
const batches=drawn.filter(o=>o.isInstancedMesh),direct=drawn.filter(o=>!o.isInstancedMesh);
const expectDirect=new Set([plain,glass]);mirrored.traverse(o=>o.isMesh&&expectDirect.add(o));sheared.traverse(o=>o.isMesh&&expectDirect.add(o));
assert.deepEqual(new Set(direct),expectDirect,'only unmarked, transparent, mirrored and sheared parts are drawn directly');
const visibleMarked=marked.filter(o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return !expectDirect.has(o);});
assert.equal(batches.reduce((n,b)=>n+b.count,0),visibleMarked.length,'every visible marked part is exactly one instance');
assert.ok(batches.length<visibleMarked.length/3,'far fewer draw calls: '+batches.length+' for '+visibleMarked.length+' parts');
assert.ok(!batches.some(b=>b.count===0),'empty batches are not drawn');
// every instance reproduces its source: world matrix, geometry, material, flags
const want=new Map();for(const o of visibleMarked){const k=o.geometry.id+':'+o.material.id+':'+o.castShadow+':'+o.receiveShadow;(want.get(k)||want.set(k,[]).get(k)).push([...o.matrixWorld.elements]);}
const m=new T.Matrix4();
for(const b of batches){
 const k=b.geometry.id+':'+b.material.id+':'+b.castShadow+':'+b.receiveShadow,list=want.get(k);assert.ok(list,'batch has sources');
 assert.equal(b.count,list.length);assert.equal(b.instanceMatrix.updateRanges[0].count,b.count*16,'only the used range is uploaded');
 const left=[...list]; // float32 instance data: compare within 1e-3
 for(let i=0;i<b.count;i++){b.getMatrixAt(i,m);const e=m.premultiply(b.matrixWorld).elements,at=left.findIndex(w=>w.every((v,k)=>Math.abs(v-e[k])<1e-3));
  assert.ok(at>=0,'instance matrix equals a part\'s world matrix');left.splice(at,1);}
 assert.equal(left.length,0);
 // stored relative to the camera: no float32 loss far from the origin
 b.getMatrixAt(0,m);assert.ok(Math.abs(m.elements[12])<200&&Math.abs(m.elements[14])<200);
}
// shadow pass: batched sources stay out, batches cast for them; fallbacks cast themselves
assert.ok(shadowed.filter(o=>!o.isInstancedMesh).every(o=>expectDirect.has(o)));
assert.equal(shadowed.filter(o=>o.isInstancedMesh).reduce((n,b)=>n+b.count,0),visibleMarked.filter(o=>o.castShadow).length);
// game code keeps working on the originals: visibility, animation, picking
basket.visible=true;sheep[0].visible=false;sheep[1].userData.legs[0].rotation.x=.4;
const before=batches.reduce((n,b)=>n+b.count,0);({drawn}=frame());
let basketParts=0;basket.traverse(o=>o.isMesh&&basketParts++);let sheepParts=0;sheep[0].traverse(o=>o.isMesh&&sheepParts++);
assert.equal(drawn.filter(o=>o.isInstancedMesh).reduce((n,b)=>n+b.count,0),before+basketParts-sheepParts,'shown and hidden parts follow .visible every frame');
const hit=new T.Raycaster(new T.Vector3(1203,50,-999),new T.Vector3(0,-1,0)).intersectObject(flock,true);
assert.ok(hit.length>0&&!hit[0].object.isInstancedMesh,'picking still hits the original sheep parts');
// outside a render, or with batching off, parts answer the normal frustum test
const leg=sheep[1].userData.legs[0];assert.equal(leg.intersectsFrustum(main),true);
setRigidPartBatchingV349(false);({drawn}=frame());assert.equal(drawn.filter(o=>o.isInstancedMesh).length,0);assert.ok(drawn.includes(leg));setRigidPartBatchingV349(true);
// another renderer type (WebGPU) keeps the old path
scene.updateMatrixWorld();scene.onBeforeRender({isWebGLRenderer:false},scene,camera,null);assert.equal(leg.intersectsFrustum(main),true);scene.onAfterRender();
// a scene without batches attached draws parts normally
const other=new T.Scene(),lone=createSheepV255(3);other.add(lone);other.updateMatrixWorld();other.onBeforeRender(renderer,other,camera,null);
lone.traverse(o=>{if(o.isMesh)assert.equal(o.intersectsFrustum(main),true)});other.onAfterRender();
// capacity grows without losing instances
for(let i=0;i<40;i++){const s=createSheepV255(i);s.position.set(1200+i,0,-1010);flock.add(s);}
({drawn}=frame());let all=0;scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&Object.hasOwn(o,'intersectsFrustum')){let v=true;for(let p=o;p;p=p.parent)v=v&&p.visible;if(v&&!expectDirect.has(o))all++;}});
assert.equal(drawn.filter(o=>o.isInstancedMesh).reduce((n,b)=>n+b.count,0),all);
const rigid={parts:all,drawCalls:drawn.filter(o=>o.isInstancedMesh).length};

// ---- 2. merged tree primitives --------------------------------------------
const box=new T.BoxGeometry(),cone=new T.ConeGeometry(),img={},imgB={};
const merged=mergeSameTextureV349([{geometry:box.clone(),image:img,color:[1,1,1,1]},{geometry:cone.clone(),image:img,color:[1,1,1,1]},{geometry:box.clone(),image:imgB,color:[1,1,1,1]},{geometry:box.clone(),image:img,color:[1,.5,1,1]}]);
assert.equal(merged.length,3,'different textures or colours stay separate');
assert.equal(merged[0].geometry.index.count,box.index.count+cone.index.count);assert.equal(merged[0].geometry.attributes.position.count,box.attributes.position.count+cone.attributes.position.count);
const tri=(g,i)=>[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(g.attributes.position,g.index.getX(i*3+k)).toArray().join()).join('|');
assert.equal(tri(merged[0].geometry,box.index.count/3),tri(cone,0),'indices of later primitives are offset');
const root=new URL('../assets/sapling-trees/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root)));
globalThis.fetch=async url=>{const b=await readFile(new URL(url));return {ok:true,json:async()=>JSON.parse(b),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
for(const kind of ['oak','pine','palm'])for(const level of ['near','mid','far'])for(let v=0;v<5;v++){
 const r=await loadSaplingV328(kind,v,level),rec=manifest.trees.find(t=>t.id===kind+'_0'+(v+1));
 assert.equal(r.parts.length,1,kind+' '+level+': one draw call per variant');
 assert.equal(r.parts[0].geometry.index.count/3,rec[level].triangles,'no triangle lost');
}

// ---- 3. far cards: one primitive, one atlas --------------------------------
let cards=0;
for(const dir of await readdir(root,{withFileTypes:true})){
 if(!dir.isDirectory())continue;
 const b=await readFile(new URL(dir.name+'/far.glb',root)),n=b.readUInt32LE(12),doc=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n);
 assert.equal(doc.meshes[0].primitives.length,1);assert.equal(doc.images.length,1);assert.equal(doc.materials[0].alphaMode,'MASK');
 const view=i=>{const v=doc.bufferViews[i];return bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)};
 const png=view(doc.images[0].bufferView);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),512);
 const p=doc.meshes[0].primitives[0],uvAcc=doc.accessors[p.attributes.TEXCOORD_0],uv=view(uvAcc.bufferView);
 assert.equal(uvAcc.count,12);assert.equal(doc.accessors[p.indices].count,18);
 for(let i=0;i<12;i++){const u=uv.readFloatLE(i*8),w=uv.readFloatLE(i*8+4);
  if(i<8)assert.ok(u>=0&&u<=.5&&w>=0&&w<=1,'side cards use the left 512x512 tile');
  else assert.ok(u>=.625&&u<=.875&&w>=.25&&w<=.75,'top card uses its 256x256 tile inside the gutters');}
 cards++;
}
assert.equal(cards,30);
console.log('V349 PASS: '+rigid.parts+' rigid parts in '+rigid.drawCalls+' draw calls with exact matrices, shadows, visibility, picking and fallbacks; tree primitives merged without losing triangles; '+cards+' far cards on one atlas');
