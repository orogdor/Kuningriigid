import {BUILD_TECH,UNIT_TECH} from './research.js';
import {paintedTechSrc} from './research-art-v304.js';
const buildings=new Set(['hall','house','lumber','forester','quarry','hunter','well','farm','pasture','cellar','mason','watchtower','stonewall','barracks']);
const units=new Set(['scout','settler','axeman','spearman','slinger','worker']);
export function catalogArtSrc(type,unit){
 return type?(buildings.has(type)?`ui-art-v263/bld_${type}.webp`:paintedTechSrc(BUILD_TECH[type]||'settlement')):
  units.has(unit)?`ui-art-v263/unit_${unit}.webp`:paintedTechSrc(UNIT_TECH[unit]||'warfare');
}
export function addCatalogPicture(card,type,unit){
 if(!window.KINGDOMS_UI304||card.querySelector('.v304-catalog-picture'))return;
 const src=catalogArtSrc(type,unit);if(!src)return;
 const img=document.createElement('img');img.className='v304-catalog-picture';img.alt='';img.src=src;img.draggable=false;img.loading='lazy';
 card.classList.add('v304-illustrated-card');card.prepend(img);
}
