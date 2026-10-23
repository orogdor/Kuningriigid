// Runtime revisions only. No enumerable cache fields enter V4 saves.
const fields=new WeakMap(),arrays=new WeakMap(),tiles=new WeakMap(),cityOwners=new WeakMap();
const readMethods=new Set(['filter','find','findIndex','some','every','map','flatMap','forEach','reduce','reduceRight','slice','join','includes','indexOf','lastIndexOf','at','values','keys','entries',Symbol.iterator]);
const callbackMethods=new Set(['filter','find','findIndex','some','every','map','flatMap','forEach','reduce','reduceRight']);
export function observeField(object,key,notify,meaning=value=>value){
 if(!object)return;
 let map=fields.get(object);if(!map){map=new Map();fields.set(object,map)}
 let entry=map.get(key);
 if(!entry){
  const descriptor=Object.getOwnPropertyDescriptor(object,key);if(descriptor&&!descriptor.configurable)return;
  entry={value:object[key],listeners:new Map(),present:!!descriptor};map.set(key,entry);
  const install=()=>Object.defineProperty(object,key,{configurable:true,enumerable:entry.present,get(){return entry.value},set(value){const old=entry.value;entry.value=value;if(!entry.present){entry.present=true;install()}for(const[fn,select]of entry.listeners)if(!Object.is(select(old),select(value)))fn(value,old)}});
  install();
 }
 entry.listeners.set(notify,meaning);
}
export function observeArray(owner,key,itemFields=[],notify=()=>{},onItem=()=>{}){
 let map=arrays.get(owner);if(!map){map=new Map();arrays.set(owner,map)}
 let record=map.get(key);
 if(!record){
  record={version:0,listeners:new Set(),hooks:[]};map.set(key,record);
  record.touch=()=>{record.version++;for(const fn of record.listeners)fn()};
  const hook=item=>{if(!item||typeof item!=='object')return;for(const h of record.hooks)h(item)};
  const wrap=value=>{const methods=new Map(),proxy=new Proxy(value||[],{
   get(target,k,receiver){const fn=Reflect.get(target,k,receiver);if(!readMethods.has(k)||typeof fn!=='function')return fn;
    const cached=methods.get(k);if(cached?.source===fn)return cached.call;
    const call=(...args)=>{if(callbackMethods.has(k)&&typeof args[0]==='function'){const callback=args[0],context=args[1];args[0]=function(...values){values[values.length-1]=proxy;return Reflect.apply(callback,k==='reduce'||k==='reduceRight'?undefined:context,values)}}return Reflect.apply(fn,target,args)};
    methods.set(k,{source:fn,call});return call;
   },
   set(target,k,v){const old=target[k];if(k!=='length')hook(v);const result=Reflect.set(target,k,v);if(!Object.is(old,v))record.touch();return result},
   deleteProperty(target,k){const had=k in target,result=Reflect.deleteProperty(target,k);if(had)record.touch();return result}
  });return proxy};
  let value=wrap(owner[key]);Object.defineProperty(owner,key,{configurable:true,enumerable:true,get:()=>value,set:next=>{if(next===value)return;value=wrap(next);for(const item of value)hook(item);record.touch()}});
 }
 record.listeners.add(notify);
 const hooked=new WeakSet(),hook=item=>{if(hooked.has(item))return;hooked.add(item);for(const spec of itemFields){const[key,select]=Array.isArray(spec)?spec:[spec,undefined];observeField(item,key,record.touch,select)}onItem(item)};
 record.hooks.push(hook);for(const item of owner[key])if(item&&typeof item==='object')hook(item);
 return record;
}
export const BUILDING_FIELDS=['type','x','z','team','ready','virtual','disabled','wallAxis','navWidth','navDepth','width','depth','shoreAngle','bronzeWall','landEntry',['hp',v=>v>0?1:v<=0?-1:0]];
export function trackTile(world,economy=null,notify=null){
 let record=tiles.get(world);
 if(!record){
  record={resourceVersion:0,economies:new WeakMap(),external:world.revision||0};tiles.set(world,record);
  observeArray(world,'resources',['kind','x','z','id','removed','depositSite',['amount',v=>v>0]],()=>record.resourceVersion++);
 }
 if(economy&&!record.economies.has(economy)){
  const pointChanged=()=>record.economies.get(economy)?.touch();
  const watchPoint=p=>{if(p)for(const key of ['x','z'])observeField(p,key,pointChanged)};
  const list=observeArray(economy,'buildings',BUILDING_FIELDS,()=>{},b=>{watchPoint(b.landEntry);observeField(b,'landEntry',watchPoint)});
  record.economies.set(economy,list);
 }
 if(notify&&economy)record.economies.get(economy).listeners.add(notify);
 if(record.external!==(world.revision||0)){record.external=world.revision||0;record.resourceVersion++;}
 return record;
}
export function observeDistricts(city,notify,onDistrict){
 let value;
 const wrap=next=>{for(const d of Object.values(next||{}))onDistrict(d);return new Proxy(next||{},{set(target,key,d){if(target[key]===d)return true;target[key]=d;onDistrict(d);notify();return true},deleteProperty(target,key){const result=Reflect.deleteProperty(target,key);notify();return result}})};
 value=wrap(city.districts);Object.defineProperty(city,'districts',{enumerable:true,configurable:true,get:()=>value,set:next=>{if(next!==value){value=wrap(next);notify()}}});
}

// Buckets narrow candidates; callers retain their original exact predicates
// and original array ordering, so ties and AI choices do not change.
export class SpatialIndex{
 constructor(items,size=12){this.size=size;this.buckets=new Map();items.forEach((item,index)=>{const key=Math.floor(item.x/size)+':'+Math.floor(item.z/size);if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key).push({item,index})})}
 box(x,z,rx,rz=rx){const found=[];for(let r=Math.floor((z-rz)/this.size);r<=Math.floor((z+rz)/this.size);r++)for(let c=Math.floor((x-rx)/this.size);c<=Math.floor((x+rx)/this.size);c++)for(const hit of this.buckets.get(c+':'+r)||[])if(Math.abs(hit.item.x-x)<=rx&&Math.abs(hit.item.z-z)<=rz)found.push(hit);found.sort((a,b)=>a.index-b.index);return found.map(hit=>hit.item)}
}
const indexes=new WeakMap();
export function resourcesNear(world,x,z,rx,rz=rx){const record=trackTile(world);let index=indexes.get(world);if(!index||index.version!==record.resourceVersion){index={version:record.resourceVersion,grid:new SpatialIndex(world.resources)};indexes.set(world,index)}return index.grid.box(x,z,rx,rz)}

export function installGameRevisions(game){
 const perf=game._perf={areaRevision:0,areaBuilt:-1,cities:new WeakMap(),registered:new WeakSet(),stats:{territoryBuilds:0,summaryBuilds:0}};
 function register(city){
  if(perf.registered.has(city))return;perf.registered.add(city);cityOwners.set(city,game);
  const cache={version:0,built:-1};perf.cities.set(city,cache);
  const changed=()=>{cache.version++;perf.areaRevision++;perf.lookup=null};
  for(const field of ['id','team','c','r','radius'])observeField(city,field,changed);
  const context=d=>{if(d?.world&&d?.economy)trackTile(d.world,d.economy,changed)};
  context(city);observeDistricts(city,changed,context);
  observeArray(city.economy,'realms',[],changed,r=>observeField(r,'pop',changed,p=>p>=64?4:p>=48?3:p>=32?2:1));
 }
 observeArray(game.s,'cities',[],()=>{perf.areaRevision++;perf.lookup=null},register);
}
export function citySummary(game,parent){
 const cache=game._perf?.cities.get(parent);if(!cache)return null;
 if(cache.built!==cache.version){
  const contexts=cityContexts(game,parent),buildings=contexts.flatMap(c=>c.economy.buildings.filter(b=>!b.virtual));
  cache.value={buildings,pending:buildings.filter(b=>!b.ready&&b.hp>0),ready:new Map(),storage:new Map()};cache.built=cache.version;game._perf.stats.summaryBuilds++;
 }
 return cache.value;
}

function navigationText(economy){
 if(!economy)return '';
 const record=arrays.get(economy)?.get('buildings')||observeArray(economy,'buildings',BUILDING_FIELDS);
 if(record.navigationVersion!==record.version){record.navigationVersion=record.version;record.navigationText=economy.buildings.filter(b=>!b.virtual).map(b=>b.type+':'+(b.hp<=0?'dead':'live')+':'+Number(!!b.ready)+':'+(b.wallAxis||0)+':'+(b.width||0)+':'+(b.depth||0)+':'+Math.round(b.x*10)+':'+Math.round(b.z*10)+':'+(b.navWidth||0)+':'+(b.navDepth||0)+':'+(b.shoreAngle||0)+':'+(b.landEntry?.x??'')+':'+(b.landEntry?.z??'')).join('|')}
 return record.navigationText;
}
export function navigationRevision(world,economy){
 let previousText,previousWorld,revision=0;
 return ()=>{const text=navigationText(economy()),version=world.revision||0;if(text!==previousText||version!==previousWorld){previousText=text;previousWorld=version;revision++}return revision};
}
const buildingIndexes=new WeakMap();
export function buildingsNear(economy,x,z,radius){
 const record=arrays.get(economy)?.get('buildings')||observeArray(economy,'buildings',BUILDING_FIELDS);let cache=buildingIndexes.get(economy);
 if(!cache||cache.version!==record.version){cache={version:record.version,grid:new SpatialIndex(economy.buildings)};buildingIndexes.set(economy,cache)}
 return cache.grid.box(x,z,radius);
}

export function cityContexts(game,parent){
 const cache=game._perf?.cities.get(parent);if(!cache)return [parent,...Object.values(parent.districts||{})];
 if(cache.contextVersion!==cache.version){cache.contextVersion=cache.version;cache.contexts=[parent,...Object.values(parent.districts||{})]}
 return cache.contexts;
}
export function cityLookup(game){
 const perf=game._perf;if(!perf)return null;
 if(!perf.lookup){const positions=new Map(),ids=new Map();for(const city of game.s.cities){const key=city.c+':'+city.r;if(!positions.has(key))positions.set(key,city);if(!ids.has(city.id))ids.set(city.id,city)}perf.lookup={positions,ids}}
 return perf.lookup;
}

export function cachedCityBuildings(city){const game=cityOwners.get(city);return game?citySummary(game,city).buildings:null}
