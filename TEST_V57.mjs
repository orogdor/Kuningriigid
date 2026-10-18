import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './vendor/three.module.js';
import {createWorldAtlasProps} from './world-props.js';
const samples=[{c:2,r:2,x:100,z:100,land:true,mountain:true,biome:'hills'},{c:3,r:3,x:150,z:150,land:true,mountain:false,biome:'forest'},{c:4,r:4,x:200,z:200,land:true,biome:'plains',river:true,bridge:true,riverDir:'h'},{c:5,r:5,x:250,z:250,land:true,biome:'forest'}];
let discovered=new Set();const game={cells:samples,s:{visionRevision:0},noise:(a,b)=>.99,atlasHeight:()=>3,seen:(team,cell)=>discovered.has(cell.c+':'+cell.r)};
const oldFetch=globalThis.fetch;globalThis.fetch=async (url)=>{const data=await fs.readFile(new URL(url,import.meta.url));return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}};
try{
 const scene=new T.Group(),props=createWorldAtlasProps(game,scene,'medium');assert.equal(await props.initialized,true);
 assert.equal(props.ready,true);assert.equal(props.group.children.length>=3,true);
 assert.equal(props.landmark('village')?.isGroup,true);assert.equal(props.landmark('ruins')?.isGroup,true);
 assert.equal(props.group.children.every(o=>o.isInstancedMesh),true);
 const rock=props.group.children.find(o=>o.userData.worldProp==='rock');assert.ok(rock);const mat=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();rock.getMatrixAt(0,mat);mat.decompose(v,q,scale);assert.equal(scale.x,0,'not discovered props hidden');
 discovered.add('2:2');game.s.visionRevision++;props.update();rock.getMatrixAt(0,mat);mat.decompose(v,q,scale);assert.ok(scale.x>1,'discovered props displayed');
 console.log('V57 PASS: all five GLB assets opened, landmark templates and instancing, undiscovered prop masking');
}finally{globalThis.fetch=oldFetch}
