// V360 stage 1 – patch current V359 designer and model cache.
import fs from 'node:fs';
const file='majaehitaja/index.html';
let source=fs.readFileSync(file,'utf8');
const a=source.indexOf('  function highStoneWall(from,to,index,access,joins){');
const b=source.indexOf('  function buildFence(fence,index,access,corners){',a);
if(a<0||b<0||source.indexOf('  function highStoneWall(from,to,index,access,joins){',a+1)>=0)throw Error('Unexpected highStoneWall source');
const replacement=fs.readFileSync('tools/stone-fortifications-v360/highstone-v360.txt','utf8');
source=source.slice(0,a)+replacement+source.slice(b);
const old='const wallWalk={width:1.18,deck:2.22,parapet:.68};';
if(!source.includes(old))throw Error('Expected original V359 wall specification');
source=source.replace(old,'const wallWalk={width:1.18,deck:2.22,parapet:1.04};');
fs.writeFileSync(file,source,'utf8');
const path='house-designs-v354.js';
let designs=fs.readFileSync(path,'utf8');
if(!designs.includes("MODEL_VERSION='359a'")||!designs.includes("?v=359a"))throw Error('Expected V359 model cache');
designs=designs.replace("MODEL_VERSION='359a'","MODEL_VERSION='360a'").replace("?v=359a","?v=360a");
fs.writeFileSync(path,designs,'utf8');
console.log('V360 stage1: actual inner and outer stone parapets, cache 360a');
