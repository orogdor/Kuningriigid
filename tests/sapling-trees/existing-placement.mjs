import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../../vendor/three.module.js';
import {createAtlasBiomeDetail} from '../../atlas-biomes-v47.js';
import {bakeDetails} from '../../world-details.js';
import {DETAIL_X,DETAIL_Z} from '../../detail-scale-v123.js';
import {placementsFromInstances,projectPlacements} from '../../experiments/sapling-trees/forest.js';
const noise=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+77*.017)*43758.5453;return n-Math.floor(n)};
const cells=[];for(let r=0;r<9;r++)for(let c=0;c<9;c++)cells.push({c,r,x:c*50,z:r*50,h:20,land:true,river:false,biome:['forest','taiga','jungle'][c%3],visualBiome:['forest','taiga','jungle'][c%3]});
const game={cells,noise,startLocations:[],cell:({c,r})=>cells.find(p=>p.c===c&&p.r===r),s:{geographyVersion:7,seed:77}};
const group=new T.Group();createAtlasBiomeDetail(game,group,'high',()=>20);group.updateMatrixWorld(true);
const species=new Set(['pine','spruce','oak','lime','birch','palm']),sources=[];
for(const child of group.children){const source=child.userData.spatialBatch?child.children[0]:child;if(species.has(source.userData.v152Model))sources.push(source);}
let count=0;for(const source of sources){const before=source.instanceMatrix.array.slice(),ids=Array.from({length:5},(_,i)=>source.userData.v152Model+'_'+String(i+1).padStart(2,'0'));const p=placementsFromInstances(source,ids);assert.equal(p.length,source.count);const projected=projectPlacements(p,{originX:100,originZ:100,unitsX:DETAIL_X,unitsZ:DETAIL_Z,unitsY:.3});for(let i=0;i<p.length;i++){assert.ok(Math.abs(projected[i].x/DETAIL_X+100-p[i].x)<1e-9);assert.ok(Math.abs(projected[i].z/DETAIL_Z+100-p[i].z)<1e-9);assert.ok(Math.abs(p[i].y-20)<1e-5);}assert.deepEqual(source.instanceMatrix.array,before);count+=p.length;}
bakeDetails(cells,()=>20,77,{treesByBiomeV250:true});const detailCount=cells.reduce((n,c)=>n+c.detail.resources.length,0);assert.ok(count>200&&detailCount>5000);assert.equal(sources.length,6);console.log('Actual game placement functions:',count,'world tree instances;',detailCount,'detail resources; six species; original matrices unchanged; anisotropic coordinates round-trip');

fs.writeFileSync('reports/sapling-trees-placement.json',JSON.stringify({passed:true,seed:77,worldInstances:count,detailResources:detailCount,species:sources.length,originalMatricesUnchanged:true,worldDetailScale:{x:DETAIL_X,z:DETAIL_Z,y:.3}},null,2));
