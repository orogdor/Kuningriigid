import assert from 'node:assert/strict';
import {NORDIC_COUNTRIES,NORDIC_NAME_SOURCES,NORDIC_VILLAGE_NAMES,countryForTeam,nordicVillageName} from './folklore-village-names-v164.js';
import {Civilization,createGame} from './civilization-core.js';
assert.equal(NORDIC_VILLAGE_NAMES.length,6);
assert.deepEqual(NORDIC_COUNTRIES,['Eesti','Soome','Rootsi','Norra','Taani','Island']);
assert.equal(NORDIC_NAME_SOURCES.length,6);
assert.equal(countryForTeam(0),'Eesti');
assert.equal(countryForTeam(1),'Soome');
assert.equal(countryForTeam(2),'Rootsi');
assert.equal(countryForTeam(3),'Norra');
const namesAcrossCountries=NORDIC_VILLAGE_NAMES.flat();
assert.equal(new Set(namesAcrossCountries).size,namesAcrossCountries.length,'Country-specific names must never be shared');
for(const team of [0,1,2,3,4,5]){
 const original=NORDIC_VILLAGE_NAMES[team];
 assert.ok(original.length>=12,'Each region needs names for at least 12 cities');
 assert.equal(new Set(original).size,original.length,'No duplicate within a region');
 const seen=[];
 for(let cityNumber=1;cityNumber<=12;cityNumber++){
  const name=nordicVillageName({seed:142023,team,cityNumber,existingNames:seen});
  assert.ok(original.includes(name),'A new village must use its culture-specific pool');
  assert.ok(!seen.includes(name),'Village names cannot be repeated');
  assert.equal(name,nordicVillageName({seed:142023,team,cityNumber,existingNames:seen}));
  seen.push(name);
 }
 const used=original.slice();
 const afterPool=nordicVillageName({seed:142023,team,cityNumber:original.length+1,existingNames:used});
 assert.ok(!used.includes(afterPool)&&/ 2$/.test(afterPool),'Exhausted pools should produce unique readable numbered names');
}
const custom=nordicVillageName({seed:142023,team:1,cityNumber:3,factionNames:['Kadaka','Omavalitud']});
assert.equal(custom,'Omavalitudküla 3','User-selected faction naming still works');
const game=new Civilization(createGame(142023));
for(let turn=0;turn<20;turn++)for(let step=0;step<5;step++)game.tick(12);
const towns=game.s.cities.filter(c=>c.team>0);
assert.ok(towns.length>=3,'Real AI must still be able to found towns');
for(const town of towns)assert.ok(NORDIC_VILLAGE_NAMES[town.team].includes(town.name),
 'AI-founded name matches its saga traditions: '+town.name);
const old=game.s.cities[0],previous=old.name;
const loaded=new Civilization(JSON.parse(JSON.stringify(game.s)));
assert.equal(loaded.s.cities[0].name,previous,'Save/reload never renames an existing village');
console.log('V165 COUNTRY NAMES PASS',JSON.stringify(towns.map(c=>({team:c.team,name:c.name}))));
