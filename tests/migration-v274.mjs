// V274: Migration of Peoples - first game minute: no town can be built, the site can be chosen, bands move 5x;
// at the start of the Stone Age the first town appears on the chosen site and the scout appears there.
import {Civilization,createGame,MIGRATION_SPEED_V274,MIGRATION_SECONDS_V274} from '../civilization-core.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(Object.assign(createGame(20261102),{migrationV274:{until:60}}));
ok(g.migrationActiveV274(),'migration is active at the start');ok(MIGRATION_SPEED_V274===7.5&&MIGRATION_SECONDS_V274===120,'two minutes, 7.5x speed');
const a=g.s.settlers.find(s=>s.team===0);
ok(!g.land(a.id),'band can stop on its tile');
let pick=null;for(let x=-16;x<=16&&!pick;x+=4)for(let z=-16;z<=16&&!pick;z+=4)if(!g.siteRule(a,{x,z}))pick={x,z};
ok(pick,'a dry site exists');a.x=pick.x;a.z=pick.z;
const r=g.found(a.id);
ok(r.chosen&&!r.city,'during the migration found() only chooses the site');
ok(!g.s.cities.some(c=>c.team===0),'no town yet');
ok(a.chosenSiteV274&&a.chosenSiteV274.x===pick.x,'site remembered');
// the scout walks hidden inside the band
g.tick(1);const army=g.s.armies.find(x=>x.team===0);ok(army.hiddenInBandV274&&army.c===a.c&&army.r===a.r,'scout travels hidden with the band');
for(let i=0;i<70;i++)g.tick(1);
ok(!g.migrationActiveV274(),'migration over after one minute');
const city=g.s.cities.find(c=>c.team===0);
ok(city,'first town founded at the start of the Stone Age');
const hall=city.economy.buildings.find(b=>b.type==='hall');
ok(Math.hypot(hall.x-pick.x,hall.z-pick.z)<=1,'town on the chosen site');
ok(!army.hiddenInBandV274&&army.c===city.c&&army.r===city.r,'scout appears at the new town');
for(let i=0;i<45;i++)g.tick(1); // regression: the town's first minutes must tick without errors (V276 regrowth fix)
console.log('migration V274 ok:',city.name,'ai towns',g.s.cities.filter(c=>c.team>0).length);
