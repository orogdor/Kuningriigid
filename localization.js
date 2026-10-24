import {ENGLISH_PAIRS} from './locale-en.js?v=97a';
import {ENGLISH_V120_PAIRS} from './locale-en-v120.js?v=120a';
import {ENGLISH_V155_PAIRS} from './locale-en-v155.js?v=155a';
import {TECH_UNLOCKS_EN_V120} from './research-unlocks-en-v120.js?v=120a';

const buildVersion=typeof document!=='undefined'?(document.title.match(/V(\d+)/)?.[1]||'96'):'96';
// V63: The save file stores gameplay, not language. Language is a separate,
// reversible presentation preference, defaulting to English for every device.
const english=new Map([...ENGLISH_PAIRS,...ENGLISH_V120_PAIRS,...ENGLISH_V155_PAIRS.filter(([a,b])=>a!==b)]);
const sorted=[...english].filter(([s])=>s.length>=3).sort((a,b)=>b[0].length-a[0].length)
 .map(([source,target])=>({source,target,re:new RegExp('(?<![\\p{L}])'+[...source].map(c=>'.*+?^${}()|[]\\'.includes(c)?'\\'+c:c).join('')+'(?![\\p{L}])','gu')}));
let language='en',binding=[],observer=null;
const texts=new WeakMap(),attributes=new WeakMap(),helpOriginal=new WeakMap();
const HELP_EN=[
 '<b>Controls.</b> Use WASD or arrow keys to pan in either view, Shift to move faster, and +/− to zoom. Click to select. Press M or Move to issue an order; right-click to move immediately. V selects, X stops, F focuses, G switches maps, Enter opens a selected tile, and Esc cancels.',
 '<b>1. World Map.</b> Select your settler, press M and choose a reachable land tile. Open its detail view and found your first city on suitable ground. All four factions start beside the sea.',
 '<b>2. Stone Age.</b> Hunters supply food from wildlife; fishers work along coasts. Research farming, archery, stoneworking and warfare to unlock early buildings and troops. Gather wood and stone for construction.',
 '<b>3. Cities and Resources.</b> Expand your city into adjacent tiles by increasing its population. Connected districts share the parent city’s supplies and workforce. Different terrain provides different deposits; settle additional cities to get resources your capital lacks. Cities automatically trade surplus along viable routes.',
 '<b>4. Research and Eras.</b> Open the technology tree, pick a discovery and assign scholars to research buildings for extra science. Research unlocks buildings and units. Gather the listed materials before advancing from the Stone Age through Bronze, Iron, Medieval, Renaissance, Industrial and Modern eras.',
 '<b>5. City Management.</b> Use the Overview, Build and Workers tabs. Assign builders and production workers as your population grows. Buildings need materials and time; food and water are consumed continuously. Homes increase housing capacity, markets distribute food, and warehouses expand storage.',
 '<b>6. Seas and Warfare.</b> Research shipbuilding to build coastal harbors, warships and transports. Ships can carry armies or settlers. Recruit soldiers in military buildings, move your army on the world map, and issue individual orders in combat. Capture rival cities to win.',
 '<b>7. Roads and Trade.</b> Roads emerge where armies, residents and caravans repeatedly travel. More traffic makes roads stronger and faster. Carts improve trade shipments. Later, rail stations and airports accelerate transport.',
 '<b>8. Defenses.</b> Research defensive structures for wooden walls and watchtowers, and stone fortifications for masonry walls and towers. Towers require one fully assigned worker. Station real soldiers from a stopped army on each wall; they stay behind when the army departs. Medieval siege machines can break fortified walls and gates.'
];
const specialSelectors=[
 ['#atlaspanel > .atlas-legend p:nth-of-type(2)','Your scout can automatically explore the unknown, visit villages and ruins, and receive a one-time reward on the first visit.'],
 ['#researchpanel .research-explanation','Choose one topic to research. Prerequisites unlock new branches; changing topics preserves progress. Queue up to four further discoveries. Your cities and staffed science buildings produce research points. Discovery bonuses give an extra 35%. Game time pauses in menus and while the tab is hidden.'],
 ['#citypane-build > .muted','Your whole city territory is one construction area. Choose a building and place it on any owned detail tile. All materials, builders and the queue are shared.'],
 ['#citypane-workers > .muted','Allocate workers in increments of 0.25. Resource collection and production take three times longer; building and training times are unchanged.']
];
const originalHTML=new Map();
export const currentLanguage=()=>language;
export function translateEstonian(v){
 if(typeof v!=='string'||language!=='en'||!v)return v;
 const whole=english.get(v);if(whole!==undefined)return whole;
 const match=/^(\s*)(.*?)(\s*)$/s.exec(v);
 if(match){const full=english.get(match[2]);if(full!==undefined)return match[1]+full+match[3]}
 let out=v;
 for(const item of sorted)if(out.includes(item.source))out=out.replace(item.re,()=>item.target);
 return out;
}
function includeField(o,field){if(o&&typeof o[field]==='string')binding.push({o,field,et:o[field]})}
function captureCollection(collection,fields=['name']){
 if(Array.isArray(collection)){for(const item of collection)if(typeof item==='string')continue;else for(const field of fields)includeField(item,field)}
 else if(collection)for(const obj of Object.values(collection))for(const field of fields)includeField(obj,field);
}
function updateDefinitions(){for(const {o,field,et}of binding)o[field]=language==='en'?translateEstonian(et):et;
 if(language==='en')for(const [id,englishDescription] of Object.entries(TECH_UNLOCKS_EN_V120)){if(techReference?.[id])techReference[id].unlocks=englishDescription;}
}
let techReference=null;
function saveOriginalHTML(){
 for(const [selector]of specialSelectors){const el=document.querySelector(selector);if(el&&!originalHTML.has(el))originalHTML.set(el,el.innerHTML)}
 for(const p of document.querySelectorAll('#help > p'))if(!helpOriginal.has(p))helpOriginal.set(p,p.innerHTML);
}
function updateSpecialCopy(){
 saveOriginalHTML();
 for(const [selector,translation]of specialSelectors){
  const el=document.querySelector(selector);if(!el)continue;
  const et=originalHTML.get(el);if(et===undefined)continue;
  const desired=language==='en'?translation:et;
  if(el.innerHTML!==desired)el.innerHTML=desired;
 }
 const help=[...document.querySelectorAll('#help > p')];
 for(let i=0;i<help.length;i++){
  const el=help[i],et=helpOriginal.get(el),desired=language==='en'?HELP_EN[i]||et:et;
  if(desired!==undefined&&el.innerHTML!==desired)el.innerHTML=desired;
 }
}
function skip(node){const p=node.parentElement;return !p||!!p.closest('script,style,#help > p')||!!p.closest('#language,#menulanguage')}
function translateNode(node){
 if(skip(node))return;
 const old=texts.get(node),now=node.nodeValue??'';
 const et=old&&now===old.en?old.et:now;
 const en=language==='en'?translateEstonian(et):et;
 texts.set(node,{et,en});
 if(now!==en)node.nodeValue=en;
}
const visibleAttributes=['title','aria-label','placeholder'];
function translateAttributes(el){
 if(!el?.getAttribute||el.closest?.('#language,#menulanguage'))return;
 let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved)}
 for(const key of visibleAttributes)if(el.hasAttribute(key)){
  const now=el.getAttribute(key),old=saved[key],et=old&&now===old.en?old.et:now,
  en=language==='en'?translateEstonian(et):et;
  saved[key]={et,en};if(now!==en)el.setAttribute(key,en);
 }
}
function visit(node){
 if(node.nodeType===3){translateNode(node);return}
 if(node.nodeType!==1)return;
 if(node.matches?.('script,style'))return;
 translateAttributes(node);
 const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let child;while((child=walker.nextNode())){
  if(child.nodeType===3)translateNode(child);
  else translateAttributes(child);
 }
}
function renderAll(){
 // Snapshot original Estonian paragraphs before the first English DOM pass.
 saveOriginalHTML();
 if(document.body)visit(document.body);
 updateSpecialCopy();
 document.documentElement.lang=language;
 document.title=language==='en'?'Kingdoms V'+buildVersion+' – Real-Time Strategy':'Kuningriigid V'+buildVersion+' – reaalajastrateegia';
 for(const id of ['language','menulanguage']){const c=document.getElementById(id);if(c)c.value=language}
}
export function changeLanguage(next,{notify=true}={}){
 if(next!=='en')next='en';
 language=next;try{localStorage.setItem('kingdoms-language',next)}catch{}
 updateDefinitions();renderAll();
 if(notify&&typeof notifyChange==='function')notifyChange();
}
let notifyChange=null;
export function initializeLocalization({BUILDINGS,TECHS,TROOPS,AGES,RESOURCE_NAMES,SHIPS,BASIC_JOBS,ERA_NAMES,onChange}){
 notifyChange=onChange;
 techReference=TECHS;
 captureCollection(BUILDINGS);captureCollection(TECHS,['name','unlocks']);captureCollection(TROOPS);
 captureCollection(AGES);captureCollection(SHIPS);captureCollection(BASIC_JOBS);
 if(Array.isArray(ERA_NAMES))for(let i=0;i<ERA_NAMES.length;i++){const ref=ERA_NAMES,field=i;binding.push({o:ref,field,et:ref[i]})}
 for(const key of Object.keys(RESOURCE_NAMES||{}))binding.push({o:RESOURCE_NAMES,field:key,et:RESOURCE_NAMES[key]});
 // V120 English-only release. Previously saved Estonian UI preferences do not override it.
 changeLanguage('en',{notify:false});
 for(const id of ['language','menulanguage']){
  const select=document.getElementById(id);
  if(!select)continue;
  select.value=language;
  select.addEventListener('change',()=>changeLanguage(select.value));
 }
 observer?.disconnect();
 observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==='characterData')translateNode(change.target);
   else if(change.type==='attributes')translateAttributes(change.target);
   else for(const node of change.addedNodes)visit(node);
  }
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:visibleAttributes});
}
