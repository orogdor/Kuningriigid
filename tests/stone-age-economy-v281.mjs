// V281: second Stone Age test map (seed 7741: a nation starts on a low coastal forest).
// Guards the fixes of the V280 test game: low forest tiles keep their trees, no nation sits without wood,
// farms with fields produce grain, the treasury trades for missing wood/stone, one raid party per town,
// and AI settlers pick a site they can reach (Stone Age: at most 16 tiles of walking).
import {Civilization,createGame,personalityV280} from '../civilization-core.js';
import {tradeOffersV278} from '../villages-v276.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
ok(['buy_wood','buy_stone'].every(id=>tradeOffersV278(0).some(o=>o.id===id)),'trader villages sell wood and stone');
const g=new Civilization(Object.assign(createGame(7741,'tectonic'),{migrationV274:{until:120},peaceUntilV276:1200})),s=g.s;
const noWood={1:0,2:0,3:0},noWoodMax={1:0,2:0,3:0};let grain=0,farmWork=0,maxParties=0,settlerTrip=0;const born={};
for(let sec=0;sec<45*60;sec+=2){
 for(const c of s.cities)for(const ctx of g.contexts(c)){const cg=ctx.economy.cargo;if(cg&&!cg.__v281){cg.__v281=1;const push=cg.push.bind(cg);cg.push=(...a)=>{for(const x of a)if(x.key==='grain')grain+=x.amount;return push(...a);};}}
 g.tick(2);
 for(const c of s.cities)for(const ctx of g.contexts(c))for(const b of ctx.economy.buildings)if(b.type==='farm'&&b.ready)farmWork+=(b.assigned||0)*2;
 for(const t of [1,2,3]){const c=s.cities.find(c=>c.team===t);if(!c)continue;
  noWood[t]=(c.economy.realms[t].resources.wood||0)<5?noWood[t]+2:0;noWoodMax[t]=Math.max(noWoodMax[t],noWood[t]);}
 const per={};for(const r of s.raidsV276||[])per[r.to]=(per[r.to]||0)+1;maxParties=Math.max(maxParties,...Object.values(per),0);
 for(const a of s.settlers)if(a.team>0&&s.time>300){born[a.id]??=s.time;settlerTrip=Math.max(settlerTrip,s.time-born[a.id]);}
}
for(const t of [1,2,3]){
 const c=s.cities.find(c=>c.team===t),trees=c.world.resources.filter(r=>r.kind==='tree');
 ok(trees.filter(r=>!r.removed).length>=trees.length*.3,'team '+t+' ('+personalityV280(s,t)+') still has forest: '+trees.filter(r=>!r.removed).length+'/'+trees.length);
 ok(noWoodMax[t]<=8*60,'team '+t+' was without wood for '+noWoodMax[t]+' s');
}
const perWorker=grain/Math.max(1,farmWork/60);
ok(perWorker>=1.5,'a farm worker brings at least 1.5 grain a minute ('+perWorker.toFixed(2)+', V280: 0.5)');
ok(maxParties<=1,'one raiding party per town at a time ('+maxParties+')');
ok(settlerTrip<40*60,'AI settlers found their town within 40 minutes (longest '+Math.round(settlerTrip/60)+' min)');
console.log('stone age economy V281 ok: grain/farm worker-min',perWorker.toFixed(2),'longest settler trip',Math.round(settlerTrip/60),'min, pop',[1,2,3].map(t=>s.cities.filter(c=>c.team===t).reduce((a,c)=>a+c.economy.realms[t].pop,0)).join('/'));
