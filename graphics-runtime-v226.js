// V226 – scene/renderer integration for menu controls. No simulation timing is throttled.
import * as T from './vendor/three.module.js';
import {graphicsNearDistanceV226} from './graphics-settings-v226.js';
import {setStoneNearDistanceV226} from './stone-near-lod.js';
export function graphicsRuntimeV226({settings,renderer,atmosphere,worldScene,localScene,people,getQuality,getAdaptiveScale}){
 const originals=new WeakMap(),originalMaterials=new WeakMap(),convertedMaterials=new WeakMap();
 const gpuFallbackMaterials=new WeakMap();
 // WebGPU r170 cannot compile legacy ShaderMaterial/RawShaderMaterial GLSL.
 // Keep 3D geometries visible with conservative native material stand-ins.
 function prepareGPUScene(scene){
  scene.traverse(o=>{
   if(!o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh)return;
   function safe(m){
    if(!m?.isShaderMaterial&&!m?.isRawShaderMaterial)return m;
    if(gpuFallbackMaterials.has(m))return gpuFallbackMaterials.get(m);
    const tex=m.uniforms?.map?.value;
    const name=(o.name||'').toLowerCase();
    const color=/sea|water|ocean|river/.test(name)?'#377b88':
      /sky|cloud/.test(name)?'#8fb9cf':'#b0af99';
    const replacement=new T.MeshBasicMaterial({color,side:m.side,
     transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,
     vertexColors:!!o.geometry?.attributes?.color,map:tex?.isTexture?tex:null,
     fog:m.fog!==false});
    replacement.name='WebGPU legacy GLSL fallback';
    gpuFallbackMaterials.set(m,replacement);
    return replacement;
   }
   if(Array.isArray(o.material))o.material=o.material.map(safe);
   else o.material=safe(o.material);
  });
 }
 let pendingGPU=false,gpuSuccessfulFrames=0;
 let lastDraw=0,lastStats=performance.now(),frames=0,lastPeople=0,overlay=null;
 function pixelRatio(){return Math.min(3,Math.min(devicePixelRatio||1,2)*(settings.resolution/100)*(getAdaptiveScale?.()||1));}
 function peopleShadows(){
  if(!people)return;
  people.traverse(o=>{if(!o.isMesh&&!o.isSkinnedMesh)return;
   if(!originals.has(o))originals.set(o,!!o.castShadow);
   o.castShadow=settings.unitShadows?originals.get(o):false;
  });
 }
 function textureFiltering(){
  const anisotropy={low:1,medium:2,high:4}[settings.texture]||2;
  const seen=new Set();
  for(const scene of [worldScene,localScene])scene.traverse(o=>{
   for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){
    for(const key of ['map','normalMap','roughnessMap']){
     const tex=m?.[key];if(!tex||seen.has(tex))continue;seen.add(tex);
     if(tex.anisotropy!==anisotropy){tex.anisotropy=anisotropy;tex.needsUpdate=true;}
    }
   }
  });
 }
 function convertedMaterial(m,kind){
  if(!m||(!m.isMeshStandardMaterial&&!m.isMeshPhysicalMaterial)||
      Object.hasOwn(m,'onBeforeCompile')||Object.hasOwn(m,'customProgramCacheKey'))return m;
  if(kind==='pbr')return m;
  let cache=convertedMaterials.get(m);if(!cache){cache={};convertedMaterials.set(m,cache);}
  if(cache[kind])return cache[kind];
  const params={color:m.color?.clone(),map:m.map,normalMap:m.normalMap,normalScale:m.normalScale?.clone(),
   emissive:m.emissive?.clone(),emissiveMap:m.emissiveMap,emissiveIntensity:m.emissiveIntensity,
   vertexColors:m.vertexColors,alphaTest:m.alphaTest,alphaMap:m.alphaMap,side:m.side,transparent:m.transparent,
   opacity:m.opacity,depthWrite:m.depthWrite,depthTest:m.depthTest,wireframe:m.wireframe,
   flatShading:m.flatShading,aoMap:m.aoMap,aoMapIntensity:m.aoMapIntensity,
   lightMap:m.lightMap,lightMapIntensity:m.lightMapIntensity};
  let made;
  if(kind==='classic')made=new T.MeshLambertMaterial(params);
  else if(kind==='toon')made=new T.MeshToonMaterial(params);
  else if(kind==='physical')made=new T.MeshPhysicalMaterial({...params,
   roughness:m.roughness??.85,metalness:m.metalness??0,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,
   clearcoat:.18,clearcoatRoughness:.42});
  if(made){made.name=(m.name||'material')+' '+kind;cache[kind]=made;}
  return made||m;
 }
 function applyMaterialEngine(){
  for(const scene of [worldScene,localScene])scene.traverse(o=>{
   if(!o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh)return;
   if(!originalMaterials.has(o))originalMaterials.set(o,o.material);
   const base=originalMaterials.get(o),mode=settings.lightingEngine||'pbr';
   if(Array.isArray(base))o.material=base.map(m=>convertedMaterial(m,mode));
   else o.material=convertedMaterial(base,mode);
  });
 }
 function apply(){
  const quality=getQuality?.()||'high';
  atmosphere.setQuality(quality);atmosphere.setGraphics(settings);
  renderer.shadowMap.enabled=settings.shadows!=='off';renderer.shadowMap.needsUpdate=true;
  renderer.toneMapping=settings.postProcessing?T.ACESFilmicToneMapping:T.NoToneMapping;
  renderer.toneMappingExposure=settings.lighting==='cinematic'?1.10:1.02;
  renderer.setPixelRatio(pixelRatio());
  const detail=graphicsNearDistanceV226(settings);
  const units=graphicsNearDistanceV226({...settings,buildingDetail:settings.unitDetail});
  setStoneNearDistanceV226(detail,units);
  applyMaterialEngine();textureFiltering();peopleShadows();
  for(const id of ['startmenu','citypanel','tools','atlaspanel','commandhud']){
   const el=document.getElementById(id);if(el)el.style.zoom=(settings.uiScale/100);
  }
  const legacy=document.getElementById('quality');
  if(legacy)legacy.textContent='⚙ Graafikaseaded ('+settings.preset+')';
 }
 function canRender(now){
  const target=settings.fpsLimit==='unlimited'?0:(1000/(Number(settings.fpsLimit)||60));
  return now-lastDraw>=target-1;
 }
 function afterRender(now){
  lastDraw=now;frames++;
  if(settings.performanceOverlay){
   if(!overlay){overlay=document.createElement('div');overlay.id='graphics-fps-v226';overlay.style.cssText='position:fixed;left:8px;bottom:85px;z-index:99;background:#071b17df;color:#d7efdd;padding:8px 10px;border-radius:7px;font:12px/1.5 monospace;pointer-events:none';document.body.append(overlay);}
   overlay.hidden=false;
   if(now-lastStats>=1000){overlay.textContent='FPS '+Math.round(frames*1000/Math.max(1,now-lastStats))+
    ' · draw calls '+(renderer.info?.render?.calls??0)+' · triangles '+(renderer.info?.render?.triangles??0)+
    ' · '+(T.GPU_MODE_V225?'WebGPU':'WebGL');
    frames=0;lastStats=now;}
  }else if(overlay){overlay.hidden=true;lastStats=now;frames=0;}
  if(now-lastPeople>4000){lastPeople=now;applyMaterialEngine();if(!settings.unitShadows)peopleShadows();}
 }
 function render(scene,camera,now){
  if(T.GPU_MODE_V225||renderer.isWebGPUShimV225){
   if(pendingGPU)return;
   if(typeof renderer.renderAsync!=='function'){
    window.KINGDOMS_WEBGPU_RECOVER_V227?.('WebGPU: async render puudub');return;
   }
   pendingGPU=true;
   prepareGPUScene(scene);
   Promise.resolve(renderer.readyV225).then(()=>renderer.renderAsync(scene,camera)).then(()=>{
    pendingGPU=false;gpuSuccessfulFrames++;afterRender(now);
    // A frame submission with no draw calls cannot display the 3D world.
    const calls=renderer.info?.render?.calls;
    if(gpuSuccessfulFrames>=25&&calls===0)window.KINGDOMS_WEBGPU_RECOVER_V227?.('WebGPU esitas 25 tühja 3D-kaadrit');
   }).catch(error=>{pendingGPU=false;window.KINGDOMS_WEBGPU_RECOVER_V227?.(error);});
   return;
  }
  try{renderer.render(scene,camera);afterRender(now);}catch(error){console.error('WebGL render error',error);throw error;}
 }
 return {apply,canRender,afterRender,pixelRatio,render};
}
