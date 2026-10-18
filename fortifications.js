// V61: One civilian worker mans each tower; wall soldiers come only from real units.
export const WALL_TYPES=new Set(['palisade','stonewall']);
export const TOWER_TYPES=new Set(['watchtower','stonetower']);
// Real collision footprint follows the selected segment orientation.
// A 7-unit wall otherwise leaves navigation holes at its ends.
export function configureWallFootprint(b){
 if(!WALL_TYPES.has(b?.type))return b;
 b.wallAxis=b.wallAxis?1:0;
 b.navWidth=b.wallAxis?1.1:3.6;
 b.navDepth=b.wallAxis?3.6:1.1;
 return b;
}
export const wallCapacity=type=>type==='stonewall'?3:type==='palisade'?2:0;
export const wallHeight=type=>type==='stonewall'?3.8:type==='palisade'?3.1:0;
export function wallGuards(state,ctx,building){
 return state.units.map((unit,source)=>({unit,source})).filter(({unit})=>
  unit.hp>0&&unit.team===ctx.team&&unit.garrison&&
  unit.garrison.c===ctx.c&&unit.garrison.r===ctx.r&&
  unit.garrison.x===building.x&&unit.garrison.z===building.z);
}
export function stationWall(game,ctx,building,source=null){
 if(game.s.battle&&!game.s.battle.result)return {error:'Lahingu ajal garnisoni muuta ei saa.'};
 if(!WALL_TYPES.has(building.type)||!ctx.economy.buildings.includes(building))return {error:'Vali oma linna müürilõik.'};
 if(!building.ready||building.hp<=0||building.disabled)return {error:'Müür peab olema valmis ja kasutuskõlblik.'};
 if(wallGuards(game.s,ctx,building).length>=wallCapacity(building.type))return {error:'Müüril pole rohkem sõdurikohti.'};
 const soldiers=game.s.units.map((unit,index)=>({unit,index})).filter(({unit})=>{
  if(unit.team!==ctx.team||unit.hp<=0||unit.garrison)return false;
  return game.s.armies.some(a=>a.team===unit.team&&a.embarked==null&&(a.id||0)===(unit.armyId||0)&&a.c===ctx.c&&a.r===ctx.r&&!a.path?.length);
 });
 const chosen=source==null?soldiers.find(({unit})=>unit.kind!=='scout')||soldiers[0]:soldiers.find(({index})=>index===source);
 if(!chosen)return {error:'Saada oma armee selle linna ruudule ja peata liikumine, seejärel määra sõdur müürile.'};
 chosen.unit.garrison={c:ctx.c,r:ctx.r,x:building.x,z:building.z,wallType:building.type,wallAxis:building.wallAxis||0,slot:wallGuards(game.s,ctx,building).length};
 return {ok:true,source:chosen.index};
}
export function releaseWall(game,ctx,building){
 if(game.s.battle&&!game.s.battle.result)return {error:'Lahingu ajal garnisoni muuta ei saa.'};
 const soldiers=wallGuards(game.s,ctx,building),chosen=soldiers.at(-1);
 if(!chosen)return {error:'Sellel müüril pole sõdureid.'};
 let army=game.s.armies.find(a=>a.team===ctx.team&&a.embarked==null&&a.c===ctx.c&&a.r===ctx.r&&!a.path?.length&&game.s.units.some(u=>u.team===ctx.team&&u.hp>0&&!u.garrison&&(u.armyId||0)===(a.id||0)));
 if(!army){
  const maxId=game.s.armies.reduce((n,a)=>Math.max(n,a.id||0),0);
  game.s.nextArmyId=Math.max(game.s.nextArmyId||1,maxId+1);
  const id=game.s.nextArmyId++;
  army={id,team:ctx.team,c:ctx.c,r:ctx.r,path:[],stance:'defend'};
  game.s.armies.push(army);
 }
 chosen.unit.armyId=army.id||0;
 delete chosen.unit.garrison;
 return {ok:true,source:chosen.source};
}
export function fortifyBattle(game,city,battle){
 const buildings=city.economy.buildings.filter(b=>b.ready&&b.hp>0&&!b.disabled);
 const walls=buildings.filter(b=>WALL_TYPES.has(b.type));
 const towers=buildings.filter(b=>TOWER_TYPES.has(b.type));
 const barrier=walls.reduce((n,b)=>n+(b.type==='stonewall'?160:85)*Math.max(.1,b.hp/350),0);
 const towerArmor=towers.reduce((n,b)=>n+(b.type==='stonetower'?95:55)*Math.max(.1,b.hp/350),0);
 battle.fortress.hp+=(barrier+towerArmor);
 battle.fortress.maxHp+=(barrier+towerArmor);
 battle.fortress.defenseBonus=barrier+towerArmor;
 battle.defensePosts=towers.filter(b=>(b.assigned||0)>.05).map(b=>({
  x:b.x,z:b.z,team:city.team,damage:b.type==='stonetower'?12:8,range:b.type==='stonetower'?31:25,cool:0
 }));
 for(const wall of walls){
  for(const {unit,source} of wallGuards(game.s,city,wall)){
   if(battle.squads.some(q=>q.source===source))continue;
   const slot=wallGuards(game.s,city,wall).findIndex(q=>q.source===source);
   battle.squads.push({source,team:unit.team,kind:unit.kind,hp:unit.hp,maxHp:unit.hp,morale:unit.morale??100,
    x:wall.x+(wall.wallAxis?0:(slot-0.5)*1.6),z:wall.z+(wall.wallAxis?(slot-0.5)*1.6:0),heading:wall.wallAxis?Math.PI/2:0,target:null,cool:0,guardPost:true,wallType:wall.type,advance:false});
  }
 }
 return battle;
}
