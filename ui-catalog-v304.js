// The existing research gates also supply appropriate art for building cards.
import {addCatalogPicture} from './catalog-art-v312.js';
function decorate(){
 if(!window.KINGDOMS_UI304)return;
 for(const card of document.querySelectorAll('#tray button[data-building],#tray button[data-unit]')){
  addCatalogPicture(card,card.dataset.building,card.dataset.unit);
 }
}
const tray=document.getElementById('tray');
if(tray){new MutationObserver(decorate).observe(tray,{childList:true});decorate();}
