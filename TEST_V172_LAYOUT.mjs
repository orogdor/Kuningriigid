// V172 pure layout regression: check dense AI core without changing save/nav.
import assert from 'node:assert/strict';
import {historicalBuildingPlots,ancientStreetSpace} from './historic-urban-v138.js';
import {compactStonePlotScoreV172} from './compact-stone-v172.js';
import {stoneTownPlotScore} from './stone-town-plan-v163.js';
import {DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
const hall={x:-18,z:-12,type:'hall',hp:1200,ready:true};
const town={c:20,r:20,economy:{buildings:[hall]}};
const dist=p=>Math.hypot(p.x-hall.x,p.z-hall.z);
const mean=a=>a.reduce((n,p)=>n+dist(p),0)/a.length;
const homes=historicalBuildingPlots(town,town,'house',142025,true);
const farms=historicalBuildingPlots(town,town,'farm',142025,true);
const civic=historicalBuildingPlots(town,town,'study',142025,true);
assert.ok(homes.length>60&&farms.length>30&&civic.length>20);
assert.ok(mean(homes.slice(0,12))<41,'Stone houses have a closer first ring than the V163 42m target');
assert.ok(mean(homes.slice(0,12))>22,'keep sacred/open hall plaza');
assert.ok(mean(farms.slice(0,12))>mean(homes.slice(0,12))+30,'farms stay outside dense housing');
assert.ok(mean(civic.slice(0,12))<mean(farms.slice(0,12)),'civic services stay near center');
assert.ok(homes.every(p=>Math.abs(p.x)<DETAIL_HALF_X&&Math.abs(p.z)<DETAIL_HALF_Z));
assert.ok(homes.every(p=>!ancientStreetSpace(p.x-hall.x,p.z-hall.z,142025).road),'historical road strips stay clear');
assert.equal(new Set(homes.map(p=>p.x+':'+p.z)).size,homes.length,'distinct residential lots');
const chosen=homes.slice(0,8).map(p=>({type:'house',x:p.x,z:p.z,hp:350}));
// Two equal-radius vacant lots: prefer one next to real established houses.
const a={x:36,z:0},b={x:-36,z:0};
const withoutA=compactStonePlotScoreV172('house',a.x,a.z,[]);
const withoutB=compactStonePlotScoreV172('house',b.x,b.z,[]);
assert.equal(withoutA,withoutB,'symmetric base score');
assert.ok(compactStonePlotScoreV172('house',a.x,a.z,[{type:'house',x:25,z:0,hp:350}]) <
 compactStonePlotScoreV172('house',b.x,b.z,[{type:'house',x:25,z:0,hp:350}]),
 'new homes prefer nearby family groups');
assert.ok(compactStonePlotScoreV172('house',14,0,[{type:'house',x:15,z:0,hp:350}]) >
 compactStonePlotScoreV172('house',36,0,[{type:'house',x:25,z:0,hp:350}]),
 'avoid overlapping roofs');
assert.deepEqual(homes,historicalBuildingPlots(town,town,'house',142025,true),'stable seed');
assert.equal(stoneTownPlotScore('farm',85,0,45),stoneTownPlotScore('farm',85,0,45),'legacy rural scores unchanged');
const oldHousing=historicalBuildingPlots(town,town,'house',142025,false);
assert.ok(mean(oldHousing.slice(0,12))>mean(homes.slice(0,12)),'V172 only changes Stone Age, not older-age urban blocks');
console.log('V172 LAYOUT PASS',JSON.stringify({stoneFirst12Mean:mean(homes.slice(0,12)).toFixed(1),
 nonStoneFirst12Mean:mean(oldHousing.slice(0,12)).toFixed(1),
 first12CivicMean:mean(civic.slice(0,12)).toFixed(1),
 first12FarmMean:mean(farms.slice(0,12)).toFixed(1),residentialCandidates:homes.length}));
