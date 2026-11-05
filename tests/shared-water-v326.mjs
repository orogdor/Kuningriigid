import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import * as T from '../vendor/three.module.js';
import {seaMaterial} from '../sea-v158.js';
import {waterMaterial} from '../landscape-v149.js';
import {WATER_STYLE_V326} from '../water-style-v326.js';
import {atlasSeaGeometryV326,atlasGroundSamplerV326} from '../atlas-sea-v326.js';
const sea=seaMaterial(),river=waterMaterial();
assert.equal(sea.roughness,river.roughness);assert.equal(sea.metalness,river.metalness);
function compile(material){const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);return shader;}
const s=compile(sea),r=compile(river);
// Both calls execute the same implementation, not two similar effect copies.
for(const part of ['float ph1=fract(t*.22)','vL251Grad=vec2(rx-ripple,rz-ripple)/e','uWaterSky*(.78+.22*vL149Ripple)']){
 assert.ok(s.fragmentShader.includes(part));assert.ok(r.fragmentShader.includes(part));
}
assert.strictEqual(s.uniforms.uL149Time,r.uniforms.uL149Time,'one animation clock');
assert.strictEqual(s.uniforms.uWaterSky,r.uniforms.uWaterSky,'same sky reflection');
assert.ok(s.uniforms.uWaterDeepV326.value.equals(new T.Color(WATER_STYLE_V326.deep)));
assert.ok(s.uniforms.uWaterShallowV326.value.equals(new T.Color(WATER_STYLE_V326.shallow)));
assert.ok(s.fragmentShader.includes('if(wetV326<.008)discard'),'sea stays hidden on dry land even after Fresnel');
assert.ok(!s.fragmentShader.includes('d*7.0-t*1.6'),'old broad white surf removed');
// A coastline with a low river trench inland used to make sea vertices
// plunge to -30, producing tilted triangles. The sea now stays completely flat.
const terrain=new T.PlaneGeometry(100,100,6,6);terrain.rotateX(-Math.PI/2);const p=terrain.attributes.position;
for(let i=0;i<p.count;i++)p.setY(i,p.getX(i)<0?-3:8);
const sample=atlasGroundSamplerV326(terrain);
for(let i=0;i<p.count;i++)assert.ok(Math.abs(sample(p.getX(i),p.getZ(i))-p.getY(i))<1e-4,'bank sampler follows actual grid vertices');
const original=p.array.slice(),indices=terrain.index.array.slice();
const game={atlasHeight:(x,z)=>x<0?-3:8};
const geo=atlasSeaGeometryV326(game,terrain),v=geo.attributes.position;
assert.deepEqual(p.array,original,'do not mutate actual terrain');assert.deepEqual(geo.index.array,indices,'identical coast triangles');
for(let i=0;i<v.count;i++){
 assert.equal(v.getY(i),0,'no lowered inland sea vertices');
 assert.equal(v.getX(i),p.getX(i));assert.equal(v.getZ(i),p.getZ(i));
 assert.ok(Number.isFinite(geo.attributes.aDepth.getX(i)));
 if(v.getX(i)>0)assert.ok(geo.attributes.aDepth.getX(i)<0,'dry shore stays dry');
}
const main=readFileSync(new URL('../civilization.js',import.meta.url),'utf8');assert.ok(main.includes('terrainGeometry:atlasLand.geometry'));
const atlasCode=readFileSync(new URL('../atlas-style.js',import.meta.url),'utf8');assert.ok(atlasCode.includes("createRiverNetwork(game,'world',null,quality,worldGroundV326)"));
const bank=readFileSync(new URL('../continuous-landscape-visual.js',import.meta.url),'utf8');assert.ok(!bank.includes('lerp(seaCol'),'no pale paint on the end of the dark river');
// Compile actual WebGPU graphs for BOTH river and sea in a clean module realm.
const code=`
import assert from 'node:assert/strict';import {registerHooks} from 'node:module';
const root=new URL('./',import.meta.url);registerHooks({resolve(s,c,next){if(s.includes('vendor/three.module.js'))return next(new URL('vendor/three-gpu-shim.js',root).href,c);if(/three\\.(?:core|webgpu|tsl)\\.js\\?/.test(s))s=s.split('?')[0];return next(s,c);}});
const T=await import('./vendor/three-gpu-shim.js'),{waterMaterial}=await import('./landscape-v149.js');
const renderer=new T.WebGPURenderer({canvas:{width:64,height:64,style:{},addEventListener(){},removeEventListener(){},setAttribute(){}}});renderer._bindings=undefined;renderer.backend.capabilities={getUniformBufferLimit:()=>65536};renderer.hasFeature=()=>false;
for(const sea of [false,true]){
 const geo=new T.PlaneGeometry();geo.setAttribute('aDepth',new T.Float32BufferAttribute([0,1,2,4],1));geo.setAttribute('aFlow',new T.Float32BufferAttribute([1,0,1,0,1,0,1,0],2));geo.setAttribute('aShore',new T.Float32BufferAttribute([0,1,0,1],1));geo.setAttribute('color',new T.Float32BufferAttribute(Array(4).fill([.02,.07,.09,.94]).flat(),4));
 const material=waterMaterial('world',null,{sea}),mesh=new T.Mesh(geo,material),builder=new T.WGSLNodeBuilder(mesh,renderer);builder.scene=new T.Scene();builder.camera=new T.PerspectiveCamera();builder.build();assert.ok(material.isNodeMaterial);assert.match(builder.fragmentShader,/@fragment/);assert.ok(!/\\b(?:NaN|undefined)\\b/.test(builder.vertexShader+builder.fragmentShader));
}
console.log('WebGPU river AND sea compiled');`;
const node=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
assert.equal(node.status,0,node.stdout+node.stderr);
console.log('V326 shared river/sea style and planar shared coastline grid PASS');console.log(node.stdout.trim());
