import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as GL from '../vendor/three.module.js';
import * as GPU from '../vendor/three-gpu-shim.js';
import {applyCrossingTransform} from '../landscape-polish-v84.js';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const manifest=JSON.parse(read('vendor/three-version.json'));
assert.equal(GL.REVISION,'187');assert.equal(GPU.REVISION,GL.REVISION);
for(const [file,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(read('vendor/'+file)).digest('hex'),hash,file);
for(const key of ['Vector3','Matrix4','Mesh','SkinnedMesh','InstancedMesh','Texture','Color'])assert.equal(GL[key],GPU[key],key+' shares the same core');
// Check the actual game's namespace imports, including the TSL functions used by sea, fog and fire.
for(const f of readdirSync(root).filter(f=>f.endsWith('.js'))){
 const s=read(f);if(!s.includes("as T from './vendor/three.module.js'"))continue;
 for(const [,symbol] of s.matchAll(/\bT\.(\w+)/g))assert.ok(symbol in GPU,`${f}: ${symbol}`);
}
for(const name of ['Fn','uniform','positionWorld','normalView','time','vec2','vec3','vec4','MeshStandardNodeMaterial'])assert.ok(name in GPU,name);
const batch=new GL.InstancedMesh(new GL.BoxGeometry(),new GL.MeshStandardMaterial(),4096);
batch.count=12;for(let i=0;i<12;i++)batch.setMatrixAt(i,new GL.Matrix4().makeTranslation(i,0,0));
batch.computeBoundingBox();assert.equal(batch.instanceMatrix.count,4096);assert.equal(batch.boundingBox.max.x,11.5);
// A reused static bridge must update its world matrix after each placement in r185+.
const bridge=new GL.Group(),frame={x:10,y:2,z:30,rise:0,yaw:0,halfSpan:5,scale:{x:5,y:1,z:6.2}};
applyCrossingTransform(bridge,frame);bridge.updateWorldMatrix(true,true);
applyCrossingTransform(bridge,{...frame,x:45});bridge.updateWorldMatrix(true,true);
assert.equal(bridge.matrixWorld.elements[12],45);
const shader={vertexShader:GL.ShaderLib.standard.vertexShader,fragmentShader:GL.ShaderLib.standard.fragmentShader,uniforms:{}};
const {seaMaterial}=await import('../sea-v158.js');seaMaterial().onBeforeCompile(shader);
assert.ok(shader.vertexShader.includes('vSeaD=aDepth'));
assert.ok(shader.fragmentShader.includes('diffuseColor.rgb=sea'));
assert.ok(shader.fragmentShader.includes('normal=normalize(normal+'));
const html=read('index.html'),map=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
for(const file of ['three.core.js','three.webgpu.js','three.tsl.js'])assert.equal(map['./vendor/'+file],'./vendor/'+file+'?v=305r187');
console.log('PASS Three.js r187: official checksums, shared core, game exports, 4096-instance capacity, bridge relocation, sea shader hooks and cache aliases');
