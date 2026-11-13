import assert from 'node:assert/strict';
import {createAtlasTerrainV327,adaptiveAtlasSamplerV327} from '../atlas-terrain-v327.js';
import {atlasSeaGeometryV326,atlasGroundSamplerV326} from '../atlas-sea-v326.js';
const river=[{points:Array.from({length:30},(_,i)=>({x:i*4+10,z:100+20*Math.sin(i*.15),width:3}))}];
const height=(x,z)=>2+.007*x+.009*z;
const geo=createAtlasTerrainV327({width:200,depth:200,nx:12,nz:12,originX:0,originZ:0,rivers:river,height,maxLevel:3});
const p=geo.attributes.position,index=geo.index.array,sample=adaptiveAtlasSamplerV327(geo),fallback=atlasGroundSamplerV326(geo);
assert.ok(p.count<20000,'localized refinement, no full global fine grid');
for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-height(p.getX(i),p.getZ(i)))<1e-5);
for(let i=0;i<200;i++){const x=(i*37.13)%200,z=(i*11.17)%200;assert.ok(Math.abs(sample(x,z)-height(x,z))<1e-5);assert.equal(sample(x,z),fallback(x,z));}
// Every interior edge has two owners. Unpaired fine edges expose a T-junction/crack.
const counts=new Map();
for(let i=0;i<index.length;i+=3){const a=index[i],b=index[i+1],c=index[i+2];
 assert.notEqual(a,b);assert.notEqual(b,c);assert.notEqual(a,c);
 for(const [u,v] of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)+':'+Math.max(u,v);counts.set(key,(counts.get(key)||0)+1);}
}
for(const [key,count] of counts){assert.ok(count<=2);if(count===2)continue;const [a,b]=key.split(':').map(Number);
 const boundary=(x,z)=>Math.abs(x)<1e-5||Math.abs(x-200)<1e-5||Math.abs(z)<1e-5||Math.abs(z-200)<1e-5;
 assert.ok(boundary(p.getX(a),p.getZ(a))&&boundary(p.getX(b),p.getZ(b)),'no unpaired interior edge '+key);
}
const sea=atlasSeaGeometryV326({atlasHeight:()=>0},geo);assert.equal(sea.attributes.position.count,p.count);
// V348: same shared grid; only triangles that can never show water (all three depths <= -0.12) are left out.
{const d=sea.attributes.aDepth.array,kept=[];for(let i=0;i<index.length;i+=3){const t=[index[i],index[i+1],index[i+2]];if(t.some(k=>d[k]>-.12))kept.push(...t);}assert.deepEqual(Array.from(sea.index.array),kept);}
console.log('V327 adaptive atlas: conforming edges, shared sea grid, actual triangle sampler PASS',{vertices:p.count,triangles:index.length/3});
