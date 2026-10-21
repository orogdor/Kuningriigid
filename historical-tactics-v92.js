import {BOW_DAMAGE_MULTIPLIER} from './unit-balance-v99.js';
import {squadContactGoal} from './combat-contact-v96.js';
import {FORMATIONS,formationDamage,missileExposure} from './formations-v94.js';
import {BATTLE_FRONT_DEPTH,BATTLE_EMPTY_HALF_WIDTH} from './battle-pacing-v93.js';
import {troopRole,rangedTroop} from './military-v88.js';
import {unitStats} from './army-experience-v88.js';
export const usesArrows=u=>['slinger','archer','bronze_archer','iron_archer','crossbowman','chariot','javelinman'].includes(u.kind);
export const isBow=u=>rangedTroop(u.kind)||u.kind==='chariot';
export const isSpear=u=>['spearman','bronze_spearman','halberdier','pikeman','javelinman'].includes(u.kind);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function tacticalStats(def,u){const a=unitStats(def,u);a.speed*=u.routing?1:(FORMATIONS[u.formation]||FORMATIONS.line).speed;if(u.kind==='cuirassier')a.range=2.7;if(u.kind==='chariot'){a.range=18*(u.experienceMultiplier||1);a.dmg=18*BOW_DAMAGE_MULTIPLIER*(u.experienceMultiplier||1)*({mobilized:.4,elite:1.4}[u.grade]||1);}return a;}
export function deployHistoricalBattle(b){
 const teams=[...new Set(b.squads.map(u=>u.team))];for(let t=0;t<teams.length;t++){const team=teams[t],side=t%2?-1:1,list=b.squads.filter(u=>u.team===team&&!u.guardPost),front=list.filter(u=>troopRole(u.kind)==='melee'&&!/axeman/.test(u.kind)),reserve=list.filter(u=>/axeman/.test(u.kind)),guns=list.filter(u=>['musketeer','arquebusier','line_infantry','rifleman'].includes(u.kind)),bows=list.filter(u=>isBow(u)&&u.kind!=='chariot'&&!guns.includes(u)),mounted=list.filter(u=>troopRole(u.kind)==='cavalry'||troopRole(u.kind)==='vehicle'),other=list.filter(u=>![...front,...reserve,...bows,...guns,...mounted].includes(u));
  const line=(units,depth,spacing,role)=>units.forEach((u,i)=>{u.x=-side*(depth+Math.floor(i/10)*7);u.z=(i%10-(Math.min(10,units.length)-1)/2)*spacing;u.heading=side*Math.PI/2;u.tacticalRole=role;u.battleSide=side;u.deployment={x:u.x,z:u.z};u.releaseAt=role==='support'?16:0;});
  line(front,BATTLE_FRONT_DEPTH,5.1,'line');guns.forEach((u,i)=>{const wing=i%2?1:-1;u.x=-side*(BATTLE_FRONT_DEPTH+Math.floor(i/8)*7);u.z=wing*(Math.max(12,Math.min(10,front.length)*2.55+5)+Math.floor(i/2)%4*6);u.heading=side*Math.PI/2;u.tacticalRole='shot';u.battleSide=side;u.deployment={x:u.x,z:u.z};});line(bows,BATTLE_FRONT_DEPTH+16,6,'missile');line(reserve,BATTLE_FRONT_DEPTH+30,7,'support');line(other,BATTLE_FRONT_DEPTH+22,8,'support');
  mounted.forEach((u,i)=>{const flank=i%2?1:-1;u.x=-side*(BATTLE_FRONT_DEPTH-2);u.z=flank*(Math.max(38,front.length*3.2+16)+Math.floor(i/2)*16);u.heading=side*Math.PI/2;u.tacticalRole=u.kind==='chariot'?'mobile-missile':'flank';u.flank=flank;u.battleSide=side;u.deployment={x:u.x,z:u.z};});
 }
 b.deploymentGap={minX:-BATTLE_EMPTY_HALF_WIDTH,maxX:BATTLE_EMPTY_HALF_WIDTH};b.doctrineVersion=1;b.doctrine='Rivi, laskurite toetus, tiivamanööver ja moraal';return b;
}
export function initializeTactics(b){
 for(const u of b.squads){u.battleSide??=u.team? -1:1;u.tacticalRole??=u.kind==='chariot'?'mobile-missile':isBow(u)?'missile':troopRole(u.kind)==='cavalry'?'flank':'line';u.deployment??={x:u.x,z:u.z};u.startMen??=u.men?.filter(m=>m.hp>0).length||0;
  for(const m of u.men||[]){m.morale??=u.grade==='mobilized'?64:u.grade==='elite'?94:82;m.fatigue??=0;m.ammo??=isBow(u)?usesArrows(u)?u.kind==='chariot'?24:20:troopRole(u.kind)==='siege'?12:60:null;}
 }
}
export function updateMorale(b,dt){
 for(const u of b.squads){if(!u.men||u.reserve||u.retreated)continue;const men=u.men.filter(m=>m.hp>0&&!m.escaped),loss=1-men.length/Math.max(1,u.startMen),friends=b.squads.filter(q=>q!==u&&q.team===u.team&&q.hp>0&&!q.routing&&!q.retreated&&!q.reserve&&distance(q,u)<16),panic=b.squads.some(q=>q!==u&&q.team===u.team&&q.routing&&distance(q,u)<18);
  u.ammoRemaining=men.reduce((n,m)=>n+(m.ammo||0),0);u.cohesion=men.length?Math.max(0,1-men.reduce((n,m)=>n+Math.max(0,distance(m,u)-4),0)/men.length/12):0;
  for(const m of men){const base=u.grade==='mobilized'?64:u.grade==='elite'?94:82,target=base-loss*70+(friends.length?7:0)-(panic?9:0)-(u.moraleShock||0)-m.fatigue*.07-(1-u.cohesion)*10;
   m.morale=Math.max(0,Math.min(100,m.morale+(target-m.morale)*Math.min(1,dt*.5)));if(m.morale<24)m.routing=true;else if(m.morale>46&&!u.routing)m.routing=false;
  }u.morale=men.length?men.reduce((n,m)=>n+m.morale,0)/men.length:0;u.moraleShock=Math.max(0,(u.moraleShock||0)-dt*.5);
  if(men.length&&(men.filter(m=>m.routing).length>men.length*.45||(loss>.6&&u.morale<38))){if(!u.routing){u.routing=true;u.routAt=b.elapsed;b.moraleRouts=(b.moraleRouts||0)+1;}for(const m of men)m.routing=true;u.manualOrder=false;u.target=null;}
 }
}
export function tacticalGoal(u,nearest,squads,b,a){
 if(u.routing)return {x:-u.battleSide*250,z:u.z};if(isBow(u)&&u.ammoRemaining===0)return squadContactGoal(u,nearest);if((FORMATIONS[u.formation]||{}).hold)return u.anchor||u;if((u.releaseAt||0)>b.elapsed&&distance(u,nearest)>26)return u.deployment;
 if(u.tacticalRole==='support'&&b.elapsed<(u.releaseAt||16)&&distance(u,nearest)>16)return u.deployment;
 if(u.tacticalRole==='flank'||u.kind==='chariot'){
  const enemies=squads.filter(q=>q.team!==u.team&&!q.routing),edge=Math.max(28,...enemies.filter(q=>troopRole(q.kind)==='melee').map(q=>Math.abs(q.z)))+12,flank=u.flank||(u.source%2?1:-1),z=flank*Math.min(130,edge);
  if(!isBow(u)&&Math.abs(u.x-nearest.x)<10)u.flankReady=true;if(u.flankReady&&!isBow(u))return squadContactGoal(u,nearest);
  if(Math.abs(u.z-z)>12&&Math.abs(u.x-nearest.x)>14)return {x:u.x,z};
  if(u.kind==='chariot'&&u.ammoRemaining!==0&&distance(u,nearest)<4)return {x:u.x,z:u.z+flank*8};
  const x=nearest.x-u.battleSide*(u.kind==='chariot'&&u.ammoRemaining!==0?a.range*.7:0);return {x:u.kind==='chariot'&&u.ammoRemaining!==0?(u.battleSide>0?Math.max(u.x,x):Math.min(u.x,x)):x,z};
 }
 if(u.tacticalRole==='shot'&&u.ammoRemaining!==0){return distance(u,nearest)>a.range*.8?{x:nearest.x-u.battleSide*a.range*.7,z:u.deployment?.z??u.z}:null;}
 if(isBow(u)&&u.ammoRemaining!==0){const front=squads.filter(q=>q.team===u.team&&q.tacticalRole==='line'&&!q.routing),closest=front.reduce((p,q)=>!p||distance(q,nearest)<distance(p,nearest)?q:p,null);if(closest&&distance(u,nearest)>a.range*.85){const x=closest.x-u.battleSide*5;return {x:u.battleSide>0?Math.max(u.x,x):Math.min(u.x,x),z:u.deployment?.z??u.z};}return null;}
 return squadContactGoal(u,nearest);
}
export function tacticalDamage(attacker,target,amount,projectile=usesArrows(attacker.u)?'arrow':isBow(attacker.u)?'bullet':null){
 const {m,u}=attacker,v=target.u,n=target.m,dx=m.x-n.x,dz=m.z-n.z,d=Math.hypot(dx,dz)||1,front=(dx*Math.sin(n.heading??v.heading??0)+dz*Math.cos(n.heading??v.heading??0))/d,flanked=front<.15;
 const braced=isSpear(v)&&!n.moving&&(v.cohesion??1)>.45;
 if(flanked){amount*=front<-.4?1.35:1.15;v.moraleShock=Math.min(18,(v.moraleShock||0)+.25);}
 else if(braced&&projectile==='arrow')amount*=.7;
 if(braced&&troopRole(u.kind)==='cavalry'&&!isBow(u))amount*=.55;
 if(isSpear(u)&&troopRole(v.kind)==='cavalry'&&!m.moving&&(u.cohesion??1)>.45)amount*=1.6;
 return formationDamage(attacker,target,amount,projectile)*(1-m.fatigue*.002);
}
export function shotHits(m,u,d,range,target=null){const shot=m.shotsFired=(m.shotsFired||0)+1;let seed=(u.source+1)*73856093+(m.index+1)*19349663+shot*83492791;seed=Math.imul(seed^(seed>>>16),0x45d9f3b);const roll=(seed>>>0)/4294967296,chance=Math.max(.3,Math.min(.88,.91-.4*d/Math.max(1,range)-(m.wasMoving?.13:0)+(u.formation==='volley'?.08:0)))*(target?missileExposure(target):1);return roll<chance;}
