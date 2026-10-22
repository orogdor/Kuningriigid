import {carriesSword,stoneThrower} from './combat-equipment-v100.js?v=107a';
import {rockLandingPoint} from './catapult-accuracy-v105.js';
import {committedOpponent,marchingGoal,keepAdvance} from './battle-doctrine-v98.js?v=107a';
import {retreatPoint} from './battle-movement-v97.js';
import {meleeReach,soldierBodyRadius} from './combat-contact-v96.js';
import {FORMATIONS,updateFormations,worldSlot,turnTowards,formationAttackReady,clearShot} from './formations-v94.js?v=107a';
import {allowedDeployment} from './battle-pacing-v93.js';
import {horseKind,isBow,usesArrows,tacticalStats,initializeTactics,updateMorale,tacticalGoal,tacticalDamage,shotHits} from './historical-tactics-v92.js?v=107a';
import {soldierCount,constrainStep} from './soldier-collision-v90.js?v=101a';
import {troopRole,rangedTroop} from './military-v88.js';
import {unitStats} from './army-experience-v88.js';
import {isSiegeUnit,siegeDamage} from './medieval-v62.js';
import {tickSiegeCraft,siegeAssaultGoal,siegeOccupation} from './siege-assault-v108.js';
import {BATTLEFIELD,outsideBattlefield,checkBattleRetreats} from './battlefield-v88.js';
export const MAX_BATTLE_MEN=500;
// Stones have physical flight time. Damage is resolved on landing, not when fired.
export const STONE_FLIGHT=1.1, STONE_RADIUS=4.2, CATAPULT_RELOAD=8.4;
export const escapedMen=b=>b.squads.reduce((n,u)=>n+(u.men||[]).filter(m=>m.hp>0&&m.escaped).length,0);
const live=u=>u.hp>0&&!u.retreated&&!u.reserve;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const livingMen=u=>u.men?u.men.filter(m=>m.hp>0).length:u.soldiers?u.soldiers.filter(m=>m.hp>0).length:Math.ceil((u.guardPost?1:u.menCount||soldierCount(u))*Math.min(1,u.hp/(u.maxHp||u.hp)));
export function battleManCount(b,team=null){return b.squads.filter(u=>!u.reserve&&!u.retreated&&(team==null||u.team===team)).reduce((n,u)=>n+(u.men?u.men.filter(m=>m.hp>0&&!m.escaped).length:livingMen(u)),0);}
// Admit whole squads, alternating countries. Over-cap units are retained in
// reserve, with their original health and campaign identity intact.
export function admitBattle(b){
 const teams=[...new Set(b.squads.filter(u=>u.hp>0&&!u.retreated).map(u=>u.team))],queues=teams.map(t=>b.squads.filter(u=>u.team===t&&u.hp>0&&!u.retreated));let used=0,remaining=true;
 for(const u of b.squads)u.reserve=false;
 while(remaining){remaining=false;for(const q of queues){const u=q.shift();if(!u)continue;remaining=true;const n=livingMen(u);u.reserve=used+n>MAX_BATTLE_MEN;if(!u.reserve)used+=n;}}
 b.maxMen=MAX_BATTLE_MEN;b.reserveMen=b.squads.filter(u=>u.reserve).reduce((n,u)=>n+livingMen(u),0);return used;
}
function aggregate(u){u.hp=Math.round(u.men.reduce((n,m)=>n+Math.max(0,m.hp),0)*1e9)/1e9;u.menAlive=u.men.filter(m=>m.hp>0).length;}
export function initializeMen(b,nav=null){
 if(b.individualVersion===1&&b.squads.every(u=>u.reserve||u.hp<=0||u.men)){if(b.contactVersion!==96){for(const u of b.squads)for(const m of u.men||[])m.radius=soldierBodyRadius(u);b.contactVersion=96;}return;}
 if(!b.individualVersion)admitBattle(b);
 const placed=[],open=nav?((x,z)=>nav.open(x,z)):()=>true;
 for(const u of b.squads){if(u.reserve||u.hp<=0||u.retreated)continue;if(u.men){placed.push(...u.men.filter(m=>m.hp>0&&!u.guardPost));continue;}
  const count=u.guardPost?1:u.menCount||soldierCount(u),max=(u.maxHp||u.hp)/count,old=u.soldiers,ratio=Math.min(1,u.hp/(u.maxHp||u.hp)),alive=old?old.filter(m=>m.hp>0).length:Math.min(count,Math.ceil(u.hp/max-1e-9)),mounted=u.kind==='bronze_catapult'||['cavalry','vehicle'].includes(troopRole(u.kind)),spacing=mounted?4.1:1.05,c=Math.cos(u.heading||0),sn=Math.sin(u.heading||0);
  u.men=Array.from({length:count},(_,i)=>{let hp=old?(old[i]?.hp||0):i<alive?Math.min(max,Math.max(0,u.hp-i*max)):0;const columns=count>=24&&!mounted?6:4,ox=count===1?0:(i%columns-(columns-1)/2)*spacing,oz=count===1?0:(Math.floor(i/columns)-(Math.ceil(count/columns)-1)/2)*spacing,goal={x:u.x+c*ox+sn*oz,z:u.z-sn*ox+c*oz},m={id:u.source+':'+i,index:i,x:goal.x,z:goal.z,hp,maxHp:max,cool:(i%4)*.08,radius:soldierBodyRadius(u),heading:u.heading||0,kills:0,damageDealt:0};
   if(old&&hp>0){const sum=old.reduce((n,p)=>n+p.hp,0)||1;hp=Math.min(max,u.hp*hp/sum);m.hp=hp;}
   if(hp>0&&!u.guardPost){let found=false;for(let ring=0;ring<100&&!found;ring++)for(let k=0;k<Math.max(1,ring*8);k++){const a=k/Math.max(1,ring*8)*Math.PI*2;m.x=goal.x+Math.cos(a)*ring*.5;m.z=goal.z+Math.sin(a)*ring*.5;if(allowedDeployment(u,m,b)&&!outsideBattlefield(m)&&open(m.x,m.z)&&placed.every(p=>dist(p,m)>=p.radius+m.radius+.025)){found=true;break;}}if(!found)throw Error('Lahingus ei leitud mehele vaba kohta');placed.push(m);}return m;});
  u.menCount=count;u.maxHp=max*count;aggregate(u);u.anchor={x:u.x,z:u.z};
 }
 b.individualVersion=1;b.contactVersion=96;initializeTactics(b);b.initialMen??=battleManCount(b);b.casualties??={};
}
function damageMan(b,attacker,target,amount,splash=false){
 const m=target.m,u=target.u,before=m.hp;m.hp=Math.max(0,m.hp-amount);m.hitTime=b.elapsed;const hit=before-m.hp;
 if(attacker){attacker.m.damageDealt+=hit;attacker.u.damageDealt=(attacker.u.damageDealt||0)+hit;if(!splash){attacker.m.attackTime=b.elapsed;attacker.u.attackTime=b.elapsed;attacker.m.shot={x:attacker.m.x,z:attacker.m.z,toX:m.x,toZ:m.z};attacker.u.shot=attacker.m.shot;}}
 u.hitTime=b.elapsed;u.hp=Math.max(0,u.hp-hit);if(before>0&&m.hp<=0){m.deathTime=b.elapsed;b.casualties[u.team]=(b.casualties[u.team]||0)+1;if(attacker&&attacker.m!==m){attacker.m.kills++;attacker.u.kills=(attacker.u.kills||0)+1;}}return hit;
}
// An impact hits all living figures in the circle, irrespective of faction.
function resolveStoneLandings(b){
 b.rockShots??=[];b.rockImpacts??=[];
 // Convert projectiles already airborne in a saved V104 battle exactly once.
 for(const shot of b.rockShots)if(shot.balanceVersion!==105){shot.radius*=.75;shot.damage*=1.25;shot.balanceVersion=105;}
 const due=b.rockShots.filter(shot=>shot.landsAt<=b.elapsed);
 b.rockShots=b.rockShots.filter(shot=>shot.landsAt>b.elapsed);
 for(const shot of due){
  const attackerSquad=b.squads.find(u=>u.source===shot.source&&u.team===shot.team);
  const man=attackerSquad?.men?.find(m=>m.id===shot.manId);
  const attacker=man?{u:attackerSquad,m:man}:null;
  let injured=0,friendlies=0;
  for(const u of b.squads)if(!u.reserve&&!u.retreated)for(const m of u.men||[]){
   if(m.hp<=0||m.escaped)continue;
   const d=Math.max(0,Math.hypot(m.x-shot.x,m.z-shot.z)-(m.radius||.34)*.25);
   if(d>shot.radius)continue;
   const damage=shot.damage*(.25+.75*(1-d/shot.radius));
   if(damageMan(b,u.team===shot.team?null:attacker,{u,m},damage,true)>0){injured++;if(u.team===shot.team)friendlies++;}
  }
  for(const structure of [...(b.siegeSections||[]),...(b.fortress?[b.fortress]:[])]){
   if(structure.hp<=0||dist(structure,shot)>shot.radius+2)continue;
   if(structure===b.fortress)structure.hp=Math.max(0,structure.hp-shot.damage*.7);
   else{siegeDamage({kind:shot.kind},structure,shot.damage*.8);if(structure.breached){b.siegeBreached=true;b.breachAt={x:structure.x,z:structure.z};}}
  }
  b.rockImpacts.push({id:shot.id,x:shot.x,z:shot.z,at:b.elapsed,radius:shot.radius,injured,friendlies});
 }
 b.rockImpacts=b.rockImpacts.filter(hit=>b.elapsed-hit.at<1.15);
}
export function tickIndividualBattle(b,dt,stats,tech=0,nav=null){
 if(b.result||dt<=0)return;initializeMen(b,nav);initializeTactics(b);b.elapsed+=dt;resolveStoneLandings(b);updateMorale(b,dt);tickSiegeCraft(b,dt,nav);updateFormations(b,dt,stats);checkBattleRetreats(b);
 if(b.fortress&&b.fortress.hp<=0&&!b.fortressFallen){b.fortressFallen=true;for(const u of b.squads.filter(u=>u.team===b.fortress.team&&live(u))){u.routing=true;u.manualOrder=false;u.target=null;for(const m of u.men||[])if(m.hp>0&&!m.escaped)m.routing=true;}}
 const fighting=[...new Set(b.squads.filter(u=>live(u)&&!u.routing&&(u.men||[]).some(m=>m.hp>0&&!m.escaped&&!m.routing)).map(u=>u.team))];b.pursuitStoppedTeam=fighting.length===1&&(!b.fortress||b.fortress.hp<=0||b.fortress.team===fighting[0])?fighting[0]:null;
 // Clear completed explicit targets; manual units then wait for the next order.
  for(const u of b.squads)if(u.attackTargetSource!=null&&!b.squads.some(v=>v.source===u.attackTargetSource&&v.team!==u.team&&live(v)))u.attackTargetSource=null;
  const squads=b.squads.filter(live),agents=[];for(const u of squads){for(const m of u.men||[])if(m.hp>0&&!m.escaped)agents.push({m,u});}
 const enemies=new Map([...new Set(squads.map(u=>u.team))].map(t=>[t,agents.filter(p=>p.u.team!==t)])),bins=new Map(),key=(x,z)=>Math.floor(x/8)+':'+Math.floor(z/8);
 const insert=m=>{const k=key(m.x,m.z),list=bins.get(k)||[];list.push(m);bins.set(k,list);};for(const p of agents)if(!p.u.guardPost)insert(p.m);
 const nearby=m=>{const list=[],x=Math.floor(m.x/8),z=Math.floor(m.z/8);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)list.push(...(bins.get((x+dx)+':'+(z+dz))||[]).filter(p=>p.hp>0&&!p.escaped));return list;};
 const open=nav?((x,z)=>nav.open(x,z)):()=>true;
 // A squad anchor supplies marching waypoints only; it neither attacks nor
 // owns health. Close combat is resolved independently at each man's position.
 for(const u of squads){const foes=squads.filter(v=>v.team!==u.team),ordered=foes.find(v=>u.attackTargetSource!=null&&v.source===u.attackTargetSource),nearest=ordered||committedOpponent(u,foes)||(b.fortress?.hp>0&&b.fortress.team!==u.team?b.fortress:null),a=tacticalStats(stats[u.kind],u),anchor=u.anchor??={x:u.x,z:u.z};u.moving=false;if(u.siegeBuildingId!=null&&!u.routing){u.anchor={x:u.x,z:u.z};continue;}if(b.pursuitStoppedTeam===u.team&&!u.routing&&!(horseKind(u)&&foes.some(v=>v.routing&&!v.retreated&&dist(u,v)<50&&Math.abs(v.x)<185&&Math.abs(v.z)<158))){u.anchor={x:u.x,z:u.z};continue;}
  let goal=u.manualOrder&&u.target?u.target:null;
  if(!goal&&nearest&&(u.routing||u.manualOrder||u.attackTargetSource!=null||((u.combatMode??'auto')!=='manual'&&(u.team!==0||u.advance||u.civilian||horseKind(u)||u.team===0||dist(u,nearest)<30))))goal=siegeAssaultGoal(b,u)||marchingGoal(u,nearest,tacticalGoal(u,nearest,squads,b,a,nav));
  if(goal&&(!u.guardPost||u.routing)){const lead=dist(anchor,u),maxLead=u.kind==='chariot'?15:horseKind(u)?12:3;const ahead=(anchor.x-u.x)*(goal.x-anchor.x)+(anchor.z-u.z)*(goal.z-anchor.z)>0;const marchSpeed=lead>maxLead&&ahead?0:a.speed;const marchDistance=dist(anchor,goal),marchHeading=Math.atan2(goal.x-anchor.x,goal.z-anchor.z);if(nav)nav.move(anchor,goal,dt,marchSpeed*(1-(u.men.reduce((n,m)=>n+m.fatigue,0)/u.men.length)*.0025));else{const d=dist(anchor,goal),f=d?Math.min(1,marchSpeed*dt/d):0;anchor.x+=(goal.x-anchor.x)*f;anchor.z+=(goal.z-anchor.z)*f;}if(marchDistance>.1)u.heading=u.fixedFacing??turnTowards(u.heading||0,(u.kind==='chariot'&&u.chariotPhase!=='shoot'?marchHeading:!u.manualOrder&&!u.routing&&nearest?Math.atan2(nearest.x-u.x,nearest.z-u.z):marchHeading),dt,(FORMATIONS[u.formation]||FORMATIONS.line).turn);}
  if(u.manualOrder&&u.target&&dist(u,u.target)<2){u.manualOrder=false;u.target=null;}
 }
 for(const actor of agents){const {m,u}=actor;if(m.hp<=0||m.escaped||u.retreated)continue;const a=tacticalStats(stats[u.kind],u),count=u.menCount||soldierCount(u);if(m.routing&&!u.routing)a.speed/=(FORMATIONS[u.formation]||FORMATIONS.line).speed;if(u.kind==='dragoon'&&m.dismounted)a.speed*=.58;if(stoneThrower(u)&&m.catapultReloadVersion!==104){if(m.cool>0)m.cool*=3;m.catapultReloadVersion=104;}m.cool=Math.max(0,m.cool-dt);m.wasMoving=!!m.moving;m.moving=false;
  let enemy=null,best=Infinity,threat=null,threatDistance=Infinity;for(const p of enemies.get(u.team)||[]){if(p.m.hp<=0||p.m.escaped||p.u.retreated)continue;if(u.attackTargetSource!=null&&p.u.source!==u.attackTargetSource)continue;
   if((u.combatMode??'auto')==='manual'&&u.attackTargetSource==null)continue;
   const d=dist(m,p.m),score=d+(m.targetId===p.m.id?-1.2:0)+Math.abs(p.m.z-m.z)*.15;if(!p.u.routing&&!p.m.routing&&d<threatDistance){threat=p.m;threatDistance=d;}if(score<best){best=score;enemy=p;}}m.targetId=enemy?.m.id??null;if(u.kind==='dragoon'&&!u.routing&&!m.routing)m.dismounted=!!enemy&&!u.manualOrder&&best<a.range*1.15&&threatDistance>5;else if(u.kind==='dragoon')m.dismounted=false;
  const sections=(b.siegeSections||[]).filter(p=>p.hp>0&&p.team!==u.team&&!b.siegeBreached),fort=b.fortress?.hp>0&&b.fortress.team!==u.team?b.fortress:null,wall=isSiegeUnit(u.kind)&&sections.length?sections.reduce((p,v)=>dist(m,v)<dist(m,p)?v:p):null,structure=wall||(!enemy?(sections[0]||fort):null);
  const target=structure||enemy?.m||(u.manualOrder&&u.target?u.target:null)||((m.routing||u.routing)?{x:-u.battleSide*250,z:m.z}:null);if(!target)continue;const d=dist(m,target),desiredHeading=Math.atan2(target.x-m.x,target.z-m.z),defensive=!!(FORMATIONS[u.formation]||{}).defensive&&!m.routing&&!u.routing&&b.pursuitStoppedTeam!==u.team;m.heading=turnTowards(m.heading||0,defensive?(u.formationFacing??u.heading):desiredHeading,dt,defensive?.7:u.kind==='chariot'?.7:troopRole(u.kind)==='cavalry'?1.1:2);const facing=Math.abs(Math.atan2(Math.sin(desiredHeading-m.heading),Math.cos(desiredHeading-m.heading)));const rangedShot=isBow(u)&&m.ammo>0&&(!carriesSword(u)||d>=3);m.weapon=u.kind==='chariot'?(rangedShot?'bow':null):carriesSword(u)?rangedShot?'bow':'sword':stoneThrower(u)?rangedShot?'stone':'melee':['dragoon','cuirassier'].includes(u.kind)?rangedShot?'gun':'sabre':null;const range=(rangedShot?a.range:meleeReach(u,m,enemy?.m))+(u.guardPost&&rangedShot&&!['archer','bronze_archer','iron_archer','crossbowman'].includes(u.kind)?5:0)+(structure?6:0),chariotReady=u.kind!=='chariot'||(rangedShot&&(u.chariotPhase==='shoot'||u.chariotPhase==='approach'||u.formation==='hold')),canAttack=formationAttackReady(u,m,b,u.siegeBuildingId==null&&chariotReady&&((u.combatMode??'auto')!=='manual'||u.attackTargetSource!=null)&&(u.kind!=='dragoon'||!rangedShot||(m.dismounted&&!m.wasMoving))&&!u.manualOrder&&!m.routing&&!u.routing&&d<=range&&facing<(defensive?1.2:1.65)&&(!rangedShot||!['musketeer','arquebusier','line_infantry','rifleman','machinegun_team','modern_infantry','dragoon','cuirassier','chariot'].includes(u.kind)||clearShot(actor,enemy,agents)));
  m.fatigue=Math.max(0,Math.min(100,m.fatigue+(canAttack?.22:-.3)*dt));if(canAttack){if(m.cool===0){if(!rangedShot&&!structure){m.lastMeleeDistance=d;m.lastMeleeReach=range;}if(u.formation==='volley')m.lastVolley=u.volleyNumber;let amount=a.dmg/(u.guardPost?1:soldierCount(u))*(u.guardPost?1.3:1)*(1+(Array.isArray(tech)?tech[u.team]||0:u.team?0:tech)*.3);
    u.projectile=rangedShot?(stoneThrower(u)?'stone':usesArrows(u)?'arrow':'bullet'):null;m.projectile=u.projectile;if(rangedShot){m.ammo--;const accurate=stoneThrower(u)?null:shotHits(m,u,d,range,enemy?.u);if(stoneThrower(u)){
     m.shotsFired=(m.shotsFired||0)+1;
     const {x:tx,z:tz}=rockLandingPoint(u,m.shotsFired,target);
     b.rockShots??=[];b.rockShots.push({id:u.source+':'+m.id+':'+m.shotsFired,source:u.source,team:u.team,kind:u.kind,manId:m.id,x:tx,z:tz,landsAt:b.elapsed+STONE_FLIGHT,damage:amount,radius:STONE_RADIUS,balanceVersion:105});
     m.attackTime=b.elapsed;m.shot={x:m.x,z:m.z,toX:tx,toZ:tz};u.shot=m.shot;u.attackTime=b.elapsed;
     m.cool=CATAPULT_RELOAD/a.attackSpeed;continue;
    }if(!accurate){m.attackTime=b.elapsed;m.shot={x:m.x,z:m.z,toX:target.x+2,toZ:target.z+2};u.shot=m.shot;u.attackTime=b.elapsed;m.cool=(isSiegeUnit(u.kind)?2.8:1.8)/a.attackSpeed;continue;}}else if(isBow(u))amount*=carriesSword(u)?.6:.35;
    if(enemy&&!structure){amount=tacticalDamage(actor,enemy,amount,u.projectile);const role=troopRole(enemy.u.kind),reduction={heavy_cavalry:.75,knight:.8,man_at_arms:.83,halberdier:.92}[enemy.u.kind]||1,pierce=u.kind==='crossbowman'?.5:0;amount*=reduction+(1-reduction)*pierce;if(['halberdier','pikeman'].includes(u.kind)&&role==='cavalry')amount*=1.7;if(u.kind==='rocket_team'&&role==='vehicle')amount*=1.8;damageMan(b,actor,enemy,amount);}
    else{const before=structure.hp;if(wall||sections.includes(structure)){siegeDamage(u,structure,amount);if(structure.breached){b.siegeBreached=true;b.breachAt={x:structure.x,z:structure.z};}}else structure.hp=Math.max(0,structure.hp-amount);const hit=before-structure.hp;u.damageDealt=(u.damageDealt||0)+hit;m.damageDealt+=hit;m.attackTime=b.elapsed;u.attackTime=b.elapsed;}
    m.cool=(u.kind==='dragoon'?2.4:u.kind==='cuirassier'?2.1:u.kind==='crossbowman'?1.9:isSiegeUnit(u.kind)?2.8:u.kind==='heavy_cavalry'?1.45:1.2)*(1+m.fatigue*.003)/a.attackSpeed;
   }continue;
  }
  if(u.siegeBuildingId!=null&&!u.routing){m.moving=false;continue;}if(b.pursuitStoppedTeam===u.team&&!u.routing&&!m.routing&&!(horseKind(u)&&enemy?.u.routing&&Math.abs(enemy.m.x)<185&&Math.abs(enemy.m.z)<158&&d<50)){m.moving=false;continue;}if(u.guardPost&&!u.routing&&!m.routing)continue;
  const anchor=u.anchor||u;
  let goal=worldSlot(u,m,u.men.filter(n=>n.hp>0&&!n.escaped).length);
  if(m.routing||u.routing)goal=nav?.escapeGoal?nav.escapeGoal(m,u.battleSide,threat):(m.escapeTarget??=retreatPoint(m,u.battleSide,threat));
  else if(!u.manualOrder&&((u.combatMode??'auto')!=='manual'||u.attackTargetSource!=null)){const form=FORMATIONS[u.formation]||FORMATIONS.line;if(u.formationManual&&u.formation==='skirmish'&&m.ammo>0&&d<range*.35)goal={x:m.x-u.battleSide*7,z:m.z};else if(!form.hold){if(isBow(u)&&m.ammo>0&&m.weapon!=='sword'){if(u.formationManual&&u.formation==='skirmish'&&d<range*.3)goal={x:m.x-u.battleSide*3,z:m.z};}else if(d<9&&dist(m,anchor)<10)goal=target;}}
  goal=keepAdvance(u,m,goal,d,target);if(m.yieldGoal&&m.yieldUntil>b.elapsed&&dist(m,m.yieldGoal)>.3)goal=m.yieldGoal;if(nav?.waypoint)goal=nav.waypoint(m,goal,b.elapsed);const old={x:m.x,z:m.z},bin=bins.get(key(m.x,m.z));if(bin)bin.splice(bin.indexOf(m),1);const peers=nearby(m),length=dist(m,goal),step=Math.min(length,a.speed*(m.routing?1.1:1)*(1-m.fatigue*.0025)*dt),f=length?step/length:0,dx=(goal.x-m.x)*f,dz=(goal.z-m.z)*f;
  const walkOpen=(u.guardPost&&u.routing&&!open(m.x,m.z))?()=>true:open;m.moving=constrainStep(m,{x:m.x+dx,z:m.z+dz},peers,walkOpen);
  if(dist(old,m)<step*.2&&length>.2){for(const angle of [.7,-.7,1.3,-1.3]){const co=Math.cos(angle),si=Math.sin(angle);if(constrainStep(m,{x:m.x+dx*co-dz*si,z:m.z+dx*si+dz*co},peers,open)&&dist(old,m)>step*.2){m.moving=true;break;}}}
  if(length>.3&&dist(old,m)<step*.2){m.blockedFor=(m.blockedFor||0)+dt;if(m.blockedFor>.6){const vectors=[{x:0,z:step},{x:0,z:-step},{x:step,z:0},{x:-step,z:0},...[2.1,-2.1,Math.PI].map(a=>({x:dx*Math.cos(a)-dz*Math.sin(a),z:dx*Math.sin(a)+dz*Math.cos(a)}))];for(const v of vectors){if(constrainStep(m,{x:m.x+v.x,z:m.z+v.z},peers,walkOpen)&&dist(old,m)>step*.2){const d=Math.hypot(v.x,v.z)||1,space=m.radius>1?7:3;m.yieldGoal={x:m.x+v.x/d*space,z:m.z+v.z/d*space};m.yieldUntil=b.elapsed+2;m.moving=true;m.blockedFor=0;break;}}}}else m.blockedFor=0;
  if(m.moving){m.fatigue=Math.min(100,m.fatigue+dt*(u.formation==='charge'?1.5:.85));if(u.formation==='charge'&&!m.routing)m.chargeDistance=(m.chargeDistance||0)+dist(old,m);if(!defensive)m.heading=turnTowards(m.heading||0,Math.atan2(m.x-old.x,m.z-old.z),dt,u.kind==='chariot'?.75:2);u.moving=true;}insert(m);
  if(outsideBattlefield(m)){u.x=m.x;u.z=m.z;checkBattleRetreats(b);}
 }
 // Fort and tower projectiles hit one living individual, never a pooled bar.
 for(const post of [...(b.defensePosts||[]),...(b.fortress?.hp>0?[{...b.fortress,fortShot:true,range:22,damage:8}]:[])]){if(post.active===false||(b.fortressFallen&&post.team===b.fortress?.team))continue;const owner=post.fortShot?b.fortress:post;owner.cool=Math.max(0,(owner.cool||0)-dt);if(owner.cool>0)continue;const target=agents.filter(p=>p.m.hp>0&&!p.m.escaped&&!p.u.retreated&&p.u.team!==post.team&&dist(post,p.m)<=post.range).reduce((a,p)=>!a||dist(post,p.m)<dist(post,a.m)?p:a,null);if(target){damageMan(b,null,target,post.damage);owner.cool=post.fortShot?2.5:2.2;}}
 for(const u of squads){aggregate(u);const men=u.men.filter(m=>m.hp>0&&!m.escaped);if(men.length&&!u.guardPost&&!u.retreated){u.x=men.reduce((n,m)=>n+m.x,0)/men.length;u.z=men.reduce((n,m)=>n+m.z,0)/men.length;}if(!u.hp)u.deathTime=b.elapsed;}
 checkBattleRetreats(b);siegeOccupation(b,dt);const fort=b.fortress,surviving=[...new Set([...b.squads.filter(live).map(u=>u.team),...(fort?.hp>0?[fort.team]:[])])];
 if(surviving.length===1){for(const u of b.squads.filter(u=>live(u)&&u.team===surviving[0]&&!u.withdrawing)){u.routing=false;for(const m of u.men||[])if(!m.escaped)m.routing=false;}}const escaping=b.squads.some(u=>u.hp>0&&!u.reserve&&!u.retreated&&(u.routing||(u.men||[]).some(m=>m.routing&&m.hp>0&&!m.escaped)));if(fort&&fort.hp<=0&&!escaping&&!b.squads.some(u=>live(u)&&u.team===fort.team)){b.winnerTeam=b.squads.filter(u=>live(u)&&u.team!==fort.team).sort((a,b)=>b.hp-a.hp)[0]?.team??b.attackerTeam;b.result=b.winnerTeam===0?'victory':'defeat';}else if(surviving.length<=1&&!escaping){b.winnerTeam=surviving[0]??null;b.result=b.retreatedArmies?.some(p=>p.team===0)&&!b.squads.some(u=>live(u)&&u.team===0)?'retreat':b.winnerTeam===0?'victory':'defeat';}
}
export function persistIndividualMen(state,b){for(const u of b.squads){if(u.reserve||u.source<0||!state.units[u.source]||!u.men)continue;const source=state.units[u.source];source.hp=u.hp;source.menCount=u.menCount;source.soldiers=u.men.map(m=>({id:m.id,hp:m.hp,maxHp:m.maxHp}));}}
