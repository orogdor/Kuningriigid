import fs from 'node:fs';import crypto from 'node:crypto';
import {TROOPS,BUILDINGS,AGES,FACTION_NAMES} from '../civilization-core.js';
const raw=fs.readFileSync('scenarios/iron-ai-v128.json'),s=JSON.parse(raw),m=s.ironAITestV128;
const count=a=>a.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
const allBuildings=c=>[c,...Object.values(c.districts||{})].flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0));
const data={version:'V128',seed:s.seed,turn:m.turn,target:m.target,ironDiscoveries:`${m.knownIronTechs}/${m.ironTechs}`,sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length,teams:[0,1,2,3].map(team=>{const cities=s.cities.filter(c=>c.team===team),b=cities.flatMap(allBuildings),u=s.units.filter(u=>u.team===team&&u.hp>0);return {team,name:FACTION_NAMES[team],age:s.ages[team],ageName:AGES[s.ages[team]].name,cities:cities.length,pop:cities.reduce((n,c)=>n+c.economy.realms[team].pop,0),units:count(u.map(u=>u.kind)),combatSquads:u.filter(u=>u.kind!=='scout').length,farms:b.filter(b=>b.type==='farm').length,fields:b.filter(b=>b.type==='field').length,livestock:b.filter(b=>b.type==='pasture').length,walls:count(b.filter(b=>['palisade','stonewall','reinforced_wall','gatehouse','watchtower','stonetower'].includes(b.type)).map(b=>b.type))};})};
fs.writeFileSync('scenarios/iron-ai-v128.manifest.json',JSON.stringify(data,null,2));
const l=['# V128 — ajastuga arenev AI ja rauaaja ülevõtmistest','',
'Avastajad on lahinguväe värbamisest ja tugevuse limiidist eemaldatud. AI planeerib jala-, laskur-, ratsa- ja piiramisväge eraldi rollide järgi. Järgmisse ajastusse liikumine ootab tegelikult valmis lahinguväge; optional teadus peatub ajastu keskpaigas, kuni uus varustus ja väljaõpe järele jõuavad. Olulised sõjaväe tootmise avastused jäävad avatuks. Mitteaktiivse uurimise õpetlaste tööjõud vabaneb.',
'',
'Vana armee täitumisel õpetatakse olemasolevaid linnas viibivaid salku tasuliselt ümber. Ümberõpe kulutab uue üksuse materjalid ja tegeliku väljaõppeaja, säilitab salga ning ei võta teist korda rahvast. Mängija saab sama toimingut kasutada valitud vananenud üksuse tegevustest. Vigastuste osakaal ja armee kogemus säilivad.',
'',
'Standardsete maismaaüksuste materjalikulu on ligikaudu 35% väiksem. Kerge salga värbamine kulutab 1, ratsa-, piiramis- või sõidukiüksus 2 tööjõuühikut senise 3 asemel. Väljaõppeajad vähenesid ligikaudu 25%. Hinnad ja reeglid kehtivad võrdselt AI-le ning mängijale.',
'',
'Põllutalu vajab 2 töötajat ja on odavam. AI rajab selle viljakale ruudule ning lisab päris eraldi põllu. Vase-, tina-, raua- ja relvatootmine saab kõrgema prioriteedi; maakonna maardlaid kasutatakse ka vase ja tina jaoks. Kasarm ei vaja kunstlikult oma kivimurdu, kiviraidur ega pronksisulatus oma kaevandusi: töökojad kasutavad reaalselt kohale toodud sisendeid. AI tellib kaupmeestelt ehitamiseks puuduvaid materjale. Täis keskuse korral otsitakse ehituskohta ka linna teistel linnaruududel, maakonna kolme hoone reeglit säilitades.',
'',
'Kindlustused ehitatakse ette määratud kaitsevöö kohtadele, kahe väravaava ja pööratud külglõikudega. Väravate keskel on oma üksustele läbitav koridor. Ring valmib järk-järgult ning maastik või ressursipuudus võib jätta osi pooleli. Tornikaitsjad saavad avastuste järgi hilisematel ajastutel ristvibud, musketid või vintpüssid.',
'',
'## Praegused näidishinnad','', '| Ehitis | Materjalid | Ehitamise baasaeg |', '|---|---|---:|'];
for(const id of ['farm','barracks','archery','stable','smelter','smith','palisade','stonewall','gatehouse']){const b=BUILDINGS[id];l.push(`| ${b.name} | ${Object.entries(b.cost).map(([k,n])=>`${k} ${n}`).join(', ')} | ${b.time} |`);}
l.push('', '## Ülevõtmistesti lähtekoht','',`Seeme ${s.seed}; käik **${m.turn}**. Ülevõetav riik on **Ida**. Rauaaja avastusi on teada **${m.knownIronTechs}/${m.ironTechs}** — keskpaik tähendab siin rauaaja tehnoloogiapuu edenemist, mitte kogu mängu käikude arvu.`, '',
`Seis pärineb tavalisest AI kampaaniast, mida jätkati paranduste kontrollimiseks samast salvestusest. Ressursse, tehnoloogiaid, ehitisi ega sõdureid ei lisatud tasuta. Viimase tasulise ümberõppe kontroll jätkus 375. käigu säilitatud seisust; testsalvestus võeti ${m.turn}. käigul. Kõiki nelja riiki juhtis salvestuse tegemiseni AI, sh tavaline mängijapool. Ülevõtmisel vahetatakse ainult riikide indeksid ja omand; majandus, uurimine, sõdurid ning avastatud kaart säilivad.`, '',
'| Riik | Ajastu | Linnu | Elanikke | Lahingusalku | Talusid / põlde / loomafarme |', '|---|---|---:|---:|---:|---:|');
for(const t of data.teams)l.push(`| ${t.name} | ${t.ageName} | ${t.cities} | ${t.pop} | ${t.combatSquads} | ${t.farms} / ${t.fields} / ${t.livestock} |`);
l.push('', 'Ida üksused: '+Object.entries(data.teams[1].units).map(([k,n])=>`${TROOPS[k]?.name||k} × ${n}`).join('; ')+'.', '',
'Test avaneb pausil ning mängija juhib endist Ida riiki. ▶ jätkab mängu. Kõik teised riigid jätkavad AI juhtimisel. Testi laadimine ei kirjuta üle tavalise mängu automaatsalvestust; ekspordinupust saab oma testiseisu alla laadida.', '',
'## Kontrollid','',
'- V128 reeglitestid: hinnad, rahvakulu, segaväe valik, ajastu valmisolek, õpetlaste/uurimise paus, tornikaitsjate relvad, kaitsevöö suunad, värava läbipääs, tasuline ümberõpe ja üksuste arvu säilimine ning ülevõtmise omandi/ressursside/avastuste vastavus.',
'- V127, V126 ja V125 regressioonikontrollid.',
'- Päris kampaania tellimuste ajastu- ja eeltingimuste kontroll: vigu ei leitud.',
'- Brauserikontrolli käitab V128 töövoog lauaarvuti ja telefoni vaates; tõendusfailid säilitatakse GitHub Actionsi artefaktina.',
'- See katse ei ole uus 900 käigu kampaania ega tõend kõigi riikide moodsasse aega jõudmise või kõigi lahingute toimimise kohta.');
fs.writeFileSync('MUUDATUSED_V128.md',l.join('\n')+'\n');console.log(JSON.stringify(data));
