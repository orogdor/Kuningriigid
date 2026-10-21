const pair=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
export function relation(s,a,b){return a===b?'own':s.relations?.[pair(a,b)]?.status||'neutral';}
export const atWar=(s,a,b)=>a!==b&&relation(s,a,b)==='war';
export function setRelation(s,a,b,status){if(a===b||!['neutral','friendly','war'].includes(status))return;const key=pair(a,b),old=s.relations?.[key];(s.relations??={})[key]={tension:old?.tension||0,status};s.events??=[];s.events.push({time:s.time,text:`Riigid ${a+1} / ${b+1}: ${status==='war'?'sõda':status==='friendly'?'sõprus':'neutraalne'}`});}
export function merchantAccess(s,team,city){return team===city.team||relation(s,team,city.team)==='friendly'&&!city.blockedMerchants?.[team];}
export function blockMerchants(s,city,team,blocked){(city.blockedMerchants??={})[team]=blocked;if(!blocked)return;const key=pair(city.team,team),r=(s.relations??={})[key]??={status:'neutral',tension:0};r.tension=Math.min(100,r.tension+15);}
export function tickDiplomacy(s,dt){s.diplomacyClock=(s.diplomacyClock||0)+dt;if(s.diplomacyClock<60)return;s.diplomacyClock%=60;
 for(const[key,r]of Object.entries(s.relations||{})){if(r.status==='war')continue;const[a,b]=key.split(':').map(Number),blocked=s.cities.some(c=>c.team===a&&c.blockedMerchants?.[b]||c.team===b&&c.blockedMerchants?.[a]);r.tension=Math.max(0,Math.min(100,r.tension+(blocked?5:-2)));if(blocked){const n=Math.sin((s.seed||1)*12.9+s.time*78.2+a*23+b)*43758.54,roll=n-Math.floor(n);if(roll<r.tension/100*.2)setRelation(s,a,b,'war');}}
}
