import assert from 'node:assert/strict';
import {treeMixV329,pickTreeV329,detailCompanionsV329} from '../forest-ecology-v329.js';
import {saplingSpeciesV328} from '../sapling-trees-v328.js';
import {createAtlasBiomeDetail} from '../atlas-biomes-v47.js';
import * as T from '../vendor/three.module.js';
const cases=[['forest',['oak','lime','birch']],['taiga',['spruce','pine','birch']],['jungle',['palm']],['tundra',['birch','spruce','pine']],['lush_river',['oak','lime','birch']],['desert',[]],['snow',[]],['sea',[]]];
for(const [biome,allowed]of cases){
 const cell={visualBiome:'coastal_'+biome,c:4,r:5};
 assert.deepEqual(treeMixV329(cell).map(x=>x[0]).sort(),allowed.sort());
 for(let seed=0;seed<1000;seed++)assert.ok(allowed.includes(saplingSpeciesV328(cell,seed))||(!allowed.length&&saplingSpeciesV328(cell,seed)===null));
 assert.equal(detailCompanionsV329(cell,{id:3,x:10,z:30}).length,['forest','taiga','jungle'].includes(biome)?1:0);
}
assert.equal(pickTreeV329({visualBiome:'desert',river:true},.9),'palm');
assert.ok(treeMixV329({visualBiome:'forest',visualClimate:{heat:.3}}).some(([k])=>k==='spruce'));
assert.ok(treeMixV329({visualBiome:'forest',visualClimate:{heat:.6,moisture:.3}}).some(([k])=>k==='pine'));
const noise=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+77*.017)*43758.5453;return n-Math.floor(n)};
const counts={};
for(const biome of ['forest','taiga','jungle']){
 const cells=Array.from({length:100},(_,i)=>({c:i%10,r:Math.floor(i/10),x:(i%10)*50,z:Math.floor(i/10)*50,h:20,land:true,biome,visualBiome:biome}));
 const game={cells,noise,startLocations:[],cell:({c,r})=>cells.find(p=>p.c===c&&p.r===r),s:{geographyVersion:7,seed:77}},group=new T.Group();
 createAtlasBiomeDetail(game,group,'high',()=>20);
 const roots=group.children.filter(o=>o.sourceSaplingV328);counts[biome]=roots.reduce((n,o)=>n+o.sourceSaplingV328.count,0);
 assert.ok(counts[biome]>4500,biome+' dense world stands');
 for(const root of roots)assert.ok(treeMixV329(biome).some(([k])=>k===root.userData.saplingV328));
}
console.log('PASS V329 shared habitats, 8000 detail species samples, cold/dry forest, oasis, deterministic companions and dense world counts',counts);
// Exercise the actual game's resource decorator with dry terrain, water, slopes and farms.
const {readFileSync}=await import('node:fs');
const source=readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function addForestResourceV329('),source.indexOf('function resourceView('));
const fakeTree=(parent,x,y,z,seed,scale)=>{const tree=new T.Group();tree.position.set(x,y,z);tree.scale.setScalar(scale);parent.add(tree);return tree;};
const cell={c:2,r:3,x:100,z:150,visualBiome:'forest'},r={id:19,x:40,z:40,amount:32},saved=JSON.stringify(r);
function decorate({height=()=>3,water={distance:100,width:1},buildings=[]}={}){
 const fn=new Function('addTree','game','ground','detailCompanionsV329','riverNear','DETAIL_X','DETAIL_Z','DETAIL_HALF_X','DETAIL_HALF_Z','buildingClearance','fieldSize',body+';return addForestResourceV329;')(
 fakeTree,{contextAt:()=>({economy:{buildings}})},(_tile,x,z)=>height(x,z),detailCompanionsV329,()=>water,4.5,3.9,112.5,97.5,b=>({rx:5,rz:5}),()=>({width:30,depth:30}));
 const root=new T.Group();fn(root,r,cell);return root;
}
assert.equal(decorate().children.length,2);
assert.equal(decorate({water:{distance:0,width:3}}).children.length,1);
assert.equal(decorate({height:(x,z)=>x===r.x&&z===r.z?3:8}).children.length,1);
assert.equal(decorate({buildings:[{type:'field',x:40,z:40,hp:100}]}).children.length,1);
assert.equal(JSON.stringify(r),saved,'rendering never edits saved resources');
console.log('PASS actual detail forest decoration: companions, water, steep slopes, farms and unchanged save');
