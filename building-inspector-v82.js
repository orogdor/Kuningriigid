// V82 shared building inspection for every era. Read-only model + an opt-in
// owner-only action. All displayed values are derived from real game state.
const fmt=value=>Number.isFinite(Number(value))?Number(value).toLocaleString('et-EE',{maximumFractionDigits:2}):'—';
const resourceName=(names,key)=>names?.[key]||key;
const readable=(pairs,names)=>{
 const entries=Object.entries(pairs||{}).filter(([,v])=>Number(v)>0);
 return entries.length?entries.map(([key,value])=>fmt(value)+' '+resourceName(names,key)).join(' · '):'—';
};
export function describeBuilding(game,city,building,ages=[],names={},definitions={},techUnlocks={}){
 if(!city||!building)return null;
 const d=definitions[building.type]||{};
 const home=typeof game.parentCity==='function'?game.parentCity(city):city;
 const owner=city.team===0,complete=!!building.ready;
 const era=building.previewAge===game.upgrade(city.team)?building.previewAge:
  typeof game.buildingAge==='function'?game.buildingAge(city.team,building.type):game.upgrade(city.team);
 const maxHp=Math.max(1,Number(building.maxHp||0),Number(d.hp||0),Number(building.hp||0),350);
 const required=Math.max(0,d.workers||0);
 const assigned=Math.max(0,building.assigned||0);
 const needed=Math.max(0,building.workerLimit??required);
 const efficiency=Math.max(0,Math.min(100,Math.round((building.efficiency??(assigned>=needed?1:needed?assigned/needed:1))*100)));
 const duration=Math.max(0,typeof game.constructionTime==='function'?game.constructionTime(building.type):d.time||0);
 const progress=Math.max(0,building.progress||0);
 const buildPct=complete?100:duration?Math.max(0,Math.min(100,Math.round(progress/duration*100))):0;
 const production=d.out?fmt(d.rate??0)+' '+resourceName(names,d.out):'—';
 return {
  type:building.type,
  name:typeof game.buildingName==='function'?game.buildingName(city.team,building.type):d.name||building.type,
  city:home?.name||city.name||'Linn',team:city.team,owner,age:era,
  eraName:ages[era]?.name||'Ajastu '+era,icon:d.icon||'⌂',
  status:!complete?'Ehitamisel':building.disabled?'Peatatud':building.status||'Valmis',
  hp:Math.max(0,Math.round(building.hp||0)),maxHp:Math.round(maxHp),
  ready:complete,disabled:!!building.disabled,
  progress:buildPct,remaining:complete?0:Math.max(0,duration-progress),
  materialsRemaining:Math.max(0,building.materialsRemaining||0),
  assigned,needed,required,efficiency,
  production,productionResource:d.out||null,rate:d.rate||0,cycle:d.cycle||0,
  input:readable(d.input,names),
  cost:readable(d.cost,names),
  technology:techUnlocks[building.type]||null,
  position:{x:building.x,z:building.z},
  researchActivity:building.researchActivity,
  description:d.out?'Tootmishoone':['study','academy','university','observatory','polytechnic','laboratory','scriptorium'].includes(building.type)?'Teadusasutus':
   building.type==='house'?'Elamu':building.type==='hall'?'Linna peahoone':'Linnahoone'
 };
}
function line(label,value){
 const row=document.createElement('div');row.className='binfo-row';
 const name=document.createElement('span');name.textContent=label;
 const amount=document.createElement('strong');amount.textContent=String(value);
 row.append(name,amount);return row;
}
export function createBuildingInspector(root,{close,onWorkers,onToggle}){
 if(!root)throw new Error('Missing building inspector container');
 root.classList.add('binfo');
 const title=document.createElement('h3');title.id='building-inspector-title';
 const caption=document.createElement('p');caption.className='binfo-caption';
 const detail=document.createElement('div');detail.className='binfo-values';
 const actions=document.createElement('div');actions.className='binfo-actions';
 const dismiss=document.createElement('button');dismiss.type='button';
 dismiss.className='binfo-close';dismiss.setAttribute('aria-label','Sulge hoone info');
 dismiss.textContent='✕';dismiss.addEventListener('click',close);
 const heading=document.createElement('div');heading.className='binfo-heading';heading.append(title,dismiss);
 root.replaceChildren(heading,caption,detail,actions);
 let currentKey='';
 const update=(data)=>{
  if(!data){root.hidden=true;currentKey='';return}
  root.hidden=false;
  root.setAttribute('aria-label',data.name+' · '+data.eraName);
  const nextKey=[data.type,data.position.x,data.position.z,data.status,data.hp,data.maxHp,data.assigned,
   data.needed,data.efficiency,data.progress,data.disabled,data.input,data.production,data.age].join('|');
  if(currentKey===nextKey)return;
  currentKey=nextKey;
  title.textContent=(data.icon||'⌂')+' '+data.name;
  caption.textContent=data.eraName+' · '+data.city+' · '+data.description;
  detail.replaceChildren(
   line('Seisund',data.status),
   line('Seisukord',data.hp+' / '+data.maxHp+' HP'),
   line('Töölised',fmt(data.assigned)+' / '+fmt(data.needed)),
   line('Tõhusus',data.efficiency+'%'),
   line('Toodang / töötsükkel',data.production),
   line('Kuluvad ressursid / tsükkel',data.input),
   line('Ehitamise maksumus',data.cost)
  );
  if(data.technology)detail.append(line('Avastamine',data.technology));
  if(!data.ready){
   detail.append(line('Ehitusjärgus',data.progress+'%'));
   if(data.materialsRemaining)detail.append(line('Materjale puudu',fmt(data.materialsRemaining)));
  }
  if(data.researchActivity!=null)detail.append(line('Teadustöö aktiivsus',Math.round(data.researchActivity*100)+'%'));
  actions.replaceChildren();
  if(data.owner){
   const staff=document.createElement('button');staff.type='button';staff.textContent='♟ Töölised';
   staff.addEventListener('click',onWorkers);actions.append(staff);
   if(data.ready&&data.type!=='hall'){
    const toggle=document.createElement('button');toggle.type='button';
    toggle.textContent=data.disabled?'▶ Jätka tööd':'Ⅱ Peata töö';
    toggle.addEventListener('click',onToggle);actions.append(toggle);
   }
  }
 };
 return {update,element:root,isOpen:()=>!root.hidden};
}
