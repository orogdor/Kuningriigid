import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {Civilization,createGame} from './civilization-core.js';
import {villageActivity,villagePeriod,villageHour,villageDestination,villageInDanger,
 villageVisualLimit,createVillageLife,VILLAGE_DAY_SECONDS} from './village-life-v76.js';

assert.equal(VILLAGE_DAY_SECONDS,1440);
assert.equal(villageHour(0),8,'new saves begin their first village day in the morning');
assert.equal(villagePeriod(0),'morning');
assert.equal(villagePeriod(180),'day');
assert.equal(villagePeriod(660),'evening');
assert.equal(villagePeriod(900),'night');
assert.equal(villagePeriod(1440),'morning','clock repeats rather than running away');
const ids=['landmark:village-1','city:12'];
for(const id of ids){
 for(const time of [0,180,660,900,1200,1440,1860]){
  for(let i=0;i<9;i++){
   const activity=villageActivity(id,i,time,false);
   const loc=villageDestination(id,i,activity,time);
   assert.ok(['panic','play','patrol','guard','sleep','chat','sit','rest','eat','carry','work','visit','stroll'].includes(activity),activity);
   assert.ok(Number.isFinite(loc.x)&&Number.isFinite(loc.z),'destination finite');
   assert.ok(Math.abs(loc.x)<=50&&Math.abs(loc.z)<=50,'destinations stay within detail tile');
   assert.equal(villageActivity(id,i,time,true),'panic','danger overrides all routines');
   assert.deepEqual(villageDestination(id,i,activity,time),loc,'no frame-to-frame random teleport');
  }
 }
 assert.ok([1,2,3,4,5,6,7,8].some(i=>villageActivity(id,i,180)==='chat'),'normal day has social behaviour');
 assert.equal(villageActivity(id,3,190),'play','children play during the day');
 assert.equal(villageActivity(id,4,900),'sleep','civilians go home after dark');
 assert.equal(villageActivity(id,0,900),'guard','night guard remains on patrol');
}
assert.deepEqual(['low','medium','high'].map(q=>villageVisualLimit(q)),[4,6,9]);
assert.deepEqual(['low','medium','high'].map(q=>villageVisualLimit(q,true)),[1,2,3]);
const g=new Civilization(createGame(765043)),village=g.s.landmarks.find(s=>s.kind==='village'),cell=g.cell(village);
assert.equal(g.s.version,4);const original=JSON.stringify(g.s);
g.reveal(0,cell,1);
const q={name:'medium'},scene=new T.Group();
const life=createVillageLife(g,(_tile,x,z)=>2+Math.sin(x*.1)*.2,{quality:()=>q.name});
let entry=life.show(cell,scene);
assert.ok(entry&&scene.children.includes(entry.group));
assert.equal(life.stats()[0].actorCount,6);
life.update(190,.1);
assert.equal(entry.actors[3].activity,'play');
assert.ok(entry.actors.some(a=>a.activity==='chat'),'a real village has conversation');
assert.ok(entry.actors.every(a=>Number.isFinite(a.person.position.y)),'figures sit on actual terrain');
assert.ok(entry.actors.every(a=>a.figure.userData.rig),'reuses V50 animated character rig');
assert.equal(life.show(cell,scene),entry,'unchanged scenery does not rebuild NPCs every frame');
const grown=JSON.stringify(g.s);
life.update(660,.1);
assert.ok(life.stats()[0].campVisible,'evening gathering place has a lit fire');
assert.ok(entry.actors.some(a=>a.activity==='eat'||a.activity==='chat'||a.activity==='sit'));
life.update(900,.1);
assert.equal(entry.actors[4].activity,'sleep');
assert.equal(entry.actors[0].activity,'guard');
assert.equal(life.stats()[0].campVisible,true,'fire remains lit at night');
assert.equal(JSON.stringify(g.s),grown,'all NPC movement is visual-only and does not touch saves/economy');
const hostile={team:1,c:cell.c,r:cell.r,hp:100};
g.s.armies.push(hostile);
assert.equal(villageInDanger(g,cell,null),true);
life.update(180,.1);
assert.ok(entry.actors.every(a=>a.activity==='panic'),'danger triggers flight regardless of hour');
g.s.armies.pop();
q.name='low';entry=life.show(cell,scene);assert.equal(entry.actors.length,4);
q.name='high';entry=life.show(cell,scene);assert.equal(entry.actors.length,9);
assert.equal(life.count,1,'changing graphics quality does not leak old village scenes');
life.clear();assert.equal(life.count,0);
assert.equal(scene.children.length,0,'all figures detached on detail switch');
assert.ok(original.includes('"version":4'),'saved state is still legacy V4');
console.log('V76 PASS: deterministic 24-hour village life, chatting, children, sleep/home, fire, guards, danger, city-safe lifecycle, quality caps, no saved-state changes');
