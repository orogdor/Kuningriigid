import {soldierCount,constrainStep} from './soldier-collision-v90.js';
import {troopRole,rangedTroop} from './military-v88.js';
import {unitStats} from './army-experience-v88.js';
import {isSiegeUnit,siegeDamage} from './medieval-v62.js';
import {BATTLEFIELD,outsideBattlefield,checkBattleRetreats} from './battlefield-v88.js';
export const MAX_BATTLE_MEN=500;
const live=u=>u.hp>0&&!u.retreated&&!u.reserve;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const livingMen=u=>u.men?u.men.filter(m=>m.hp>0).length:u.soldiers?u.soldiers.filter(m=>m.hp>0).length:Math.ceil((u.guardPost?1:u.menCount||soldierCount(u))*Math.min(1,u.hp/(u.maxHp||u.hp)));
export function battleManCount(b,team=null){return b.squads.filter(u=>!u.reserve&&!u.retreated&&(team==null||u.team===team)).reduce((n,u)=>n+livingMen(u),0);}
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
 if(b.individualVersion===1&&b.squads.every(u=>u.reserve||u.hp<=0||u.men))return;
 if(!b.individualVersion)admitBattle(b);
 const placed=[],open=nav?((x,z)=>nav.open(x,z)):()=>true;
 for(const u of b.squads){if(u.reserve||u.hp<=0||u.retreated)continue;if(u.men){placed.push(...u.men.filter(m=>m.hp>0&&!u.guardPost));continue;}
  const count=u.guardPost?1:u.menCount||soldierCount(u),max=(u.maxHp||u.hp)/(u.guardPost?1:soldierCount(u)),old=u.soldiers,ratio=Math.min(1,u.hp/(u.maxHp||u.hp)),alive=old?old.filter(m=>m.hp>0).length:Math.min(count,Math.ceil(u.hp/max-1e-9)),mounted=['cavalry','vehicle'].includes(troopRole(u.kind)),spacing=mounted?4.1:1.05,c=Math.cos(u.heading||0),sn=Math.sin(u.heading||0);
  u.men=Array.from({length:count},(_,i)=>{let hp=old?(old[i]?.hp||0):i<alive?Math.min(max,Math.max(0,u.hp-i*max)):0;const ox=count===1?0:(i%4-1.5)*spacing,oz=count===1?0:(Math.floor(i/4)-1)*spacing,goal={x:u.x+c*ox+sn*oz,z:u.z-sn*ox+c*oz},m={id:u.source+':'+i,index:i,x:goal.x,z:goal.z,hp,maxHp:max,cool:(i%4)*.08,radius:mounted?2:.34,heading:u.heading||0,kills:0,damageDealt:0};
   if(old&&hp>0){const sum=old.reduce((n,p)=>n+p.hp,0)||1;hp=Math.min(max,u.hp*hp/sum);m.hp=hp;}
   if(hp>0&&!u.guardPost){let found=false;for(let ring=0;ring<100&&!found;ring++)for(let k=0;k<Math.max(1,ring*8);k++){const a=k/Math.max(1,ring*8)*Math.PI*2;m.x=goal.x+Math.cos(a)*ring*.5;m.z=goal.z+Math.sin(a)*ring*.5;if(!outsideBattlefield(m)&&open(m.x,m.z)&&placed.every(p=>dist(p,m)>=p.radius+m.radius+.025)){found=true;break;}}if(!found)throw Error('Lahingus ei leitud mehele vaba kohta');placed.push(m);}return m;});
  u.menCount=count;u.maxHp=max*count;aggregate(u);u.anchor={x:u.x,z:u.z};
 }
 b.individualVersion=1;b.initialMen??=battleManCount(b);b.casualties??={};
}
function damageMan(b,attacker,target,amount){
 const m=target.m,u=target.u,before=m.hp;m.hp=Math.max(0,m.hp-amount);m.hitTime=b.elapsed;const hit=before-m.hp;
 if(attacker){attacker.m.damageDealt+=hit;attacker.u.damageDealt=(attacker.u.damageDealt||0)+hit;attacker.m.attackTime=b.elapsed;attacker.u.attackTime=b.elapsed;attacker.m.shot={x:attacker.m.x,z:attacker.m.z,toX:m.x,toZ:m.z};attacker.u.shot=attacker.m.shot;}
 u.hitTime=b.elapsed;u.hp=Math.max(0,u.hp-hit);if(before>0&&m.hp<=0){m.deathTime=b.elapsed;b.casualties[u.team]=(b.casualties[u.team]||0)+1;if(attacker){attacker.m.kills++;attacker.u.kills=(attacker.u.kills||0)+1;}}return hit;
}
export function tickIndividualBattle(b,dt,stats,tech=0,nav=null){
 if(b.result||dt<=0)return;initializeMen(b,nav);b.elapsed+=dt;checkBattleRetreats(b);
 const squads=b.squads.filter(live),agents=[];for(const u of squads){for(const m of u.men||[])if(m.hp>0)agents.push({m,u});}
 const enemies=new Map([...new Set(squads.map(u=>u.team))].map(t=>[t,agents.filter(p=>p.u.team!==t)])),bins=new Map(),key=(x,z)=>Math.floor(x/8)+':'+Math.floor(z/8);
 const insert=m=>{const k=key(m.x,m.z),list=bins.get(k)||[];list.push(m);bins.set(k,list);};for(const p of agents)if(!p.u.guardPost)insert(p.m);
 const nearby=m=>{const list=[],x=Math.floor(m.x/8),z=Math.floor(m.z/8);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)list.push(...(bins.get((x+dx)+':'+(z+dz))||[]).filter(p=>p.hp>0));return list;};
 const open=nav?((x,z)=>nav.open(x,z)):()=>true;
 // A squad anchor supplies marching waypoints only; it neither attacks nor
 // owns health. Close combat is resolved independently at each man's position.
 for(const u of squads){const foes=squads.filter(v=>v.team!==u.team),nearest=foes.reduce((a,v)=>!a||dist(u,v)<dist(u,a)?v:a,null),a=unitStats(stats[u.kind],u),anchor=u.anchor??={x:u.x,z:u.z};u.moving=false;
  let goal=u.manualOrder&&u.target?u.target:null;
  if(!goal&&nearest&&(u.team!==0||u.advance||u.civilian||dist(u,nearest)<30)){const ranged=rangedTroop(u.kind);if(dist(u,nearest)>a.range+3)goal=nearest;if(ranged){const melee=squads.filter(v=>v.team===u.team&&troopRole(v.kind)==='melee');if(melee.length&&goal){const front=melee.reduce((p,v)=>dist(v,nearest)<dist(p,nearest)?v:p);const d=dist(front,nearest)||1;goal={x:front.x+(front.x-nearest.x)/d*7,z:front.z+(front.z-nearest.z)/d*7};}}}
  if(goal&&!u.guardPost){if(nav)nav.move(anchor,goal,dt,a.speed);else{const d=dist(anchor,goal),f=d?Math.min(1,a.speed*dt/d):0;anchor.x+=(goal.x-anchor.x)*f;anchor.z+=(goal.z-anchor.z)*f;}u.heading=Math.atan2(goal.x-u.x,goal.z-u.z);}
  if(u.manualOrder&&u.target&&dist(u,u.target)<2){u.manualOrder=false;u.target=null;}
 }
 for(const actor of agents){const {m,u}=actor;if(m.hp<=0||u.retreated)continue;const a=unitStats(stats[u.kind],u),count=u.menCount||soldierCount(u);m.cool=Math.max(0,m.cool-dt);m.moving=false;
  let enemy=null,best=Infinity;for(const p of enemies.get(u.team)||[]){if(p.m.hp<=0||p.u.retreated)continue;const d=dist(m,p.m);if(d<best){best=d;enemy=p;}}m.targetId=enemy?.m.id??null;
  const sections=(b.siegeSections||[]).filter(p=>p.hp>0&&p.team!==u.team&&!b.siegeBreached),fort=b.fortress?.hp>0&&b.fortress.team!==u.team?b.fortress:null,wall=isSiegeUnit(u.kind)&&sections.length?sections.reduce((p,v)=>dist(m,v)<dist(m,p)?v:p):null,structure=wall||(!enemy?(sections[0]||fort):null);
  const target=structure||enemy?.m;if(!target)continue;const d=dist(m,target),range=a.range+(u.guardPost?5:0)+(structure?6:0),canAttack=!u.manualOrder&&d<=range;
  if(canAttack){m.heading=Math.atan2(target.x-m.x,target.z-m.z);if(m.cool===0){let amount=a.dmg/(u.guardPost?1:soldierCount(u))*(u.guardPost?1.3:1)*(1+(Array.isArray(tech)?tech[u.team]||0:u.team?0:tech)*.3);
    if(enemy&&!structure){const role=troopRole(enemy.u.kind),reduction={heavy_cavalry:.75,knight:.8,man_at_arms:.83,halberdier:.92}[enemy.u.kind]||1,pierce=u.kind==='crossbowman'?.5:0;amount*=reduction+(1-reduction)*pierce;if(['halberdier','pikeman'].includes(u.kind)&&role==='cavalry')amount*=1.7;if(u.kind==='rocket_team'&&role==='vehicle')amount*=1.8;damageMan(b,actor,enemy,amount);}
    else{const before=structure.hp;if(wall||sections.includes(structure)){siegeDamage(u,structure,amount);if(structure.breached){b.siegeBreached=true;b.breachAt={x:structure.x,z:structure.z};}}else structure.hp=Math.max(0,structure.hp-amount);const hit=before-structure.hp;u.damageDealt=(u.damageDealt||0)+hit;m.damageDealt+=hit;m.attackTime=b.elapsed;u.attackTime=b.elapsed;}
    m.cool=(u.kind==='crossbowman'?1.9:isSiegeUnit(u.kind)?2.8:u.kind==='heavy_cavalry'?1.45:1.2)/a.attackSpeed;
   }continue;
  }
  if(u.guardPost)continue;
  const c=Math.cos(u.heading||0),sn=Math.sin(u.heading||0),spacing=m.radius>1?4.1:1.05,ox=count===1?0:(m.index%4-1.5)*spacing,oz=count===1?0:(Math.floor(m.index/4)-1)*spacing,anchor=u.anchor||u;
  let goal={x:anchor.x+c*ox+sn*oz,z:anchor.z-sn*ox+c*oz};
  if(!u.manualOrder&&d<32&&(u.team!==0||u.advance||u.civilian||d<13||rangedTroop(u.kind)))goal=target;
  const old={x:m.x,z:m.z},bin=bins.get(key(m.x,m.z));if(bin)bin.splice(bin.indexOf(m),1);const peers=nearby(m),length=dist(m,goal),step=Math.min(length,a.speed*dt),f=length?step/length:0,dx=(goal.x-m.x)*f,dz=(goal.z-m.z)*f;
  m.moving=constrainStep(m,{x:m.x+dx,z:m.z+dz},peers,open);
  if(dist(old,m)<step*.2&&length>.2){for(const angle of [.7,-.7,1.3,-1.3]){const co=Math.cos(angle),si=Math.sin(angle);if(constrainStep(m,{x:m.x+dx*co-dz*si,z:m.z+dx*si+dz*co},peers,open)&&dist(old,m)>step*.2){m.moving=true;break;}}}
  if(m.moving){m.heading=Math.atan2(m.x-old.x,m.z-old.z);u.moving=true;}insert(m);
  if(outsideBattlefield(m)){u.x=m.x;u.z=m.z;checkBattleRetreats(b);}
 }
 // Fort and tower projectiles hit one living individual, never a pooled bar.
 for(const post of [...(b.defensePosts||[]),...(b.fortress?.hp>0?[{...b.fortress,fortShot:true,range:22,damage:8}]:[])]){if(post.active===false)continue;const owner=post.fortShot?b.fortress:post;owner.cool=Math.max(0,(owner.cool||0)-dt);if(owner.cool>0)continue;const target=agents.filter(p=>p.m.hp>0&&!p.u.retreated&&p.u.team!==post.team&&dist(post,p.m)<=post.range).reduce((a,p)=>!a||dist(post,p.m)<dist(post,a.m)?p:a,null);if(target){damageMan(b,null,target,post.damage);owner.cool=post.fortShot?2.5:2.2;}}
 for(const u of squads){aggregate(u);const men=u.men.filter(m=>m.hp>0);if(men.length&&!u.guardPost&&!u.retreated){u.x=men.reduce((n,m)=>n+m.x,0)/men.length;u.z=men.reduce((n,m)=>n+m.z,0)/men.length;}if(!u.hp)u.deathTime=b.elapsed;}
 checkBattleRetreats(b);const fort=b.fortress,surviving=[...new Set([...b.squads.filter(live).map(u=>u.team),...(fort?.hp>0?[fort.team]:[])])];
 if(fort&&fort.hp<=0){b.winnerTeam=b.squads.filter(u=>live(u)&&u.team!==fort.team).sort((a,b)=>b.hp-a.hp)[0]?.team??b.attackerTeam;b.result=b.winnerTeam===0?'victory':'defeat';}else if(surviving.length<=1){b.winnerTeam=surviving[0]??null;b.result=b.retreatedArmies?.some(p=>p.team===0)&&!b.squads.some(u=>live(u)&&u.team===0)?'retreat':b.winnerTeam===0?'victory':'defeat';}
}
export function persistIndividualMen(state,b){for(const u of b.squads){if(u.reserve||u.source<0||!state.units[u.source]||!u.men)continue;const source=state.units[u.source];source.hp=u.hp;source.menCount=u.menCount;source.soldiers=u.men.map(m=>({id:m.id,hp:m.hp,maxHp:m.maxHp}));}}
