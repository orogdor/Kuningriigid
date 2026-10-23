import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization} from './civilization-core.js';
import {isShore} from './fishery.js';
import {coastalPlacement} from './resource-sites-v88.js';
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v136.json')));
g.refreshTerritory();let coastalTiles=0,validSites=0,previewSuccess=0,built=false,details=null;
for(const city of g.s.cities){
 if(built)break;
 const team=city.team,stock=city.economy.realms[team].resources;
 for(let dc=-4;dc<=4&&!built;dc++)for(let dr=-4;dr<=4&&!built;dr++){
  const p={c:city.c+dc,r:city.r+dr},cell=g.cell(p);
  if(!cell?.land||g.territoryOwner(p)?.id!==city.id||!isShore(g,p))continue;
  coastalTiles++;const ctx=g.contextAt(p,true),sites=g.buildingSites(ctx,'harbor');
  for(const at of sites.slice(0,12)){
   const shore=coastalPlacement(g,cell,'harbor',at);
   assert.ok(!shore.error,'candidate from shoreline search must validate again');
   validSites++;
   if(g.buildRule(ctx,'harbor'))continue;
   // Explicit unit-test funding only, never persisted in the natural AI scenario.
   for(const k of ['wood','plank','stone'])stock[k]=Math.max(stock[k]||0,400);
   const valid=g.previewBuild(ctx,'harbor',at);
   if(valid.error)continue;
   previewSuccess++;
   const result=g.build(ctx,'harbor',at);
   assert.ok(result.building,'valid AI coast candidate can really be built');
   assert.equal(result.building.type,'harbor');assert.ok(result.building.landEntry,'pier retains a dry door');
   details={town:city.name,tile:[p.c,p.r],position:shore.p};
   built=true;break;
  }
 }
}
assert.ok(coastalTiles>0&&validSites>0,'coast should expose physically valid shipyard plots');
assert.ok(built,'pier can be constructed at a real coastline without blocking access');
console.log('V136 HARBOR PASS',JSON.stringify({coastalTiles,validSites,previewSuccess,details}));
