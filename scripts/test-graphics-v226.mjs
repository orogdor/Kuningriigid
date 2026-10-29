import assert from 'node:assert/strict';
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
console.log('PASS V226 graphics persistence, validation, presets and LOD distances');
