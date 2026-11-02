// V282: English for the V262–V281 texts (also messages with names and numbers), no "water is short" while water is
// carried from a river, and the city-management hint about material deliveries only when stores really lack them.
import '../civilization-core.js'; // applies the game's building costs
import {translateEstonian as t} from '../localization.js';
import {cityProblems,actionTips} from '../v51-systems.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const est=/[õäöüÕÄÖÜ]|\b(ja|või|pole|linn|ruut|küla|kulda|puitu|Osta|Müü|Armeed|Kaubandus|Kaugemal|Selles)\b/;
for(const s of ['Armeed','Kaubandus','Selles ruudus','Kaugemal','Kuningriigi kassa','Kiirenda uuringut (40 kulda → +12 punkti)','Osta 20 puitu (12 kulda)','Müü 20 kivi (+11 kulda)',
 'Armee 1 · 1 mees','kaupleb linn Untamola · ruut 136:24','Kontrolli ehitusmaterjalide vedu','Joukola · ehitusel on veel materjale puudu','Liigub linnakohta','⚙ Graafika ja jõudlus',
 'Turn 33 · Hoiatus: Röövlite küla saatis 3-mehelise röövsalga Tõlluste poole! Saabub ~154 s pärast.',
 'Röövlid rüüstasid Tõlluste: 8 wood, 4 stone, 14 gold ja viisid ühe elaniku vangi. Ehita palisaad/vahitorn või hoia linnas sõdalasi.',
 'Hoiatus: võõras armee (5 sõdurit) on Joukola lähedal (8 ruutu). Rahuaeg kestab veel 3 min.','Vett tuuakse jõest (−10% tööaega)']){
 const en=t(s);ok(!est.test(en.replace(/Tõlluste|Joukola|Untamola/g,'')),'translated: '+s+' => '+en);}
ok(t('Armee 1 · 1 mees')==='Army 1 · 1 man','singular man');
// water carried from the river: no shortage warning
const city={team:0,c:0,r:0,name:'Joukola',waterFetchV267:true,economy:{realms:[{pop:8,resources:{water:0,bread:80,wood:200,stone:200}}],buildings:[{type:'hall',ready:true,hp:100}]}};
const game={s:{research:[{known:[]}],cities:[city],ages:[0]},allBuildings:c=>c.economy.buildings,parentCity:c=>c};
ok(!cityProblems(game,city).some(i=>i.text==='Vett napib'),'no water shortage while water is carried');
delete city.waterFetchV267;ok(cityProblems(game,city).some(i=>i.text==='Vett napib'),'a real shortage is still reported');
// material hint only when stores cannot cover the waiting buildings
city.waterFetchV267=true;city.economy.buildings.push({type:'house',ready:false,hp:100,materialsRemaining:12});
ok(!actionTips(game,0).some(x=>x.text==='Kontrolli ehitusmaterjalide vedu'),'no delivery hint with full stores');
city.economy.realms[0].resources.wood=0;ok(actionTips(game,0).some(x=>x.text==='Kontrolli ehitusmaterjalide vedu'),'delivery hint when wood is missing');
console.log('ui V282 ok');
