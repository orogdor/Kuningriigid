import {ERA_TECHS,ERA_MATERIALS,ageDeficit,payEraCost} from './era-economy.js';
import {researchCost,scienceRate,discoveryUnlocked,EUREKAS,EUREKA_FRACTION} from './science.js';
import {tempoMultiplier} from './tempo.js';
export const TURN_SECONDS=60;
export const TECHS={
 hunting:{name:'Jahipidamine',age:0,turns:1,requires:[],unlocks:'Jahimehe onn'},
 fishing:{name:'Kalapüük',age:0,turns:1,requires:[],unlocks:'Kalamehe onn'},
 stone_tools:{name:'Kivitöö',age:0,turns:2,requires:[],unlocks:'Kivimurd ja elamu'},
 warfare:{name:'Sõjapidamine',age:0,turns:2,requires:['stone_tools'],unlocks:'Sõdalaste laager, kiviviskajad, puuodad ja kivikirved'},
 forestry:{name:'Metsade teadlik majandamine',age:1,turns:2,requires:['bronze','woodworking'],unlocks:'Metsniku maja ja istutusmetsad'},
 water:{name:'Veevarustus',age:0,turns:2,requires:['stone_tools'],unlocks:'Kaev'},
 settlement:{name:'Asunduste rajamine',age:0,turns:2,requires:['stone_tools'],unlocks:'Uute asunike värbamine ja uued linnad'},
 bronze:{name:'Pronksitöö',age:1,turns:4,requires:['stone_tools'],oneOf:['hunting','fishing','agriculture'],unlocks:'Pronksiaeg ja pronksriistad'},
 agriculture:{name:'Põlluharimine',age:0,turns:3,requires:['stone_tools'],unlocks:'Kiviaja põld ja talu'},
 woodworking:{name:'Puusepatöö',age:1,turns:2,requires:['bronze'],unlocks:'Puusepatöökoda ja lauad'},
 milling:{name:'Käsijahvatus ja leivategu',age:1,turns:2,requires:['agriculture','woodworking'],unlocks:'Käsiveski ja pagariäri'},
 archery:{name:'Vibulaskmine',age:0,turns:2,requires:['hunting','warfare'],unlocks:'Kiviaja vibukütid ja lasketiir'},
 iron:{name:'Rauatöö',age:2,turns:4,requires:['bronze','woodworking'],unlocks:'Rauaaeg, rauakaevandus ja söepõletaja'},
 smelting:{name:'Rauasulatus',age:2,turns:3,requires:['iron'],unlocks:'Rauasulatusahi'},
 smithing:{name:'Sepatöö',age:2,turns:3,requires:['smelting','warfare'],unlocks:'Relvasepp ja raudmõõgamehed'},
 civics:{name:'Feodaalkorraldus',age:3,turns:4,requires:['smithing','milling'],unlocks:'Keskaeg ja suuremad keskaegsed asulad'},
 horsemanship:{name:'Ratsaväe väljaõpe',age:2,turns:3,requires:['iron','warfare'],unlocks:'Rauaaja tall ja ratsavägi'}
};
Object.assign(TECHS,{
stone_crafts:{name:'Kiviaja töökojad',age:0,turns:2,requires:['stone_tools'],unlocks:'Kõik tööhooned +10% tootlikkust'},
bronze_crafts:{name:'Pronksriistad ja ehitus',age:1,turns:3,requires:['bronze','stone_crafts'],unlocks:'Kõigi linnade ehitised pronksitasemele; +25% kiirus'},
iron_crafts:{name:'Raudriistad ja töökojad',age:2,turns:4,requires:['iron','bronze_crafts'],unlocks:'Kõigi linnade ehitised rauatasemele; +50% kiirus'},
medieval_crafts:{name:'Meistrite ehituskunst',age:3,turns:5,requires:['civics','iron_crafts'],unlocks:'Kõigi linnade ehitised keskaja tasemele; +75% kiirus'},
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
 renaissance:{name:'Renessanss',age:4,turns:7,requires:['civics','scholasticism'],unlocks:'Renessansiajastu'},
 printing:{name:'Trükikunst',age:4,turns:5,requires:['renaissance','writing'],unlocks:'Trükikoda ja paber'},
 astronomy:{name:'Astronoomia',age:4,turns:6,requires:['renaissance','navigation'],unlocks:'Tähetorn'},
 gunpowder:{name:'Salpeeter ja püssirohi',age:4,turns:7,requires:['renaissance','smelting'],unlocks:'Salpeetritöökoda, püssirohuveski ja musketärid'},
 industrialization:{name:'Tööstusrevolutsioon',age:5,turns:9,requires:['renaissance','printing','gunpowder','iron_crafts'],unlocks:'Tööstusajastu'},
 steelmaking:{name:'Terase masstootmine',age:5,turns:7,requires:['industrialization','smelting'],unlocks:'Terasevabrik'},
 steam_engine:{name:'Aurumasin',age:5,turns:8,requires:['steelmaking'],unlocks:'Masinatehas'},
 industrial_education:{name:'Tehniline kõrgharidus',age:5,turns:6,requires:['steam_engine','printing'],unlocks:'Polütehnikum'},
 rifles:{name:'Vintpüssid',age:5,turns:6,requires:['steelmaking','gunpowder'],unlocks:'Püssimehed'},
 railways:{name:'Raudteetransport',age:5,turns:7,requires:['steam_engine'],unlocks:'Raudteejaam'},
 modernity:{name:'Moodne ajastu',age:6,turns:11,requires:['industrial_education','railways'],unlocks:'Moodne ajastu'},
 oil_drilling:{name:'Naftapuurimine',age:6,turns:7,requires:['modernity'],unlocks:'Naftapuurauk'},
 petroleum:{name:'Nafta rafineerimine',age:6,turns:7,requires:['oil_drilling'],unlocks:'Rafineerimistehas'},
 electricity:{name:'Elektritootmine',age:6,turns:8,requires:['modernity','steelmaking'],unlocks:'Elektrijaam'},
 combustion:{name:'Sisepõlemismootor',age:6,turns:9,requires:['petroleum','steam_engine'],unlocks:'Autotehas ja motoriseeritud väed'},
 modern_science:{name:'Moodne teadus',age:6,turns:9,requires:['electricity','industrial_education'],unlocks:'Uurimislabor'},
 aviation:{name:'Lennundus',age:6,turns:9,requires:['combustion','modern_science'],unlocks:'Lennuväli'}
});
export const ERA_NAMES=['Kiviaeg','Pronksiaeg','Rauaaeg','Keskaeg','Renessanss','Tööstusajastu','Moodne ajastu'];

export const BUILD_TECH={printer:'printing',observatory:'astronomy',nitrate:'gunpowder',powdermill:'gunpowder',steelworks:'steelmaking',engineworks:'steam_engine',polytechnic:'industrial_education',railstation:'railways',oilwell:'oil_drilling',refinery:'petroleum',powerplant:'electricity',autofactory:'combustion',laboratory:'modern_science',airfield:'aviation',scriptorium:'writing',academy:'philosophy',university:'scholasticism',warehouse:'storage',cellar:'cellaring',market:'commerce',harbor:'shipbuilding',bridge:'bridges',quarry:'stone_tools',hunter:'hunting',fisher:'fishing',barracks:'warfare',forester:'forestry',farm:'agriculture',saw:'woodworking',mill:'milling',bakery:'milling',archery:'archery',mine:'iron',coal:'iron',smelter:'smelting',smith:'smithing',stable:'horsemanship'};
export const UNIT_TECH={musketeer:'gunpowder',rifleman:'rifles',motorized:'combustion',slinger:'warfare',spearman:'warfare',axeman:'warfare',archer:'archery',infantry:'smithing',cavalry:'horsemanship'};
export const newResearch=()=>({known:[],active:null,progress:{},completed:[],queue:[],paused:false,boosted:[],rate:0});
export function techBlock(research,id){const tech=TECHS[id];if(!tech)return 'Tundmatu tehnoloogia.';if(research.known.includes(id))return 'Juba uuritud.';const missing=tech.requires.filter(t=>!research.known.includes(t));if(missing.length)return 'Eeldab: '+missing.map(t=>TECHS[t].name).join(', ');if(tech.oneOf&&!tech.oneOf.some(t=>research.known.includes(t)))return 'Eeldab üht: '+tech.oneOf.map(t=>TECHS[t].name).join(' või ');return ''}
export function grantTech(research,id){if(!TECHS[id]||research.known.includes(id))return;for(const parent of TECHS[id].requires)grantTech(research,parent);if(TECHS[id].oneOf&&!TECHS[id].oneOf.some(t=>research.known.includes(t)))grantTech(research,TECHS[id].oneOf[0]);research.known.push(id)}
export function initResearch(state){if(state.research){for(const r of state.research){r.queue??=[];r.paused??=false;r.boosted??=[];r.rate??=0}return;}state.research=Array.from({length:state.armies.length},()=>newResearch());for(const team of state.armies.map(a=>a.team)){const r=state.research[team];for(const c of state.cities.filter(c=>c.team===team))for(const b of c.economy.buildings)grantTech(r,BUILD_TECH[b.type]);for(const u of state.units.filter(u=>u.team===team))grantTech(r,UNIT_TECH[u.kind]);if(state.cities.filter(c=>c.team===team).length>1||state.settlers.filter(a=>a.team===team).length>1)grantTech(r,'settlement');if(state.ages[team]>=1)grantTech(r,'bronze');if(state.ages[team]>=2)grantTech(r,'iron');if(state.ages[team]>=3)grantTech(r,'civics');if(state.ages[team]>=4)grantTech(r,'renaissance');if(state.ages[team]>=5)grantTech(r,'industrialization');if(state.ages[team]>=6)grantTech(r,'modernity');state.ages[team]=Math.max(state.ages[team],r.known.includes('modernity')?6:r.known.includes('industrialization')?5:r.known.includes('renaissance')?4:r.known.includes('civics')?3:r.known.includes('iron')?2:r.known.includes('bronze')?1:0)}}
export function startResearch(state,team,id){const r=state.research[team],error=techBlock(r,id);if(error)return {error};if(!state.cities.some(c=>c.team===team))return {error:'Raja esmalt linn. Uurimine algab linnast.'};r.active=id;r.paused=false;r.queue=(r.queue||[]).filter(t=>t!==id);r.progress[id]??=0;return {ok:true}}
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
