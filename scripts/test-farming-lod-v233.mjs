// V233 verifies fields on ordinary dry land and simplified, textured far meshes.
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {simplifyStoneFarGeometry} from '../stone-near-lod.js';
import {validateField} from '../farming-v127.js';
import {terrainYields} from '../terrain-economy.js';
const ctx={economy:{buildings:[]},world:{resources:[]}},field={x:0,z:0,width:16,depth:16};
assert.equal(validateField(ctx,field,()=>true),'');
assert.match(validateField(ctx,field,()=>false),/kuival/);
const fake=fertile=>({cols:3,rows:3,cells:Array.from({length:9},(_,i)=>({c:i%3,r:Math.floor(i/3),land:true,biome:'plains',deposits:{grain:i===4&&fertile}})),cell(p){return this.cells[p.r*this.cols+p.c];}});
assert.ok(terrainYields(fake(true),{c:1,r:1}).farm>1);
assert.equal(terrainYields(fake(false),{c:1,r:1}).farm,undefined);
const size=81,verts=[],uv=[],faces=[];
for(let z=0;z<size;z++)for(let x=0;x<size;x++){verts.push(x/size,Math.sin(x*.12)*.03+Math.cos(z*.1)*.03,z/size);uv.push(x/(size-1),z/(size-1));}
for(let z=0;z<size-1;z++)for(let x=0;x<size-1;x++){const a=z*size+x,b=a+1,c=a+size,d=c+1;faces.push(a,c,b,b,c,d);}
const high=new T.BufferGeometry();
high.setAttribute('position',new T.Float32BufferAttribute(verts,3));
high.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
high.setIndex(faces);high.computeBoundingBox();
const far=simplifyStoneFarGeometry(high);
assert.ok(far.getIndex().count<high.getIndex().count*.8,'far triangle count');
assert.ok(far.getAttribute('uv'),'far UVs');
assert.ok(far.getIndex().count>=12,'far triangles retained');
console.log('V233 field + derived distant LOD PASS',high.getIndex().count,far.getIndex().count);
