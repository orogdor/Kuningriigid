import {createStoneDemoState} from './stone-demo-v77.js?v=80c';
import {Civilization,TROOPS,BUILDINGS} from './civilization-core.js';
import {detailHeight} from './world-details.js?v=123a';
export async function loadArmyTrafficTest(){
 const response=await fetch('./tests/traffic-v133/cases.json');if(!response.ok)throw Error('Traffic test fixture unavailable');
 const fixtures=await response.json();return createArmyTrafficState(fixtures.find(c=>c.id==='city-gate'));
}
export function createArmyTrafficState(fixture,seed=20261020){
 const source=createStoneDemoState(seed),g=new Civilization(source),s=g.s,city=s.cities.find(c=>c.team===0);
 const buildings=fixture.buildings.map(b=>({...b,team:0,hp:1000,ready:true,assigned:0,progress:BUILDINGS[b.type]?.time||0}));
 if(fixture.gate){if(!buildings.some(b=>b.type==='gatehouse'))buildings.push({type:'gatehouse',x:0,z:0,wallAxis:1,team:0,hp:1000,ready:true,assigned:0});for(const sign of [-1,1])for(let z=6.5;z<65;z+=7.2)buildings.push({type:'stonewall',x:0,z:z*sign,wallAxis:1,team:0,hp:1000,ready:true,assigned:0});}
 city.name='Väravalinn';city.economy.buildings=buildings;city.economy.realms[0].pop=0;
 const candidates=[g.cell(city),...g.cells.filter(c=>c.land&&!c.mountain&&c.h>8)];let ready=false;
 for(const cell of candidates){
  if(![-65,-30,0,30,65].every(x=>[-65,0,65].every(z=>detailHeight(cell,x,z)>.5)))continue;
  city.c=cell.c;city.r=cell.r;city.world={...g.makeWorld(cell),resources:[],workers:{},heat:{},berriesVersion:1,foodResourcesVersion:1};
  g.navs.clear();g.localNavs.clear();const nav=g.nav(city);
  if(fixture.starts.every(([x,z])=>nav.open(x,z)&&nav.reachable({x,z},fixture.goal))&&nav.open(fixture.goal.x,fixture.goal.z)){ready=true;break;}
 }
 if(!ready)throw Error('No traversable city traffic test site');
 const army=s.armies.find(a=>a.team===0);Object.assign(army,{c:city.c,r:city.r,path:[],autoExplore:false});
 s.units=s.units.filter(u=>u.team!==0);const tile={};
 for(const [x,z]of fixture.starts){const source=s.units.length,kind='bronze_spearman';s.units.push({team:0,armyId:army.id||0,kind,hp:TROOPS[kind].hp,maxHp:TROOPS[kind].hp,grade:'standard'});tile[source]={x,z,target:{...fixture.goal},heading:Math.PI/2};}
 s.deployments={[city.c+':'+city.r]:tile};s.ages[0]=1;s.research[0].known=[...new Set([...s.research[0].known,'bronze_crafts','stone_fortifications'])];s.time=0;s.demo='army-traffic';s.trafficTest={version:133,fixture:fixture.id,goal:{...fixture.goal},sources:Object.keys(tile).map(Number)};
 g.reveal(0,g.cell(city),2);return JSON.parse(JSON.stringify(s));
}
