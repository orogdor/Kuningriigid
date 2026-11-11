import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {graphicsRuntimeV226} from '../graphics-runtime-v226.js';
import {GRAPHICS_DEFAULTS_V226,GRAPHICS_PRESETS_V226,GRAPHICS_KEY_V226,
 loadGraphicsSettingsV226,saveGraphicsSettingsV226,graphicsNearDistanceV226,
 graphicsViewFactorV226} from '../graphics-settings-v226.js';

const store=new Map();
globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))};
const previous=loadGraphicsSettingsV226();
assert.equal(previous.preset,'high');
assert.equal(previous.renderer,'webgl');
assert.equal(previous.resolution,100);
assert.equal(previous.shadows,'medium');
assert.equal(GRAPHICS_PRESETS_V226.low.water,'simple');
assert.equal(GRAPHICS_PRESETS_V226.ultra.shadows,'high');
assert.equal(GRAPHICS_PRESETS_V226.low.lightingEngine,'classic');
assert.equal(GRAPHICS_PRESETS_V226.ultra.lightingEngine,'physical');

const changed={...GRAPHICS_DEFAULTS_V226,...GRAPHICS_PRESETS_V226.ultra,preset:'custom',renderer:'webgpu',resolution:125,vegetation:'low',unitShadows:false,lightingEngine:'toon'};
saveGraphicsSettingsV226(changed);
const loaded=loadGraphicsSettingsV226();
assert.equal(loaded.renderer,'webgpu');
assert.equal(loaded.lightingEngine,'toon');
assert.equal(loaded.resolution,125);
assert.equal(loaded.vegetation,'low');
assert.equal(loaded.unitShadows,false);
assert.equal(loaded.preset,'custom');
assert.equal(store.get('kingdoms-quality'),'high');
assert(graphicsViewFactorV226({...loaded,viewDistance:'near'})<graphicsViewFactorV226({...loaded,viewDistance:'ultra'}));
assert(graphicsNearDistanceV226({...loaded,viewDistance:'near',lod:'performance',buildingDetail:'low'})<
 graphicsNearDistanceV226({...loaded,viewDistance:'ultra',lod:'quality',buildingDetail:'high'}));
store.set(GRAPHICS_KEY_V226,JSON.stringify({resolution:999,shadowQuality:'invalid',renderer:'browser_exploit',lightingEngine:'invalid_engine',shadows:'off'}));
const safe=loadGraphicsSettingsV226();
assert.equal(safe.resolution,100);
assert.equal(safe.renderer,'webgl');
assert.equal(safe.lightingEngine,'pbr');
assert.equal(safe.shadows,'off');
const localScene=new T.Scene(),worldScene=new T.Scene(),camera=new T.PerspectiveCamera();
const sun=new T.DirectionalLight();sun.castShadow=true;sun.shadow.map={};localScene.add(sun);
let reuse=true;
const draws=[];
const shadowMap={enabled:true,autoUpdate:true,needsUpdate:false};
const renderer={shadowMap,render(){
 draws.push(shadowMap.autoUpdate||shadowMap.needsUpdate);
 shadowMap.needsUpdate=false;sun.shadow.needsUpdate=false;
}};
const runtime=graphicsRuntimeV226({settings:{performanceOverlay:false},renderer,worldScene,localScene,allowShadowReuse:()=>reuse});
const draw=(scene=localScene)=>runtime.render(scene,camera,draws.length*17);
draw();draw();draw();draw();
camera.position.x=5;draw();
camera.rotation.y=.2;draw();
camera.zoom=1.2;camera.updateProjectionMatrix();draw();
shadowMap.needsUpdate=true;draw();
sun.shadow.needsUpdate=true;draw();
reuse=false;draw();draw();
reuse=true;draw();draw(worldScene);draw();
assert.deepEqual(draws,[true,false,true,false,true,true,true,true,true,true,true,true,true,true]);
assert.equal(shadowMap.autoUpdate,true,'the renderer keeps its original shadow setting outside the draw');
console.log('PASS V226 graphics persistence, validation, presets and LOD distances');
