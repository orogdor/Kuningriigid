// V226 – scene/renderer integration for menu controls. No simulation timing is throttled.
import * as T from './vendor/three.module.js';
import {graphicsNearDistanceV226} from './graphics-settings-v226.js';
import {setStoneNearDistanceV226} from './stone-near-lod.js';
export function graphicsRuntimeV226({settings,renderer,atmosphere,worldScene,localScene,people,getQuality,getAdaptiveScale}){
 const originals=new WeakMap();
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
  textureFiltering();peopleShadows();
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
  if(now-lastPeople>4000){lastPeople=now;if(!settings.unitShadows)peopleShadows();}
 }
 return {apply,canRender,afterRender,pixelRatio};
}
