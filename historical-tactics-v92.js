import {prepareAmmunition,stoneThrower} from './combat-equipment-v100.js?v=104a';
import {BOW_DAMAGE_MULTIPLIER} from './unit-balance-v99.js';
import {squadContactGoal} from './combat-contact-v96.js';
import {FORMATIONS,formationDamage,missileExposure} from './formations-v94.js?v=104a';
import {BATTLE_FRONT_DEPTH,BATTLE_EMPTY_HALF_WIDTH} from './battle-pacing-v93.js';
import {troopRole,rangedTroop} from './military-v88.js';
import {unitStats} from './army-experience-v88.js';
export const usesArrows=u=>['slinger','archer','bronze_archer','iron_archer','crossbowman','chariot','javelinman'].includes(u.kind);
export const horseKind=u=>troopRole(u.kind)==='cavalry'||u.kind==='chariot';
export const isBow=u=>rangedTroop(u.kind)||['chariot','dragoon','cuirassier'].includes(u.kind);
export const isSpear=u=>['spearman','bronze_spearman','halberdier','pikeman','javelinman'].includes(u.kind);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function tacticalStats(def,u){const a=unitStats(def,u);a.speed*=u.routing?1:(FORMATIONS[u.formation]||FORMATIONS.line).speed;if(u.kind==='cuirassier')a.range=7.5; if(u.kind==='dragoon'){a.range=Math.min(a.range,17);a.speed*=.92;}if(u.kind==='chariot'){a.range=18*(u.experienceMultiplier||1);a.dmg=18*BOW_DAMAGE_MULTIPLIER*(u.experienceMultiplier||1)*({mobilized:.4,elite:1.4}[u.grade]||1);}return a;}
export function deployHistoricalBattle(b){
 const teams=[...new Set(b.squads.map(u=>u.team))];for(let t=0;t<teams.length;t++){const team=teams[t],side=t%2?-1:1,list=b.squads.filter(u=>u.team===team&&!u.guardPost),front=list.filter(u=>troopRole(u.kind)==='melee'&&!/axeman/.test(u.kind)),reserve=list.filter(u=>/axeman/.test(u.kind)),guns=list.filter(u=>['musketeer','arquebusier','line_infantry','rifleman'].includes(u.kind)),bows=list.filter(u=>isBow(u)&&u.kind!=='chariot'&&!guns.includes(u)),mounted=list.filter(u=>troopRole(u.kind)==='cavalry'||troopRole(u.kind)==='vehicle'),other=list.filter(u=>![...front,...reserve,...bows,...guns,...mounted].includes(u));
  const line=(units,depth,spacing,role)=>units.forEach((u,i)=>{u.x=-side*(depth+Math.floor(i/10)*7);u.z=(i%10-(Math.min(10,units.length)-1)/2)*spacing;u.heading=side*Math.PI/2;u.tacticalRole=role;u.battleSide=side;u.deployment={x:u.x,z:u.z};u.releaseAt=role==='support'?16:0;});
  line(front,BATTLE_FRONT_DEPTH,7.5,'line');guns.forEach((u,i)=>{const wing=i%2?1:-1;u.x=-side*(BATTLE_FRONT_DEPTH+Math.floor(i/8)*7);u.z=wing*(Math.max(12,Math.min(10,front.length)*2.55+5)+Math.floor(i/2)%4*6);u.heading=side*Math.PI/2;u.tacticalRole='shot';u.battleSide=side;u.deployment={x:u.x,z:u.z};});line(bows,BATTLE_FRONT_DEPTH+16,8,'missile');line(reserve,BATTLE_FRONT_DEPTH+30,7,'support');line(other,BATTLE_FRONT_DEPTH+22,8,'support');
  mounted.forEach((u,i)=>{const flank=i%2?1:-1;u.x=-side*(BATTLE_FRONT_DEPTH-2);u.z=flank*(Math.max(38,front.length*3.2+16)+Math.floor(i/2)*16);u.heading=side*Math.PI/2;u.tacticalRole=u.kind==='chariot'?'mobile-missile':'flank';u.flank=flank;u.battleSide=side;u.deployment={x:u.x,z:u.z};});
 }
 b.deploymentGap={minX:-BATTLE_EMPTY_HALF_WIDTH,maxX:BATTLE_EMPTY_HALF_WIDTH};b.doctrineVersion=1;b.doctrine='Rivi, laskurite toetus, tiivamanööver ja moraal';return b;
}
export function initializeTactics(b){
 for(const u of b.squads){u.battleSide??=u.team? -1:1;u.tacticalRole??=u.kind==='chariot'?'mobile-missile':isBow(u)?'missile':troopRole(u.kind)==='cavalry'?'flank':'line';u.deployment??={x:u.x,z:u.z};u.startMen??=u.men?.filter(m=>m.hp>0).length||0;
  for(const m of u.men||[]){m.morale??=u.grade==='mobilized'?64:u.grade==='elite'?94:82;m.fatigue??=0;if(isBow(u))prepareAmmunition(m,u);else m.ammo??=null;}
 }
}
export function updateMorale(b,dt){
 for(const u of b.squads){if(!u.men||u.reserve||u.retreated)continue;const men=u.men.filter(m=>m.hp>0&&!m.escaped),loss=1-men.length/Math.max(1,u.startMen),friends=b.squads.filter(q=>q!==u&&q.team===u.team&&q.hp>0&&!q.routing&&!q.retreated&&!q.reserve&&distance(q,u)<16),panic=b.squads.some(q=>q!==u&&q.team===u.team&&q.routing&&distance(q,u)<18);
  u.ammoRemaining=men.reduce((n,m)=>n+(m.ammo||0),0);if((stoneThrower(u)||u.kind==='chariot')&&men.length&&u.ammoRemaining===0){u.routing=true;u.ammoDepleted=true;u.manualOrder=false;u.target=null;for(const m of men)m.routing=true;}u.cohesion=men.length?Math.max(0,1-men.reduce((n,m)=>n+Math.max(0,distance(m,u)-4),0)/men.length/12):0;
  for(const m of men){const base=u.grade==='mobilized'?64:u.grade==='elite'?94:82,target=base-loss*70+(friends.length?7:0)-(panic?9:0)-(u.moraleShock||0)-m.fatigue*.07-(1-u.cohesion)*10;
   m.morale=Math.max(0,Math.min(100,m.morale+(target-m.morale)*Math.min(1,dt*.5)));if(m.morale<24)m.routing=true;else if(m.morale>46&&!u.routing)m.routing=false;
  }u.morale=men.length?men.reduce((n,m)=>n+m.morale,0)/men.length:0;u.moraleShock=Math.max(0,(u.moraleShock||0)-dt*.5);
  if(men.length&&(men.filter(m=>m.routing).length>men.length*.45||(loss>.6&&u.morale<38))){if(!u.routing){u.routing=true;u.routAt=b.elapsed;b.moraleRouts=(b.moraleRouts||0)+1;}for(const m of men)m.routing=true;u.manualOrder=false;u.target=null;}
 }
}
// Egyptian-style two-horse chariots are fast but vulnerable missile platforms.
// Each group alternates an approach, a short bow volley, and a turning retreat.
const chariotClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function chariotGoal(u,target,squads,b,a,nav=null){
 const now=b.elapsed,range=Math.max(9,a.range),foes=squads.filter(v=>v.team!==u.team&&v.hp>0&&!v.retreated&&!v.routing);
 const closest=foes.reduce((q,v)=>!q||distance(u,v)<distance(u,q)?v:q,null)||target;
 const protectedSpears=foes.filter(v=>isSpear(v)&&(v.formation==='spear_wall'||(v.cohesion??1)>.5));
 const spear=protectedSpears.reduce((q,v)=>!q||distance(u,v)<distance(u,q)?v:q,null);
 const danger=spear&&distance(u,spear)<22?spear:closest;
 const near=distance(u,closest)<12||distance(u,danger)<11,guarded=!!spear&&distance(u,spear)<21;
 const flank=u.flank||1,elapsed=now-(u.chariotPhaseAt??now);
 const phase=name=>{if(u.chariotPhase!==name){u.chariotPhase=name;u.chariotPhaseAt=now;}};
 if(!u.chariotPhase)phase('approach');
 if(near||guarded)phase('withdraw');
 else if(u.chariotPhase==='shoot'&&elapsed>=3.2)phase('withdraw');
 else if(u.chariotPhase==='withdraw'&&((distance(u,closest)>range*1.2&&elapsed>1.8)||elapsed>6))phase('approach');
 else if(u.chariotPhase==='approach'&&distance(u,target)<range*.92&&distance(u,target)>11&&distance(u,closest)>12)phase('shoot');
 if(u.chariotPhase==='shoot')return u.anchor||u;
 const d=Math.max(1,distance(u,danger));
 const goal=u.chariotPhase==='withdraw'
   ?{x:u.x+(u.x-danger.x)/d*28,z:u.z+(u.z-danger.z)/d*28+flank*7}
   :{x:target.x-(u.battleSide||1)*range*.78,z:target.z+flank*10};
 const safe={x:chariotClamp(goal.x,-210,210),z:chariotClamp(goal.z,-180,180)};
 // Avoid trying to put the cart and its horses into trees/buildings or water.
 if(nav&&!(nav.open(safe.x,safe.z)&&nav.open(safe.x-1.5,safe.z)&&nav.open(safe.x+1.5,safe.z))){
  const open=nav.nearest(safe,21);
  return open&&nav.open(open.x,open.z)?open:(u.anchor||u);
 }
 return safe;
}
export function tacticalGoal(u,nearest,squads,b,a,nav=null){
 if(u.routing)return {x:-u.battleSide*250,z:u.z};if(isBow(u)&&u.ammoRemaining===0)return squadContactGoal(u,nearest);if((FORMATIONS[u.formation]||{}).hold)return u.anchor||u;if((u.releaseAt||0)>b.elapsed&&distance(u,nearest)>26)return u.deployment;
 if(u.tacticalRole==='support'&&b.elapsed<(u.releaseAt||16)&&distance(u,nearest)>16)return u.deployment;
 if(u.kind==='chariot')return chariotGoal(u,nearest,squads,b,a,nav);
 if(horseKind(u)){
  const enemies=squads.filter(q=>q.team!==u.team&&q.hp>0&&!q.routing&&!q.retreated);
  const guarded=enemies.filter(q=>isSpear(q)&&(q.formation==='spear_wall'||q.formation==='shield_wall'||(q.cohesion??1)>.55));
  const nearestGuard=guarded.reduce((best,q)=>!best||distance(u,q)<distance(u,best)?q:best,null);
  const flank=u.flank||(u.source%2?1:-1);
  // Chariots are mobile missile platforms (Near Eastern practice): no ramming dense infantry.
  // Early mounted fighters must also keep clear of prepared spear walls.
  const early=u.kind==='chariot'||u.kind==='bronze_cavalry',hazard=nearestGuard&&distance(u,nearestGuard)<(u.kind==='chariot'?19:13);
  const tooClose=u.kind==='chariot'&&distance(u,nearest)<Math.max(10,a.range*.6);
  if((hazard&&early)||tooClose){
   const threat=hazard?nearestGuard:nearest,dx=u.x-threat.x,dz=u.z-threat.z,len=Math.hypot(dx,dz)||1;
   return {x:u.x+dx/len*22,z:u.z+dz/len*22+flank*5};
  }
  if(u.kind==='dragoon'||u.kind==='cuirassier'){
   const range=a.range*(u.kind==='chariot'?.77:.8),d=distance(u,nearest);
   if(u.ammoRemaining!==0&&d<=range*1.12)return u.anchor||u;
   if(u.ammoRemaining!==0)return {x:nearest.x-u.battleSide*range,z:nearest.z+flank*4};
  }
  const spearAhead=early&&nearestGuard&&distance(u,nearestGuard)<25;
  if(spearAhead){const offset=flank*23;return {x:nearestGuard.x-u.battleSide*16,z:nearestGuard.z+offset};}
  const edge=Math.max(28,...enemies.filter(q=>troopRole(q.kind)==='melee').map(q=>Math.abs(q.z)))+12;
  const wing=flank*Math.min(128,edge);
  if(!u.flankReady&&Math.abs(u.z-wing)>9&&Math.abs(u.x-nearest.x)>13)return {x:u.x,z:wing};
  u.flankReady=true;
  return squadContactGoal(u,nearest);
 }
 if(troopRole(u.kind)==='siege'&&u.ammoRemaining!==0){const x=nearest.x-u.battleSide*a.range*.8;return distance(u,nearest)>a.range*.9?{x:u.battleSide>0?Math.max(u.x,x):Math.min(u.x,x),z:u.deployment?.z??u.z}:null;}
 if(u.tacticalRole==='shot'&&u.ammoRemaining!==0){return distance(u,nearest)>a.range*.8?{x:nearest.x-u.battleSide*a.range*.7,z:u.deployment?.z??u.z}:null;}
 if(isBow(u)&&u.ammoRemaining!==0){const front=squads.filter(q=>q.team===u.team&&q.tacticalRole==='line'&&!q.routing),closest=front.reduce((p,q)=>!p||distance(q,nearest)<distance(p,nearest)?q:p,null);if(closest&&distance(u,nearest)>a.range*.85){const x=closest.x-u.battleSide*5;return {x:u.battleSide>0?Math.max(u.x,x):Math.min(u.x,x),z:u.deployment?.z??u.z};}return null;}
 return squadContactGoal(u,nearest);
}
export function tacticalDamage(attacker,target,amount,projectile=usesArrows(attacker.u)?'arrow':isBow(attacker.u)?'bullet':null){
 const {m,u}=attacker,v=target.u,n=target.m,dx=m.x-n.x,dz=m.z-n.z,d=Math.hypot(dx,dz)||1,front=(dx*Math.sin(n.heading??v.heading??0)+dz*Math.cos(n.heading??v.heading??0))/d,flanked=front<.15;
 const braced=isSpear(v)&&!n.moving&&(v.cohesion??1)>.45;
 if(flanked){amount*=front<-.4?1.35:1.15;v.moraleShock=Math.min(18,(v.moraleShock||0)+.25);}
 else if(braced&&projectile==='arrow')amount*=.7;
 if(braced&&horseKind(u)&&!projectile)amount*=u.kind==='bronze_cavalry'?.38:.55;
 if(u.kind==='chariot'&&!projectile)amount*=.5;
 if(isSpear(u)&&troopRole(v.kind)==='cavalry'&&!m.moving&&(u.cohesion??1)>.45)amount*=1.6;
 return formationDamage(attacker,target,amount,projectile)*(1-m.fatigue*.002);
}
export function shotHits(m,u,d,range,target=null){const shot=m.shotsFired=(m.shotsFired||0)+1;let seed=(u.source+1)*73856093+(m.index+1)*19349663+shot*83492791;seed=Math.imul(seed^(seed>>>16),0x45d9f3b);const roll=(seed>>>0)/4294967296,chance=Math.max(.3,Math.min(.88,.91-.4*d/Math.max(1,range)-(m.wasMoving?.13:0)+(u.formation==='volley'?.08:0)))*(target?missileExposure(target):1);return roll<chance;}
