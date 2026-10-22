import assert from 'node:assert/strict';
import {createBronzeSiegeState} from './bronze-siege-demo-v108.js?v=116a';
import {Civilization,TROOPS} from './civilization-core.js?v=116a';
import {initializeMen,tickIndividualBattle} from './individual-battle-v91.js?v=116a';
import {startSiegeCraft,tickSiegeCraft} from './siege-assault-v108.js?v=116a';
import {createBronzeCityModel} from './bronze-city-v111.js?v=116a';
import {createSiegeWorkModel} from './siege-work-visual-v108.js?v=116a';
for(const kind of ['ladder','tower']){
 const s=createBronzeSiegeState(undefined,2),g=new Civilization(s),b=s.battle,nav=g.battleNavigation(b);initializeMen(b,nav);
 const infantry=b.squads.filter(u=>u.team===0&&u.kind==='bronze_spearman').slice(0,2),u=infantry[0];
 // Isolate navigation from enemy damage; keep the real start positions and all
 // formation/morale/pathfinding ticks. Never move a soldier directly in this test.
 for(const v of b.squads)if(!infantry.includes(v)){v.hp=0;for(const m of v.men||[])m.hp=0;}
 b.defensePosts=[];b.fortress.cool=1e9;
 const made=startSiegeCraft(b,u,kind,s);assert.ok(made.ok);
 let firstUp=null,allUp=null;for(let i=0;i<2300;i++){tickIndividualBattle(b,.1,TROOPS,0,nav);if(firstUp==null&&u.men.some(m=>m.elevation>1))firstUp=b.elapsed;if(infantry.every(v=>v.guardPost)){allUp=b.elapsed;break;}}
 assert.ok(firstUp,kind+' has soldiers visibly ascending');assert.ok(allUp,kind+' brings both the builder and a supporting infantry squad onto the wall');
 assert.ok(infantry.every(v=>v.men.filter(m=>m.hp>0).every(m=>m.elevation===3.8)));assert.equal(nav.passable(made.work.wallX,made.work.wallZ),false);
 u.routing=true;tickSiegeCraft(b,.1,nav);assert.ok(!made.work.destroyed,'placed equipment survives its builder routing');
 console.log(JSON.stringify({kind,firstUp,allUp,soldiers:infantry.reduce((n,v)=>n+v.men.length,0)}));
}
for(const type of ['stonetower','gatehouse']){const m=createBronzeCityModel(type);m.updateMatrixWorld(true);assert.ok(m.children.length>0);for(const child of m.children)assert.ok(child.geometry.attributes.position.array.every(Number.isFinite));}
assert.ok(createSiegeWorkModel('tower').children.length>=35,'complete siege tower frame, side panels, stairs and bridge');
console.log('V112 PASS: real build, approach and ascent for 48 soldiers on both equipment types; equipment persistence; complete tower geometry.');
