import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js?v=123a';
import {tickResearch,TECHS} from './research.js?v=118a';
const base=new Civilization(createGame(1241023));
for(let i=0;i<5;i++){base.aiTeam(0);base.tick(12)}
const state=JSON.parse(JSON.stringify(base.s));
assert.ok(state.cities.some(c=>c.team===0));
assert.ok(state.research[0].active);
const copy=()=>JSON.parse(JSON.stringify(state));
const normal=copy(),extra=copy();
const a=extra.armies.find(a=>a.team===0);
extra.armies.push({...a,id:54321});
const id=normal.research[0].active;
tickResearch(normal,60);tickResearch(extra,60);
const a1=normal.research[0].progress[id]||0,a2=extra.research[0].progress[id]||0;
console.log('V124_RESEARCH_DUPLICATE_CHECK',JSON.stringify({id,oneArmyProgress:a1,twoArmiesProgress:a2,ratio:a2/Math.max(a1,.00001)}));
assert.ok(a2>a1*1.3,'Multiple armies currently cause research points to be applied multiple times; report as balance bug');
console.log('V124 RESEARCH WARNING: extra army accelerated research by '+(a2/a1).toFixed(3)+' times without any new laboratory');
