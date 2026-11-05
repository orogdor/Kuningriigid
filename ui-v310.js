/* Same measured card geometry and generated gold/parchment skin for every
   footer choice. The original buttons, nested actions and callbacks survive. */
(()=>{
 'use strict';
 if(!window.KINGDOMS_UI304)return;
 function boot(){
  const root=document.getElementById('v304-hud'),menu=document.getElementById('v309-menu'),dock=root?.querySelector('.v304-dock');
  if(!menu||!dock)return;
  function measure(){
   // A hidden main dock still supplies the exact reference dimensions after
   // rotation. Measure it invisibly in the same synchronous layout pass.
   const hidden=dock.hidden,visibility=dock.style.visibility;
   if(hidden){dock.style.visibility='hidden';dock.hidden=false;}
   const card=dock.querySelector('.v304-command'),r=card?.getBoundingClientRect(),base=root.getBoundingClientRect();
   if(r?.width&&r.height){
    menu.style.setProperty('--choice-w',r.width+'px');menu.style.setProperty('--choice-h',r.height+'px');
    menu.style.setProperty('--choice-gap',getComputedStyle(dock).columnGap);
    menu.style.bottom=(base.bottom-r.bottom)+'px';
   }
   if(hidden){dock.hidden=true;dock.style.visibility=visibility;}
  }
  const select='.v309-back,#tray>button,#tray>label,.v264-row,.v276-recruit,.v276-title,.v276-offers>button,.v304-faction-controls>button,#journalentries>p,.v264-empty';
  function paint(card){
   if(menu.dataset.kind==='trade'||menu.dataset.kind==='diplomacy')return;
   let visual=card.querySelector(':scope > .v310-visual'),caption=card.querySelector(':scope > .v310-caption');
   // The catalogue decorator may attach the correct era image after us.
   const actual=card.querySelector('img.v304-catalog-picture')||card.querySelector(':scope > img');
   if(visual){if(actual&&!visual.contains(actual)){visual.replaceChildren(actual);actual.classList.add('v310-image');}return;}
   const original=card.textContent.trim();if(!card.title)card.title=card.getAttribute('aria-label')||original;
   const faction=card.closest('.v304-faction')?.querySelector(':scope > strong')?.textContent;
   const text=(card.getAttribute('aria-label')||original).toLowerCase();
   const art=card.matches('.v309-back')?'cmd_map':card.closest('#tray')?(card.matches('label')?'cmd_army':'cmd_build'):card.closest('#journalentries')?'cmd_research':card.closest('.v304-faction')?(/sõda|war/.test(text)?'cmd_stop':'cmd_city'):card.closest('.v276-offers,.v276-title')?'res_gold':card.matches('.v276-recruit')?'cmd_army':menu.dataset.kind==='armies'?'cmd_army':'cmd_city';
   visual=document.createElement('span');visual.className='v310-visual';
   const image=actual||document.createElement('img');if(!actual){image.src='ui-art-v263/'+art+'.webp';image.alt='';image.draggable=false;}image.classList.add('v310-image');visual.append(image);
   caption=document.createElement('span');caption.className='v310-caption';
   for(const n of [...card.childNodes])caption.append(n);
   if(faction){const name=document.createElement('strong');name.className='v310-faction-name';name.textContent=faction;caption.prepend(name);card.title=faction+' · '+original;}
   card.append(visual,caption);card.classList.add('v310-card');
  }
  function filters(){
   const tools=menu.querySelector('#buildcatalogtools');if(tools&&!tools.classList.contains('v310-card'))tools.classList.add('v310-card','v310-build-filter');
   const search=menu.querySelector('#buildsearch');if(search&&!search.placeholder)search.placeholder=(document.documentElement.lang||'en').startsWith('et')?'Otsi…':'Search…';
   const input=menu.querySelector('#v264-listpanel>input');
   if(input&&menu.dataset.kind!=='trade'){
    const filter=document.createElement('div');filter.className='v310-filter v310-card';
    const visual=document.createElement('span');visual.className='v310-visual';
    const im=document.createElement('img');im.className='v310-image';im.src='ui-art-v263/cmd_explore.webp';im.alt='';visual.append(im);
    const caption=document.createElement('span');caption.className='v310-caption';input.before(filter);caption.append(input);filter.append(visual,caption);
   }
  }
  function decorate(){filters();for(const card of menu.querySelectorAll(select))paint(card);}
  measure();decorate();
  new MutationObserver(decorate).observe(menu,{childList:true,subtree:true});
  // Opening/closing also changes whether the source cards are measurable.
  new MutationObserver(measure).observe(menu,{attributes:true,attributeFilter:['hidden']});
  addEventListener('resize',()=>{measure();requestAnimationFrame(measure);},{passive:true});
  new ResizeObserver(measure).observe(root);
  window.KuningriigidUIV310={measure};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
