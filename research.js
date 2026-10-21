import {PRODUCTIVITY_TECHS} from './productivity-techs-v88.js';
import {ERA_TECHS,ERA_MATERIALS,ageDeficit,payEraCost} from './era-economy.js';
import {MEDIEVAL_TECHS,MEDIEVAL_BUILD_TECH,MEDIEVAL_UNIT_TECH} from './medieval-v62.js';
import {researchCost,scienceRate,discoveryUnlocked,EUREKAS,EUREKA_FRACTION} from './science.js';
import {tempoMultiplier} from './tempo.js';
export const TURN_SECONDS=60;
export const TECHS={
 hunting:{name:'Jahipidamine',age:0,turns:1,requires:[],unlocks:'Jahimehe onn'},
 fishing:{name:'Kalapüük',age:0,turns:1,requires:[],unlocks:'Kalamehe onn'},
 stone_tools:{name:'Kivitöö',age:0,turns:2,requires:[],unlocks:'Kivimurd, elamu ja kiviaja ehitaja'},
 learning:{name:'Õpetuse alused',age:0,turns:2,requires:['stone_tools'],unlocks:'Õpikoda ja õpetlaste teadustöö'},
 warfare:{name:'Sõjapidamine',age:0,turns:2,requires:['stone_tools'],unlocks:'Sõdalaste laager, kiviviskajad, puuodad ja kivikirved'},
 forestry:{name:'Metsade teadlik majandamine',age:1,turns:2,requires:['bronze','woodworking'],unlocks:'Metsniku maja ja istutusmetsad'},
 water:{name:'Veevarustus',age:0,turns:2,requires:['stone_tools'],unlocks:'Kaev'},
 settlement:{name:'Asunduste rajamine',age:0,turns:2,requires:['stone_tools'],unlocks:'Uute asunike värbamine ja uued linnad'},
 bronze:{name:'Pronksitöö',age:1,turns:4,requires:['stone_tools'],oneOf:['hunting','fishing','agriculture'],unlocks:'Pronksiaeg, pronksriistad ja pronksiaja ehitaja (×1.20)'},
 agriculture:{name:'Põlluharimine',age:0,turns:3,requires:['stone_tools'],unlocks:'Kiviaja põld ja talu'},
 woodworking:{name:'Puusepatöö',age:1,turns:2,requires:['bronze'],unlocks:'Puusepatöökoda ja lauad'},
 milling:{name:'Käsijahvatus ja leivategu',age:1,turns:2,requires:['agriculture','woodworking'],unlocks:'Käsiveski ja pagariäri'},
 archery:{name:'Vibulaskmine',age:0,turns:2,requires:['hunting','warfare'],unlocks:'Kiviaja vibukütid ja lasketiir'},
 iron:{name:'Rauatöö',age:2,turns:4,requires:['bronze','woodworking'],unlocks:'Rauaaeg, rauakaevandus, söepõletaja ja rauaaja ehitaja (×1.40)'},
 smelting:{name:'Rauasulatus',age:2,turns:3,requires:['iron'],unlocks:'Rauasulatusahi'},
 smithing:{name:'Sepatöö',age:2,turns:3,requires:['smelting','warfare'],unlocks:'Relvasepp ja raudmõõgamehed'},
 civics:{name:'Feodaalkorraldus',age:3,turns:4,requires:['smithing','milling'],unlocks:'Keskaeg, suuremad keskaegsed asulad ja meisterehitaja (×1.70)'},
 horsemanship:{name:'Ratsaväe väljaõpe',age:2,turns:3,requires:['iron','warfare'],unlocks:'Rauaaja tall ja ratsavägi'}
};
Object.assign(TECHS,{
stone_crafts:{name:'Kiviaja töökojad',age:0,turns:2,requires:['stone_tools'],unlocks:'Kõik tööhooned +10% tootlikkust; kiviaja ehitaja jääb aluseks (×1.00)'},
bronze_crafts:{name:'Pronksriistad ja ehitus',age:1,turns:3,requires:['bronze','stone_crafts'],unlocks:'Pronksiaja ehitaja kinnistub; kõigi linnade ehitised pronksitasemele'},
iron_crafts:{name:'Raudriistad ja töökojad',age:2,turns:4,requires:['iron','bronze_crafts'],unlocks:'Rauaaja ehitaja kinnistub; kõigi linnade ehitised rauatasemele'},
medieval_crafts:{name:'Meistrite ehituskunst',age:3,turns:5,requires:['civics','iron_crafts'],unlocks:'Keskaegne meisterehitaja kinnistub; kõigi linnade ehitised keskaja tasemele'},
shipbuilding:{name:'Laevaehitus',age:1,turns:3,requires:['bronze','woodworking','fishing'],unlocks:'Sadam, sõjalaev, transpordilaev; rannikusõit'},
 writing:{name:'Kirjakunst',age:1,turns:3,requires:['bronze','settlement'],unlocks:'Kirjutuskoda ja kirjalik asjaajamine'},
 philosophy:{name:'Filosoofia ja teaduste korraldus',age:2,turns:3,requires:['iron','writing'],unlocks:'Akadeemia'},
 scholasticism:{name:'Kõrgem haridus',age:3,turns:4,requires:['civics','philosophy'],unlocks:'Ülikool'},
bridges:{name:'Sillaehitus',age:1,turns:3,requires:['bronze','woodworking'],unlocks:'Sillad oma maa-alal asuvatele jõgedele'},
storage:{name:'Laoehitus ja varude korraldus',age:1,turns:2,requires:['bronze','woodworking'],unlocks:'Materjaliladu (+300 igale ehitusmaterjalile)'},
cellaring:{name:'Keldrite ja toidu säilitamine',age:1,turns:2,requires:['bronze','agriculture'],unlocks:'Toidukelder (+200 toidumahutavust)'},
commerce:{name:'Linnaturg ja kaubandus',age:1,turns:3,requires:['bronze','storage'],unlocks:'Turg ja elamute toidujagamine'},
navigation:{name:'Rannikunavigatsioon',age:2,turns:4,requires:['iron','shipbuilding'],unlocks:'Sõit kuni 2 ruudu kaugusel maismaast'},
ocean_sailing:{name:'Ookeanipurjetamine',age:3,turns:8,requires:['civics','navigation','medieval_crafts'],unlocks:'Keskaja lõpu ookeanilaevad; süvamere ületamine'}
});

Object.assign(TECHS,{
 renaissance:{name:'Renessanss',age:4,turns:7,requires:['civics','scholasticism'],unlocks:'Renessansiajastu ja renessansiaja ehitaja (×1.95)'},
 printing:{name:'Trükikunst',age:4,turns:5,requires:['renaissance','writing'],unlocks:'Trükikoda ja paber'},
 astronomy:{name:'Astronoomia',age:4,turns:6,requires:['renaissance','navigation'],unlocks:'Tähetorn'},
 gunpowder:{name:'Salpeeter ja püssirohi',age:4,turns:7,requires:['renaissance','smelting'],unlocks:'Salpeetritöökoda, püssirohuveski ja musketärid'},
 industrialization:{name:'Tööstusrevolutsioon',age:5,turns:9,requires:['renaissance','printing','gunpowder','iron_crafts'],unlocks:'Tööstusajastu ja tööstusajastu ehitaja (×2.25)'},
 steelmaking:{name:'Terase masstootmine',age:5,turns:7,requires:['industrialization','smelting'],unlocks:'Terasevabrik'},
 steam_engine:{name:'Aurumasin',age:5,turns:8,requires:['steelmaking'],unlocks:'Masinatehas'},
 industrial_education:{name:'Tehniline kõrgharidus',age:5,turns:6,requires:['steam_engine','printing'],unlocks:'Polütehnikum'},
 rifles:{name:'Vintpüssid',age:5,turns:6,requires:['steelmaking','gunpowder'],unlocks:'Püssimehed'},
 railways:{name:'Raudteetransport',age:5,turns:7,requires:['steam_engine'],unlocks:'Raudteejaam'},
 modernity:{name:'Moodne ajastu',age:6,turns:11,requires:['industrial_education','railways'],unlocks:'Moodne ajastu ja moodsa ajastu ehitaja (×2.60)'},
 oil_drilling:{name:'Naftapuurimine',age:6,turns:7,requires:['modernity'],unlocks:'Naftapuurauk'},
 petroleum:{name:'Nafta rafineerimine',age:6,turns:7,requires:['oil_drilling'],unlocks:'Rafineerimistehas'},
 electricity:{name:'Elektritootmine',age:6,turns:8,requires:['modernity','steelmaking'],unlocks:'Elektrijaam'},
 combustion:{name:'Sisepõlemismootor',age:6,turns:9,requires:['petroleum','steam_engine'],unlocks:'Autotehas ja motoriseeritud väed'},
 modern_science:{name:'Moodne teadus',age:6,turns:9,requires:['electricity','industrial_education'],unlocks:'Uurimislabor'},
 aviation:{name:'Lennundus',age:6,turns:9,requires:['combustion','modern_science'],unlocks:'Lennuväli'}
});
// V60: Optional early-economy research branches. No new mandatory era gates.
Object.assign(TECHS,{
 pottery:{name:'Savitöö ja keraamika',age:0,turns:2,requires:['stone_tools'],unlocks:'Savivõtukoht ja pottsepatöökoda; rohkem toidu säilitamise ruumi'},
 animal_husbandry:{name:'Loomakasvatus',age:0,turns:3,requires:['hunting','agriculture'],unlocks:'Karjamaa ja loomakasvatusest saadav toit'},
 masonry:{name:'Kivitahumine',age:0,turns:3,requires:['stone_tools'],unlocks:'Kiviraiduri töökoda ja tahutud kivi'},
 wheel:{name:'Ratta valmistamine',age:1,turns:3,requires:['bronze','woodworking'],unlocks:'Vankritöökoda ja kiiremad kaubavankrid'},
 copper_tin:{name:'Vase- ja tinatöö',age:1,turns:4,requires:['bronze','masonry'],unlocks:'Vase- ja tinakaevandused ning pronksisulatus'},
 road_construction:{name:'Teedeehitus',age:1,turns:4,requires:['wheel','copper_tin'],unlocks:'Teemeistrite töökoda: liiklusega kujunevate teede tõhusam hooldus'}
});
// V61: Defensive structures must be researched before placement.
Object.assign(TECHS,{
 fortifications:{name:'Kaitserajatised',age:0,turns:3,requires:['stone_tools','warfare'],unlocks:'Puidust kaitsemüür ja vahitorn (üks töötaja)'},
 stone_fortifications:{name:'Kivist kindlustused',age:1,turns:4,requires:['bronze','fortifications','masonry'],unlocks:'Kivimüür ning kivist kaitsetorn'}
});
Object.assign(TECHS,MEDIEVAL_TECHS,PRODUCTIVITY_TECHS);
export const ERA_NAMES=['Kiviaeg','Pronksiaeg','Rauaaeg','Keskaeg','Renessanss','Tööstusajastu','Moodne ajastu'];

export const BUILD_TECH={palisade:'fortifications',watchtower:'fortifications',stonewall:'stone_fortifications',stonetower:'stone_fortifications',claypit:'pottery',pottery_kiln:'pottery',pasture:'animal_husbandry',mason:'masonry',cartwright:'wheel',coppermine:'copper_tin',tinmine:'copper_tin',bronze_foundry:'copper_tin',road_depot:'road_construction',study:'learning',printer:'printing',observatory:'astronomy',nitrate:'gunpowder',powdermill:'gunpowder',steelworks:'steelmaking',engineworks:'steam_engine',polytechnic:'industrial_education',railstation:'railways',oilwell:'oil_drilling',refinery:'petroleum',powerplant:'electricity',autofactory:'combustion',laboratory:'modern_science',airfield:'aviation',scriptorium:'writing',academy:'philosophy',university:'scholasticism',warehouse:'storage',cellar:'cellaring',market:'commerce',harbor:'shipbuilding',bridge:'bridges',quarry:'stone_tools',hunter:'hunting',fisher:'fishing',barracks:'warfare',forester:'forestry',farm:'agriculture',saw:'woodworking',mill:'milling',bakery:'milling',archery:'archery',mine:'iron',coal:'iron',smelter:'smelting',smith:'smithing',stable:'horsemanship'};
export const UNIT_TECH={musketeer:'gunpowder',rifleman:'rifles',motorized:'combustion',slinger:'warfare',spearman:'warfare',axeman:'warfare',archer:'archery',infantry:'smithing',cavalry:'horsemanship'};
Object.assign(BUILD_TECH,MEDIEVAL_BUILD_TECH);
Object.assign(UNIT_TECH,MEDIEVAL_UNIT_TECH);
export const newResearch=()=>({known:[],active:null,progress:{},completed:[],queue:[],paused:false,boosted:[],rate:0});
export function techBlock(research,id){const tech=TECHS[id];if(!tech)return 'Tundmatu tehnoloogia.';if(research.known.includes(id))return 'Juba uuritud.';const missing=tech.requires.filter(t=>!research.known.includes(t));if(missing.length)return 'Eeldab: '+missing.map(t=>TECHS[t].name).join(', ');if(tech.oneOf&&!tech.oneOf.some(t=>research.known.includes(t)))return 'Eeldab üht: '+tech.oneOf.map(t=>TECHS[t].name).join(' või ');return ''}
export function grantTech(research,id){if(!TECHS[id]||research.known.includes(id))return;for(const parent of TECHS[id].requires)grantTech(research,parent);if(TECHS[id].oneOf&&!TECHS[id].oneOf.some(t=>research.known.includes(t)))grantTech(research,TECHS[id].oneOf[0]);research.known.push(id)}
export function initResearch(state){if(state.research){for(const r of state.research){r.queue??=[];r.paused??=false;r.boosted??=[];r.rate??=0}for(const city of state.cities||[]){const hasStudy=city.economy?.buildings?.some(b=>b.type==='study')||Object.values(city.districts||{}).some(d=>d.economy?.buildings?.some(b=>b.type==='study'));if(hasStudy)grantTech(state.research[city.team],'learning')}return;}state.research=Array.from({length:state.armies.length},()=>newResearch());for(const team of state.armies.map(a=>a.team)){const r=state.research[team];for(const c of state.cities.filter(c=>c.team===team))for(const b of c.economy.buildings)grantTech(r,BUILD_TECH[b.type]);for(const u of state.units.filter(u=>u.team===team))grantTech(r,UNIT_TECH[u.kind]);if(state.cities.filter(c=>c.team===team).length>1||state.settlers.filter(a=>a.team===team).length>1)grantTech(r,'settlement');if(state.ages[team]>=1)grantTech(r,'bronze');if(state.ages[team]>=2)grantTech(r,'iron');if(state.ages[team]>=3)grantTech(r,'civics');if(state.ages[team]>=4)grantTech(r,'renaissance');if(state.ages[team]>=5)grantTech(r,'industrialization');if(state.ages[team]>=6)grantTech(r,'modernity');state.ages[team]=Math.max(state.ages[team],r.known.includes('modernity')?6:r.known.includes('industrialization')?5:r.known.includes('renaissance')?4:r.known.includes('civics')?3:r.known.includes('iron')?2:r.known.includes('bronze')?1:0)}}
export function startResearch(state,team,id){const r=state.research[team],error=techBlock(r,id);if(error)return {error};if(!state.cities.some(c=>c.team===team))return {error:'Raja esmalt vähemalt üks linn. Avastused kehtivad kogu riigis.'};r.active=id;r.paused=false;r.queue=(r.queue||[]).filter(t=>t!==id);r.progress[id]??=0;return {ok:true}}
export function queueResearch(state,team,id){const r=state.research[team];r.queue??=[];if(r.known.includes(id)||r.active===id||r.queue.includes(id))return {error:'See teema on juba uuritud või järjekorras.'};if(r.queue.length>=4)return {error:'Järjekorda mahub kuni neli teemat.'};if(!r.active&&!r.paused&&!r.queue.length)return startResearch(state,team,id);const planned={known:[...r.known,...(r.active?[r.active]:[]),...r.queue]};const error=techBlock(planned,id);if(error)return {error};r.queue.push(id);return {ok:true}}
export function tickResearch(state,dt){
 const events=[];
 for(const team of state.armies.map(a=>a.team)){
  const r=state.research[team];r.queue??=[];r.boosted??=[];
  r.rate=scienceRate(state,team);
  if(!r.paused && r.rate>0){
   // A one-time Eureka grants 35% of a *particular* technology, even if the
   // discovery precedes research. It cannot be awarded twice after reloading.
   for(const id of Object.keys(EUREKAS)){
    if(r.known.includes(id)||r.boosted.includes(id)||!discoveryUnlocked(state,team,id))continue;
    const cost=researchCost(state,TECHS[id]);
    r.progress[id]=Math.min(cost,(r.progress[id]||0)+cost*EUREKA_FRACTION);
    r.boosted.push(id);events.push({team,id,boost:true});
   }
  }
  if(r.paused||r.rate<=0)continue;
  let budget=dt*r.rate/60;
  for(let step=0;step<24;step++){
   if(!r.active&&r.queue.length&&!techBlock(r,r.queue[0]))r.active=r.queue.shift();
   const id=r.active;
   if(!id||techBlock(r,id)||budget<=0)break;
   const total=researchCost(state,TECHS[id]);
   const used=Math.min(budget,Math.max(0,total-(r.progress[id]||0)));
   r.progress[id]=(r.progress[id]||0)+used;budget-=used;
   if(r.progress[id]+1e-8<total)break;
   // The age is awarded only after the entire material cost can be paid.
   // Keep a completed, active research on hold instead of consuming resources partially.
   if(ERA_TECHS[id]){
    const payment=payEraCost(state,team,id);
    if(!payment.paid){r.ageWait={id,missing:payment.missing};r.progress[id]=total;budget=0;break}
   }
   r.ageWait=null;r.progress[id]=total;r.known.push(id);r.active=null;
   const time=state.time-(budget/(r.rate/60));
   r.completed.push({id,time});
   if(id==='bronze')state.ages[team]=Math.max(state.ages[team],1);
   if(id==='iron')state.ages[team]=Math.max(state.ages[team],2);
   if(id==='civics')state.ages[team]=Math.max(state.ages[team],3);if(id==='renaissance')state.ages[team]=Math.max(state.ages[team],4);if(id==='industrialization')state.ages[team]=Math.max(state.ages[team],5);if(id==='modernity')state.ages[team]=Math.max(state.ages[team],6);
   events.push({team,id});
   if(budget<=0){if(r.queue.length&&!techBlock(r,r.queue[0]))r.active=r.queue.shift();break}
  }
 }
 return events;
}
