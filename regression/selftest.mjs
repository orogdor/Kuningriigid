import assert from 'node:assert/strict';
import {summarize,invariantErrors,pathErrors,validState,compareRuns} from './metrics.mjs';
function state(){const world={version:4,seed:7,time:600,ages:[1,1,1,0],cities:[],settlers:[],armies:[],units:[],research:[{known:['water']},{known:[]},{known:[]},{known:[]}],worldRoads:{},explored:[{},{},{},{}],winner:null};
 world.cities.push({id:1,team:0,c:20,r:15,economy:{realms:[{pop:7,resources:{wood:20,water:10,bread:4}}],buildings:[{type:'hall',ready:true,hp:350}]}});return world;}
const s=state();assert.equal(validState(s),true);
const snap=summarize(s,10);assert.equal(snap.teams[0].pop,7);assert.equal(snap.teams[0].stocks.wood,20);
assert.deepEqual(invariantErrors(s,10),[]);
s.cities[0].economy.realms[0].resources.wood=-5;
assert.ok(invariantErrors(s,11).some(x=>x.code==='INVALID_STOCK'));
s.cities[0].economy.realms[0].resources.wood=20;
const fake={s:{...s,settlers:[{team:0,c:5,r:5,path:[{c:6,r:5},{c:7,r:5}]}]},canTraverse:(_,p)=>p.c!==7};
assert.ok(pathErrors(fake,9).some(x=>x.code==='PATH_BLOCKED'));
fake.canTraverse=()=>true;assert.deepEqual(pathErrors(fake,9),[]);
const old={status:'passed',revision:'base',seed:7,errors:[],checkpoints:[snap],completedTurns:10};
const next={status:'passed',revision:'new',seed:7,errors:[],checkpoints:[snap],completedTurns:10};
assert.equal(compareRuns(old,next).passed,true);
next.errors=[{code:'SAVE_FAILURE'}];next.status='failed';assert.equal(compareRuns(old,next).passed,false);
console.log('SELFTEST PASS: economy invariants, real path shape checks, save schema and diff severity');
