// V274: cut forest regrows next to mature trees, seedlings are not harvestable until mature,
// nothing sprouts on building sites or far from living trees; wells need the "water" discovery.
import {naturalRegrowthV274,TREE_GROW_V274} from '../navigation.js';
import {BUILD_TECH} from '../research.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
ok(BUILD_TECH.well==='water','well requires the water discovery');
const mk=(id,x,z,removed)=>({id,kind:'tree',x,z,amount:removed?0:24,capacity:24,removed});
const world={resources:[mk(0,0,0,false),mk(1,4,0,false),mk(2,0,4,false),mk(3,3,3,true),mk(4,60,60,true),mk(5,20,20,true)],revision:0};
const s={time:0,buildings:[{x:20,z:20,type:'house'}]};
let total=0;for(let t=0;t<3000;t+=30){s.time=t;total+=naturalRegrowthV274(s,world,null,30);}
const r=world.resources;
ok(!r[3].removed,'stump between mature trees regrows');
ok(r[4].removed,'no seedling far from living trees');
ok(r[5].removed,'nothing sprouts on a building site');
ok(r[3].natural&&r[3].matureAt-r[3].plantedAt===TREE_GROW_V274*1.5,'natural seedling takes 1.5x the planted growth time');
console.log('tree growth V274 ok, sprouted',total);
