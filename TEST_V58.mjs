import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './vendor/three.module.js';
import {createWorldAtlasProps} from './world-props.js';

// V58 regression: prop quotas must not empty the lower half of a large world.
const cells=[];
for(let i=0;i<600;i++)cells.push({c:i,r:0,x:i*20,z:0,land:true,mountain:true,biome:'hills'});
for(let i=0;i<600;i++)cells.push({c:i,r:1,x:i*20,z:20,land:true,mountain:false,biome:'forest'});
for(let i=0;i<145;i++)cells.push({c:i,r:2,x:i*20,z:40,land:true,mountain:false,biome:'plains',river:true,bridge:true,riverDir:'h'});
const discovered=new Set();
function makeGame(){return {cells,s:{visionRevision:0},noise:()=>.99,atlasHeight:()=>3,seen:(_team,cell)=>discovered.has(cell.c+':'+cell.r)}}
const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>{const data=await fs.readFile(new URL(url,import.meta.url));return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}};
try{
 const [low,medium,high]=await Promise.all(['low','medium','high'].map(async quality=>{
  const game=makeGame(),props=createWorldAtlasProps(game,new T.Group(),quality);
  assert.equal(await props.initialized,true,'V58 GLB files must load');
  assert.equal(props.ready,true);
  return {game,props};
 }));
 assert.deepEqual(low.props.counts,{rock:130,forest:110,bridge:120});
 assert.deepEqual(medium.props.counts,{rock:195,forest:165,bridge:120});
 assert.deepEqual(high.props.counts,{rock:260,forest:220,bridge:120});
 const rock=low.props.group.children.find(o=>o.userData.worldProp==='rock');
 const bridge=low.props.group.children.find(o=>o.userData.worldProp==='bridge');
 assert.ok(rock&&bridge);
 const first=new T.Matrix4(),last=new T.Matrix4();
 rock.getMatrixAt(0,first);
 rock.getMatrixAt(low.props.counts.rock-1,last);
 assert.ok(first.elements[12]<300,'first prop should be near northern/start end of cell order');
 assert.ok(last.elements[12]>11000,'last prop should reach the far end of the world');
 assert.equal(first.elements[0],0,'unexplored rock must be hidden');
 assert.equal(last.elements[0],0,'unexplored distant rock must be hidden');
 const remoteCell=cells[597];discovered.add(remoteCell.c+':'+remoteCell.r);low.game.s.visionRevision++;
 low.props.update();
 rock.getMatrixAt(low.props.counts.rock-1,last);
 assert.ok(last.elements[0]!==0||last.elements[2]!==0||last.elements[10]!==0,'newly discovered distant prop must be visible');
 assert.equal(bridge.count,120,'bridges retain full quality-independent quota');
 console.log('V58 PASS: map-wide distribution, quality quotas, fog discovery, all GLBs and bridges');
}finally{globalThis.fetch=oldFetch}
