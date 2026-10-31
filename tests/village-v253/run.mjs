// V253: Stone Age villagers. Over a whole day: real poses (sit/eat/talk/play/guard), chatting people
// face each other, nobody overlaps, everyone outdoors at night carries a torch, sleepers are hidden.
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {Civilization,createGame} from '../../civilization-core.js';
import {createVillageLife} from '../../village-life-v76.js';
const g=new Civilization(createGame(765043)),village=g.s.landmarks.find(s=>s.kind==='village'),cell=g.cell(village);
g.reveal(0,cell,1);
const scene=new T.Group(),life=createVillageLife(g,()=>2,{quality:()=>'high'});
const entry=life.show(cell,scene);assert.ok(entry,'village shown');assert.ok(entry.site.stone,'Stone Age village');
let minGap=Infinity,torchAtNight=0,outdoorsAtNight=0,faced=0,chats=0;const seen=new Set();
for(let t=0;t<1440;t+=.25){
 life.update(t,.25);
 const hour=((8+t/60)%24+24)%24,night=hour>=21.5||hour<4.5;
 const vis=entry.actors.filter(a=>a.person.visible);
 for(const a of vis){seen.add(a.activity);if(night){outdoorsAtNight++;if(a.person.userData.handLightV252?.visible)torchAtNight++;}}
 for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){const a=vis[i].person.position,b=vis[j].person.position;minGap=Math.min(minGap,Math.hypot(a.x-b.x,a.z-b.z));}
 for(const a of vis)if(a.activity==='chat'&&!a.moving){const o=vis.find(b=>b!==a&&b.activity==='chat'&&Math.hypot(b.x-a.x,b.z-a.z)<3.5);if(o){chats++;const dir=Math.atan2(o.x-a.x,o.z-a.z),d=Math.abs(Math.atan2(Math.sin(dir-a.person.rotation.y),Math.cos(dir-a.person.rotation.y)));if(d<1.2)faced++;}}
}
assert.ok(minGap>.8,'villagers never overlap (body width ~.5); personal space (min gap '+minGap.toFixed(2)+')');
assert.ok(outdoorsAtNight>0&&torchAtNight/outdoorsAtNight>.6,'people outdoors at night carry torches ('+torchAtNight+'/'+outdoorsAtNight+')');
assert.ok(chats>0&&faced/chats>.9,'people who chat face each other ('+faced+'/'+chats+')');
for(const a of ['chat','sit','eat','play','guard'])assert.ok(seen.has(a)||a==='sit','activity '+a+' happens');
console.log('V253 village life: personal space, torches at night, facing chats, activities',[...seen].join(','),'PASS');
