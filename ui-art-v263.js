// V263: puts the painted icons on the main buttons and building cards (see ui-art-v263.css).
// It strips the leading text glyph (⚒, ⚔, 🧭 …) of the listed buttons, adds a class that draws the image,
// and watches for re-renders. Nothing else in the UI changes.
const BUTTONS=["hud-build", "hud-army", "hud-city", "hud-explore", "maptoggle", "techtoggle", "pause", "commandmove", "commandattack", "commandstop", "selectarmy", "autoexplore", "opencity", "attackcity", "attackall", "foundcity"];
const GLYPH=/^[\s\u2190-\u2BFF\u2600-\u27BF\u2150-\u218F\u25A0-\u25FF\uFE0F\u{1F300}-\u{1FAFF}]+/u;
function strip(el){
 const t=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
 if(t&&GLYPH.test(t.textContent)){const rest=t.textContent.replace(GLYPH,'');if(rest.trim()||el.id==='pause'||el.id==='commandstop')t.textContent=rest;}
}
const PORTRAITS=new Set(['settler','scout','axeman','spearman','slinger']);
function portrait(){
 const hud=document.getElementById('commandhud');if(!hud)return;
 const kind=hud.dataset.unitKind||'',show=PORTRAITS.has(kind);let img=hud.querySelector(':scope > img.v263-portrait');
 if(show&&!img){img=document.createElement('img');img.className='v263-portrait';img.alt='';hud.prepend(img);}
 if(img){img.hidden=!show;if(show&&img.dataset.kind!==kind){img.dataset.kind=kind;img.src='ui-art-v263/unit_'+kind+'.webp';}}
 if(getComputedStyle(hud).position==='static')hud.style.position='relative';
 hud.classList.toggle('v263-has-portrait',show);
}
function decorate(){
 portrait();
 for(const id of BUTTONS){const el=document.getElementById(id);if(!el)continue;el.classList.add('v263-btn');strip(el);}
 for(const icon of document.querySelectorAll('.v121-build-card[data-building] .v121-card-icon:not(.v263-art)')){
  const type=icon.closest('[data-building]').dataset.building;if(ART_BUILDINGS.has(type))icon.classList.add('v263-art');}
}
const ART_BUILDINGS=new Set(["hall", "house", "lumber", "forester", "quarry", "hunter", "well", "farm", "pasture", "cellar", "mason", "watchtower", "stonewall", "barracks"]);
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer.disconnect();decorate();watch();});});
function watch(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-unit-kind']});}
export function startUiArtV263(){decorate();watch();}
if(typeof document!=='undefined')startUiArtV263();
