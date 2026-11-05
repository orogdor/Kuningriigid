// Compile the game's real TSL graphs without a GPU. This checks generated WGSL,
// not raster output; tests/three-r187-v305.html is the device/rendering test.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
const root=new URL('../',import.meta.url);
registerHooks({resolve(specifier,context,next){
 if(specifier.includes('vendor/three.module.js'))return next(new URL('vendor/three-gpu-shim.js',root).href,context);
 if(/three\.(?:core|webgpu|tsl)\.js\?/.test(specifier))specifier=specifier.split('?')[0];
 return next(specifier,context);
}});
const T=await import('../vendor/three-gpu-shim.js');
const {seaMaterial}=await import('../sea-v158.js');
const {setupAtmosphere}=await import('../atmosphere-v158.js');
const {createFireV252}=await import('../daynight-v235.js');
const {loadStoneHumanV241,createStoneHuman,animateStoneHuman}=await import('../stone-age-models-v221.js');
const renderer=new T.WebGPURenderer({canvas:{width:320,height:180,style:{},addEventListener(){},removeEventListener(){},setAttribute(){}}});
// Uninitialized renderer: no device submission or texture decoding is attempted.
renderer._bindings=undefined;
renderer.backend.capabilities={getUniformBufferLimit:()=>65536};
renderer.hasFeature=()=>false;
const scene=new T.Scene(),local=new T.Scene(),camera=new T.PerspectiveCamera();
const atmosphere=setupAtmosphere({renderer,worldScene:scene,localScene:local,quality:'low'});
atmosphere.update(scene,new T.Vector3(),30,0,240);
const geo=new T.PlaneGeometry();geo.setAttribute('aDepth',new T.Float32BufferAttribute([0,1,2,3],1));
const sea=new T.Mesh(geo,seaMaterial());scene.add(sea);
const fire=createFireV252();scene.add(fire);
const batch=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardNodeMaterial(),4096);batch.count=12;scene.add(batch);
// Decode geometry and skin from the actual GLB. Image decode stays a browser check.
const savedFetch=globalThis.fetch,savedBitmap=globalThis.createImageBitmap;
globalThis.fetch=async path=>new Response(await readFile(new URL(path,root)));
globalThis.createImageBitmap=async()=>({width:1,height:1});
await loadStoneHumanV241();
const human=createStoneHuman(scene,0,0,'#a5c082','stone_worker');animateStoneHuman(human,1,true);scene.updateMatrixWorld(true);
globalThis.fetch=savedFetch;globalThis.createImageBitmap=savedBitmap;
let skin=null;human.traverse(o=>{if(o.isSkinnedMesh)skin=o;});assert.equal(skin.skeleton.bones.length,17);
skin.skeleton.update();assert.ok([...skin.skeleton.boneMatrices].every(Number.isFinite));
const materials=new Set();let count=0;
scene.traverse(object=>{
 if(!object.isMesh)return;
 if(materials.has(object.material)&&object!==skin&&object!==batch)return;
 materials.add(object.material);
 const builder=new T.WGSLNodeBuilder(object,renderer);builder.scene=scene;builder.camera=camera;builder.build();
 assert.match(builder.vertexShader,/@vertex/);assert.match(builder.fragmentShader,/@fragment/);
 assert.ok(!/\b(?:NaN|undefined)\b/.test(builder.vertexShader+builder.fragmentShader),object.material.type);
 if(object===batch)assert.match(builder.vertexShader,/nodeAttribute\d+ : vec4<f32>/,'Large instance buffer uses vertex attributes');
 if(object===skin)assert.ok(builder.vertexShader.includes('skinWeight'),'GLB skinning is compiled');
 count++;
});
assert.ok(count>=4);assert.ok(sea.material.isNodeMaterial);
// Exercise the game's renderer adapter: wait for init, then synchronous render,
// and route an actual render exception to the existing recovery handler.
const {graphicsRuntimeV226}=await import('../graphics-runtime-v226.js');
const failures=[];globalThis.window={KINGDOMS_WEBGPU_RECOVER_V227:error=>failures.push(error)};
let initialize,renders=0;
const fake={readyV225:new Promise(resolve=>{initialize=resolve;}),info:{render:{drawCalls:1}},render(){renders++;}};
const runtime=graphicsRuntimeV226({renderer:fake,settings:{performanceOverlay:false}});
const blank=new T.Scene();runtime.render(blank,camera,0);assert.equal(renders,0);
initialize();await new Promise(setImmediate);assert.equal(renders,1);
runtime.render(blank,camera,16);await new Promise(setImmediate);assert.equal(renders,2);
fake.render=()=>{throw Error('Test device render failure');};
runtime.render(blank,camera,32);await new Promise(setImmediate);assert.equal(failures.length,1);
assert.match(failures[0].message,/Test device render failure/);
console.log(`PASS r187 WGSL: ${count} actual game material/geometry combinations; sea, sky, fire, large instancing and animated 17-bone GLB`);
console.log('PASS r187 runtime: deferred initialization, synchronous frame submission and render error recovery');
