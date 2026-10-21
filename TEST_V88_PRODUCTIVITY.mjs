import assert from 'node:assert/strict';
import {PRODUCTIVITY_TECHS,productivityBonus,productivityResearchOrder} from './productivity-techs-v88.js';
import {TECHS,grantTech,techBlock,newResearch} from './research.js';
import {Civilization,createGame} from './civilization-core.js';
import {initialState} from './economy.js';
const g=new Civilization(createGame(8417));
for(let age=0;age<7;age++){
 const entries=Object.entries(PRODUCTIVITY_TECHS).filter(([,t])=>t.age===age);
 assert.equal(entries.filter(([,t])=>t.category==='food').length,2);
 assert.equal(entries.filter(([,t])=>t.category==='mining').length,2);
 for(const [id,t] of entries){
  assert.equal(TECHS[id],t);assert.ok(productivityResearchOrder(age).includes(id));
  const r=newResearch();for(const prereq of t.requires)grantTech(r,prereq);
  assert.equal(techBlock(r,id),'');
  g.s.research[0]=r;
  const before=productivityBonus(g.s,0,t.targets[0]);r.known.push(id);
  assert.equal(productivityBonus(g.s,0,t.targets[0])-before,.25);
  assert.equal(productivityBonus(g.s,1,t.targets[0]),1,'another nation receives no bonus');
  assert.equal(productivityBonus(g.s,0,'study'),1);assert.equal(productivityBonus(g.s,0,'saw'),1);
  if(age>0)assert.ok(techBlock(newResearch(),id),'future era requires an era gate');
 }
}
g.s.research[0].known=Object.keys(PRODUCTIVITY_TECHS);
assert.equal(productivityBonus(g.s,0,'mine'),4.5);
assert.equal(productivityBonus(g.s,0,'basic_stone'),4.5);
// Live production callbacks in two cities share national research immediately.
function town(tile){
 const economy=initialState(8417);economy.buildings=[{type:'hall',x:0,z:0,team:0,hp:1200,ready:true}];
 const city={id:g.s.cities.length,c:tile.c,r:tile.r,team:0,name:'Test',hp:600,economy,world:g.makeWorld(tile)};
 g.s.cities.push(city);g.prepareCity(city);return city;
}
const first=town(g.cell(g.s.coastalStartPositions[0]));
// Reuse terrain but independent economy and city context, as a newly founded city.
const second=town(g.cell(g.s.coastalStartPositions[0]));
g.s.research[0].known=[];
const before=[first,second].map(c=>g.env(c).productionBonus({type:'farm'}));
g.s.research[0].known=['stone_sickles'];
for(const [i,c] of [first,second].entries())assert.equal(g.env(c).productionBonus({type:'farm'})/before[i],1.25);
assert.equal(productivityBonus(g.s,0,'fisher'),1,'crop tools do not accelerate fishing');
console.log('V88 PRODUCTIVITY PASS: 28 technologies, era gates, two-city national scope, additive bonuses');
