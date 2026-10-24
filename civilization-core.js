import {findAIFieldSite,ruralSourceExhausted} from './ai-rural-v143.js';
import {allocateTerritory} from './territory-v143.js';
import {urbanExpansionFits,grownCityRadius} from './city-area-v142.js';
import {installGameRevisions,citySummary,cityContexts,cityLookup,navigationRevision,resourcesNear,buildingsNear} from './perf-state-v131.js';
import {DEFENSE_TYPES,planAIDefenses} from './ai-defenses-v128.js';
import {applyDevelopmentBalance,combatUnit,militaryChoices,readyForNextEra,allowAIResearch} from './ai-development-v128.js';
import {farmWork,fieldSize,fieldContains,validateField,migrateLegacyFarms,AI_FIELD_WIDTH,AI_FIELD_DEPTH} from './farming-v127.js';
import {marketFoodGrowth} from './city-growth-v137.js';
import {historicalTilePlan,historicalTilePriority} from './historical-districts-v137.js';
import {countyFootprint,countySearchRadius,urbanTile,countyBuildRule,countyBuildingCount,citySpacingAllowed,MIN_CITY_SPACING} from './counties-v126.js?v=136a';
import {AI_CITY_SPACING,historicalCitySites,historicalDistrictOrder,historicalSiteScore} from './historical-city-v135.js';
import {historicalBuildingPlots,nextPlotBatch,urbanExpansionEligible} from './historic-urban-v138.js';
import {V139_CORE_HOUSES,cityInfillRank} from './urban-infill-v139.js';
import {unitSuccessor,buildingSuccessor,suppliesBuilding} from './era-availability-v116.js?v=118a';
import {migrateBattleAmmunition} from './combat-equipment-v100.js';
import {balanceUnitDefinitions,migrateUnitHealth,UNIT_BALANCE_VERSION} from './unit-balance-v99.js';
import {createBattleNavigation} from './battle-navigation-v88.js';
import {BATTLEFIELD} from './battlefield-v88.js';
import {installEraUnits,troopCost,UNIT_GRADES} from './military-v88.js?v=117a';
import {initArmyExperience,syncArmyStats,unitStats,armyTravelMultiplier,rallyArmies} from './army-experience-v88.js';
import {productivityBonus,productivityResearchOrder} from './productivity-techs-v88.js';
import {localSurface,localToWorld,riverNear} from './continuous-landscape.js?v=123a';
import {DETAIL_HALF_X,DETAIL_HALF_Z,DETAIL_TILE_X,DETAIL_TILE_Z,tileDelta,localTilePoint} from './detail-scale-v123.js';
import {MINERAL_BUILDINGS,COASTAL_BUILDINGS,consolidateMinerals,mineralSite,mineralPlacement,harvestMineral,coastalPlacement,coastalSites} from './resource-sites-v88.js';
import {nationalResourceNeeds,settlementResourceScore,specializeNewCity} from './settlement-ai-v88.js?v=125a';
import {GOOD_BUILDINGS,cityNeeds,seedGoods,foodTotal,consumeLuxuries} from './city-needs-v87.js';
import {atWar,tickDiplomacy,setRelation} from './diplomacy-v87.js';
import {advanceMerchant,receiveMerchant,planMerchants} from './merchant-v87.js?v=125a';
import {availableLabor} from './gameplay-flow-v86.js?v=86a';
import {visibleNow,updateEnemyIntel,armyUnits,activeArmies,splitArmy,mergeArmies,cityProblems} from './v51-systems.js';
import {buildDrainage,openStartingPassages} from './world-geography.js?v=65c';
import {createLandmarks,collectLandmark,findExplorationPath} from './world-discoveries.js';
import {buildRailNetworks} from './infrastructure.js';
import {ERA_MATERIALS,ageDeficit} from './era-economy.js';
import {selectAIBuild,usefulDistrictTypes} from './ai-strategy.js?v=125a';
import {settlerPolicy,armyCapacity} from './growth-balance-v125.js';
import {bronzeResearchGoals,prosperousTownGrowth} from './bronze-city-balance-v160.js';
import {productionReformV125,expandResearchOrderV125} from './technology-reforms-v125.js';
import {tickBuilders,tickMarketHouseholds,operateWorker,trainingWorker} from './builders.js?v=100a';
import {tickTownStreets} from './town-streets-v80.js?v=80c';
import {SHIPS,seaAllowed,seaPath,harborExit,buildShip,finishShip,tickShips,embark,disembark,aiNavy,autoExploreNavy} from './naval.js?v=125b';
import {reconcileVictory,captureEnemySettlers} from './victory-v72.js';
import {initializeFisheries,isShore,fishingHarvest} from './fishery.js?v=64b';
import {upgradeLevel,productionBonus,upgradedName} from './upgrades.js';
import {continentLayout,continentHeight} from './continent-map.js?v=55';
import {tempoMultiplier} from './tempo.js';
import {scienceRate} from './science.js?v=125a';
import {terrainYields,bonusDescription} from './terrain-economy.js';
import {planTrade} from './trade-network.js';
import {earthHeight,EARTH_STARTS} from './earth-map.js';
import {chooseCoastalStarts} from './coastal-starts.js?v=62';
import {BASIC_JOBS,allocateCity,housingCapacity,HALL_CAPACITY,HOUSE_CAPACITY,FOOD_PER_RESIDENT,WATER_PER_RESIDENT} from './labor.js';
import {TECHS,BUILD_TECH,UNIT_TECH,newResearch,initResearch,startResearch,tickResearch,techBlock,queueResearch,nextResearchForGoals} from './research.js?v=125a';
import {BUILDINGS,RESOURCE_NAMES,START,RESOURCE_PRODUCTION_MULTIPLIER,FOOD_KEYS,storageLimit,takeFood,recordDelivery,realm as freshRealm,initialState,migrateEconomy,buildRule as placementRule,placeBuilding,tickEconomy,ready,canAfford,spendResources} from './economy.js';
import {Navigation,clearFootprint,door,gather,plantTrees} from './navigation.js';
import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,WORLD_CENTER_X,WORLD_CENTER_Z,ORIGIN_X,ORIGIN_Z,center,makeGrid,findPath} from './campaign.js';
import {bakeDetails,detailHeight} from './world-details.js?v=123a';
import {roadBoost,recordWorldStep,decayWorldRoads} from './roads.js?v=59';
import {wallGuards,stationWall,releaseWall,configureWallFootprint} from './fortifications.js?v=117a';
import {MEDIEVAL_BUILDINGS,MEDIEVAL_UNITS,medievalBonus,healMedievalArmies} from './medieval-v62.js?v=117a';
export {BUILDINGS,RESOURCE_NAMES};
RESOURCE_NAMES.bread='Teraviljatoit';BUILDINGS.harbor={name:'Sadam ja laevatehas',icon:'⚓',cost:{wood:60,plank:25,stone:25},requires:['lumber','quarry'],workers:0,time:40};BUILDINGS.hall.name='Algusmaja · 3 töölist';
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
BUILDINGS.scriptorium={name:'Kirjutuskoda',icon:'✎',cost:{wood:35,stone:18},requires:['house'],workers:2,time:70};
BUILDINGS.academy={name:'Akadeemia',icon:'♙',cost:{plank:55,stone:42},requires:['house','mason'],workers:3,time:95};
BUILDINGS.university={name:'Ülikool',icon:'✥',cost:{plank:90,stone:75,iron:8},requires:['mason','saw'],workers:4,time:130};

Object.assign(BUILDINGS,{
 printer:{name:'Trükikoda',icon:'▤',cost:{plank:48,stone:26,iron:8},requires:['university'],workers:3,time:105,input:{plank:3},out:'paper',rate:5,cycle:12},
 observatory:{name:'Tähetorn',icon:'◉',cost:{stone:90,plank:55,iron:12},requires:['university'],workers:3,time:130},
 nitrate:{name:'Salpeetritöökoda',icon:'◇',cost:{wood:55,stone:40,iron:6},requires:['farm'],workers:3,time:112,input:{grain:4,water:2},out:'saltpeter',rate:3,cycle:16},
 powdermill:{name:'Püssirohuveski',icon:'✹',cost:{stone:85,plank:50,iron:12},requires:['nitrate','coal'],workers:3,time:125,input:{saltpeter:3,coal:2},out:'gunpowder',rate:4,cycle:16},
 steelworks:{name:'Terasevabrik',icon:'⚒',cost:{stone:115,iron:35,plank:55},requires:['smelter'],workers:5,time:165,input:{iron:5,coal:3},out:'steel',rate:6,cycle:18},
 engineworks:{name:'Masinatehas',icon:'⚙',cost:{steel:32,iron:25,plank:85},requires:['steelworks'],workers:4,time:180,input:{steel:3,plank:2},out:'machines',rate:3,cycle:18},
 polytechnic:{name:'Polütehnikum',icon:'✥',cost:{stone:110,steel:30,paper:18},requires:['engineworks'],workers:4,time:170},
 railstation:{name:'Raudteejaam',icon:'▣',cost:{steel:40,stone:95,machines:15},requires:['engineworks'],workers:2,time:180},
 oilwell:{name:'Naftapuurauk',icon:'◈',cost:{steel:35,machines:20,stone:65},requires:['engineworks'],workers:4,time:190,out:'oil',rate:6,cycle:18},
 refinery:{name:'Rafineerimistehas',icon:'♨',cost:{steel:55,machines:22,stone:80},requires:['oilwell'],workers:4,time:220,input:{oil:5,coal:1},out:'fuel',rate:5,cycle:16},
 powerplant:{name:'Elektrijaam',icon:'⚡',cost:{steel:50,machines:28,stone:90},requires:['engineworks'],workers:4,time:200,input:{coal:4},out:'power',rate:12,cycle:12},
 autofactory:{name:'Autotehas',icon:'⚙',cost:{steel:80,machines:40,stone:100},requires:['engineworks','refinery','powerplant'],workers:5,time:240,input:{steel:4,fuel:3,power:6},out:'vehicles',rate:2,cycle:24},
 laboratory:{name:'Uurimislabor',icon:'⚗',cost:{steel:55,machines:30,paper:25},requires:['powerplant'],workers:5,time:220},
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
 palisade:{name:'Puitvall',icon:'▥',cost:{wood:30,stone:4},requires:['lumber'],workers:0,time:35},
 watchtower:{name:'Vahitorn',icon:'♜',cost:{wood:45,stone:18},requires:['lumber','quarry'],workers:1,time:50},
 stonewall:{name:'Madal kivivall',icon:'▤',cost:{stone:58,cutstone:18,wood:8},requires:['quarry','mason'],workers:0,time:58},
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

// V137: original house 23 wood after balance becomes 12 (rounding the 50% discount).
BUILDINGS.house.cost.wood=Math.ceil(BUILDINGS.house.cost.wood/2);
// V36: staffing requirements reflect the physical work done in each industry.
Object.assign(BUILDINGS.quarry,{workers:3});Object.assign(BUILDINGS.farm,{workers:4});Object.assign(BUILDINGS.saw,{workers:3});Object.assign(BUILDINGS.mine,{workers:4});Object.assign(BUILDINGS.harbor,{workers:3});
BUILDINGS.coppermine.requires=['hall'];BUILDINGS.tinmine.requires=['hall'];BUILDINGS.hunter.out='meat';BUILDINGS.fisher.out='fish';BUILDINGS.pasture.out='meat';
export const AGES=[{name:'Kiviaeg',cost:null},{name:'Pronksiaeg',cost:ERA_MATERIALS.bronze,requires:['lumber','quarry','house']},{name:'Rauaaeg',cost:ERA_MATERIALS.iron,requires:['saw','mill','bakery']},{name:'Keskaeg',cost:ERA_MATERIALS.civics,requires:['smith','smelter','house']},{name:'Renessanss',cost:ERA_MATERIALS.renaissance,requires:['university']},{name:'Tööstusajastu',cost:ERA_MATERIALS.industrialization,requires:['printer','powdermill']},{name:'Moodne ajastu',cost:ERA_MATERIALS.modernity,requires:['steelworks','polytechnic']}];
Object.assign(BUILDINGS.farm,{name:'Põllutalu · farmerihoone',requires:['hall']});
BUILDINGS.field={name:'Põld · lohista ala',icon:'▥',cost:{wood:6},requires:['farm'],workers:0,time:12};
Object.assign(BUILDINGS.pasture,{name:'Loomafarm',requires:['hall'],out:'meat',input:{water:2},rate:5});
BUILD_TECH.field='agriculture';
export const BUILD_AGE={library:1,school:3,public_school:5,high_school:5,field:0,...Object.fromEntries(Object.entries(GOOD_BUILDINGS).map(([k,d])=>[k,d.age])),...Object.fromEntries(Object.keys(MEDIEVAL_BUILDINGS).map(k=>[k,3])),siegeworkshop:2,watermill:2,gatehouse:1,reinforced_wall:1,palisade:0,watchtower:0,stonewall:1,stonetower:1,claypit:0,pottery_kiln:0,pasture:0,mason:0,cartwright:1,coppermine:1,tinmine:1,bronze_foundry:1,road_depot:1,printer:4,observatory:4,nitrate:3,powdermill:3,steelworks:5,engineworks:5,polytechnic:5,railstation:5,oilwell:5,refinery:5,powerplant:5,autofactory:5,laboratory:6,airfield:6,study:0,scriptorium:1,academy:2,university:3,warehouse:1,cellar:1,market:1,harbor:1,bridge:1,hall:0,lumber:0,forester:1,quarry:0,house:0,well:0,farm:0,hunter:0,fisher:0,barracks:0,saw:1,mill:1,bakery:1,archery:0,mine:2,coal:2,smelter:2,smith:2,stable:2};
export const TROOPS={scout:{name:"Avastaja",age:0,cost:{wood:10},requires:[],hp:55,dmg:3,range:2.5,speed:4.3},militia:{name:"Linna kaitsjad",age:0,cost:{},requires:[],hp:36,dmg:4,range:3,speed:2.6},slinger:{name:'Kiviviskajad',age:0,cost:{wood:8,stone:18},requires:['barracks'],hp:85,dmg:7,range:10,speed:2.7},spearman:{name:'Puuodamehed',age:0,cost:{wood:22,stone:4},requires:['barracks'],hp:125,dmg:10,range:3,speed:2.8},axeman:{name:'Kivikirvemehed',age:0,cost:{wood:14,stone:14},requires:['barracks'],hp:140,dmg:12,range:2.5,speed:2.7},archer:{name:'Vibukütid',age:0,cost:{wood:25,stone:8,bread:8},requires:['archery'],hp:100,dmg:12,range:13,speed:2.8},infantry:{name:'Raudmõõgamehed',age:2,cost:{weapons:3,bread:10},requires:['smith','barracks'],hp:175,dmg:18,range:3,speed:2.8},cavalry:{name:'Ratsavägi',age:2,cost:{weapons:4,bread:18},requires:['stable'],hp:210,dmg:23,range:3.5,speed:4.6}};
Object.assign(TROOPS,{musketeer:{name:'Musketärid',age:4,cost:{gunpowder:8,iron:10,bread:10},requires:['barracks','powdermill'],hp:170,dmg:26,range:15,speed:2.7},rifleman:{name:'Püssimehed',age:5,cost:{gunpowder:10,steel:6,bread:12},requires:['barracks','steelworks'],hp:220,dmg:38,range:20,speed:3.1},motorized:{name:'Motoriseeritud jalavägi',age:6,cost:{fuel:15,vehicles:2,weapons:5,bread:16},requires:['autofactory','barracks'],hp:300,dmg:48,range:18,speed:5.1}});
for(const [kind,d]of Object.entries(TROOPS))d.time={scout:18,slinger:25,spearman:30,axeman:35,archer:40,infantry:50,cavalry:60,musketeer:70,rifleman:90,motorized:125,militia:0}[kind];
Object.assign(TROOPS,SHIPS);
Object.assign(TROOPS,MEDIEVAL_UNITS);
installEraUnits(TROOPS,UNIT_TECH);
balanceUnitDefinitions(TROOPS);
applyDevelopmentBalance(BUILDINGS,TROOPS);
// V160: houses are small, repeated investments; keep the half-capacity per home.
// Stone walls spend real dressed stone but no longer consume an entire timber supply.
BUILDINGS.house.time=Math.ceil(BUILDINGS.house.time*.85);
BUILDINGS.mason.cost.wood=Math.ceil(BUILDINGS.mason.cost.wood*.7);
BUILDINGS.mason.cost.stone=Math.ceil(BUILDINGS.mason.cost.stone*.75);
BUILDINGS.lumber.rate=Math.ceil(BUILDINGS.lumber.rate*1.5);
BUILDINGS.market.cost.wood=Math.ceil(BUILDINGS.market.cost.wood*.5);
BUILDINGS.market.cost.stone=Math.ceil(BUILDINGS.market.cost.stone*.6);
BUILDINGS.market.time=Math.ceil(BUILDINGS.market.time*.75);
BUILDINGS.stonewall.cost.wood=1;
BUILDINGS.stonewall.cost.cutstone=Math.max(3,Math.ceil(BUILDINGS.stonewall.cost.cutstone*.65));
BUILDINGS.stonetower.cost.cutstone=Math.max(5,Math.ceil(BUILDINGS.stonetower.cost.cutstone*.7));
BUILDINGS.mason.rate=Math.ceil(BUILDINGS.mason.rate*1.6);
BUILDINGS.gatehouse.cost.plank=0;
BUILDINGS.gatehouse.cost.wood=4;
BUILDINGS.stonetower.cost.plank=0;
BUILDINGS.stonetower.cost.wood=4;
BUILDINGS.gatehouse.cost.stone=Math.ceil(BUILDINGS.gatehouse.cost.stone*.55);
BUILDINGS.gatehouse.cost.cutstone=Math.ceil(BUILDINGS.gatehouse.cost.cutstone*.55);
// Mason teams construct real, paid segments more rapidly with Bronze tools.
BUILDINGS.stonewall.time=Math.max(10,Math.ceil(BUILDINGS.stonewall.time*.35));
BUILDINGS.stonetower.time=Math.max(18,Math.ceil(BUILDINGS.stonetower.time*.55));
BUILDINGS.gatehouse.time=Math.max(18,Math.ceil(BUILDINGS.gatehouse.time*.48));
// Workshops use delivered inputs; they do not require owning the supplying mine.
BUILDINGS.barracks.requires=['hall'];BUILDINGS.mason.requires=['hall'];BUILDINGS.bronze_foundry.requires=['mason'];
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

export function createGame(seed,type='continents'){return {version:4,unitBalanceVersion:UNIT_BALANCE_VERSION,roadKeyCols:COLS,hydrologyVersion:2,tempo:'normal',researchBalanceVersion:2,mapExpansionVersion:2,worldScaleVersion:2,geographyVersion:type==='continents'?4:0,coastalStartsVersion:1,seed,type,difficulty:'normal',time:0,research:STARTS.map(()=>newResearch()),ages:[0,0,0,0],cities:[],settlers:(type==='continents'?continentLayout(seed,true).starts:STARTS).map((p,team)=>({id:team,team,...p,x:0,z:0,path:[],landed:false,localTarget:null})),nextSettler:4,units:STARTS.map((p,team)=>({kind:'scout',team,hp:TROOPS.scout.hp,morale:100})),explorerVersion:1,armies:(type==='continents'?continentLayout(seed,true).starts:STARTS).map((p,team)=>({team,...p,path:[]})),deployments:{},explored:Array.from({length:4},()=>({})),visionClock:0,clock:0,battle:null,winner:null}};
export function migrateGame(old){if(old?.version===4)return old;if(!old?.world)return null;const s=createGame(old.world.seed,old.world.type);delete s.research;s.time=old.time||0;s.ages=old.realms?.map(r=>r.tech?3:old.buildings.some(b=>b.type==='smith')?2:0)||[0,0];s.settlers=[];for(const team of [0,1]){const hall=old.buildings.find(b=>b.team===team&&b.type==='hall');if(!hall){s.settlers.push({id:s.nextSettler++,team,c:team?17:10,r:team?9:11,x:old.settlers?.[team]?.x||0,z:old.settlers?.[team]?.z||0,path:[],landed:false,localTarget:null});continue}const indices=old.buildings.map((b,i)=>b.team===team?i:-1).filter(i=>i>=0),econ=initialState(s.seed);econ.settlers=[];econ.buildings=indices.map(i=>{const b=copy(old.buildings[i]);if(b.parent!=null)b.parent=indices.indexOf(b.parent);return b});econ.realms[team]=copy(old.realms[team]);econ.cargo=[];econ.units=[];migrateEconomy(econ);s.cities.push({id:s.cities.length,team,c:team?17:10,r:team?9:11,name:team?'Idakindlus':'Kadakalinn',economy:econ,world:old.cityWorlds?.[team]||old.cityWorld?copy(old.cityWorlds?.[team]||old.cityWorld):null,hp:600});if(s.cities.at(-1).world)s.cities.at(-1).world.workers={}}
s.units=copy(old.units||[]).map(u=>({...u,cityId:s.cities.find(c=>c.team===u.team)?.id}));if(old.campaign){s.armies=copy(old.campaign.armies);s.deployments=copy(old.campaign.deployments||{})}s.armies=s.armies.slice(0,2);delete s.mapExpansionVersion;delete s.geographyVersion;return s;}
export class Civilization{
 constructor(state){
 state.strategyPacingV125??=true;
 migrateUnitHealth(state);
 migrateBattleAmmunition(state.battle);
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
 if(state.mapExpansionVersion!==2){for(const team of [2,3]){const p=STARTS[team];state.settlers.push({id:state.nextSettler++,team,...p,x:0,z:0,path:[],landed:false,localTarget:null});state.armies.push({team,...p,path:[]});state.units.push({kind:"scout",team,hp:TROOPS.scout.hp,morale:100});state.ages[team]=0;if(state.research)state.research[team]=newResearch()}state.mapExpansionVersion=2;}if(!state.explorerVersion){for(const team of [0,1])state.units.push({kind:"scout",team,hp:TROOPS.scout.hp,morale:100});state.explorerVersion=1}state.tempo??='normal';initResearch(state);if(state.researchBalanceVersion!==2){for(const r of state.research){for(const [id,progress] of Object.entries(r.progress||{})){if(TECHS[id])r.progress[id]=Math.min(TECHS[id].turns*10*tempoMultiplier(state),Math.max(0,progress)*10/60*tempoMultiplier(state))}r.boosted??=[]}state.researchBalanceVersion=2}state.ships??=[];state.nextShip??=0;state.enemyIntel??={};state.nextArmyId??=Math.max(1,...(state.armies||[]).map(a=>(a.id||0)+1));this.s=state;if(state.battle)state.battle.field??={...BATTLEFIELD};this.battleNavs=new WeakMap();initArmyExperience(state,TROOPS);if(!state.relations){state.relations={};const teams=[...new Set((state.battle?.squads||[]).map(u=>u.team))];for(const a of teams)for(const b of teams)if(a<b)state.relations[a+':'+b]={status:'war',tension:0};}state.worldRoads??={};if(state.roadKeyCols!==COLS){const oldCols=state.roadKeyCols||160;const rekey=key=>{const [a,b]=key.split(':').map(Number);const points=[a,b].map(n=>({c:n%oldCols,r:Math.floor(n/oldCols)}));if(points.some(p=>p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS))return null;return points.map(p=>p.r*COLS+p.c).sort((x,y)=>x-y).join(':')};const upgradeMap=old=>{const mapped={};for(const [k,v]of Object.entries(old||{})){const key=rekey(k);if(key)mapped[key]=v}return mapped};state.worldRoads=upgradeMap(state.worldRoads);state.railEdges=upgradeMap(state.railEdges);state.roadKeyCols=COLS;state.roadRevision=(state.roadRevision||0)+1;state.railRevision=(state.railRevision||0)+1}state.roadRevision??=0;state.roadDecayClock??=0;this.buildingDefinitions=BUILDINGS;this.troopDefinitions=TROOPS;this.researchEvents=[];this.discoveryEvents=[];this.uiRevision=0;this.cols=COLS;this.rows=ROWS;this.terrainBonusCache=new Map();state.events??=[];this.navs=new Map();this.localNavs=new Map();this.aiClock=0;state.difficulty??='normal';state.explored??=Array.from({length:4},()=>({}));state.visionClock??=0;if(state.aiBalanceVersion!==2){state.aiBalanceVersion=2;state.aiPeaceUntil=Math.max(540,state.time+150);state.nextAIRecruit=Math.max(210,state.time+45);if(!state.battle)state.armies[1].path=[]}state.shipments??=[];state.railEdges??={};state.railLinks??={};state.railRevision??=0;state.railClock??=0;state.tradeClock??=0;state.nextShipment??=0;const seed=state.seed;this.noise=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+seed*.017)*43758.5453;return n-Math.floor(n)};this.smooth=(x,z)=>{const i=Math.floor(x),j=Math.floor(z);let u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return (this.noise(i,j)*(1-u)+this.noise(i+1,j)*u)*(1-v)+(this.noise(i,j+1)*(1-u)+this.noise(i+1,j+1)*u)*v};
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
 // Legacy drainage also avoids claiming an unwalkable mountainous river as a ford.
 for(const riverCell of this.cells)if(riverCell.river&&riverCell.mountain)riverCell.ford=false;
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
 seedGoods(this.cells);initializeFisheries(this);for(const city of state.cities){city.districts??={};city.world??=this.makeWorld(this.cell(city));this.prepareCity(city);for(const region of Object.values(city.districts))this.attachDistrict(city,region)}installGameRevisions(this);this.refreshVision();
 }
 cell(p){return this.cells[p.r*COLS+p.c]}
 atlasHeight(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return -15;const fx=(x-ORIGIN_X)/50-.5,fz=(z-ORIGIN_Z)/50-.5,c=Math.floor(fx),r=Math.floor(fz);let u=fx-c,v=fz-r;u=u*u*(3-2*u);v=v*v*(3-2*v);const sample=(c,r)=>{const a=this.cells[r*COLS+c];return !a||c<0||c>=COLS||r<0||r>=ROWS?-15:a.land?(a.river&&!a.bridge?Math.max(4,a.h-3.5):Math.max(5,a.h)):Math.min(-6,a.h)};return (sample(c,r)*(1-u)+sample(c+1,r)*u)*(1-v)+(sample(c,r+1)*(1-u)+sample(c+1,r+1)*u)*v}
 ensureBerries(world,cell){if(world.berriesVersion)return;world.berriesVersion=1;for(let i=0;i<9;i++){const x=-24+(i%3)*22,z=-22+Math.floor(i/3)*21;if(detailHeight(cell,x,z)>.4)world.resources.push({id:world.resources.length,kind:'berry',x,z,amount:60,capacity:60,removed:false})}world.revision++}
 makeWorld(cell){return consolidateMinerals({resources:cell.detail.resources.map(([kind,x,z],id)=>({id,kind:['tree','stone','ore','game','fish'][kind],x,z,amount:kind>=3?96:kind?420:32,removed:false})),heat:{},revision:0,foodResourcesVersion:1},cell)}
 cityAt(p){const lookup=cityLookup(this);return lookup?lookup.positions.get(p.c+':'+p.r):this.s.cities.find(c=>c.c===p.c&&c.r===p.r)}

 // Fractional travel clocks let units move smoothly from cell to cell.
 // Crossings create invisible wear; repeated traffic creates visible roads.
 advanceWorldMovers(dt){
  const travel=(entity,kind)=>{
   if(entity.embarked!=null||!entity.path?.length)return;
   entity.travelClock=(entity.travelClock||0)+dt;
   for(let guard=0;guard<6&&entity.path.length;guard++){
    const next=entity.path[0];if(!this.canTraverse(entity.team,next)){entity.path=[];entity.travelClock=0;break}
    const speedMultiplier=kind==='army'?armyTravelMultiplier(this.s,entity,TROOPS):1;
    const duration=kind==='train'?1:(3/roadBoost(this.s,entity,next,this.s.time))*(kind==='caravan'&&entity.wagon?.78:1)/speedMultiplier;
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
   if(cargo.merchantV87){advanceMerchant(this,cargo,dt);continue;}
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
  if(!this.s.battle){for(const a of this.s.armies)travel(a,'army');for(const a of [...this.s.armies])if(a.rallyTarget!=null&&!a.path.length){const target=this.s.armies.find(t=>t.team===a.team&&(t.id||0)===a.rallyTarget);if(target&&target.c===a.c&&target.r===a.r){const merged=mergeArmies(this.s,target);if(merged.army)syncArmyStats(this.s,merged.army,TROOPS);}delete a.rallyTarget;}}
 }

 seen(team,p){return !!this.s.explored?.[team]?.[tileKey(p)]}
 reveal(team,p,radius=2){this.s.explored??=Array.from({length:4},()=>({}));for(let dr=-radius;dr<=radius;dr++)for(let dc=-radius;dc<=radius;dc++){const c=p.c+dc,r=p.r+dr;if(c<0||c>=COLS||r<0||r>=ROWS||Math.abs(dc)+Math.abs(dr)>radius+1)continue;if(!this.s.explored[team][c+':'+r]){this.s.explored[team][c+':'+r]=1;if(team===0)this.s.visionRevision=(this.s.visionRevision||0)+1}}}
 visibleNow(team,p){return visibleNow(this,team,p)}
 enemyIntel(team=0){return updateEnemyIntel(this,team)}
 splitArmy(army){return splitArmy(this.s,army)}
 mergeArmies(army){const result=mergeArmies(this.s,army);if(result.army)syncArmyStats(this.s,result.army,TROOPS);return result}
 rallyArmies(army){return rallyArmies(this,army)}
 autoExplore(dt){this.s.autoExploreClock=(this.s.autoExploreClock||0)+dt;if(this.s.autoExploreClock<1.5)return;this.s.autoExploreClock=0;
  for(const army of this.s.armies){if(!army.autoExplore||army.embarked!=null||army.path?.length||!armyUnits(this.s,army).some(u=>u.kind==='scout'))continue;
   const path=findExplorationPath(this,army);
   if(path?.length){army.path=path;army.stance='move';army.waitingForShip=false;}
   else if(army.team===0){if(!army.waitingForShip){army.waitingForShip=true;this.s.events.push({time:this.s.time,text:'Avastaja ootab sadamat ja transpordilaeva, et meretaguseid maid uurida.'});this.uiRevision++;}}
   else army.autoExplore=false;
  }
 }
 refreshVision(){this.refreshTerritory();for(const [key,city] of this.territory){const [c,r]=key.split(':').map(Number);this.reveal(city.team,{c,r},0)}for(const city of this.s.cities)this.reveal(city.team,city,Math.max(2,this.radius(city)));for(const a of this.s.armies)this.reveal(a.team,a,2);for(const a of this.s.settlers)if(a.embarked==null)this.reveal(a.team,a,2);for(const a of this.s.ships||[])if(a.hp>0)this.reveal(a.team,a,2);updateEnemyIntel(this,0)}
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
 buildShip(city,kind,grade='standard'){return buildShip(this,city,kind,grade)}
 sail(ship,to){const path=seaPath(this,ship,to);if(!path)return 'Seda mereteed ei saa veel läbida. Varased laevad peavad hoiduma ranniku lähedale.';ship.path=path;return ''}
 embark(ship,kind,armyId=0){return embark(this,ship,kind,armyId)}
 disembark(ship,p){return disembark(this,ship,p)}
 radius(city){const pop=city.economy.realms[city.team].pop;return city.radius=grownCityRadius(city.radius,pop)}
 countyRadius(city){return countySearchRadius(this.radius(this.parentCity(city)))}
 isCountyTile(p,parent=this.territoryOwner(p)){return !!parent&&!(this.urbanTerritory?.get(parent.id)?.has(tileKey(p))??urbanTile(parent,p,this.radius(parent)))&&!(parent.districts?.[tileKey(p)]?.urbanExpansionV138&&urbanExpansionFits(parent,this.urbanTerritory?.get(parent.id)))}
 countySlots(ctx){return {used:countyBuildingCount(ctx),limit:3}}
 refreshTerritory(){
  if(this._perf&&this.territoryStamp!=null&&this._perf.areaBuilt===this._perf.areaRevision)return;
  if(this._perf){for(const c of this.s.cities)this.radius(c);this._perf.areaBuilt=this._perf.areaRevision;this._perf.stats.territoryBuilds++;}
  const stamp=this._perf?'revision:'+this._perf.areaRevision:'county126:'+this.s.cities.map(c=>[c.id,c.team,c.c,c.r,this.radius(c),c.economy.realms[c.team].pop,Object.entries(c.districts||{}).filter(([,d])=>d.economy.buildings.some(b=>!b.virtual&&b.hp>0)).map(([k])=>k).join(',')].join(':')).join('|');
  if(stamp===this.territoryStamp)return;this.territoryStamp=stamp;
  const allocation=allocateTerritory(this.s.cities,p=>p.c>=0&&p.c<COLS&&p.r>=0&&p.r<ROWS?this.cell(p):null,c=>this.radius(c));
  this.territory=allocation.territory;this.urbanTerritory=allocation.urban;
 }
 territoryOwner(p){if(!this.cell(p))return null;this.refreshTerritory();return this.territory.get(tileKey(p))||null}
 parentCity(ctx){return ctx.districtOf==null?ctx:cityLookup(this)?.ids.get(ctx.districtOf)||this.s.cities.find(c=>c.id===ctx.districtOf)}
 contexts(city){return cityContexts(this,this.parentCity(city))}
 allBuildings(city){return citySummary(this,this.parentCity(city))?.buildings||this.contexts(city).flatMap(c=>c.economy.buildings.filter(b=>!b.virtual))}
 // V66: all owned tiles constitute ONE city-wide construction area. Per-tile
 // contexts store only spatial objects; ownership, materials, prerequisites,
 // workforce and queued construction are evaluated for their parent city.
 constructionArea(city){
  const parent=this.parentCity(city);if(!parent)return null;
  this.refreshTerritory();
  const tiles=[...this.territory].filter(([,owner])=>owner.id===parent.id).map(([key])=>{const [c,r]=key.split(':').map(Number);return {c,r}});
  const buildings=this.allBuildings(parent);
  return {parent,tiles,buildings,pending:citySummary(this,parent)?.pending||buildings.filter(b=>!b.ready&&b.hp>0),stock:parent.economy.realms[parent.team].resources};
 }
 storageCap(city,key){const summary=citySummary(this,this.parentCity(city));if(!summary)return storageLimit(this.allBuildings(city),key);if(!summary.storage.has(key))summary.storage.set(key,storageLimit(summary.buildings,key));return summary.storage.get(key)}
 housing(city){const summary=citySummary(this,this.parentCity(city));if(!summary)return housingCapacity(this.allBuildings(city));return summary.housing??=housingCapacity(summary.buildings)}
 storageUsed(city,key,stock){return FOOD_KEYS.has(key)?[...FOOD_KEYS].reduce((n,k)=>n+(stock[k]||0),0):(stock[key]||0)}
 cityReady(city,type){const summary=citySummary(this,this.parentCity(city));if(!summary)return this.allBuildings(city).some(b=>b.team===city.team&&suppliesBuilding(b.type,type)&&b.ready&&b.hp>0);const key=city.team+':'+type;if(!summary.ready.has(key))summary.ready.set(key,summary.buildings.some(b=>b.team===city.team&&suppliesBuilding(b.type,type)&&b.ready&&b.hp>0));return summary.ready.get(key)}
 obsoleteUnit(team,kind){return unitSuccessor(this.s,team,kind,TROOPS,UNIT_TECH)}
 obsoleteBuilding(team,type){return buildingSuccessor(this.s,team,type,BUILD_AGE,BUILD_TECH)}
 attachDistrict(parent,region){region.districtOf=parent.id;region.constructionAreaId=parent.id;region.id=parent.id;region.team=parent.team;region.name=parent.name;region.economy.realms??=Array.from({length:4},()=>freshRealm());region.economy.realms[parent.team]=parent.economy.realms[parent.team];region.economy.time??=parent.economy.time;for(const b of region.economy.buildings)b.team=parent.team;this.prepareCity(region)}
 contextAt(p,create=false){const exact=this.cityAt(p);if(exact)return exact;const parent=this.territoryOwner(p);if(!parent)return null;parent.districts??={};const key=tileKey(p);if(parent.districts[key])return parent.districts[key];if(!create)return null;const world=this.localWorld(p),economy=initialState(this.s.seed);economy.settlers=[];economy.units=[];economy.cargo=[];economy.time=parent.economy.time;economy.buildings=[{type:'hall',x:0,z:0,team:parent.team,hp:1200,ready:true,virtual:true}];const region={c:p.c,r:p.r,foundedAt:this.s.time,world,economy};parent.districts[key]=region;this.attachDistrict(parent,region);this.localNavs.delete(key);return region}
 transferCity(city,team){const old=city.team,realm=copy(city.economy.realms[old]);for(const u of this.s.units)if(u.team===old&&u.garrison?.c===city.c&&u.garrison?.r===city.r){delete u.garrison;u.hp=0}city.team=team;city.builderAgents=[];city.trainingAgent=null;for(const q of city.training||[])q.team=team;city.economy.realms[team]=realm;for(const ctx of this.contexts(city)){ctx.team=team;ctx.economy.realms[team]=realm;for(const b of ctx.economy.buildings)b.team=team;for(const c of ctx.economy.cargo)c.team=team;ctx.world.workers={}}this.territoryStamp=null;reconcileVictory(this.s,team)}

 localWorld(p){const city=this.contextAt(p,false);if(city){consolidateMinerals(city.world,this.cell(p),city.economy.buildings);return city.world;}this.s.tileWorlds??={};const world=this.s.tileWorlds[tileKey(p)]??=this.makeWorld(this.cell(p));if(this.cell(p)?.land&&world.resources.some(r=>r.kind==='fish')){world.resources=world.resources.filter(r=>r.kind!=='fish');world.revision=(world.revision||0)+1}consolidateMinerals(world,this.cell(p));this.ensureBerries(world,this.cell(p));if(!world.foodResourcesVersion){for(const r of this.makeWorld(this.cell(p)).resources.filter(r=>['game','fish'].includes(r.kind)))world.resources.push({...r,id:world.resources.length});world.foodResourcesVersion=1;world.revision++}return world}
 battleNavigation(battle=this.s.battle){if(!this.battleNavs.has(battle))this.battleNavs.set(battle,createBattleNavigation(this,battle));return this.battleNavs.get(battle)}
 nav(p){const city=this.contextAt(p,false),key=tileKey(p),cache=city?this.navs:this.localNavs;if(!cache.has(key)){const world=this.localWorld(p),cell=this.cell(p),coast=isShore(this,cell);world.trailTime=this.s.time;cache.set(key,new Navigation(world,(x,z)=>Math.abs(x)<(coast?DETAIL_HALF_X+19.5:DETAIL_HALF_X-3)&&Math.abs(z)<(coast?DETAIL_HALF_Z+19.5:DETAIL_HALF_Z-3)&&!cell.mountain&&detailHeight(cell,x,z)>.2&&(!coast||localSurface(this,cell,x,z,false)>.15)&&(()=>{
 const position=localToWorld(cell,x,z),river=riverNear(this,position.x,position.z);
 // Deep river cells are impassable to walkers, but the ankle-deep fords
 // are walkable across the channel (bridges remain separate crossings).
 return river.distance>=river.width*.97||river.fordStrength>=.75||!!this.cell(cell)?.bridge&&river.distance<river.width*1.15;
 })(),()=>(this.contextAt(p,false)?.economy.buildings||[]).filter(b=>!b.virtual),{...(coast?{minX:-132,minZ:-117,w:265,h:235}:{minX:-109,minZ:-94,w:219,h:189}),revision:navigationRevision(world,()=>this.contextAt(p,false)?.economy)}))}const n=cache.get(key),terrainKey=[this.cell(p).land,this.cell(p).mountain,this.cell(p).bridge,this.cell(p).ford].join(':');if(n.terrainKey!=null&&n.terrainKey!==terrainKey)n.rebuildTerrain();n.terrainKey=terrainKey;n.world.trailTime=this.s.time;n.refresh();return n}

 prepareCity(city){if(this.cell(city)?.land)city.world.resources=city.world.resources.filter(r=>r.kind!=='fish');if(city.districtOf==null){city.builderCount??=1;city.builderAgents??=[]}for(const id of Object.keys(city.world.workers||{}))if(id.startsWith('build:'))delete city.world.workers[id];this.ensureBerries(city.world,this.cell(city));if(!city.world.foodResourcesVersion){for(const r of this.makeWorld(this.cell(city)).resources.filter(r=>['game','fish'].includes(r.kind)))city.world.resources.push({...r,id:city.world.resources.length});city.world.foodResourcesVersion=1}city.foundedAt??=0;city.world.heat??={};city.world.workers??={};city.economy.settlers??=[];city.economy.units=[];city.economy.cargo??=[];migrateEconomy(city.economy);consolidateMinerals(city.world,this.cell(city),city.economy.buildings);for(const b of city.economy.buildings)if(!b.virtual){configureWallFootprint(b);clearFootprint(city.world,b)}migrateLegacyFarms(city,(x,z)=>detailHeight(this.cell(city),x,z)>.4,city.districtOf!=null&&this.isCountyTile(city,this.parentCity(city)));}
 env(city){const nav=this.nav(city),s=city.economy;return {unlimitedBuildingRange:true,nearBuildings:(p,type)=>buildingsNear(city.economy,p.x,p.z,type==='market'?27:20),buildTime:(type,time)=>time*tempoMultiplier(this.s),marketFoodGrowth:()=>marketFoodGrowth(this.allBuildings(city),city.economy.realms[city.team].resources,city.economy.realms[city.team].pop,this.s.ages[city.team]),
 bronzeGrowthMultiplier:()=>{const parent=this.parentCity(city),r=parent.economy.realms[parent.team],market=marketFoodGrowth(this.allBuildings(parent),r.resources,r.pop,this.s.ages[parent.team]);return prosperousTownGrowth({age:this.s.ages[parent.team],pop:r.pop,stock:r.resources,marketVarieties:market.varieties.length,housingFree:this.housing(parent)-r.pop})},
 growthFactor:tempoMultiplier(this.s)*(this.allBuildings(city).some(b=>b.type==='inn'&&b.ready&&b.hp>0&&!b.disabled&&(b.assigned||0)>=.5)?.86:1),storageCap:(team,key)=>this.storageCap(city,key),storageUsed:(team,key,stock)=>this.storageUsed(city,key,stock),sameStorageGroup:(a,b)=>a===b||(FOOD_KEYS.has(a)&&FOOD_KEYS.has(b)),consumeHouseholds:(team,r,foodNeed,waterNeed)=>this.consumeHouseholds(city,r,foodNeed,waterNeed),assigned:b=>b.assigned||0,productionBonus:b=>cityNeeds(this.parentCity(city),this.s.ages[city.team]).productivity*this.bonus(city.team)*this.terrainBonus(city,b.type)*medievalBonus(this,city,b)*productivityBonus(this.s,city.team,b.type)*productionReformV125(this.s,city.team,b.type,BUILDINGS),buildWork:b=>b.workThisTick||0,operateWork:(b,dt)=>b.type==='farm'?farmWork(this,city,b,dt):operateWorker(this,city,b,dt),skipDemographics:city.districtOf!=null,workerBudget:team=>team===city.team?(city.laborBudget??s.realms[team].pop):0,capacity:()=>this.housing(city),requirement:type=>{const missing=BUILDINGS[type].requires.filter(k=>!this.cityReady(city,k)&&!(['oilwell','refinery'].includes(type)&&((type==='oilwell'&&k==='engineworks')||(type==='refinery'&&k==='oilwell'))&&this.s.cities.some(c=>c.team===city.team&&this.cityReady(c,k))));return missing.length?'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', '):''},priority:b=>{const food=['hunter','fisher','well','bakery'].includes(b.type);return food?0:b.type==='forester'?1:['lumber','quarry'].includes(b.type)?2:3},passable:(x,z)=>nav.passable(x,z),segmentDry:(a,b)=>{const n=Math.ceil(distance(a,b)*2);for(let i=0;i<=n;i++)if(!nav.passable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true},canOperate:b=>(BUILD_AGE[b.type]??0)<=this.s.ages[city.team],spawnPoint:b=>({...door(b)}),moveCargo:(a,p,dt)=>nav.moveCitizen(a,p,dt,4),isDepositBuilding:type=>!!MINERAL_BUILDINGS[type],harvest:(b,d,dt,multiplier)=>MINERAL_BUILDINGS[b.type]?harvestMineral(city.world,b,d,operateWorker(this,city,b,dt),multiplier):b.type==='fisher'?fishingHarvest(this,city,b,d,dt,nav,multiplier):gather(s,b,d,dt,nav,multiplier),plant:(b,d,dt)=>plantTrees(s,b,d,dt,nav),canBuild:p=>!resourcesNear(city.world,p.x,p.z,10,10).some(r=>!['tree','berry'].includes(r.kind)&&!['game','fish','berry'].includes(r.kind)&&!r.removed&&Math.abs(r.x-p.x)<(r.depositSite?10:4.5)&&Math.abs(r.z-p.z)<(r.depositSite?10:4)),onPlaced:b=>{configureWallFootprint(b);clearFootprint(city.world,b);for(const r of city.world.resources.filter(r=>r.kind==='game'&&Math.abs(r.x-b.x)<5&&Math.abs(r.z-b.z)<5)){for(const[dx,dz]of [[9,9],[-9,9],[9,-9],[-9,-9],[15,0],[-15,0]]){const x=b.x+dx,z=b.z+dz;if(nav.passable(x,z)&&!s.buildings.some(h=>Math.abs(h.x-x)<5&&Math.abs(h.z-z)<5)){r.x=x;r.z=z;break}}}nav.rebuild()}}}
 moveSettler(id,cell){const a=this.s.settlers.find(a=>a.id===id);if(!a)return 'Asunik puudub.';if(a.embarked!=null)return 'Maabu esmalt transpordilaevalt.';const path=this.landPath(a,cell,a.team);if(!path)return 'Sihtkohta ei pääse mööda maad. Otsi koolmekoht, sild või meretee.';a.path=path;a.landed=false;a.localTarget=null;return ''}
 land(id){const a=this.s.settlers.find(a=>a.id===id);if(!a||a.path.length)return 'Oota asuniku saabumist.';if(a.embarked!=null)return 'Maabu esmalt laevalt.';if(this.territoryOwner(a))return 'See ruut kuulub olemasolevale linnale. Vali uus vaba ruut.';a.landed=true;const nav=this.nav(a),p=nav.nearest({x:a.x||0,z:a.z||0},80);if(!p)return 'Siin pole sobivat maad.';a.x=p.x;a.z=p.z;return ''}
 siteRule(a,p){if(!a.landed||a.path.length)return 'Ava esmalt asuniku detailkaart.';if(this.cityAt(a))return 'Sellel ruudul on juba linn.';if(this.territoryOwner(a))return 'See ruut kuulub olemasoleva linna alasse.';if(!citySpacingAllowed(a,this.s.cities,a.team>0?AI_CITY_SPACING:MIN_CITY_SPACING))return 'Linnakeskuste vahele peab jääma vähemalt '+(a.team>0?AI_CITY_SPACING:MIN_CITY_SPACING)+' ruutu.';if(Math.abs(p.x)>42||Math.abs(p.z)>32)return 'Vali linnakoht detailkaardi keskosas.';const nav=this.nav(a);for(const dx of [-4,0,4])for(const dz of [-4,0,4])if(!nav.passable(p.x+dx,p.z+dz))return 'Linn vajab kuiva maad.';if(nav.world.resources.some(r=>!['tree','berry'].includes(r.kind)&&!['game','fish','berry'].includes(r.kind)&&!r.removed&&Math.abs(r.x-p.x)<5&&Math.abs(r.z-p.z)<4))return 'Kivimaardlale ei saa linna rajada.';return ''}
 found(id){const a=this.s.settlers.find(a=>a.id===id);if(!a)return {error:'Asunik puudub.'};if(a.localTarget)return {error:'Oota asuniku saabumist.'};const p={x:Math.round(a.x),z:Math.round(a.z)},error=this.siteRule(a,p);if(error)return {error};const missingNationalResources=nationalResourceNeeds(this,a.team);const idCity=Math.max(-1,...this.s.cities.map(c=>c.id))+1,economy=initialState(this.s.seed);economy.settlers=[];economy.realms[a.team].resources={...START,wood:100,stone:55,plank:0,gold:0,water:40};economy.realms[a.team].pop=3;economy.realms[a.team].growthProgress=0;if(a.cargo)economy.realms[a.team].resources=copy(a.cargo);economy.buildings=[{type:'hall',...p,team:a.team,hp:1200,ready:true}];economy.units=[];economy.cargo=[];const city={id:idCity,team:a.team,c:a.c,r:a.r,foundedAt:this.s.time,name:(this.s.factionNames||FACTION_NAMES)[a.team]+'küla '+(this.s.cities.filter(c=>c.team===a.team).length+1),economy,world:this.localWorld(a),hp:600};this.s.cities.push(city);if(this.s.tileWorlds)delete this.s.tileWorlds[tileKey(a)];this.s.settlers.splice(this.s.settlers.indexOf(a),1);this.localNavs.delete(tileKey(a));this.prepareCity(city);this.applyUpgrades(city);specializeNewCity(this,city,missingNationalResources);return {city}}
 canBuildNow(city,type){const area=this.constructionArea(city);return !!area&&!this.buildRule(city,type)&&canAfford(area.stock,BUILDINGS[type].cost)&&area.pending.length<12}
 buildRule(city,type){if(type==='field'&&!city.economy.buildings.some(b=>b.type==='farm'&&b.ready&&b.hp>0&&!b.disabled))return 'Ehita samale ruudule kõigepealt valmis põllutalu.';if(this.isCountyTile(city,this.parentCity(city))){const rural=new Set(['field','farm','pasture','hunter','fisher','lumber','forester','quarry','mine','coal','coppermine','tinmine','claypit','oilwell','well','bridge','harbor','road_depot','windmill','watermill',...Object.keys(GOOD_BUILDINGS).filter(k=>GOOD_BUILDINGS[k].deposit)]);const error=countyBuildRule(city,type,rural);if(error)return error;}const replacement=this.obsoleteBuilding(city.team,type);if(replacement)return 'Asendatud: '+BUILDINGS[replacement].name;if(this.cell(city)?.mountain)return 'Mäed on läbimatud ja sinna ei saa ehitada.';if(this.territoryOwner(city)?.id!==this.parentCity(city)?.id)return 'See ruut ei kuulu enam selle linna alasse.';if(type==='bridge'){const cell=this.cell(city);if(!cell?.river)return 'Silda saab ehitada ainult jõeruudule.';if(cell.bridge)return 'Sellel ruudul on sild juba olemas.';}if(type==='harbor'&&!isShore(this,city))return 'Sadam vajab rannikuruutu, mille kõrval on meri.';if(type==='fisher'&&!isShore(this,city))return 'Kalamehe onni saab ehitada ainult päris mererannale.';if(type==='watermill'&&!this.cell(city)?.river&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>this.cells[(city.r+dr)*COLS+city.c+dc]?.river))return 'Vesiveski vajab jõge samal või naaberruudul.';if(type==='windmill'&&!this.cell(city)?.deposits.grain)return 'Tuuleveski vajab avatud viljakat maad.';const tech=BUILD_TECH[type];if(tech&&!this.s.research[city.team].known.includes(tech))return 'Uuri: '+TECHS[tech].name;const age=this.s.ages[city.team],d=BUILDINGS[type];if((BUILD_AGE[type]??9)>age)return 'Vajab ajastut: '+AGES[BUILD_AGE[type]]?.name;const dep={...Object.fromEntries(Object.entries(GOOD_BUILDINGS).map(([k,d])=>[k,d.deposit])),claypit:'clay',coppermine:'copper',tinmine:'tin',lumber:'wood',quarry:'stone',mine:'ore',oilwell:'oil',field:'grain',well:'water',hunter:'game'}[type];if(dep&&!this.cell(city).deposits[dep])return 'Selle linna ruudul puudub '+({clay:'savi',copper:'vasemaak',tin:'tinamaak',wood:'mets',stone:'kivi',ore:'rauamaak',grain:'viljakas põllumaa',water:'mageveeallikas',game:'ulukid',fish:'kalapüügikoht',oil:'naftamaardla',...Object.fromEntries(Object.entries(GOOD_BUILDINGS).filter(([k,d])=>d.deposit).map(([k,d])=>[d.deposit,RESOURCE_NAMES[d.deposit]||d.deposit]))}[dep])+'.';const missing=d.requires.filter(k=>!this.cityReady(city,k)&&!(['oilwell','refinery'].includes(type)&&((type==='oilwell'&&k==='engineworks')||(type==='refinery'&&k==='oilwell'))&&this.s.cities.some(c=>c.team===city.team&&this.cityReady(c,k))));return missing.length?'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', '):''}
 placementEnv(city,type){const env=this.env(city);if(COASTAL_BUILDINGS.has(type))env.passable=()=>true;if(MINERAL_BUILDINGS[type])env.canBuild=p=>!city.world.resources.some(r=>!r.removed&&!['tree','berry','game','fish',MINERAL_BUILDINGS[type]].includes(r.kind)&&Math.abs(r.x-p.x)<4.5&&Math.abs(r.z-p.z)<4);return env}
 buildingSites(city,type){if(MINERAL_BUILDINGS[type]){const r=mineralSite(city.world,type);return r?[{x:r.x,z:r.z}]:[]}if(COASTAL_BUILDINGS.has(type))return coastalSites(this,this.cell(city),type);const parent=this.parentCity(city);return historicalBuildingPlots(city,parent,type,this.s.seed+parent.id*31)}
 previewBuild(city,type,p){
  const error=this.buildRule(city,type);if(error)return {error};
  if(type==='field'){const error=validateField(city,p,(x,z)=>this.nav(city).passable(x,z));if(error)return {error};const d=fieldSize(p),heights=[];for(let x=-d.width/2;x<=d.width/2;x+=4)for(let z=-d.depth/2;z<=d.depth/2;z+=4)heights.push(detailHeight(this.cell(city),p.x+x,p.z+z));if(Math.max(...heights)-Math.min(...heights)>1.8)return {error:'Põllu maapind on liiga järsk. Vali väiksem või tasasem ala.'};}
  else if(city.economy.buildings.some(b=>b.type==='field'&&b.hp>0&&fieldContains(b,p,type==='market'?17:6)))return {error:'Hoone ei mahu põllule. Vali koht põllu kõrval.'};
  if(this.constructionArea(city).pending.length>=12)return {error:'Linna ühises ehitusjärjekorras on juba 12 hoonet.'};
  if(type==='bridge')return {ok:true,p:{x:0,z:0}};
  let site={p};
  if(MINERAL_BUILDINGS[type])site=mineralPlacement(city.world,type,p,city.economy.buildings);
  if(COASTAL_BUILDINGS.has(type))site=coastalPlacement(this,this.cell(city),type,p);
  if(site.error)return site;p=site.p;
  const env=this.placementEnv(city,type);
  if(!COASTAL_BUILDINGS.has(type)){
   for(const dx of (type==='market'?[-10,0,10]:[-3,0,3]))for(const dz of (type==='market'?[-9,0,9]:[-2.8,0,2.8]))if(!env.passable(p.x+dx,p.z+dz))return {error:'Kogu hoone peab mahtuma kuivale maale.'};
   const levels=(type==='market'?[[-10,-9],[-10,9],[10,-9],[10,9]]:[[-3,-2.8],[-3,2.8],[3,-2.8],[3,2.8]]).map(([dx,dz])=>detailHeight(this.cell(city),p.x+dx,p.z+dz));
   if(Math.max(...levels)-Math.min(...levels)>1.8)return {error:'Maapind on hoone jaoks liiga järsk.'};
  }else{
   const nav=this.nav(city),hall=city.economy.buildings.find(b=>b.type==='hall'),from=nav.nearest(door(hall),15),to=nav.nearest(site.landEntry,3);
   if(!from||!to||!nav.reachable(from,to))return {error:'Rannahoone maapoolne sissepääs peab olema linnaga ühendatud.'};
  }
  const rule=placementRule(city.economy,city.team,type,p,env);if(rule.error)return rule;
  const candidate={...p,type,...site},nav=this.nav(city);if(p.plannedDefense){for(const b of city.economy.buildings.filter(b=>!b.virtual&&b.hp>0&&!DEFENSE_TYPES.has(b.type)&&b.type!=='field'))if(Math.abs(b.x-p.x)<7&&Math.abs(b.z-p.z)<7)return {error:'Kaitserajatis kattuks linnahoonega.'};return {...rule,...site};}
  if(!nav.preservesAccess(candidate,city.economy.cargo))return {error:'Hoone sulgeks sissepääsu või töötaja tagasitee. Jäta majade vahele läbipääs.'};
  return {...rule,...site};
 }
 build(city,type,p){const check=this.previewBuild(city,type,p);if(check.error)return check;p=check.p||p;if(type==='bridge'){const r=city.economy.realms[city.team],cost=BUILDINGS.bridge.cost;if(!canAfford(r.resources,cost))return {error:'Silla jaoks napib materjale.'};spendResources(r.resources,cost);const building={type:'bridge',x:0,z:0,team:city.team,hp:350,progress:0,ready:false};city.economy.buildings.push(building);this.uiRevision++;return {building}}const result=placeBuilding(city.economy,city.team,type,p,this.placementEnv(city,type));if(result.building){if(p.plannedDefense){result.building.wallAxis=p.wallAxis||0;result.building.plannedDefense=true;configureWallFootprint(result.building);this.nav(city).rebuild();}if(type==='farm')result.building.fieldSystemV127=true;if(type==='field'){Object.assign(result.building,fieldSize(p));for(const r of city.world.resources)if(['tree','berry','game'].includes(r.kind)&&fieldContains(result.building,r)){r.removed=true;r.amount=0;}city.world.revision++;}for(const k of ['depositId','shoreAngle','landEntry','baseY'])if(check[k]!=null)result.building[k]=check[k];}return result}

 // An order can be given on any tile owned by the parent city. Coordinates
 // supplied by a detail-map click may extend into one of its eight neighbours.
 // Convert to the destination tile's local geometry before validation.
 resolveAreaSite(city,at){
  const parent=this.parentCity(city);
  if(!parent)return {error:'Linna ehitusala ei leitud.'};
  const {dc,dr}=tileDelta(at.x,at.z);
  if(Math.abs(dc)>1||Math.abs(dr)>1)return {error:'Vali ehituskoht linna kuuluval detailkaardil.'};
  const destination=this.cell({c:city.c+dc,r:city.r+dr});
  if(!destination?.land||this.territoryOwner(destination)?.id!==parent.id)
   return {error:'Valitud ruut ei kuulu selle linna ühisesse ehitusalasse.'};
  const raw=localTilePoint(at.x,at.z,dc,dr),point={x:Math.round(raw.x/2)*2,z:Math.round(raw.z/2)*2};
  // The destination remains a separate *physical* tile but not a city.
  const ctx=this.contextAt(destination,true);
  return {ctx,point};
 }
 resolveCoastalSite(city,type,at){const parent=this.parentCity(city),options=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const tile=this.cell({c:city.c+dc,r:city.r+dr});if(!tile?.land||this.territoryOwner(tile)?.id!==parent.id)continue;const p=localTilePoint(at.x,at.z,dc,dr);if(Math.abs(p.x)>138||Math.abs(p.z)>123)continue;const coast=coastalPlacement(this,tile,type,p);if(coast.error)continue;const ctx=this.contextAt(tile,true);if(ctx)options.push({ctx,point:p,score:Math.hypot(coast.p.x-p.x,coast.p.z-p.z)})}options.sort((a,b)=>a.score-b.score);return options[0]||{error:'Vali oma linna mererand: hoone peab ulatuma pooleldi merre.'}}
 previewInArea(city,type,at){
  const site=COASTAL_BUILDINGS.has(type)?this.resolveCoastalSite(city,type,at):this.resolveAreaSite(city,at);
  if(site.error)return site;
  if(type==='field')Object.assign(site.point,fieldSize(at));const check=this.previewBuild(site.ctx,type,site.point);return {...site,...check,point:check.p||site.point};
 }
 buildInArea(city,type,at){
  const site=COASTAL_BUILDINGS.has(type)?this.resolveCoastalSite(city,type,at):this.resolveAreaSite(city,at);
  if(site.error)return site;
  if(type==='field')Object.assign(site.point,fieldSize(at));return {...this.build(site.ctx,type,site.point),...site};
 }
 wallGuards(city,b){return wallGuards(this.s,city,b)}
 stationWall(city,b,source=null){return stationWall(this,city,b,source)}
 releaseWall(city,b){return releaseWall(this,city,b)}
 toggleBuilding(city,b){if(!city.economy.buildings.includes(b)||b.type==='hall'||!b.ready)return {error:'Seda hoonet ei saa peatada.'};b.disabled=!b.disabled;return {ok:true}}

 recruit(city,kind,grade='standard'){if(!UNIT_GRADES[grade])return {error:'Tundmatu varustustase.'};if(SHIPS[kind])return this.buildShip(city,kind,grade);if(kind==="militia")return {error:"Elanikud kaitsevad linna automaatselt."};if(city.districtOf!=null)return this.recruit(this.parentCity(city),kind,grade);const replacement=this.obsoleteUnit(city.team,kind);if(kind==='bronze_cavalry'||replacement)return {error:'Asendatud: '+(TROOPS[replacement||'cavalry']?.name||kind)};const tech=UNIT_TECH[kind];if(tech&&!this.s.research[city.team].known.includes(tech))return {error:'Uuri: '+TECHS[tech].name};const d=TROOPS[kind],r=city.economy.realms[city.team];if(!d||d.age>this.s.ages[city.team])return {error:'See üksus ei ole veel avatud.'};if(d.requires.some(k=>!this.cityReady(city,k)))return {error:'Ehita esmalt '+d.requires.filter(k=>!this.cityReady(city,k)).map(k=>BUILDINGS[k].name).join(', ')};city.training??=[];if(city.training.length>=4)return {error:'Väljaõppe järjekord on täis (4).'};const cost=troopCost(d,grade);if(!canAfford(r.resources,cost)||r.pop<6)return {error:'Toorainet või elanikke napib.'};// The field army does not have to return home before a city can train troops.
 // Each finished recruit joins a local army or forms a new detachment.
 spendResources(r.resources,cost);r.pop-=(d.population||1);city.training??=[];const job={kind,grade,paidCost:cost,team:city.team,total:d.time*tempoMultiplier(this.s),progress:0,assigned:0,efficiency:0};city.training.push(job);return {unit:job,queued:job}}
 retrain(city,source,kind){const old=this.s.units[source];if(!old||old.team!==city.team||!combatUnit(old)||old.garrison||this.s.cities.some(c=>(c.training||[]).some(j=>j.upgradeSource===source)))return {error:'Üksus ei saa praegu ümberõpet alustada.'};const army=this.s.armies.find(a=>a.team===city.team&&(a.id||0)===(old.armyId||0));if(!army||army.c!==city.c||army.r!==city.r||army.path.length)return {error:'Ümberõppeks peab üksus olema linnas.'};const realm=city.economy.realms[city.team],pop=realm.pop,result=this.recruit(city,kind);if(result.unit){realm.pop=pop;result.unit.upgradeSource=source;result.unit.populationSpent=0;}return result;}
 tickTraining(city,dt){const job=city.training?.[0];if(!job)return;if(job.upgradeSource!=null){const old=this.s.units[job.upgradeSource];if(!old||old.hp<=0||old.team!==city.team){city.training.shift();return;}const army=this.s.armies.find(a=>a.team===city.team&&(a.id||0)===(old.armyId||0));if(!army||army.c!==city.c||army.r!==city.r||army.path.length){job.status='Ootab ümberõpetatava üksuse naasmist';return;}}if(job.ship){const port=this.contextAt(job.harbor,false);if(!port||port.team!==city.team||!port.economy.buildings.some(b=>b.type==='harbor'&&b.ready&&!b.disabled)){job.status='Sadama töö on peatatud';job.blocked=true;return}job.blocked=false;job.status=''}job.progress=Math.min(job.total,job.progress+trainingWorker(this,city,job,dt*(job.efficiency||0)*this.bonus(city.team)));if(job.progress+1e-8<job.total)return;if(job.ship){if(finishShip(this,city,job))city.training.shift();return}// Assign graduates to an army physically present in this city. If the main
 // army is exploring or fighting elsewhere, create a separate local detachment.
 if(job.upgradeSource!=null){const old=this.s.units[job.upgradeSource],ratio=Math.min(1,old.hp/(old.maxHp||old.hp)),max=TROOPS[job.kind].hp*(UNIT_GRADES[job.grade||'standard']?.strength||1);old.kind=job.kind;old.grade=job.grade||'standard';old.maxHp=max;old.hp=max*ratio;delete old.soldiers;delete old.menCount;const army=this.s.armies.find(a=>a.team===old.team&&(a.id||0)===(old.armyId||0));if(army)syncArmyStats(this.s,army,TROOPS);city.training.shift();return;}
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
 this.s.units.push({kind:job.kind,team:city.team,armyId:army.id||0,cityId:city.id,x:hall.x,z:hall.z+6,grade:job.grade||'standard',hp:TROOPS[job.kind].hp*(UNIT_GRADES[job.grade||'standard']?.strength||1),morale:100});
 syncArmyStats(this.s,army,TROOPS);
 city.training.shift()}
 tickBasic(city,dt){city.basicWorkers??={};const r=city.economy.realms[city.team],hall=city.economy.buildings.find(b=>b.type==='hall'),nav=this.nav(city);for(const[k,d]of Object.entries(BASIC_JOBS)){const b=city.basicWorkers[k]??={type:d.type,resourceKind:d.kind,workerKey:'basic:'+k,team:city.team,x:hall.x,z:hall.z};b.team=city.team;const assigned=city.basicAssigned?.[k]||0;b.assigned=assigned;if(!assigned)continue;const free=Math.max(0,this.storageCap(city,d.out)-this.storageUsed(city,d.out,r.resources));if(free<=0){b.status='Ladu täis';continue}const amount=gather(city.economy,b,d,dt*assigned/5*this.bonus(city.team)*productivityBonus(this.s,city.team,k==='stone'?'basic_stone':b.type)*cityNeeds(city,this.s.ages[city.team]).productivity,nav,RESOURCE_PRODUCTION_MULTIPLIER);if(amount){const delivered=Math.min(amount,free);r.resources[d.out]+=delivered;recordDelivery(r,city.economy.time,d.out,delivered)}}}

 recruitSettler(city){if(city.districtOf!=null)return this.recruitSettler(this.parentCity(city));if(!this.s.research[city.team].known.includes('settlement'))return {error:'Uuri: '+TECHS.settlement.name};const r=city.economy.realms[city.team],cost={wood:45,stone:20,bread:15};if(!canAfford(r.resources,cost)||r.pop<6)return {error:'Asunik vajab 45 puitu, 20 kivi, 15 toitu ja vähemalt 6 elanikku (2 lähevad uude linna).'};spendResources(r.resources,cost);r.pop-=2;const a={id:this.s.nextSettler++,team:city.team,c:city.c,r:city.r,x:0,z:0,path:[],landed:false,localTarget:null,cargo:{...START,wood:65,stone:35,plank:0,bread:22,water:45,gold:0}};this.s.settlers.push(a);return {settler:a}}
 queueResearch(team,id){return queueResearch(this.s,team,id)}
 research(team,id){return startResearch(this.s,team,id)}
 advance(city){const id=['bronze','iron','civics','renaissance','industrialization','modernity'][this.s.ages[city.team]];return id?this.research(city.team,id):{error:'Kõrgeim ajastu on saavutatud.'}}
 tick(dt){if(dt<=0||this.s.winner!==null)return;this.s.time+=dt;tickDiplomacy(this.s,dt);this.s.visionClock=(this.s.visionClock||0)+dt;if(this.s.visionClock>=3){this.s.visionClock=0;this.refreshVision();}tickShips(this,dt);decayWorldRoads(this.s,dt);this.s.localTrailDecayClock=(this.s.localTrailDecayClock||0)+dt;if(this.s.localTrailDecayClock>=60){this.s.localTrailDecayClock%=60;for(const nav of [...this.navs.values(),...this.localNavs.values()]){nav.world.trailTime=this.s.time;nav.pruneTrails()}}for(const u of this.s.units){const army=this.s.armies.find(a=>a.team===u.team&&(a.id||0)===(u.armyId||0))||this.s.armies[u.team],city=this.cityAt(army);if(!this.s.battle&&u.hp>0&&u.hp<(u.maxHp||TROOPS[u.kind]?.hp||u.hp)&&city?.team===u.team&&foodTotal(city.economy.realms[u.team].resources)>0){const healed=Math.min(((u.maxHp||TROOPS[u.kind].hp)-u.hp),dt*.12);u.hp+=healed;u.healSupply=(u.healSupply||0)+healed;if(u.healSupply>=12){takeFood(city.economy.realms[u.team].resources,1);u.healSupply-=12}}}this.s.clock+=dt;this.s.railClock=(this.s.railClock||0)+dt;if(this.s.railClock>=25){this.s.railClock%=25;buildRailNetworks(this)}this.s.tradeClock+=dt;if(this.s.tradeClock>=15){this.s.tradeClock%=15;this.trade()}for(const a of this.s.settlers){if(a.embarked==null&&a.landed&&a.localTarget){if(this.nav(a).move(a,a.localTarget,dt,a.team>0?2.2:3))a.localTarget=null}}for(const parent of this.s.cities){consumeLuxuries(parent,this.s.ages[parent.team],dt);this.applyUpgrades(parent);const realm=parent.economy.realms[parent.team],critical=foodTotal(realm.resources)<Math.ceil(realm.pop/4)*2;for(const ctx of this.contexts(parent))for(const w of Object.values(ctx.world.workers||{})){w.moving=false;w.working=false}allocateCity(this,parent);/* Update shoppers every tick, avoiding 3m jumps from the old 1-second batching. */
 tickMarketHouseholds(this,parent,dt);parent.marketClock=0;tickTownStreets(this,parent,dt);tickBuilders(this,parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:this.s.difficulty==='hard'?.95:.8):1));const totalEmployed=realm.employed;let used=0;const contexts=this.contexts(parent).slice().sort((a,b)=>critical?Number(!a.economy.buildings.some(t=>['hunter','fisher','bakery'].includes(t.type)&&t.ready&&!t.disabled))-Number(!b.economy.buildings.some(t=>['hunter','fisher','bakery'].includes(t.type)&&t.ready&&!t.disabled)):0);for(const city of contexts){const mobilized=this.s.battle?.civilianCityId===parent.id?this.s.battle.squads.filter(u=>u.civilian).length:0;city.laborBudget=Math.max(0,availableLabor(realm.pop,realm.housingShortage,mobilized)-used);for(const r of city.world.resources)if(r.respawnAt!=null&&r.respawnAt<=city.economy.time){r.removed=false;r.amount=r.capacity||96;delete r.respawnAt;city.world.revision++}if(tickEconomy(city.economy,dt*(city.team>0?(this.s.difficulty==='easy'?.6:this.s.difficulty==='hard'?.95:.8):1),this.env(city)))this.uiRevision++;city.employed=realm.employed||0;used+=city.employed}this.tickBasic(parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:.75):1));this.tickTraining(parent,dt*(parent.team>0?(this.s.difficulty==='easy'?.6:.75):1));for(const ctx of this.contexts(parent))healMedievalArmies(this,ctx,dt);for(const ctx of this.contexts(parent))if(ctx.economy.buildings.some(b=>b.type==='bridge'&&b.ready)&&!this.cell(ctx).bridge){this.cell(ctx).bridge=true;this.s.crossingRevision=(this.s.crossingRevision||0)+1};realm.employed=totalEmployed;this.radius(parent)}for(const research of this.s.research){if(research.active&&research.discoveryInsight>0){research.progress[research.active]=(research.progress[research.active]||0)+research.discoveryInsight;research.discoveryInsight=0}}this.researchEvents.push(...tickResearch(this.s,dt));this.autoExplore(dt);autoExploreNavy(this);this.advanceWorldMovers(dt);captureEnemySettlers(this);if(this.s.clock>=3){this.s.clock-=3;for(const cargo of [...this.s.shipments]){if(cargo.merchantV87){receiveMerchant(this,cargo);continue;}if(cargo.mode==='air'&&cargo.flightLeft>0)continue;if(cargo.mode!=='air'&&(cargo.blocked||(cargo.path.length&&!this.canTraverse(cargo.team,cargo.path[0])))){ const destination=this.s.cities.find(c=>c.id===cargo.to);const route=destination?this.landPath(cargo,destination,cargo.team):null;cargo.blocked=!route;if(!route)continue;cargo.path=route;cargo.mode='road'}if(!cargo.path.length){const city=this.s.cities.find(c=>c.id===cargo.to&&c.team===cargo.team);if(!city){this.s.shipments.splice(this.s.shipments.indexOf(cargo),1);continue}const stock=city.economy.realms[cargo.team].resources;for(const[k,n]of Object.entries(cargo.goods)){const free=Math.max(0,this.storageCap(city,k)-this.storageUsed(city,k,stock)),taken=Math.min(n,free);stock[k]=(stock[k]||0)+taken;cargo.goods[k]-=taken;if(cargo.goods[k]<=0.00001)delete cargo.goods[k]}if(!Object.keys(cargo.goods).length)this.s.shipments.splice(this.s.shipments.indexOf(cargo),1);else cargo.status='Ootab vaba laoruumi'}}if(this.s.time-(this.s.lastAIPlan||0)>=12){this.s.lastAIPlan=this.s.time;this.ai()}}}
 trade(){const count=planMerchants(this),modern=Object.create(this);modern.landPath=()=>null;return count+planTrade(modern)}

 // V137: Every owned detail tile is a potential urban quarter or rural plot.
 // Incremental schedules protect the resource economy and mobile frame times.
 developOwnedCityTiles(city){
  // Keep saved AI district cursor valid even when scarcity defers this turn.
  city.aiTerritoryCursorV137??=0;
  if(this.s.time<(city.aiNextTerritoryBuildV137||0))return;
  city.aiNextTerritoryBuildV137=this.s.time+90;
  const age=this.s.ages[city.team],area=this.constructionArea(city),r=city.economy.realms[city.team];
  if(!area||area.pending.length>=2||(r.resources.wood||0)<28)return; // V145: reserve the city queue for housing, markets and basic services
  const usableFood=[...FOOD_KEYS].reduce((sum,k)=>sum+(r.resources[k]||0),0);
  const workingSites=area.buildings.filter(b=>b.ready&&b.hp>0&&!b.disabled&&(BUILDINGS[b.type]?.workers||0)>0).length;
  if(r.pop<8||usableFood<r.pop*2||r.resources.water<r.pop*1.3||workingSites>r.pop*1.5+4)return; // development must not starve the core
  const houses=area.buildings.filter(b=>b.type==='house'&&b.hp>0&&b.ready).length;
  const capacity=HALL_CAPACITY+HOUSE_CAPACITY*houses;
  const built=area.buildings.filter(b=>!b.virtual&&b.hp>0).length;
  if(built>r.pop*6+24)return; // retain labour and material reserves
  const tiles=area.tiles.map(p=>{
   const cell=this.cell(p),ctx=this.contextAt(p,false);
   const n=ctx?ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length:0;
   const urban=!this.isCountyTile(p,city);
   const supported=!![[1,0],[-1,0],[0,1],[0,-1]].find(([dc,dr])=>this.contextAt({c:p.c+dc,r:p.r+dr},false)?.economy.buildings.filter(b=>b.type==='house'&&b.hp>0).length>=8);
   const canExpand=!urban&&r.pop>=14&&houses>=V139_CORE_HOUSES&&supported&&urbanExpansionEligible(this,city,p);
   // Establish a connected suburb before the entire historic centre is packed.
   const centre=cell&&cell.c===city.c&&cell.r===city.r;
   const activeTownHouses=ctx?.economy.buildings.filter(b=>b.type==='house'&&b.hp>0).length||0;
   const priority=cell?historicalTilePriority(city,cell,urban,n)+(centre&&activeTownHouses<V139_CORE_HOUSES?85:0)+(canExpand?activeTownHouses>=12?9:-18:0): -Infinity;
   return {cell,ctx,n,urban,canExpand,score:priority};
  }).filter(o=>o.cell?.land&&!o.cell.mountain&&o.n<(o.urban?28:2))
    .sort((a,b)=>b.score-a.score);
  // Rotate through the entire county over time; never reconsider only the nine easiest cells.
  const cursor=(city.aiTerritoryCursorV137||0)%Math.max(1,tiles.length);
  city.aiTerritoryCursorV137=cursor+9;
  let examined=0;
  for(const item of [...tiles.slice(cursor),...tiles.slice(0,cursor)]){
   if(++examined>9)break;
   const {cell,urban}=item;
   if(!this.landPath(city,cell,city.team))continue;
   const mayExpand=item.canExpand;
   const types=historicalTilePlan(city,cell,urban||mayExpand,age);
   for(const type of types){
    if((urban||mayExpand)&&type==='house'&&((!mayExpand&&r.pop<Math.floor(capacity)-5)||houses>=70))continue;
    if(['market','warehouse','cellar','study','scriptorium','barracks','archery'].includes(type)&&
       area.buildings.some(b=>b.type===type&&b.hp>0))continue;
    if(!urban&&!mayExpand&&item.n>=1)continue;
    if((BUILD_AGE[type]??99)>age||(BUILD_TECH[type]&&!this.s.research[city.team].known.includes(BUILD_TECH[type])))continue;
    if(!BUILDINGS[type]||!canAfford(r.resources,BUILDINGS[type].cost))continue;
    if(type!=='house'&&(r.resources.wood||0)<(BUILDINGS[type].cost.wood||0)+15)continue;
    const ctx=item.ctx||this.contextAt(cell,true);
    if(!ctx)continue;
    const expanding=mayExpand&&['house','market','warehouse','cellar','well','study','scriptorium'].includes(type);
    const previousExpansion=!!ctx.urbanExpansionV138;
    if(expanding)ctx.urbanExpansionV138=true;
    if(this.buildRule(ctx,type)){if(expanding&&!previousExpansion)delete ctx.urbanExpansionV138;continue;}
    const candidates=this.buildingSites(ctx,type);
    const cursor=(ctx.aiPlotCursorV138?.[type]||0);
    const inner=urban&&type==='house'&&ctx.c===city.c&&ctx.r===city.r&&houses<V139_CORE_HOUSES?
     candidates.filter(p=>Math.hypot(p.x-city.economy.buildings[0].x,p.z-city.economy.buildings[0].z)<=70).slice(0,140):[];
    const batch=[...inner,...nextPlotBatch(candidates,cursor,48).filter(p=>!inner.some(q=>q.x===p.x&&q.z===p.z))];
    (ctx.aiPlotCursorV138??={})[type]=cursor+batch.length;
    let succeeded=false;
    for(const p of batch){
     if(type==='farm'&&(this.isCountyTile(ctx,city)&&this.countySlots(ctx).used>=2||!findAIFieldSite(this,ctx,p)))continue;
     if(this.previewBuild(ctx,type,p).error)continue;
     if(this.build(ctx,type,p).building){city.aiTerritoryBuiltV137=(city.aiTerritoryBuiltV137||0)+1;succeeded=true;break;}
    }
    if(succeeded)return;
    if(expanding&&!previousExpansion)delete ctx.urbanExpansionV138;
   }
  }
 }

 aiDistricts(){for(const parent of this.s.cities.filter(c=>c.team>0)){const area=this.constructionArea(parent);if(area.pending.length>=2)continue; // V146: rural construction leaves a separate slot for the city centre
 const buildings=this.allBuildings(parent),needed=usefulDistrictTypes(this,parent.team,parent);for(const type of ['hunter','fisher','well','quarry','lumber','farm','coppermine','tinmine','claypit','mine','oilwell','harbor',...Object.keys(GOOD_BUILDINGS).filter(k=>GOOD_BUILDINGS[k].deposit)]){
 if(needed&&!needed.has(type))continue;
 const existing=buildings.filter(b=>b.type===type&&b.hp>0&&!b.disabled);
 // A new district must replace genuinely exhausted supply, not create
 // arbitrarily many mines/quarries that consume the entire workforce.
 if(!canAfford(parent.economy.realms[parent.team].resources,BUILDINGS[type].cost)||existing.some(b=>!ruralSourceExhausted(this,parent,b)))continue;if((BUILD_AGE[type]||0)>this.s.ages[parent.team]||(BUILD_TECH[type]&&!this.s.research[parent.team].known.includes(BUILD_TECH[type])))continue;const dep={...Object.fromEntries(Object.entries(GOOD_BUILDINGS).map(([k,d])=>[k,d.deposit])),hunter:'game',fisher:'coast',well:'water',quarry:'stone',lumber:'wood',farm:'grain',coppermine:'copper',tinmine:'tin',claypit:'clay',mine:'ore',oilwell:'oil',harbor:'coast'}[type],tiles=[];
 // Keep ordinary core construction in charge while a real local site exists.
 // Only move production outwards when the inner tile cannot provide it.
 const localDeposit=dep==='coast'?isShore(this,parent):this.cell(parent)?.deposits[dep];
 if(localDeposit&&!this.buildRule(parent,type)&&this.buildingSites(parent,type).slice(0,24).some(p=>!this.previewBuild(parent,type,p).error&&(type!=='farm'||findAIFieldSite(this,parent,p))))continue;
 // Search only the parent county bounds rather than the entire world.
 for(const q of this.constructionArea(parent).tiles){
  const p=this.cell(q);
  if(!p?.land||this.cityAt(p)||this.territoryOwner(p)?.id!==parent.id)continue;
  if(dep==='coast'?!isShore(this,p):!p.deposits[dep])continue;
  tiles.push(p);
 }
 tiles.sort((a,b)=>Math.abs(a.c-parent.c)+Math.abs(a.r-parent.r)-Math.abs(b.c-parent.c)-Math.abs(b.r-parent.r));for(const tile of tiles){if(!this.landPath(parent,tile,parent.team))continue;const actualKind={lumber:'tree',quarry:'stone',hunter:'game',mine:'ore',oilwell:'oil',coppermine:'copper',tinmine:'tin',claypit:'clay'}[type];
 if(actualKind&&!this.localWorld(tile).resources.some(r=>r.kind===actualKind&&!r.removed&&(r.amount||0)>0))continue;
 const ctx=this.contextAt(tile,true);
 if(this.buildRule(ctx,type)||ctx.economy.buildings.some(b=>!b.virtual&&b.type===type&&b.hp>0))continue;if(type==='farm'&&this.isCountyTile(ctx,parent)&&this.countySlots(ctx).used>=2)continue;let built=false;for(const p of this.buildingSites(ctx,type)){if(type==='farm'&&!findAIFieldSite(this,ctx,p))continue;const check=this.previewBuild(ctx,type,p);if(check.error)continue;const nav=this.nav(ctx),from=nav.nearest(door(ctx.economy.buildings[0]),9),to=nav.nearest(check.landEntry||door({...p,type}),9);if(!from||!to||!nav.reachable(from,to))continue;if(this.build(ctx,type,p).building){built=true;break}}if(built)break}if(this.constructionArea(parent).pending.length>=2)break;}}}

 ai(){for(const team of [1,2,3]){this.aiTeam(team);aiNavy(this,team)}this.aiDistricts()}
 ensureFarmFields(team){
  for(const parent of this.s.cities.filter(c=>c.team===team))for(const ctx of this.contexts(parent)){
   if(!this.cell(ctx)?.deposits.grain||!ctx.economy.buildings.some(b=>b.type==='farm'&&b.ready&&b.hp>0))continue;
   if(ctx.economy.buildings.some(b=>b.type==='field'&&b.hp>0))continue;
   if(this.constructionArea(parent).pending.length>=2||!this.canBuildNow(ctx,'field')||this.s.time<(ctx.nextFieldSearchV127||0))continue;
   ctx.nextFieldSearchV127=this.s.time+60;
   const field=findAIFieldSite(this,ctx);if(field)this.build(ctx,'field',field);
  }
 }
 aiTeam(team){
 this.ensureFarmFields(team);
 // A rival may station a defender only from an actual army with surplus troops.
 for(const city of this.s.cities.filter(c=>c.team===team)){
  const wall=city.economy.buildings.find(b=>['palisade','stonewall'].includes(b.type)&&b.ready&&b.hp>0&&!b.disabled);
  const mobile=this.s.units.filter(u=>u.team===team&&combatUnit(u)&&!u.garrison);
  if(wall&&mobile.length>=4&&!this.wallGuards(city,wall).length){const source=this.s.units.findIndex(u=>u.team===team&&combatUnit(u)&&!u.garrison&&this.s.armies.some(a=>a.team===team&&(a.id||0)===(u.armyId||0)&&a.c===city.c&&a.r===city.r&&!a.path.length));if(source>=0)this.stationWall(city,wall,source);}
 }
const science=this.s.research[team];if(science.active&&!allowAIResearch(this.s,team,science.active,TROOPS,TECHS))science.active=null;if(!science.active&&this.s.cities.some(c=>c.team===team)){const order=[...productivityResearchOrder(this.s.ages[team]),'stone_tools','learning','hunting','water','agriculture','bronze','woodworking','pottery','animal_husbandry','masonry','warfare','fortifications','archery','settlement','stone_crafts','woodworking','wheel','copper_tin','stone_fortifications','road_construction','forestry','storage','cellaring','commerce','writing','literacy','bronze_crafts','milling','bridges','fishing','shipbuilding','iron','smelting','smithing','horsemanship','early_siege_engineering','ancient_artillery','philosophy','iron_crafts','navigation','civics','armor_craft','crossbows','guilds','watermills','windmills','medieval_healing','city_trade','monasticism','knighthood','castle_building','siege_engineering','city_fortifications','scholasticism','medieval_crafts','ocean_sailing','renaissance','printing','astronomy','gunpowder','industrialization','steelmaking','steam_engine','industrial_education','public_education','secondary_education','rifles','railways','modernity','oil_drilling','petroleum','electricity','combustion','modern_science','aviation'];const urgent=this.s.ages[team]>=1?['stone_fortifications','commerce','shipbuilding']:[];const goals=bronzeResearchGoals(this.s,team,TECHS,[...urgent,...expandResearchOrderV125(order)].filter(id=>allowAIResearch(this.s,team,id,TROOPS,TECHS)));
 const id=nextResearchForGoals(science,goals);if(id)this.research(team,id)}for(const a of this.s.settlers.filter(a=>a.team===team)){if(a.embarked!=null)continue;if(a.landed&&!citySpacingAllowed(a,this.s.cities)){a.landed=false;a.localTarget=null}if(a.path.length)continue;if(!a.landed){const missing=nationalResourceNeeds(this,team);const ownCities=this.s.cities.filter(c=>c.team===team),hasCity=ownCities.length>0;const score=c=>settlementResourceScore(this,team,c,missing)*3+(c.deposits.wood?8:0)-(Math.abs(c.c-a.c)+Math.abs(c.r-a.r))*1.5-(hasCity?Math.min(...ownCities.map(h=>Math.max(Math.abs(c.c-h.c),Math.abs(c.r-h.r))))*6:0);const span=hasCity?26:9;const options=[];
 for(let rr=Math.max(0,a.r-span);rr<=Math.min(ROWS-1,a.r+span);rr++)for(let cc=Math.max(0,a.c-span);cc<=Math.min(COLS-1,a.c+span);cc++){
  const c=this.cell({c:cc,r:rr});
  if(!c?.land||this.territoryOwner(c)||(hasCity===false&&(!c.deposits.wood||!c.deposits.stone))||
   !citySpacingAllowed(c,this.s.cities,AI_CITY_SPACING)||Math.abs(c.c-a.c)+Math.abs(c.r-a.r)>span)continue;
  options.push(c);
 }
 options.sort((p,q)=>score(q)-score(p));const target=options.find(c=>{const path=this.landPath(a,c,team);return path!==null&&(!hasCity||path.length<=64)&&[-18,-6,6,18].some(x=>[-18,-6,6,18].some(z=>!this.siteRule({...a,c:c.c,r:c.r,landed:true,path:[]},{x,z})));});if(!target){a.aiSeaNeeded=hasCity;continue;}a.aiSeaNeeded=false;if(a.c!==target.c||a.r!==target.r){this.moveSettler(a.id,target);continue}this.land(a.id)}if(a.localTarget)continue;let founded=false;for(let x=-18;x<=18&&!founded;x+=6)for(let z=-18;z<=18&&!founded;z+=6){if(!this.siteRule(a,{x,z})&&this.nav(a).route(a,{x,z})){if(distance(a,{x,z})<1){this.found(a.id);founded=true}else{a.localTarget={x,z};founded=true}}}}
 for(const city of this.s.cities.filter(c=>c.team===team)){const army=this.s.armies[team];if(city===this.s.cities.find(c=>c.team===team)&&!army.path.length&&this.s.units.filter(u=>u.team===team&&u.hp>0).every(u=>u.kind==='scout')&&(army.c!==city.c||army.r!==city.r))army.path=this.landPath(army,city,team)||[];const age=this.s.ages[team];
 for(const b of this.allBuildings(city))if(b.ready&&b.hp>0&&b.disabled&&['well','hunter','fisher','lumber','quarry','saw','mine','coal','smelter'].includes(b.type)){b.disabled=false;b.workerLimit=Math.max(1,b.workerLimit||1);}
 // A usable production chain is more important than a fixed construction list.
 // Decisions include affordability, terrain restrictions, available labour,
 // era material reserves, and the prerequisites of each missing resource.
 // Planning a distant city's next construction only every 36 game seconds
 // avoids 12-town empires recomputing thousands of building-site paths per frame.
 // Two paid builders for the mature Bronze core; never conjure completed walls.
  if(age>=1&&city.economy.realms[team].pop>=18)city.builderCount=Math.max(2,city.builderCount||1);
 planAIDefenses(this,team,city);
 if(this.s.time>=(city.aiNextBuildCheck||0)){
  city.aiNextBuildCheck=this.s.time+36;
 const excluded=new Set(Object.entries(city.aiPlacementRetry||{}).filter(([,until])=>until>this.s.time).map(([type])=>type));
 for(let attempt=0;attempt<6;attempt++){
  const decision=selectAIBuild(this,team,city,excluded);if(!decision)break;
  const next=decision.type;let built=false;
  const contexts=[city,...this.contexts(city).filter(ctx=>ctx!==city&&!this.isCountyTile(ctx,city))];
  // A city occupies several urban detail tiles. Workshops must not stall
  // forever once the centre is full; rural county limits remain enforced.
  for(let rr=city.r-this.radius(city);rr<=city.r+this.radius(city);rr++)for(let cc=city.c-this.radius(city);cc<=city.c+this.radius(city);cc++){
   const tile=this.cell({c:cc,r:rr});if(cc<0||cc>=COLS||rr<0||rr>=ROWS||!tile?.land||tile.mountain||this.cityAt(tile)||this.territoryOwner(tile)?.id!==city.id||contexts.some(ctx=>ctx.c===cc&&ctx.r===rr))continue;
   contexts.push({c:cc,r:rr,lazy:true});
  }
  // The first six houses surround the hall. Later houses form a dense,
  // connected neighborhood on ONE adjacent tile before another is opened.
  // The AI can also extend that neighborhood into an owned rural tile once
  // at least two buildings stand on the shared side.
  const isHousing=next==='house',existingHomes=this.allBuildings(city).filter(b=>b.type==='house'&&b.hp>0).length;
  if(isHousing&&existingHomes>=V139_CORE_HOUSES+6&&this.allBuildings(city).filter(b=>['market','study','warehouse','cellar','well'].includes(b.type)&&b.ready&&b.hp>0).length>=2)for(const tile of this.constructionArea(city).tiles){
   if(!this.isCountyTile(tile,city)||!urbanExpansionEligible(this,city,tile))continue;
   if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>this.contextAt({c:tile.c+dc,r:tile.r+dr},false)?.economy.buildings.filter(b=>b.type==='house'&&b.hp>0).length>=8))continue;
   if(contexts.some(ctx=>ctx.c===tile.c&&ctx.r===tile.r))continue;
   contexts.push({...tile,lazy:true,expandV138:true});
  }
  const orderedContexts=historicalDistrictOrder(city,contexts);
  if(isHousing)orderedContexts.sort((a,b)=>{
   const rank=ctx=>{
    if(ctx.expandV138)return 85; // outer suburb after compact inner quarters
    return cityInfillRank(city,ctx,next,this);
   };
   return rank(a)-rank(b);
  });
  for(let ctx of orderedContexts){
   const expansion=!!ctx.expandV138;
   if(ctx.lazy)ctx=this.contextAt(ctx,true);
   if(!ctx)continue;
   const wasUrban=!!ctx.urbanExpansionV138;
   if(expansion)ctx.urbanExpansionV138=true;
   if(this.buildRule(ctx,next)){if(expansion&&!wasUrban)delete ctx.urbanExpansionV138;continue;}
   const h=ctx.economy.buildings[0],spots=this.buildingSites(ctx,next),kind=({lumber:'tree',hunter:'game'})[next];
   const deposits=kind?ctx.world.resources.filter(r=>r.kind===kind&&!r.removed&&r.amount>0):[];
   const score=p=>historicalSiteScore(h,p,next,ctx.economy.buildings,deposits);
   // V138 candidates already follow a continuous ancient street plan. Scan
   // successive batches so no district edge remains permanently unreachable.
   const plotCursor=(ctx.aiPlotCursorV138?.[next]||0);
   const centerFirst=isHousing&&ctx.c===city.c&&ctx.r===city.r&&existingHomes<V139_CORE_HOUSES?
    spots.filter(p=>Math.hypot(p.x-city.economy.buildings[0].x,p.z-city.economy.buildings[0].z)<=70).slice(0,140):[];
   const batch=[...centerFirst,...nextPlotBatch(spots,plotCursor,96).filter(p=>!centerFirst.some(q=>p.x===q.x&&p.z===q.z))];
   (ctx.aiPlotCursorV138??={})[next]=plotCursor+batch.length;
   for(const p of batch){
    const check=this.previewBuild(ctx,next,p);if(check.error)continue;
    const nav=this.nav(ctx),home=nav.nearest(check.landEntry||door({...p,type:next}),9),depot=nav.nearest(door(h),9);
    if(!home||!depot||!nav.reachable(depot,home))continue;
    if(kind&&next!=='fisher'&&!deposits.some(r=>{if(distance(r,p)>=55)return false;const goal=nav.nearest({x:r.x+1.8,z:r.z},4);return goal&&nav.reachable(home,goal)}))continue;
    if(this.build(ctx,next,p).building){built=true;break;}
   }
   if(built)break;
   if(expansion&&!wasUrban)delete ctx.urbanExpansionV138;
  }
  if(built){city.aiPlacementRetry={};break;}excluded.add(next);(city.aiPlacementRetry??={})[next]=this.s.time+15;
 }

 }
 const stock=city.economy.realms[team].resources;
 this.developOwnedCityTiles(city);
 const problems=cityProblems(this,city);city.aiDiagnostics=problems.slice(0,3).map(x=>x.text);
 // Construction recovery: an AI unable to assign builders is nudged back to an active queue.
 if(this.allBuildings(city).some(b=>!b.ready&&!b.disabled)&&(!city.builderCount||city.builderCount<1))city.builderCount=1;
 // Re-enable essential production, where a halted building is the only supplier.
 if(problems.some(p=>p.level>=3))for(const b of this.allBuildings(city).filter(b=>b.ready&&b.hp>0&&b.disabled&&['well','hunter','fisher','farm','lumber','quarry'].includes(b.type))){b.disabled=false;b.workerLimit=Math.max(1,b.workerLimit||1)}
 // V125: defend towns and gradually raise standing army capacity as the empire expands.
 const living=this.s.units.filter(u=>u.team===team&&combatUnit(u)&&!u.garrison);
 const desired=armyCapacity(this.s.cities.filter(c=>c.team===team).length,age,
  this.s.cities.some(c=>c.team!==team&&atWar(this.s,team,c.team)));
 const schedule=this.s.aiRecruitAt??={};
 const nextRecruitAt=schedule[team]??=210;
 if(this.s.time>=nextRecruitAt&&city.economy.realms[team].pop>=(age===1?28:10)&&
   foodTotal(stock)>=Math.max(24,city.economy.realms[team].pop*2)&&(city.training?.length||0)<2){
  const choices=militaryChoices(this,team,city,TROOPS,UNIT_TECH);
  const kind=choices.find(k=>{const d=TROOPS[k],tech=UNIT_TECH[k];
   return k!=='bronze_cavalry'&&!this.obsoleteUnit(team,k)&&age>=d.age&&
    (!tech||science.known.includes(tech))&&d.requires.every(type=>this.cityReady(city,type))&&canAfford(stock,d.cost)});
  if(kind){const source=this.s.units.findIndex((u,i)=>u.team===team&&combatUnit(u)&&!u.garrison&&(TROOPS[u.kind]?.age??0)<TROOPS[kind].age&&!this.s.cities.some(c=>(c.training||[]).some(j=>j.upgradeSource===i))&&this.s.armies.some(a=>a.team===team&&(a.id||0)===(u.armyId||0)&&a.c===city.c&&a.r===city.r&&!a.path.length));const queued=this.s.cities.filter(c=>c.team===team).reduce((n,c)=>n+(c.training||[]).filter(j=>!j.ship&&j.upgradeSource==null).length,0);const result=source>=0?this.retrain(city,source,kind):living.length+queued<desired?this.recruit(city,kind):{};if(result.unit)
     this.s.aiRecruitAt[team]=this.s.time+(age<=1?100:age<=3?90:75);}
 }
 // Cap expansion by elapsed game turns, not by an arbitrary resource-deficit
 // exception; settlers still need food, people, a valid route and a real build site.
 const existing=this.s.cities.filter(c=>c.team===team).length;
 const pending=this.s.settlers.filter(a=>a.team===team).length;
 const policy=settlerPolicy({time:this.s.time,age,cities:existing,pending,
   pop:city.economy.realms[team].pop,food:foodTotal(stock),
   lastAt:(this.s.aiSettlerLastAt??={})[team]||0,
   hasSettlement:science.known.includes('settlement')});
 if(policy.allow){const result=this.recruitSettler(city);
  if(result.settler){this.s.aiSettlerLastAt[team]=this.s.time;city.lastSettler=this.s.time;}}
}
 // Territorial competition: AI may declare a limited war only after scouting
 // the opponent, fielding a real army, and approaching contested settlements.
 if(this.s.strategyPacingV125&&this.s.time>180*60){
  const mobile=this.s.units.filter(u=>u.team===team&&combatUnit(u)&&!u.garrison);
  const last=(this.s.aiLastWarAt??={})[team]||0;
  if(mobile.length>=8&&this.s.time-last>150*60){
   const ourCities=this.s.cities.filter(c=>c.team===team);
   const knownRivals=this.s.cities.filter(c=>c.team!==team&&
     this.seen(team,c)&&!atWar(this.s,team,c.team));
   const candidates=knownRivals.filter(c=>ourCities.some(own=>
     Math.abs(own.c-c.c)+Math.abs(own.r-c.r)<42)).sort((a,b)=>
       Math.min(...ourCities.map(x=>Math.abs(x.c-a.c)+Math.abs(x.r-a.r)))-
       Math.min(...ourCities.map(x=>Math.abs(x.c-b.c)+Math.abs(x.r-b.r))));
   const enemy=candidates[0];
   if(enemy){
    const enemyStrength=this.s.units.filter(u=>u.team===enemy.team&&combatUnit(u)&&!u.garrison).length;
    if(mobile.length>=Math.max(8,Math.ceil(enemyStrength*.75))){
     setRelation(this.s,team,enemy.team,'war');
     this.s.aiLastWarAt[team]=this.s.time;
    }
   }
  }
 }
 const army=activeArmies(this.s,team).sort((a,b)=>armyUnits(this.s,b).length-armyUnits(this.s,a).length)[0]||this.s.armies[team];
 // AI must scout rather than know all opponents' city coordinates from the start.
 if(army.embarked==null&&!army.path.length&&this.s.time>360&&!this.s.cities.some(c=>c.team!==team&&this.visibleNow(team,c))){
  const seen=this.s.explored?.[team]||{},options=[];
  for(let dr=-7;dr<=7;dr+=2)for(let dc=-7;dc<=7;dc+=2){const c=army.c+dc,r=army.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;
   const key=c+':'+r;if(!seen[key]&&this.canTraverse(team,{c,r}))options.push({c,r,dist:Math.abs(dc)+Math.abs(dr)})}
  options.sort((a,b)=>a.dist-b.dist);
  for(const pos of options.slice(0,12)){const path=this.landPath(army,pos,team);if(path?.length){army.path=path;break}}
 }
 if(army.embarked==null&&this.s.time>=this.s.aiPeaceUntil&&!this.s.battle&&!army.path.length&&armyUnits(this.s,army).length>=3){const target=[...this.s.cities,...this.s.settlers].filter(c=>atWar(this.s,team,c.team)&&this.seen(team,c)).sort((a,b)=>Math.abs(a.c-army.c)+Math.abs(a.r-army.r)-Math.abs(b.c-army.c)-Math.abs(b.r-army.r))[0];if(target)army.path=this.landPath(army,target,team)||[]}}
}
