import {bracingThreat} from './combat-contact-v96.js';
import {troopRole} from './military-v88.js?v=117a';
const SHIELDS=new Set(['bronze_spearman','infantry','man_at_arms']);
const SPEARS=new Set(['spearman','bronze_spearman','halberdier','pikeman']);
const LIGHT=new Set(['slinger','archer','bronze_archer','iron_archer','javelinman']);
const GUNS=new Set(['musketeer','arquebusier','line_infantry','rifleman']);
const HORSE=new Set(['cavalry','knight','heavy_cavalry','cuirassier']);
export const FORMATIONS=Object.freeze({
 line:{name:'Tavarivi',speed:1,columns:4,width:1.05,depth:1.05,formTime:0,turn:1.5,help:'Tavaline liikumine ja lähivõitlus.'},
 hold:{name:'Hoia positsiooni',speed:.8,columns:4,width:1.05,depth:1.05,formTime:2,turn:.9,hold:true,help:'Hoia kohta ja suunda; ära jälita vastast.'},
 shield_wall:{name:'Kilbivall',bronzeName:'Kilbirivi',speed:.48,columns:6,width:.76,depth:.95,formTime:4,turn:.45,defensive:true,help:'Tihe kilbirivi kaitseb eest. Aeglane pöörata; küljed ja tagala on nõrgad.'},
 spear_wall:{name:'Odade vastuvõtt',speed:.35,columns:4,width:.9,depth:1,formTime:4,turn:.35,hold:true,defensive:true,help:'Seistes vastu saabuvatele ratsanikele. Liikudes ja külgedelt kaitse nõrgeneb.'},
 loose:{name:'Hajurivi',speed:1,columns:4,width:1.6,depth:1.6,formTime:3,turn:1.5,help:'Meeste vahed on suuremad: väiksem tabamisvõimalus, nõrk lähivõitlusrivi.'},
 skirmish:{name:'Lase ja eemaldu',speed:1,columns:4,width:1.6,depth:1.6,formTime:3,turn:1.7,help:'Hoia laskekaugust ja taandu lähivõitlejate eest; laskemoon on piiratud.'},
 volley:{name:'Kogupauk',speed:.75,columns:6,width:1,depth:1.1,formTime:4,turn:.8,help:'Tulirelvade koondatud lask iga 3 sekundi järel. Rivi ees peab olema vaba tuleväli.'},
 charge:{name:'Koondunud ratsarünnak',speed:1.15,columns:4,width:4.1,depth:4.1,formTime:4,turn:.7,help:'Hoovõtt annab esimesele tabamusele mõju. Odarivi peatab laupkokkupõrke.'}
});
export function formationOptions(u,definitions){const age=definitions[u.kind]?.age??0,list=['line','hold'];if(SHIELDS.has(u.kind)&&age>=1&&age<=3)list.push('shield_wall');if(SPEARS.has(u.kind)&&age<=4)list.push('spear_wall');if(LIGHT.has(u.kind)||GUNS.has(u.kind))list.push('loose');if(LIGHT.has(u.kind)||['chariot','dragoon'].includes(u.kind))list.push('skirmish');if(GUNS.has(u.kind)&&age>=4&&age<=5)list.push('volley');if(HORSE.has(u.kind)&&age>=1&&age<=4)list.push('charge');return list;}
export function formationName(u,definitions){const p=FORMATIONS[u.formation]||FORMATIONS.line;return u.formation==='shield_wall'&&definitions[u.kind]?.age===1?p.bronzeName:p.name;}
export function setFormation(u,id,definitions,time=0,manual=true){if(!formationOptions(u,definitions).includes(id)||u.routing)return false;u.formation=id;u.formationManual=manual;u.formationProgress=0;u.formationStrength=0;u.formationChangedAt=time;u.anchor={x:u.x,z:u.z};u.formationFacing=u.heading||0;delete u.slotStamp;u.volleyAt=time+4;u.volleyNumber=0;u.volleyWindow=false;return true;}
export function turnTowards(current,target,dt,rate){const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+Math.max(-rate*dt,Math.min(rate*dt,delta));}
export function formationSlot(u,index,count){const p=FORMATIONS[u.formation]||FORMATIONS.line,mounted=['cavalry','vehicle'].includes(troopRole(u.kind)),width=u.kind==='bronze_catapult'?3:u.kind==='chariot'?6.2:mounted?4.1:p.width,depth=u.kind==='bronze_catapult'?3:u.kind==='chariot'?6.2:mounted?4.1:p.depth;
 if(u.formation==='charge'){let row=0,start=0,total=0;for(let r=0,n=0;n<count;r++){const take=Math.min(r+1,count-n);total+=r*take;n+=take;}while(index>=start+row+1){start+=row+1;row++;}const members=Math.min(row+1,count-start);return {x:(index-start-(members-1)/2)*width,z:(total/count-row)*depth};}
 const columns=Math.min(count,p.columns),rows=Math.ceil(count/columns);return {x:(index%columns-(columns-1)/2)*width,z:(Math.floor(index/columns)-(rows-1)/2)*depth};}
export function worldSlot(u,m,count){const off=formationSlot(u,m.slotIndex??m.index,count),heading=u.formationFacing??u.heading??0,c=Math.cos(heading),s=Math.sin(heading),a=u.anchor||u;return {x:a.x+c*off.x+s*off.z,z:a.z-s*off.x+c*off.z};}
export function updateFormations(b,dt,definitions){
 const squads=b.squads.filter(u=>u.men&&u.hp>0&&!u.retreated&&!u.reserve);
 for(const u of squads){if(u.guardPost)continue;if(!u.formation||!formationOptions(u,definitions).includes(u.formation))setFormation(u,'line',definitions,b.elapsed,false);const foes=squads.filter(v=>v.team!==u.team&&!v.routing),d=v=>Math.hypot(u.x-v.x,u.z-v.z),nearest=foes.reduce((p,v)=>!p||d(v)<d(p)?v:p,null);
  if(!u.formationManual&&!u.routing&&!u.manualOrder){let desired='line';const options=formationOptions(u,definitions);if(nearest){if(options.includes('spear_wall')&&bracingThreat(u,foes))desired='spear_wall';else if(options.includes('shield_wall')&&(d(nearest)<24||foes.some(v=>troopRole(v.kind)==='ranged'&&d(v)<35)))desired='shield_wall';else if(options.includes('skirmish')&&u.ammoRemaining!==0)desired='loose';else if(options.includes('volley')&&u.ammoRemaining!==0)desired='volley';else if(options.includes('charge')&&d(nearest)<25&&!foes.some(v=>['spearman','bronze_spearman','pikeman','halberdier'].includes(v.kind)&&(v.formation==='spear_wall'||(v.cohesion??1)>.65)&&d(v)<24))desired='charge';}if(desired!==u.formation&&(b.elapsed-(u.formationChangedAt||0)>6))setFormation(u,desired,definitions,b.elapsed,false);}
  const p=FORMATIONS[u.formation]||FORMATIONS.line,men=u.men.filter(m=>m.hp>0&&!m.escaped),facing=u.fixedFacing??u.heading??0;u.formationFacing=turnTowards(u.formationFacing??facing,facing,dt,p.turn);
  const stamp=u.formation+':'+men.map(m=>m.id).join(',');if(u.slotStamp!==stamp){
   const available=new Set(men.map((_,i)=>i)),unassigned=new Set(men);while(unassigned.size){let best=null;for(const m of unassigned)for(const i of available){const goal=worldSlot(u,{slotIndex:i},men.length),cost=Math.hypot(m.x-goal.x,m.z-goal.z);if(!best||cost<best.cost)best={m,i,cost};}best.m.slotIndex=best.i;available.delete(best.i);unassigned.delete(best.m);}u.slotStamp=stamp;
  }
  let ready=0;men.forEach(m=>{const goal=worldSlot(u,m,men.length);if(Math.hypot(m.x-goal.x,m.z-goal.z)<1.2)ready++;m.coverSupport=men.some(n=>n!==m&&Math.hypot(m.x-n.x,m.z-n.z)<1.35);m.chargeCooldown=Math.max(0,(m.chargeCooldown||0)-dt);});
  const ratio=ready/Math.max(1,men.length);u.formationProgress=Math.max(0,Math.min(p.formTime,(u.formationProgress||0)+dt*(ratio>=.6?1:-.5)));u.formationStrength=(p.formTime?u.formationProgress/p.formTime:1)*ratio*Math.min(1,Math.max(0,men.length-1)/3)*(u.cohesion??1);
  u.volleyWindow=false;if(u.formation==='volley'&&u.formationStrength>.6&&!(u.manualOrder&&u.target)&&b.elapsed>=(u.volleyAt||0)){u.volleyWindow=true;u.volleyNumber=(u.volleyNumber||0)+1;u.volleyAt=b.elapsed+3;}
 }
}
export function formationAttackReady(u,m,b,ready){if(!ready)return false;if(u.formation==='volley'&&m.ammo>0)return u.volleyWindow&&m.lastVolley!==u.volleyNumber;return true;}
export function clearShot(actor,target,agents){if(!target)return true;const a=actor.m,b=target.m,dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;if(len2<1)return true;return !agents.some(p=>{if(p===actor||p.u.team!==actor.u.team||p.m.hp<=0||p.m.escaped)return false;const t=((p.m.x-a.x)*dx+(p.m.z-a.z)*dz)/len2;if(t<=.03||t>=.97)return false;return Math.hypot(p.m.x-a.x-dx*t,p.m.z-a.z-dz*t)<p.m.radius+.1;});}
export function formationDamage(attacker,target,amount,missile){const m=attacker.m,u=attacker.u,n=target.m,v=target.u,dx=m.x-n.x,dz=m.z-n.z,d=Math.hypot(dx,dz)||1,front=(dx*Math.sin(v.formationFacing??n.heading??0)+dz*Math.cos(v.formationFacing??n.heading??0))/d,strength=v.formationStrength||0,supported=n.coverSupport&&!n.moving;
 if(v.formation==='shield_wall'&&supported&&front>.5&&missile!=='bullet')amount*=1-strength*(missile?.4:.22);
 if(v.formation==='spear_wall'&&supported&&front>.5&&troopRole(u.kind)==='cavalry')amount*=1-strength*.45;
 if(['loose','skirmish'].includes(v.formation)&&!missile)amount*=1.1;
 if(u.formation==='charge'&&!missile&&(m.chargeDistance||0)>=6&&!(m.chargeCooldown>0)){if(!(v.formation==='spear_wall'&&supported&&front>.4&&strength>.5))amount*=1.5;m.chargeDistance=0;m.chargeCooldown=12;}
 return amount;}
export function missileExposure(u){return ['loose','skirmish'].includes(u.formation)?1-.22*(u.formationStrength||0):1;}
