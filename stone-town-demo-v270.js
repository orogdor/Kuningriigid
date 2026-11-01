// V270: a larger Stone Age sample town (?demo=stonetown) laid out like a real village:
// longhouse in the middle, a ring of round houses, a ring of workshops and wells, the food and
// raw-material sites outside and watchtowers at the edge. Same V4 save format as the V77 demo;
// the player's own autosave is never touched.
import {Civilization,createGame,BUILDINGS} from './civilization-core.js?v=117a';

export const STONE_TOWN_NAME='Kivikalda küla';
const ring=(r,types,start=0)=>types.map((t,i)=>{const a=start+i/types.length*Math.PI*2;return [t,Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r*.86),a];});
export const STONE_TOWN_LAYOUT=[
 ...ring(21,Array(12).fill('house'),Math.PI/12),
 ...ring(37,['well','study','cellar','mason','barracks','well','archery','claypit','pottery_kiln','cellar'],.2),
 ...ring(54,['lumber','forester','quarry','hunter','farm','pasture','fisher','farm','pasture','lumber','well'],.05),
 ...[[1,1],[-1,1],[1,-1],[-1,-1]].map(([sx,sz])=>['watchtower',sx*64,sz*52,Math.atan2(sz,sx)])
];
export function createStoneTownDemoState(seed=20261101){
 const g=new Civilization(createGame(seed));
 const settler=g.s.settlers.find(s=>s.team===0);
 if(!settler)throw Error('Demo start settler missing');
 const landError=g.land(settler.id);if(landError)throw Error('Cannot land demo settler: '+landError);
 let founded=null;
 for(let x=-12;x<=12&&!founded;x+=4)for(let z=-12;z<=12&&!founded;z+=4){
  if(g.siteRule(settler,{x,z}))continue;settler.x=x;settler.z=z;const r=g.found(settler.id);if(r.city)founded=r.city;
 }
 if(!founded)throw Error('No dry, unoccupied location for the demo town');
 founded.name=STONE_TOWN_NAME;
 const realm=founded.economy.realms[0],base=founded.economy.buildings[0];
 if(base?.type!=='hall')throw Error('Demo town hall missing');
 base.hp=1200;base.ready=true;
 for(const [type,x,z,angle] of STONE_TOWN_LAYOUT){
  if(!BUILDINGS[type])continue;
  const bx=Math.max(-68,Math.min(68,base.x+x)),bz=Math.max(-58,Math.min(58,base.z+z));
  // houses and workshops turn their door towards the longhouse
  founded.economy.buildings.push({type,x:bx,z:bz,team:0,hp:1000,ready:true,previewAge:0,progress:BUILDINGS[type].time||0,assigned:0,
   buildingRotationV228:Math.atan2(base.x-bx,base.z-bz)});
 }
 Object.assign(realm.resources,{wood:420,stone:260,bread:520,grain:200,water:380,gold:120,plank:40,clay:30,pottery:12,copper:0,tin:0,bronze:0,iron:0});
 realm.pop=26;realm.growthProgress=0;
 const known=['fire_use','hunting','fishing','stone_tools','ropes','settlement','water','agriculture','learning','warfare','woodworking','archery','animal_husbandry','pottery','stone_crafts','stone_wedges','masonry','fortifications','forestry'];
 for(const tech of known)if(g.s.research[0].known&&!g.s.research[0].known.includes(tech))g.s.research[0].known.push(tech);
 g.s.ages[0]=0;g.s.time=200;
 g.s.events??=[];g.s.events.push({time:g.s.time,text:'V270 näidislinn: '+STONE_TOWN_NAME+' – kiviaja küla ringikujulise plaaniga.'});
 g.reveal(0,g.cell(founded),3);
 return JSON.parse(JSON.stringify(g.s));
}
