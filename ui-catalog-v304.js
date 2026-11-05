// The existing research gates also supply appropriate art for building cards.
import {BUILD_TECH,UNIT_TECH} from './research.js';
import {paintedTechSrc} from './research-art-v304.js';
const buildingArt=new Set(['hall','house','lumber','forester','quarry','hunter','well','farm','pasture','cellar','mason','watchtower','stonewall','barracks']);
const unitArt=new Set(['scout','settler','axeman','spearman','slinger','worker']);
function decorate(){
 if(!window.KINGDOMS_UI304)return;
 for(const card of document.querySelectorAll('#tray button[data-building],#tray button[data-unit]')){
  if(card.querySelector('.v304-catalog-picture'))continue;
  const type=card.dataset.building,unit=card.dataset.unit;
  const src=type?(buildingArt.has(type)?'ui-art-v263/bld_'+type+'.webp':paintedTechSrc(BUILD_TECH[type]||'settlement')):
   unitArt.has(unit)?'ui-art-v263/unit_'+unit+'.webp':paintedTechSrc(UNIT_TECH[unit]||'warfare');
  if(!src)continue;
  const img=document.createElement('img');img.className='v304-catalog-picture';img.alt='';img.src=src;img.draggable=false;img.loading='lazy';
  card.classList.add('v304-illustrated-card');card.prepend(img);
 }
}
const tray=document.getElementById('tray');
if(tray){new MutationObserver(decorate).observe(tray,{childList:true});decorate();}
