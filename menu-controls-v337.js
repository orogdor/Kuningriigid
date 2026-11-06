// V337: start-menu controls remain usable before importing the simulation.
import {loadGraphicsSettingsV226,saveGraphicsSettingsV226} from './graphics-settings-v226.js';
const levels=[70,80,90,100,110,125,150];
export function applyUiScaleV337(value){
 const scale=levels.includes(Number(value))?Number(value):100,factor=scale/100;
 document.documentElement.style.setProperty('--ui-scale-v337',String(factor));
 const card=document.querySelector('#startmenu .menu-card');if(card)card.style.zoom=factor;
 for(const id of ['citypanel','tools','atlaspanel','commandhud','researchpanel','journalpanel','help','hud-explore-panel','hud-tile-resources','building-inspector','v264-listpanel']){
  const el=document.getElementById(id);if(!el)continue;
  // Painted HUD uses --hud-u. Do not zoom an embedded card twice.
  if(el.closest('#v304-hud')){el.style.zoom='';continue;}
  el.style.zoom=factor;
 }
}
function hint(message){
 const element=document.getElementById('menu-exit-note-v337');
 if(element){element.textContent=message;element.hidden=false;}
}
function boot(){
 const selector=document.getElementById('menu-ui-scale-v337'),quit=document.getElementById('menu-exit-v337');
 if(!selector||!quit||selector.dataset.bound==='1')return;
 selector.dataset.bound='1';
 const current=loadGraphicsSettingsV226(),scale=levels.includes(current.uiScale)?current.uiScale:100;
 selector.value=String(scale);applyUiScaleV337(scale);
 selector.addEventListener('change',()=>{
  const value=Number(selector.value);if(!levels.includes(value))return;
  const config=loadGraphicsSettingsV226();config.uiScale=value;saveGraphicsSettingsV226(config);
  const graphicsSelector=document.getElementById('graphics-v226-uiScale');
  if(graphicsSelector)graphicsSelector.value=String(value);
  window.dispatchEvent(new CustomEvent('kingdoms-ui-scale-change-v337',{detail:value}));
 });
 window.addEventListener('kingdoms-ui-scale-change-v337',event=>{
  const value=Number(event.detail);if(!levels.includes(value))return;
  selector.value=String(value);applyUiScaleV337(value);
 });
 quit.addEventListener('click',async()=>{
  const android=globalThis.KuningriigidNative,desktop=globalThis.KuningriigidWindow;
  if(typeof android?.requestExit==='function'){android.requestExit();return;}
  if(typeof desktop?.quit==='function'){try{await desktop.quit();return;}catch{}}
  if(android){hint('Sulgemiseks vajuta telefoni Tagasi-nuppu. Menüü sulgemisnupp vajab uuendatud APK-d.');return;}
  if(desktop){try{window.close();}catch{}hint('Sulge mäng Windowsi akna X-nupuga. Menüü sulgemisnupp vajab uuendatud EXE-d.');return;}
  try{window.close();}catch{}
  hint('Brauser ei luba seda vahelehte automaatselt sulgeda. Sulge mäng brauseri vahelehe X-nupuga.');
 });
}
// The renderer's graphics settings are also imported by headless Node.js regression tests.
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
