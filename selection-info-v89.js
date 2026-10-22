import {meleeReach,soldierBodyRadius} from './combat-contact-v96.js';
import {tacticalStats,isBow} from './historical-tactics-v92.js?v=108a';
import {livingMen} from './individual-battle-v91.js?v=108a';
import {soldierCount} from './soldier-collision-v90.js?v=108a';
import {UNIT_GRADES} from './military-v88.js';
import {armyLevel,unitStats,armyForUnit} from './army-experience-v88.js';
export function selectionDetails(game,q,troops,ships){
 if(!q)return '';const e=q.entity,s=game.s,location=q.local?'Detailkaart':'Ruut '+(e.c+1)+':'+(e.r+1);
 if(q.kind==='unit'){const source=s.units[e.source]||e,army=e.civilian?null:armyForUnit(s,source),d=e.men?tacticalStats(troops[e.kind],e):unitStats(troops[e.kind],source,army);return [q.man?'Mees '+(q.man.index+1)+' · '+q.man.hp.toFixed(1)+'/'+q.man.maxHp.toFixed(1)+' HP · '+q.man.kills+' tapmist':Math.ceil(e.hp)+'/'+Math.round(e.maxHp||d.hp)+' HP · '+UNIT_GRADES[e.grade||'standard'].name+' · LVL '+(army?armyLevel(army):source.armyLevel||1),'Löök '+(q.man?d.dmg/soldierCount(e)*(q.man.weapon==='sword'?.6:1):d.dmg).toFixed(1)+' · kaugus '+(isBow(e)&&(q.man?.ammo??e.ammoRemaining??1)>0?d.range:meleeReach(e,q.man||{radius:soldierBodyRadius(e)},{radius:.34})).toFixed(1)+' · kiirus '+d.speed.toFixed(1),(e.team===0?'Oma salk':'Vastase salk')+' · '+livingMen(e)+'/'+(e.menCount||soldierCount(e))+' meest',e.men?(q.man?'Moraal '+Math.round(q.man.morale||0)+' · väsimus '+Math.round(q.man.fatigue||0)+(q.man.ammo!=null?' · lasku '+q.man.ammo+(q.man.weapon==='sword'?' · mõõk':''):''):(e.routing?'Põgeneb':'Moraal '+Math.round(e.morale||0)+' · rivi '+Math.round((e.cohesion??1)*100)+'%')):''].filter(Boolean).join('\n');}
 if(q.kind==='army'){const units=s.units.filter(u=>u.team===e.team&&u.hp>0&&!u.garrison&&(u.armyId||0)===(e.id||0)),hp=units.reduce((n,u)=>n+u.hp,0),max=units.reduce((n,u)=>n+(u.maxHp||troops[u.kind].hp),0);return [units.length+' salka · '+Math.ceil(hp)+'/'+Math.round(max)+' HP · LVL '+armyLevel(e),Math.floor(e.xp||0)+' XP · '+location,e.embarked!=null?'Laeva pardal':e.autoExplore?'Avastab automaatselt':e.path?.length?'Liigub · '+e.path.length+' ruutu':'Ootab käsku'].join('\n');}
 if(q.kind==='settler')return ['Asunik · rajab uue linna',location,e.embarked!=null?'Laeva pardal':e.localTarget||e.path?.length?'Liigub linnakohta':'Vali linnakoht või anna liikumiskäsk'].join('\n');
 if(q.kind==='ship')return [Math.ceil(e.hp)+'/'+Math.round(e.maxHp||ships[e.kind].hp*UNIT_GRADES[e.grade||'standard'].strength)+' HP · '+UNIT_GRADES[e.grade||'standard'].name,location,e.cargo?'Last: '+(e.cargo.kind==='army'?'armee '+(e.cargo.armyId||0):'asunik'):'Lasti ei ole'].join('\n');
 if(q.kind==='building')return [Math.ceil(e.hp||0)+' HP · '+(e.ready?'Valmis':'Ehitamisel'),e.status||'',e.assigned!=null?'Töölisi: '+e.assigned:''].filter(Boolean).join('\n');
 return [location,e.status||'',e.goods?'Last: '+Object.entries(e.goods).map(([k,v])=>Math.round(v)+' '+k).join(', '):''].filter(Boolean).join('\n');
}
