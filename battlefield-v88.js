// Three real detail tiles per side, plus one visible retreat tile on every edge.
export const BATTLEFIELD=Object.freeze({columns:3,rows:3,ring:1,tileWidth:150,tileDepth:130,minX:-225,maxX:225,minZ:-195,maxZ:195,outerMinX:-375,outerMaxX:375,outerMinZ:-325,outerMaxZ:325,centerX:0,centerZ:0});
export const outsideBattlefield=p=>p.x<BATTLEFIELD.minX||p.x>BATTLEFIELD.maxX||p.z<BATTLEFIELD.minZ||p.z>BATTLEFIELD.maxZ;
export function battlefieldTiles(cell){const out=[];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)out.push({c:cell.c+dc,r:cell.r+dr,dc,dr,retreat:Math.abs(dc)===2||Math.abs(dr)===2});return out;}

const identity=u=>u.team+':'+(u.armyId||0);
export function orderArmyWithdrawal(b,u){for(const q of b.squads)if(identity(q)===identity(u)&&q.hp>0&&!q.retreated){q.routing=true;q.withdrawing=true;q.manualOrder=false;q.target=null;for(const m of q.men||[])if(m.hp>0&&!m.escaped)m.routing=true;}}
export function checkBattleRetreats(b){
 if(!b.field)return;b.retreatedArmies??=[];
 // Compatibility for pre-individual API callers; live battles initialize men first.
 if(!b.individualVersion){for(const u of b.squads){if(u.hp<=0||u.retreated||u.civilian||u.guardPost||!outsideBattlefield(u))continue;const key=identity(u);if(!b.retreatedArmies.some(r=>r.team+':'+r.armyId===key))b.retreatedArmies.push({team:u.team,armyId:u.armyId||0,exit:{x:u.x,z:u.z},at:b.elapsed});for(const q of b.squads)if(!q.civilian&&!q.guardPost&&identity(q)===key){q.retreated=true;q.target=null;q.advance=false;q.moving=false;}}return;}
 for(const u of b.squads){if(!u.men||u.retreated||u.reserve||(u.guardPost&&!u.routing))continue;for(const m of u.men)if(m.hp>0&&!m.escaped&&outsideBattlefield(m)){if(u.manualOrder&&!u.routing)orderArmyWithdrawal(b,u);m.escaped=true;m.escapedAt=b.elapsed;m.moving=false;u.lastExit={x:m.x,z:m.z};}const alive=u.men.filter(m=>m.hp>0);if(alive.length&&alive.every(m=>m.escaped)){u.retreated=true;u.target=null;u.moving=false;}}
 for(const u of b.squads){if(!u.retreated||u.civilian||u.guardPost)continue;const key=identity(u),own=b.squads.filter(q=>identity(q)===key&&!q.civilian&&!q.guardPost&&!q.reserve&&q.hp>0);if(own.length&&own.every(q=>q.retreated)&&!b.retreatedArmies.some(r=>r.team+':'+r.armyId===key))b.retreatedArmies.push({team:u.team,armyId:u.armyId||0,exit:u.lastExit||{x:u.x,z:u.z},at:b.elapsed});}
}
export function applyArmyRetreats(game,b){
 for(const record of b.retreatedArmies||[]){if(record.applied)continue;
  const army=game.s.armies.find(a=>a.team===record.team&&(a.id||0)===record.armyId);if(!army){record.applied=true;continue;}
  const dc=Math.floor((record.exit.x+75)/150),dr=Math.floor((record.exit.z+65)/130),preferred={c:b.cell.c+dc,r:b.cell.r+dr};
  const safe=p=>p.c>=0&&p.r>=0&&p.c<(game.cols||220)&&p.r<(game.rows||165)&&game.canTraverse(record.team,p)&&!game.s.armies.some(a=>a.team!==record.team&&a.embarked==null&&a.c===p.c&&a.r===p.r&&game.s.units.some(u=>u.hp>0&&u.team===a.team&&(u.armyId||0)===(a.id||0)))&&(!game.cityAt(p)||game.cityAt(p).team===record.team);
  const routeSafe=p=>{const path=game.landPath(b.cell,p,record.team);return path!==null;};
  const candidates=[preferred];for(let r=-4;r<=4;r++)for(let c=-4;c<=4;c++)if(c||r)candidates.push({c:b.cell.c+c,r:b.cell.r+r});
  candidates.sort((a,b)=>Math.hypot(a.c-preferred.c,a.r-preferred.r)-Math.hypot(b.c-preferred.c,b.r-preferred.r));
  const to=candidates.find(p=>safe(p)&&routeSafe(p));
  if(to){army.c=to.c;army.r=to.r;}else army.retreatUntil=game.s.time+30;
  army.path=[];army.autoExplore=false;army.travelClock=0;army.travelDuration=0;delete army.rallyTarget;
  record.destination={c:army.c,r:army.r};record.applied=true;
  game.s.deployments??={};const tile=game.s.deployments[army.c+':'+army.r]??={};
  for(const q of b.squads)if(q.retreated&&q.team===record.team&&(q.armyId||0)===record.armyId&&q.source>=0)tile[q.source]={x:Math.max(-65,Math.min(65,record.exit.x-dc*150)),z:Math.max(-55,Math.min(55,record.exit.z-dr*130)),heading:q.heading||0,target:null};
 }
}
