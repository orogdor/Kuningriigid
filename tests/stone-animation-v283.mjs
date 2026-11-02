// V283: Stone Age animation fixes: new job kinds have their own tools, the dog trots with hip/knee legs,
// head-first tools are turned round in the hand, and the water carrier keeps the jug while carrying.
import {createStoneEquipment} from '../stone-equipment-v234.js';
import {STONE_HUMAN_KINDS} from '../stone-age-models-v221.js';
import {createDogV274,poseDogV274} from '../scout-dog-v274.js';
import fs from 'fs';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
for(const k of ['stone_herder','stone_elder','stone_potter','stone_digger'])ok(STONE_HUMAN_KINDS.has(k),'stone person kind '+k);
for(const k of ['stone_herder','stone_elder','stone_digger'])ok(createStoneEquipment(k).children.length>0,'tool for '+k);
ok(createStoneEquipment('stone_potter').children.length===0,'the potter works with bare hands');
const dog=createDogV274();ok(dog.userData.legs.length===4&&dog.userData.legs.every(l=>l.userData.knee),'dog legs swing from hip and knee');
poseDogV274(dog,1.3,true);const a=dog.userData.legs.map(l=>l.rotation.x);ok(Math.abs(a[0]-a[3])<1e-9&&Math.abs(a[1]-a[2])<1e-9&&Math.abs(a[0])>0,'trot: diagonal legs move together');
const models=fs.readFileSync(new URL('../stone-age-models-v221.js',import.meta.url),'utf8');
for(const k of ['stone_lumber','stone_miner','stone_builder','stone_hunter','stone_fisher'])ok(new RegExp(k+':-').test(models),'head-first tool turned round: '+k);
const motion=fs.readFileSync(new URL('../stone-motion-v222.js',import.meta.url),'utf8');ok(/r\.kind==='stone_watercarrier'/.test(motion),'water carrier keeps the jug');
const civ=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');ok(/pasture:'stone_herder'/.test(civ)&&/study:'stone_elder'/.test(civ),'Stone Age jobs map to their own kinds');
const rig=fs.readFileSync(new URL('../stone-trellis-rig-v262.js',import.meta.url),'utf8');ok(/bot\[3\]\?bot\.map/.test(rig)&&/g\.setIndex\(keep\)/.test(rig),'spear shaft axis from top and butt, joined faces dropped');
console.log('stone animation V283 ok');
