// V163, stage 1: historical Stone Age town zoning.
// Deterministic, geometry-only scores. Never creates buildings, changes costs,
// bypasses pathfinding, or persists new state in old saves.
export const STONE_TOWN_V163 = Object.freeze({
  civicRadius: 26, homeRadius: 42, compactLimit: 72,
  farmRadius: 94, productiveRing: 88, fieldMinRadius: 74
});
const CIVIC = new Set(['hall','study','market','well','warehouse','cellar']);
const RURAL = new Set(['farm','field','pasture','hunter','lumber','quarry','forester','fisher']);
const HEAVY = new Set(['barracks','archery','saw','mason','pottery_kiln','bronze_foundry','smith','smelter']);
export function stoneTownZone(type){
  return CIVIC.has(type)?'civic':type==='house'?'residential':RURAL.has(type)?'rural':HEAVY.has(type)?'workshop':'civic';
}
// Use a stable orientation so farms do not encircle the town uniformly.
// The farms still follow land, grain deposits and real passability checks.
export function stoneTownPlotScore(type,x,z,seed=0){
  const radius=Math.hypot(x,z),zone=stoneTownZone(type),angle=Math.atan2(z,x);
  if(zone==='civic')return Math.abs(radius-STONE_TOWN_V163.civicRadius)*.23;
  if(zone==='residential')return Math.abs(radius-STONE_TOWN_V163.homeRadius)*.25+
    Math.max(0,radius-STONE_TOWN_V163.compactLimit)*2.7;
  if(zone==='rural'){
    const farm=['farm','field','pasture'].includes(type);
    // Farm direction varies by town seed. Avoid the housing ring without
    // forcing a plot onto an unsuitable slope or outside its resource tile.
    const farmAngle=((Math.abs(Math.floor(seed*0.61803398875))%4)*Math.PI/2)-Math.PI;
    const alignment=farm?(1-Math.cos(angle-farmAngle))*6:0;
    const desired=farm?STONE_TOWN_V163.farmRadius:STONE_TOWN_V163.productiveRing;
    return Math.abs(radius-desired)*.22+
      Math.max(0,STONE_TOWN_V163.fieldMinRadius-radius)*3.5+alignment;
  }
  return Math.abs(radius-75)*.24+Math.max(0,48-radius)*.8;
}
export function stoneFieldClusterScore(point,farm,fields=[],globalPoint=null){
  const farmDistance=Math.hypot(point.x-farm.x,point.z-farm.z);
  const radius=globalPoint?Math.hypot(globalPoint.x,globalPoint.z):Infinity;
  const corePenalty=Math.max(0,STONE_TOWN_V163.fieldMinRadius-radius)*4;
  // Prefer a workable field near the farmer; once there are others,
  // place the next in the same agricultural patch rather than across town.
  const cluster=fields.length?Math.min(...fields.map(b=>Math.hypot(b.x-point.x,b.z-point.z))):0;
  return farmDistance+corePenalty+Math.min(80,cluster)*.55;
}
