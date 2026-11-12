// V274: cut forest regrows next to mature trees, seedlings are not harvestable until mature,
// nothing sprouts on building sites or far from living trees; wells need the "water" discovery.
import {gather,naturalRegrowthV274,TREE_GROW_V274} from '../navigation.js';
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
// regression: the live game passes the global state (no .buildings) plus the city's building list
{const st={time:0};const w={resources:[{id:0,kind:'tree',x:0,z:0,amount:24,capacity:24,removed:false},{id:1,kind:'tree',x:3,z:0,amount:0,capacity:24,removed:true}],revision:0};
 for(let t=0;t<600;t+=30){st.time=t;naturalRegrowthV274(st,w,null,30,[{x:50,z:50}]);}console.log('regrowth with global state ok');}
// A legacy or filtered resource array can have stable IDs different from array indices.
{
 const tree=mk(2,0,0,false),stone={id:8,kind:'stone',amount:99};
 const world={resources:[tree,mk(4,20,20,false),stone],revision:0,workers:{wood:{phase:'work',x:1.8,z:0,work:0,resourceId:tree.id}}};
 const lumber={type:'lumber',team:0,x:0,z:0,workerKey:'wood'};
 gather({time:0,buildings:[lumber]},lumber,{cycle:1,rate:24},2,{world});
 ok(tree.removed&&tree.amount===0&&world.revision===1,'woodcutting depletes the selected resource ID');
 ok(stone.amount===99,'woodcutting does not consume the array slot of another resource');
}
