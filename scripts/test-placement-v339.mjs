import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Navigation} from '../navigation.js';
import {Civilization} from '../civilization-core.js';
const navFor=bs=>new Navigation({resources:[],workers:{}},()=>true,()=>bs,{minX:-30,minZ:-30,w:61,h:61});
const house={type:'house',x:0,z:0,team:0,hp:100};
assert(navFor([house]).preservesAccess({type:'house',x:7,z:0,team:0}), 'houses can stand closer');
assert(!navFor([house]).preservesAccess({type:'house',x:5,z:0,team:0}), 'overlapping houses remain blocked');
for(const a of [0,Math.PI/4,Math.PI/2]){
 const wall={type:'palisade',x:0,z:0,team:0,hp:100,wallAngleV175:a,palisadeSpanV167:14,drawnWallV175:true};
 assert(navFor([wall]).preservesAccess({type:'watchtower',x:0,z:0,team:0}), 'tower on wall');
 assert(!navFor([wall]).preservesAccess({type:'house',x:0,z:0,team:0}), 'house on wall rejected');
 assert(!navFor([wall]).preservesAccess({type:'watchtower',x:0,z:0,team:1}), 'enemy wall rejected');
}
const state=JSON.parse(fs.readFileSync(new URL('../scenarios/ai-stone-v174.json',import.meta.url))),game=new Civilization(state),city=game.s.cities.find(c=>c.id===state.stoneTestV174.targetCityId);
Object.assign(city.economy.realms[city.team].resources,{wood:10000,stone:10000});
let found=false,last;
for(let z=-70;z<=70&&!found;z+=5)for(let x=-65;x<=65&&!found;x+=5){
 const p={x,z}; if(game.previewBuild(city,'watchtower',p).error)continue;
 const wall={type:'palisade',x,z,team:city.team,hp:350,ready:true,wallAngleV175:0,palisadeSpanV167:7,drawnWallV175:true};
 city.economy.buildings.push(wall);game.nav(city).rebuild();
 last=game.previewBuild(city,'watchtower',p);
 if(!last.error){const out=game.build(city,'watchtower',p);assert(out.building, out.error);found=true;}
 if(!found){city.economy.buildings.pop();game.nav(city).rebuild();}
}
assert(found,'real game can construct tower on existing wall: '+JSON.stringify(last));
console.log('PASS: tower on wall, other overlaps rejected, houses closer, game placement');
let houses=false;
for(let z=-70;z<=70&&!houses;z+=5)for(let x=-65;x<=65&&!houses;x+=5){
 const p={x,z};if(game.previewBuild(city,'house',p).error||game.previewBuild(city,'house',{x:x-7,z}).error)continue;
 const house={type:'house',x:x-7,z,team:city.team,hp:350,ready:true};city.economy.buildings.push(house);game.nav(city).rebuild();
 const out=game.build(city,'house',p);if(out.building)houses=true;else{city.economy.buildings.pop();game.nav(city).rebuild();}
}
assert(houses,'real game permits two houses seven metres apart');
console.log('PASS: close houses built in a real city');
const adjacent=[-7,0,7].map(x=>({type:'palisade',x,z:0,team:0,hp:100,wallAngleV175:0,palisadeSpanV167:7,drawnWallV175:true}));
assert(navFor(adjacent).preservesAccess({type:'watchtower',x:0,z:0,team:0}),'tower joins neighbouring wall sections');
