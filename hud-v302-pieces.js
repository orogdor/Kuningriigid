/* V302 independent, freshly painted UI pieces: no cuts from a single screenshot.
   V301 remains an opt-out fallback; map, saves and gameplay are untouched. */
(()=>{
 'use strict';
 const BASE_W=1672,BASE_H=941;
 const parts=[
  ['header',[0,0,1672,78],false],
  ['research',[8,65,240,342],false],
  ['minimap',[0,611,343,318],true],
  ['dock',[346,752,944,143],true],
  ['selection',[1290,611,382,318],true]
 ];
 const $=s=>root?.querySelector(s);
 let root, elements=[],wasActive=false;
 const desktop=()=>innerWidth>=1000&&innerHeight>=640&&innerWidth>=innerHeight&&!(window.matchMedia?.('(pointer: coarse)').matches);
 const set=(el,property,value)=>el?.style.setProperty(property,value,'important');
 const place=(el,[x,y,w,h],scale,dx,oy=0)=>{
  if(!el)return;
  for(const [k,v] of Object.entries({position:'absolute',left:`${dx+x*scale}px`,top:`${oy+y*scale}px`,width:`${w*scale}px`,height:`${h*scale}px`}))set(el,k,v);
 };
 const clear=el=>{if(!el)return;for(const prop of ['position','left','top','width','height'])el.style.removeProperty(prop);};
 function controls(s,dx,dy){
  const adjusted=[
   ['.v291-research-background',[8,65,240,342],false],
   ['.v291-research-main',[40,90,157,146],false],
   ['.v291-minimap-frame',[0,611,343,318],true],
   ['.v291-selection-frame',[1290,611,382,318],true]
  ];
  const cardX=[357,513,668,824,980,1136];
  const card=[...root.querySelectorAll('.v291-card')];
  card.forEach((el,i)=>{if(i<6)adjusted.push([el,[cardX[i],766,137,115],true]);});
  for(const [selector,rect,bottom] of adjusted){const node=typeof selector==='string'?$(selector):selector;place(node,rect,s,dx,bottom?dy:0);}
  // Invisible genuine controls are aligned with the newly painted empty sockets.
  const mapButtons=[...root.querySelectorAll('.v291-minimap-button')];
  [[207,630,58,57],[271,684,58,57],[271,755,58,57]].forEach((p,i)=>place(mapButtons[i],p,s,dx,dy));
  const commandButtons=[...root.querySelectorAll('.v291-unit-button')];
  [[1311,695,68,62],[1412,634,66,61],[1311,770,68,62],[1510,631,66,61]].forEach((p,i)=>place(commandButtons[i],p,s,dx,dy));
  place($('.v291-unit-info'),[1319,635,50,50],s,dx,dy);
 }
 function update(){
  if(!root)return;
  const active=desktop();
  window.KuningriigidV302={active};
  root.classList.toggle('v302-pieces',active);
  if(!active){
   if(wasActive){for(const node of root.querySelectorAll('.v291-card,.v291-unit-button,.v291-minimap-button,.v291-unit-info,.v291-research-main,.v291-research-background,.v291-minimap-frame,.v291-selection-frame'))clear(node);}
   wasActive=false;return;
  }
  const s=Math.min(innerWidth/BASE_W,innerHeight/BASE_H);
  const dx=Math.max(0,(innerWidth-BASE_W*s)/2);
  const dy=Math.max(0,innerHeight-BASE_H*s);
  for(const [node,rect,bottom] of elements)place(node,rect,s,dx,bottom?dy:0);
  controls(s,dx,dy);
  root.style.setProperty('--v291-scale',String(s));
  wasActive=true;
 }
 function boot(){
  root=document.getElementById('v291-hud');if(!root)return;
  for(const [name,rect,bottom] of parts){
   const img=document.createElement('img');img.id='v302-'+name;img.className='v302-picture-part';
   img.src='ui-art-v302/'+name+'.webp?v=302a';img.alt='';img.draggable=false;
   img.setAttribute('aria-hidden','true');root.prepend(img);elements.push([img,rect,bottom]);
  }
  update();addEventListener('resize',update,{passive:true});
  addEventListener('orientationchange',update,{passive:true});
  window.visualViewport?.addEventListener('resize',update,{passive:true});
  // Legacy V298 layout may set inline coordinates; keep genuine hitboxes in sync.
  setInterval(()=>{if(document.body.classList.contains('v291-active'))update();},1250);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();