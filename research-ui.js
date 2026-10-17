import {ERA_MATERIALS,ageDeficit} from './era-economy.js';
import {RESOURCE_NAMES} from './economy.js';
import {TECHS,techBlock,ERA_NAMES} from './research.js';
import {researchCost,EUREKAS,scienceRate} from './science.js';
import {tempoName} from './tempo.js';
const pretty=n=>Number(n||0).toLocaleString('et-EE',{maximumFractionDigits:1});
export const remaining=(s,id,team=0)=>Math.max(0,researchCost(s,TECHS[id])-(s.research[team].progress[id]||0));
export const clock=seconds=>!Number.isFinite(seconds)?'Ootab':Math.floor(Math.ceil(seconds)/60)+':'+String(Math.ceil(seconds)%60).padStart(2,'0');
export function renderResearchUI(game,{choose,queue,remove}){
 const s=game.s,r=s.research[0],active=r.active,hasCity=s.cities.some(c=>c.team===0),rate=scienceRate(s,0),
 title=document.getElementById('researchsummary'),tree=document.getElementById('researchtree'),status=document.getElementById('researchstatus');
 const eta=active&&rate>0?remaining(s,active)/rate*60:Infinity,
 allDone=Object.keys(TECHS).every(id=>r.known.includes(id));
 const waiting=r.ageWait?.id===active?Object.entries(ageDeficit(s,0,active)).map(([k,n])=>n+' '+(RESOURCE_NAMES[k]||k)).join(', '):'';
 const summary=active?(r.paused?'Pausil · ':'')+TECHS[active].name+' · '+(waiting?'Ootab materjale: '+waiting:r.paused?'Peatatud':clock(eta)):
  allDone?'Kõik tehnoloogiad uuritud':r.queue?.length?'Järjekorras: '+(techBlock(r,r.queue[0])||TECHS[r.queue[0]]?.name):hasCity?'Vali uurimisteema':'Raja esmalt linn';
 status.textContent='⚗ '+pretty(rate)+' teadust/min · '+summary;
 title.textContent=summary+' · '+pretty(rate)+' teaduspunkti/min · tempo: '+tempoName(s)+'. Teadus sõltub elanikest ja õpetlastest.';
 const pause=document.getElementById('pauseresearch');pause.disabled=!active&&!r.queue?.length;pause.textContent=r.paused?'Jätka uurimist':'Peata uurimine · edenemine säilib';
 const queued=document.getElementById('researchqueue');queued.innerHTML='';
 for(const id of r.queue||[]){const item=document.createElement('button');item.textContent=TECHS[id].name+' ✕';item.onclick=()=>remove(id);queued.append(item)}
 if(document.getElementById('researchpanel').hidden)return;
 tree.innerHTML='';const ages=ERA_NAMES;
 for(let age=0;age<ages.length;age++){
  const column=document.createElement('section');column.className='tech-column';
  const heading=document.createElement('h3');heading.textContent=ages[age];column.append(heading);
  for(const[id,t]of Object.entries(TECHS).filter(([,t])=>t.age===age)){
   const known=r.known.includes(id),blocked=techBlock(r,id),cost=researchCost(s,t),progressValue=r.progress[id]||0,
    boosted=r.boosted?.includes(id),card=document.createElement('button');
   card.className='tech-card '+(known?'known':id===active?'researching':blocked?'locked':'available');
   card.disabled=known||!!blocked||!hasCity||id===active;
   card.setAttribute('aria-label',t.name+'; '+(known?'Uuritud':blocked||pretty(cost)+' teaduspunkti'));
   const label=document.createElement('strong');label.textContent=(known?'✓ ':active===id?'▶ ':'')+t.name;
   const time=document.createElement('span');time.className='tech-time';
   time.textContent=known?'Uuritud':pretty(cost)+' teaduspunkti · '+(rate>0?clock((cost-progressValue)/rate*60):'Ootab teadust');
   const unlock=document.createElement('span');unlock.textContent='Avab: '+t.unlocks;
   const prerequisites=document.createElement('small');
   prerequisites.textContent=t.requires.length?'← '+t.requires.map(p=>TECHS[p].name).join(' + '):'Algtehnoloogia';
   if(t.oneOf)prerequisites.textContent+=' + ('+t.oneOf.map(p=>TECHS[p].name).join(' või ')+')';
   card.append(label,time,unlock,prerequisites);
   if(ERA_MATERIALS[id]){const era=document.createElement('small');era.textContent='Ajastuvahetuse materjalid: '+Object.entries(ERA_MATERIALS[id]).map(([k,n])=>n+' '+(RESOURCE_NAMES[k]||k)).join(', ');card.append(era)}
   const progress=document.createElement('progress');progress.max=cost;progress.value=known?cost:progressValue;card.append(progress);
   if(EUREKAS[id]){const d=document.createElement('small');d.className=boosted?'eureka-earned':'eureka-available';d.textContent=boosted?'⚡ Avastamisboonus saadud (+35%)':'⚡ Avastamisboonus: '+EUREKAS[id]+' (+35%)';card.append(d)}
   if(!known&&progressValue){const detail=document.createElement('small');detail.textContent='Tehtud '+pretty(progressValue)+' / '+pretty(cost)+' · '+Math.floor(100*Math.min(1,progressValue/cost))+'%';card.append(detail)}
   card.onclick=()=>choose(id);column.append(card);
   if(!known&&id!==active){const isQueued=(r.queue||[]).includes(id),plan={known:[...r.known,...(active?[active]:[]),...(r.queue||[])]},q=document.createElement('button');q.className='tech-queue-button';q.textContent=isQueued?'✓ Järjekorras':'＋ Lisa järjekorda';q.disabled=isQueued||!hasCity||!!techBlock(plan,id)||(r.queue?.length||0)>=4;q.onclick=()=>queue(id);column.append(q)}
  }
  tree.append(column);
 }
}
