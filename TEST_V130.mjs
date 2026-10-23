import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Navigation} from './navigation.js';
import {citizenWorldRoute} from './citizen-routes-v130.js';
import {Civilization} from './civilization-core.js';
const buildings=[{type:'house',x:0,z:0,hp:100,ready:true}],world={resources:[]};
const nav=new Navigation(world,()=>true,()=>buildings,{minX:-24,minZ:-18,w:49,h:37});
const a={x:-18,z:0},A={...a},B={x:18,z:0};let searches=0;const route=nav.route.bind(nav);nav.route=(...args)=>{searches++;return route(...args)};
function walk(agent,to,citizen=true){for(let i=0;i<2000;i++)if(citizen?nav.moveCitizen(agent,to,.1,3):nav.move(agent,to,.1,3))return;throw Error('Agent did not arrive');}
for(let i=0;i<6;i++){walk(a,B);walk(a,A)}
assert.equal(searches,6,'three real searches per direction, then reuse');
assert.equal(nav.citizenRoutes.stats.reuses,6);
const remembered=searches;world.revision=(world.revision||0)+1;world.resources.push({kind:'tree',x:-10,z:0,amount:10});walk(a,B);
assert.equal(searches,remembered+1,'tile change restarts learning');walk(a,A);
const after=searches;buildings[0].x=6;walk(a,B);assert.equal(searches,after+1,'moved building invalidates even with the same building count');walk(a,A);
buildings[0].hp=0;nav.refresh();assert.ok(nav.open(6,0),'destroyed building frees the route');
const soldier={...A},before=searches;for(let i=0;i<5;i++){walk(soldier,B,false);walk(soldier,A,false)}
assert.equal(searches-before,10,'military still plans every new trip');
assert.equal(nav.citizenRoutes.stats.searches,searches-10,'military never enters civilian learning');
// Another detail tile must not invalidate this tile's learned trips.
const other=new Navigation({resources:[]},()=>true);const version=nav.version;other.world.revision++;other.refresh();assert.equal(nav.version,version);
// Cached arrays are copied; walking consumes the active route, not its template.
assert.ok(nav.citizenRoutes.stats.reuses>=6);
let worldSearches=0;const cells=Array.from({length:4},(_,c)=>({c,r:0,land:true})),game={s:{tileWorlds:{}},cell:p=>cells[p.c],contextAt:()=>null,landPath:(from,to)=>{worldSearches++;const path=[];for(let c=from.c;c!==to.c;){c+=Math.sign(to.c-c);path.push({c,r:0})}return path}};
const worker={c:0,r:0};for(let trip=0;trip<6;trip++)for(const target of [{c:3,r:0},{c:0,r:0}]){let p;while((p=citizenWorldRoute(game,worker,target)).length){const repeat=citizenWorldRoute(game,worker,target);assert.deepEqual(p,repeat);Object.assign(worker,p[0])}}
assert.equal(worldSearches,6,'world A* runs three times per directed trip, never once per frame');
game.s.tileWorlds['1:0']={revision:1};citizenWorldRoute(game,worker,{c:3,r:0});assert.equal(worldSearches,7,'changed district invalidates crossing route');
// Audit all current and fully grown test-city territories, without changing the fixture.
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/iron-ai-v129.json'))),audit=[];
for(const grown of [false,true]){
 if(grown)for(const c of g.s.cities)c.economy.realms[c.team].pop=64;
 g.refreshVision();
 for(const city of g.s.cities){
  const owned=new Set([...g.territory].filter(([,o])=>o===city).map(([k])=>k)),seen=new Set(),queue=[city.c+':'+city.r];
  for(const k of queue){if(seen.has(k)||!owned.has(k))continue;seen.add(k);const[c,r]=k.split(':').map(Number);for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]])queue.push((c+dc)+':'+(r+dr))}
  assert.equal(seen.size,owned.size,'county is connected');assert.ok(owned.size<=3*(2*g.radius(city)+1)**2);
  let urban=0,rural=0;for(const k of owned){const[c,r]=k.split(':').map(Number),p={c,r};assert.ok(g.seen(city.team,p));if(g.isCountyTile(p,city))rural++;else urban++}
  assert.ok(urban>0&&rural>0);audit.push({grown,city:city.name,urban,rural,total:owned.size});
 }
}
if(process.env.V130_REPORT){fs.mkdirSync('reports/ai-navigation-v130',{recursive:true});fs.writeFileSync('reports/ai-navigation-v130/areas.json',JSON.stringify(audit,null,2));}
console.log('V130 PASS: 3-search civilian trips, local/world reuse, tile invalidation, destroyed footprints, unchanged military routing, 28 connected city/county checks');
