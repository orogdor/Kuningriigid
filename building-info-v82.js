// V82 shared building inspection – works with V4 saves and all seven eras.
// This module reads existing game data; selecting a building never mutates it.
export const INSPECTION_AGES=['Kiviaeg','Pronksiaeg','Rauaaeg','Keskaeg','Renessanss','Tööstusajastu','Moodne ajastu'];
const category={
 hall:'Linnakeskus',house:'Elamu',warehouse:'Ladu',cellar:'Toiduhoidla',
 market:'Kaubandus',trade_yard:'Kaubandus',inn:'Teenused',
 well:'Veevarustus',farm:'Toidutootmine',pasture:'Loomakasvatus',
 hunter:'Jahipidamine',fisher:'Kalapüük',bakery:'Toidutootmine',mill:'Toidutootmine',
 university:'Teadus',polytechnic:'Teadus',observatory:'Teadus',
 study:'Teadus',academy:'Teadus',scriptorium:'Teadus',laboratory:'Teadus',
 printer:'Trükindus',nitrate:'Keemiatööstus',powdermill:'Püssirohutööstus',
 steelworks:'Metallitööstus',engineworks:'Masinatööstus',
 railway:'Transport',railstation:'Transport',harbor:'Transport',bridge:'Transport',
 keep:'Kaitserajatis',stonewall:'Kaitserajatis',palisade:'Kaitserajatis',
 watchtower:'Kaitserajatis',stonetower:'Kaitserajatis',gatehouse:'Kaitserajatis',
 barracks:'Sõjavägi',stable:'Sõjavägi',archery:'Sõjavägi',
 powerplant:'Energiatootmine',oilwell:'Naftatootmine',refinery:'Kütusetootmine'
};
const purpose={
 hall:'Linna keskhoone ja elanike tegevuste juhtimispunkt.',
 house:'Annab elanikele elamispinda. Elanikud vajavad jätkuvalt toitu ja vett.',
 warehouse:'Hoiustab linna tootmiseks ja ehituseks vajalikke materjale.',
 cellar:'Suurendab toidu säilitamise võimalusi.',
 market:'Elanikud käivad turul toidu järel ja viivad selle kodudesse.',
 well:'Varustab elanikke ja toidutootmist veega.',
 farm:'Kasvatab vilja ja varustab toiduainete tootmise ahelat.',
 printer:'Trükipress valmistab paberist trükiseid.',
 observatory:'Tähetorn toetab astronoomia uurimist.',
 polytechnic:'Polütehnikum arendab tööstus- ja inseneriteadusi.',
 steelworks:'Terase tootmise hoone, mis vajab vastavaid sisendmaterjale.',
 engineworks:'Masinate valmistamise töökoda.',
 railstation:'Raudteejaam toetab tööstusajastu maismaatransporti.',
 powerplant:'Elektrienergiat tootev rajatis.',
 inn:'Kõrts ja linnaeluga seotud teenused.',
 barracks:'Sõdurite värbamise ja väljaõppe hoone.'
};
const finite=n=>Number.isFinite(n)?Math.max(0,n):0;
export function describeBuilding(b,def={},context={}){
 if(!b||typeof b.type!=='string')return null;
 const age=Math.max(0,Math.min(6,Math.floor(context.age??b.previewAge??0)));
 const hp=finite(b.hp??def.hp??350),maximum=finite(b.maxHp??def.hp??(b.type==='hall'?1200:350))||350;
 const duration=finite(context.constructionTime??def.time??0);
 const progress=finite(b.progress??(b.ready?duration:0));
 const timeLeft=b.ready?0:Math.max(0,duration-progress);
 const capacity=finite(b.workerLimit??def.workers??0);
 const assigned=finite(b.assigned??0);
 const efficiency=Number.isFinite(b.efficiency)?Math.min(100,Math.max(0,b.efficiency*100)):null;
 const input=Object.entries(def.input||{}).filter(([,n])=>finite(n)>0)
  .map(([resource,quantity])=>({resource,quantity:finite(quantity)}));
 const cost=Object.entries(def.cost||{}).filter(([,n])=>finite(n)>0)
  .map(([resource,quantity])=>({resource,quantity:finite(quantity)}));
 const output=def.out?{resource:def.out,quantity:finite(def.rate??0),period:finite(def.cycle??0)}:null;
 const special=!!def.workers&&!output;
 return {
  type:b.type,name:context.name||def.name||b.type,category:category[b.type]||'Linnaehitis',
  age,ageName:INSPECTION_AGES[age],team:b.team??0,
  purpose:purpose[b.type]||(output?'Muudab töötajate ja toormaterjalide abil ressursse.':special?'Vajab töötajaid et oma ülesannet täita.':'Hoone toetab linna toimimist ja arengut.'),
  health:{hp,max:maximum,percent:Math.min(100,Math.round(hp/maximum*100))},
  ready:!!b.ready,underConstruction:!b.ready,
  disabled:!!b.disabled,
  status:b.status||(!b.ready?'Ehitus pooleli':b.disabled?'Peatatud':assigned>0?'Töötab':'Valmis'),
  workforce:{assigned,capacity,efficiency},
  production:{input,output},
  construction:{timeLeft,total:duration,progress,percent:duration?Math.min(100,Math.round(progress/duration*100)):(b.ready?100:0),
   materialsRemaining:finite(b.materialsRemaining??0),materialsTotal:finite(b.materialsTotal??0),cost},
  upgrade:{level:finite(b.upgradeLevel??0),visualAge:age},
  coordinates:{x:b.x,z:b.z}
 };
}
const labels={
 et:{health:'Seisukord',workers:'Töötajad',production:'Tootmine',input:'Sisend',output:'Väljund',build:'Ehitus',cost:'Ehitusmaterjalid',
  time:'Valmimiseni',ready:'Valmis',state:'Olek',upgrade:'Uuendus',level:'Tase',owner:'Omanik',age:'Ajastu',
  noWorkers:'Ei vaja töötajaid',empty:'Püsiressurssi ei toodeta',per:'iga',seconds:'s',resources:'Ressursid',
  workforce:'Tööjõud',work:'Tootlikkus',materials:'Veel ehitusmaterjale',position:'Asukoht'},
 en:{health:'Condition',workers:'Workers',production:'Production',input:'Input',output:'Output',build:'Construction',cost:'Build materials',
  time:'Time remaining',ready:'Ready',state:'Status',upgrade:'Upgrade',level:'Level',owner:'Owner',age:'Era',
  noWorkers:'No workers required',empty:'No ongoing resource production',per:'every',seconds:'s',resources:'Resources',
  workforce:'Staffing',work:'Efficiency',materials:'Materials remaining',position:'Position'}
};
function resourceList(list,names){
 return list.length?list.map(v=>v.quantity+' '+(names[v.resource]||v.resource)).join(' · '):'—';
}
function element(tag,cls,value){
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(value!=null)el.textContent=String(value);return el;
}
export function renderBuildingDetails(root,desc,{resourceNames={},lang='et'}={}){
 if(!root||!desc)return;
 const l=labels[lang]||labels.et;
 const nodes=[],row=(key,val)=>{
  const r=element('div','binfo-row');
  r.append(element('span','binfo-key',key),element('strong','binfo-value',val));
  nodes.push(r);
 };
 const section=name=>nodes.push(element('h4','binfo-section',name));
 nodes.push(element('p','binfo-purpose',desc.purpose));
 row(l.age,desc.ageName);
 row(l.state,desc.status);
 row(l.health,Math.round(desc.health.hp)+' / '+Math.round(desc.health.max)+' HP ('+desc.health.percent+'%)');
 section(l.workforce);
 row(l.workers,desc.workforce.capacity?
  desc.workforce.assigned.toFixed(desc.workforce.assigned%1?2:0)+' / '+desc.workforce.capacity:l.noWorkers);
 if(desc.workforce.efficiency!=null)row(l.work,Math.round(desc.workforce.efficiency)+'%');
 section(l.production);
 if(desc.production.output){
  row(l.output,desc.production.output.quantity+' '+(resourceNames[desc.production.output.resource]||desc.production.output.resource)
   +(desc.production.output.period?' / '+desc.production.output.period+' '+l.seconds:''));
  row(l.input,resourceList(desc.production.input,resourceNames));
 }else row(l.production,l.empty);
 section(l.build);
 if(desc.underConstruction){
  row(l.time,Math.ceil(desc.construction.timeLeft)+' '+l.seconds);
  row(l.materials,desc.construction.materialsRemaining+' / '+desc.construction.materialsTotal);
 }else row(l.build,l.ready);
 row(l.cost,resourceList(desc.construction.cost,resourceNames));
 row(l.upgrade,l.level+' '+desc.upgrade.level+' · '+desc.ageName);
 if(desc.coordinates&&Number.isFinite(desc.coordinates.x))
  row(l.position,Math.round(desc.coordinates.x)+' / '+Math.round(desc.coordinates.z));
 root.replaceChildren(...nodes);
}
