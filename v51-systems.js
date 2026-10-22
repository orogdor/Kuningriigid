import {foodTotal} from './city-needs-v87.js';
// V51: side-effect-free rules shared by UI, fog-of-war, and AI diagnosis.
import {TECHS,techBlock,BUILD_TECH} from './research.js?v=117a';
import {BUILDINGS} from './economy.js';
import {ageDeficit} from './era-economy.js';

export const inRange=(a,b,r)=>Math.abs(a.c-b.c)<=r&&Math.abs(a.r-b.r)<=r&&Math.abs(a.c-b.c)+Math.abs(a.r-b.r)<=r+1;
export function visibleNow(game,team,where){
 const s=game.s;if(!where||!Number.isFinite(where.c)||!Number.isFinite(where.r))return false;
 if(s.cities.some(c=>c.team===team&&inRange(c,where,Math.max(2,game.radius(c)))))return true;
 if(s.settlers.some(a=>a.team===team&&a.embarked==null&&inRange(a,where,2)))return true;
 if(s.armies.some(a=>a.team===team&&a.embarked==null&&inRange(a,where,2)))return true;
 if((s.ships||[]).some(a=>a.team===team&&a.hp>0&&inRange(a,where,2)))return true;
 return false;
}
export function updateEnemyIntel(game,team=0){
 const s=game.s,intel=(s.enemyIntel??={})[team]??={};
 for(const city of s.cities){if(city.team===team||!visibleNow(game,team,city))continue;
  intel[city.id]={id:city.id,name:city.name,team:city.team,c:city.c,r:city.r,lastSeen:s.time};
 }
 return intel;
}
export function knownEnemyCities(game,team=0){
 const intel=updateEnemyIntel(game,team);
 return Object.values(intel).filter(info=>game.s.cities.some(c=>c.id===info.id&&c.team!==team));
}
export function constructionForecast(game,city,building){
 const left=Math.max(0,game.constructionTime(building.type)-(building.progress||0));
 if(building.ready)return {seconds:0,label:'Valmis'};
 if(building.disabled||building.workerLimit===0)return {seconds:Infinity,label:'Peatatud'};
 const active=Math.max(0,building.efficiency||0)*game.bonus(city.team)*game.builderStrength(city.team);
 if(active<=.001)return {seconds:Infinity,label:'Ootab ehitajat'};
 const transit=(building.materialsRemaining||0)>0?Math.ceil(building.materialsRemaining/24)*22:0;
 const travel=(building.builderArrived?0:12);
 return {seconds:left/active+transit+travel,waiting:transit+travel,
  label:(building.materialsRemaining>0?'Materjalivedu + ':'')+(building.status||'Ehitamine')};
}
export function cityProblems(game,city){
 const r=city.economy.realms[city.team],stock=r.resources,issues=[];
 const active=game.allBuildings(city).filter(b=>b.hp>0);
 if(foodTotal(stock)<r.pop*2)issues.push({level:3,text:'Toiduvaru lõppemas',action:'Ehita või käivita jahimehe onn, kalamehe onn või talu'});
 if((stock.water||0)<r.pop*1.5)issues.push({level:3,text:'Vett napib',action:'Ehita või käivita kaev'});
 if(active.some(b=>!b.ready&&b.workerLimit!==0&&b.efficiency===0))issues.push({level:2,text:'Ehitusel puudub tööjõud',action:'Määra tööjõu menüüst ehitajaid'});
 if(active.some(b=>/pole ligipääsetavat|maardla puudub|puudub tee/i.test(b.status||'')))issues.push({level:2,text:'Tooraine või tee on blokeeritud',action:'Raja tootmine uude maardlaruutu või kontrolli ühendust'});
 const research=game.s.research[city.team];
 if(research?.ageWait){const missing=ageDeficit(game.s,city.team,research.ageWait.id),names=Object.entries(missing).filter(([,n])=>n>0).map(([key,n])=>`${Math.ceil(n)} ${key}`);if(names.length)issues.push({level:2,text:'Ajastuvahetus ootab materjale: '+names.join(', '),action:'Suurenda puuduva ressursi tootmist või lao mahtu'});}
 return issues.sort((a,b)=>b.level-a.level);
}
export function actionTips(game,team=0){
 const s=game.s,cities=s.cities.filter(c=>c.team===team),tips=[];
 if(!cities.length)return [{text:'Raja esimene linn',why:'Asunikuga vali maapind ja raja asula'}];
 for(const city of cities){for(const issue of cityProblems(game,city).slice(0,2))tips.push({text:issue.action,why:city.name+' · '+issue.text,weight:issue.level+2,city});}
 const r=s.research[team];
 if(!r.active){const id=Object.keys(TECHS).find(id=>!techBlock(r,id));if(id)tips.push({text:'Uuri '+TECHS[id].name,why:'Teadus ei ole aktiivne',weight:4});}
 for(const city of cities){const buildings=game.allBuildings(city);
  if(!buildings.some(b=>b.type==='house'&&b.ready)&&s.ages[team]===0)tips.push({text:'Ehita esimene elamu',why:city.name+' vajab uut elamispinda',weight:2,city});
  if(buildings.some(b=>!b.ready&&(b.materialsRemaining||0)>0))tips.push({text:'Kontrolli ehitusmaterjalide vedu',why:city.name+' · ehitusel on veel materjale puudu',weight:2,city});
 }
 if(!tips.length)tips.push({text:'Avasta uusi alasid või arenda oma linnu',why:'Kiireloomulisi puudujääke ei leitud',weight:1});
 return tips.sort((a,b)=>(b.weight||0)-(a.weight||0)).slice(0,3);
}
export function armyUnits(s,army){return s.units.filter(u=>u.team===army.team&&u.hp>0&&!u.garrison&&(u.armyId||0)===(army.id||0))}
export function activeArmies(s,team){return s.armies.filter(a=>a.team===team&&armyUnits(s,a).length>0)}
export function splitArmy(s,army){const units=armyUnits(s,army);if(units.length<2)return {error:'Armee jagamiseks on vaja vähemalt kahte elusat sõdalast.'};
 s.nextArmyId??=1;const id=s.nextArmyId++;const group={team:army.team,id,c:army.c,r:army.r,path:[],stance:'defend',xp:army.xp||0,level:army.level||1};
 const half=Math.floor(units.length/2);units.slice(-half).forEach(u=>u.armyId=id);s.armies.push(group);return {army:group,count:half};
}
export function mergeArmies(s,selected){
 if(!selected||selected.embarked!=null||s.battle)return {error:'Ühendamiseks peavad armeed olema maal ja väljaspool lahingut.'};
 const groups=s.armies.filter(a=>a.team===selected.team&&a.embarked==null&&a.c===selected.c&&a.r===selected.r&&armyUnits(s,a).length);
 if(groups.length<2)return {error:'Too vähemalt kaks oma armeed samasse ruutu.'};
 const target=groups.find(a=>!(a.id||0))||selected;
 const counts=groups.map(a=>({army:a,count:armyUnits(s,a).length})),total=counts.reduce((n,c)=>n+c.count,0);
 target.xp=counts.reduce((n,c)=>n+(c.army.xp||0)*c.count,0)/total;
 for(const {army}of counts)for(const u of armyUnits(s,army))u.armyId=target.id||0;
 target.path=[];target.autoExplore=false;delete target.rallyTarget;
 s.armies=s.armies.filter(a=>a===target||!groups.includes(a)||!(a.id||0));
 for(const a of groups)if(a!==target&&!(a.id||0)){a.xp=0;a.level=1;a.path=[];}
 return {ok:true,army:target,count:total,merged:groups.length};
}
