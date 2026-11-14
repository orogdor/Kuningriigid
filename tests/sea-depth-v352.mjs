// V352: the world sea is a flat plane that reads its depth from a texture. The texture must hold the
// same values the V326/V348 sea mesh interpolated (depth and shore factor over the terrain triangles),
// every triangle the V348 sea kept must be covered, and the shader must read it instead of aDepth.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {atlasSeaGeometryV326,atlasSeaDepthTextureV352,atlasSeaPlaneV352,SEA_DRY_LIMIT_V348,SEA_DRY_TEXEL_V352} from '../atlas-sea-v326.js';
import {seaMaterial} from '../sea-v158.js';

// terrain: a bay, an inland trench below sea level, hills; irregular triangles like the adaptive atlas
const terrain=new T.PlaneGeometry(400,300,37,29);terrain.rotateX(-Math.PI/2);terrain.translate(200,0,150);
const p=terrain.attributes.position;
for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);
 p.setX(i,x+(i%7?Math.sin(i*1.7)*2:0));p.setZ(i,z+(i%5?Math.cos(i*2.3)*2:0)); // jitter interior-ish vertices
 const bay=Math.hypot(x-90,z-150)<80?-4+Math.hypot(x-90,z-150)/14:2.5,trench=Math.abs(z-150)<12&&x>230&&x<360?-1.5:0;
 p.setY(i,bay+trench+Math.sin(x*.05)*.4);}
for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(x<1||x>399||z<1||z>299){p.setX(i,Math.round(x/400)*400||p.getX(i));}}
terrain.computeBoundingBox();
// natural (raw atlas) height: the trench is not natural, so it stays dry like a river bed
const game={atlasHeight:(x,z)=>Math.hypot(x-90,z-150)<80?-4+Math.hypot(x-90,z-150)/14:2.5};
const old=atlasSeaGeometryV326(game,terrain),oldDepth=old.attributes.aDepth.array,oldIndex=old.index.array;
const map=atlasSeaDepthTextureV352(game,terrain,{texel:1});
assert.equal(map.texture.type,T.HalfFloatType);assert.equal(map.texture.format,T.RGFormat);
assert.equal(map.stats.triangles,oldIndex.length/3,'the texture covers exactly the triangles the V348 sea kept');
assert.ok(map.stats.computed<p.count,'the natural height is only computed near water');
// at every texel centre inside a kept triangle: same depth/shore as the V326 varyings
const {width:w,height:h,depth,shore}=map,b=terrain.boundingBox,sx=(b.max.x-b.min.x)/w,sz=(b.max.z-b.min.z)/h;
const smooth=d=>{const t=Math.max(0,Math.min(1,d/3.6));return 1-t*t*(3-2*t);};
const P=old.attributes.position;let checked=0,wetTexels=0;
for(let k=0;k<oldIndex.length;k+=3){
 const v=[oldIndex[k],oldIndex[k+1],oldIndex[k+2]],X=v.map(i=>P.getX(i)),Z=v.map(i=>P.getZ(i)),D=v.map(i=>oldDepth[i]);
 const cx=(X[0]+X[1]+X[2])/3,cz=(Z[0]+Z[1]+Z[2])/3,i=Math.floor((cx-b.min.x)/sx),j=Math.floor((cz-b.min.z)/sz);
 const tx=b.min.x+(i+.5)*sx,tz=b.min.z+(j+.5)*sz;
 const area=(X[1]-X[0])*(Z[2]-Z[0])-(Z[1]-Z[0])*(X[2]-X[0]);
 const w0=((X[1]-tx)*(Z[2]-tz)-(Z[1]-tz)*(X[2]-tx))/area,w1=((X[2]-tx)*(Z[0]-tz)-(Z[2]-tz)*(X[0]-tx))/area,w2=1-w0-w1;
 if(Math.min(w0,w1,w2)<.02)continue; // texel centre on an edge: either neighbour may own it
 const d=w0*D[0]+w1*D[1]+w2*D[2],s=w0*smooth(D[0])+w1*smooth(D[1])+w2*smooth(D[2]);
 assert.ok(Math.abs(depth[j*w+i]-d)<1e-4,'depth at texel '+i+','+j);assert.ok(Math.abs(shore[j*w+i]-s)<1e-4,'shore factor at texel '+i+','+j);checked++;
}
for(let i=0;i<w*h;i++)if(depth[i]>SEA_DRY_LIMIT_V348)wetTexels++;
assert.ok(checked>200&&wetTexels>1000,'test covers the bay ('+checked+' triangles, '+wetTexels+' wet texels)');
// inland trench below sea level stays dry, open land stays dry
const at=(x,z)=>depth[Math.floor((z-b.min.z)/sz)*w+Math.floor((x-b.min.x)/sx)];
assert.ok(at(300,150)<=SEA_DRY_LIMIT_V348,'inland trench is not sea');assert.equal(at(330,40),SEA_DRY_TEXEL_V352,'dry land texel');
assert.ok(at(90,150)>3,'bay centre is deep');
// the plane covers the same area with few triangles
const plane=atlasSeaPlaneV352(map.box);plane.computeBoundingBox();
assert.ok(Math.abs(plane.boundingBox.min.x-b.min.x)<1e-3&&Math.abs(plane.boundingBox.max.z-b.max.z)<1e-3&&Math.abs(plane.boundingBox.max.y)<1e-9&&Math.abs(plane.boundingBox.min.y)<1e-9,JSON.stringify(plane.boundingBox));
assert.ok(plane.index.count/3<1000);
// shader: depth and shore factor from the texture, no aDepth attribute, same discard rule
const compile=m=>{const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader);return {shader,key:m.customProgramCacheKey()};};
const tex=compile(seaMaterial({scale:1,depthMap:map})),vert=compile(seaMaterial({scale:1}));
assert.ok(!tex.shader.vertexShader.includes('aDepth')&&vert.shader.vertexShader.includes('attribute float aDepth'));
assert.ok(tex.shader.fragmentShader.includes('texture2D(uSeaDepthV352,(vL149P.xz-uSeaDepthBoxV352.xy)/uSeaDepthBoxV352.zw).rg'));
assert.ok(tex.shader.fragmentShader.includes('if(wetV326<.008)discard'));
assert.strictEqual(tex.shader.uniforms.uSeaDepthV352.value,map.texture);assert.notEqual(tex.key,vert.key,'separate shader programs');
for(const part of ['float ph1=fract(t*.22)','vL251Grad=vec2(rx-ripple,rz-ripple)/e','uWaterSky*(.78+.22*vL149Ripple)','vec3 sea=mix(uWaterDeepV326,uWaterShallowV326,pow(vL149S,2.2)*.85)'])assert.ok(tex.shader.fragmentShader.includes(part),part);
// wiring: WebGL uses the plane, WebGPU keeps the V326 mesh
const atlas=readFileSync(new URL('../atlas-style.js',import.meta.url),'utf8');
assert.ok(atlas.includes('const depthMapV352=T.GPU_MODE_V225?null:atlasSeaDepthTextureV352(game,seaSource,{texel:SEA_TEXEL_V352})'));
assert.ok(atlas.includes('const geo=depthMapV352?atlasSeaPlaneV352(depthMapV352.box):atlasSeaGeometryV326(game,seaSource)'));
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const key of ['"./atlas-sea-v326.js": "./atlas-sea-v326.js?v=352"','"./sea-v158.js?v=161a": "./sea-v158.js?v=352"','"./landscape-v149.js": "./landscape-v149.js?v=352"'])assert.ok(index.includes(key),key);
console.log('PASS V352 world sea depth texture equals the V326 sea mesh values ('+checked+' triangles checked)');
