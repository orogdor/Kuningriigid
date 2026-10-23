import {ERA_MATERIALS,ageDeficit} from './era-economy.js';
import {RESOURCE_NAMES} from './economy.js';
import {TECHS,techBlock,ERA_NAMES} from './research.js?v=125a';
import {researchCost,EUREKAS,scienceRate} from './science.js';
import {tempoName} from './tempo.js';
import {renderTechTreeV119} from './research-tree-v119.js?v=125a';
const pretty=n=>Number(n||0).toLocaleString('et-EE',{maximumFractionDigits:1});
export const remaining=(s,id,team=0)=>Math.max(0,researchCost(s,TECHS[id])-(s.research[team].progress[id]||0));
export const clock=seconds=>!Number.isFinite(seconds)?'Ootab':Math.floor(Math.ceil(seconds)/60)+':'+String(Math.ceil(seconds)%60).padStart(2,'0');
export function renderResearchUI(game,{choose,queue,remove,details=true}){
 const s=game.s,r=s.research[0],active=r.active,hasCity=s.cities.some(c=>c.team===0),rate=scienceRate(s,0),
 title=document.getElementById('researchsummary'),tree=document.getElementById('researchtree'),status=document.getElementById('researchstatus');
 const eta=active&&rate>0?remaining(s,active)/rate*60:Infinity,
 allDone=Object.keys(TECHS).every(id=>r.known.includes(id));
 const waiting=r.ageWait?.id===active?Object.entries(ageDeficit(s,0,active)).map(([k,n])=>n+' '+(RESOURCE_NAMES[k]||k)).join(', '):'';
 const summary=active?(r.paused?'Pausil · ':'')+TECHS[active].name+' · '+(waiting?'Ootab materjale: '+waiting:r.paused?'Peatatud':clock(eta)):
  allDone?'Kõik tehnoloogiad uuritud':r.queue?.length?'Järjekorras: '+(techBlock(r,r.queue[0])||TECHS[r.queue[0]]?.name):hasCity?'Vali uurimisteema':'Raja esmalt linn';
 status.textContent='⚗ '+pretty(rate)+' teadust/min · '+summary;
 if(!details)return;
 title.textContent=summary+' · '+pretty(rate)+' teaduspunkti/min · tempo: '+tempoName(s)+'. 1 elanik = 1 teadust/min. Iga valmis aktiivne haridusasutus korrutab linna teaduse ×1,5; avastused lisavad boonuseid.';
 const pause=document.getElementById('pauseresearch');pause.disabled=!active&&!r.queue?.length;pause.textContent=r.paused?'Jätka uurimist':'Peata uurimine · edenemine säilib';
 if(document.getElementById('researchpanel').hidden)return;
 const stamp=JSON.stringify([r.known,active,r.queue,hasCity,s.ages[0],r.paused,Object.values(TECHS).map(t=>researchCost(s,t))]);
 if(tree.dataset.renderKey===stamp){
  for(const card of tree.querySelectorAll('.tech-card[data-tech]')){
   const id=card.dataset.tech,cost=researchCost(s,TECHS[id]),value=r.progress[id]||0,known=r.known.includes(id);
   card.querySelector('.tech-time').textContent=known?'Uuritud':pretty(cost)+' teaduspunkti · '+(rate>0?clock((cost-value)/rate*60):'Ootab teadust');
   const progress=card.querySelector('progress');progress.max=cost;progress.value=known?cost:value;
   const eureka=card.querySelector('.eureka-earned,.eureka-available');if(eureka){const earned=r.boosted?.includes(id);eureka.className=earned?'eureka-earned':'eureka-available';eureka.textContent=earned?'⚡ Avastamisboonus saadud (+35%)':'⚡ Avastamisboonus: '+EUREKAS[id]+' (+35%)';}
   const detail=card.querySelector('.tech-progress-detail');if(detail){detail.hidden=!value;detail.textContent='Tehtud '+pretty(value)+' / '+pretty(cost)+' · '+Math.floor(100*Math.min(1,value/cost))+'%';}
  }
  return;
 }
 tree.dataset.renderKey=stamp;
 const queued=document.getElementById('researchqueue');queued.innerHTML='';
 for(const id of r.queue||[]){const item=document.createElement('button');item.textContent=TECHS[id].name+' ✕';item.onclick=()=>remove(id);queued.append(item)}
 tree.innerHTML='';
 renderTechTreeV119(tree,game,{choose,queue,remove,rate});
}
