import {addTowerGuards,tickTowerGuards,persistTowerGuards} from './tower-garrison-v117.js?v=117a';
import {siegeSection} from './medieval-v62.js?v=117a';
import {ballistaUnlocked,craftError} from './era-availability-v116.js?v=117a';
import {towerBallista} from './siege-support-v115.js?v=117a';
import {createBallista,createBallistaBolt} from './siege-support-visual-v115.js?v=117a';
import {damageStage,updateCatapultDamage} from './destruction-v113.js';
import {createBronzeCityModel,createBronzeTownHouse,createWallStairs} from './bronze-city-v111.js?v=117a';
import {orderWallMove,fighterElevation} from './wall-walk-v111.js?v=117a';
import {ARMY_COLORS,ARMY_COLOR_NAMES} from './bronze-soldiers-v95.js';
import {FORMATIONS,formationOptions,formationName,setFormation} from './formations-v94.js?v=117a';
import {deployHistoricalBattle} from './historical-tactics-v92.js?v=117a';
import {battleManCount,livingMen,initializeMen,persistIndividualMen} from './individual-battle-v91.js?v=117a';
let selectedSoldierId=null;
import {SoldierBatch} from './soldier-batch-v90.js';
import {formationMen,soldierCount} from './soldier-collision-v90.js?v=117a';
import {selectionDetails} from './selection-info-v89.js?v=117a';
import {createBronzeBattleState,BRONZE_BATTLE_NAME} from './bronze-battle-demo-v89.js?v=117a';
import {createBronzeSiegeState,createIronSiegeState,createBronzePatrolState,BRONZE_SIEGE_NAME} from './bronze-siege-demo-v108.js?v=117a';
import {BATTLEFIELD,applyArmyRetreats,checkBattleRetreats,orderArmyWithdrawal} from './battlefield-v88.js';
import {createBattleBoundary,batchBattleDecoration} from './battle-scene-v88.js';
import {UNIT_GRADES,troopCost,rangedTroop} from './military-v88.js?v=117a';
import {armyLevel,xpForLevel,rewardBattleExperience} from './army-experience-v88.js';
let recruitGrade='standard';
import {VisionDelta} from './fog-delta-v88.js';
import {createDepositPile} from './site-models-v88.js';
import {atWar,setRelation,relation,blockMerchants} from './diplomacy-v87.js';
import {cityNeeds,nationalStock,foodTotal,GOODS} from './city-needs-v87.js';
import {spatialInstances,updateSpatialBatches} from './spatial-batches-v86.js?v=86a';
import {automaticUIRefreshDue} from './gameplay-flow-v86.js?v=86a';
import {landscapeMaterial} from './landscape-material-v85.js?v=85a';
import {createDetailBorders} from './detail-borders-v85.js?v=85a';
import {mountainTint,createMountainOutcrops,createBridgeBuilding,crossingFrame} from './landscape-polish-v84.js?v=85a';
import {CommandVisuals} from './command-visuals.js';
import {initializeLocalization,currentLanguage,changeLanguage} from './localization.js?v=100a';
import {visibleNow,knownEnemyCities,actionTips,cityProblems,constructionForecast,armyUnits,activeArmies} from './v51-systems.js';
import {CameraKeys} from './map-controls.js';
import {fishingRange,fishingEraText} from './fishery.js?v=64b';
import {minimapCell} from './minimap.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js?v=60';
import {createDetailTrailLinks} from './detail-roads.js?v=100a';
import {createRiverNetwork,createUnifiedRoadNetwork,disposeNetwork} from './continuous-landscape-visual.js?v=100a';
import {surface,localSurface,riverNear,overviewSurface} from './continuous-landscape.js?v=85a';
import {SHIPS,cargoArmy,navyExpedition,landingRoute} from './naval.js?v=100a';
import {createShipModel} from './naval-visual.js';
import {renderLabor,timeLabel} from './labor-ui.js?v=86a';
import {housingCapacity,FOOD_PER_RESIDENT,WATER_PER_RESIDENT,BASIC_JOBS} from './labor.js';
import {BattleFeedback} from './battle-feedback.js?v=117a';
import {WALL_TYPES,TOWER_TYPES,wallHeight,fortifyBattle,configureWallFootprint,towerManned,wallCapacity} from './fortifications.js?v=117a';
import {persistSiegeDamage} from './medieval-v62.js?v=117a';
import {SIEGE_CRAFT,startSiegeCraft,availableSiegeWood,planSiegeAI} from './siege-assault-v108.js?v=117a';
import {createSiegeWorkModel} from './siege-work-visual-v108.js?v=117a';
import {TECHS,BUILD_TECH,UNIT_TECH,TURN_SECONDS,techBlock,ERA_NAMES} from './research.js?v=117a';
import {researchCost} from './science.js';
import {tempoMultiplier,tempoName} from './tempo.js';
import {renderResearchUI} from './research-ui.js?v=100a';
import {createWildlife,createWorldUnit,updateWorldUnit} from './map-units.js?v=59';
import {atlasColor,createAtlasDecor,createCityMiniature,cityBanner} from './atlas-style.js?v=86a';
import {createWorldAtlasProps} from './world-props.js?v=100a';
import {buildDetailWorldObjects} from './detail-world-objects.js?v=85a';
import {createVillageLife} from './village-life-v76.js?v=76a';
import * as T from './vendor/three.module.js';
import {Civilization,createGame,migrateGame,AGES,BUILD_AGE,TROOPS,BUILDINGS,RESOURCE_NAMES,tileKey,FACTION_NAMES} from './civilization-core.js?v=117a';
import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,WORLD_CENTER_X,WORLD_CENTER_Z,ORIGIN_X,ORIGIN_Z,center,cellAt,findPath,createBattle,mobilizeCity,settleDefenders,tickBattle,deploymentFor,tickDeployments,rememberBattle} from './campaign.js?v=117a';
import {detailHeight,featureNames} from './world-details.js';
import {createAgeBuilding,animateBuilding} from './buildings.js?v=117a';
import {createStoneDemoState,DEMO_CITY_NAME} from './stone-demo-v77.js?v=80c';
import {createBronzeDemoState,BRONZE_DEMO_NAME} from './bronze-demo-v79.js?v=80c';
import {createMedievalDemoState,MEDIEVAL_DEMO_NAME} from './medieval-demo-v80.js?v=80c';
import {createRenaissanceDemoState,RENAISSANCE_DEMO_NAME} from './renaissance-demo-v81.js?v=81a';
import {createIndustrialDemoState,INDUSTRIAL_DEMO_NAME} from './industrial-demo-v82.js?v=82a';
import {createBuildingInspector,describeBuilding} from './building-inspector-v82.js?v=82a';
import {createSoldier,animateSoldier,addTree} from './visuals.js?v=117a';
import {createGroundCover} from './graphics-v46.js';
import {door} from './navigation.js';
import {loadProtectedGame,writeAutosave,replaceProtectedGame} from './save-safety-v73.js?v=73a';
const $=id=>document.getElementById(id),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),copy=x=>JSON.parse(JSON.stringify(x));
initializeLocalization({BUILDINGS,TECHS,TROOPS,AGES,RESOURCE_NAMES,SHIPS,BASIC_JOBS,ERA_NAMES,onChange:()=>{renderUI();if(typeof slotUI==='function')slotUI()}});
const demoParam=new URLSearchParams(location.search).get('demo');
const patrolDemo=demoParam==='bronze-patrol';
const battleDemo=demoParam==='bronze-battle',siegeDemo=['bronze-siege','iron-siege'].includes(demoParam);
if(siegeDemo)document.body.classList.add('bronze-siege-demo');
const stoneDemo=demoParam==='stone',bronzeDemo=demoParam==='bronze',medievalDemo=demoParam==='medieval',renaissanceDemo=demoParam==='renaissance',industrialDemo=demoParam==='industrial',sampleDemo=patrolDemo||siegeDemo||battleDemo||stoneDemo||bronzeDemo||medievalDemo||renaissanceDemo||industrialDemo;
let recovered=false,state;
const validState=v=>v?.version===4&&Number.isFinite(v.seed)&&Array.isArray(v.cities)&&Array.isArray(v.settlers)&&Array.isArray(v.units)&&Array.isArray(v.armies);
const loadedV73=sampleDemo?{state:patrolDemo?createBronzePatrolState():siegeDemo?(demoParam==='iron-siege'?createIronSiegeState():createBronzeSiegeState()):battleDemo?createBronzeBattleState():stoneDemo?createStoneDemoState():bronzeDemo?createBronzeDemoState():medievalDemo?createMedievalDemoState():renaissanceDemo?createRenaissanceDemoState():createIndustrialDemoState(),recovered:false}:loadProtectedGame(localStorage,validState);state=loadedV73.state;recovered=loadedV73.recovered;
if(!state)try{state=migrateGame(JSON.parse(localStorage.getItem('kingdoms-v1')))}catch{}
state??=createGame(Math.floor(Math.random()*2147483647));
let commandMode='select',hoverPoint=null;const cameraKeys=new CameraKeys();let lastMenuRevision=0,lastOverviewStamp='';let selectedShip=null;let cityTab='info';let restarting=false;let game=new Civilization(state),s=game.s,view='world',activeTile=null,chosen=game.cell(s.settlers.find(a=>a.team===0)||s.cities.find(c=>c.team===0)||{c:10,r:11}),selectedMover=s.settlers.find(a=>a.team===0)?.id??null,armySelected=false,selectedArmyId=0,selectedTrade=null,selectedUnit=null,mode=null,wallAxis=0,tab='build',menuOpen=true,paused=false,toastTime=0,zoom=950,drag=null,focus=new T.Vector3(),last=performance.now(),saveTimer=0,uiTimer=0,signature='',localTerrain=null,frameDelta=0,selectedBuilding=null,buildingInspector=null,ghost=null,ghostPoint=null,ghostKey='',lastTrailTime=-1,lastTrailChanges=-1,lastTrailNavVersion=-1;
const renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
let quality='medium';try{quality=localStorage.getItem('kingdoms-quality')||(innerWidth>760?'high':'medium')}catch{}if(!['low','medium','high'].includes(quality))quality='medium';
const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,20000),ray=new T.Raycaster(),pointer=new T.Vector2(),worldScene=new T.Scene(),localScene=new T.Scene(),worldObjects=new T.Group(),localObjects=new T.Group(),environment=new T.Group(),people=new T.Group(),worldMarkers=new Map(),localModels=new Map(),resourceModels=new Map(),workerModels=new Map(),unitModels=new Map();let localBorders=null,localBorderStamp='';let localRivers=null,localCrossingRevision=-1;let localTrails,localTrailLinks=null,detailWorldRoads=null,detailRoadStamp='';let neighbourTerrains=[];const detailObjectHolders=new Map();const battleFeedback=new BattleFeedback(people,camera,(x,z)=>ground(activeTile,x,z));
worldScene.background=new T.Color('#203f52');worldScene.fog=new T.Fog('#87aab0',1850,7300);localScene.background=new T.Color('#b7c9bd');localScene.fog=new T.Fog('#b7c9bd',260,700);localScene.add(environment,localObjects,people);worldScene.add(worldObjects);
for(const scene of [worldScene,localScene]){scene.add(new T.HemisphereLight(0xf0f1e0,0x45574a,1.55));const light=new T.DirectionalLight(0xffe4be,2.15);light.position.set(-80,150,90);light.castShadow=scene===localScene;light.shadow.mapSize.set(1024,1024);light.shadow.normalBias=.015;Object.assign(light.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:350});light.shadow.bias=-.0004;scene.add(light);const fill=new T.DirectionalLight(0xb4d3df,.52);fill.position.set(130,90,-120);scene.add(fill)}
const mats=new Map();function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.9}));return mats.get(color)}
function box(parent,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function detailNav(){return s.battle?game.battleNavigation():game.nav(activeTile)}
function ground(cell,x,z){return localSurface(game,cell,x,z)}
// Only the opt-in V77 sample uses previewAge. Imported V4 sample cities
// retain their kiviaeg showcase until the faction actually enters Bronze Age.
function townBuildingModel(type,team,age,stage=0){if(['palisade','stonewall','reinforced_wall','gatehouse'].includes(type))return createBronzeCityModel(type,team,stage);if(['bronze-siege','iron-siege'].includes(s.demo)&&team===1){const m=createBronzeCityModel(type,team,stage)||createBronzeTownHouse(type,team);if(m)return m;}return createAgeBuilding(type,team,age)}
function visualBuildingAge(b){if(['bronze-siege','iron-siege'].includes(s.demo)&&b.team===1)return 1;return b.previewAge===0&&game.upgrade(b.team)===0?0:game.buildingAge(b.team,b.type)}
function updateBuildingInfo(){
 if(!buildingInspector){
  buildingInspector=createBuildingInspector($('building-inspector'),{
   close:()=>{selectedBuilding=null;renderUI()},
   onWorkers:()=>setCityTab('workers'),
   onToggle:()=>{
    const ctx=activeCity(),b=selectedBuilding;
    if(ctx?.team!==0||!b||!ctx.economy.buildings.includes(b)||!b.ready)return;
    game.toggleBuilding(ctx,b);renderUI();save();
   }
  });
 }
 const ctx=view==='local'&&!s.battle?activeCity():null;
 if(!ctx||!selectedBuilding||!ctx.economy.buildings.includes(selectedBuilding)){
  buildingInspector.update(null);return;
 }
 buildingInspector.update(describeBuilding(game,ctx,selectedBuilding,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH));
}
// The overview mesh has a coarse vertex spacing. Conservatively open the
// channel at neighbouring vertices so it cannot roof over a narrow river.
function atlasTerrainHeight(x,z){return overviewSurface(game,x,z,50/(quality==='low'?2:3))}

function terrain(scene,cell=null){const world=!cell,battle=!world&&!!s.battle,geo=new T.PlaneGeometry(world?WORLD_WIDTH:battle?1200:450,world?WORLD_DEPTH:battle?1040:390,world?COLS*(quality==='low'?2:3):(quality==='high'?450:quality==='low'?180:300),world?ROWS*(quality==='low'?2:3):(quality==='high'?390:quality==='low'?156:260));geo.rotateX(-Math.PI/2);if(battle)geo.translate(75,0,65);if(world)geo.translate(WORLD_CENTER_X,0,WORLD_CENTER_Z);const p=geo.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=world?atlasTerrainHeight(x,z):ground(cell,x,z),at=world?cellAt(x,z):cellAt(cell.x+x/3,cell.z+z/2.6),biome=at?game.cell(at).biome:'sea';p.setY(i,h);const mountain=!!at&&game.cell(at)?.mountain;
 const color=world?atlasColor(game,x,z,h):new T.Color(
  h<-.15?'#8b9c91':h<.65?'#dbcba0':
  mountain&&h>19?'#8d968b':mountain&&h>12?'#878781':
  mountain&&h>6?'#787e71':
  h>8?'#77856d':biome==='forest'?'#56774c':
  biome==='hills'?'#67745d':biome==='beach'?'#c4ad7d':'#92a365');if(!world&&h>.3){const patch=game.smooth((x+cell.c*150)/31+8,(z+cell.r*130)/31+7);color.lerp(new T.Color(patch>.65?'#b8ab76':'#547a4c'),Math.abs(patch-.5)*.28)}color.multiplyScalar(.90+game.smooth(x/19+20,z/19+30)*.18);colors.push(color.r,color.g,color.b)}// V69 cliff strata: colour actual steep mesh faces, not the entire mountain tile.
geo.computeVertexNormals();const norm=geo.attributes.normal;
const shale=new T.Color('#484743'),sunRock=new T.Color('#9e9481'),peakSnow=new T.Color('#d9d5c5');
for(let i=0;i<p.count;i++){
 const x=p.getX(i),z=p.getZ(i),height=p.getY(i),at=world?cellAt(x,z):cellAt(cell.x+x/3,cell.z+z/2.6);
 const rocky=at&&game.cell(at)?.mountain;if(!rocky||height<1)continue;
 const wx=world?x:cell.x+x/3,wz=world?z:cell.z+z/2.6,wy=world?height:height/.30+.7;
 const nx=norm.getX(i)*(world?1:3),ny=norm.getY(i)*(world?1:.30),nz=norm.getZ(i)*(world?1:2.6);
 const shade=mountainTint(new T.Color(colors[i*3],colors[i*3+1],colors[i*3+2]),wx,wz,wy,ny/(Math.hypot(nx,ny,nz)||1));
 colors[i*3]=shade.r;colors[i*3+1]=shade.g;colors[i*3+2]=shade.b;
}
geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));const mesh=new T.Mesh(geo,landscapeMaterial('terrain',world?'world':'detail',cell));mesh.receiveShadow=true;mesh.userData.terrain=true;scene.add(mesh);if(!world){
 const seaGeo=new T.PlaneGeometry(battle?1200:450,battle?1040:390,quality==='low'?32:64,quality==='low'?28:56);seaGeo.rotateX(-Math.PI/2);if(battle)seaGeo.translate(75,0,65);
 const v=seaGeo.attributes.position,colors=[];
 for(let i=0;i<v.count;i++){
  const depth=Math.max(0,-ground(cell,v.getX(i),v.getZ(i)));
  const c=new T.Color('#65b2af').lerp(new T.Color('#174c68'),Math.min(1,depth/5));
  colors.push(c.r,c.g,c.b);
 }
 seaGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const sea=new T.Mesh(seaGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:.34,metalness:.12,transparent:true,opacity:.73,depthWrite:false,side:T.DoubleSide}));
 sea.position.y=0;sea.userData.terrain=true;sea.renderOrder=3;scene.add(sea);
 }return mesh}
const atlasLand=terrain(worldScene),grid=[];
if(quality!=='low'){
 const tileStep=quality==='high'?1:2,subdiv=quality==='high'?3:2;
 for(let c=0;c<=COLS;c+=tileStep)for(let r=0;r<ROWS;r++)for(let i=0;i<subdiv;i++){
  const x=ORIGIN_X+c*50,z=ORIGIN_Z+r*50+i*50/subdiv,nz=z+50/subdiv;
  grid.push(x,Math.max(.7,surface(game,x,z))+.4,z,x,Math.max(.7,surface(game,x,nz))+.4,nz);
 }
 for(let r=0;r<=ROWS;r+=tileStep)for(let c=0;c<COLS;c++)for(let i=0;i<subdiv;i++){
  const x=ORIGIN_X+c*50+i*50/subdiv,z=ORIGIN_Z+r*50,nx=x+50/subdiv;
  grid.push(x,Math.max(.7,surface(game,x,z))+.4,z,nx,Math.max(.7,surface(game,nx,z))+.4,z);
 }
}
if(grid.length)worldScene.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(grid,3)),new T.LineBasicMaterial({color:'#d5e2c2',transparent:true,opacity:.13})));

function parchmentColor(x,z){const n=game.smooth(x/40+17,z/40+61),grain=game.smooth(x/12+91,z/12+35),c=new T.Color('#c7b488');c.lerp(new T.Color('#dcc7a1'),n*.45);c.lerp(new T.Color('#af9a73'),Math.max(0,grain-.55)*.33);return c}
const visionDelta=new VisionDelta(s),atlasVisibleColors=atlasLand.geometry.attributes.color.array.slice();
let atlasVertexCells=null,atlasFogSerial=-1;
function refreshAtlasFog(){
 const delta=visionDelta.update(),pos=atlasLand.geometry.attributes.position,col=atlasLand.geometry.attributes.color;
 if(!atlasVertexCells){
  atlasVertexCells=new Map();
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),z=pos.getZ(i),at=cellAt(x,z);if(!at)continue;
   const key=at.c+':'+at.r;if(!atlasVertexCells.has(key))atlasVertexCells.set(key,[]);atlasVertexCells.get(key).push(i);
   if(!game.seen(0,at)){const color=parchmentColor(x,z),ink=Math.max(0,game.smooth(x/23+11,z/23+97)-.72);if(ink>.001)color.lerp(new T.Color('#8b7753'),ink*.35);color.multiplyScalar(.90+game.smooth(x/19+20,z/19+30)*.18);col.setXYZ(i,color.r,color.g,color.b);}
  }
  col.needsUpdate=true;atlasFogSerial=delta.serial;return;
 }
 if(atlasFogSerial===delta.serial)return;atlasFogSerial=delta.serial;
 for(const at of delta.changed)for(const i of atlasVertexCells.get(at.key)||[]){
  if(delta.known.has(at.key))col.setXYZ(i,atlasVisibleColors[i*3],atlasVisibleColors[i*3+1],atlasVisibleColors[i*3+2]);
  else {const x=pos.getX(i),z=pos.getZ(i),color=parchmentColor(x,z);color.multiplyScalar(.90+game.smooth(x/19+20,z/19+30)*.18);col.setXYZ(i,color.r,color.g,color.b);}
  col.addUpdateRange?.(i*3,3);
 }
 if(delta.changed.length)col.needsUpdate=true;
}
const fogSketchGroup=new T.Group();worldScene.add(fogSketchGroup);let fogSketchStamp='';const fogTextures=new Map();
const fogCoverGroup=new T.Group();worldScene.add(fogCoverGroup);let fogCoverStamp='';
function sketchTexture(kind){if(fogTextures.has(kind))return fogTextures.get(kind);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,128);ctx.strokeStyle='rgba(76,55,27,.72)';ctx.fillStyle='rgba(76,55,27,.25)';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';if(kind==='sea'){ctx.beginPath();ctx.moveTo(16,78);ctx.bezierCurveTo(36,50,54,52,67,77);ctx.bezierCurveTo(80,101,92,91,110,66);ctx.stroke();for(const y of [92,101]){ctx.beginPath();ctx.moveTo(20,y);ctx.quadraticCurveTo(34,y-6,48,y);ctx.quadraticCurveTo(62,y+6,76,y);ctx.quadraticCurveTo(90,y-6,108,y);ctx.stroke();}}else if(kind==='mountain'){ctx.beginPath();ctx.moveTo(18,96);ctx.lineTo(46,48);ctx.lineTo(72,96);ctx.moveTo(56,96);ctx.lineTo(86,38);ctx.lineTo(111,96);ctx.stroke();ctx.beginPath();ctx.moveTo(41,57);ctx.lineTo(47,50);ctx.lineTo(54,60);ctx.moveTo(81,51);ctx.lineTo(87,42);ctx.lineTo(95,58);ctx.stroke();}else if(kind==='forest'){for(const x of [34,64,94]){ctx.beginPath();ctx.moveTo(x,98);ctx.lineTo(x,82);ctx.stroke();ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x-16,82);ctx.lineTo(x+16,82);ctx.closePath();ctx.stroke();}}else{ctx.beginPath();ctx.arc(64,64,26,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(64+Math.cos(a)*30,64+Math.sin(a)*30);ctx.lineTo(64+Math.cos(a)*46,64+Math.sin(a)*46);ctx.stroke();}}const tx=new T.CanvasTexture(canvas);fogTextures.set(kind,tx);return tx}
function fogCoverTexture(){if(fogTextures.has('cover'))return fogTextures.get('cover');const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#d7c195';ctx.fillRect(0,0,128,128);ctx.strokeStyle='rgba(121,96,57,.22)';ctx.lineWidth=2;for(let i=-20;i<140;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+30,128);ctx.stroke()}ctx.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(14+i*12,(i*17)%128,10,0,Math.PI*2);ctx.fill()}const tx=new T.CanvasTexture(canvas);fogTextures.set('cover',tx);return tx}
let fogCoverMesh=null,fogCoverSerial=-1;
function refreshFogCover(){
 const delta=visionDelta.update();
 if(!fogCoverMesh){
  const positions=[],uvs=[],indices=[];
  for(const [i,cell] of game.cells.entries()){
   const x=cell.x,z=cell.z,y=120,half=25.4,o=i*4;
   positions.push(x-half,y,z-half,x+half,y,z-half,x+half,y,z+half,x-half,y,z+half);uvs.push(0,0,1,0,1,1,0,1);
   indices.push(...(game.seen(0,cell)?[o,o,o,o,o,o]:[o,o+1,o+2,o,o+2,o+3]));
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
  fogCoverMesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map:fogCoverTexture(),side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false}));fogCoverMesh.renderOrder=900;fogCoverGroup.add(fogCoverMesh);fogCoverSerial=delta.serial;return;
 }
 if(fogCoverSerial===delta.serial)return;fogCoverSerial=delta.serial;
 const index=fogCoverMesh.geometry.index;
 for(const at of delta.changed){const i=at.r*COLS+at.c,o=i*4;index.array.set(delta.known.has(at.key)?[o,o,o,o,o,o]:[o,o+1,o+2,o,o+2,o+3],i*6);index.addUpdateRange?.(i*6,6);}
 if(delta.changed.length)index.needsUpdate=true;
}
let fogSketchReady=false,fogSketchSerial=-1;const fogSketchCells=new Map();
function refreshFogSketches(){
 const delta=visionDelta.update(),dummy=new T.Object3D();
 if(!fogSketchReady){
  const symbols={sea:[],mountain:[],forest:[],compass:[]};
  for(const cell of game.cells){if(game.noise(cell.c*13+7,cell.r*17+5)<.925)continue;const kind=!cell.land?'sea':cell.mountain?'mountain':cell.biome==='forest'?'forest':'compass';symbols[kind].push(cell);}
  for(const [kind,cells]of Object.entries(symbols)){
   if(!cells.length)continue;const geometry=new T.PlaneGeometry(42,42);geometry.rotateX(-Math.PI/2);
   const mesh=new T.InstancedMesh(geometry,new T.MeshBasicMaterial({map:sketchTexture(kind),transparent:true,opacity:.8,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false}),cells.length);
   cells.forEach((cell,i)=>{dummy.position.set(cell.x,122,cell.z);dummy.scale.setScalar(game.seen(0,cell)?0:1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);fogSketchCells.set(cell.c+':'+cell.r,{mesh,index:i,cell});});
   mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.renderOrder=901;fogSketchGroup.add(mesh);
  }
  fogSketchReady=true;fogSketchSerial=delta.serial;return;
 }
 if(fogSketchSerial===delta.serial)return;fogSketchSerial=delta.serial;
 for(const at of delta.changed){const entry=fogSketchCells.get(at.key);if(!entry)continue;const{mesh,index,cell}=entry;dummy.position.set(cell.x,122,cell.z);dummy.scale.setScalar(delta.known.has(at.key)?0:1);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.instanceMatrix.addUpdateRange?.(index*16,16);mesh.instanceMatrix.needsUpdate=true;}
}
refreshAtlasFog();refreshFogCover();refreshFogSketches();
const icons=new Map();function icon(text,color='#fff'){const key=text+color;if(!icons.has(key)){const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(20,43,37,.8)';ctx.beginPath();ctx.arc(32,32,28,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,32,34);const tx=new T.CanvasTexture(canvas),material=new T.SpriteMaterial({map:tx,depthTest:false});icons.set(key,material)}const sprite=new T.Sprite(icons.get(key));sprite.scale.set(12,12,1);return sprite}
const resourceSprites=[],forestSpots=[];let manualResourceOverlay=false;try{manualResourceOverlay=localStorage.getItem('kingdoms-resource-layer')==='1'}catch{}let showResourceOverlay=manualResourceOverlay,resourceDetailsOpen=false;const depositIcons={clay:'◈',copper:'◇',tin:'◆',wood:'♣',stone:'◆',ore:'⚒',grain:'♧',water:'≈',game:'🦌',fish:'🐟',oil:'🛢️'},depositNames={clay:'Savi',copper:'Vasemaak',tin:'Tinamaak',wood:'Mets',stone:'Kivi',ore:'Rauamaak',grain:'Viljakas maa',water:'Magevesi',game:'Ulukid',fish:'Kala',oil:'Naftamaardla',...Object.fromEntries(Object.entries(GOODS).map(([k,d])=>[k,d.name]))},depositColors={clay:'#c89b78',copper:'#d7a77d',tin:'#c1ced3',wood:'#a4cc8e',stone:'#d8dac9',ore:'#dfac83',grain:'#eed28b',water:'#8fd6ee',game:'#dcb993',fish:'#9cd8e0',oil:'#463b34'};
for(const cell of game.cells.filter(c=>c.land)){if(cell.biome==='forest')for(let i=0;i<6;i++)forestSpots.push({x:cell.x+(game.noise(cell.c*7+i,cell.r)-.5)*37,z:cell.z+(game.noise(cell.c+i,cell.r*7)-.5)*37,size:.75+game.noise(cell.c+i,cell.r+31)*.6})}
// V46 mixed forest: conifer and rounded broadleaf silhouettes in three batched meshes.
const coniferSpots=forestSpots.filter((_,i)=>i%3!==0),leafSpots=forestSpots.filter((_,i)=>i%3===0);
const trunks=new T.InstancedMesh(new T.CylinderGeometry(.8,1,7,5),mat('#6e5b40'),forestSpots.length),
 crowns=new T.InstancedMesh(new T.ConeGeometry(5,14,7),mat('#416a43'),coniferSpots.length),
 leafyCrowns=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat('#5f854e'),leafSpots.length),forestDummy=new T.Object3D();
forestSpots.forEach((p,i)=>{const h=surface(game,p.x,p.z);forestDummy.scale.set(p.size,p.size,p.size);forestDummy.rotation.y=i*2.4;forestDummy.position.set(p.x,h+3*p.size,p.z);forestDummy.updateMatrix();trunks.setMatrixAt(i,forestDummy.matrix)});
coniferSpots.forEach((p,i)=>{const h=surface(game,p.x,p.z);forestDummy.scale.set(p.size,p.size,p.size);forestDummy.rotation.y=i*2.4;forestDummy.position.set(p.x,h+10*p.size,p.z);forestDummy.updateMatrix();crowns.setMatrixAt(i,forestDummy.matrix);crowns.setColorAt(i,new T.Color(i%3?'#3f6b4b':'#648454'))});
leafSpots.forEach((p,i)=>{const h=surface(game,p.x,p.z);forestDummy.scale.set(6.4*p.size,6.5*p.size,6.5*p.size);forestDummy.rotation.y=i*1.9;forestDummy.position.set(p.x,h+9.4*p.size,p.z);forestDummy.updateMatrix();leafyCrowns.setMatrixAt(i,forestDummy.matrix);leafyCrowns.setColorAt(i,new T.Color(i%3?'#668855':'#52784d'))});
for(const mesh of [trunks,crowns,leafyCrowns]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true}
worldScene.add(spatialInstances(trunks),spatialInstances(crowns),spatialInstances(leafyCrowns));
const destination=new T.Group(),destinationRing=new T.Mesh(new T.RingGeometry(10,12,40),new T.MeshBasicMaterial({color:'#f6d77b',side:T.DoubleSide,depthWrite:false,depthTest:false}));destinationRing.rotation.x=-Math.PI/2;destination.add(destinationRing);const destinationArrow=new T.Mesh(new T.ConeGeometry(3,9,6),mat('#eaca7a'));destinationArrow.rotation.z=Math.PI;destinationArrow.position.y=12;destination.add(destinationArrow);worldScene.add(destination);const atlasDecor=createAtlasDecor(game,worldScene,quality);const worldProps=createWorldAtlasProps(game,worldObjects,quality);
const villageLife=createVillageLife(game,(tile,x,z)=>ground(tile,x,z),{quality:()=>quality});const highlightGeometry=new T.PlaneGeometry(48,48,12,12);highlightGeometry.rotateX(-Math.PI/2);const highlight=new T.Mesh(highlightGeometry,new T.MeshBasicMaterial({color:'#ebcf7b',transparent:true,opacity:.28,depthTest:false,side:T.DoubleSide}));worldScene.add(highlight);
function say(text){s.events??=[];if(s.events.at(-1)?.text!==text){s.events.push({time:s.time,text});if(s.events.length>40)s.events.shift()}$('toast').textContent=text;$('toast').style.display='block';toastTime=5}
function save(){
 if(restarting||sampleDemo)return;
 try{
  const backedUp=writeAutosave(localStorage,snapshotV51(),s.time,s.lastBackupTime||0,validState);
  if(backedUp)s.lastBackupTime=s.time;
  $('savestatus').textContent='Salvestatud · käik '+(Math.floor(s.time/60)+1);
 }catch{say('Salvestusruum on täis või salvestamine on blokeeritud.')}
}
function activeCity(){return activeTile?game.contextAt(activeTile,true):null}
function ownCity(){return activeCity()?.team===0?activeCity():s.cities.find(c=>c.team===0)}
function settlerHere(){return s.settlers.find(a=>a.team===0&&activeTile&&tileKey(a)===tileKey(activeTile)&&a.landed)}
function clearLocal(){villageLife.clear();detailObjectHolders.clear();const label=localModels.get('city-label');if(label){label.model.material.map?.dispose();label.model.material.dispose()}neighbourTerrains=[];battleFeedback.clear();if(ghost)ghost.traverse(o=>o.material?.dispose());if(localTrails){localTrails.dispose?.();localTrails.geometry.dispose();localTrails.material.dispose()}for(const roads of [localTrailLinks,detailWorldRoads])if(roads)disposeNetwork(roads);localTrailLinks=null;detailWorldRoads=null;detailRoadStamp='';localBorders=null;localBorderStamp='';selectedBuilding=null;ghost=null;ghostPoint=null;ghostKey='';lastTrailTime=-1;lastTrailChanges=-1;environment.traverse(mesh=>{if(mesh.userData.battleDecoration)mesh.dispose?.();if(mesh.userData.terrain){mesh.geometry.dispose();mesh.material.dispose()}else if(mesh.parent?.userData?.landscape||mesh.userData?.landscape){if(!mesh.geometry?.userData.sharedLandscape)mesh.geometry?.dispose();if(!mesh.material?.userData.sharedLandscape)mesh.material?.dispose()}});environment.clear();localObjects.clear();people.clear();localModels.clear();resourceModels.clear();workerModels.clear();unitModels.clear();signature='';selectedUnit=null;localTrails=null}
function openWorld(){villageLife.clear();if(s.battle&&!s.battle.result)return say('Lõpeta lahing või tagane.');if(s.battle?.result){const ended=s.battle;applyBattle();if(ended.result==='retreat'){const own=s.armies.find(a=>a.team===0&&(ended.retreatedArmies||[]).some(r=>r.team===0&&(a.id||0)===r.armyId));if(own)chosen=game.cell(own);}s.battle=null;}document.body.classList.remove('hud-city-open','hud-city-overview','hud-map-open','hud-queue-open');view='world';commandMode='select';hoverPoint=null;mode=null;activeTile=null;zoom=950;const at=center(chosen.c,chosen.r);focus.set(at.x,0,at.z);document.body.classList.remove('battle','settling','enemy-city');document.body.classList.add('atlas');$('settlerpanel').hidden=true;$('battlepanel').hidden=true;$('atlaspanel').hidden=false;renderUI()}
function openTile(cell){toggleExploreMenu(false);if(cell&&!game.seen(0,cell)&&!s.battle)return say('See ala on veel avastamata. Liiguta avastaja lähemale.');if(s.battle&&!s.battle.result&&tileKey(s.battle.cell)!==tileKey(cell))return say('Lõpeta lahing või tagane.');const pending=s.settlers.find(a=>a.team===0&&a.c===cell.c&&a.r===cell.r&&!a.path.length&&!game.territoryOwner(cell));if(pending){const error=game.land(pending.id);if(error)return say(error);selectedMover=pending.id}const previousArea=mode&&activeTile?game.territoryOwner(activeTile):null;const nextArea=mode?game.territoryOwner(cell):null;const keepBuildMode=!!mode&&!!previousArea&&!!nextArea&&previousArea.id===nextArea.id&&previousArea.team===nextArea.team;view='local';localScene.fog.near=s.battle?4000:260;localScene.fog.far=s.battle?8000:700;commandMode='select';hoverPoint=null;activeTile=cell;chosen=cell;if(!keepBuildMode)mode=null;zoom=s.battle?Math.min(2400,1100/Math.min(1,camera.aspect)):150;focus.set(s.battle?75:0,0,s.battle?65:0);clearLocal();installDetailObjectHolder(cell,localObjects);localTerrain=terrain(environment,cell);environment.add(createGroundCover(cell,(x,z)=>{if(cell.mountain)return -100;const y=ground(cell,x,z),p=riverNear(game,cell.x+x/3,cell.z+z/2.6);return p.distance<p.width*1.27?-100:y},quality));loadNeighbours(cell);localRivers=createRiverNetwork(game,'detail',s.battle?{...cell,tacticalRadius:230}:cell,quality);localCrossingRevision=s.crossingRevision||0;environment.add(localRivers);environment.add(createMountainOutcrops(game,'detail',cell));if(s.battle){batchBattleDecoration(environment);environment.add(createBattleBoundary((x,z)=>ground(cell,x,z)));}document.body.classList.remove('atlas');$('atlaspanel').hidden=true;$('battlepanel').hidden=true;syncLocal();if(s.battle?.wallWalkEnabled){for(const stair of s.battle.wallStairs){const m=createWallStairs(stair.height);m.position.set(stair.groundX,ground(cell,stair.groundX,stair.groundZ),stair.groundZ);m.rotation.y=Math.atan2(stair.x-stair.groundX,stair.z-stair.groundZ)+Math.PI;localObjects.add(m);}}renderUI()}
// World atlas and local detail maps share the same V75 site catalog, including
// claimed villages/ruins from version-4 saves and the V58 forest/rock/bridge GLBs.
function installDetailObjectHolder(tile,parent){
 const key=tileKey(tile),holder=new T.Group();
 holder.name='World/detail shared sites '+key;
 parent.add(holder);detailObjectHolders.set(key,{tile,holder});
}
function syncDetailWorldObjects(){
 if(view!=='local'||!activeTile||s.battle)return;
 for(const {tile,holder} of detailObjectHolders.values()){
  // Civilians are siblings of the GLB holder so world-prop refreshes cannot detach them.
  villageLife.show(tile,holder.parent,{nearby:tile.c!==activeTile.c||tile.r!==activeTile.r});
  // Check only nearby visible sites. A distant explorer changing fog no longer
  // rebuilds all local 3D models every time its world vision advances.
  const visible=worldProps.siteCatalog.at(tile).filter(site=>game.seen(0,site.cell));
  const stamp=(worldProps.ready?'glb':'fallback')+':'+visible.map(site=>site.id+'='+String(site.landmark?.claimedBy??'')).join('|');
  if(stamp===holder.userData.siteStamp)continue;
  holder.userData.siteStamp=stamp;
  holder.clear();
  holder.add(buildDetailWorldObjects(game,worldProps,tile,(x,z)=>ground(tile,x,z)));
 }
}

function loadNeighbours(cell){for(let dr=s.battle?-3:-1;dr<=(s.battle?4:1);dr++)for(let dc=s.battle?-3:-1;dc<=(s.battle?4:1);dc++){if(!dc&&!dr)continue;const c=cell.c+dc,r=cell.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;const tile=game.cell({c,r}),g=new T.Group();g.position.set(dc*150,0,dr*130);environment.add(g);installDetailObjectHolder(tile,g);// The active tile and its eight neighbours now share ONE terrain mesh.
  g.add(createGroundCover(tile,(x,z)=>{if(tile.mountain)return -100;const y=ground(tile,x,z),p=riverNear(game,tile.x+x/3,tile.z+z/2.6);return p.distance<p.width*1.27?-100:y},quality));const world=game.localWorld(tile),vegetationCrossing=tile.river&&(tile.bridge||tile.ford)?crossingFrame(game,tile):null;for(const res of world.resources){if(res.removed||res.amount<=0||(res.depositSite&&game.contextAt(tile,false)?.economy.buildings.some(b=>b.depositId===res.id&&b.hp>0)))continue;if(['tree','berry','game'].includes(res.kind)){const water=riverNear(game,tile.x+res.x/3,tile.z+res.z/2.6);if(tile.mountain||water.distance<water.width*1.55||insideCrossing(vegetationCrossing,tile.x+res.x/3,tile.z+res.z/2.6))continue;}const v=new T.Group();if(res.kind==='tree')addTree(v,0,0,0,res.id,.9);else if(['game','fish','berry'].includes(res.kind))v.add(createWildlife(res.kind));else if(res.depositSite)v.add(createDepositPile(res.kind));else box(v,0,.6,0,1.5,1.2,1.5,res.kind==='ore'?'#9e7356':'#a4a68e');v.position.set(res.x,res.kind==='fish'?.18:ground(tile,res.x,res.z),res.z);g.add(v)}const ctx=game.contextAt(tile,false);if(ctx)for(const b of ctx.economy.buildings.filter(b=>!b.virtual)){const m=b.type==='bridge'?createBridgeBuilding(game,tile,(x,z)=>ground(tile,x,z)):townBuildingModel(b.type,b.team,visualBuildingAge(b));m.position.set(b.x,b.baseY??ground(tile,b.x,b.z),b.z);m.rotation.y=b.shoreAngle||0;m.scale.y=b.ready?1:.25;g.add(m)}}}
function followDetail(){if(view!=='local'||s.battle||!activeTile)return;const dc=focus.x>75?1:focus.x< -75?-1:0,dr=focus.z>65?1:focus.z< -65?-1:0;if(!dc&&!dr)return;const c=activeTile.c+dc,r=activeTile.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS){focus.x=Math.max(-74,Math.min(74,focus.x));focus.z=Math.max(-64,Math.min(64,focus.z));return}const x=focus.x-dc*150,z=focus.z-dr*130,currentZoom=zoom;openTile(game.cell({c,r}));focus.set(x,0,z);zoom=currentZoom;}
function insideCrossing(frame,x,z){if(!frame)return false;const dx=x-frame.x,dz=z-frame.z;return Math.abs(dx*frame.normal.x+dz*frame.normal.z)<frame.halfSpan*1.5&&Math.abs(-dx*frame.normal.z+dz*frame.normal.x)<4.5;}
function resourceView(r){const g=new T.Group();if(['game','fish','berry'].includes(r.kind))g.add(createWildlife(r.kind));else if(r.kind==='tree')addTree(g,0,0,0,r.id,.9);else if(r.depositSite)g.add(createDepositPile(r.kind));else for(let i=0;i<3;i++){const rock=new T.Mesh(new T.DodecahedronGeometry(.8+i*.2,0),mat(r.kind==='ore'?'#9e7356':'#a4a68e'));rock.position.set((i-1)*.65,.6,i%2*.5);rock.castShadow=true;g.add(rock)}g.position.set(r.x,r.kind==='fish'?.18:ground(activeTile,r.x,r.z),r.z);environment.add(g);return g}
let soldierBatch;
function troopView(u){const group=new T.Group(),count=u.men?.length||u.menCount||soldierCount(u),cols=count>=24?6:4;group.userData.squadFormation=true;for(let i=0;i<count;i++)createSoldier(group,(i%cols-(cols-1)/2)*.7,Math.floor(i/cols)*.8,ARMY_COLORS[u.team%ARMY_COLORS.length],u.kind,u.grade);people.add(group);return group}
function workerProfession(w,age){if(w.kind==='market_woman')return 'market_woman';const prefix=age===1?'bronze_':age>=3?'master_':'';if(w.kind==='builder')return ['stone_builder','bronze_builder','iron_builder','medieval_builder','renaissance_builder','industrial_builder','modern_builder'][Math.max(0,Math.min(6,age))];if(['shipwright','trainer'].includes(w.kind))return prefix+w.kind;if(w.kind==='fisher')return prefix+'stone_fisher';if(w.kind==='berries')return 'gatherer';if(w.kind==='well')return 'watercarrier';if(w.kind==='farm')return prefix+'farmer';if(['saw','mill','bakery','coal','smelter','smith','study','scriptorium','academy','university','observatory','polytechnic','laboratory','printer','nitrate','powdermill','steelworks','engineworks','railstation','oilwell','refinery','powerplant','autofactory','airfield'].includes(w.kind))return 'artisan';if(w.kind==='hunter')return age?'archer':'spearman';if(w.kind==='forester')return age?prefix+'forester':'stone_forester';return age?prefix+(w.kind==='lumber'?'lumberjack':'miner'):(w.kind==='lumber'?'stone_lumber':'stone_miner')}
function workerIsVisible(ctx,w,id){if(w.kind==='market_woman')return w.visible!==false;if(w.kind==='builder')return w.visible!==false;if(String(id).startsWith('trainer:'))return (game.parentCity(ctx).training?.[0]?.assigned||0)>0;if(String(id).startsWith('basic:'))return (game.parentCity(ctx).basicAssigned?.[String(id).slice(6)]||0)>0;const b=ctx.economy.buildings[w.building];return !!b&&b.ready&&!b.disabled&&(b.assigned||0)>0}
function syncLocal(){if(view!=='local'||!activeTile)return;game.refreshTerritory();const borderStamp=game.territoryStamp+':'+(s.visionRevision||0);if(localBorderStamp!==borderStamp){if(localBorders){environment.remove(localBorders);disposeNetwork(localBorders)}localBorders=createDetailBorders(game,activeTile);environment.add(localBorders);localBorderStamp=borderStamp;}if(localCrossingRevision!==(s.crossingRevision||0)){localCrossingRevision=s.crossingRevision||0;if(localRivers){environment.remove(localRivers);disposeNetwork(localRivers)}localRivers=createRiverNetwork(game,'detail',s.battle?{...activeTile,tacticalRadius:230}:activeTile,quality);environment.add(localRivers);for(const {holder} of detailObjectHolders.values())holder.userData.siteStamp=null;}syncDetailWorldObjects();const city=activeCity(),age=city?game.upgrade(city.team):0,world=game.localWorld(activeTile),nav=detailNav(),vegetationCrossing=activeTile.river&&(activeTile.bridge||activeTile.ford)?crossingFrame(game,activeTile):null;const roadStamp=tileKey(activeTile)+':'+(s.roadRevision||0)+':'+(s.visionRevision||0);if(detailRoadStamp!==roadStamp){if(detailWorldRoads){environment.remove(detailWorldRoads);disposeNetwork(detailWorldRoads)}detailWorldRoads=createUnifiedRoadNetwork(game,'detail',s.battle?{...activeTile,tacticalRadius:230}:activeTile);environment.add(detailWorldRoads);detailRoadStamp=roadStamp}for(const r of world.resources){let v=resourceModels.get(r.id);if(!v){v=resourceView(r);resourceModels.set(r.id,v)}v.position.set(r.x,r.kind==='fish'?.18:ground(activeTile,r.x,r.z),r.z);v.visible=!r.removed&&r.amount>0&&!(r.depositSite&&city?.economy.buildings.some(b=>b.depositId===r.id&&b.hp>0));if(['tree','berry','game'].includes(r.kind)){const water=riverNear(game,activeTile.x+r.x/3,activeTile.z+r.z/2.6);v.visible&&=!activeTile.mountain&&water.distance>=water.width*1.55&&!insideCrossing(vegetationCrossing,activeTile.x+r.x/3,activeTile.z+r.z/2.6);}if(r.kind==='game')v.rotation.y=Math.sin(s.time*.18+r.id)*.4;if(r.kind==='fish')v.position.y+=Math.sin(s.time*2+r.id)*.04;if(r.plantedAt!=null)v.scale.setScalar(.25+.75*Math.min(1,(s.time-r.plantedAt)/20))}
 if(city){const parent=game.parentCity(city),title=parent.name+' · '+parent.economy.realms[parent.team].pop+' elanikku';let label=localModels.get('city-label');if(label?.title!==title){if(label){people.remove(label.model);label.model.material.map?.dispose();label.model.material.dispose()}const model=cityBanner(title,parent.team),hall=city.economy.buildings.find(b=>b.type==='hall');model.scale.set(32,6.7,1);model.position.set(hall.x,ground(activeTile,hall.x,hall.z)+16,hall.z);people.add(model);localModels.set('city-label',{model,title})}}if(city?.districtOf!=null&&!localModels.has('region-hub')){const hub=new T.Group();box(hub,0,1.7,0,.1,3.4,.1,'#826b47');box(hub,.5,2.8,0,1,.65,.07,city.team?'#b5725c':'#94b7a0');hub.position.y=ground(activeTile,0,0);localObjects.add(hub);localModels.set('region-hub',{model:hub,age})}if(city){for(const b of city.economy.buildings.filter(b=>!b.virtual)){const buildingAge=visualBuildingAge(b),section=s.battle?.siegeSections?.find(w=>w.index===city.economy.buildings.indexOf(b)),stage=(b.bronzeWall||['palisade','stonewall','reinforced_wall','gatehouse'].includes(b.type))?damageStage(section?.hp??b.hp,section?.maxHp??b.damageMaxHp??b.hp):0;let entry=localModels.get(b);if(!entry||entry.age!==buildingAge||entry.stage!==stage){if(entry)localObjects.remove(entry.model);const model=b.type==='bridge'?createBridgeBuilding(game,activeTile,(x,z)=>ground(activeTile,x,z)):townBuildingModel(b.type,b.team,buildingAge,stage);
 model.userData.buildingRef=b;model.userData.buildingAge=buildingAge;
 if(TOWER_TYPES.has(b.type)){const guard=new T.Group();createSoldier(guard,0,0,b.team?'#b98961':'#a4ab8d','archer');guard.scale.setScalar(.85);guard.position.set(0,b.bronzeWall?6.4:b.type==='stonetower'?7.55:7.25,0);guard.userData.isTowerGuard=true;model.add(guard);model.userData.towerGuard=guard;const ballista=createBallista();ballista.position.y=guard.position.y;model.add(ballista);model.userData.roofBallista=ballista;}
 model.position.set(b.x,b.baseY??ground(activeTile,b.x,b.z),b.z);localObjects.add(model);entry={model,age:buildingAge,stage};localModels.set(b,entry)}entry.model.scale.y=b.ready?1:.15+.85*Math.min(1,(b.progress||0)/game.constructionTime(b.type));entry.model.rotation.y=b.shoreAngle??((WALL_TYPES.has(b.type)||b.type==='gatehouse')&&b.wallAxis?Math.PI/2:0);animateBuilding(entry.model,s.time,b.status==='Toodab',b.ready);if(entry.model.userData.towerGuard){const figure=entry.model.userData.towerGuard;figure.visible=false;figure.position.set(0,(b.bronzeWall?6.4:b.type==='stonetower'?7.55:7.25)-2.4,1.8);animateSoldier(figure.children[0],s.battle?.elapsed??s.time,false);const post=s.battle?.defensePosts?.find(p=>p.buildingIndex===city.economy.buildings.indexOf(b)),ballista=entry.model.userData.roofBallista;if(ballista){ballista.visible=stage<3&&ballistaUnlocked(s,b.team);ballista.rotation.y=post?.ballista?.heading||0;ballista.userData.active=towerManned(b);}}}for(const[id,w]of Object.entries(world.workers||{})){const profession=workerProfession(w,age),role=profession+':'+age+':'+w.team;let model=workerModels.get(id);if(model&&model.userData.role!==role){people.remove(model);workerModels.delete(id);model=null}if(!model){model=new T.Group();model.userData.role=role;createSoldier(model,0,0,w.team?'#a97f65':'#b4a77b',profession);const pack=box(model,0,.95,.4,.45,.4,.35,'#9d8056');pack.visible=false;model.userData.pack=pack;const fish=createWildlife('fish');fish.scale.setScalar(.6);fish.position.set(0,1,.4);fish.visible=false;model.add(fish);model.userData.catch=fish;people.add(model);workerModels.set(id,model)}model.visible=workerIsVisible(city,w,id);model.position.set(w.x,ground(activeTile,w.x,w.z),w.z);model.rotation.y=w.heading||0;const carrying=(w.carried||0)>0;model.userData.pack.visible=carrying&&w.kind!=='fisher';model.userData.catch.visible=carrying&&w.kind==='fisher';animateSoldier(model.children[0],s.time,!!w.moving,{phase:-1,action:carrying?'carry':w.working?(w.action||'work'):null})}for(const[id,model]of workerModels)if(!String(id).startsWith('cargo:')&&!world.workers?.[id])model.visible=false;

 const cargoIds=new Set();city.economy.cargo.forEach((c,i)=>{const id='cargo:'+i;cargoIds.add(id);let model=workerModels.get(id);if(!model){model=new T.Group();createSoldier(model,0,0,c.team?'#ad785e':'#b9a777',age===0?'stone_worker':'worker');box(model,0,1,-.3,.45,.45,.4,'#92754c');people.add(model);workerModels.set(id,model)}model.visible=true;model.position.set(c.x,ground(activeTile,c.x,c.z),c.z);model.rotation.y=c.heading||0;animateSoldier(model.children[0],s.time,!!c.moving,{phase:-1,action:'carry'})});for(const[id,m]of workerModels)if(String(id).startsWith('cargo:')&&!cargoIds.has(id))m.visible=false}
 for(const a of s.settlers.filter(a=>a.landed&&tileKey(a)===tileKey(activeTile))){const key='settler:'+a.id;let model=unitModels.get(key);if(!model){model=new T.Group();createSoldier(model,0,0,a.team?'#b98362':'#c0ac79','settler');box(model,0,1,-.4,.65,.8,.4,'#7a6145');people.add(model);unitModels.set(key,model)}model.visible=true;model.position.set(a.x,ground(activeTile,a.x,a.z),a.z);model.rotation.y=a.heading||0;animateSoldier(model.children[0],s.time,!!a.localTarget)}
 for(const[key,model]of unitModels)if(key.startsWith('settler:'))model.visible=s.settlers.some(a=>'settler:'+a.id===key&&a.landed&&tileKey(a)===tileKey(activeTile));for(const a of s.ships.filter(a=>a.hp>0&&tileKey(a)===tileKey(activeTile))){const key='ship:'+a.id;let model=unitModels.get(key);if(!model){model=createShipModel(a);model.scale.setScalar(.2);people.add(model);unitModels.set(key,model)}model.position.set((a.id%3-1)*9,.7,Math.floor(a.id%6/3)*12)}for(const[key,m]of unitModels)if(key.startsWith('ship:'))m.visible=s.ships.some(a=>a.hp>0&&'ship:'+a.id===key&&tileKey(a)===tileKey(activeTile));const battle=s.battle&&tileKey(s.battle.cell)===tileKey(activeTile)?s.battle:null;const squads=battle?battle.squads:[...inspection(),...peaceTowerGuards()];for(const u of squads)if(!u.retreated&&!u.guardPost&&!nav.open(u.x,u.z)){const safe=nav.nearest(u,80);if(safe){u.x=safe.x;u.z=safe.z}}const live=new Set(squads.map(u=>'unit:'+u.source));for(const[key,model]of unitModels)if(key.startsWith('unit:'))model.visible=live.has(key);const formations=formationMen(squads.filter(u=>!u.men&&!u.reserve),frameDelta,nav);for(const u of squads)if(u.men)formations.set(u,u.men);for(const u of squads){const key='unit:'+u.source;if(u.reserve){const hidden=unitModels.get(key);if(hidden)hidden.visible=false;continue;}let model=unitModels.get(key);if(!model){model=troopView(u);model.userData.towerGuard=!!u.towerGuard;unitModels.set(key,model)}model.visible=(u.hp>0||['bronze_catapult','catapult'].includes(u.kind))&&!u.retreated&&!u.reserve;if(!model.visible)continue;model.position.set(u.x,ground(activeTile,u.x,u.z)+(u.guardPost?wallHeight(u.wallType||'palisade'):0),u.z);model.rotation.y=u.heading||0;const c=Math.cos(model.rotation.y),sn=Math.sin(model.rotation.y),men=formations.get(u);for(let i=0;i<model.children.length;i++){const man=model.children[i],walker=men[i];man.visible=!!walker&&(walker.hp!==0||['bronze_catapult','catapult'].includes(u.kind))&&!walker.escaped;if(!man.visible)continue;man.rotation.y=walker.heading!=null?walker.heading-model.rotation.y:0;const dx=walker.x-u.x,dz=walker.z-u.z;man.position.set(c*dx-sn*dz,ground(activeTile,walker.x,walker.z)+fighterElevation(u,walker)-model.position.y,sn*dx+c*dz);animateSoldier(man,battle?battle.elapsed:s.time,walker.moving??(!!u.moving||!!u.target),{phase:(walker.attackTime??u.attackTime)!=null&&battle?(battle.elapsed-(walker.attackTime??u.attackTime))/.7:-1,hit:battle&&(walker.hitTime??u.hitTime)!=null&&battle.elapsed-(walker.hitTime??u.hitTime)<.18,formation:u.formation,formed:u.formationStrength||0,weapon:walker.weapon,dismounted:walker.dismounted});if(['bronze_catapult','catapult'].includes(u.kind))updateCatapultDamage(man,walker.hp,walker.maxHp)}model.scale.setScalar(1)}

 if(battle){const works=new Set();for(const w of battle.siegeWorks||[]){const key='siege:'+w.id;works.add(key);let model=unitModels.get(key);if(!model){model=createSiegeWorkModel(w.kind,w.height,w.team);people.add(model);unitModels.set(key,model);}model.visible=!w.destroyed;const offset=w.kind==='camp'?0:w.kind==='ladder'?5:4,wx=w.x-w.inwardX*offset,wz=w.z-w.inwardZ*offset;model.position.set(wx,ground(activeTile,wx,wz),wz);model.scale.set(1,(w.kind==='tower'?(w.height||3.8)/3.8:1)*(.23+.77*Math.min(1,w.progress/w.duration)),1);model.rotation.y=Math.atan2(w.inwardX,w.inwardZ);}}
 if(battle){for(const shot of battle.ballistaShots||[]){const key='ballista:'+shot.id;let bolt=unitModels.get(key);if(!bolt){bolt=createBallistaBolt();people.add(bolt);unitModels.set(key,bolt);}const t=Math.max(0,Math.min(1,(battle.elapsed-shot.startedAt)/(shot.landsAt-shot.startedAt)));bolt.visible=!shot.resolved;const x=shot.x+(shot.toX-shot.x)*t,z=shot.z+(shot.toZ-shot.z)*t;bolt.position.set(x,ground(activeTile,x,z)+shot.fromY+(shot.toY-shot.fromY)*t,z);bolt.rotation.set(0,Math.atan2(shot.toX-shot.x,shot.toZ-shot.z),0);}}
 for(const [key,model]of unitModels)if(key.startsWith('ballista:')&&(!battle||!(battle.ballistaShots||[]).some(s=>key==='ballista:'+s.id))){people.remove(model);unitModels.delete(key);}
 for(const [key,model] of unitModels)if(key.startsWith('siege:'))model.visible=!!battle&&(battle.siegeWorks||[]).some(w=>key==='siege:'+w.id&&!w.destroyed);
 soldierBatch??=new SoldierBatch(people);soldierBatch.update([...unitModels].filter(([key])=>key.startsWith('unit:')).map(([,model])=>model));
 const feedbackSquads=battle?.individualVersion===1?squads.filter(u=>!u.reserve).flatMap(u=>(u.men||[]).filter(m=>!m.escaped).map(m=>({...m,source:m.id,team:u.team,kind:u.kind,retreated:u.retreated,projectile:m.projectile}))):squads;const selectedFeedback=feedbackSquads.find(m=>m.source===selectedSoldierId),selectedSquadFeedback=battle&&!selectedFeedback&&selectedUnit&&!selectedUnit.retreated&&!selectedUnit.reserve?{...selectedUnit,source:'selected-squad:'+selectedUnit.source,shot:null,projectile:null,attackTime:null}:null;const visibleFeedback=selectedSquadFeedback?[...feedbackSquads,selectedSquadFeedback]:feedbackSquads;battleFeedback.update(visibleFeedback,selectedFeedback||selectedSquadFeedback||selectedUnit,battle,TROOPS);if(battle)return;if(!localTrails){localTrails=new T.InstancedMesh(new T.CircleGeometry(.65,7),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.90,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3}),4096);localTrails.count=0;localTrails.rotation.x=0;environment.add(localTrails)}if(lastTrailTime>=0&&lastTrailNavVersion===nav.version&&s.time-lastTrailTime<(lastTrailChanges===world.trailChanges?10:2))return;lastTrailTime=s.time;lastTrailChanges=world.trailChanges;lastTrailNavVersion=nav.version;const dummy=new T.Object3D(),roadColors=['#000000','#b3a07e','#c1a781','#a49b8a','#8b9693'];let count=0;
 const spots=Object.keys(world.heat||{}).map(key=>({key:Number(key),heat:nav.roadStrength(Number(key))})).filter(e=>nav.roadLevel(e.key)>0&&nav.open(nav.point(e.key).x,nav.point(e.key).z)).sort((a,b)=>b.heat-a.heat).slice(0,4096);
 for(const{key,heat}of spots){const {x,z}=nav.point(key),level=nav.roadLevel(key);dummy.position.set(x,ground(activeTile,x,z)+.24,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar([.4,.82,1.06,1.26,1.5][level]);dummy.updateMatrix();localTrails.setMatrixAt(count,dummy.matrix);localTrails.setColorAt(count,new T.Color(roadColors[level]));count++}
 localTrails.count=count;localTrails.instanceMatrix.needsUpdate=true;if(localTrails.instanceColor)localTrails.instanceColor.needsUpdate=true;localTrails.computeBoundingSphere();if(localTrailLinks){environment.remove(localTrailLinks);localTrailLinks.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}localTrailLinks=createDetailTrailLinks(spots,nav,(x,z)=>ground(activeTile,x,z));environment.add(localTrailLinks);
}
const peacefulGarrisons=new WeakMap();
function peaceTowerGuards(){const city=activeCity();if(!city)return [];let b=peacefulGarrisons.get(city);const stamp=city.team+':'+s.ages[city.team]+':'+city.economy.buildings.map(x=>[x.type,x.ready,x.disabled,x.hp>0].join(',')).join(';');if(!b||b.stamp!==stamp){b={stamp,squads:[],wallWalkEnabled:true,elapsed:s.time,fortress:{team:city.team},siegeSections:city.economy.buildings.flatMap((x,i)=>x.ready&&x.hp>0&&!x.disabled&&['palisade','stonewall','reinforced_wall','gatehouse'].includes(x.type)?[siegeSection(x,i)]:[])};addTowerGuards(city,s,b);peacefulGarrisons.set(city,b);}b.elapsed=s.time;tickTowerGuards(b,frameDelta);persistTowerGuards(city,b);return b.squads;}
function inspection(){if(!activeTile)return [];const groups=s.armies.filter(a=>a.embarked==null&&tileKey(a)===tileKey(activeTile));return s.units.map((u,i)=>({u,i})).filter(({u})=>u.hp>0&&(u.garrison?(u.garrison.c===activeTile.c&&u.garrison.r===activeTile.r):groups.some(a=>a.team===u.team&&(a.id||0)===(u.armyId||0)))).map(({u,i},j)=>{const d=deploymentFor(s,activeTile,i,u,j),g=u.garrison;return {...d,...(g?{x:g.x+(g.wallAxis?0:((g.slot??0)-.5)*1.6),z:g.z+(g.wallAxis?((g.slot??0)-.5)*1.6:0),guardPost:true,wallType:g.wallType||'palisade',heading:g.wallAxis?Math.PI/2:0}:{}),source:i,team:u.team,armyId:u.armyId||0,grade:u.grade||'standard',experienceMultiplier:u.experienceMultiplier||1,kind:u.kind,menCount:u.menCount,soldiers:u.soldiers,hp:u.hp,maxHp:u.maxHp||TROOPS[u.kind]?.hp||u.hp}})}
let resourceArea='';
const MAX_ATLAS_RESOURCE_ICONS=160,MAX_ATLAS_FISH_ICONS=46;
function refreshResourceArea(){
 const area=cellAt(focus.x,focus.z)||chosen, key=area.c+':'+area.r+':'+(s.visionRevision||0)+':'+s.research[0].known.includes('oil_drilling');
 if(key===resourceArea)return;
 resourceArea=key;
 // Old versions leaked a sprite material and CanvasTexture at every camera pan.
 // Shared icon materials and CanvasTextures are cached in icons; disposing here
  // corrupts every later icon after moving the map. Remove instances only.
  for(const {sprite} of resourceSprites)worldScene.remove(sprite);
 resourceSprites.length=0;
  if(!showResourceOverlay)return;
 let fishIcons=0;
 const tiles=[];
 for(let dr=-6;dr<=6;dr++)for(let dc=-6;dc<=6;dc++){
  const c=area.c+dc,r=area.r+dr;
  if(c<0||c>=COLS||r<0||r>=ROWS)continue;
  const cell=game.cell({c,r});
  if(game.seen(0,cell))tiles.push({cell,dist:Math.abs(dc)+Math.abs(dr)});
 }
 tiles.sort((a,b)=>a.dist-b.dist);
 for(const {cell} of tiles){
  if(resourceSprites.length>=MAX_ATLAS_RESOURCE_ICONS)break;
  // Land deposits never include fish. Offshore fishing banks appear in water.
  const deps=Object.keys(cell.deposits).filter(kind=>cell.deposits[kind]&&(kind!=='oil'||s.research[0].known.includes('oil_drilling')));
  for(const [i,kind]of deps.entries()){
   if(resourceSprites.length>=MAX_ATLAS_RESOURCE_ICONS)break;
   if(kind==='fish'&&(fishIcons>=MAX_ATLAS_FISH_ICONS||game.noise(cell.c*3+917,cell.r*7+204)<.37))continue;
   const sprite=icon(depositIcons[kind]||'♧',depositColors[kind]||'#d9bc84');
   sprite.position.set(cell.x+(i-(deps.length-1)/2)*9,kind==='fish'?2:Math.max(1,surface(game,cell.x,cell.z))+4,cell.z+10);
   if(kind==='fish'){sprite.scale.multiplyScalar(.8);fishIcons++}
   worldScene.add(sprite);resourceSprites.push({sprite,cell,kind});
  }
 }
}
function worldSync(){worldProps.update();refreshResourceArea();if(worldSync.lastVision!==s.visionRevision){worldSync.lastVision=s.visionRevision;refreshAtlasFog();refreshFogCover();refreshFogSketches();} const mover=selectedShip!==null?s.ships.find(a=>a.id===selectedShip):selectedTrade!==null?s.shipments.find(a=>a.id===selectedTrade):armySelected?activeArmy():s.settlers.find(a=>a.id===selectedMover),goal=mover?.path?.at(-1);destination.visible=!!goal;if(goal){const p=center(goal.c,goal.r);destination.position.set(p.x,Math.max(.8,surface(game,p.x,p.z))+1,p.z);destinationArrow.position.y=12+Math.sin(s.time*3)*2}atlasDecor.territory(s);atlasDecor.roads(s);atlasDecor.route(s,mover);for(const r of resourceSprites)r.sprite.visible=showResourceOverlay&&game.seen(0,r.cell);const live=new Set();for(const city of s.cities){if(city.team!==0&&!game.visibleNow(0,city))continue;const key='city:'+city.id;live.add(key);let model=worldMarkers.get(key);if(!model){model=new T.Group();const village=createCityMiniature(city.team,game.upgrade(city.team));village.scale.setScalar(1+Math.min(1.2,city.economy.realms[city.team].pop/40));model.add(village);model.userData.village=village;model.userData.team=city.team;const banner=cityBanner(city.name+' · '+city.economy.realms[city.team].pop+' el.',city.team);banner.position.y=42;model.userData.banner=banner;model.add(banner);model.add(icon('⌂',city.team?'#ed9e83':'#e7d49c'));model.children[2].scale.set(17,17,1);model.children[2].position.y=28;worldObjects.add(model);worldMarkers.set(key,model)}if(model.userData.village.userData.age!==game.upgrade(city.team)||model.userData.team!==city.team){if(model.userData.team!==city.team){model.remove(model.userData.banner);model.userData.banner=cityBanner(city.name+' · '+city.economy.realms[city.team].pop+' el.',city.team);model.userData.banner.position.y=42;model.add(model.userData.banner)}model.remove(model.userData.village);model.userData.village=createCityMiniature(city.team,game.upgrade(city.team));model.userData.village.scale.setScalar(1+Math.min(1.2,city.economy.realms[city.team].pop/40));model.userData.team=city.team;model.add(model.userData.village)}const label=city.name+':'+city.team+':'+city.economy.realms[city.team].pop;if(model.userData.label!==label){const old=model.userData.banner;model.remove(old);old.material.map?.dispose();old.material.dispose();model.userData.banner=cityBanner(city.name+' · '+city.economy.realms[city.team].pop+' el.',city.team);model.userData.banner.position.y=42;model.add(model.userData.banner);model.userData.label=label}const p=center(city.c,city.r);model.position.set(p.x,surface(game,p.x,p.z),p.z)}for(const parent of s.cities){if(parent.team!==0&&!game.visibleNow(0,parent))continue;for(const region of Object.values(parent.districts||{})){const real=region.economy.buildings.filter(b=>!b.virtual);if(!real.length)continue;const key='region:'+parent.id+':'+tileKey(region);live.add(key);let model=worldMarkers.get(key);if(model&&model.userData.upgrade!==game.buildingAge(parent.team,real[0].type)){worldObjects.remove(model);worldMarkers.delete(key);model=null}if(!model){model=townBuildingModel(real[0].type,parent.team,game.buildingAge(parent.team,real[0].type));model.userData.upgrade=game.buildingAge(parent.team,real[0].type);model.scale.setScalar(2.5);worldObjects.add(model);worldMarkers.set(key,model)}const p=center(region.c,region.r);model.position.set(p.x,surface(game,p.x,p.z),p.z)}}for(const a of s.settlers.filter(a=>a.embarked==null)){if(a.team!==0&&!game.visibleNow(0,a))continue;const key='settler:'+a.id;live.add(key);let m=worldMarkers.get(key);if(!m){m=createWorldUnit('settler',a.team);worldObjects.add(m);worldMarkers.set(key,m)}updateWorldUnit(m,a,s.time,(x,z)=>surface(game,x,z),a.team===0&&a.id===selectedMover)}for(const cargo of s.shipments){if(cargo.team!==0&&!game.visibleNow(0,cargo))continue;const key='trade:'+cargo.id;live.add(key);let m=worldMarkers.get(key);if(!m||m.userData.type!==(cargo.mode==='sea'?'merchantsea':cargo.mode==='air'?'plane':cargo.mode==='rail'?'train':'caravan')){if(m)worldObjects.remove(m);m=cargo.mode==='sea'?createShipModel({kind:'transport',team:cargo.team,upgrade:game.upgrade(cargo.team)}):createWorldUnit(cargo.mode==='air'?'plane':cargo.mode==='rail'?'train':'caravan',cargo.team);if(cargo.mode==='sea')m.userData.type='merchantsea';worldObjects.add(m);worldMarkers.set(key,m)}updateWorldUnit(m,cargo,s.time,(x,z)=>cargo.mode==='sea'?.7:surface(game,x,z),cargo.id===selectedTrade)}for(const a of s.armies){if(a.embarked!=null)continue;if(!armyUnits(s,a).length)continue;if(a.team!==0&&!game.visibleNow(0,a))continue;const key='army:'+a.team+':'+(a.id||0);live.add(key);let m=worldMarkers.get(key);const scouting=armyUnits(s,a).every(u=>u.kind==='scout');const motorized=armyUnits(s,a).some(u=>u.kind==='motorized');if(m&&(m.userData.scouting!==scouting||m.userData.motorized!==motorized)){worldObjects.remove(m);worldMarkers.delete(key);m=null}if(!m){m=createWorldUnit(motorized?'motorizedArmy':scouting?'scout':'army',a.team);m.userData.scouting=scouting;m.userData.motorized=motorized;worldObjects.add(m);worldMarkers.set(key,m)}updateWorldUnit(m,a,s.time,(x,z)=>surface(game,x,z),a.team===0&&armySelected&&a===activeArmy())}for(const a of s.ships.filter(a=>a.hp>0)){if(a.team!==0&&!game.visibleNow(0,a))continue;const key='ship:'+a.id;live.add(key);let model=worldMarkers.get(key);if(model&&model.userData.upgrade!==game.upgrade(a.team)){worldObjects.remove(model);worldMarkers.delete(key);model=null}if(!model){model=createShipModel({...a,upgrade:game.upgrade(a.team)});model.userData.upgrade=game.upgrade(a.team);worldObjects.add(model);worldMarkers.set(key,model)}updateWorldUnit(model,a,s.time,()=>.7,a.id===selectedShip);model.userData.body.position.y=Math.sin(s.time*1.6+a.id)*.45;}for(const landmark of s.landmarks||[]){if(!game.seen(0,landmark))continue;
 const key='landmark:'+landmark.id;live.add(key);let marker=worldMarkers.get(key);
 if(!marker){marker=new T.Group();const badge=icon(landmark.kind==='village'?'⌂':'✦',landmark.kind==='village'?'#f6cf87':'#c5adf5');badge.scale.set(22,22,1);badge.position.y=16;marker.add(badge);const plinth=new T.Mesh(new T.CylinderGeometry(landmark.kind==='village'?7:5,8,4,6),mat(landmark.kind==='village'?'#a38d60':'#938ca2'));plinth.position.y=3;marker.add(plinth);worldObjects.add(marker);worldMarkers.set(key,marker)}
 if(worldProps.ready&&!marker.userData.worldPropAdded){const source=worldProps.landmark(landmark.kind);if(source){marker.add(source);marker.userData.worldPropAdded=true;if(marker.children[1])marker.children[1].visible=false;}}
 const cell=game.cell(landmark);marker.position.set(cell.x,surface(game,cell.x,cell.z)+1,cell.z);
 marker.scale.setScalar(landmark.claimedBy==null?1:.76);
 }
 // Bronze Age and later fishing crews travel to offshore schools by boat.
 // These are workers from real fishing huts, not free military vessels.
 for(const parent of s.cities)for(const region of game.contexts(parent)){
  if(parent.team!==0&&!game.visibleNow(0,region))continue;
  for(const [id,w] of Object.entries(region.world.workers||{})){
   if(!id.startsWith('fishery:')||!w.catchTile||!w.portTile||w.phase==='seek'||s.ages[parent.team]<1)continue;
   const key='fishing-boat:'+parent.id+':'+region.c+':'+region.r+':'+id;
   live.add(key);
   let boat=worldMarkers.get(key);
   if(!boat){
    boat=new T.Group();boat.name='Fishing boat '+key;
    const wood=mat('#806143'),trim=mat('#d7c59a');
    const hull=new T.Mesh(new T.BoxGeometry(11,2.3,19),wood);hull.position.y=1.9;boat.add(hull);
    const seat=new T.Mesh(new T.BoxGeometry(8,1,3),trim);seat.position.set(0,3.2,-1);boat.add(seat);
    const mast=new T.Mesh(new T.CylinderGeometry(.45,.5,12,7),wood);mast.position.y=9;boat.add(mast);
    const sail=new T.Mesh(new T.PlaneGeometry(7,8),new T.MeshBasicMaterial({color:'#e8d5ad',side:T.DoubleSide}));
    sail.position.set(0,10,0);sail.rotation.y=.35;boat.add(sail);
    worldObjects.add(boat);worldMarkers.set(key,boat);
   }
   const home=center(w.portTile.c,w.portTile.r),destination=center(w.catchTile.c,w.catchTile.r);
   const trip=w.tripTotal||1,progress=w.phase==='work'?1:w.phase==='return'?Math.max(0,(w.trip||0)/trip):Math.max(0,Math.min(1,1-(w.trip||0)/trip));
   boat.position.set(home.x+(destination.x-home.x)*progress,.9+Math.sin(s.time*1.4+region.c)*.3,home.z+(destination.z-home.z)*progress);
   boat.rotation.y=Math.atan2(destination.x-home.x,destination.z-home.z)+(w.phase==='return'?Math.PI:0);
  }
 }
 for(const[key,m]of worldMarkers)m.visible=live.has(key);const hp=highlightGeometry.attributes.position;for(let i=0;i<hp.count;i++)hp.setY(i,Math.max(.8,surface(game,chosen.x+hp.getX(i),chosen.z+hp.getZ(i)))+.7);hp.needsUpdate=true;highlightGeometry.computeBoundingSphere();highlight.position.set(chosen.x,0,chosen.z)}
function renderFleet(){
 const root=$('navalactions');root.replaceChildren();
 for(const ship of s.ships.filter(a=>a.team===0&&a.hp>0))
  button(root,'⚓ '+SHIPS[ship.kind].name+' · '+Math.ceil(ship.hp)+' HP'+(ship.cargo?' · pardal '+(ship.cargo.kind==='army'?'armee '+(ship.cargo.armyId||0):'asunik'):''),()=>{
   selectedShip=ship.id;selectedTrade=null;selectedMover=null;armySelected=false;chosen=game.cell(ship);openWorld();
   const p=center(ship.c,ship.r);focus.set(p.x,0,p.z);renderUI();
  });
 const ship=s.ships.find(a=>a.id===selectedShip&&a.hp>0);if(!ship)return;
 const info=document.createElement('p');
 info.textContent=SHIPS[ship.kind].name+' · '+(s.research[0].known.includes('ocean_sailing')?'Ookeanikõlblik':s.research[0].known.includes('navigation')?'Rannikust kuni 2 ruutu':'Ainult ranniku kõrval');
 root.append(info);
 button(root,'■ Peata laev',()=>{ship.path=[];save();renderUI()});
 if(ship.kind==='transport'&&!ship.cargo){
  for(const army of activeArmies(s,0).filter(a=>a.embarked==null&&Math.max(Math.abs(a.c-ship.c),Math.abs(a.r-ship.r))<=1)){
   const n=armyUnits(s,army).length;
   button(root,'↑ Laadi armee '+(army.id||0)+' · '+n+'/6 üksust',()=>{
    const error=game.embark(ship,'army',army.id||0);
    say(error||'Valitud väesalk on pardal.');renderUI();save();
   },n>6||n===0);
  }
  button(root,'↑ Laadi kõrval olev asunik',()=>{say(game.embark(ship,'settler')||'Asunik on pardal.');renderUI();save()});
 }
 if(ship.cargo){
  const p=document.createElement('p');p.textContent='Maabumiseks anna laevale liikumiskäsk ja puuduta kõrval olevat maismaaruutu.';root.append(p);
  if(ship.cargo.kind==='army'){
   const a=cargoArmy(game,ship);
   button(root,'⚔ Suundu avastatud vastase juurde',()=>{
    const enemy=(game.cityAt(chosen)?.team!==0?game.cityAt(chosen):null)||s.cities.find(c=>c.team!==0&&game.seen(0,c));
    if(!enemy)return say('Vastase asukoht on avastamata. Uuri merd.');
    const success=navyExpedition(game,ship,a,enemy);
    say(success?'Laev alustas sõjaretke.':'Sellel ajastul puudub ligipääsetav meretee.');renderUI();save();
   });
  }
 }
}
function price(cost){return Object.entries(cost||{}).map(([k,v])=>v+' '+RESOURCE_NAMES[k].toLowerCase()).join(' · ')}
function missingMaterials(stock,cost){return Object.entries(cost||{}).filter(([kind,n])=>(stock[kind]||0)<n).map(([kind,n])=>Math.ceil(n-(stock[kind]||0))+' '+RESOURCE_NAMES[kind].toLowerCase()).join(' · ')}
function button(parent,text,fn,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=fn;parent.append(b);return b}
function setCityTab(next){cityTab=next;if(next!=='build'){mode=null;updateGhost()}renderUI()}
function syncCityPanel(){const city=activeCity(),visible=view==='local'&&!!city&&!s.battle;$('citypanel').hidden=!visible;$('researchstatus').hidden=visible||!!s.battle;if(city){const area=game.constructionArea(city);$('citypaneltitle').textContent=area.parent.name+' · '+area.tiles.length+' ruutu · ühine ehitusala · '+area.parent.economy.realms[city.team].pop+' elanikku'}for(const key of ['info','build','workers']){$('citypane-'+key).hidden=!visible||cityTab!==key;const button=$('citytab-'+key);button.setAttribute('aria-selected',String(cityTab===key));button.setAttribute('aria-controls','citypane-'+key);$('citypane-'+key).setAttribute('aria-labelledby','citytab-'+key);button.classList.toggle('active',cityTab===key)}for(const b of document.querySelectorAll('[data-tab]'))b.classList.toggle('active',b.dataset.tab===tab);$('tray').hidden=!visible||cityTab!=='build';$('cityqueue').hidden=!visible||cityTab!=='build';}
for(const key of ['info','build','workers'])$('citytab-'+key).onclick=()=>setCityTab(key);
// Resource scouting is a selection state: the settler forces it on,
// while the player's manual preference is restored on selecting something else.
function hasSelectedSettler(){return selectedMover!=null&&s.settlers.some(a=>a.team===0&&a.id===selectedMover)}
function syncResourceLayer(){const active=manualResourceOverlay||hasSelectedSettler();if(active!==showResourceOverlay){showResourceOverlay=active;resourceArea='';refreshResourceArea()}}
function renderTileResourceHUD(){
 const auto=hasSelectedSettler(),button=$('hud-resource-toggle'),panel=$('hud-tile-resources');button.hidden=!!s.battle;if(s.battle)button.style.setProperty('display','none','important');else button.style.removeProperty('display');
 button.setAttribute('aria-pressed',String(showResourceOverlay));button.setAttribute('aria-disabled','false');button.setAttribute('aria-expanded',String(resourceDetailsOpen&&showResourceOverlay));
 button.textContent=auto?'🧺 Asuniku ressursid':showResourceOverlay?'🧺 Ressursid ✓':'🧺 Ressursid';
 button.title=auto?'Ressursiikoonid jäävad asunikuga aktiivseks. Puuduta ruudu andmete näitamiseks või peitmiseks.':'Näita või peida maailmakaardi ressursid ja valitud ruudu andmed';
 const cell=view==='local'?activeTile:chosen,known=!!cell&&game.seen(0,cell);
 panel.hidden=!!s.battle||!showResourceOverlay||!known||!resourceDetailsOpen;
 if(!panel.hidden){
  $('hud-tile-title').textContent='Ruut '+(cell.c+1)+':'+(cell.r+1)+' · ressursid';
  const existing=Object.keys(cell.deposits||{}).filter(k=>cell.deposits[k]&&(k!=='oil'||s.research[0].known.includes('oil_drilling')));
  const missing=['wood','stone','water','grain','game','fish'].filter(k=>!cell.deposits?.[k]);
  const deps=$('hud-tile-deposits');deps.replaceChildren();
  const addLine=(label,items,cls)=>{const p=document.createElement('div');p.className=cls;p.textContent=label+': '+(items.length?items.map(k=>(depositIcons[k]||'◆')+' '+(depositNames[k]||k)).join(' · '):'—');deps.append(p)};
  addLine('Olemas',existing,'resource-existing');addLine('Ruudul puudub',missing,'resource-absent');
  const city=activeCity(),missingElement=$('hud-tile-missing');
  if(view==='local'&&city?.team===0&&mode&&BUILDINGS[mode]){
   const cost=BUILDINGS[mode].cost||{},resources=game.parentCity(city).economy.realms[0].resources;
   const shortages=Object.entries(cost).filter(([k,v])=>v>(resources[k]||0)).map(([k,v])=>(RESOURCE_NAMES[k]||k)+': '+Math.ceil(v-(resources[k]||0)));
   missingElement.textContent=shortages.length?'Ehitamiseks puudu: '+shortages.join(' · '):'Ehitamiseks materjale jätkub.';
  }else missingElement.textContent='Roheline: ruudul olemas. Oranž: ruudul puudub. Ehitiste materjalikulu on eraldi.';
 }
 const status=$('hud-build-status');status.hidden=view!=='local'||!mode||!BUILDINGS[mode];
 if(!status.hidden)status.textContent='⚒ '+game.buildingName(0,mode)+' — puuduta ehituskohta kaardil';
}

// Exploration controls reuse the same army/auto-explore gameplay logic.
function explorerArmy(){const q=currentSelection();if(q?.kind==='army'&&armyUnits(s,q.entity).some(u=>u.kind==='scout'))return q.entity;if(q?.kind==='unit'&&q.entity.team===0&&q.entity.kind==='scout')return s.armies.find(a=>a.team===0&&(a.id||0)===(q.entity.armyId||0));return null;}
function toggleExploreMenu(force){
 const panel=$('hud-explore-panel'),open=typeof force==='boolean'?force:panel.hidden;
 panel.hidden=!open;document.body.classList.toggle('hud-explore-open',open);
 $('hud-explore').setAttribute('aria-expanded',String(open));
 if(open){document.body.classList.remove('hud-map-open','hud-city-open','hud-queue-open','hud-city-overview');if(view!=='world')openWorld()}
 updateExploreUI();
}
function updateExploreUI(){
 $('hud-explore').hidden=true;$('hud-explore').style.setProperty('display','none','important');const a=explorerArmy(),enabled=!!a&&a.embarked==null,hasScout=!!a;
 $('hud-explore-select').disabled=!hasScout;
 $('hud-explore-auto').disabled=!hasScout;
 $('hud-explore-auto').textContent=a?.autoExplore?'■ Peata automaatne avastamine':'▶ Automaatne avastamine';
 $('hud-explore-state').textContent=!a?'Avastajat ei ole. Värba või loo avastaja.':`Avastaja · ruut ${a.c+1}:${a.r+1} · ${a.embarked!=null?'on laeval':a.waitingForShip?'vajab merereisiks transpordilaeva':a.autoExplore?'uurib automaatselt':'ootab käsku'}`;
 $('hud-explore-tile').disabled=view!=='world'||!game.seen(0,chosen);
}
function renderUI(){updateBuildingInfo();syncResourceLayer();const resourceControl=$('resourceoverlay');resourceControl.hidden=!!s.battle;resourceControl.setAttribute('aria-pressed',String(showResourceOverlay));resourceControl.disabled=hasSelectedSettler();resourceControl.title=hasSelectedSettler()?'Asunikuga on ressursid alati näha':'';resourceControl.textContent=hasSelectedSettler()?'🧺 Asuniku ressursid aktiivsed':showResourceOverlay?'🧺 Peida ressursid':'🧺 Näita ressursse';drawOverview();renderLabor(game,view==='local'?activeCity():null,BUILDINGS,TROOPS,save,{details:cityTab==='workers'});renderResearchUI(game,{choose:chooseResearch,queue:queueTechnology,remove:removeTechnology,details:!$('researchpanel').hidden});const city=ownCity(),localCity=activeCity(),displayCity=localCity?.team===0?game.parentCity(localCity):city,realm=displayCity?.economy.realms[0],settler=settlerHere(),age=s.ages[0],next=AGES[age+1];$('selectarmy').textContent=s.units.filter(u=>u.team===0&&u.hp>0).every(u=>u.kind==='scout')?'♟ Avastaja':'⚔ Armee';const explorer=activeArmy(),hasScout=armyUnits(s,explorer).some(u=>u.kind==='scout');$('autoexplore').disabled=!hasScout;$('autoexplore').textContent=explorer.autoExplore?'◉ Peata automaatne avastamine':'🧭 Automaatne avastamine';$('autoexplore').setAttribute('aria-pressed',String(!!explorer.autoExplore));$('autoexplore').classList.toggle('active',!!explorer.autoExplore);$('resources').innerHTML=Object.entries(RESOURCE_NAMES).filter(([k])=>['wood','stone','plank','bread','water','gold'].includes(k)||(!GOODS[k]?.food&&!['grain','flour'].includes(k)&&(realm?.resources[k]||0)>0)).sort(([a],[b])=>(['bread','water','wood','stone','plank','gold'].includes(a)?['bread','water','wood','stone','plank','gold'].indexOf(a):6)-(['bread','water','wood','stone','plank','gold'].includes(b)?['bread','water','wood','stone','plank','gold'].indexOf(b):6)).map(([k,n])=>`<span data-resource="${k}" role="button" tabindex="0" title="Kohalik varu (riigi varu) / mahutavus">${Math.floor(k==='bread'&&realm?foodTotal(realm.resources):realm?.resources[k]??(k==='wood'?100:k==='stone'?55:k==='bread'?40:0))} (${Math.floor(k==='bread'?foodTotal(nationalStock(s,0)):nationalStock(s,0)[k]||0)})/${displayCity?game.storageCap(displayCity,k)===Infinity?'∞':game.storageCap(displayCity,k):'—'}<small>${k==='bread'?'Toit':n}</small></span>`).join('');$('turn').textContent='Käik '+(Math.floor(s.time/TURN_SECONDS)+1)+' · '+AGES[age].name+' · '+Math.floor(s.time/TURN_SECONDS)+':'+String(Math.floor(s.time%TURN_SECONDS)).padStart(2,'0');$('clock').value=s.time%TURN_SECONDS;$('maplabel').textContent=view==='world'?AGES[age].name.toUpperCase()+' · MAAILMAKAART':`${localCity?.name||featureNames[activeTile.detail.feature]} · ${activeTile.c+1}:${activeTile.r+1}`;$('objective').textContent='V69 · teadus '+game.scienceRate(0).toFixed(1)+' p/min';
 const resourcesList=$('tileresources');resourcesList.hidden=!showResourceOverlay||!game.seen(0,chosen);
 if(!resourcesList.hidden){
  resourcesList.replaceChildren();
  const heading=document.createElement('strong');heading.textContent='Ressursid ruudul';resourcesList.append(heading);
  const found=Object.keys(chosen.deposits).filter(kind=>chosen.deposits[kind]&&(kind!=='oil'||s.research[0].known.includes('oil_drilling')));
  if(!found.length){const empty=document.createElement('span');empty.textContent='Teadaolevaid ressursse pole';resourcesList.append(empty)}
  for(const kind of found){const pill=document.createElement('span');pill.className='tile-resource';pill.textContent=(depositIcons[kind]||'◆')+' '+(depositNames[kind]||kind);resourcesList.append(pill)}
 }
 $('atlasdetail').textContent=!game.seen(0,chosen)?'Ruut '+(chosen.c+1)+':'+(chosen.r+1)+' · Veel avastamata':`Ruut ${chosen.c+1}:${chosen.r+1} · ${featureNames[chosen.detail.feature]}\n`+Object.keys(chosen.deposits).filter(k=>chosen.deposits[k]&&(k!=='oil'||s.research[0].known.includes('oil_drilling'))).map(k=>(depositNames[k]||RESOURCE_NAMES[k]||k)).join(' · ')+(game.cityAt(chosen)?' · '+game.cityAt(chosen).name:game.territoryOwner(chosen)?' · '+game.territoryOwner(chosen).name+' ehitusala':' · Neutraalne ala')+(chosen.mountain?' · Läbimatu mäestik':'')+' · '+game.terrainText(chosen);const landmark=(s.landmarks||[]).find(l=>l.c===chosen.c&&l.r===chosen.r);
 if(game.seen(0,chosen)&&landmark)$('atlasdetail').textContent+='\n'+(landmark.kind==='village'?'⌂ Sõbralik küla':'✦ Muistsed varemed')+(landmark.claimedBy==null?' · külastamata, liigu avastajaga siia':' · uuritud');
 $('inspecttile').disabled=false;$('inspecttile').textContent=game.cityAt(chosen)?'Ava linn':game.territoryOwner(chosen)?'Ava linna piirkond':'Ava detailkaart / maabu';$('opencity').textContent=city?'⌂ Ava '+city.name:'♟ Ava oma asuniku kaart';$('viewenemy').textContent='⌂ Vaata avastatud vastast';$('viewenemy').disabled=!s.cities.some(c=>c.team!==0&&game.visibleNow(0,c))&&!s.settlers.some(a=>a.team!==0&&game.visibleNow(0,a));$('attackcity').disabled=!s.cities.some(c=>c.team!==0&&game.visibleNow(0,c));
 $('settlerpanel').hidden=view!=='local'||!settler;$('foundcity').disabled=!!settler?.localTarget;$('foundcity').hidden=!settler;$('settlerhint').textContent='Vali „Liigu“ või vajuta M ja puuduta kuiva linnakohta. Kohale jõudes raja linn. Igal linnal on oma varud.';
 document.body.classList.toggle('settling',view==='local'&&!localCity&&!s.battle);document.body.classList.toggle('enemy-city',!!localCity&&localCity.team!==0);$('selection').textContent=localCity?localCity.name+' · '+AGES[s.ages[localCity.team]].name:settler?'Asunik · vali linnakoht':'Maailma avastamine';$('detail').textContent=localCity?Object.keys(game.cell(localCity).deposits).filter(k=>game.cell(localCity).deposits[k]).map(k=>(depositNames[k]||RESOURCE_NAMES[k]||k)).join(' · '):'Uus linn tuleb rajada olemasolevate linnade alast väljapoole.';$('progression').textContent=s.research[0].active?'Uurimisel: '+TECHS[s.research[0].active].name:'Vali tehnoloogiapuust järgmine uurimus.';$('workforce').textContent=realm?'Elanikke: '+realm.pop+'/'+housingCapacity(game.allBuildings(game.parentCity(city)))+' · Töölisi: '+(Math.round((realm.employed||0)*100)/100)+' · Varud: '+displayCity.name+' · Saabumas: '+s.shipments.filter(c=>c.to===city.id).length+' · Teel välja: '+s.shipments.filter(c=>c.from===city.id).length:'';$('research').textContent='⚗ Ava tehnoloogiapuu';$('research').disabled=false;
 const cityList=$('citylist');cityList.innerHTML='';for(const a of s.settlers.filter(a=>a.team===0))button(cityList,'♟ Asunik '+(a.id+1)+' · '+(a.c+1)+':'+(a.r+1),()=>{selectedShip=null;selectedTrade=null;selectedMover=a.id;armySelected=false;chosen=game.cell(a);openWorld();const p=center(a.c,a.r);focus.set(p.x,0,p.z)});for(const c of s.cities.filter(c=>c.team===0))button(cityList,'⌂ '+c.name,()=>{chosen=game.cell(c);openTile(chosen)});for(const team of [1,2,3]){const enemy=s.cities.find(c=>c.team===team&&game.visibleNow(0,c))||s.settlers.find(a=>a.team===team&&game.visibleNow(0,a));if(enemy)button(cityList,'⚑ '+FACTION_NAMES[team]+' vastane',()=>openTile(game.cell(enemy)))}
 renderFleet();$('actions').innerHTML='';if(localCity?.team===0)button($('actions'),s.research[0].known.includes('settlement')?'♟ Värba uus asunik · 45 puitu, 20 kivi, 15 toitu · 2 elanikku':'♟ Uuri: Asunduste rajamine',()=>{const r=game.recruitSettler(localCity);if(r.error)return say(r.error);selectedMover=r.settler.id;armySelected=false;chosen=game.cell(r.settler);openWorld();say('Uus asunik valitud. Puuduta maailmakaardil vaba linnaruudu sihtkohta.');save()});
 const armyTrayKey=tab==='army'&&view==='local'&&localCity?.team===0?'army:'+localCity.id+':'+localCity.c+':'+localCity.r+':'+age+':'+recruitGrade+':'+s.research[0].known.join(',')+':'+game.cityReady(localCity,'harbor'):null;
 if(!armyTrayKey||$('tray').dataset.militaryKey!==armyTrayKey){$('tray').dataset.militaryKey=armyTrayKey||'';$('tray').innerHTML='';if(view==='local'&&localCity?.team===0){if(tab==='build')for(const[type,d]of Object.entries(BUILDINGS).filter(([k])=>k!=='hall'&&!game.obsoleteBuilding(localCity.team,k)&&(BUILD_AGE[k]??9)<=age&&(!BUILD_TECH[k]||s.research[0].known.includes(BUILD_TECH[k])))){
 const error=game.buildRule(localCity,type),missing=missingMaterials(localCity.economy.realms[0].resources,d.cost),unavailable=!!error||!!missing;
 const label=d.icon+' '+game.buildingName(localCity.team,type)+(type==='fisher'?'\n🐟 '+fishingEraText(s.ages[localCity.team])+' · '+fishingRange(s.ages[localCity.team])+' mereruutu':'')+'\n'+price(d.cost)+'\n⏱ '+timeLabel(game.constructionTime(type))+' · ⚒ '+game.builderLabel(localCity.team)+(missing?'\n⚠ Puudu: '+missing:error?'\n⚠ '+error:'');
 const b=button($('tray'),label+(missing&&!error?'\n🧺 Telli puuduvad materjalid':''),()=>{if(missing&&!error){const parent=game.parentCity(localCity);parent.importRequests={...(parent.importRequests||{}),...d.cost};say('Materjalide tellimus lisatud. Kaupmees vajab ülejäägiga linna ja lubatud peatustega teed.');save();return;}commandMode='select';mode=type;if(matchMedia('(max-width:900px), (max-height:580px)').matches)document.body.classList.remove('hud-city-open','hud-queue-open');renderUI();say(d.name+': puuduta vaba ehituskohta.')},!!error);b.style.whiteSpace='normal';b.dataset.building=type;}else {
 const label=document.createElement('label');label.textContent='Varustustase';label.style.gridColumn='1 / -1';
 const select=document.createElement('select');select.id='recruit-grade';select.style.width='100%';select.style.maxWidth='100%';select.setAttribute('aria-label','Üksuse varustustase');
 for(const [id,g]of Object.entries(UNIT_GRADES)){const option=document.createElement('option');option.value=id;option.textContent=g.name+(id==='mobilized'?' · hind −50%, tervis/jõud −60%':id==='elite'?' · hind +30%, tervis/jõud +40%':' · tavahind ja tavatugevus');select.append(option);}
 select.value=recruitGrade;select.onchange=()=>{recruitGrade=select.value;renderUI();};label.append(select);$('tray').append(label);
 for(const[k,d]of Object.entries(TROOPS).filter(([k,d])=>k!=='militia'&&k!=='bronze_cavalry'&&!game.obsoleteUnit(localCity.team,k)&&(SHIPS[k]?s.research[0].known.includes('shipbuilding')&&game.cityReady(localCity,'harbor'):d.age<=age&&(!UNIT_TECH[k]||s.research[0].known.includes(UNIT_TECH[k]))))){
  const cost=troopCost(d,recruitGrade),g=UNIT_GRADES[recruitGrade],strength=Math.round(d.hp*g.strength),damage=+((d.dmg||d.damage||0)*g.strength).toFixed(1);
  const b=button($('tray'),d.name+' · '+g.name+'\n'+price(cost)+'\n♥ '+strength+' · ⚔ '+damage+'\n⏱ '+timeLabel(d.time*tempoMultiplier(s)),()=>{const r=game.recruit(localCity,k,recruitGrade);say(r.error||d.name+' ('+g.name+') lisatud väljaõppejärjekorda.');renderUI();save();});b.dataset.unit=k;b.dataset.grade=recruitGrade;
 }
 }}
 }
 const unavailableBuildings=tab==='build'&&localCity?.team===0&&!Object.keys(BUILDINGS).some(k=>k!=='hall'&&game.canBuildNow(localCity,k));$('hud-build-guidance').textContent=unavailableBuildings?'⚠ Materjale või avastusi napib — vaata ehituskaardi puudujääke.':tab==='army'?'Värba linnas sõdureid.':'Vali hoone ja puuduta ehituskohta.';if(view==='local'&&localCity?.team===0&&WALL_TYPES.has(mode)&&mode!=='keep')button($('actions'),'↻ Pööra müüri 90° (R)',()=>{wallAxis=wallAxis?0:1;updateGhost();renderUI()});
if(view==='local'&&localCity?.team===0&&!s.battle&&selectedBuilding&&WALL_TYPES.has(selectedBuilding.type)&&localCity.economy.buildings.includes(selectedBuilding)){
 const b=selectedBuilding,guards=game.wallGuards(localCity,b);
 button($('actions'),'🛡 Müüril '+guards.length+'/'+wallCapacity(b.type)+' sõdurit · saada järgmine armeest',()=>{
  const result=game.stationWall(localCity,b);say(result.error||'Sõdur määrati müürile. Ta ei liigu enam armeega kaasa.');renderUI();save()
 },!b.ready||guards.length>=wallCapacity(b.type));
 button($('actions'),'↩ Kutsu sõdur müürilt tagasi',()=>{
  const result=game.releaseWall(localCity,b);say(result.error||'Sõdur naasis mobiilsesse armeesse.');renderUI();save()
 },guards.length===0);
}
if(view==='local'&&localCity?.team===0&&selectedBuilding&&TOWER_TYPES.has(selectedBuilding.type)&&localCity.economy.buildings.includes(selectedBuilding)){
 button($('actions'),'♜ '+(towerManned(selectedBuilding)?'Torn: 5 vibu ja mõõgaga kaitsjat · ballista mehitatud':'Torn: 5 kaitsjat · ballista vajab 1 töötajat'),()=>setCityTab('workers'))
}
if(localCity?.team>0){const other=localCity.team;button($('actions'),'Suhe: '+relation(s,0,other)+' · sõlmi sõprus',()=>{setRelation(s,0,other,'friendly');renderUI();save()});}if(localCity)button($('actions'),'♟ Tööjõud ja tootmine',()=>setCityTab('workers'));if(localCity?.team===0){const parent=game.parentCity(localCity);button($('actions'),parent.tradeDisabled?'▶ Luba linnadevahelised kaubaveod':'Ⅱ Peata selle linna kaubaveod',()=>{parent.tradeDisabled=!parent.tradeDisabled;renderUI();save()})}if(localCity?.team===0)for(let team=1;team<4;team++){const parent=game.parentCity(localCity);button($('actions'),(parent.blockedMerchants?.[team]?'Luba':'Tõkesta')+' riigi '+(team+1)+' kaupmehed',()=>{blockMerchants(s,parent,team,!parent.blockedMerchants?.[team]);renderUI();save()});}if(localCity?.districtOf!=null)button($('actions'),'⌂ Ava linnakeskus',()=>openTile(game.cell(game.parentCity(localCity))));renderCityHealth();$('battlepanel').hidden=!s.battle||view!=='local';if(s.battle){$('localhint').textContent=s.battle.pursuitStoppedTeam!=null&&!s.battle.result?'Põgenejad jooksevad punase joone taha.':'Vali oma üksus ja puuduta sihtkohta.';$('localtitle').textContent=s.battle.fortress?'Linna piiramine':'Lahing';$('battledetail').textContent=s.battle.result?(s.battle.result==='victory'?'Võit!':s.battle.result==='retreat'?'Armee põgenes.':'Lahing kaotatud.'):'3 × 3 · Mehi '+battleManCount(s.battle,0)+' vs '+s.battle.squads.filter(u=>u.team!==0&&!u.reserve&&!u.retreated).reduce((n,u)=>n+(u.men?u.men.filter(m=>m.hp>0&&!m.escaped).length:livingMen(u)),0)+' · Piir 500'+(s.battle.reserveMen?' · Reservis '+s.battle.reserveMen:'')+' · Põgenemine üle punase joone.'+(s.battle.fortress?' · Linn: '+Math.ceil(s.battle.fortress.hp)+' HP · Müürid: '+(s.battle.siegeSections||[]).filter(w=>w.hp>0).length+(s.battle.siegeBreached?' · LÄBIMURRE':''):'');$('attackall').hidden=true;$('retreat').textContent=s.battle.result?'Tagasi maailmakaardile':'Tagane armeega';}syncCityPanel();renderCommandHUD();renderTileResourceHUD();updateExploreUI();renderV51UI();
}
function checkEncounter(){
 if(s.battle||s.winner!==null)return;
 for(const a of s.armies){
  if(a.embarked!=null||(a.retreatUntil||0)>s.time||!armyUnits(s,a).length)continue;
  const foes=s.armies.filter(f=>f.embarked==null&&(f.retreatUntil||0)<=s.time&&atWar(s,f.team,a.team)&&tileKey(f)===tileKey(a)&&armyUnits(s,f).length);
  const city=game.cityAt(a);
  if(!foes.length&&(!city||!atWar(s,city.team,a.team)))continue;
  a.path=[];for(const foe of foes)foe.path=[];
  const cell=game.cell(a),b=createBattle(cell,s.units,s),present=s.armies.filter(g=>(g.team===a.team||atWar(s,g.team,a.team))&&g.embarked==null&&tileKey(g)===tileKey(a)&&armyUnits(s,g).length);
  const sources=new Set(s.units.map((u,i)=>({u,i})).filter(({u})=>!u.garrison&&present.some(g=>g.team===u.team&&(g.id||0)===(u.armyId||0))).map(({i})=>i));
  b.squads=b.squads.filter(q=>sources.has(q.source));deployHistoricalBattle(b);
  const teams=[...new Set(present.map(g=>g.team))];b.attackerTeam=city?(teams.find(t=>t!==city.team)??a.team):a.team;
  if(city&&atWar(s,city.team,a.team)&&teams.some(t=>t!==city.team)){
   const hall=city.economy.buildings.find(g=>g.type==='hall');
   b.fortress={team:city.team,cityId:city.id,x:hall.x,z:hall.z,hp:city.hp,maxHp:600,cool:0};
  }
  if(b.fortress){mobilizeCity(b,city);fortifyBattle(game,city,b)}
  const nav=game.battleNavigation(b);for(const u of b.squads){if(u.guardPost)continue;const p=nav.nearest(u,80);if(p){u.x=p.x;u.z=p.z}}
  initializeMen(b,nav);s.battle=b;if(!b.squads.some(u=>u.team===0)&&b.fortress?.team!==0)return;
  chosen=cell;openTile(cell);say('Lahing: 3 × 3 ruutu, kuni 500 meest. Punase joone ületamine viib kogu armee põgenema. Vali ja liiguta salke ükshaaval.');return;
 }
}
function applyBattle(){
 const b=s.battle;if(!b?.result||b.applied)return;
 persistIndividualMen(s,b);for(const q of b.squads)if(!q.reserve&&q.source>=0&&s.units[q.source])s.units[q.source].hp=q.hp;
 if(b.fortress){
  const city=s.cities.find(c=>c.id===b.fortress.cityId);
  settleDefenders(b,city);persistSiegeDamage(city,b);peacefulGarrisons.delete(city);
  city.hp=Math.max(0,Math.min(city.hp,b.fortress.hp));
  if(city.hp<=0){
   const old=city.team;
   game.transferCity(city,b.winnerTeam??b.attackerTeam);city.hp=300;
   say('Linn vallutatud! '+old+' → '+city.team+'.'+(s.winner===0?' Kõik vastased alistatud!':''));
  }
 }
 applyArmyRetreats(game,b);const awards=rewardBattleExperience(s,b,TROOPS);if(awards.some(a=>a.team===0))say('Armee sai lahingukogemust: '+awards.filter(a=>a.team===0).map(a=>'LVL '+a.level+' · +'+a.earned+' XP').join(', '));
 rememberBattle(s,b);b.applied=true;save();renderUI();
}
// V64: analytic atlas picking avoids raycasting hundreds of thousands of
// terrain triangles on every mouse/touch movement.
const worldPickPlane=new T.Plane(new T.Vector3(0,1,0),0),worldPickPoint=new T.Vector3();
function pick(e){
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
 ray.setFromCamera(pointer,camera);
 if(view==='world'){
  worldPickPlane.constant=0;
  const hit=ray.ray.intersectPlane(worldPickPlane,worldPickPoint);
  if(!hit)return null;
  for(let i=0;i<3;i++){
   worldPickPlane.constant=-Math.max(.72,surface(game,hit.x,hit.z));
   if(!ray.ray.intersectPlane(worldPickPlane,hit))break;
  }
  return hit;
 }
 return ray.intersectObjects([localTerrain,...neighbourTerrains])[0]?.point;
}
// Track simultaneous fingers separately. A completed pinch must never become a map tap.
const touchPointers=new Map();let pinch=null,pinchConsumed=false;
const pointerDistance=()=>{const [a,b]=[...touchPointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0};
$('world').onpointerdown=e=>{
 if(inputBlocked())return;
 if(e.pointerType==='touch'){
  touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  $('world').setPointerCapture(e.pointerId);
  if(touchPointers.size>=2){pinch={distance:Math.max(4,pointerDistance()),startZoom:zoom};pinchConsumed=true;drag=null}
 }
 if(touchPointers.size>1)return;
 drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,id:e.pointerId};
 $('world').setPointerCapture(e.pointerId)
};
$('world').onpointermove=e=>{if(inputBlocked())return;if(e.pointerType==='touch'&&touchPointers.has(e.pointerId)){touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touchPointers.size>=2){if(!pinch)pinch={distance:Math.max(4,pointerDistance()),startZoom:zoom};applyZoom(pinch.startZoom*pinch.distance/Math.max(4,pointerDistance()));pinchConsumed=true;drag=null;return}if(pinchConsumed)return}hoverPoint=pick(e)||null;if(commandMode==='move'||commandMode==='attack')renderCommandHUD();if(view==='local'&&mode){const p=pick(e);if(p)ghostPoint={x:Math.round(p.x/2)*2,z:Math.round(p.z/2)*2};updateGhost()}if(!drag)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(drag.moved){panCamera(-dx*zoom/innerHeight*.8,-dy*zoom/innerHeight*.8);focus.x=Math.max(view==='world'?ORIGIN_X+50:s.battle?BATTLEFIELD.outerMinX:-225,Math.min(view==='world'?ORIGIN_X+WORLD_WIDTH-50:s.battle?BATTLEFIELD.outerMaxX:225,focus.x));focus.z=Math.max(view==='world'?ORIGIN_Z+50:s.battle?BATTLEFIELD.outerMinZ:-195,Math.min(view==='world'?ORIGIN_Z+WORLD_DEPTH-50:s.battle?BATTLEFIELD.outerMaxZ:195,focus.z))}drag.lastX=e.clientX;drag.lastY=e.clientY};
function activeArmy(){return s.armies.find(a=>a.team===0&&(a.id||0)===selectedArmyId)||s.armies[0]}
function selectEntity(type,entity){selectedShip=null;selectedTrade=null;selectedMover=null;armySelected=false;selectedUnit=null;selectedBuilding=null;mode=null;commandMode='select';if(type==='ship')selectedShip=entity.id;else if(type==='army'){armySelected=true;selectedArmyId=entity.id||0;}else if(type==='settler')selectedMover=entity.id;else if(type==='trade'||type==='caravan')selectedTrade=entity.id;chosen=game.cell(entity);renderUI()}
function worldClick(cell,entityHit=null,forceMove=false){if(!forceMove&&commandMode==='select'){if(entityHit?.entity?.team===0){selectEntity(entityHit.type,entityHit.entity);return}const a=s.settlers.find(a=>a.team===0&&a.embarked==null&&tileKey(a)===tileKey(cell)),ship=s.ships.find(a=>a.team===0&&a.hp>0&&tileKey(a)===tileKey(cell));if(a){selectEntity('settler',a);return}if(ship){selectEntity('ship',ship);return}const army=activeArmies(s,0).find(a=>tileKey(a)===tileKey(cell)&&a.embarked==null);if(army){selectEntity('army',army);return}chosen=cell;if(game.seen(0,cell)){document.body.classList.remove('hud-explore-open');openTile(cell)}else{renderUI();say('Avasta esmalt see maailmaruut.')}return}const selection=currentSelection();if(!selection?.movable)return say('Vali kõigepealt oma asunik, armee või laev.');let error;if(selectedShip!==null){const ship=selection.entity;error=cell.land?game.disembark(ship,cell):game.sail(ship,cell)}else if(armySelected){const unit=activeArmy(),path=game.landPath(unit,cell,0);if(path)unit.path=path;else error='Sinna ei pääse mööda maad. Vajad koolmekohta, silda või mereteed.'}else error=game.moveSettler(selectedMover,cell);say(error||selection.name+' · liikumiskäsk antud');if(!error)commandMode='select';chosen=cell;renderUI();save()}
// Tap actual roof/facade meshes, not only the small legacy ground pick radius.
function pickBuilding(e){
 if(view!=='local'||!activeTile)return null;
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
 ray.setFromCamera(pointer,camera);
 const ctx=activeCity();
 for(const hit of ray.intersectObjects(localObjects.children,true)){
  let o=hit.object;
  while(o&&o!==localObjects){
   const b=o.userData?.buildingRef;
   if(b&&ctx?.economy.buildings.includes(b))return b;
   o=o.parent;
  }
 }
 return null;
}
function inspectBuilding(b){
 const ctx=activeCity();
 if(!b||!ctx?.economy.buildings.includes(b))return false;
 selectedUnit=null;selectedBuilding=b;selectedMover=null;
 selectedShip=null;armySelected=false;commandMode='select';cityTab='info';
 renderUI();return true;
}
function localClick(p,forceMove=false){const city=activeCity(),a=settlerHere();if(commandMode==='attack'&&s.battle){const attacker=currentSelection()?.entity;
 if(!attacker||attacker.team!==0||attacker.hp<=0||attacker.reserve||(attacker.guardPost&&!s.battle?.wallWalkEnabled))return say('Vali esmalt oma lahinguüksus.');
 const choices=s.battle.squads.filter(u=>u.team!==attacker.team&&u.hp>0&&!u.retreated&&!u.reserve),hits=choices.map(u=>({unit:u,d:Math.min(dist(u,p),...(u.men||[]).filter(m=>m.hp>0&&!m.escaped).map(m=>dist(m,p)))})).sort((a,b)=>a.d-b.d),pick=hits[0];
 if(!pick||pick.d>(pick.unit.kind==='chariot'?10:6))return say('Ründamiseks puuduta vastase sõdurit või salka.');
 attacker.attackTargetSource=pick.unit.source;attacker.target=null;attacker.manualOrder=false;attacker.advance=true;
 if(attacker.formation==='hold')setFormation(attacker,'line',TROOPS,s.battle.elapsed,false);
 commandMode='select';say('Ründekäsk antud: '+(TROOPS[pick.unit.kind]?.name||'vastase salk')+'.');renderUI();save();return;
 }if(mode&&city?.team===0&&!s.battle&&!forceMove){ghostPoint={x:Math.round(p.x/2)*2,z:Math.round(p.z/2)*2};updateGhost();const r=game.buildInArea(city,mode,ghostPoint);say(r.error||'Ehitus algas · '+game.parentCity(city).name);if(r.building){if(WALL_TYPES.has(r.building.type)){r.building.wallAxis=wallAxis;configureWallFootprint(r.building);game.nav(r.ctx).rebuild()}mode=null;if(r.ctx.c!==activeTile.c||r.ctx.r!==activeTile.r)openTile(game.cell(r.ctx))}renderUI();save();return}const moving=forceMove||commandMode==='move';if(moving){if(selectedUnit?.team===0&&selectedUnit.hp>0&&!selectedUnit.retreated&&(!selectedUnit.guardPost||s.battle?.wallWalkEnabled)){const nav=detailNav();const wallOrder=orderWallMove(s.battle,selectedUnit,p,nav);if(wallOrder){say(wallOrder.error||'Sõdurid liiguvad müürikäigule.');renderUI();save();return;}if(selectedUnit.guardPost)return say('Vali ühendatud müürikäik.');const target=nav.nearest(p,6);if(!target||!nav.route(selectedUnit,target))return say('Üksus ei pääse sinna.');const actual=s.battle?selectedUnit:deploymentFor(s,activeTile,selectedUnit.source,s.units[selectedUnit.source]);actual.target=target;actual.attackTargetSource=null;actual.advance=false;actual.manualOrder=true;}else if(a&&selectedMover===a.id&&!s.battle){const target={x:Math.round(p.x),z:Math.round(p.z)},error=game.siteRule(a,target);if(error)return say(error);if(!game.nav(a).route(a,target))return say('Asunik ei pääse sinna.');a.localTarget=target}else return say('Vali esmalt sellel detailkaardil oma üksus.');commandMode='select';say('Liikumiskäsk antud.');renderUI();save();return}
const dc=Math.floor((p.x+75)/150),dr=Math.floor((p.z+65)/130);if((dc||dr)&&!s.battle){const c=activeTile.c+dc,r=activeTile.r+dr;if(c>=0&&r>=0&&c<COLS&&r<ROWS)openTile(game.cell({c,r}));return}const hitWall=city?.team===0&&!s.battle&&city.economy.buildings.find(b=>WALL_TYPES.has(b.type)&&dist(b,p)<3.5);if(hitWall){inspectBuilding(hitWall);return}const hitMan=s.battle?.squads.filter(u=>!u.reserve&&!u.retreated).flatMap(u=>(u.men||[]).filter(m=>m.hp>0&&!m.escaped).map(m=>({u,m,d:dist(m,p)}))).filter(q=>q.d<(q.m.radius||.34)+1).sort((a,b)=>a.d-b.d)[0];const unit=hitMan?.u||(s.battle?.squads||inspection()).find(u=>u.hp>0&&!u.reserve&&!u.retreated&&dist(u,p)<4);selectedSoldierId=hitMan?.m.id??null;if(unit){selectedBuilding=null;selectedUnit=unit;selectedMover=null;selectedShip=null;armySelected=false;renderUI();return}if(a&&dist(a,p)<4){selectedUnit=null;selectedBuilding=null;selectedMover=a.id;renderUI();return}if(city){const b=city.economy.buildings.filter(b=>!b.virtual)
 .map(b=>({b,d:dist(b,p)})).sort((a,b)=>a.d-b.d)
 .find(({b})=>Math.abs(p.x-b.x)<4.4&&Math.abs(p.z-b.z)<4.2)?.b;
 if(b){inspectBuilding(b);return}}selectedUnit=null;selectedBuilding=null;selectedMover=null;renderUI()}
$('world').onpointerup=e=>{if(e.pointerType==='touch'){touchPointers.delete(e.pointerId);if(touchPointers.size<2)pinch=null;if(pinchConsumed){drag=null;if(!touchPointers.size)pinchConsumed=false;return}}if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;if(moved||inputBlocked())return;if(view==='local'&&e.button!==2&&!mode&&commandMode==='select'&&!s.battle){
  const b=pickBuilding(e);if(b&&inspectBuilding(b))return;
 }
 const p=pick(e);if(!p)return;if(view==='world'){const at=cellAt(p.x,p.z);if(!at)return;let hit=null;const hits=ray.intersectObjects([...worldMarkers.values()].filter(m=>m.visible&&m.userData.type),true);if(hits.length){let root=hits[0].object;while(root&&!root.userData.type)root=root.parent;if(root)hit=root.userData}worldClick(game.cell(at),hit,e.button===2)}else localClick(p,e.button===2)};
$('world').oncontextmenu=e=>e.preventDefault();$('world').onpointercancel=e=>{touchPointers.delete(e.pointerId);if(touchPointers.size<2)pinch=null;drag=null;if(!touchPointers.size)pinchConsumed=false};
function applyZoom(next){zoom=Math.max(view==='world'?150:22,Math.min(view==='world'?9000:s.battle?2800:300,next))}
$('world').onwheel=e=>{e.preventDefault();if(inputBlocked())return;applyZoom(zoom+e.deltaY*(view==='world'?.5:.04))};
$('hud-zoom-in').onclick=()=>{if(!inputBlocked())applyZoom(zoom/1.15)};
$('hud-zoom-out').onclick=()=>{if(!inputBlocked())applyZoom(zoom*1.15)};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{if(b.dataset.tab==='help'){$('help').hidden=false;return}tab=b.dataset.tab;cityTab='build';mode=null;renderUI()};$('selectsettler').onclick=()=>{commandMode='select';selectedShip=null;selectedTrade=null;const a=s.settlers.find(a=>a.team===0);if(!a)return say('Värba linnas uus asunik.');selectedTrade=null;selectedMover=a.id;armySelected=false;chosen=game.cell(a);renderUI();say('Asunik valitud. Liikumiseks vajuta M või paremklõpsa sihtkohta.')};$('selectarmy').onclick=()=>{commandMode='select';if(s.armies[0].embarked!=null){selectedTrade=null;selectedShip=s.armies[0].embarked;selectedMover=null;armySelected=false;renderUI();return say('Armee on transpordilaeval. Vali mereruut või kõrvalolev kallas.')}selectedShip=null;if(!s.units.some(u=>u.team===0&&u.hp>0))return say('Värba esmalt sõdalasi.');selectedTrade=null;selectedMover=null;armySelected=true;chosen=game.cell(s.armies[0]);renderUI();say('Armee valitud. Liikumiseks vajuta M või paremklõpsa sihtkohta.')};function toggleResourceLayer(){if(hasSelectedSettler()){resourceDetailsOpen=!resourceDetailsOpen;renderUI();return}manualResourceOverlay=!manualResourceOverlay;resourceDetailsOpen=manualResourceOverlay;try{localStorage.setItem('kingdoms-resource-layer',manualResourceOverlay?'1':'0')}catch{}syncResourceLayer();renderUI()}
$('resourceoverlay').onclick=()=>{if(hasSelectedSettler()){resourceDetailsOpen=!resourceDetailsOpen;renderUI()}else toggleResourceLayer()};
$('hud-resource-toggle').onclick=toggleResourceLayer;
$('hud-city-collapse').onclick=()=>{document.body.classList.remove('hud-city-open','hud-queue-open');renderTileResourceHUD()};
$('hud-queue-toggle').onclick=()=>{const open=document.body.classList.toggle('hud-queue-open');$('hud-queue-toggle').setAttribute('aria-pressed',String(open))};
$('hud-explore').onclick=()=>toggleExploreMenu();
$('hud-explore-close').onclick=()=>toggleExploreMenu(false);
$('hud-explore-select').onclick=()=>{
 const a=explorerArmy();if(!a)return say('Avastajat ei ole.');
 selectedArmyId=a.id||0;selectEntity('army',a);openWorld();
 const p=center(a.c,a.r);focus.set(p.x,0,p.z);
 toggleExploreMenu(false);renderUI();
};
$('hud-explore-auto').onclick=()=>{
 const a=explorerArmy();if(!a)return say('Avastajat ei ole.');
 selectedArmyId=a.id||0;selectedMover=null;armySelected=true;
 $('autoexplore').click();updateExploreUI();
};
$('hud-explore-tile').onclick=()=>{if(view==='world'&&game.seen(0,chosen)){toggleExploreMenu(false);openTile(chosen)}else say('Vali avastatud maailmaruut.')};
$('autoexplore').onclick=()=>{const army=activeArmy();if(!armyUnits(s,army).some(u=>u.kind==='scout'))return say('Automaatne avastamine vajab avastajat.');army.autoExplore=!army.autoExplore;if(army.autoExplore){army.path=[];army.travelClock=0;selectedMover=null;selectedShip=null;armySelected=true;commandMode='select';chosen=game.cell(army);say('Avastaja uurib nüüd iseseisvalt tundmatut maad ja leiukohti.')}else{army.path=[];say('Automaatne avastamine peatatud.')}renderUI();save()};$('inspecttile').onclick=()=>openTile(chosen);$('maptoggle').onclick=()=>{if(s.battle&&!s.battle.result)return say('Lõpeta esmalt lahing.');toggleExploreMenu(false);openWorld()};
$('hud-city').onclick=()=>{if(view==='world')$('opencity').click();if(view==='local'&&activeCity()){setCityTab('info');document.body.classList.add('hud-city-open')}else if(view==='world')say('Vali kõigepealt oma linn.')};
$('hud-army').onclick=()=>{if(view==='world')$('opencity').click();if(view==='local'&&activeCity()){setCityTab('build');tab='army';renderUI();document.body.classList.add('hud-city-open')}else say('Sõjaväe värbamiseks raja esmalt linn.')};
$('hud-build').onclick=()=>{if(view==='world')$('opencity').click();if(view==='local'&&activeCity()){setCityTab('build');tab='build';renderUI();document.body.classList.add('hud-city-open')}else say('Ehitamiseks raja esmalt linn.')};$('opencity').onclick=()=>{const city=ownCity(),a=s.settlers.find(a=>a.team===0);if(city)openTile(game.cell(city));else if(a){chosen=game.cell(a);openTile(chosen)}};$('viewenemy').onclick=()=>{const c=s.cities.find(c=>c.team!==0&&game.visibleNow(0,c))||s.settlers.find(a=>a.team!==0&&game.visibleNow(0,a));if(c)openTile(game.cell(c));else say('Vastast pole veel avastatud. Saada avastaja.');};$('attackcity').onclick=()=>{
 const target=game.cityAt(chosen)?.team!==0?game.cityAt(chosen):null;
 const city=target||s.cities.find(c=>c.team!==0&&game.seen(0,c))
  ||s.settlers.find(a=>a.team!==0&&game.seen(0,a));
 if(!city)return say('Vastast pole veel avastatud. Saada avastaja või laev.');
 const unit=armySelected?activeArmy():activeArmies(s,0).sort((a,b)=>armyUnits(s,b).length-armyUnits(s,a).length)[0];
 if(!unit||armyUnits(s,unit).length<2)return say('Vali päris sõjavägi, mitte üksik avastaja.');
 setRelation(s,0,city.team,'war');const path=game.landPath(unit,city,0);
 if(path){
  unit.path=path;unit.autoExplore=false;selectedShip=null;commandMode='select';selectedMover=null;armySelected=true;
  say('Armee marsib valitud vastase linna.');renderUI();save();return;
 }
 const transport=s.ships.find(sh=>sh.team===0&&sh.hp>0&&sh.kind==='transport'&&sh.cargo?.kind==='army'&&(sh.cargo.armyId||0)===(unit.id||0));
 if(transport&&navyExpedition(game,transport,unit,city)){say('Valitud armee alustab meritsi sõjaretke.');renderUI();save();return}
 say('Maismaateed pole. Ehita rannikule sadam ja transpordilaev, laadi valitud armee ning anna merereisi käsk.');
};
$('foundcity').onclick=()=>{const a=settlerHere();if(!a)return;const r=game.found(a.id);if(r.error)return say(r.error);selectedMover=null;chosen=game.cell(r.city);openTile(chosen);save();say('Linn on rajatud. Ava tehnoloogiapuu ja vali jahipidamine, kalapüük või kivitöö.')};$('research').onclick=openResearch;$('attackall').onclick=()=>{};$('retreat').onclick=()=>{if(s.battle&&!s.battle.result){for(const u of s.battle.squads.filter(u=>u.team===0&&u.hp>0&&!u.retreated))orderArmyWithdrawal(s.battle,u);renderUI();return say('Armee taandub. Mehed lahkuvad alles punase joone taha jõudes.');}if(s.battle){applyBattle();s.battle=null;}openWorld();save()};
$('menubtn').onclick=()=>{toggleExploreMenu(false);slotUI();cameraKeys.clear();menuOpen=true;$('commandhud').hidden=true;$('startmenu').hidden=false};$('continue').onclick=()=>{menuOpen=false;$('startmenu').hidden=true;if(sampleDemo&&!s.battle){const c=s.cities.find(c=>c.team===0);if(c)openTile(game.cell(c));}renderCommandHUD()};$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ'};$('zin').onclick=()=>applyZoom(zoom-(view==='world'?100:8));$('zout').onclick=()=>applyZoom(zoom+(view==='world'?100:8));$('home').onclick=()=>{const a=view==='world'?center(chosen.c,chosen.r):{x:0,z:0};focus.set(a.x,0,a.z)};$('closehelp').onclick=()=>$('help').hidden=true;$('reset').onclick=()=>{menuOpen=true;$('help').hidden=true;$('startmenu').hidden=false};$('newgame').onclick=()=>{const raw=$('seed').value.trim(),seed=raw?Array.from(raw).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0):Math.floor(Math.random()*2147483647);try{restarting=true;$('newgame').disabled=true;$('menu-status').hidden=false;$('menu-status').textContent=currentLanguage()==='en'?'Generating world…':'Maailma loomine…';const ns=createGame(seed,$('maptype').value);ns.difficulty=$('difficulty')?.value||'normal';ns.tempo='normal';replaceProtectedGame(localStorage,JSON.stringify(ns),validState);sessionStorage.setItem('kingdoms-civ-start','1');if(sampleDemo)location.replace(location.pathname);else location.reload()}catch{restarting=false;$('newgame').disabled=false;$('menu-status').textContent=currentLanguage()==='en'?'Could not save the new world. Export your save and check browser storage.':'Uut maailma ei saanud salvestada. Ekspordi mäng ja kontrolli brauseri salvestusruumi.';}};
function openResearch(){$('researchpanel').hidden=false;renderUI();$('closeresearch').focus?.()}
function chooseResearch(id){const result=game.research(0,id);say(result.error||'Uurimine algas: '+TECHS[id].name+' · '+Math.round(researchCost(s,TECHS[id]))+' teaduspunkti.');renderUI();save()}
$('techtoggle').onclick=openResearch;$('researchstatus').onclick=openResearch;$('closeresearch').onclick=()=>{$('researchpanel').hidden=true;$('techtoggle').focus?.()};$('pauseresearch').onclick=()=>{s.research[0].paused=!s.research[0].paused;renderUI();save()};
function queueTechnology(id){const r=game.queueResearch(0,id);say(r.error||'Järjekorras: '+TECHS[id].name);renderUI();save()}
function removeTechnology(id){const r=s.research[0];r.queue=r.queue.filter(t=>t!==id);const planned={known:[...r.known,...(r.active?[r.active]:[])]};r.queue=r.queue.filter(t=>{if(techBlock(planned,t))return false;planned.known.push(t);return true});renderUI();save()}
function applyQuality(){villageLife.clear();renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?.85:quality==='medium'?1.15:1.6));renderer.shadowMap.enabled=quality!=='low';$('quality').textContent='Graafika: '+({low:'säästlik',medium:'keskmine',high:'kõrge'}[quality]);for(const[key,model]of unitModels)if(key.startsWith('unit:')){people.remove(model);unitModels.delete(key)}try{localStorage.setItem('kingdoms-quality',quality)}catch{}}
$('quality').onclick=()=>{quality=quality==='high'?'medium':quality==='medium'?'low':'high';applyQuality();say($('quality').textContent)};
function updateGhost(){const city=activeCity();if(view!=='local'||!mode||!city||city.team!==0||s.battle){if(ghost)ghost.visible=false;$('buildhint').hidden=true;return}const key=mode+':'+game.buildingAge(0,mode);if(!ghost||ghostKey!==key){if(ghost){localObjects.remove(ghost);ghost.traverse(o=>o.material?.dispose())}ghost=townBuildingModel(mode,0,game.buildingAge(0,mode));ghost.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.48;o.material.depthWrite=false}});ghostKey=key;localObjects.add(ghost)}if(!ghostPoint){ghost.visible=false;$('buildhint').hidden=false;$('buildhint').textContent='Valitud: '+BUILDINGS[mode].name+' · puuduta ehituskohta';return}const check=game.previewInArea(city,mode,ghostPoint);ghost.visible=true;const snapped=check.p||check.point||ghostPoint,offset=check.ctx?{x:(check.ctx.c-activeTile.c)*150,z:(check.ctx.r-activeTile.r)*130}:{x:0,z:0};ghost.position.set(snapped.x+offset.x,check.baseY??(check.ctx?ground(game.cell(check.ctx),snapped.x,snapped.z):ground(activeTile,snapped.x,snapped.z)),snapped.z+offset.z);ghost.rotation.y=check.shoreAngle??(WALL_TYPES.has(mode)&&wallAxis?Math.PI/2:0);ghost.traverse(o=>{if(o.material)o.material.color.set(check.error?'#c26757':'#9fc877')});$('buildhint').hidden=false;$('buildhint').textContent=check.error||BUILDINGS[mode].name+' · sobiv koht';$('buildhint').classList.toggle('invalid',!!check.error)}
function renderCityHealth(){const city=activeCity();$('cityhealth').hidden=!city;if(!city)return;const parent=game.parentCity(city),area=game.constructionArea(city),radius=game.radius(parent);const r=city.economy.realms[city.team],foodNeed=Math.round(r.pop*FOOD_PER_RESIDENT*100)/100,waterNeed=Math.round(r.pop*WATER_PER_RESIDENT*100)/100,capacity=housingCapacity(game.allBuildings(city)),waiting=area.buildings.filter(b=>b.status?.startsWith('Ootab')||b.status?.includes('napib')||b.status?.includes('pole ligipääsetavat')).length;let text='Elanikke '+r.pop+'/'+capacity+' · kasvu edenemine '+Math.round(100*(r.growthProgress||0)/Math.max(1,r.growthNeed||4))+'% · toiduhoidla '+Math.floor(game.storageUsed(city,'bread',r.resources))+'/'+game.storageCap(city,'bread')+' · vesi '+Math.floor(r.resources.water)+'/'+game.storageCap(city,'water')+' · vett '+Math.floor(r.resources.water)+' / '+waterNeed+' min · '+(r.housingShortage?'⚠ Elamute varustus puudub · ':'')+'Toitu '+Math.floor(foodTotal(r.resources))+' · toitu '+foodNeed+'/min · töötab '+(Math.round((r.employed||0)*100)/100)+'/'+r.pop+' inimest';if(foodTotal(r.resources)<foodNeed*2)text+=' · ⚠ Toiduvaru on madal';if(waiting)text+=' · ⚠ '+waiting+' hoonet ootab';text+=' · töökojad +'+Math.round((game.bonus(city.team)-1)*100)+'% · ühine ehitusala '+area.tiles.length+' ruutu · ehitusjärjekord '+area.pending.length+'/12'+(radius<4?' · järgmine laienemine '+({1:32,2:48,3:64}[radius])+' elanikuga':'');text+=' · Maastik: '+game.terrainText(city);const happiness=cityNeeds(parent,s.ages[parent.team]);text+=' · Vajadused: toit '+happiness.foods.length+'/'+happiness.need.food+', luksus '+happiness.luxuries.length+'/'+happiness.need.luxury+' · tootlikkus '+Math.round(happiness.productivity*100)+'%';text+=' · Kaubandus: '+(parent.tradeDisabled?'peatatud':s.shipments.filter(c=>c.to===parent.id||c.from===parent.id).length+' saadetist teel');
if(s.ages[city.team]>=5)text+=' · Raudteeühendusi '+Object.values(s.railLinks||{}).filter(l=>l.from===parent.id||l.to===parent.id).length;
if(s.ages[city.team]>=6)text+=' · Õhuvedusid teel '+s.shipments.filter(c=>c.mode==='air'&&(c.from===parent.id||c.to===parent.id)).length;if(city.districtOf!=null)text+=' · sama linna ühine ehitusala';$('cityhealth').textContent=text;if(selectedBuilding&&city.economy.buildings.includes(selectedBuilding)){$('selection').textContent=game.buildingName(city.team,selectedBuilding.type);$('detail').textContent=selectedBuilding.ready?(selectedBuilding.status||'Valmis')+(selectedBuilding.type==='house'?' · 3 elanikukohta · 0,6 toitu ja 0,45 vett elaniku kohta minutis':' · '+BUILDINGS[selectedBuilding.type].workers+' töölist · '+Math.round((selectedBuilding.efficiency??1)*100)+'%')+(BUILDINGS[selectedBuilding.type].out?' · toodang: '+BUILDINGS[selectedBuilding.type].rate+' '+RESOURCE_NAMES[BUILDINGS[selectedBuilding.type].out]+' / töötsükkel (4,5× aeglasem)':''):((selectedBuilding.materialsRemaining||0)>0?'Materjale tuleb tuua: '+Math.ceil(selectedBuilding.materialsRemaining)+' ühikut · ':'')+'Ehitus '+Math.floor(100*(selectedBuilding.progress||0)/game.constructionTime(selectedBuilding.type))+'% · '+timeLabel((game.constructionTime(selectedBuilding.type)-(selectedBuilding.progress||0))/(selectedBuilding.efficiency||0));if(city.team===0&&selectedBuilding.ready&&selectedBuilding.type!=='hall')button($('actions'),selectedBuilding.disabled?'▶ Jätka tööd':'Ⅱ Peata töö',()=>{game.toggleBuilding(city,selectedBuilding);renderUI();save()})}else if(selectedUnit&&selectedUnit.hp>0){$('selection').textContent=TROOPS[selectedUnit.kind].name;$('detail').textContent=Math.ceil(selectedUnit.hp)+' / '+Math.round(selectedUnit.maxHp||TROOPS[selectedUnit.kind].hp)+' tervist · '+UNIT_GRADES[selectedUnit.grade||'standard'].name+' · LVL '+(selectedUnit.source>=0?s.units[selectedUnit.source]?.armyLevel||1:1)+(selectedUnit.target?' · liigub':' · ootab');button($('actions'),'■ Peatu',stopSelected)}}
function showJournal(){$('journalpanel').hidden=false;const list=$('journalentries');list.innerHTML='';const events=[...(s.events||[])];for(const c of s.cities.filter(c=>c.team===0))for(const e of c.economy.realms[0].log||[])events.push({time:e.time+(c.foundedAt||0),text:c.name+' · '+e.text});for(const e of events.sort((a,b)=>b.time-a.time).slice(0,60)){const p=document.createElement('p');p.textContent='Käik '+(Math.floor(e.time/60)+1)+' · '+e.text;list.append(p)}}
$('journal').onclick=showJournal;$('closejournal').onclick=()=>{$('journalpanel').hidden=true};
// The minimap base layer is expensive (36,300 world cells). Cache it, and
// redraw only the viewport/highlight during camera movement. V64 world FPS fix.
const overviewBase=document.createElement('canvas');overviewBase.width=COLS*2;overviewBase.height=ROWS*2;
const overviewBaseCtx=overviewBase.getContext('2d');let overviewBaseStamp='',overviewBaseDraws=0,overviewOverlayDraws=0;
function drawOverview(){
 const canvas=$('atlasminimap'),ctx=canvas.getContext('2d');
 const stamp=[chosen.c,chosen.r,view,Math.round(focus.x/25),Math.round(focus.z/25),Math.round(zoom)].join(':');
 game.refreshTerritory(); // one territory lookup per repaint, never per tile
 const baseStamp=[s.visionRevision||0,s.roadRevision||0,s.railRevision||0,game.territoryStamp,s.cities.map(c=>c.id+':'+c.team+':'+c.c+':'+c.r).join(','),(s.landmarks||[]).map(l=>l.claimedBy==null?'0':'1').join('')].join('|');
 if(baseStamp!==overviewBaseStamp){
  overviewBaseStamp=baseStamp;overviewBaseDraws++;
  const base=overviewBaseCtx;
  base.fillStyle='#1f5368';base.fillRect(0,0,COLS*2,ROWS*2);
  for(const c of game.cells){
   const seen=game.seen(0,c),owner=game.territory.get(c.c+':'+c.r);
   base.fillStyle=!seen?'#c9b68f':owner?(['#83b4a1','#af7d62','#9b82bb','#c3aa62'][owner.team]):!c.land?'#2a697b':c.river?(c.bridge?'#7ba5ad':c.ford?'#6ea4be':'#5490ad'):c.biome==='forest'?'#65804f':c.biome==='hills'?'#b0ac91':'#a6b577';
   base.fillRect(c.c*2,c.r*2,2,2);
   // Fish shoals are represented in real seawater, not on land.
   if(seen&&!c.land&&c.deposits.fish&&game.noise(c.c*17,c.r*19)>.80){base.fillStyle=c.fishDepth<=2?'#8dd3ce':'#c0c6e4';base.fillRect(c.c*2+.7,c.r*2+.7,.95,.95)}
  }
  base.strokeStyle='rgba(97,77,42,.25)';
  for(const c of game.cells){if(game.seen(0,c)||game.noise(c.c*9+4,c.r*7+8)<.985)continue;
   base.beginPath();if(!c.land){base.moveTo(c.c*2+.2,c.r*2+1.3);base.quadraticCurveTo(c.c*2+1,c.r*2+.3,c.c*2+1.8,c.r*2+1.3)}
   else if(c.mountain){base.moveTo(c.c*2+.2,c.r*2+1.7);base.lineTo(c.c*2+1,c.r*2+.3);base.lineTo(c.c*2+1.8,c.r*2+1.7)}
   else base.arc(c.c*2+1,c.r*2+1,.55,0,Math.PI*2);base.stroke();
  }
  for(const key of Object.keys(s.worldRoads||{})){
   const[a,b]=roadPoints(key),level=roadLevel(roadStrength(s,a,b,s.time));
   if(!level||!game.seen(0,a)||!game.seen(0,b))continue;
   base.strokeStyle=['','#a57941','#bc995f','#dac18c','#eadbc1'][level];base.lineWidth=level>=3?3:level===2?2.4:1.8;
   base.beginPath();base.moveTo(a.c*2+1,a.r*2+1);base.lineTo(b.c*2+1,b.r*2+1);base.stroke();
  }
  for(const key of Object.keys(s.railEdges||{})){
   const[a,b]=roadPoints(key);if(!game.seen(0,a)||!game.seen(0,b))continue;
   base.strokeStyle='#36424a';base.lineWidth=2;base.beginPath();base.moveTo(a.c*2+1,a.r*2+1);base.lineTo(b.c*2+1,b.r*2+1);base.stroke();
  }
  for(const city of s.cities){if(city.team!==0&&!game.seen(0,city))continue;
   base.fillStyle=['#e9dfad','#ed9c7e','#c2a4ea','#f0d16f'][city.team];base.fillRect(city.c*2,city.r*2,3,3);
  }
  for(const l of s.landmarks||[]){if(!game.seen(0,l))continue;
   base.fillStyle=l.claimedBy==null?(l.kind==='village'?'#ebc16a':'#c0a4df'):'#9e997f';
   base.beginPath();base.arc(l.c*2+1,l.r*2+1,2.2,0,Math.PI*2);base.fill();
  }
 }
 if(stamp===lastOverviewStamp&&baseStamp===drawOverview.lastBaseStamp)return;
 lastOverviewStamp=stamp;drawOverview.lastBaseStamp=baseStamp;overviewOverlayDraws++;
 if(canvas.width!==COLS*2||canvas.height!==ROWS*2){canvas.width=COLS*2;canvas.height=ROWS*2}
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(overviewBase,0,0);
 ctx.strokeStyle='#f4d488';ctx.lineWidth=2;ctx.strokeRect(chosen.c*2,chosen.r*2,2,2);
 if(view==='world'){
  const w=zoom*camera.aspect*.55/25,h=zoom*.55/25;
  ctx.strokeStyle='#d9eee1';ctx.lineWidth=1;
  ctx.strokeRect((focus.x-ORIGIN_X)/25-w/2,(focus.z-ORIGIN_Z)/25-h/2,w,h);
 }
}
function overviewMetrics(){return {baseDraws:overviewBaseDraws,overlayDraws:overviewOverlayDraws}}
$('atlasminimap').onpointerdown=e=>{const at=minimapCell(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect(),COLS,ROWS);if(!at)return;if(view!=='world'){if(s.battle&&!s.battle.result)return say('Lõpeta lahing või tagane enne maailmakaardile liikumist.');openWorld()}chosen=game.cell(at);focus.set(chosen.x,0,chosen.z);renderUI()};
const commandOverlay=new CommandVisuals(worldScene,localScene);
function inputBlocked(){return menuOpen||document.hidden||!$('help').hidden||!$('researchpanel').hidden||!$('journalpanel').hidden}
function currentSelection(){if(view==='local'){if(selectedUnit?.hp>0){const unit=(s.battle?.squads||[...inspection(),...(peacefulGarrisons.get(activeCity())?.squads||[])]).find(u=>u.source===selectedUnit.source&&u.hp>0&&!u.retreated);if(!unit)return null;selectedUnit=unit;if(unit.men?.find(m=>m.id===selectedSoldierId)?.escaped)selectedSoldierId=null;return {entity:unit,man:unit.men?.find(m=>m.id===selectedSoldierId),name:(TROOPS[unit.kind]?.name||'Üksus')+(unit.men?.some(m=>m.id===selectedSoldierId)?' · mees '+((unit.men?.findIndex(m=>m.id===selectedSoldierId)??0)+1):''),kind:'unit',movable:unit.team===0&&(!unit.guardPost||s.battle?.wallWalkEnabled),local:true}}const a=settlerHere();if(a&&selectedMover===a.id)return {entity:a,name:'Asunik '+(a.id+1),kind:'settler',movable:true,local:true};if(selectedBuilding)return {entity:selectedBuilding,name:game.buildingName(selectedBuilding.team,selectedBuilding.type),kind:'building',movable:false,local:true};return null}if(selectedShip!==null){const e=s.ships.find(a=>a.id===selectedShip&&a.hp>0);return e?{entity:e,name:SHIPS[e.kind].name,kind:'ship',movable:e.team===0}:null}if(armySelected&&armyUnits(s,activeArmy()).length)return {entity:activeArmy(),name:armyUnits(s,activeArmy()).every(u=>u.kind==='scout')?'Avastaja':activeArmy().id?'Armee '+activeArmy().id:'Peaarmee',kind:'army',movable:activeArmy().embarked==null};const a=s.settlers.find(a=>a.id===selectedMover);if(a)return {entity:a,name:'Asunik '+(a.id+1),kind:'settler',movable:a.embarked==null};const e=s.shipments.find(a=>a.id===selectedTrade);return e?{entity:e,name:'Varuvedu',kind:'trade',movable:false}:null}
function renderFormationControls(q){let box=$('commandtactics');if(!box){box=document.createElement('div');box.id='commandtactics';const row=document.createElement('div'),label=document.createElement('label'),select=document.createElement('select'),help=document.createElement('small');row.className='tactic-row';label.textContent='Rivistus';label.htmlFor='formation-select';select.id='formation-select';select.setAttribute('aria-label','Salga lahingurivistus');select.onchange=()=>{const chosen=currentSelection();if(!s.battle||chosen?.kind!=='unit'||chosen.entity.team!==0)return;const unit=chosen.entity;if(select.value==='auto'){unit.formationManual=false;delete unit.fixedFacing;}else setFormation(unit,select.value,TROOPS,s.battle.elapsed,true);renderCommandHUD();save();};row.append(select);for(const [text,delta,title]of [['↶',-Math.PI/4,'Pööra rivi vasakule 45°'],['↷',Math.PI/4,'Pööra rivi paremale 45°']]){const button=document.createElement('button');button.textContent=text;button.title=title;button.setAttribute('aria-label',title);button.onclick=()=>{const chosen=currentSelection(),u=chosen?.entity;if(!s.battle||chosen?.kind!=='unit'||u.team!==0||u.routing)return;u.fixedFacing=(u.fixedFacing??u.heading??0)+delta;u.formationManual=true;u.formationProgress=0;u.formationStrength=0;u.anchor={x:u.x,z:u.z};renderCommandHUD();save();};row.append(button);}help.id='formation-help';const modeRow=document.createElement('div'),modeLabel=document.createElement('label'),modeSelect=document.createElement('select'),modeHelp=document.createElement('small');
 modeRow.className='combat-mode-row';modeLabel.textContent='Juhtimine';modeLabel.htmlFor='battle-control-mode';modeSelect.id='battle-control-mode';modeSelect.setAttribute('aria-label','Valitud salga lahingujuhtimine');
 for(const [value,name] of [['auto','Automaatne'],['manual','Manuaalne']]){const opt=document.createElement('option');opt.value=value;opt.textContent=name;modeSelect.append(opt);}
 modeSelect.onchange=()=>{const chosen=currentSelection(),unit=chosen?.entity;if(!s.battle||chosen?.kind!=='unit'||unit.team!==0||unit.routing||s.battle.result)return;
   unit.combatMode=modeSelect.value==='manual'?'manual':'auto';unit.attackTargetSource=null;unit.target=null;unit.manualOrder=false;
   unit.anchor={x:unit.x,z:unit.z};unit.advance=unit.combatMode==='auto';
   if(unit.combatMode==='auto'&&unit.formation==='hold')setFormation(unit,'line',TROOPS,s.battle.elapsed,false);
   if(unit.source>=0&&s.units[unit.source])s.units[unit.source].combatMode=unit.combatMode;
   renderCommandHUD();save();
 };
 modeHelp.id='combat-mode-help';modeRow.append(modeLabel,modeSelect);
 const craft=document.createElement('div'),craftTitle=document.createElement('strong'),craftButtons=document.createElement('div'),craftHelp=document.createElement('small');
 craft.id='siege-craft';craftTitle.textContent='Piiramisvahendid';craftButtons.className='siege-craft-buttons';craftHelp.id='siege-craft-progress';
 for(const kind of ['ladder','tower','ram','sap','camp']){const spec=SIEGE_CRAFT[kind],btn=document.createElement('button');btn.type='button';btn.dataset.siegeKind=kind;btn.textContent=(kind==='ladder'?'🪜 ':'♜ ')+spec.name+' · '+spec.wood+' puitu · '+(spec.duration===120?'2 min':spec.duration+' s');btn.onclick=()=>{const q=currentSelection(),unit=q?.entity;if(!s.battle||q?.kind!=='unit'||unit.team!==0)return;const answer=startSiegeCraft(s.battle,unit,kind,s,game.battleNavigation());say(answer.error||spec.name+' ehitus algas · '+spec.wood+' puitu kulus.');renderCommandHUD();save();};craftButtons.append(btn);}
 craft.append(craftTitle,craftButtons,craftHelp);
 box.append(label,row,help,modeRow,modeHelp,craft);$('commandhud').append(box);}
 const u=q?.entity,show=!!s.battle&&q?.kind==='unit'&&u.team===0&&!u.guardPost&&!u.reserve;box.hidden=!show;if(!show)return;const select=$('formation-select'),choices=formationOptions(u,TROOPS),stamp=u.source+':'+choices.join(',');if(box.dataset.stamp!==stamp){select.replaceChildren();const auto=document.createElement('option');auto.value='auto';auto.textContent='Automaatne';select.append(auto);for(const id of choices){const option=document.createElement('option');option.value=id;option.textContent=id==='shield_wall'&&TROOPS[u.kind].age===1?'Kilbirivi':FORMATIONS[id].name;select.append(option);}box.dataset.stamp=stamp;}if(document.activeElement!==select)select.value=u.formationManual?(u.formation||'line'):'auto';const disabled=!!s.battle.result||u.routing;select.disabled=disabled;for(const b of box.querySelectorAll('button'))b.disabled=disabled;const modeSelect=$('battle-control-mode');if(document.activeElement!==modeSelect)modeSelect.value=u.combatMode==='manual'?'manual':'auto';modeSelect.disabled=disabled;$('combat-mode-help').textContent=u.combatMode==='manual'?'Manuaalne: ootab liikumis- või ründekäsku.':'Automaatne: otsib ise ründeks või kaitseks sobiva asukoha.';const craft=$('siege-craft'),canCraft=!disabled&&s.ages[u.team]>=1&&u.team!==s.battle?.fortress?.team&&['melee','ranged'].includes(TROOPS[u.kind]?.role||(['scout','militia'].includes(u.kind)?'none':'melee'))&&!['scout','militia'].includes(u.kind);
 craft.hidden=!s.battle?.fortress||u.team===s.battle.fortress.team||s.ages[u.team]<1;
 if(!craft.hidden){const busy=(s.battle.siegeWorks||[]).find(w=>w.ownerSource===u.source&&!w.destroyed&&(!w.arrived||['ram','sap'].includes(w.kind))),last=[...(s.battle.siegeWorks||[])].reverse().find(w=>w.ownerSource===u.source);
 for(const btn of craft.querySelectorAll('button')){btn.hidden=!!craftError(s,u.team,btn.dataset.siegeKind);btn.disabled=!canCraft||!!busy||availableSiegeWood(s,u.team)<SIEGE_CRAFT[btn.dataset.siegeKind].wood||(btn.dataset.siegeKind!=='camp'&&!(s.battle.siegeSections||[]).some(w=>w.hp>0))||(btn.dataset.siegeKind==='camp'&&(s.battle.siegeWorks||[]).some(w=>w.kind==='camp'&&w.team===u.team&&!w.destroyed));}
 const supplies=(s.battle.siegeWorks||[]).filter(w=>w.kind==='camp'&&w.team===u.team&&w.ready&&!w.destroyed);
 $('siege-craft-progress').textContent=busy?(busy.ready?SIEGE_CRAFT[busy.kind].name+' valmis · salk lükkab müüri poole':SIEGE_CRAFT[busy.kind].name+' · '+Math.floor(busy.progress)+'/'+busy.duration+' s'):last?.ready?(last.arrived?(last.kind==='camp'?'Laager valmis · +4 kivi/min · vibuküttide laadimine':['ram','sap'].includes(last.kind)?'Töös · meeskond ründab kindlustust':'Valmis · pääs üle müüri avatud'):'Valmis · liigutatakse müürini'):'Lähedalasuva või muu oma linna laos: '+Math.floor(availableSiegeWood(s,u.team))+' puitu';
 if(supplies.length)$('siege-craft-progress').textContent+=' · Laagris '+supplies.reduce((n,w)=>n+(w.stones||0),0)+' kivi · +4/min laagri kohta · vibuküttide laadimine';
 }
 const profile=FORMATIONS[u.formation]||FORMATIONS.line;$('formation-help').textContent=u.routing?'Salk põgeneb.':formationName(u,TROOPS)+(profile.formTime?' · valmis '+Math.round((u.formationStrength||0)*100)+'%':'')+' · '+profile.help;
}
function renderCommandHUD(){const q=currentSelection(),e=q?.entity,goal=q?.local?(e.target||e.localTarget):e?.path?.at(-1);if(!q&&(commandMode==='move'||commandMode==='attack'))commandMode='select';$('commandname').textContent=q?.name||'Vali üksus või ruut';$('commandmode').textContent=mode?'EHITAMINE':commandMode==='move'?'ANNA LIIKUMISKÄSK':commandMode==='attack'?'VALI RÜNNATAV VASTANE':'VALIMINE';$('commandstate').textContent=q?(q.kind==='building'?(e.status||'Valmis'):q.local?((e.hp!=null?Math.ceil(e.hp)+' HP · ':'')+(goal?'Liigub valitud kohta':'Ootab käsku')):'Asukoht '+(e.c+1)+':'+(e.r+1)+(goal?' → '+(goal.c+1)+':'+(goal.r+1)+' · '+(e.path?.length||0)+' ruutu':' · Ootab käsku')):'Klõpsa oma üksusel. Kaardiruutu valides saad avada detailvaate.';$('commandstate').textContent=q?selectionDetails(game,q,TROOPS,SHIPS):'';$('commandhud').classList.toggle('readonly',!!q&&!q.movable);renderFormationControls(q);let explore=$('commandexplore');if(!explore){explore=document.createElement('button');explore.id='commandexplore';explore.onclick=()=>{const army=explorerArmy();if(!army)return;selectedArmyId=army.id||0;armySelected=true;selectedMover=null;selectedShip=null;selectedTrade=null;if(view==='local')openWorld();$('autoexplore').click();};$('commandhud').append(explore);}const scoutArmy=explorerArmy();explore.hidden=!scoutArmy||!!s.battle;explore.textContent=scoutArmy?.autoExplore?'■ Peata selle üksuse avastamine':'🧭 Alusta selle üksuse avastamist';$('commandhint').textContent=mode?'Puuduta ehituskohta · Esc tühistab':commandMode==='move'?'Puuduta sihtkohta · Esc / V tagasi valimisele':commandMode==='attack'?'Puuduta vastase salka · Esc / V tühistab':q?.movable?'M või „Liigu“ → vali siht · paremklõps annab kohe käsu':'WASD / nooled liigutavad kaamerat · + / − suum';$('commandmove').disabled=!q?.movable;const canAttack=!!s.battle&&!s.battle.result&&q?.kind==='unit'&&q.entity.team===0&&(!q.entity.guardPost||s.battle?.wallWalkEnabled)&&!q.entity.reserve&&!q.entity.routing;$('commandattack').hidden=!s.battle;$('commandattack').disabled=!canAttack;$('commandattack').classList.toggle('active',commandMode==='attack');$('commandattack').setAttribute('aria-pressed',String(commandMode==='attack'));$('commandstop').disabled=!q?.movable;$('commandfocus').disabled=!q;$('commandselect').classList.toggle('active',commandMode==='select'&&!mode);$('commandmove').classList.toggle('active',commandMode==='move');$('commandselect').setAttribute('aria-pressed',String(commandMode==='select'&&!mode));$('commandmove').setAttribute('aria-pressed',String(commandMode==='move'));$('commandhud').classList.toggle('ordering',commandMode==='move'||commandMode==='attack');$('world').style.cursor=mode||commandMode==='move'||commandMode==='attack'?'crosshair':'grab';$('commandhud').hidden=menuOpen||(!q&&!mode);}
function setCommandMode(next){if(next==='move'&&!currentSelection()?.movable)return say('Vali esmalt oma üksus.');if(next==='attack'&&(!s.battle||s.battle.result||currentSelection()?.kind!=='unit'||!currentSelection()?.movable))return say('Vali esmalt lahingus oma salk.');commandMode=next;mode=null;hoverPoint=null;updateGhost();renderCommandHUD()}
function stopSelected(){const q=currentSelection();if(!q?.movable)return;const e=q.entity;if(q.local){const actual=q.kind==='unit'&&!s.battle?deploymentFor(s,activeTile,e.source,s.units[e.source]):e;actual.target=null;actual.localTarget=null;actual.attackTargetSource=null;actual.advance=false;actual.manualOrder=false;if(q.kind==='unit'&&s.battle)setFormation(actual,'hold',TROOPS,s.battle.elapsed,true);}else {e.path=[];if(q.kind==='army')e.autoExplore=false;}commandMode='select';renderUI();save()}
function focusSelected(){const q=currentSelection();if(!q)return;const p=q.local?q.entity:center(q.entity.c,q.entity.r);focus.set(p.x,0,p.z)}
function panCamera(x,z){const p=cameraKeys.project(x,z,view==='world');focus.x+=p.x;focus.z+=p.z}
function updateCameraKeys(real){if(inputBlocked()){cameraKeys.clear();return}const p=cameraKeys.step(real,zoom,view==='world');focus.x+=p.x;focus.z+=p.z;if(view==='world'){focus.x=Math.max(ORIGIN_X+25,Math.min(ORIGIN_X+WORLD_WIDTH-25,focus.x));focus.z=Math.max(ORIGIN_Z+25,Math.min(ORIGIN_Z+WORLD_DEPTH-25,focus.z))}else if(s.battle){focus.x=Math.max(BATTLEFIELD.outerMinX,Math.min(BATTLEFIELD.outerMaxX,focus.x));focus.z=Math.max(BATTLEFIELD.outerMinZ,Math.min(BATTLEFIELD.outerMaxZ,focus.z))}}
function updateCommandVisuals(){commandOverlay.update({world:view==='world',game,tile:activeTile,selection:currentSelection(),hover:hoverPoint,moving:commandMode==='move',blocked:inputBlocked(),navigation:view==='local'?detailNav():null,height:(x,z)=>ground(activeTile,x,z)})}
$('commandselect').onclick=()=>setCommandMode('select');$('commandmove').onclick=()=>setCommandMode('move');$('commandattack').onclick=()=>setCommandMode('attack');$('commandstop').onclick=stopSelected;$('commandfocus').onclick=focusSelected;
addEventListener('keydown',e=>{const editing=['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable;if(e.key==='Escape'){cameraKeys.clear();if(document.body.classList.contains('hud-explore-open')){toggleExploreMenu(false);return}if(!$('journalpanel').hidden)$('closejournal').onclick();else if(!$('researchpanel').hidden)$('closeresearch').onclick();else if(!$('help').hidden)$('help').hidden=true;else if(!menuOpen){if(commandMode==='move'||commandMode==='attack'||mode)setCommandMode('select');else{selectedUnit=null;selectedBuilding=null;selectedMover=null;selectedShip=null;selectedTrade=null;armySelected=false;renderUI()}}return}if(cameraKeys.handle(e,true,inputBlocked()||editing||e.ctrlKey||e.metaKey||e.altKey))return;if(inputBlocked()||editing||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const code=e.code||e.key;if(['KeyM','KeyT','KeyV','KeyX','KeyF','KeyG','Enter','Space','Equal','Minus','NumpadAdd','NumpadSubtract','Home'].includes(code))e.preventDefault();if(code==='KeyR'&&view==='local'&&WALL_TYPES.has(mode)){wallAxis=wallAxis?0:1;updateGhost();say('Müüri suund muudetud.');renderUI()}if(code==='KeyM')setCommandMode('move');if(code==='KeyT')setCommandMode('attack');if(code==='KeyV')setCommandMode('select');if(code==='KeyX')stopSelected();if(code==='KeyF')focusSelected();if(code==='KeyG')$('maptoggle').onclick();if(code==='Enter'&&view==='world')openTile(chosen);if(code==='Space')$('pause').onclick();if(code==='Equal'||code==='NumpadAdd')$('zin').onclick();if(code==='Minus'||code==='NumpadSubtract')$('zout').onclick();if(code==='Home')$('home').onclick()});
addEventListener('keyup',e=>cameraKeys.handle(e,false));addEventListener('blur',()=>{cameraKeys.clear();drag=null});

function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)save()});
// Keep towers active only while a real town worker remains assigned.
function refreshBattleTowers(b){
 if(!b?.defensePosts?.length)return;
 const city=s.cities.find(c=>c.id===b.fortress?.cityId);
 for(const post of b.defensePosts){
  if(!Number.isInteger(post.buildingIndex))continue;
  const building=city?.economy.buildings[post.buildingIndex];post.active=!!building&&towerManned(building)&&!b.siegeSections?.some(w=>w.index===post.buildingIndex&&w.hp<=0);if(building&&ballistaUnlocked(s,post.team))post.ballista??=towerBallista(building);else delete post.ballista;
 }
}
let lastAutomaticUI=0;
function refreshAutomaticUI(now){
 const el=document.activeElement,editing=!!el&&(el.matches?.('input,select,textarea')||el.isContentEditable);
 if(!automaticUIRefreshDue(now,lastAutomaticUI,lastMenuRevision!==game.uiRevision,editing))return;
 lastAutomaticUI=now;lastMenuRevision=game.uiRevision;renderUI();
}
function frame(now){requestAnimationFrame(frame);const real=Math.min(.5,Math.max(0,(now-last)/1000));last=now;const dt=menuOpen||paused||document.hidden?0:real;frameDelta=dt;sampleV51FPS(real);let remaining=dt;while(remaining>1e-8){const step=Math.min(.1,remaining);game.tick(step);if(!s.battle){tickDeployments(s,s.units,TROOPS,step,p=>game.nav(p));checkEncounter()}else if(!s.battle.result){refreshBattleTowers(s.battle);planSiegeAI(s.battle,s,game.battleNavigation());tickBattle(s.battle,step,TROOPS,s.ages.map(age=>age>=2?1:0),game.battleNavigation());applyArmyRetreats(game,s.battle);applyBattle();if(s.battle?.result&&!s.battle.squads.some(u=>u.team===0)&&s.battle.fortress?.team!==0)s.battle=null}remaining-=step}if(s.winner!=null&&!s.victoryNotified){s.victoryNotified=true;say(s.winner===0?'Võit! Kõik vastased on alistatud.':'Kaotus! Sinu kuningriik on alistatud.');save();renderUI()}refreshAutomaticUI(now);for(const text of game.discoveryEvents.splice(0))say(text);for(const event of game.researchEvents.splice(0))if(event.team===0){say(event.boost?'⚡ Avastusboonus: '+TECHS[event.id].name+' (+35% teadusest)':'Uuritud: '+TECHS[event.id].name+'! Avatud: '+TECHS[event.id].unlocks);renderUI()}updateCameraKeys(real);followDetail();if(view==='world'){updateSpatialBatches(zoom);worldSync();atlasDecor.group.userData.water.position.y=.72+Math.sin(s.time*.6)*.045;atlasDecor.group.userData.waveLines.position.y=Math.sin(s.time*.5)*.12}else{syncLocal();if(!s.battle)villageLife.update(s.time,frameDelta);updateGhost()}updateCommandVisuals();camera.position.set(focus.x+zoom*(view==='world'?.1:.48),zoom*(view==='world'?.76:.78),focus.z+zoom*(view==='world'?.7:.8));camera.lookAt(focus);renderer.render(view==='world'?worldScene:localScene,camera);if(toastTime>0){toastTime-=real;if(toastTime<=0)$('toast').style.display='none'}$('clock').value=s.time%TURN_SECONDS;saveTimer+=real;uiTimer+=real;if(saveTimer>10&&!menuOpen){saveTimer=0;save()}}
// V51 empire panels and manual saves. No network storage is used.
function renderV51UI(){
 const tips=$('v51tips');if(tips){tips.replaceChildren();for(const item of actionTips(game,0)){const b=document.createElement('button'),small=document.createElement('small');b.textContent=item.text;small.textContent=item.why;b.append(small);b.onclick=()=>{if(item.city){chosen=game.cell(item.city);openTile(chosen)}else openResearch()};tips.append(b)}}
 const rows=$('v51cityrows');if(rows&&!rows.hidden){rows.replaceChildren();for(const city of s.cities.filter(c=>c.team===0)){
  const r=city.economy.realms[0],issues=cityProblems(game,city),pending=game.allBuildings(city).filter(b=>!b.ready&&b.hp>0);
  const b=document.createElement('button');b.textContent='⌂ '+city.name+' · '+r.pop+' el. · '+pending.length+' ehitust · '+(issues[0]?.text||'Töötab');
  b.onclick=()=>{chosen=game.cell(city);openTile(chosen)};rows.append(b);
 }}
 const armies=$('v51armies');if(armies){armies.replaceChildren();
 const intel=knownEnemyCities(game,0).filter(c=>!game.visibleNow(0,c));
 if(intel.length){const heading=document.createElement('p');heading.textContent='Viimati nähtud vastased:';armies.append(heading);for(const info of intel.slice(0,4)){
  const b=document.createElement('button');b.textContent='⚑ '+info.name+' · '+(info.c+1)+':'+(info.r+1)+' · viimati käigul '+(Math.floor(info.lastSeen/60)+1);
  b.onclick=()=>{chosen=game.cell(info);openWorld();focus.set(chosen.x,0,chosen.z);say('Viimane teadaolev asukoht, mitte kinnitatud tänane luure.')};armies.append(b)
 }}for(const a of activeArmies(s,0)){
  const b=document.createElement('button');b.textContent='⚔ '+(a.id?'Armee '+a.id:'Peaarmee')+' · '+armyUnits(s,a).length+' üksust · LVL '+armyLevel(a)+'/10 · XP '+Math.floor(a.xp||0)+'/'+(armyLevel(a)===10?'MAX':xpForLevel(armyLevel(a)+1))+' · '+(a.stance||'liigub')+' · '+(a.c+1)+':'+(a.r+1);
  b.onclick=()=>{selectedArmyId=a.id||0;armySelected=true;selectedShip=null;selectedTrade=null;selectedMover=null;chosen=game.cell(a);openWorld();focus.set(chosen.x,0,chosen.z)};armies.append(b)
 }
 if(armySelected&&armyUnits(s,activeArmy()).length){
  const a=activeArmy(),b=document.createElement('button');b.textContent='⚔ Jaga valitud armee pooleks';b.onclick=()=>{const r=game.splitArmy(a);say(r.error||'Uus armee loodud: '+r.count+' sõdalast.');if(r.army){selectedArmyId=r.army.id;save()}renderUI()};armies.append(b);
  const merge=document.createElement('button');merge.textContent='Ühenda siin olevad armeed';merge.disabled=activeArmies(s,0).filter(g=>g.embarked==null&&g.c===a.c&&g.r===a.r).length<2;merge.onclick=()=>{const r=game.mergeArmies(a);say(r.error||'Armeed ühendatud.');if(r.ok){selectedArmyId=r.army.id||0;save()}renderUI()};armies.append(merge);
  const rally=document.createElement('button');rally.textContent='Koonda oma armeed siia';rally.onclick=()=>{const result=game.rallyArmies(a);say(result.error||'Teel ühendamisele: '+result.ordered+' armeed. Ligipääs puudub: '+result.unreachable+'.');save();renderUI();};armies.append(rally);
  const stance=document.createElement('button');stance.textContent='Positsioon: '+(a.stance==='defend'?'Kaitse':'Liikumine')+' · muuda';stance.onclick=()=>{a.stance=a.stance==='defend'?'move':'defend';if(a.stance==='defend')a.path=[];say(a.stance==='defend'?'Armee hoiab positsiooni':'Armee valmis liikumiskäsuks');save();renderUI()};armies.append(stance)
 }}
}
$('v51citiestoggle').onclick=()=>{const list=$('v51cityrows');list.hidden=!list.hidden;renderV51UI()};
const V51_SLOT_PREFIX='kingdoms-v51-slot-';
function snapshotV51(){const districtEconomies=new Set(s.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));return JSON.stringify(s,function(key,value){return districtEconomies.has(this)&&['realms','resources'].includes(key)?undefined:value})}
function slotUI(){const root=$('v51slots');root.replaceChildren();for(let i=1;i<=3;i++){
 const row=document.createElement('div');row.className='v51slot';const text=document.createElement('span'),stored=localStorage.getItem(V51_SLOT_PREFIX+i);
 let turns='Tühi';if(stored)try{const j=JSON.parse(stored);turns='Käik '+(Math.floor(j.time/60)+1)}catch{turns='Vigane'}text.textContent=i+'. '+turns;row.append(text);
 const saveButton=document.createElement('button');saveButton.textContent='Salvesta';saveButton.disabled=sampleDemo;saveButton.onclick=()=>{try{localStorage.setItem(V51_SLOT_PREFIX+i,snapshotV51());slotUI();say('Salvestatud kohta '+i)}catch{say('Salvestusruum on täis')}};row.append(saveButton);
 const load=document.createElement('button');load.textContent='Laadi';load.disabled=sampleDemo||!stored;load.onclick=()=>{if(!confirm('Laadin salvestuskoha '+i+'. Praegune automaatsalvestus asendatakse.'))return;try{const obj=JSON.parse(localStorage.getItem(V51_SLOT_PREFIX+i));if(!validState(obj))throw Error('Vigane salvestus');replaceProtectedGame(localStorage,JSON.stringify(obj),validState);restarting=true;location.reload()}catch{restarting=false;say('Salvestus on vigane')}};row.append(load);root.append(row)
 }}
$('v51export').onclick=()=>{const blob=new Blob([snapshotV51()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=siegeDemo?(s.demo==='iron-siege'?'Kuningriigid_V116_Rauaeg.json':'Kuningriigid_V116_Pronksiaeg.json'):battleDemo?'Kuningriigid_V89_Pronksilahing.json':stoneDemo?'Kuningriigid_V77_Kivimetsa_testlinn.json':bronzeDemo?'Kuningriigid_V79_Pronksilinn.json':medievalDemo?'Kuningriigid_V80_Keskaeg.json':renaissanceDemo?'Kuningriigid_V81_Renessanss_Paikeselinn.json':industrialDemo?'Kuningriigid_V82_Aurulinn.json':'Kuningriigid_V82_kaik_'+(Math.floor(s.time/60)+1)+'.json';document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000)};
$('v51import').onclick=()=>{if(sampleDemo){say('Impordi testsalvestus tavalisel mängulehel ilma demo parameetrita.');return;}$('v51importfile').click()};
$('v51importfile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>15e6)throw Error('Fail on liiga suur');const data=JSON.parse(await file.text());if(!validState(data))throw Error('Vigane mänguseis');if(!confirm('Impordin selle mänguseisu ja asendan automaatsalvestuse?'))return;replaceProtectedGame(localStorage,JSON.stringify(data),validState);restarting=true;location.reload()}catch(error){restarting=false;say('Import ebaõnnestus: '+error.message)}finally{e.target.value=''}};
slotUI();
// The example city is opt-in. It opens separately and never replaces autosaves.
const demoLink=document.createElement('a');
demoLink.className='model-gallery-link';
demoLink.href='?v=82-20261020&demo=stone';
demoLink.textContent='Kiviaja näidislinn';
$('menu-demo-links').append(demoLink);
const bronzeLink=document.createElement('a');
bronzeLink.className='model-gallery-link';bronzeLink.href='?v=82-20261020&demo=bronze';
bronzeLink.textContent='Pronksiaja näidislinn';
$('menu-demo-links').append(bronzeLink);
const medievalLink=document.createElement('a');medievalLink.className='model-gallery-link';medievalLink.href='?v=82-20261020&demo=medieval';medievalLink.textContent='Keskaja näidislinn';$('menu-demo-links').append(medievalLink);
const renaissanceLink=document.createElement('a');renaissanceLink.className='model-gallery-link';renaissanceLink.href='?v=82-20261020&demo=renaissance';renaissanceLink.textContent='Renessansi näidislinn';$('menu-demo-links').append(renaissanceLink);
const industrialLink=document.createElement('a');industrialLink.className='model-gallery-link';
industrialLink.href='?v=82-20261020&demo=industrial';
industrialLink.textContent='Tööstusajastu näidislinn';
$('menu-demo-links').append(industrialLink);const battleLink=document.createElement('a');battleLink.id='bronze-battle-demo';battleLink.href='?demo=bronze-battle';battleLink.textContent=BRONZE_BATTLE_NAME;$('menu-demo-links').append(battleLink);for(const [demo,name]of [['bronze-patrol','Rahuaja tornivalvurite patrull'],['bronze-siege','Pronksiaja linnapiiramine'],['iron-siege','Rauaaja linnapiiramine · katapuldid ja ballistad']]){const link=document.createElement('a');link.href='?demo='+demo;link.textContent=name;$('menu-demo-links').append(link);}
if(sampleDemo){
 $('menutitle').textContent=(patrolDemo?'Rahuaja tornivalvurite patrull':siegeDemo?(s.demo==='iron-siege'?'Rauaaja linnapiiramine':BRONZE_SIEGE_NAME):battleDemo?BRONZE_BATTLE_NAME:stoneDemo?'Kiviaja näidislinn – '+DEMO_CITY_NAME:bronzeDemo?'Pronksiaja näidislinn – '+BRONZE_DEMO_NAME:medievalDemo?'Keskaja näidislinn – '+MEDIEVAL_DEMO_NAME:renaissanceDemo?'Renessansi näidislinn – '+RENAISSANCE_DEMO_NAME:'Tööstusajastu näidislinn – '+INDUSTRIAL_DEMO_NAME);
 $('v51export').textContent=battleDemo||siegeDemo?'↓ Laadi testlahingu salvestus (.json)':'↓ Laadi näidislinna salvestus (.json)';
 $('savestatus').textContent='Teststsenaarium ei muuda sinu olemasolevaid mängusalvestusi.';
}
// Dynamic pixel ratio reduction under sustained FPS pressure, without altering user's chosen profile.
let fpsFrames=0,fpsSeconds=0,lowFpsSeconds=0,highFpsSeconds=0,v51Resolution=1;
function sampleV51FPS(dt){if(menuOpen||document.hidden)return;fpsFrames++;fpsSeconds+=dt;if(fpsSeconds<2)return;const fps=fpsFrames/fpsSeconds;fpsFrames=0;fpsSeconds=0;
 if(fps<26){lowFpsSeconds+=2;highFpsSeconds=0}else if(fps>48){highFpsSeconds+=2;lowFpsSeconds=0}else{highFpsSeconds=0;lowFpsSeconds=0}
 if(lowFpsSeconds>=6&&v51Resolution>.72){v51Resolution=.72;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?.85:quality==='medium'?1.15:1.6)*v51Resolution);lowFpsSeconds=0}
 if(highFpsSeconds>=12&&v51Resolution<1){v51Resolution=1;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?.85:quality==='medium'?1.15:1.6));highFpsSeconds=0}
}

$('seedinfo').textContent='Maailma seeme: '+s.seed;if(sessionStorage.getItem('kingdoms-civ-start')){sessionStorage.removeItem('kingdoms-civ-start');menuOpen=false;$('startmenu').hidden=true}applyQuality();resize();if(s.battle?.fortress&&!s.battle.towerGarrisonVersion){const city=s.cities.find(c=>c.id===s.battle.fortress.cityId);if(city)addTowerGuards(city,s,s.battle);}if(s.battle)initializeMen(s.battle,game.battleNavigation(s.battle));if(s.battle)openTile(game.cell(s.battle.cell));else openWorld();worldSync();if(sampleDemo){menuOpen=false;$('startmenu').hidden=true;const city=s.cities.find(c=>c.team===0);if(city&&!s.battle)openTile(game.cell(city));if(patrolDemo){openTile(game.cell(s.cities[0]));zoom=140;focus.set(0,5,0);say('Rahuaja patrull: viis kaitsjat torni kohta liiguvad ükshaaval järgmise tornini ja tagasi.');}if(battleDemo||siegeDemo){paused=true;$('pause').textContent='▶';zoom=siegeDemo?Math.min(800,320/Math.min(1,camera.aspect)):Math.min(700,280/Math.min(1,camera.aspect));focus.set(siegeDemo?-60:0,0,0);selectedUnit=s.battle.squads.find(u=>u.team===0);const legend=document.createElement('p');legend.id='battle-factions';legend.style.fontSize='11px';for(const team of [0,1]){const chip=document.createElement('b');chip.textContent=ARMY_COLOR_NAMES[team]+' · '+battleManCount(s.battle,team);chip.style.color='#eee6cc';chip.style.borderLeft='4px solid '+ARMY_COLORS[team];chip.style.padding='2px 5px';chip.style.marginRight='10px';legend.append(chip);}const types=document.createElement('small');types.textContent=siegeDemo?s.demo==='iron-siege'?'Rauaaeg: jalavägi · vibud · ratsavägi · kiviviskemasinad · ballistad':'Pronksiaeg: odamehed · kirvemehed · vibud · kaarikud · redelirünnak':'Odamehed · kirvemehed · vibukütid · sõjavankrid · ratsavägi · katapuldid';types.style.display='block';legend.append(types);$('battlepanel').append(legend);const reset=document.createElement('button');reset.id='battle-demo-restart';reset.textContent='Taasta testlahingu algseis';reset.onclick=()=>location.reload();$('battlepanel').append(reset);say(siegeDemo?(s.demo==='iron-siege'?'Rauaaja linnapiiramine: ratsavägi, kiviviskemasinad ja ballistad. Vali salk ja vajuta ▶.':'Pronksiaja linnapiiramine: odad, kirved, vibud, kaarikud ja redelid. Vali salk ja vajuta ▶.'):'240 vs 240 pronksiaja võitlejat: odad, kirved, vibud ja kaarikud. Vali salk, anna käsk ja vajuta ▶.');renderUI();}}if(recovered)say('Salvestus taastati varukoopiast.');requestAnimationFrame(frame);window.gameDebug={towerGuardStatus:()=>((s.battle||peacefulGarrisons.get(activeCity()))?.squads||[]).filter(u=>u.towerGuard).map(u=>({source:u.source,x:u.x,z:u.z,hp:u.hp,elevation:u.wallElevation,duty:u.guardDuty})),fogStatus:()=>({coverGeometry:fogCoverMesh?.geometry.uuid,sketchGeometries:fogSketchGroup.children.map(m=>m.geometry.uuid),changedCells:visionDelta.changed.length,terrainVertices:atlasLand.geometry.attributes.position.count}),camera,localScene,battleDemo,stoneDemo,bronzeDemo,medievalDemo,renaissanceDemo,industrialDemo,
 buildingInfoStatus:()=>({open:!!buildingInspector?.isOpen(),type:selectedBuilding?.type||null,
  data:selectedBuilding&&activeCity()?describeBuilding(game,activeCity(),selectedBuilding,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH):null}),
 selectBuildingType:(type,index=0)=>{const c=activeCity();return inspectBuilding(c?.economy.buildings.filter(b=>b.type===type)[index])},
 industrialModelStatus:()=>{const result=[];localScene.traverse(o=>{if(o.userData?.industrialAgeModel)result.push({
  type:o.userData.buildingType,triangles:o.userData.triangles,drawCalls:o.children.length,
  age:o.userData.age,center:{x:o.position.x,z:o.position.z}})});return result},renaissanceModelStatus:()=>{const out=[];localScene.traverse(o=>{if(o.userData?.renaissanceAgeModel)out.push({type:o.userData.buildingType,triangles:o.userData.triangles,drawCalls:o.children.length,age:o.userData.age})});return out},bronzeModelStatus:()=>{const list=[];localScene.traverse(o=>{if(o.userData?.bronzeAgeModel)list.push({type:o.userData.buildingType,triangles:o.userData.triangles,drawCalls:o.children.length,age:o.userData.age})});return list},marketWalkStatus:()=>{const city=activeCity();return Object.entries(city?.world?.workers||{}).filter(([id,w])=>w.kind==='market_woman').map(([id,w])=>({id,x:w.x,z:w.z,moving:w.moving,phase:w.shoppingPhase,status:w.status}))},localRoadStatus:()=>({spots:localTrails?.count||0,ribbonTriangles:localTrailLinks?.children?.[0]?.geometry?.attributes?.position?.count/3||0,trailCells:Object.keys(activeCity()?.world?.heat||{}).length}),refreshLocalRoads:()=>{lastTrailTime=-1;syncLocal()},stoneModelStatus:()=>{const list=[];localScene.traverse(o=>{if(o.userData?.stoneAgeModel)list.push({type:o.userData.buildingType,triangles:o.userData.triangles,drawCalls:o.children.length,age:o.userData.age})});return list},villageLifeStatus:()=>villageLife.stats(),refreshVillageLife:(time)=>villageLife.update(time,.1),perfStats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),drawingBuffer:{w:renderer.domElement.width,h:renderer.domElement.height}}),detailObjectStatus:()=>[...detailObjectHolders.values()].map(({tile,holder})=>({c:tile.c,r:tile.r,ids:holder.children.flatMap(g=>g.userData.siteIds||[]),objects:holder.children.flatMap(g=>g.children.map(m=>({id:m.userData.worldSiteId,kind:m.userData.worldProp,claimedBy:m.userData.claimedBy,visible:m.visible})))})),resourceLayerStatus:()=>({enabled:showResourceOverlay,icons:resourceSprites.length}),pick,worldClick,localClick,currentSelection,setCommandMode,commandMode:()=>commandMode,cameraKeys,updateCameraKeys,commandOverlay,worldSync,getZoom:()=>zoom,setCityTab,cityTab:()=>cityTab,detailFocus:focus,followDetail,neighbours:()=>neighbourTerrains,game,state:s,openWorld,openTile,renderUI,frame,checkEncounter,activeCity,save,view:()=>view,atlasDecor,worldScene,worldMarkers,destination,openResearch,chooseResearch,queueTechnology,removeTechnology,updateGhost,quality:()=>quality,applyQuality,currentLanguage,changeLanguage,overviewMetrics,setBuildPreview:(type,p)=>{mode=type;ghostPoint=p;updateGhost();return ghost}};
// Delegation survives the regularly refreshed HUD.
function openFoodStocks(){const city=activeCity()?.team===0?game.parentCity(activeCity()):ownCity();if(!city)return;let dialog=document.getElementById('food-stocks-v87');if(!dialog){dialog=document.createElement('dialog');dialog.id='food-stocks-v87';document.body.append(dialog);}const r=city.economy.realms[0].resources,n=nationalStock(s,0),needs=cityNeeds(city,s.ages[0]);dialog.replaceChildren();const title=document.createElement('h2');title.textContent=city.name+' · toiduvarud';dialog.append(title);const intro=document.createElement('p');intro.textContent='Kohalik (riigi kogus). Vajadus '+needs.need.food+' toitu ja '+needs.need.luxury+' luksust. Tootlikkus '+Math.round(needs.productivity*100)+'%. Iga puuduv liik −5%, üleliigne +2%.';dialog.append(intro);for(const k of ['bread','grain','flour',...Object.keys(GOODS).filter(k=>GOODS[k].food||GOODS[k].luxury),'pottery']){const line=document.createElement('p');line.textContent=(RESOURCE_NAMES[k]||k)+': '+(r[k]||0).toFixed(1)+' ('+(n[k]||0).toFixed(1)+')';dialog.append(line);}const close=document.createElement('button');close.textContent='Sulge';close.onclick=()=>dialog.close();dialog.append(close);dialog.showModal();}
$('resources').addEventListener('click',e=>{if(e.target.closest('[data-resource="bread"]'))openFoodStocks();});
$('resources').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.resource==='bread'){e.preventDefault();openFoodStocks();}});
