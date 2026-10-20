// V77: reproducible V4 game-save fixture with an entire Stone Age
// architectural exhibition. Never change the player's own autosave.
import {Civilization,createGame,BUILDINGS} from './civilization-core.js?v=80c';

export const DEMO_CITY_NAME='Kivimetsa küla';
export const DEMO_BUILDINGS=[
 ['house',-20,-20],['house',-10,-20],['house',-20,-9],
 ['warehouse',5,-21],['cellar',17,-20],['market',30,-19],
 ['lumber',-32,5],['quarry',-21,6],['hunter',-10,7],
 ['fisher',7,7],['farm',21,8],['well',32,7],
 ['study',-12,25],['barracks',6,26]
];
export function createStoneDemoState(seed=20261020){
 const g=new Civilization(createGame(seed));
 const settler=g.s.settlers.find(s=>s.team===0);
 if(!settler)throw Error('Demo start settler missing');
 const landError=g.land(settler.id);
 if(landError)throw Error('Cannot land demo settler: '+landError);
 let founded=null;
 for(let x=-20;x<=20&&!founded;x+=4)
  for(let z=-20;z<=20&&!founded;z+=4){
   if(g.siteRule(settler,{x,z}))continue;
   settler.x=x;settler.z=z;
   const r=g.found(settler.id);
   if(r.city)founded=r.city;
 }
 if(!founded)throw Error('No dry, unoccupied location for demo city');
 founded.name=DEMO_CITY_NAME;
 const realm=founded.economy.realms[0],base=founded.economy.buildings[0];
 if(base?.type!=='hall')throw Error('Demo city hall missing');
 base.hp=1200;base.ready=true;
 for(const [type,x,z] of DEMO_BUILDINGS){
  if(!BUILDINGS[type])throw Error('Unknown demo building '+type);
  founded.economy.buildings.push({
   type,x:base.x+x,z:base.z+z,team:0,hp:1000,ready:true,previewAge:0,
   progress:BUILDINGS[type].time||0,assigned:0
  });
 }
 const patch={
  wood:300,stone:220,bread:400,grain:160,water:300,
  gold:70,plank:0,copper:0,tin:0,bronze:0,iron:0
 };
 Object.assign(realm.resources,patch);
 realm.pop=6;realm.growthProgress=0;
 const known=['hunting','fishing','stone_tools','learning','warfare','agriculture','water','settlement'];
 for(const tech of known)if(!g.s.research[0].known.includes(tech))g.s.research[0].known.push(tech);
 g.s.ages[0]=0;
 // The demo presents recognisable models; some warehouses/markets normally
 // become available only after later discoveries. This does not alter rules.
 g.s.time=135;
 g.s.events??=[];
 g.s.events.push({time:g.s.time,text:'V77 näidislinn: võrdle kiviaja uusi hoonemudeleid.'});
 g.reveal(0,g.cell(founded),2);
 const out=g.s;
 // Serializing exactly as a normal V4 saved game also excludes engine caches.
 return JSON.parse(JSON.stringify(out));
}
