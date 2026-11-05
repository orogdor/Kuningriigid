/* Visible paging controls for the live construction tray. */
(()=>{
 'use strict';
 if(!window.KINGDOMS_UI304)return;
 function boot(){
  const menu=document.getElementById('v309-menu'),tray=document.getElementById('tray');
  if(!menu||!tray)return;
  const controls=document.createElement('div');controls.className='v313-build-scroll';
  const make=(direction,et,en)=>{
   const button=document.createElement('button');button.type='button';button.className='v313-scroll-'+direction;
   button.textContent=direction==='prev'?'‹':'›';button.setAttribute('aria-label',(document.documentElement.lang||'en').startsWith('et')?et:en);
   button.title=button.getAttribute('aria-label');
   button.addEventListener('click',()=>tray.scrollBy({left:(direction==='prev'?-1:1)*Math.max(tray.clientWidth*.8,120),behavior:'smooth'}));
   return button;
  };
  const prev=make('prev','Eelmised ehitised','Previous buildings'),next=make('next','Järgmised ehitised','Next buildings');
  controls.append(prev,next);menu.append(controls);
  let scheduled=false;
  function update(){scheduled=false;controls.hidden=menu.hidden||menu.dataset.kind!=='build'||tray.scrollWidth<=tray.clientWidth+2;prev.disabled=tray.scrollLeft<=2;next.disabled=tray.scrollLeft+tray.clientWidth>=tray.scrollWidth-2;}
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  tray.addEventListener('scroll',schedule,{passive:true});
  new MutationObserver(schedule).observe(tray,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(menu,{attributes:true,attributeFilter:['hidden','data-kind']});
  new ResizeObserver(schedule).observe(tray);addEventListener('resize',schedule,{passive:true});schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
