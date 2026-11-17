// V354: the painted command cards carry their caption in the picture. In
// English the cards use copies with English captions (ui-art-v306/card_*_en.webp).
import {currentLanguage} from './localization.js?v=155a';
function apply(){
 const english=currentLanguage()==='en';
 for(const card of document.querySelectorAll('.v304-command')){
  const picture=card.querySelector('img'),action=card.dataset.action;if(!picture||!action)continue;
  const wanted='ui-art-v306/card_'+action+(english?'_en':'')+'.webp';
  if(!picture.getAttribute('src')?.startsWith('ui-art-v306/'))continue;
  if(picture.getAttribute('src')!==wanted)picture.setAttribute('src',wanted);
 }
}
export function startEnglishCardsV354(){
 apply();
 // The HUD builds the cards after start-up and the language can change later.
 setInterval(apply,1500);
}
