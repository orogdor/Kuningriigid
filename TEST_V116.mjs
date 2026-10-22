import assert from 'node:assert/strict';
import {Civilization,TROOPS,BUILD_AGE,BUILDINGS} from './civilization-core.js?v=116a';
import {TECHS,UNIT_TECH,BUILD_TECH} from './research.js?v=116a';
import {unitSuccessor,buildingSuccessor,suppliesBuilding,ballistaUnlocked,craftError} from './era-availability-v116.js?v=116a';
import {createBronzeSiegeState,createIronSiegeState} from './bronze-siege-demo-v108.js?v=116a';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js?v=116a';
import {startSiegeCraft,planSiegeAI} from './siege-assault-v108.js?v=116a';
const s=createBronzeSiegeState(),g=new Civilization(s),city=s.cities.find(c=>c.team===0),known=s.research[0].known;
assert.ok(s.units.every(u=>TROOPS[u.kind].age<=1));assert.ok(s.battle.defensePosts.every(p=>!p.ballista));assert.ok(!ballistaUnlocked(s,1));assert.ok(craftError(s,0,'tower'));assert.ok(craftError(s,0,'ram'));assert.equal(craftError(s,0,'ladder'),'');
const open=createBronzeBattleState();assert.ok(open.units.every(u=>TROOPS[u.kind].age<=1));assert.ok(!open.units.some(u=>['bronze_cavalry','bronze_catapult'].includes(u.kind)));
assert.equal(TROOPS.bronze_catapult.age,2);assert.equal(UNIT_TECH.bronze_catapult,'ancient_artillery');assert.equal(TROOPS.battering_ram.age,2);assert.equal(TROOPS.siege_tower.age,2);assert.equal(BUILD_AGE.siegeworkshop,2);
// Discovery applies nationally, even in a city without the new recruitment building.
known.push('bronze');assert.equal(g.obsoleteUnit(0,'spearman'),'bronze_spearman');assert.match(g.recruit(city,'spearman').error,/Asendatud/);
s.ages[3]=0;s.research[3].known=[];assert.equal(g.obsoleteUnit(3,'archer'),null);s.ages[3]=1;s.research[3].known=['bronze'];assert.equal(g.obsoleteUnit(3,'archer'),'bronze_archer');
assert.match(g.recruit(city,'bronze_catapult').error,/Uuri|avatud/);
known.push('writing');assert.equal(g.obsoleteBuilding(0,'study'),'scriptorium');assert.match(g.buildRule(city,'study'),/Asendatud/);
assert.equal(g.obsoleteBuilding(0,'lumber'),null);assert.equal(g.obsoleteBuilding(0,'quarry'),null);assert.equal(g.obsoleteBuilding(0,'hunter'),null);
for(const type of ['palisade','stonewall','reinforced_wall'])assert.equal(g.obsoleteBuilding(0,type),null);
assert.ok(!BUILDINGS.scriptorium.requires.includes('study'));
s.ages[0]=3;known.push('iron','smithing','civics','armor_craft','knighthood','philosophy','scholasticism');assert.equal(g.obsoleteBuilding(0,'study'),'university');assert.equal(g.obsoleteUnit(0,'spearman'),'man_at_arms');
assert.ok(suppliesBuilding('university','study'));assert.ok(!suppliesBuilding('study','university'));
city.economy.buildings.push({type:'university',team:0,hp:350,ready:true,x:20,z:20});assert.ok(g.cityReady(city,'study'));assert.ok(g.cityReady(city,'scriptorium'));assert.ok(g.cityReady(city,'academy'));
// A newly founded later-era city can build the current school directly.
assert.ok(!BUILDINGS.university.requires.includes('academy'));assert.ok(!BUILDINGS.polytechnic.requires.includes('university'));assert.ok(!BUILDINGS.laboratory.requires.includes('polytechnic'));
const iron=createIronSiegeState();assert.ok(iron.units.every(u=>TROOPS[u.kind].age<=2));assert.ok(iron.units.some(u=>u.kind==='bronze_catapult'));assert.ok(iron.units.some(u=>u.kind==='cavalry'));assert.ok(iron.battle.defensePosts.every(p=>p.ballista));assert.ok(ballistaUnlocked(iron,1));assert.equal(craftError(iron,0,'tower'),'');
// No resources are spent on out-of-era construction, and automated planning respects it.
const bronze=createBronzeSiegeState(),u=bronze.battle.squads.find(u=>u.team===0&&u.kind==='bronze_spearman'),stock=bronze.cities.find(c=>c.team===0).economy.realms[0].resources;const wood=stock.wood;assert.ok(startSiegeCraft(bronze.battle,u,'tower',bronze).error);assert.equal(stock.wood,wood);for(let i=0;i<8;i++){bronze.battle.elapsed=6+i*13;planSiegeAI(bronze.battle,bronze);}assert.ok((bronze.battle.siegeWorks||[]).every(w=>!['tower','ram'].includes(w.kind)));
const unitBefore=JSON.stringify(bronze.units),buildingsBefore=JSON.stringify(city.economy.buildings);g.obsoleteBuilding(0,'study');g.obsoleteUnit(0,'spearman');assert.equal(JSON.stringify(bronze.units),unitBefore);assert.equal(JSON.stringify(city.economy.buildings),buildingsBefore);
for(let age=0;age<=6;age++){const defs=Object.entries(TROOPS).filter(([k,d])=>d.age===age&&!['scout','militia','bronze_cavalry'].includes(k));assert.ok(defs.length>=4,'at least four era-appropriate units: '+age);}
console.log('V116 PASS: Bronze/Iron rosters and machines; national technology-based replacement; API rejection before spending; newer buildings satisfy old prerequisites; no new-town school deadlock; distinct resource chains and three wall tiers; automatic siege age locks; existing armies/buildings preserved; four units per age.');
