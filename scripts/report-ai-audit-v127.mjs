import fs from 'node:fs';
import {Civilization,createGame,AGES,FACTION_NAMES,TROOPS,BUILDINGS} from '../civilization-core.js';
import {GOOD_BUILDINGS} from '../city-needs-v87.js';
const root='reports/ai-audit-v127',d=JSON.parse(fs.readFileSync(root+'/latest.json')),orders=JSON.parse(fs.readFileSync(root+'/orders.json')),hist=JSON.parse(fs.readFileSync(root+'/history.json')),rules=JSON.parse(fs.readFileSync(root+'/era-rules.json'));
const map=new Civilization(createGame(d.seed)),sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),bname=id=>BUILDINGS[id]?.name||id;
const tile=t=>`${t[0]+1}:${t[1]+1}`,local=b=>`${b.x}, ${b.z}`;
const all=d.cities.flatMap(c=>c.buildings),farms=all.filter(b=>b.type==='farm'),fields=all.filter(b=>b.type==='field'),walls=all.filter(b=>['palisade','stonewall','reinforced_wall','gatehouse'].includes(b.type)),towers=all.filter(b=>['watchtower','stonetower'].includes(b.type));
const idle=d.cities.flatMap(c=>c.farms.filter(f=>f.ready&&!f.fields).map(f=>({city:c.name,tile:f.tile,fertile:!!map.cell({c:f.tile[0],r:f.tile[1]}).deposits.grain})));
const count=arr=>arr.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{});
const fmtCounts=o=>Object.entries(o).map(([id,n])=>`${TROOPS[id]?.name||id} × ${n}`).join('; ')||'Puudub';
const readyN=(c,type)=>c.buildings.filter(b=>b.type===type&&b.ready).length;
const teamUnits=t=>d.armies.filter(a=>a.team===t).flatMap(a=>a.units),scouts=sum(d.armies,a=>a.units.filter(u=>u.kind==='scout').length)+d.garrisons.filter(u=>u.kind==='scout').length;
const recruits=orders.events.filter(e=>e.event==='recruit'),realRecruits=recruits.filter(e=>e.kind!=='scout');
const l=[];const add=x=>l.push(x);
add('# Kuningriigid V127 — AI linnade ja armeede kontroll');
add(`\nKontrollitud lähtekood: kohalik V127, commit 0444e3d. Kaardiseeme ${d.seed}. Viimane täielikult salvestatud vaatlus: **${d.turn}. käik**. Üks käik = 60 mängusekundit. Mängureegleid selle auditi ajal ei muudetud.\n`);
add('Katse kasutab tavalist majandus-, teadus-, ehitus- ja värbamisloogikat. Ka Kadaka mängijapoolt juhiti testis AI-ga. Päriskampaanias ei lisatud tasuta ressursse, avastusi ega sõdureid. Eraldi seitsme ajastu reeglikatsetes anti eeltingimused ette; nende tulemusi ei loeta kampaanias saavutatud arenguks.\n');
add('Vaatluskatse peatati pärast kinnitatud planeerimisvigade leidmist. Kõik neli riiki jõudsid keskaega ja kaks renessanssi; tööstus- ning moodsa ajastu orgaanilist kampaaniat selle katsega ei kinnitatud. Nende ajastulukke kontrolliti eraldi reeglikatsetega.\n');
add('Brauseri 3D-vaadet ja päris lahingute käiku see test ei kontrolli. Müüride hinnang põhineb hoonete tüüpidel, asukohtadel ja AI ehituskoodil.\n');
add('## Peamised tulemused\n');
add(`- Ajastu, avastuste ja eeltingimuste rikkumisi õnnestunud ehitus- või maismaaväe värbamiskäskudes: **${d.violations.length}** (${orders.events.filter(e=>e.event==='build').length} ehituskäsku ja ${recruits.length} värbamiskäsku). Kõigi seitsme ajastu eraldi kontrollis oli tulevikuüksuste ja tulevikuhoonete lubamisi **${sum(rules,r=>r.futureUnitErrors.length+r.futureBuildingErrors.length)}**.`);
add(`- Linnu kokku **${d.cities.length}**. Elanikke **${sum(d.cities,c=>c.pop)}**. Viljapõlde **${fields.length}**, neist valmis **${fields.filter(b=>b.ready).length}**. Põllutalusid **${farms.length}**, neist valmis **${farms.filter(b=>b.ready).length}**. Loomafarme **${all.filter(b=>b.type==='pasture').length}**.`);
add(`- Valmis põllutalu ilma kasutatava valmis põlluta: **${idle.length}**. Nendest **${idle.filter(x=>!x.fertile).length}** asuvad viljaka põllumaa tunnuseta ruudul. AI ehitab talumaja, kuid põllu automaatika jätab sellise ruudu vahele.`);
add(`- Elusaid avastajaid armeedes ja müürigarnisonides kokku **${scouts}**. Päris lahinguüksuste värbamiskäske kogu vaadeldud kampaanias **${realRecruits.length}**; avastajate värbamiskäske **${recruits.filter(e=>e.kind==='scout').length}**.`);
add(`- Müürilõike ja väravaid kokku **${walls.length}**, torne **${towers.length}**. AI ehitab üldjuhul igast müüritüübist ühe hoone ning ei sea kaitseringi, väravate või tornide ühenduste plaani. Olemasolev müür ei tähenda suletud kaitseringi.`);
add('- Püsivad torni kaitsjad ei uuene üle rauaaja: kood valib alates rauaajast alati `iron_archer`. See jääb nii ka renessansis, tööstusajal ja moodsas ajas. Torni viit kaitsjat ei ole lisatud allpool väljaarmee sõdurite arvule.');
add('- Põllutöö süsteem puudutab praegu vilja: lina-, siidi- ja muud maardlapõhised istandused ning aiad on endiselt varasema ühendatud tootmishoone loogikaga. Nende arv on eraldi allpool.\n');
add('Värbamiskäsk tähendab tasutud väljaõppetellimust, mitte tingimata juba valmis salka. Laevastiku ehitust ega lahinguid selles aruandes ei hinnata.\n');
add('## Riigid kontrollhetkel\n');
add('| Riik | Ajastu | Linnu | Elanikke | Väljaarmee salgad / mehi | Müürigarnisoni salgad / mehi | Valmis talud / põllud / loomafarmid |');add('|---|---|---:|---:|---:|---:|---:|');
for(let t=0;t<4;t++){const cs=d.cities.filter(c=>c.team===t),ars=d.armies.filter(a=>a.team===t),gs=d.garrisons.filter(g=>g.team===t);add(`| ${FACTION_NAMES[t]}${t===0?' (AI juhitud mängijapool)':''} | ${AGES[d.ages[t]].name} | ${cs.length} | ${sum(cs,c=>c.pop)} | ${sum(ars,a=>a.squads)} / ${sum(ars,a=>a.men)} | ${gs.length} / ${sum(gs,g=>g.men)} | ${sum(cs,c=>readyN(c,'farm'))} / ${sum(cs,c=>readyN(c,'field'))} / ${sum(cs,c=>readyN(c,'pasture'))} |`);}
add('\nMeeste arv on mängu üksusesuuruse järgi: avastaja = 1; tavaline jala- või laskurväe salk = 24; ratsaväe ja tehnika suurus sõltub üksusetüübist. „Mehi” on mängumudeli arvestus, mitte ajaloolise pataljoni suurus.\n');
add('## Linnad: põllumajandus ja kaitse\n');add('Kaardiruudud on siin kasutajaliidese kujul **veerg:rida, alates 1-st**. Kohalikud x,z koordinaadid on detailkaardi mänguühikutes. Loendites on ainult hp > 0 ehitised. „v/e” = valmis / ehitamisel.\n');
add('| ID | Riik / linn | Kaardiruut | Ajastu | Elanikke | Elamuid v/e | Talusid v/e | Põlde v/e | Põllupind | Loomafarme v/e | Kaitserajatised |');add('|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|');
const ve=(c,type)=>`${readyN(c,type)}/${c.buildings.filter(b=>b.type===type&&!b.ready).length}`;
for(const c of [...d.cities].sort((a,b)=>a.team-b.team||a.id-b.id)){add(`| ${c.id} | ${c.name} | ${tile(c.tile)} | ${c.ageName} | ${c.pop} | ${ve(c,'house')} | ${ve(c,'farm')} | ${ve(c,'field')} | ${c.fieldArea} | ${ve(c,'pasture')} | ${Object.entries(count(c.walls.map(b=>b.type))).map(([id,n])=>bname(id)+' × '+n).join('; ')||'Puuduvad'} |`);}
add('\nPõllupind sisaldab märgitud põldude laiuse × sügavuse summat, ka pooleliolevaid põlde; see ei ole hektarite arv.\n');
add('## Armeede täpne koosseis\n');
for(let t=0;t<4;t++){
 add(`### ${FACTION_NAMES[t]} — ${AGES[d.ages[t]].name}\n`);
 for(const a of d.armies.filter(a=>a.team===t&&a.squads))add(`- Armee ${a.id}, ruut ${tile(a.tile)}: **${a.squads} salka / ${a.men} meest**. ${fmtCounts(a.counts)}.`);
 const gs=d.garrisons.filter(g=>g.team===t);if(gs.length)for(const q of gs)add(`- Müürigarnison ruudul ${tile([q.c,q.r])}, detail x,z = ${q.x}, ${q.z}: ${TROOPS[q.kind]?.name||q.kind}, ${q.men} meest; ${bname(q.wallType)}.`);else add('- Püsivaid müürigarnisone ei olnud.');
 const old=d.armies.filter(a=>a.team===t).flatMap(a=>a.units.filter(u=>u.obsolete));add(`- Vananenud väljaarmee salgud, mille järglane on juba avastatud: ${old.length}.`);
 const tw=d.cities.filter(c=>c.team===t).flatMap(c=>c.walls.filter(b=>['watchtower','stonetower'].includes(b.type)&&b.ready&&!b.disabled));add(`- Valmis aktiivseid torne: ${tw.length}; reeglijärgne algkoosseis kuni ${tw.length*5} tornikaitsjat. Nende tegelikku individuaalset lahinguseisundit see katse ei mõõtnud.\n`);
}
add('## Iga linna ehitised ja täpsed asukohad\n');
for(const c of [...d.cities].sort((a,b)=>a.team-b.team||a.id-b.id)){
 add(`### ${c.name} — ID ${c.id}, ruut ${tile(c.tile)}\n`);
 add(`${c.ageName}; ${c.pop} elanikku; majandusroll ${c.role||'määramata'}. Ressursid: ${Object.entries(c.stock).map(([k,n])=>`${k} ${n}`).join(', ')}.\n`);
 add('| Ehitis | Kaardiruut | Linnaala / maakond | Detail x,z | Seis | Töölisi | Täpsustus |');add('|---|---|---|---|---|---:|---|');
 for(const b of c.buildings){const extra=b.type==='field'?`${b.width||16} × ${b.depth||16}`:b.type==='farm'?(b.farming?.tool||b.status||''):b.status||'';add(`| ${b.name||b.type} (${b.type}) | ${tile(b.tile)} | ${b.county?'maakond':'linnaala'} | ${local(b)} | ${b.disabled?'peatatud':b.ready?'valmis':'ehitamisel'} | ${Math.round(b.assigned*100)/100} | ${extra.replaceAll('|','/')} |`);}
 add('');
}
add('## Muud põllumajandushooned\n');add('| Tüüp | Arv | Valmis |');add('|---|---:|---:|');
for(const [id,def]of Object.entries(GOOD_BUILDINGS).filter(([id,def])=>def.deposit)){const bs=all.filter(b=>b.type===id);if(bs.length)add(`| ${bname(id)} (${id}) | ${bs.length} | ${bs.filter(b=>b.ready).length} |`);}
add('\n## Kõigi ajastute lubatud uued üksused\n');add('Järgnev tabel on eraldi reeglikontroll, mitte väide, et AI päriskampaanias need kõik valmis värbas. Ressursid, tööjõud ja eeltingimuste hooned anti selles kontrollis ette. Vana üksus võib jääda armeesse ka hilisemas ajastus; uue tellimist kontrollitakse eraldi.\n');
add('| Ajastu | Reeglitega lubatud üksused pärast ajastu avastusi | Tulevikuüksuste / -hoonete vigu |');add('|---|---|---:|');
for(const r of rules)add(`| ${r.name} | ${r.allowedRecruitment.map(u=>u.name).join('; ')} | ${r.futureUnitErrors.length+r.futureBuildingErrors.length} |`);
add('\n## Katse kulg\n');add('| Käik | Ajastud Kadaka / Ida / Põhja / Lõuna | Linnu | Talusid | Põlde | Kaitserajatisi | Elusaid üksusi |');add('|---:|---|---:|---:|---:|---:|---:|');
for(const h of hist.filter(h=>h.turn<=d.turn))add(`| ${h.turn} | ${h.ages.map(a=>AGES[a].name).join(' / ')} | ${h.cities} | ${h.farms} | ${h.fields} | ${h.walls} | ${h.troops} |`);
add('\n## Järeldused ja vajalikud parandused\n');
add('1. Lahinguväe planeerimisel tuleb avastajad lahinguväe värbamisvalikust, lahinguväe limiidist ja ründejõu võrdlusest välja jätta. Praegu on avastajal ajastupiirang küll õige, kuid AI kasutab teda lahinguväe täitena.');
add('2. AI peab kavandama eraldi jala-, laskur-, ratsa- ning piiramisväe osakaalu ja ehitama selleks vajalikud väljaõppehooned. Praegune valik järjestab esmalt ajastu üksused kahju järgi ning kasutab seejärel fikseeritud varuvalikuid.');
add('3. Põllutalu asukoht ja põllu sobivus tuleb otsustada koos. Viljatu keskusruudu korral peab AI rajama talu ning põllud maakonna viljakale ruudule; pelgalt keskusruudule talumaja lisamine jätab tootmise seisma.');
add('4. Kindlustustele on vaja terviklikku ümber linna kulgevat plaani: müürijoon, pööratud külglõigud, väravad, ühendatud tornid ja läbipääsud. Praegune ehitusvalik ei taga isegi kõigi kaitseehitiste valmimisel sellist plaani.');
add('5. Tornikaitsjate varustus tuleb siduda hilisemate ajastute ja avastustega. Praegu jääb varustus alates rauaajast muutumatuks.');
add('6. Kui kogu põllumajandus peab kasutama eraldi põlde, vajavad sama teisendust ka lina- ja muud istandused. V127 eraldab ainult tavalise viljapõllu.');
add('\nAuditi tulemus: **ajastulukud läbivad kontrolli, kuid AI tegelikud linnad ja armeed ei ole veel terviklikult ajastule vastavad ega hästi planeeritud.** Test ei tõesta kõigi riikide jõudmist moodsasse aega ega kindlustuste edukust päris lahingus.\n');
fs.writeFileSync(root+'/Kuningriigid_V127_AI_linnade_ja_armeede_audit.md',l.join('\n'));
fs.writeFileSync(root+'/summary.json',JSON.stringify({turn:d.turn,cities:d.cities.length,ages:d.ages,fields:fields.length,readyFields:fields.filter(b=>b.ready).length,farms:farms.length,readyFarms:farms.filter(b=>b.ready).length,idleFarms:idle.length,nonFertileIdleFarms:idle.filter(x=>!x.fertile).length,scouts,walls:walls.length,towers:towers.length,teams:[0,1,2,3].map(t=>({team:t,name:FACTION_NAMES[t],age:d.ages[t],cities:d.cities.filter(c=>c.team===t).length,units:count(teamUnits(t).map(u=>u.kind)),garrisons:d.garrisons.filter(g=>g.team===t).map(g=>g.kind)}))},null,2));
console.log('REPORT',root+'/Kuningriigid_V127_AI_linnade_ja_armeede_audit.md');
