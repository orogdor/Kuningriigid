// V280: a 45-minute Stone Age playthrough of the three computer nations (migration + 20-minute peace).
// Guards the balance found in the V279 test game: no errors, nobody starves out, research never sits idle,
// fire is discovered early, wood/stone are not capped at 120, nations have different characters.
import {Civilization,createGame,personalityV280} from '../civilization-core.js';
import {TECHS} from '../research.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(Object.assign(createGame(20261106,'tectonic'),{migrationV274:{until:120},peaceUntilV276:1200})),s=g.s;
const idle={1:0,2:0,3:0},minPop={1:99,2:99,3:99};let maxStore=0;
for(let sec=0;sec<45*60;sec+=2){
 g.tick(2);
 for(const t of [1,2,3]){
  const c=s.cities.find(c=>c.team===t);if(!c)continue;
  const open=Object.entries(TECHS).some(([id,x])=>x.age===0&&!s.research[t].known.includes(id));
  idle[t]=!s.research[t].active&&open?idle[t]+2:0;ok(idle[t]<=90,'team '+t+' research idle for '+idle[t]+' s at '+Math.round(s.time)+' s');
  if(s.time>30*60)minPop[t]=Math.min(minPop[t],c.economy.realms[t].pop);
  maxStore=Math.max(maxStore,c.economy.realms[t].resources.wood||0);
 }
}
for(const t of [1,2,3]){ok(s.research[t].known.includes('fire_use'),'fire discovered');ok(minPop[t]>=4,'team '+t+' population held after 30 min (min '+minPop[t]+')');}
ok(maxStore>120,'storage grows past the old 120 limit ('+maxStore+')');
ok(new Set([1,2,3].map(t=>personalityV280(s,t))).size===3,'three different nation characters');
console.log('stone age playthrough V280 ok: pop',[1,2,3].map(t=>s.cities.filter(c=>c.team===t).reduce((a,c)=>a+c.economy.realms[t].pop,0)).join('/'),'known',[1,2,3].map(t=>s.research[t].known.length).join('/'));
