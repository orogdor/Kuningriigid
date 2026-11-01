// V276: villages come in two kinds built from town buildings; traders trade, raiders raid after the peace
// and are beaten off by defences; raider villages cannot be claimed.
import {Civilization,createGame} from '../civilization-core.js';
import {villageTypeV276,villageLayoutV276,tradeWithVillageV276,raidTickV276,TRADE_OFFERS_V276,tradeOffersV278,villageAgeV278} from '../villages-v276.js';
import {collectLandmark} from '../world-discoveries.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(createGame(20261104,'tectonic'));
const villages=(g.s.landmarks||[]).filter(l=>l.kind==='village');
ok(villages.length>4,'villages exist: '+villages.length);
const raiders=villages.filter(l=>villageTypeV276(l)==='raiders'),traders=villages.filter(l=>villageTypeV276(l)==='traders');
ok(raiders.length&&traders.length,'both kinds: '+raiders.length+' raiders, '+traders.length+' traders');
const lr=villageLayoutV276(raiders[0]),lt=villageLayoutV276(traders[0]);
ok(lr.some(b=>b.type==='palisade')&&lr.filter(b=>b.type==='watchtower').length===4&&lr.some(b=>b.type==='woodgate'),'raiders: palisade ring, gate, four towers');
{const ring=lr.filter(b=>b.wallRingV278),rad=b=>Math.hypot(b.x/36,b.z/(36*.86));
 ok(ring.filter(b=>b.type==='watchtower').length===4&&ring.filter(b=>b.type==='woodgate').length===1,'towers and gate are part of the wall ring');
 ok(ring.every(b=>Math.abs(rad(b)-1)<.02),'every wall piece on the same ring');
 const step=2*Math.PI*36*.93/ring.length;ok(step<7,'segments overlap (spacing '+step.toFixed(1)+' < palisade length 7)');}
ok(tradeOffersV278(1).some(o=>o.id==='buy_bronze')&&!tradeOffersV278(0).some(o=>o.id==='buy_bronze'),'Bronze Age villages trade bronze, Stone Age ones do not');
ok(!lt.some(b=>b.type==='palisade')&&lt.some(b=>b.type==='cellar'),'traders: open village with stores');
ok(lr[0].type==='hall'&&lt.filter(b=>b.type==='house').length>=6,'longhouse and houses like a town');
ok(collectLandmark(g,0,raiders[0])===null&&raiders[0].claimedBy==null,'raider village cannot be claimed');
// a player town next to a trader village
const t=traders[0],a=g.s.settlers.find(s=>s.team===0);a.c=t.c+2;a.r=t.r;g.land(a.id);
let town=null;for(let x=-20;x<=20&&!town;x+=4)for(let z=-20;z<=20&&!town;z+=4){if(g.siteRule(a,{x,z}))continue;a.x=x;a.z=z;const r=g.found(a.id);if(r.city)town=r.city;}
ok(town,'test town founded');g.s.explored[0][t.c+':'+t.r]=true;
const res=town.economy.realms[0].resources;res.wood=100;const gold0=res.gold||0;
const tr=tradeWithVillageV276(g,t.id,'sell_wood',0);ok(tr.ok&&res.wood===80&&res.gold===gold0+9,'village buys wood for gold');
res.gold=0;ok(tradeWithVillageV276(g,t.id,'buy_food',0).error,'cannot buy without gold');
ok(tradeWithVillageV276(g,raiders[0].id,'sell_wood',0).error,'raiders do not trade');
// raids: none during peace, one after; undefended town loses stores, defended one beats them off
g.s.landmarks=[{...raiders[0],c:town.c+3,r:town.r}];
ok(raidTickV276(g,500,true).length===0&&!(g.s.raidsV276||[]).length,'no raids during the peace');
const m1=raidTickV276(g,500,false);ok(g.s.raidsV276.length===1&&m1.some(m=>m.warn),'raid launched with a warning');
res.bread=200;res.wood=200;g.s.time+=1000;const m2=raidTickV276(g,1,false);
ok(res.bread<200&&m2.some(m=>/rüüstasid/.test(m.text)),'undefended town raided');
town.economy.buildings.push({type:'palisade',x:30,z:30,team:0,hp:500,ready:true});
g.s.landmarks[0].raidClockV276=1e9;raidTickV276(g,1,false);const b0=res.bread;g.s.time+=1000;const m3=raidTickV276(g,1,false);
ok(res.bread===b0&&m3.some(m=>/tagasi/.test(m.text)),'palisade drives raiders off');
console.log('villages V276 ok:',raiders.length,'raiders',traders.length,'traders, offers',TRADE_OFFERS_V276.length);
