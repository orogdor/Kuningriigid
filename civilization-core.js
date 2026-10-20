import {visibleNow,updateEnemyIntel,armyUnits,activeArmies,splitArmy,mergeArmies,cityProblems} from './v51-systems.js';
import {buildDrainage,openStartingPassages} from './world-geography.js?v=65c';
import {createLandmarks,collectLandmark,findExplorationPath} from './world-discoveries.js';
import {buildRailNetworks} from './infrastructure.js';
import {ERA_MATERIALS,ageDeficit} from './era-economy.js';
import {selectAIBuild,usefulDistrictTypes} from './ai-strategy.js?v=72a';
import {tickBuilders,tickMarketHouseholds,operateWorker,trainingWorker} from './builders.js?v=66';
import {tickTownStreets} from './town-streets-v80.js?v=80c';
import {SHIPS,seaAllowed,seaPath,harborExit,buildShip,finishShip,tickShips,embark,disembark,aiNavy,autoExploreNavy} from './naval.js?v=72a';
import {reconcileVictory,captureEnemySettlers} from './victory-v72.js';
import {initializeFisheries,isShore,fishingHarvest} from './fishery.js?v=64b';
import {upgradeLevel,productionBonus,upgradedName} from './upgrades.js';
import {continentLayout,continentHeight} from './continent-map.js?v=55';
import {tempoMultiplier} from './tempo.js';
import {scienceRate} from './science.js';
import {terrainYields,bonusDescription} from './terrain-economy.js';
import {planTrade} from './trade-network.js';
import {earthHeight,EARTH_STARTS} from './earth-map.js';
import {chooseCoastalStarts} from './coastal-starts.js?v=62';
import {BASIC_JOBS,allocateCity,housingCapacity,HALL_CAPACITY,HOUSE_CAPACITY,FOOD_PER_RESIDENT,WATER_PER_RESIDENT} from './labor.js';
import {TECHS,BUILD_TECH,UNIT_TECH,newResearch,initResearch,startResearch,tickResearch,techBlock,queueResearch} from './research.js';
import {BUILDINGS,RESOURCE_NAMES,START,RESOURCE_PRODUCTION_MULTIPLIER,FOOD_KEYS,storageLimit,takeFood,recordDelivery,realm as freshRealm,initialState,migrateEconomy,buildRule as placementRule,placeBuilding,tickEconomy,ready,canAfford} from './economy.js';
import {Navigation,clearFootprint,door,gather,plantTrees} from './navigation.js?v=79a';
import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,WORLD_CENTER_X,WORLD_CENTER_Z,ORIGIN_X,ORIGIN_Z,center,makeGrid,findPath} from './campaign.js';
import {bakeDetails,detailHeight} from './world-details.js';
import {roadBoost,recordWorldStep,decayWorldRoads} from './roads.js?v=59';
import {wallGuards,stationWall,releaseWall,configureWallFootprint} from './fortifications.js?v=62m3';
import {MEDIEVAL_BUILDINGS,MEDIEVAL_UNITS,medievalBonus,healMedievalArmies} from './medieval-v62.js';
export {BUILDINGS,RESOURCE_NAMES};
RESOURCE_NAMES.bread='Toit';BUILDINGS.harbor={name:'Sadam ja laevatehas',icon:'⚓',cost:{wood:60,plank:25,stone:25},requires:['lumber','quarry'],workers:0,time:40};BUILDINGS.hall.name='Algusmaja · 3 töölist';
Object.assign(BUILDINGS.house,{cost:{wood:15},requires:['hall']});
Object.assign(BUILDINGS.quarry,{cost:{wood:20},requires:['lumber']});
Object.assign(BUILDINGS.forester,{cost:{wood:20,stone:10},requires:['lumber']});
Object.assign(BUILDINGS.well,{requires:['hall'],cost:{wood:18}});BUILDINGS.mine.requires=['hall'];BUILDINGS.coal.requires=['lumber'];BUILDINGS.smelter.requires=['coal'];
Object.assign(BUILDINGS.farm,{cost:{wood:25,stone:12},requires:['hall']});
Object.assign(BUILDINGS.barracks,{name:'Sõdalaste laager',cost:{wood:35,stone:15},requires:['lumber','quarry']});
BUILDINGS.hunter={name:'Jahimehe onn',icon:'♧',cost:{wood:18},requires:['hall'],workers:2,time:16,out:'bread',rate:6,cycle:8};
BUILDINGS.fisher={name:'Kalamehe onn',icon:'≈',cost:{wood:20},requires:['hall'],workers:2,time:16,out:'bread',rate:6,cycle:7};
BUILDINGS.warehouse={name:'Materjaliladu',icon:'▦',cost:{wood:35,stone:12},requires:['hall'],workers:1,time:42};
BUILDINGS.cellar={name:'Toidukelder',icon:'▤',cost:{wood:45,stone:25},requires:['house'],workers:0,time:58};
BUILDINGS.market={name:'Turg',icon:'⚖',cost:{wood:50,stone:24},requires:['house'],workers:2,time:65};
BUILDINGS.bridge={name:'Sild',icon:'≋',cost:{wood:30,stone:10},requires:['hall'],workers:1,time:22};
// Historical era design: Neolithic farming/bows, Bronze Age city storage and organized trade,
// Iron Age cavalry, Medieval university. Earlier household storage remains in the town hall.
BUILDINGS.saw.name='Puusepatöökoda';BUILDINGS.mill.name='Käsiveski';BUILDINGS.archery.name='Vibuküttide harjutusplats';
// V38: academic buildings produce research through allocated workers, not material goods.
BUILDINGS.study={name:'Õpikoda',icon:'⚗',cost:{wood:20,stone:6},requires:['hall'],workers:1,time:38};
BUILDINGS.scriptorium={name:'Kirjutuskoda',icon:'✎',cost:{wood:35,stone:18},requires:['study'],workers:2,time:70};
BUILDINGS.academy={name:'Akadeemia',icon:'♙',cost:{plank:55,stone:42},requires:['scriptorium'],workers:3,time:95};
BUILDINGS.university={name:'Ülikool',icon:'✥',cost:{plank:90,stone:75,iron:8},requires:['academy'],workers:4,time:130};

Object.assign(BUILDINGS,{
 printer:{name:'Trükikoda',icon:'▤',cost:{plank:48,stone:26,iron:8},requires:['university'],workers:3,time:105,input:{plank:3},out:'paper',rate:5,cycle:12},
 observatory:{name:'Tähetorn',icon:'◉',cost:{stone:90,plank:55,iron:12},requires:['university'],workers:3,time:130},
 nitrate:{name:'Salpeetritöökoda',icon:'◇',cost:{wood:55,stone:40,iron:6},requires:['farm'],workers:3,time:112,input:{grain:4,water:2},out:'saltpeter',rate:3,cycle:16},
 powdermill:{name:'Püssirohuveski',icon:'✹',cost:{stone:85,plank:50,iron:12},requires:['nitrate','coal'],workers:3,time:125,input:{saltpeter:3,coal:2},out:'gunpowder',rate:4,cycle:16},
 steelworks:{name:'Terasevabrik',icon:'⚒',cost:{stone:115,iron:35,plank:55},requires:['smelter'],workers:5,time:165,input:{iron:5,coal:3},out:'steel',rate:6,cycle:18},
 engineworks:{name:'Masinatehas',icon:'⚙',cost:{steel:32,iron:25,plank:85},requires:['steelworks'],workers:4,time:180,input:{steel:3,plank:2},out:'machines',rate:3,cycle:18},
 polytechnic:{name:'Polütehnikum',icon:'✥',cost:{stone:110,steel:30,paper:18},requires:['university','engineworks'],workers:4,time:170},
 railstation:{name:'Raudteejaam',icon:'▣',cost:{steel:40,stone:95,machines:15},requires:['engineworks'],workers:2,time:180},
 oilwell:{name:'Naftapuurauk',icon:'◈',cost:{steel:35,machines:20,stone:65},requires:['engineworks'],workers:4,time:190,out:'oil',rate:6,cycle:18},
 refinery:{name:'Rafineerimistehas',icon:'♨',cost:{steel:55,machines:22,stone:80},requires:['oilwell'],workers:4,time:220,input:{oil:5,coal:1},out:'fuel',rate:5,cycle:16},
 powerplant:{name:'Elektrijaam',icon:'⚡',cost:{steel:50,machines:28,stone:90},requires:['engineworks'],workers:4,time:200,input:{coal:4},out:'power',rate:12,cycle:12},
 autofactory:{name:'Autotehas',icon:'⚙',cost:{steel:80,machines:40,stone:100},requires:['engineworks','refinery','powerplant'],workers:5,time:240,input:{steel:4,fuel:3,power:6},out:'vehicles',rate:2,cycle:24},
 laboratory:{name:'Uurimislabor',icon:'⚗',cost:{steel:55,machines:30,paper:25},requires:['polytechnic','powerplant'],workers:5,time:220},
 airfield:{name:'Lennuväli',icon:'✈',cost:{stone:115,steel:65,fuel:25},requires:['autofactory'],workers:2,time:250}
});

// V60: Optional early-era production chains. Existing building requirements remain intact.
Object.assign(BUILDINGS,{
 claypit:{name:'Savivõtukoht',icon:'◈',cost:{wood:16,stone:6},requires:['hall'],workers:2,time:23,out:'clay',rate:6,cycle:9},
 pottery_kiln:{name:'Pottsepatöökoda',icon:'◉',cost:{wood:24,stone:12},requires:['claypit'],workers:2,time:30,input:{clay:3,wood:1},out:'pottery',rate:3,cycle:13},
 pasture:{name:'Karjamaa',icon:'♧',cost:{wood:28,stone:8},requires:['farm'],workers:2,time:35,input:{grain:2},out:'bread',rate:6,cycle:12},
 mason:{name:'Kiviraiduri töökoda',icon:'◆',cost:{wood:24,stone:16},requires:['quarry'],workers:2,time:35,input:{stone:4},out:'cutstone',rate:3,cycle:12},
 cartwright:{name:'Vankritöökoda',icon:'⚙',cost:{plank:26,stone:14,pottery:5},requires:['saw','pottery_kiln'],workers:2,time:48,input:{plank:3,wood:2,pottery:1},out:'carts',rate:1,cycle:25},
 coppermine:{name:'Vasekaevandus',icon:'◆',cost:{wood:30,stone:24},requires:['quarry'],workers:3,time:40,out:'copper',rate:4,cycle:14},
 tinmine:{name:'Tinakaevandus',icon:'◆',cost:{wood:30,stone:24},requires:['quarry'],workers:3,time:40,out:'tin',rate:3,cycle:16},
 bronze_foundry:{name:'Pronksisulatus',icon:'♨',cost:{cutstone:18,wood:35,stone:20},requires:['coppermine','tinmine','mason'],workers:3,time:62,input:{copper:3,tin:1,wood:2},out:'bronze',rate:3,cycle:19},
 road_depot:{name:'Teemeistrite töökoda',icon:'▣',cost:{stone:40,cutstone:12,bronze:8},requires:['mason','bronze_foundry'],workers:1,time:50}
});

// V61: Fortifications are expensive fixed defences, not free military spawns.
Object.assign(BUILDINGS,{
 palisade:{name:'Puidust kaitsemüür',icon:'▥',cost:{wood:30,stone:4},requires:['lumber'],workers:0,time:35},
 watchtower:{name:'Vahitorn',icon:'♜',cost:{wood:45,stone:18},requires:['lumber','quarry'],workers:1,time:50},
 stonewall:{name:'Kivimüür',icon:'▤',cost:{stone:58,cutstone:18,wood:8},requires:['quarry','mason'],workers:0,time:58},
 stonetower:{name:'Kivist kaitsetorn',icon:'♜',cost:{stone:80,cutstone:26,plank:15},requires:['quarry','mason'],workers:1,time:85}
});
Object.assign(BUILDINGS,MEDIEVAL_BUILDINGS);
const PRE_V33_BUILD_TIMES=Object.fromEntries(Object.entries(BUILDINGS).map(([type,def])=>[type,def.time]));
// V33: the complete construction balance applies to BOTH human and AI cities.
// City halls remain free because founding a settlement already requires a settler.
// Existing constructed buildings and their progress are preserved when loading V32 saves.
export const BUILD_BALANCE={
 lumber:[1.50,2.25], house:[1.50,2.40], well:[1.50,2.40],
 hunter:[1.50,2.25], fisher:[1.50,2.25],
 quarry:[1.60,2.40], forester:[1.60,2.40], saw:[1.60,2.40], farm:[1.60,2.40],
 barracks:[1.80,2.70], bridge:[1.80,2.70], harbor:[1.80,2.70],
 mill:[1.80,2.70], bakery:[1.80,2.70], mine:[1.80,2.70],
 coal:[1.80,2.70], smelter:[1.80,2.70], smith:[1.80,2.70],
 archery:[1.80,2.70], stable:[1.80,2.70]
};
for(const [kind,[materialMultiplier,timeMultiplier]] of Object.entries(BUILD_BALANCE)){
 const def=BUILDINGS[kind];
 if(!def)throw new Error('Unknown building balance definition: '+kind);
 def.cost=Object.fromEntries(Object.entries(def.cost).map(([material,amount])=>[material,Math.ceil(amount*materialMultiplier)]));
 def.time=Math.ceil(def.time*timeMultiplier);
}

// V36: staffing requirements reflect the physical work done in each industry.
Object.assign(BUILDINGS.quarry,{workers:3});Object.assign(BUILDINGS.farm,{workers:4});Object.assign(BUILDINGS.saw,{workers:3});Object.assign(BUILDINGS.mine,{workers:4});Object.assign(BUILDINGS.harbor,{workers:3});
export const AGES=[{name:'Kiviaeg',cost:null},{name:'Pronksiaeg',cost:ERA_MATERIALS.bronze,requires:['lumber','quarry','house']},{name:'Rauaaeg',cost:ERA_MATERIALS.iron,requires:['saw','mill','bakery']},{name:'Keskaeg',cost:ERA_MATERIALS.civics,requires:['smith','smelter','house']},{name:'Renessanss',cost:ERA_MATERIALS.renaissance,requires:['university']},{name:'Tööstusajastu',cost:ERA_MATERIALS.industrialization,requires:['printer','powdermill']},{name:'Moodne ajastu',cost:ERA_MATERIALS.modernity,requires:['steelworks','polytechnic']}];
export const BUILD_AGE={...Object.fromEntries(Object.keys(MEDIEVAL_BUILDINGS).map(k=>[k,3])),palisade:0,watchtower:0,stonewall:1,stonetower:1,claypit:0,pottery_kiln:0,pasture:0,mason:0,cartwright:1,coppermine:1,tinmine:1,bronze_foundry:1,road_depot:1,printer:4,observatory:4,nitrate:4,powdermill:4,steelworks:5,engineworks:5,polytechnic:5,railstation:5,oilwell:6,refinery:6,powerplant:6,autofactory:6,laboratory:6,airfield:6,study:0,scriptorium:1,academy:2,university:3,warehouse:1,cellar:1,market:1,harbor:1,bridge:1,hall:0,lumber:0,forester:1,quarry:0,house:0,well:0,farm:0,hunter:0,fisher:0,barracks:0,saw:1,mill:1,bakery:1,archery:0,mine:2,coal:2,smelter:2,smith:2,stable:2};
export const TROOPS={scout:{name:"Avastaja",age:0,cost:{wood:10},requires:[],hp:55,dmg:3,range:2.5,speed:4.3},militia:{name:"Linna kaitsjad",age:0,cost:{},requires:[],hp:36,dmg:4,range:3,speed:2.6},slinger:{name:'Kiviviskajad',age:0,cost:{wood:8,stone:18},requires:['barracks'],hp:85,dmg:7,range:10,speed:2.7},spearman:{name:'Puuodamehed',age:0,cost:{wood:22,stone:4},requires:['barracks'],hp:125,dmg:10,range:3,speed:2.8},axeman:{name:'Kivikirvemehed',age:0,cost:{wood:14,stone:14},requires:['barracks'],hp:140,dmg:12,range:2.5,speed:2.7},archer:{name:'Vibukütid',age:0,cost:{wood:25,stone:8,bread:8},requires:['archery'],hp:100,dmg:12,range:13,speed:2.8},infantry:{name:'Raudmõõgamehed',age:2,cost:{weapons:3,bread:10},requires:['smith','barracks'],hp:175,dmg:18,range:3,speed:2.8},cavalry:{name:'Ratsavägi',age:2,cost:{weapons:4,bread:18},requires:['stable'],hp:210,dmg:23,range:3.5,speed:4.6}};
Object.assign(TROOPS,{musketeer:{name:'Musketärid',age:4,cost:{gunpowder:8,iron:10,bread:10},requires:['barracks','powdermill'],hp:170,dmg:26,range:15,speed:2.7},rifleman:{name:'Püssimehed',age:5,cost:{gunpowder:10,steel:6,bread:12},requires:['barracks','steelworks'],hp:220,dmg:38,range:20,speed:3.1},motorized:{name:'Motoriseeritud jalavägi',age:6,cost:{fuel:15,vehicles:2,weapons:5,bread:16},requires:['autofactory','barracks'],hp:300,dmg:48,range:18,speed:5.1}});
for(const [kind,d]of Object.entries(TROOPS))d.time={scout:18,slinger:25,spearman:30,axeman:35,archer:40,infantry:50,cavalry:60,musketeer:70,rifleman:90,motorized:125,militia:0}[kind];
Object.assign(TROOPS,SHIPS);
Object.assign(TROOPS,MEDIEVAL_UNITS);
const copy=x=>JSON.parse(JSON.stringify(x)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const tileKey=p=>p.c+':'+p.r;
export const STARTS=[{c:Math.round(COLS*.16),r:Math.round(ROWS*.21)},{c:Math.round(COLS*.78),r:Math.round(ROWS*.20)},{c:Math.round(COLS*.20),r:Math.round(ROWS*.78)},{c:Math.round(COLS*.76),r:Math.round(ROWS*.80)}];
export const FACTION_NAMES=['Kadaka','Ida','Põhja','Lõuna'];

function generateRivers(cells,noise,starts=[]){
 const idx=(c,r)=>cells[r*COLS+c],startSet=new Set(starts.map(p=>p.c+':'+p.r));
 const sources=cells.filter(c=>c.land&&c.h>22).sort((a,b)=>(b.h+noise(b.c*9,b.r*7))-(a.h+noise(a.c*9,a.r*7)));
 const chosen=[];for(const s of sources){if(chosen.length>=12)break;if(chosen.every(a=>Math.abs(a.c-s.c)+Math.abs(a.r-s.r)>18))chosen.push(s)}
 const dirs=(a,b)=>!a||!b?'v':a.c===b.c?'v':a.r===b.r?'h':(a.c-b.c)*(a.r-b.r)>0?'d1':'d2';
 for(const source of chosen){let cur=source,prev=null,path=[];const seen=new Set();for(let step=0;step<90;step++){
   const key=cur.c+':'+cur.r;if(seen.has(key))break;seen.add(key);path.push(cur);
   const nearStart=starts.some(p=>Math.abs(p.c-cur.c)+Math.abs(p.r-cur.r)<=1);
   if(!nearStart&&cur.land){cur.river=true;cur.bridge=!!cur.bridge;}
   const ns=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dc&&!dr)continue;const c=cur.c+dc,r=cur.r+dr;if(c<0||c>=COLS||r<0||r>=ROWS)continue;ns.push(idx(c,r))}
   const sea=ns.find(n=>!n.land);if(sea){if(cur.land&&!nearStart){cur.river=true;cur.ford=cur.ford||step%7===3;cur.riverDir=dirs(prev,cur)}break}
   ns.sort((a,b)=>(a.h+(a.land?0:-12)+noise(a.c+51,a.r+17)*1.2)-(b.h+(b.land?0:-12)+noise(b.c+51,b.r+17)*1.2));
   const next=ns.find(n=>prev?!(n.c===prev.c&&n.r===prev.r):true); if(!next)break;
   prev=cur;cur=next;
 }
 for(let i=0;i<path.length;i++){
   const cell=path[i],nearStart=starts.some(p=>Math.abs(p.c-cell.c)+Math.abs(p.r-cell.r)<=1); if(!cell.land||nearStart)continue;
   cell.river=true; cell.riverDir=dirs(path[Math.max(0,i-1)],path[Math.min(path.length-1,i+1)]);
   if(!cell.ford&&(i%8===Math.floor(noise(cell.c+91,cell.r+13)*4)+3||i===path.length-2))cell.ford=true;
 }
 }
 for(const cell of cells)if(cell.river&&startSet.has(cell.c+':'+cell.r))cell.ford=true;
}

export function createGame(seed,type='continents'){return {version:4,roadKeyCols:COLS,hydrologyVersion:2,tempo:'normal',researchBalanceVersion:2,mapExpansionVersion:2,worldScaleVersion:2,geographyVersion:type==='continents'?4:0,coastalStartsVersion:1,seed,type,difficulty:'normal',time:0,research:STARTS.map(()=>newResearch()),ages:[0,0,0,0],cities:[],settlers:(type==='continents'?continentLayout(seed,true).starts:STARTS).map((p,team)=>({id:team,team,...p,x:0,z:0,path:[],landed:false,localTarget:null})),nextSettler:4,units:STARTS.map((p,team)=>({kind:'scout',team,hp:55,morale:100})),explorerVersion:1,armies:(type==='continents'?continentLayout(seed,true).starts:STARTS).map((p,team)=>({team,...p,path:[]})),deployments:{},explored:Array.from({length:4},()=>({})),visionClock:0,clock:0,battle:null,winner:null}};
export function migrateGame(old){if(old?.version===4)return old;if(!old?.world)return null;const s=createGame(old.world.seed,old.world.type);delete s.research;s.time=old.time||0;s.ages=old.realms?.map(r=>r.tech?3:old.buildings.some(b=>b.type==='smith')?2:0)||[0,0];s.settlers=[];for(const team of [0,1]){const hall=old.buildings.find(b=>b.team===team&&b.type==='hall');if(!hall){s.settlers.push({id:s.nextSettler++,team,c:team?17:10,r:team?9:11,x:old.settlers?.[team]?.x||0,z:old.settlers?.[team]?.z||0,path:[],landed:false,localTarget:null});continue}const indices=old.buildings.map((b,i)=>b.team===team?i:-1).filter(i=>i>=0),econ=initialState(s.seed);econ.settlers=[];econ.buildings=indices.map(i=>{const b=copy(old.buildings[i]);if(b.parent!=null)b.parent=indices.indexOf(b.parent);return b});econ.realms[team]=copy(old.realms[team]);econ.cargo=[];econ.units=[];migrateEconomy(econ);s.cities.push({id:s.cities.length,team,c:team?17:10,r:team?9:11,name:team?'Idakindlus':'Kadakalinn',economy:econ,world:old.cityWorlds?.[team]||old.cityWorld?copy(old.cityWorlds?.[team]||old.cityWorld):null,hp:600});if(s.cities.at(-1).world)s.cities.at(-1).world.workers={}}
s.units=copy(old.units||[]).map(u=>({...u,cityId:s.cities.find(c=>c.team===u.team)?.id}));if(old.campaign){s.armies=copy(old.campaign.armies);s.deployments=copy(old.campaign.deployments||{})}s.armies=s.armies.slice(0,2);delete s.mapExpansionVersion;delete s.geographyVersion;return s;}
export class Civilization{
 constructor(state){
 // Keep the percentage already completed for construction started in V32.
 if(state.constructionBalanceVersion!==1){
  for(const parent of state.cities||[])for(const ctx of [parent,...Object.values(parent.districts||{})])
   for(const b of ctx.economy?.buildings||[]){
    if(b.ready||!BUILD_BALANCE[b.type]||!PRE_V33_BUILD_TIMES[b.type])continue;
    const completion=Math.min(1,(b.progress||0)/PRE_V33_BUILD_TIMES[b.type]);
    b.progress=Math.min(BUILDINGS[b.type].time-.001,completion*BUILDINGS[b.type].time);
   }
  state.constructionBalanceVersion=1;
 }
 if(state.mapExpansionVersion!==2){for(const team of [2,3]){const p=STARTS[team];state.settlers.push({id:state.nextSettler++,team,...p,x:0,z:0,path:[],landed:false,localTarget:null});state.armies.push({team,...p,path:[]});state.units.push({kind:"scout",team,hp:55,morale:100});state.ages[team]=0;if(state.research)state.research[team]=newResearch()}state.mapExpansionVersion=2;}if(!state.explorerVersion){for(const team of [0,1])state.units.push({kind:"scout",team,hp:55,morale:100});state.explorerVersion=1}state.tempo??='normal';initResearch(state);if(state.researchBalanceVersion!==2){for(const r of state.research){for(const [id,progress] of Object.entries(r.progress||{})){if(TECHS[id])r.progress[id]=Math.min(TECHS[id].turns*10*tempoMultiplier(state),Math.max(0,progress)*10/60*tempoMultiplier(state))}r.boosted??=[]}state.researchBalanceVersion=2}state.ships??=[];state.nextShip??=0;state.enemyIntel??={};state.nextArmyId??=Math.max(1,...(state.armies||[]).map(a=>(a.id||0)+1));this.s=state;state.worldRoads??={};if(state.roadKeyCols!==COLS){const oldCols=state.roadKeyCols||160;const rekey=key=>{const [a,b]=key.split(':').map(Number);const points=[a,b].map(n=>({c:n%oldCols,r:Math.floor(n/oldCols)}));if(points.some(p=>p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS))return null;return points.map(p=>p.r*COLS+p.c).sort((x,y)=>x-y).join(':')};const upgradeMap=old=>{const mapped={};for(const [k,v]of Object.entries(old||{})){const key=rekey(k);if(key)mapped[key]=v}return mapped};state.worldRoads=upgradeMap(state.worldRoads);state.railEdges=upgradeMap(state.railEdges);state.roadKeyCols=COLS;state.roadRevision=(state.roadRevision||0)+1;state.railRevision=(state.railRevision||0)+1}state.roadRevision??=0;state.roadDecayClock??=0;this.buildingDefinitions=BUILDINGS;this.troopDefinitions=TROOPS;this.researchEvents=[];this.discoveryEvents=[];this.uiRevision=0;this.cols=COLS;this.rows=ROWS;this.terrainBonusCache=new Map();state.events??=[];this.navs=new Map();this.localNavs=new Map();this.aiClock=0;state.difficulty??='normal';state.explored??=Array.from({length:4},()=>({}));state.visionClock??=0;if(state.aiBalanceVersion!==2){state.aiBalanceVersion=2;state.aiPeaceUntil=Math.max(540,state.time+150);state.nextAIRecruit=Math.max(210,state.time+45);if(!state.battle)state.armies[1].path=[]}state.shipments??=[];state.railEdges??={};state.railLinks??={};state.railRevision??=0;state.railClock??=0;state.tradeClock??=0;state.nextShipment??=0;const seed=state.seed;this.noise=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+seed*.017)*43758.5453;return n-Math.floor(n)};this.smooth=(x,z)=>{const i=Math.floor(x),j=Math.floor(z);let u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return (this.noise(i,j)*(1-u)+this.noise(i+1,j)*u)*(1-v)+(this.noise(i,j+1)*(1-u)+this.noise(i+1,j+1)*u)*v};
 this.continents=state.geographyVersion>=2?continentLayout(seed,state.geographyVersion>=3):null;
 const legacyWorld=state.worldScaleVersion!==2;
 // Never relocate a state that already contains founded towns, even if it came
 // from a pre-initialization game state. Existing town locations take priority.
 if(state.coastalStartsVersion===1&&!state.coastalStartPositions&&state.cities.length)state.coastalStartsVersion=0;
 if(state.coastalStartsVersion===1&&!state.coastalStartPositions){
  const original=this.continents?.starts||STARTS;
  const rawHeight=(c,r)=>{
   const p=center(c,r);
   if(state.geographyVersion)return this.continents?continentHeight(this.continents,p.x,p.z,this.smooth,false):earthHeight(p.x,p.z,this.smooth);
   let e=this.smooth(p.x/180+300,p.z/180+200)*.65+this.smooth(p.x/70+800,p.z/70+900)*.35-.48;
   e-=Math.max(0,Math.max(Math.abs(p.x-WORLD_CENTER_X)/(WORLD_WIDTH/2),Math.abs(p.z-WORLD_CENTER_Z)/(WORLD_DEPTH/2))-.7)*1.2;
   if(state.type==='inland')e=Math.max(.05,e);
   if(state.type==='inland'){const u=(p.x-ORIGIN_X)/WORLD_WIDTH,v=(p.z-ORIGIN_Z)/WORLD_DEPTH;e-=Math.max(0,Math.max(Math.abs(u-.5)*2,Math.abs(v-.5)*2)-.78)*1.5}
   const u=(p.x-ORIGIN_X)/WORLD_WIDTH,v=(p.z-ORIGIN_Z)/WORLD_DEPTH;
   const arc=.46+.11*Math.sin(u*8+seed*.0001)+.025*Math.sin(u*23),distance=Math.abs(v-arc);
   const ridge=state.hydrologyVersion===1&&state.type==='inland'?Math.exp(-Math.pow(distance/.056,2))*Math.max(0,1-Math.abs(u-.5)*1.4)*(11+this.smooth(u*45+9,v*45+19)*28):0;
   return e*95+ridge;
  };
  const starts=chooseCoastalStarts(COLS,ROWS,rawHeight,original);
  state.coastalStartPositions=starts.map(p=>({...p}));
  for(const p of starts){const settler=state.settlers.find(a=>a.team===starts.indexOf(p)),army=state.armies[starts.indexOf(p)];if(settler)Object.assign(settler,p,{x:0,z:0,path:[],landed:false,localTarget:null});if(army)Object.assign(army,p,{path:[]});}
 }
 this.startLocations=state.coastalStartPositions|| (legacyWorld?[...state.settlers,...state.cities].map(p=>({c:p.c,r:p.r})):(this.continents?.starts||(state.geographyVersion?EARTH_STARTS:STARTS)));
 this.cells=makeGrid((x,z)=>{if(state.geographyVersion){let h=this.continents?continentHeight(this.continents,x,z,this.smooth,legacyWorld):earthHeight(x,z,this.smooth);if(this.startLocations.some(p=>Math.hypot(x-center(p.c,p.r).x,z-center(p.c,p.r).z)<(legacyWorld?55:125))){const d=Math.min(...this.startLocations.map(p=>Math.hypot(x-center(p.c,p.r).x,z-center(p.c,p.r).z)));if(state.coastalStartsVersion===1){if(h>0)h=Math.max(9,Math.min(19,h))}else if(d<85&&!legacyWorld)h=Math.max(10,Math.min(19,h));else h=Math.max(9,h)}return h}let e=this.smooth(x/180+300,z/180+200)*.65+this.smooth(x/70+800,z/70+900)*.35-.48;e-=Math.max(0,Math.max(Math.abs(x-WORLD_CENTER_X)/(WORLD_WIDTH/2),Math.abs(z-WORLD_CENTER_Z)/(WORLD_DEPTH/2))-.7)*1.2;if(state.type==='inland')e=Math.max(.05,e);if(state.coastalStartsVersion===1&&state.type==='inland'){const u=(x-ORIGIN_X)/WORLD_WIDTH,v=(z-ORIGIN_Z)/WORLD_DEPTH;e-=Math.max(0,Math.max(Math.abs(u-.5)*2,Math.abs(v-.5)*2)-.78)*1.5}if(this.startLocations.some(p=>Math.hypot(x-center(p.c,p.r).x,z-center(p.c,p.r).z)<125)){if(state.coastalStartsVersion===1){if(e>0)e=Math.max(e,.10)}else e=.16}
 const u=(x-ORIGIN_X)/WORLD_WIDTH,v=(z-ORIGIN_Z)/WORLD_DEPTH;
 const arc=.46+.11*Math.sin(u*8+seed*.0001)+.025*Math.sin(u*23),distance=Math.abs(v-arc);
 const ridge=state.hydrologyVersion===1&&state.type==='inland'?Math.exp(-Math.pow(distance/.056,2))*Math.max(0,1-Math.abs(u-.5)*1.4)*(11+this.smooth(u*45+9,v*45+19)*28):0;
 return e*95+ridge},this.noise,!state.geographyVersion);if(state.geographyVersion>=4||state.hydrologyVersion===1){buildDrainage(this.cells,this.noise,this.startLocations,state.hydrologyVersion>=2);state.hydrologyVersion=state.hydrologyVersion>=2?2:1;}else generateRivers(this.cells,this.noise,this.startLocations);
 // Capital passes join the starting plateau to a larger walkable land region.
 this.startPassages=openStartingPassages(this.cells,this.startLocations);
 state.landmarks??=createLandmarks(this.cells,seed,this.startLocations);
 // Keep existing settlements and units usable when loading earlier terrain rules.
 for(const p of [...state.cities,...state.settlers,...state.armies,...state.cities.flatMap(c=>Object.values(c.districts||{}).filter(d=>d.economy.buildings.some(b=>!b.virtual)))]){const cell=this.cell(p);if(cell?.mountain){cell.mountain=false;cell.biome='plains'}}
 // V47 world-map visual biomes: richer climate bands and moisture zones without changing core gameplay terrain rules.
 for(const cell of this.cells){
  const lat=state.geographyVersion?Math.abs((cell.r+.5)/ROWS-.5)*2:Math.abs((cell.z-WORLD_CENTER_Z))/(WORLD_DEPTH/2);
  const heat=Math.max(0,Math.min(1,1-lat*.92+(this.noise(cell.c+417,cell.r+73)-.5)*.18));
  const moisture=Math.max(0,Math.min(1,this.smooth(cell.c/13+17,cell.r/13+71)*.6+this.smooth(cell.c/41+53,cell.r/41+11)*.4));
  const dry=Math.max(0,Math.min(1,1-moisture*.92+.08));
  cell.visualClimate={lat,heat,moisture,dry};
  if(!cell.land){cell.visualBiome='sea';continue}
  const coastal=Math.min(cell.c,COLS-1-cell.c,cell.r,ROWS-1-cell.r)<2;
  if(cell.mountain)cell.visualBiome=lat>.72||cell.h>36?'snow_mountain':dry>.68&&heat>.45?'mesa':'mountain';
  else if(lat>.86)cell.visualBiome='snow';
  else if(lat>.73)cell.visualBiome=moisture>.42?'taiga':'tundra';
  else if(cell.river&&heat>.45&&moisture>.68&&cell.h<18)cell.visualBiome='lush_river';
  else if(heat>.72&&dry>.7)cell.visualBiome='desert';
  else if(heat>.67&&moisture>.66)cell.visualBiome='jungle';
  else if(moisture>.66)cell.visualBiome='forest';
  else if(dry>.56)cell.visualBiome='steppe';
  else cell.visualBiome='grassland';
  if(coastal&&['grassland','forest','jungle','steppe'].includes(cell.visualBiome))cell.visualBiome='coastal_'+cell.visualBiome;
 }
 bakeDetails(this.cells,(x,z)=>this.atlasHeight(x,z),seed);for(const cell of this.cells){cell.detail.city=null;cell.detail.feature=cell.detail.feature==='city'?cell.biome:cell.detail.feature;const coast=cell.detail.feature==='coast',n=this.noise(cell.c+181,cell.r+43),start=this.startLocations.some(p=>p.c===cell.c&&p.r===cell.r);cell.coast=coast;cell.deposits=cell.land?{wood:cell.biome==='forest'||n>.35||start,stone:cell.h>16||n<.3||start,ore:cell.h>16&&this.noise(cell.c,cell.r+883)>.35,grain:cell.biome==='plains'&&n>.24,water:start||coast||cell.river||this.noise(cell.c+19,cell.r+29)>.58,oil:!cell.mountain&&this.noise(cell.c+615,cell.r+399)>.76}:{};
 // V60 seeded deposits: starting locations remain eligible for optional early buildings.
 cell.deposits.clay=cell.land&&(start||(cell.deposits.water&&this.noise(cell.c+240,cell.r+340)>.28));
 cell.deposits.copper=cell.land&&(start||(cell.deposits.ore&&this.noise(cell.c+370,cell.r+470)>.38));
 cell.deposits.tin=cell.land&&(start||(cell.deposits.ore&&this.noise(cell.c+390,cell.r+490)>.52));
 cell.deposits.game=cell.land&&(start||cell.deposits.wood&&this.noise(cell.c+731,cell.r+85)>.28);cell.deposits.fish=false;
 if(cell.river)cell.detail.feature='river';cell.detail.resources=cell.detail.resources.filter(([kind])=>kind?cell.deposits.stone:cell.deposits.wood);if(cell.deposits.ore)for(let i=0;i<6;i++){const x=(this.noise(cell.c*31+i,cell.r+911)-.5)*110,z=(this.noise(cell.c*21+i,cell.r+722)-.5)*90;if(detailHeight(cell,x,z)>.4)cell.detail.resources.push([2,x,z])}}
 for(const cell of this.cells){if(cell.deposits.game)for(let i=0;i<7;i++){const x=(this.noise(cell.c*13+i,cell.r+521)-.5)*100,z=(this.noise(cell.c*17+i,cell.r+611)-.5)*100;if(detailHeight(cell,x,z)>.4)cell.detail.resources.push([3,x,z])}}
 initializeFisheries(this);for(const city of state.cities){city.districts??={};city.world??=this.makeWorld(this.cell(city));this.prepareCity(city);for(const region of Object.values(city.districts))this.attachDistrict(city,region)}this.refreshVision();
 }
 cell(p){return this.cells[p.r*COLS+p.c]}
 atlasHeight(x,z){const fx=(x-ORIGIN_X)/50-.5,fz=(z-ORIGIN_Z)/50-.5,c=Math.floor(fx),r=Math.floor(fz);let u=fx-c,v=fz-r;u=u*u*(3-2*u);v=v*v*(3-2*v);const sample=(c,r)=>{const a=this.cells[r*COLS+c];return c<0||c>=COLS||r<0||r>=ROWS?-15:a.land?(a.river&&!a.bridge?Math.max(4,a.h-3.5):Math.max(5,a.h)):Math.min(-6,a.h)};return (sample(c,r)*(1-u)+sample(c+1,r)*u)*(1-v)+(sample(c,r+1)*(1-u)+sample(c+1,r+1)*u)*v}
 ensureBerries(world,cell){if(world.berriesVersion)return;world.berriesVersion=1;for(let i=0;i<9;i++){const x=-24+(i%3)*22,z=-22+Math.floor(i/3)*21;if(detailHeight(cell,x,z)>.4)world.resources.push({id:world.resources.length,kind:'berry',x,z,amount:60,capacity:60,removed:false})}world.revision++}
 makeWorld(cell){return {resources:cell.detail.resources.map(([kind,x,z],id)=>({id,kind:['tree','stone','ore','game','fish'][kind],x,z,amount:kind>=3?96:kind?420:32,removed:false})),heat:{},revision:0,foodResourcesVersion:1}}
 cityAt(p){return this.s.cities.find(c=>c.c===p.c&&c.r===p.r)}

 // Fractional travel clocks let units move smoothly from cell to cell.
 // Crossings create invisible wear; repeated traffic creates visible roads.
 advanceWorldMovers(dt){
  const travel=(entity,kind)=>{
   if(entity.embarked!=null||!entity.path?.length)return;
   entity.travelClock=(entity.travelClock||0)+dt;
   for(let guard=0;guard<6&&entity.path.length;guard++){
    const next=entity.path[0];if(!this.canTraverse(entity.team,next)){entity.path=[];entity.travelClock=0;break}
    const duration=kind==='train'?1:(3/roadBoost(this.s,entity,next,this.s.time))*(kind==='caravan'&&entity.wagon?.78:1);
    entity.travelDuration=duration;
    if(entity.travelClock+1e-7<duration)break;
    entity.travelClock=Math.max(0,entity.travelClock-duration);
    const from={c:entity.c,r:entity.r};Object.assign(entity,entity.path.shift());
    recordWorldStep(this.s,from,entity,kind==='caravan'&&entity.roadCrew?'roadworks':kind,this.s.time);
    if(kind==='settler'||(kind==='army'&&armyUnits(this.s,entity).some(u=>u.kind==='scout'))){this.reveal(entity.team,entity,2);collectLandmark(this,entity.team,entity)}
    if(kind==='settler')entity.landed=false;
   }
   if(!entity.path?.length){entity.travelClock=0;entity.travelDuration=0;}
  };
  for(const cargo of this.s.shipments){
   if(cargo.mode==='air'){
    cargo.flightLeft=Math.max(0,(cargo.flightLeft??cargo.flightDuration??0)-dt);
    const origin=this.s.cities.find(c=>c.id===cargo.from),destination=this.s.cities.find(c=>c.id===cargo.to);
    if(origin&&destination){const fraction=1-cargo.flightLeft/Math.max(.01,cargo.flightDuration);
     const x=origin.c+(destination.c-origin.c)*fraction,z=origin.r+(destination.r-origin.r)*fraction;
     cargo.flightPosition={c:x,r:z};cargo.flightHeading=Math.atan2(destination.c-origin.c,destination.r-origin.r);
     cargo.c=Math.round(x);cargo.r=Math.round(z)}
   }else if(cargo.path?.length&&!cargo.blocked)travel(cargo,cargo.mode==='rail'?'train':'caravan');
  }
  for(const a of this.s.settlers)travel(a,'settler');
  if(!this.s.battle)for(const a of this.s.armies)travel(a,'army');
 }

 seen(team,p){return !!this.s.explored?.[team]?.[tileKey(p)]}
 reveal(team,p,radius=2){this.s.explored??=Array.from({length:4},()=>({}));for(let dr=-radius;dr<=radius;dr++)for(let dc=-radius;dc<=radius;dc++){const c=p.c+dc,r=p.r+dr;if(c<0||c>=COLS||r<0||r>=ROWS||Math.abs(dc)+Math.abs(dr)>radius+1)continue;if(!this.s.explored[team][c+':'+r]){this.s.explored[team][c+':'+r]=1;if(team===0)this.s.visionRevision=(this.s.visionRevision||0)+1}}}
 visibleNow(team,p){return visibleNow(this,team,p)}
 enemyIntel(team=0){return updateEnemyIntel(this,team)}
 splitArmy(army){return splitArmy(this.s,army)}
 mergeArmies(army){return mergeArmies(this.s,army)}
 autoExplore(dt){this.s.autoExploreClock=(this.s.autoExploreClock||0)+dt;if(this.s.autoExploreClock<1.5)return;this.s.autoExploreClock=0;
  for(const army of this.s.armies){if(!army.autoExplore||army.embarked!=null||army.path?.length||!armyUnits(this.s,army).some(u=>u.kind==='scout'))continue;
   const path=findExplorationPath(this,army);
   if(path?.length){army.path=path;army.stance='move';army.waitingForShip=false;}
   else if(army.team===0){if(!army.waitingForShip){army.waitingForShip=true;this.s.events.push({time:this.s.time,text:'Avastaja ootab sadamat ja transpordilaeva, et meretaguseid maid uurida.'});this.uiRevision++;}}
   else army.autoExplore=false;
  }
 }
 refreshVision(){for(const city of this.s.cities)this.reveal(city.team,city,Math.max(2,this.radius(city)));for(const a of this.s.armies)this.reveal(a.team,a,2);for(const a of this.s.settlers)if(a.embarked==null)this.reveal(a.team,a,2);for(const a of this.s.ships||[])if(a.hp>0)this.reveal(a.team,a,2);updateEnemyIntel(this,0)}
 canTraverse(team,p){const cell=this.cell(p);return !!(cell&&cell.land&&!cell.mountain&&(!cell.river||cell.ford||cell.bridge))}
 landPath(a,b,team=a.team??0){return findPath(this.cells,a,b,(cell,p)=>this.canTraverse(team,p))}
 terrainYields(p){const key=tileKey(p);if(!this.terrainBonusCache.has(key))this.terrainBonusCache.set(key,terrainYields(this,p));return this.terrainBonusCache.get(key)}
 terrainText(p){return bonusDescription(this.terrainYields(p))||'Tavaline maastikutootlikkus'}
 terrainBonus(p,type){return this.terrainYields(p)[type]||1}
 applyUpgrades(city){const level=this.upgrade(city.team);for(const b of this.allBuildings(city)){const previous=b.upgradeLevel||0;if(level>previous&&b.hp>0)b.hp+=(level-previous)*60;b.upgradeLevel=level;b.maxHp=(b.type==='hall'?1200:350)+level*60}}
 upgrade(team){return upgradeLevel(this.s,team)}
 buildingAge(team,type){return Math.max(BUILD_AGE[type]||0,this.upgrade(team))}
 buildingName(team,type){return upgradedName(this.s,team,type,BUILDINGS[type].name)}
 constructionTime(type){return BUILDINGS[type].time*tempoMultiplier(this.s)}
 scienceRate(team){return scienceRate(this.s,team)}
 bonus(team){return productionBonus(this.s,team)}
 builderTier(team){return Math.max(0,Math.min(6,this.s.ages?.[team]||0))}
 builderProfile(team){const tier=this.builderTier(team);const names=['Kiviaja ehitaja','Pronksiaja ehitaja','Rauaaja ehitaja','Keskaegne meisterehitaja','Renessansiaja ehitaja','Tööstusajastu ehitaja','Moodsa ajastu ehitaja'];const archetypes=['stone_builder','bronze_builder','iron_builder','medieval_builder','renaissance_builder','industrial_builder','modern_builder'];const power=[1,1.2,1.4,1.7,1.95,2.25,2.6];return {tier,name:names[tier],archetype:archetypes[tier],power:power[tier]}}
 builderStrength(team){return this.builderProfile(team).power}
 builderLabel(team){const p=this.builderProfile(team);return `${p.name} ×${p.power.toFixed(2)}`}
  consumeHouseholds(ctx,r,foodNeed,waterNeed){
   // Consumption follows actual population, not number of buildings. Market
   // deliveries are already deducted from the stock when picked up.
   const parent=this.parentCity(ctx),houses=this.allBuildings(parent).filter(b=>b.type==='house'&&b.ready&&b.hp>0);
   const market=this.cityReady(parent,'market');
   const consume=(key,amount,house=null)=>{
     const heldKey=key==='bread'?'foodHeld':'waterHeld';
     let remaining=amount;
     if(house){const held=Math.min(remaining,house[heldKey]||0);house[heldKey]=Math.max(0,(house[heldKey]||0)-held);remaining-=held}
     const used=key==='bread'?takeFood(r.resources,remaining):Math.min(remaining,r.resources[key]||0);
     if(key!=='bread')r.resources[key]=Math.max(0,(r.resources[key]||0)-used);
     return remaining-used<.0001;
   };
   const hallResidents=Math.min(r.pop,HALL_CAPACITY);
   const hallFoodOK=consume('bread',hallResidents*FOOD_PER_RESIDENT),hallWaterOK=consume('water',hallResidents*WATER_PER_RESIDENT);let fed=hallFoodOK&&hallWaterOK;
   // Short circuit would skip water when there is a food shortage: both must be charged.
   const houseResidents=Math.max(0,r.pop-hallResidents);
   for(const [i,b] of houses.entries()){
     const occupants=Math.min(HOUSE_CAPACITY,Math.max(0,houseResidents-i*HOUSE_CAPACITY));
     if(!occupants)continue;
     const foodOK=consume('bread',occupants*FOOD_PER_RESIDENT,b),waterOK=consume('water',occupants*WATER_PER_RESIDENT,b);
     if(!foodOK||!waterOK)fed=false;
   }
   return fed;
  }
 buildShip(city,kind){return buildShip(this,city,kind)}
 sail(ship,to){const path=seaPath(this,ship,to);if(!path)return 'Seda mereteed ei saa veel läbida. Varased laevad peavad hoiduma ranniku lähedale.';ship.path=path;return ''}
 embark(ship,kind,armyId=0){return embark(this,ship,kind,armyId)}
 disembark(ship,p){return disembark(this,ship,p)}
 radius(city){const pop=city.economy.realms[city.team].pop;return city.radius=Math.min(4,Math.max(city.radius||1,pop>=64?4:pop>=48?3:pop>=32?2:1))}
 refreshTerritory(){const stamp=this.s.cities.map(c=>[c.id,c.team,c.c,c.r,this.radius(c),Object.entries(c.districts||{}).filter(([,d])=>d.economy.buildings.some(b=>!b.virtual)).map(([k])=>k).join(',')].join(':')).join('|');if(stamp===this.territoryStamp)return;this.territoryStamp=stamp;const candidates=new Map();for(const city of this.s.cities){const radius=this.radius(city),queue=[{c:city.c,r:city.r}],seen=new Set();for(let i=0;i<queue.length;i++){const p=queue[i],key=tileKey(p);if(seen.has(key)||p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS||Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))>radius||!this.cell(p).land)continue;seen.add(key);if(!candidates.has(key))candidates.set(key,[]);candidates.get(key).push(city);for(const[dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({c:p.c+dc,r:p.r+dr})}}
 this.territory=new Map();for(const[key,cities]of candidates){const[c,r]=key.split(':').map(Number),exact=this.cityAt({c,r}),built=cities.find(t=>t.districts?.[key]?.economy.buildings.some(b=>!b.virtual));if(exact||built){this.territory.set(key,exact||built);continue}const sorted=cities.map(city=>({city,d:(city.c-c)**2+(city.r-r)**2})).sort((a,b)=>a.d-b.d||a.city.id-b.city.id);if(sorted.length===1||sorted[0].d<sorted[1].d||sorted[0].city.team===sorted[1].city.team)this.territory.set(key,sorted[0].city)}
 }
 territoryOwner(p){if(!this.cell(p)?.land)return null;this.refreshTerritory();return this.territory.get(tileKey(p))||null}
 parentCity(ctx){return ctx.districtOf==null?ctx:this.s.cities.find(c=>c.id===ctx.districtOf)}
 contexts(city){const parent=this.parentCity(city);return [parent,...Object.values(parent.districts||{})]}
 allBuildings(city){return this.contexts(city).flatMap(c=>c.economy.buildings.filter(b=>!b.virtual))}
 // V66: all owned tiles constitute ONE city-wide construction area. Per-tile
 // contexts store only spatial objects; ownership, materials, prerequisites,
 // workforce and queued construction are evaluated for their parent city.
 constructionArea(city){
  const parent=this.parentCity(city);if(!parent)return null;
  this.refreshTerritory();
  const tiles=[...this.territory].filter(([,owner])=>owner.id===parent.id).map(([key])=>{const [c,r]=key.split(':').map(Number);return {c,r}});
  const buildings=this.allBuildings(parent);
  return {parent,tiles,buildings,pending:buildings.filter(b=>!b.ready&&b.hp>0),stock:parent.economy.realms[parent.team].resources};
 }
 storageCap(city,key){return storageLimit(this.allBuildings(city),key)}
 storageUsed(city,key,stock){return FOOD_KEYS.has(key)?[...FOOD_KEYS].reduce((n,k)=>n+(stock[k]||0),0):(stock[key]||0)}
 cityReady(city,type){return this.allBuildings(city).some(b=>b.team===city.team&&b.type===type&&b.ready&&b.hp>0)}
 attachDistrict(parent,region){region.districtOf=parent.id;region.constructionAreaId=parent.id;region.id=parent.id;region.team=parent.team;region.name=parent.name;region.economy.realms??=Array.from({length:4},()=>freshRealm());region.economy.realms[parent.team]=parent.economy.realms[parent.team];region.economy.time??=parent.economy.time;for(const b of region.economy.buildings)b.team=parent.team;this.prepareCity(region)}
 contextAt(p,create=false){const exact=this.cityAt(p);if(exact)return exact;const parent=this.territoryOwner(p);if(!parent)return null;parent.districts??={};const key=tileKey(p);if(parent.districts[key])return parent.districts[key];if(!create)return null;const world=this.localWorld(p),economy=initialState(this.s.seed);economy.settlers=[];economy.units=[];economy.cargo=[];economy.time=parent.economy.time;economy.buildings=[{type:'hall',x:0,z:0,team:parent.team,hp:1200,ready:true,virtual:true}];const region={c:p.c,r:p.r,foundedAt:this.s.time,world,economy};parent.districts[key]=region;this.attachDistrict(parent,region);this.localNavs.delete(key);return region}
 transferCity(city,team){const old=city.team,realm=copy(city.economy.realms[old]);for(const u of this.s.units)if(u.team===old&&u.garrison?.c===city.c&&u.garrison?.r===city.r){delete u.garrison;u.hp=0}city.team=team;city.builderAgents=[];city.trainingAgent=null;for(const q of city.training||[])q.team=team;city.economy.realms[team]=realm;for(const ctx of this.contexts(city)){ctx.team=team;ctx.economy.realms[team]=realm;for(const b of ctx.economy.buildings)b.team=team;for(const c of ctx.economy.cargo)c.team=team;ctx.world.workers={}}this.territoryStamp=null;reconcileVictory(this.s,team)}

 localWorld(p){const city=this.contextAt(p,false);if(city)return city.world;this.s.tileWorlds??={};const world=this.s.tileWorlds[tileKey(p)]??=this.makeWorld(this.cell(p));if(this.cell(p)?.land&&world.resources.some(r=>r.kind==='fish')){world.resources=world.resources.filter(r=>r.kind!=='fish');world.revision=(world.revision||0)+1}this.ensureBerries(world,this.cell(p));if(!world.foodResourcesVersion){for(const r of this.makeWorld(this.cell(p)).resources.filter(r=>['game','fish'].includes(r.kind)))world.resources.push({...r,id:world.resources.length});world.foodResourcesVersion=1;world.revision++}return world}
 nav(p){const city=this.contextAt(p,false),key=tileKey(p),cache=city?this.navs:this.localNavs;if(!cache.has(key)){const world=this.localWorld(p);world.trailTime=this.s.time;cache.set(key,new Navigation(world,(x,z)=>Math.abs(x)<72&&Math.abs(z)<62&&!this.cell(p).mountain&&detailHeight(this.cell(p),x,z)>.2,()=>(this.contextAt(p,false)?.economy.buildings||[]).filter(b=>!b.virtual)))}const n=cache.get(key);n.world.trailTime=this.s.time;n.refresh();return n}
 prepareCity(city){if(this.cell(city)?.land)city.world.resources=city.world.resources.filter(r=>r.kind!=='fish');if(city.districtOf==null){city.builderCount??=1;city.builderAgents??=[]}for(const id of Object.keys(city.world.workers||{}))if(id.startsWith('build:'))delete city.world.workers[id];this.ensureBerries(city.world,this.cell(city));if(!city.world.foodResourcesVersion){for(const r of this.makeWorld(this.cell(city)).resources.filter(r=>['game','fish'].includes(r.kind)))city.world.resources.push({...r,id:city.world.resources.length});city.world.foodResourcesVersion=1}city.foundedAt??=0;city.world.heat??={};city.world.workers??={};city.economy.settlers??=[];city.economy.units=[];city.economy.cargo??=[];migrateEconomy(city.economy);for(const b of city.economy.buildings)if(!b.virtual){configureWallFootprint(b);clearFootprint(city.world,b)}}
 env(city){const nav=this.nav(city),s=city.economy;return {unlimitedBuildingRange:true,buildTime:(type,time)=>time*tempoMultiplier(this.s),growthFactor:tempoMultiplier(this.s)*(this.allBuildings(city).some(b=>b.type==='inn'&&b.ready&&b.hp>0&&!b.disabled&&(b.assigned||0)>=.5)?.86:1),storageCap:(team,key)=>this.storageCap(city,key),storageUsed:(team,key,stock)=>this.storageUsed(city,key,stock),sameStorageGroup:(a,b)=>a===b||(FOOD_KEYS.has(a)&&FOOD_KEYS.has(b)),consumeHouseholds:(team,r,foodNeed,waterNeed)=>this.consumeHouseholds(city,r,foodNeed,waterNeed),assigned:b=>b.assigned||0,productionBonus:b=>this.bonus(city.team)*this.terrainBonus(city,b.type)*medievalBonus(this,city,b),buildWork:b=>b.workThisTick||0,operateWork:(b,dt)=>operateWorker(this,city,b,dt),skipDemographics:city.districtOf!=null,workerBudget:team=>team===city.team?(city.laborBudget??s.realms[team].pop):0,capacity:()=>housingCapacity(this.allBuildings(city)),requirement:type=>{const missing=BUILDINGS[type].requires.filter(k=>!this.cityReady(city,k)&&!(['oilwell','refinery'].includes(type)&&((type==='oilwell'&&k==='engineworks')||(type==='refinery'&&k==='oilwell'))&&this.s.cities.some(c=>c.team===city.team&&this.cityReady(c,k))));return missing.length?'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', '):''},priority:b=>{const food=['hunter','fisher','well','bakery'].includes(b.type);return food?0:b.type==='forester'?1:['lumber','quarry'].includes(b.type)?2:3},passable:(x,z)=>nav.passable(x,z),segmentDry:(a,b)=>{const n=Math.ceil(distance(a,b)*2);for(let i=0;i<=n;i++)if(!nav.passable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true},canOperate:b=>(BUILD_AGE[b.type]??0)<=this.s.ages[city.team],spawnPoint:door,moveCargo:(a,p,dt)=>nav.move(a,p,dt,4),harvest:(b,d,dt,multiplier)=>b.type==='fisher'?fishingHarvest(this,city,b,d,dt,nav,multiplier):gather(s,b,d,dt,nav,multiplier),plant:(b,d,dt)=>plantTrees(s,b,d,dt,nav),canBuild:p=>!city.world.resources.some(r=>!['tree','berry'].includes(r.kind)&&!['game','fish','berry'].includes(r.kind)&&!r.removed&&Math.abs(r.x-p.x)<4.5&&Math.abs(r.z-p.z)<4),onPlaced:b=>{clearFootprint(city.world,b);for(const r of city.world.resources.filter(r=>r.kind==='game'&&Math.abs(r.x-b.x)<5&&Math.abs(r.z-b.z)<5)){for(const[dx,dz]of [[9,9],[-9,9],[9,-9],[-9,-9],[15,0],[-15,0]]){const x=b.x+dx,z=b.z+dz;if(nav.passable(x,z)&&!s.buildings.some(h=>Math.abs(h.x-x)<5&&Math.abs(h.z-z)<5)){r.x=x;r.z=z;break}}}nav.rebuild()}}}
 moveSettler(id,cell){const a=this.s.settlers.find(a=>a.id===id);if(!a)return 'Asunik puudub.';if(a.embarked!=null)return 'Maabu esmalt transpordilaevalt.';const path=this.landPath(a,cell,a.team);if(!path)return 'Sihtkohta ei pääse mööda maad. Otsi koolmekoht, sild või meretee.';a.path=path;a.landed=false;a.localTarget=null;return ''}
 land(id){const a=this.s.settlers.find(a=>a.id===id);if(!a||a.path.length)return 'Oota asuniku saabumist.';if(a.embarked!=null)return 'Maabu esmalt laevalt.';if(this.territoryOwner(a))return 'See ruut kuulub olemasolevale linnale. Vali uus vaba ruut.';a.landed=true;const nav=this.nav(a),p=nav.nearest({x:a.x||0,z:a.z||0},80);if(!p)return 'Siin pole sobivat maad.';a.x=p.x;a.z=p.z;return ''}
 siteRule(a,p){if(!a.landed||a.path.length)return 'Ava esmalt asuniku detailkaart.';if(this.cityAt(a))return 'Sellel ruudul on juba linn.';if(this.territoryOwner(a))return 'See ruut kuulub olemasoleva linna alasse.';if(this.s.cities.some(c=>Math.abs(c.c-a.c)+Math.abs(c.r-a.r)<4))return 'Linnade vahele peab jääma vähemalt kolm maailmaruutu.';if(Math.abs(p.x)>42||Math.abs(p.z)>32)return 'Vali linnakoht detailkaardi keskosas.';const nav=this.nav(a);for(const dx of [-4,0,4])for(const dz of [-4,0,4])if(!nav.passable(p.x+dx,p.z+dz))return 'Linn vajab kuiva maad.';if(nav.world.resources.some(r=>!['tree','berry'].includes(r.kind)&&!['game','fish','berry'].includes(r.kind)&&!r.removed&&Math.abs(r.x-p.x)<5&&Math.abs(r.z-p.z)<4))return 'Kivimaardlale ei saa linna rajada.';return ''}
 found(id){const a=this.s.settlers.find(a=>a.id===id);if(!a)return {error:'Asunik puudub.'};if(a.localTarget)return {error:'Oota asuniku saabumist.'};const p={x:Math.round(a.x),z:Math.round(a.z)},error=this.siteRule(a,p);if(error)return {error};const idCity=Math.max(-1,...this.s.cities.map(c=>c.id))+1,economy=initialState(this.s.seed);economy.settlers=[];economy.realms[a.team].resources={...START,wood:100,stone:55,plank:0,gold:0,water:40};economy.realms[a.team].pop=3;economy.realms[a.team].growthProgress=0;if(a.cargo)economy.realms[a.team].resources=copy(a.cargo);economy.buildings=[{type:'hall',...p,team:a.team,hp:1200,ready:true}];economy.units=[];economy.cargo=[];const city={id:idCity,team:a.team,c:a.c,r:a.r,foundedAt:this.s.time,name:FACTION_NAMES[a.team]+'küla '+(this.s.cities.filter(c=>c.team===a.team).length+1),economy,world:this.localWorld(a),hp:600};this.s.cities.push(city);if(this.s.tileWorlds)delete this.s.tileWorlds[tileKey(a)];this.s.settlers.splice(this.s.settlers.indexOf(a),1);this.localNavs.delete(tileKey(a));this.prepareCity(city);return {city}}
 canBuildNow(city,type){const area=this.constructionArea(city);return !!area&&!this.buildRule(city,type)&&canAfford(area.stock,BUILDINGS[type].cost)&&area.pending.length<12}
 buildRule(city,type){if(this.cell(city)?.mountain)return 'Mäed on läbimatud ja sinna ei saa ehitada.';if(this.territoryOwner(city)?.id!==this.parentCity(city)?.id)return 'See ruut ei kuulu enam selle linna alasse.';if(type==='bridge'){const cell=this.cell(city);if(!cell?.river)return 'Silda saab ehitada ainult jõeruudule.';if(cell.bridge)return 'Sellel ruudul on sild juba olemas.';}if(type==='harbor'&&!isShore(this,city))return 'Sadam vajab rannikuruutu, mille kõrval on meri.';if(type==='fisher'&&!isShore(this,city))return 'Kalamehe onni saab ehitada ainult päris mererannale.';if(type==='watermill'&&!this.cell(city)?.river&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>this.cells[(city.r+dr)*COLS+city.c+dc]?.river))return 'Vesiveski vajab jõge samal või naaberruudul.';if(type==='windmill'&&!this.cell(city)?.deposits.grain)return 'Tuuleveski vajab avatud viljakat maad.';const tech=BUILD_TECH[type];if(tech&&!this.s.research[city.team].known.includes(tech))return 'Uuri: '+TECHS[tech].name;const age=this.s.ages[city.team],d=BUILDINGS[type];if((BUILD_AGE[type]??9)>age)return 'Vajab ajastut: '+AGES[BUILD_AGE[type]]?.name;const dep={claypit:'clay',pasture:'grain',coppermine:'copper',tinmine:'tin',lumber:'wood',quarry:'stone',mine:'ore',oilwell:'oil',farm:'grain',well:'water',hunter:'game'}[type];if(dep&&!this.cell(city).deposits[dep])return 'Selle linna ruudul puudub '+({clay:'savi',copper:'vasemaak',tin:'tinamaak',wood:'mets',stone:'kivi',ore:'rauamaak',grain:'viljakas põllumaa',water:'mageveeallikas',game:'ulukid',fish:'kalapüügikoht',oil:'naftamaardla'}[dep])+'.';const missing=d.requires.filter(k=>!this.cityReady(city,k)&&!(['oilwell','refinery'].includes(type)&&((type==='oilwell'&&k==='engineworks')||(type==='refinery'&&k==='oilwell'))&&this.s.cities.some(c=>c.team===city.team&&this.cityReady(c,k))));return missing.length?'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', '):''}
 previewBuild(city,type,p){const error=this.buildRule(city,type);if(error)return {error};if(this.constructionArea(city).pending.length>=12)return {error:'Linna ühises ehitusjärjekorras on juba 12 hoonet.'};if(type==='bridge')return {ok:true,p:{x:0,z:0}};const env=this.env(city);for(const dx of [-3,0,3])for(const dz of [-2.8,0,2.8])if(!env.passable(p.x+dx,p.z+dz))return {error:'Kogu hoone peab mahtuma kuivale maale.'};const levels=[[-3,-2.8],[-3,2.8],[3,-2.8],[3,2.8]].map(([dx,dz])=>detailHeight(this.cell(city),p.x+dx,p.z+dz));if(Math.max(...levels)-Math.min(...levels)>1.8)return {error:'Maapind on hoone jaoks liiga järsk.'};return placementRule(city.economy,city.team,type,p,env)}
 build(city,type,p){const check=this.previewBuild(city,type,p);if(check.error)return check;if(type==='bridge'){const r=city.economy.realms[city.team],cost=BUILDINGS.bridge.cost;if(!canAfford(r.resources,cost))return {error:'Silla jaoks napib materjale.'};for(const[k,n]of Object.entries(cost))r.resources[k]-=n;const building={type:'bridge',x:0,z:0,team:city.team,hp:350,progress:0,ready:false};city.economy.buildings.push(building);this.uiRevision++;return {building}}return placeBuilding(city.economy,city.team,type,p,this.env(city))}
 // An order can be given on any tile owned by the parent city. Coordinates
 // supplied by a detail-map click may extend into one of its eight neighbours.
 // Convert to the destination tile's local geometry before validation.
 resolveAreaSite(city,at){
  const parent=this.parentCity(city);
  if(!parent)return {error:'Linna ehitusala ei leitud.'};
  const dc=Math.floor((at.x+75)/150),dr=Math.floor((at.z+65)/130);
  if(Math.abs(dc)>1||Math.abs(dr)>1)return {error:'Vali ehituskoht linna kuuluval detailkaardil.'};
  const destination=this.cell({c:city.c+dc,r:city.r+dr});
  if(!destination?.land||this.territoryOwner(destination)?.id!==parent.id)
   return {error:'Valitud ruut ei kuulu selle linna ühisesse ehitusalasse.'};
  const point={x:Math.round((at.x-dc*150)/2)*2,z:Math.round((at.z-dr*130)/2)*2};
  // The destination remains a separate *physical* tile but not a city.
  const ctx=this.contextAt(destination,true);
  return {ctx,point};
 }
 previewInArea(city,type,at){
  const site=this.resolveAreaSite(city,at);
  if(site.error)return site;
  return {...this.previewBuild(site.ctx,type,site.point),...site};
 }
 buildInArea(city,type,at){
  const site=this.resolveAreaSite(city,at);
  if(site.error)return site;
  return {...this.build(site.ctx,type,site.point),...site};
 }
 wallGuards(city,b){return wallGuards(this.s,city,b)}
 stationWall(city,b,source=null){return stationWall(this,city,b,source)}
 releaseWall(city,b){return releaseWall(this,city,b)}
 toggleBuilding(city,b){if(!city.economy.buildings.includes(b)||b.type==='hall'||!b.ready)return {error:'Seda hoonet ei saa peatada.'};b.disabled=!b.disabled;return {ok:true}}

 recruit(city,kind){if(SHIPS[kind])return this.buildShip(city,kind);if(kind==="militia")return {error:"Elanikud kaitsevad linna automaatselt."};if(city.districtOf!=null)return this.recruit(this.parentCity(city),kind);const tech=UNIT_TECH[kind];if(tech&&!this.s.research[city.team].known.includes(tech))return {error:'Uuri: '+TECHS[tech].name};const d=TROOPS[kind],r=city.economy.realms[city.team];if(!d||d.age>this.s.ages[city.team])return {error:'See üksus ei ole veel avatud.'};if(d.requires.some(k=>!this.cityReady(city,k)))return {error:'Ehita esmalt '+d.requires.filter(k=>!this.cityReady(city,k)).map(k=>BUILDINGS[k].name).join(', ')};city.training??=[];if(city.training.length>=4)return {error:'Väljaõppe järjekord on täis (4).'};if(!canAfford(r.resources,d.cost)||r.pop<6)return {error:'Toorainet või elanikke napib.'};// The field army does not have to return home before a city can train troops.
 // Each finished recruit joins a local army or forms a new detachment.
 for(const[k,n]of Object.entries(d.cost))r.resources[k]-=n;r.pop-=3;city.training??=[];const job={kind,team:city.team,total:d.time*tempoMultiplier(this.s),progress:0,assigned:0,efficiency:0};city.training.push(job);return {unit:job,queued:job}}
 tickTraining(city,dt){const job=city.training?.[0];if(!job)return;if(job.ship){const port=this.contextAt(job.harbor,false);if(!port||port.team!==city.team||!port.economy.buildings.some(b=>b.type==='harbor'&&b.ready&&!b.disabled)){job.status='Sadama töö on peatatud';job.blocked=true;return}job.blocked=false;job.status=''}job.progress=Math.min(job.total,job.progress+trainingWorker(this,city,job,dt*(job.efficiency||0)*this.bonus(city.team)));if(job.progress+1e-8<job.total)return;if(job.ship){if(finishShip(this,city,job))city.training.shift();return}// Assign graduates to an army physically present in this city. If the main
 // army is exploring or fighting elsewhere, create a separate local detachment.
 const present=this.s.armies.find(a=>a.team===city.team&&a.c===city.c&&a.r===city.r&&a.embarked==null);
 let army=present;
 if(!army){
  const main=this.s.armies[city.team];
  if(main&&!armyUnits(this.s,main).length&&main.embarked==null){main.c=city.c;main.r=city.r;main.path=[];army=main}
  else{
   this.s.nextArmyId??=Math.max(1,...this.s.armies.map(a=>(a.id||0)+1));
   const id=this.s.nextArmyId++;
   army={id,team:city.team,c:city.c,r:city.r,path:[],stance:'defend'};
   this.s.armies.push(army);
  }
 }
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 this.s.units.push({kind:job.kind,team:city.team,armyId:army.id||0,cityId:city.id,x:hall.x,z:hall.z+6,hp:TROOPS[job.kind].hp,morale:100});
 city.training.shift()}
 tickBasic(city,dt){city.basicWorkers??={};const r=city.economy.realms[city.team],hall=city.economy.buildings.find(b=>b.type==='hall'),nav=this.nav(city);for(const[k,d]of Object.entries(BASIC_JOBS)){const b=city.basicWorkers[k]??={type:d.type,resourceKind:d.kind,workerKey:'basic:'+k,team:city.team,x:hall.x,z:hall.z};b.team=city.team;const assigned=city.basicAssigned?.[k]||0;b.assigned=assigned;if(!assigned)continue;const free=Math.max(0,this.storageCap(city,d.out)-this.storageUsed(city,d.out,r.resources));if(free<=0){b.status='Ladu täis';continue}const amount=gather(city.economy,b,d,dt*assigned/5*this.bonus(city.team),nav,RESOURCE_PRODUCTION_MULTIPLIER);if(amount){const delivered=Math.min(amount,free);r.resources[d.out]+=delivered;recordDelivery(r,city.economy.time,d.out,delivered)}}}

 recruitSettler(city){if(city.districtOf!=null)return this.recruitSettler(this.parentCity(city));if(!this.s.research[city.team].known.includes('settlement'))return {error:'Uuri: '+TECHS.settlement.name};const r=city.economy.realms[city.team],cost={wood:45,stone:20,bread:15};if(!canAfford(r.resources,cost)||r.pop<6)return {error:'Asunik vajab 45 puitu, 20 kivi, 15 toitu ja vähemalt 6 elanikku (2 lähevad uude linna).'};for(const[k,n]of Object.entries(cost))r.resources[k]-=n;r.pop-=2;const a={id:this.s.nextSettler++,team:city.team,c:city.c,r:city.r,x:0,z:0,path:[],landed:false,localTarget:null,cargo:{...START,wood:65,stone:35,plank:0,bread:22,water:45,gold:0}};this.s.settlers.push(a);return {settler:a}}
 queueResearch(team,id){return queueResearch(this.s,team,id)}
 research(team,id){return startResearch(this.s,team,id)}
 advance(city){const id=['bronze','iron','civics','renaissance','industrialization','modernity'][this.s.ages[city.team]];return id?this.research(city.team,id):{error:'Kõrgeim ajastu on saavutatud.'}}
 tick(dt){if(dt<=0||this.s.winner!==null)return;this.s.time+=dt;this.s.visionClock=(this.s.visionClock||0)+dt;if(this.s.visionClock>=3){this.s.visionClock=0;this.refreshVision();}tickShips(this,dt);decayWorldRoads(this.s,dt);this.s.localTrailDecayClock=(this.s.localTrailDecayClock||0)+dt;if(this.s.localTrailDecayClock>=60){this.s.localTrailDecayClock%=60;for(const nav of [...this.navs.values(),...this.localNavs.values()]){nav.world.trailTime=this.s.time;nav.pruneTrails()}}for(const u of this.s.units){const army=this.s.armies.find(a=>a.team===u.team&&(a.id||0)===(u.armyId||0))||this.s.armies[u.team],city=this.cityAt(army);if(!this.s.battle&&u.hp>0&&u.hp<(TROOPS[u.kind]?.hp||u.hp)&&city?.team===u.team&&city.economy.realms[u.team].resources.bread>0){const healed=Math.min((TROOPS[u.kind].hp-u.hp),dt*.12);u.hp+=healed;u.healSupply=(u.healSupply||0)+healed;if(u.healSupply>=12){city.economy.realms[u.team].resources.bread-=1;u.healSupply-=12}}}this.s.clock+=dt;this.s.railClock=(this.s.railClock||0)+dt;if(this.s.railClock>=25){this.s.railClock%=25;buildRailNetworks(this)}this.s.tradeClock+=dt;if(this.s.tradeClock>=15){this.s.tradeClock%=15;this.trade()}for(const a of this.s.settlers){if(a.embarked==null&&a.landed&&a.localTarget){if(this.nav(a).move(a,a.localTarget,dt,a.team>0?2.2:3))a.localTarget=null}}for(const parent of this.s.cities){this.applyUpgrades(parent);const realm=parent.economy.realms[parent.team],critical=realm.resources.bread<Math.ceil(realm.pop/4)*2;for(const ctx of this.contexts(parent))for(const w of Object.values(ctx.world.workers||{})){w.moving=false;w.working=false}allocateCity(this,parent);/* Update shoppers every tick, avoiding 3m jumps from the old 1-second batching. */
 tickMarketHouseholds(this,parent,dt);parent.marketClock=0;tickTownStreets(this,parent,dt);tickBuilders(this,parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:this.s.difficulty==='hard'?.95:.8):1));const totalEmployed=realm.employed;let used=0;const contexts=this.contexts(parent).sort((a,b)=>critical?Number(!a.economy.buildings.some(t=>['hunter','fisher','bakery'].includes(t.type)&&t.ready&&!t.disabled))-Number(!b.economy.buildings.some(t=>['hunter','fisher','bakery'].includes(t.type)&&t.ready&&!t.disabled)):0);for(const city of contexts){const mobilized=this.s.battle?.civilianCityId===parent.id?this.s.battle.squads.filter(u=>u.civilian).length:0;city.laborBudget=Math.max(0,(realm.housingShortage?Math.min(3,realm.pop):realm.pop)-used-mobilized);for(const r of city.world.resources)if(r.respawnAt!=null&&r.respawnAt<=city.economy.time){r.removed=false;r.amount=r.capacity||96;delete r.respawnAt;city.world.revision++}if(tickEconomy(city.economy,dt*(city.team>0?(this.s.difficulty==='easy'?.6:this.s.difficulty==='hard'?.95:.8):1),this.env(city)))this.uiRevision++;city.employed=realm.employed||0;used+=city.employed}this.tickBasic(parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:.75):1));this.tickTraining(parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:.75):1));for(const ctx of this.contexts(parent))healMedievalArmies(this,ctx,dt);for(const ctx of this.contexts(parent))if(ctx.economy.buildings.some(b=>b.type==='bridge'&&b.ready))this.cell(ctx).bridge=true;realm.employed=totalEmployed;this.radius(parent)}for(const research of this.s.research){if(research.active&&research.discoveryInsight>0){research.progress[research.active]=(research.progress[research.active]||0)+research.discoveryInsight;research.discoveryInsight=0}}this.researchEvents.push(...tickResearch(this.s,dt));this.autoExplore(dt);autoExploreNavy(this);this.advanceWorldMovers(dt);captureEnemySettlers(this);if(this.s.clock>=3){this.s.clock-=3;for(const cargo of [...this.s.shipments]){if(cargo.mode==='air'&&cargo.flightLeft>0)continue;if(cargo.mode!=='air'&&(cargo.blocked||(cargo.path.length&&!this.canTraverse(cargo.team,cargo.path[0])))){ const destination=this.s.cities.find(c=>c.id===cargo.to);const route=destination?this.landPath(cargo,destination,cargo.team):null;cargo.blocked=!route;if(!route)continue;cargo.path=route;cargo.mode='road'}if(!cargo.path.length){const city=this.s.cities.find(c=>c.id===cargo.to&&c.team===cargo.team);if(!city){this.s.shipments.splice(this.s.shipments.indexOf(cargo),1);continue}const stock=city.economy.realms[cargo.team].resources;for(const[k,n]of Object.entries(cargo.goods)){const free=Math.max(0,this.storageCap(city,k)-this.storageUsed(city,k,stock)),taken=Math.min(n,free);stock[k]=(stock[k]||0)+taken;cargo.goods[k]-=taken;if(cargo.goods[k]<=0.00001)delete cargo.goods[k]}if(!Object.keys(cargo.goods).length)this.s.shipments.splice(this.s.shipments.indexOf(cargo),1);else cargo.status='Ootab vaba laoruumi'}}if(this.s.time-(this.s.lastAIPlan||0)>=12){this.s.lastAIPlan=this.s.time;this.ai()}}}
 trade(){return planTrade(this)}

 aiDistricts(){for(const parent of this.s.cities.filter(c=>c.team>0)){const buildings=this.allBuildings(parent);for(const type of ['hunter','fisher','well','quarry','lumber','farm','mine','oilwell','harbor']){
 const needed=usefulDistrictTypes(this,parent.team);
 if(needed&&!needed.has(type))continue;
 const existing=buildings.filter(b=>b.type===type&&b.hp>0&&!b.disabled);
 // A new district must replace genuinely exhausted supply, not create
 // arbitrarily many mines/quarries that consume the entire workforce.
 if(existing.length>=2||!canAfford(parent.economy.realms[parent.team].resources,BUILDINGS[type].cost))continue;if(buildings.some(b=>b.type===type&&b.status!=='Lähedal pole ligipääsetavat toorainet'))continue;if((BUILD_AGE[type]||0)>this.s.ages[parent.team]||(BUILD_TECH[type]&&!this.s.research[parent.team].known.includes(BUILD_TECH[type])))continue;const dep={hunter:'game',fisher:'coast',well:'water',quarry:'stone',lumber:'wood',farm:'grain',mine:'ore',oilwell:'oil',harbor:'coast'}[type],tiles=[];
 // Territory radius is at most four tiles. Do not repeatedly scan the
 // entire 19,200-cell world for each possible building and every city.
 const span=this.radius(parent);
 for(let rr=Math.max(0,parent.r-span);rr<=Math.min(ROWS-1,parent.r+span);rr++)for(let cc=Math.max(0,parent.c-span);cc<=Math.min(COLS-1,parent.c+span);cc++){
  const p=this.cell({c:cc,r:rr});
  if(!p?.land||this.cityAt(p)||this.territoryOwner(p)?.id!==parent.id)continue;
  if(dep==='coast'?!isShore(this,p):!p.deposits[dep])continue;
  tiles.push(p);
 }
 tiles.sort((a,b)=>Math.abs(a.c-parent.c)+Math.abs(a.r-parent.r)-Math.abs(b.c-parent.c)-Math.abs(b.r-parent.r));for(const tile of tiles){const actualKind={lumber:'tree',quarry:'stone',hunter:'game',mine:'ore',oilwell:'oil'}[type];
 if(actualKind&&!this.localWorld(tile).resources.some(r=>r.kind===actualKind&&!r.removed&&(r.amount||0)>0))continue;
 const ctx=this.contextAt(tile,true);
 if(this.buildRule(ctx,type)||ctx.economy.buildings.some(b=>!b.virtual&&b.type===type))continue;let built=false;for(let x=-12;x<=12&&!built;x+=6)for(let z=-12;z<=12&&!built;z+=6)if(this.build(ctx,type,{x,z}).building)built=true;if(built)break}}}}

 ai(){for(const team of [1,2,3]){this.aiTeam(team);aiNavy(this,team)}this.aiDistricts()}
 aiTeam(team){
 // A rival may station a defender only from an actual army with surplus troops.
 for(const city of this.s.cities.filter(c=>c.team===team)){
  const wall=city.economy.buildings.find(b=>['palisade','stonewall'].includes(b.type)&&b.ready&&b.hp>0&&!b.disabled);
  const mobile=this.s.units.filter(u=>u.team===team&&u.hp>0&&!u.garrison);
  if(wall&&mobile.length>=4&&!this.wallGuards(city,wall).length)this.stationWall(city,wall);
 }
const science=this.s.research[team];if(!science.active&&this.s.cities.some(c=>c.team===team)){const order=['stone_tools','learning','hunting','water','agriculture','pottery','animal_husbandry','masonry','warfare','fortifications','archery','settlement','stone_crafts','bronze','woodworking','wheel','copper_tin','stone_fortifications','road_construction','forestry','storage','cellaring','commerce','writing','bronze_crafts','milling','bridges','fishing','shipbuilding','iron','smelting','smithing','horsemanship','philosophy','iron_crafts','navigation','civics','armor_craft','crossbows','guilds','watermills','windmills','medieval_healing','city_trade','monasticism','knighthood','castle_building','siege_engineering','city_fortifications','scholasticism','medieval_crafts','ocean_sailing','renaissance','printing','astronomy','gunpowder','industrialization','steelmaking','steam_engine','industrial_education','rifles','railways','modernity','oil_drilling','petroleum','electricity','combustion','modern_science','aviation'];const id=order.find(id=>!techBlock(science,id));if(id)this.research(team,id)}for(const a of this.s.settlers.filter(a=>a.team===team)){if(a.landed&&this.s.cities.some(c=>Math.abs(c.c-a.c)+Math.abs(c.r-a.r)<4)){a.landed=false;a.localTarget=null}if(a.path.length)continue;if(!a.landed){const missing=['wood','stone','grain','water','ore','game','fish',...(this.s.ages[team]>=6?['oil']:[])].filter(k=>!this.s.cities.some(c=>c.team===team&&this.cell(c).deposits[k]));const score=c=>missing.reduce((n,k)=>n+(c.deposits[k]?(k==='oil'?160:k==='grain'?30:k==='water'?18:k==='ore'?(this.s.ages[team]>=1?30:8):6):0),0)+(c.deposits.wood?8:0)+(c.deposits.grain&&c.deposits.water&&(missing.includes('grain')||missing.includes('water'))?15:0)-(Math.abs(c.c-a.c)+Math.abs(c.r-a.r))*2;const hasCity=this.s.cities.some(c=>c.team===team);const options=[];
 for(let rr=Math.max(0,a.r-9);rr<=Math.min(ROWS-1,a.r+9);rr++)for(let cc=Math.max(0,a.c-9);cc<=Math.min(COLS-1,a.c+9);cc++){
  const c=this.cell({c:cc,r:rr});
  if(!c?.land||this.territoryOwner(c)||(hasCity===false&&(!c.deposits.wood||!c.deposits.stone))||
   this.s.cities.some(t=>Math.abs(t.c-c.c)+Math.abs(t.r-c.r)<4)||Math.abs(c.c-a.c)+Math.abs(c.r-a.r)>9)continue;
  options.push(c);
 }
 options.sort((p,q)=>score(q)-score(p));const target=options.find(c=>this.landPath(a,c,team)!==null);if(!target)continue;if(a.c!==target.c||a.r!==target.r){this.moveSettler(a.id,target);continue}this.land(a.id)}if(a.localTarget)continue;let founded=false;for(let x=-18;x<=18&&!founded;x+=6)for(let z=-18;z<=18&&!founded;z+=6){if(!this.siteRule(a,{x,z})&&this.nav(a).route(a,{x,z})){if(distance(a,{x,z})<1){this.found(a.id);founded=true}else{a.localTarget={x,z};founded=true}}}}
 for(const city of this.s.cities.filter(c=>c.team===team)){const army=this.s.armies[team];if(city===this.s.cities.find(c=>c.team===team)&&!army.path.length&&this.s.units.filter(u=>u.team===team&&u.hp>0).every(u=>u.kind==='scout')&&(army.c!==city.c||army.r!==city.r))army.path=this.landPath(army,city,team)||[];const age=this.s.ages[team];
 // A usable production chain is more important than a fixed construction list.
 // Decisions include affordability, terrain restrictions, available labour,
 // era material reserves, and the prerequisites of each missing resource.
 const decision=selectAIBuild(this,team,city);
 if(decision){
  const next=decision.type,h=city.economy.buildings[0],spots=[];
  for(let dx=-24;dx<=24;dx+=6)for(let dz=-24;dz<=24;dz+=6)spots.push({x:h.x+dx,z:h.z+dz});
  const kind=({quarry:'stone',mine:'ore',lumber:'tree',hunter:'game',fisher:'fish'})[next];
  const deposits=kind?city.world.resources.filter(r=>r.kind===kind&&!r.removed):[];
  const score=p=>deposits.length?Math.min(...deposits.map(r=>distance(r,p))):distance(p,h);
  spots.sort((a,b)=>score(a)-score(b));
  for(const p of spots)if(this.build(city,next,p).building)break;
 }
 const stock=city.economy.realms[team].resources;
 const problems=cityProblems(this,city);city.aiDiagnostics=problems.slice(0,3).map(x=>x.text);
 // Construction recovery: an AI unable to assign builders is nudged back to an active queue.
 if(this.allBuildings(city).some(b=>!b.ready&&!b.disabled)&&(!city.builderCount||city.builderCount<1))city.builderCount=1;
 // Re-enable essential production, where a halted building is the only supplier.
 if(problems.some(p=>p.level>=3))for(const b of this.allBuildings(city).filter(b=>b.ready&&b.hp>0&&b.disabled&&['well','hunter','fisher','farm','lumber','quarry'].includes(b.type))){b.disabled=false;b.workerLimit=Math.max(1,b.workerLimit||1)}
 if(!science.ageWait&&this.s.time>=((this.s.aiRecruitAt??={})[team]??210)&&this.s.units.filter(u=>u.team===team&&u.hp>0).length<6&&city.economy.realms[team].pop>=9&&(city.training?.length||0)<2){const choices=[...(age>=6?['motorized']:[]),...(age>=5?['rifleman']:[]),...(age>=4?['musketeer']:[]),'infantry','archer','spearman','axeman','slinger'];const kind=choices.find(k=>{const d=TROOPS[k],tech=UNIT_TECH[k];return age>=d.age&&(!tech||science.known.includes(tech))&&d.requires.every(type=>this.cityReady(city,type))&&canAfford(stock,d.cost)})||'slinger';const result=this.recruit(city,kind);if(result.unit)(this.s.aiRecruitAt??={})[team]=this.s.time+45;}if(!science.ageWait&&(this.s.time>650||(age>=2&&this.s.cities.every(c=>c.team!==team||!this.cell(c).deposits.ore))||(age>=6&&!this.s.cities.some(t=>t.team===team&&this.contexts(t).some(x=>this.cell(x)?.deposits.oil))))&&this.s.time-(city.lastSettler||0)>160&&this.s.cities.filter(c=>c.team===team).length<(age>=6?6:4)&&!this.s.settlers.some(a=>a.team===team)&&city.economy.realms[team].resources.bread>=23){const result=this.recruitSettler(city);if(result.settler)city.lastSettler=this.s.time}}
 const army=activeArmies(this.s,team).sort((a,b)=>armyUnits(this.s,b).length-armyUnits(this.s,a).length)[0]||this.s.armies[team];
 // AI must scout rather than know all opponents' city coordinates from the start.
 if(army.embarked==null&&!army.path.length&&this.s.time>360&&!this.s.cities.some(c=>c.team!==team&&this.visibleNow(team,c))){
  const seen=this.s.explored?.[team]||{},options=[];
  for(let dr=-7;dr<=7;dr+=2)for(let dc=-7;dc<=7;dc+=2){const c=army.c+dc,r=army.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;
   const key=c+':'+r;if(!seen[key]&&this.canTraverse(team,{c,r}))options.push({c,r,dist:Math.abs(dc)+Math.abs(dr)})}
  options.sort((a,b)=>a.dist-b.dist);
  for(const pos of options.slice(0,12)){const path=this.landPath(army,pos,team);if(path?.length){army.path=path;break}}
 }
 if(army.embarked==null&&this.s.time>=this.s.aiPeaceUntil&&!this.s.battle&&!army.path.length&&armyUnits(this.s,army).length>=3){const target=[...this.s.cities,...this.s.settlers].filter(c=>c.team!==team&&this.seen(team,c)).sort((a,b)=>Math.abs(a.c-army.c)+Math.abs(a.r-army.r)-Math.abs(b.c-army.c)-Math.abs(b.r-army.r))[0];if(target)army.path=this.landPath(army,target,team)||[]}}
}
