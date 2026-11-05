/* V292 mobile artwork adapters: keep all original game handlers unchanged. */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 const $=id=>document.getElementById(id);
 function addZoomOut(){
  const root=$('v291-hud');
  if(!root||root.querySelector('.v292-zoom-out'))return;
  const b=document.createElement('button');
  b.type='button';b.className='v291-element v291-art-button v292-zoom-out';
  b.title='Vähenda / Zoom out';b.setAttribute('aria-label',b.title);
  const img=document.createElement('img');
  img.src='ui-art-v290/map_zoom_out.webp';img.alt='';img.draggable=false;
  b.append(img);
  b.addEventListener('click',()=>{
   const original=$('zout');if(original&&!original.disabled)original.click();
  });
  root.append(b);
 }
 function wireMobileCounters(){
  const root=$('v291-hud');if(!root)return;
  const groups={gold:'lux',bread:'food',stone:'build'};
  for(const node of root.querySelectorAll('.v291-mobile-counter')){
   const kind=node.dataset.resource;
   node.tabIndex=0;node.setAttribute('role','button');
   node.setAttribute('aria-label',kind==='science'?'Uurimus / Research':kind==='population'?'Linnad / Cities':kind);
   const open=e=>{
    e.stopPropagation();
    if(kind==='science'){const real=window.openKuningriigidResearchV296;if(typeof real==='function')real();else $('techtoggle')?.click();}
    else if(kind==='population')$('hud-city')?.click();
    else if(groups[kind])document.querySelector('#resources .v264-chip[data-group="'+groups[kind]+'"]')?.click();
   };
   node.addEventListener('click',open);
   node.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}
   });
  }
 }
 function start(){
  addZoomOut();wireMobileCounters();
  window.addEventListener('orientationchange',()=>{
   $('v291-hud')?.classList.remove('v291-show-research','v291-show-map','v291-show-units');
  },{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();