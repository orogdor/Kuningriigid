// V121 building catalogue: readable cards, searchable categories and clear material status.
export const BUILD_CATEGORIES=Object.freeze([
 ['all','All'],
 ['housing','Housing'],
 ['food','Food'],
 ['resources','Resources'],
 ['military','Defense'],
 ['science','Research'],
 ['services','Infrastructure']
]);
const TYPES={
 housing:'house well warehouse cellar market',
 food:'hunter fisher farm field pasture mill bakery watermill windmill',
 resources:'lumber forester saw quarry mason claypit pottery_kiln mine coal smelter smith coppermine tinmine bronze_foundry steelworks oilwell refinery nitrate powdermill engineworks',
 military:'barracks archery crossbow_range stable armorer palisade watchtower stonewall stonetower reinforced_wall gatehouse castle keep siegeworkshop harbor',
 science:'library school public_school high_school study scriptorium academy university printer observatory monastery chapel polytechnic laboratory',
 services:'bridge road_depot cartwright guildhall trade_yard tavern railstation powerplant autofactory airfield'
};
export function buildingCategory(type){
 for(const [group,names] of Object.entries(TYPES))if(names.split(' ').includes(type))return group;
 return 'services';
}
export const matchesBuilding=(type,name,category,query='')=>
 (category==='all'||buildingCategory(type)===category)&&(!query||[type,name,buildingCategory(type)].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
const make=(tag,cls,label)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(label!=null)e.textContent=label;
 return e;
};
export function appendBuildingCard(parent,{type,name,icon,cost,time,builder,missing='',error='',extra='',active=false,onChoose,onRequest}){
 const blocked=!!error,needs=!!missing;
 const button=make('button','v121-build-card'+(blocked?' is-blocked':needs?' needs-materials':' is-ready')+(active?' is-active':''));
 button.type='button';button.dataset.building=type;
 const heading=make('span','v121-card-head');
 heading.append(make('span','v121-card-icon',icon||'⌂'),make('strong','v121-card-name',name));
 const state=make('span','v121-card-state',blocked?'Locked':needs?'Supplies needed':active?'Selected':'Build');
 heading.append(state);button.append(heading);
 const price=make('span','v121-card-cost',cost);
 const eta=make('span','v121-card-meta','⏱ '+time+' · '+builder);
 button.append(price,eta);
 if(extra)button.append(make('span','v121-card-extra',extra));
 if(blocked||needs)button.append(make('span','v121-card-warning',blocked?error:'Missing: '+missing));
 if(!blocked&&needs)button.append(make('span','v121-card-action','Request missing materials →'));
 else if(!blocked)button.append(make('span','v121-card-action',active?'Place on the map →':'Select a site →'));
 button.disabled=blocked;button.onclick=needs?onRequest:onChoose;
 button.setAttribute('aria-label',name+'. '+(blocked?error:needs?'Missing materials: '+missing+'. Request supplies':cost+'. Place on map'));
 parent.append(button);return button;
}
export function renderBuildingCategories(host,category,onSelect,counts){
 host.replaceChildren();
 for(const [id,name] of BUILD_CATEGORIES){
  const count=counts[id]||0;
  if(id!=='all'&&!count)continue;
  const chip=make('button','v121-category'+(id===category?' active':''),name+' '+count);
  chip.type='button';chip.dataset.category=id;chip.setAttribute('aria-pressed',String(id===category));
  chip.onclick=()=>onSelect(id);
  host.append(chip);
 }
}
