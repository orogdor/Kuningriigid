/* Bottom navigation reuses the live game panels and their original handlers.
   Moving DOM nodes keeps construction rules, prices, research gates and trades
   in the simulation; this module owns only where the menu is shown. */
(()=>{
 'use strict';
 if(!window.KINGDOMS_UI304)return;
 const $=id=>document.getElementById(id);
 const tr=(et,en)=>(document.documentElement.lang||'en').startsWith('et')?et:en;
 function boot(){
  const root=$('v304-hud'),dock=root?.querySelector('.v304-dock');if(!dock)return;
  document.body.classList.add('v309-active');
  let active=null,origin=null,modal=null,role=null,kind='',bypass=false,opening=false,invoker=null;
  const menu=document.createElement('section');menu.id='v309-menu';menu.hidden=true;menu.setAttribute('aria-label',tr('Alumine valikumenüü','Bottom selection menu'));
  const back=document.createElement('button');back.type='button';back.className='v309-back';
  const picture=document.createElement('img');picture.src='ui-art-v263/cmd_map.webp';picture.alt='';picture.draggable=false;
  const caption=document.createElement('span');caption.textContent=tr('← Tagasi','← Back');back.append(picture,caption);
  back.setAttribute('aria-label',tr('Tagasi põhivalikusse','Back to main choices'));
  const content=document.createElement('div');content.className='v309-content';menu.append(back,content);root.append(menu);
  const observer=new MutationObserver(()=>{
   if(opening||!active)return;
   if(active.hidden){
    // Army recruitment and opening a city switch from the list into the live
    // city panel. Keep that next level in the same footer.
    const city=$('citypanel');
    if(active.id==='v264-listpanel'&&city&&!city.hidden){mount(city,kind==='armies'?'recruit':'city');return;}
    home(false);
   }
  });
  function release(){
   observer.disconnect();if(!active)return;
   active.hidden=true;active.classList.remove('v309-embedded');
   if(modal===null)active.removeAttribute('aria-modal');else active.setAttribute('aria-modal',modal);
   if(role===null)active.removeAttribute('role');else active.setAttribute('role',role);
   if(origin?.parentNode)origin.replaceWith(active);
   active=null;origin=null;
  }
  function home(focus=true){
   release();window.uiListsV264?.close?.();
   kind='';menu.hidden=true;dock.hidden=false;root.classList.remove('v309-submenu');delete menu.dataset.kind;
   document.body.classList.remove('v304-blocking','hud-city-open','hud-queue-open');
   window.KuningriigidUIV304?.update();if(focus)invoker?.focus();
  }
  function mount(panel,nextKind){
   release();active=panel;kind=nextKind;origin=document.createComment('V309 live panel home');
   panel.before(origin);modal=panel.getAttribute('aria-modal');role=panel.getAttribute('role');
   panel.classList.add('v309-embedded');panel.setAttribute('aria-modal','false');panel.setAttribute('role','region');
   content.replaceChildren(panel);panel.hidden=false;menu.dataset.kind=kind;menu.hidden=false;dock.hidden=true;root.classList.add('v309-submenu');
   document.body.classList.remove('v304-blocking');
   observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
   window.KuningriigidUIV304?.update();
  }
  function open(card){
   const next=card.dataset.action;home(false);invoker=card;opening=true;
   // Let the existing card run once, then embed the panel it produced.
   bypass=true;try{card.click();}finally{bypass=false;opening=false;}
   const id={cities:'v264-listpanel',build:'citypanel',armies:'v264-listpanel',trade:'v264-listpanel',diplomacy:'v304-diplomacy',journal:'journalpanel'}[next];
   let panel=$(id);
   if(next==='journal'&&panel&&!panel.hidden){const journal=panel.querySelector('.journal-window');if(journal){panel.hidden=true;panel=journal;panel.hidden=false;}}
   if(panel&&!panel.hidden){mount(panel,next);back.focus();}
   // No city yet / no available command: preserve the original game feedback
   // and the main choices rather than inventing a building catalogue.
  }
  dock.addEventListener('click',e=>{
   const card=e.target.closest('.v304-command');if(!card||bypass)return;
   e.preventDefault();e.stopImmediatePropagation();open(card);
  },true);
  back.onclick=()=>home();
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&active){e.preventDefault();e.stopImmediatePropagation();home();}
  },true);
  // A city/build tab can change as a result of a live menu command. It stays
  // embedded; there is no cloned list that can become stale after a purchase.
  content.addEventListener('click',e=>{
   if(e.target.closest('#closejournal,.v264-close,.v304-close,#hud-city-collapse'))queueMicrotask(()=>home());
  });
  // The simulation rebuilds the construction buttons as prices and resources
  // change. Keep the player's place in the horizontal catalogue through that.
  const tray=$('tray');let trayScroll=0;
  const describe=()=>{for(const b of tray?.querySelectorAll('button')||[])b.title=b.getAttribute('aria-label')||b.textContent.trim();};
  if(tray){
   tray.addEventListener('scroll',()=>{trayScroll=tray.scrollLeft;},{passive:true});
   new MutationObserver(()=>{
    describe();if(active?.id==='citypanel')tray.scrollLeft=trayScroll;
   }).observe(tray,{childList:true});describe();
   $('buildsearch')?.addEventListener('input',()=>{trayScroll=0;tray.scrollLeft=0;},true);
   $('buildcategories')?.addEventListener('click',()=>{trayScroll=0;tray.scrollLeft=0;},true);
  }
  // Context commands in the right portrait use the same live city controls.
  // Route them too, so hiding the automatic city popup never hides a command
  // the player deliberately requested for a selected city or building.
  function route(targets){
   let panel,nextKind;
   if(targets.some(id=>['hud-build','hud-city','citytab-info','citytab-workers'].includes(id))){
    panel=$('citypanel');nextKind=targets.includes('hud-build')?'build':'city';
    if(!panel||panel.hidden){panel=$('v264-listpanel');nextKind='cities';}
   }else if(targets.some(id=>['hud-army','hud-trade-v276'].includes(id))){
    panel=$('v264-listpanel');nextKind=targets.includes('hud-army')?'armies':'trade';
   }
   if(panel&&!panel.hidden&&panel!==active){invoker=document.activeElement;mount(panel,nextKind);back.focus();}
  }
  window.KuningriigidUIV309={home,route,get kind(){return kind;}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
