/* V298 — one authoritative responsive layout for the illustrated world HUD.
 * Existing V291 painted assets and real game actions are preserved. No extra
 * icon pictures are stacked over controls already painted inside the art.
 * All geometry, including transparent hit targets, comes from this file.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const A=(root,selector)=>root?.querySelector(selector);
 const N=(root,selector)=>[...(root?.querySelectorAll(selector)||[])];
 const names=['research_compass','research_tools','research_gate','research_ship','research_city'];
 const researchRects=[[2,152,53,56],[42,160,58,61],[84,159,55,63],[123,152,55,59],[163,149,47,54]];
 const mapRects={map_zoom_in:[211,39,61,62],map_camera:[234,88,67,59],map_show:[232,144,70,67]};
 const unitRects={cmd_attack:[20,64,68,68],cmd_move:[83,24,69,69],cmd_defend:[20,129,68,68],cmd_city:[82,128,71,69]};
 const geometry=['left','top','right','bottom','width','height','display'];
 let root,frame=0,managed=false,lastMode='',lastW=0,lastH=0;
 const set=(node,k,v)=>node?.style.setProperty(k,v,'important');
 function area(node,x,y,w,h,display='block'){
  if(!node)return;
  set(node,'position','absolute');
  set(node,'left',Math.round(x*100)/100+'px');
  set(node,'top',Math.round(y*100)/100+'px');
  set(node,'right','auto');set(node,'bottom','auto');
  set(node,'width',Math.max(0,Math.round(w*100)/100)+'px');
  set(node,'height',Math.max(0,Math.round(h*100)/100)+'px');
  set(node,'display',display);
 }
 function hide(node){if(node)set(node,'display','none');}
 function release(){
  if(!managed)return;
  managed=false;root?.classList.remove('v298-managed','v298-landscape','v298-portrait');
  for(const node of N(root,'[data-x],.v291-command-dock,.v291-card,.v291-mobile-counters,.v291-mobile-toolbar,.v292-zoom-out')){
   for(const property of [...geometry,'position','grid-template-columns','grid-template-rows','gap','justify-content','align-items'])node.style.removeProperty(property);
  }
  // V291 owns the desktop master; restore its normal responsive positions.
  window.dispatchEvent(new Event('resize'));
 }
 function frameHit(button,frameNode,baseW,baseH,rect){
  if(!button||!frameNode||getComputedStyle(frameNode).display==='none')return;
  const box=frameNode.getBoundingClientRect();
  if(!box.width||!box.height)return;
  area(button,box.left+box.width*rect[0]/baseW,box.top+box.height*rect[1]/baseH,
    box.width*rect[2]/baseW,box.height*rect[3]/baseH);
 }
 function setHotspots(){
  if(!root)return;
  const research=A(root,'.v291-research-background');
  frameHit(A(root,'.v291-research-main'),research,208,286,[24,4,173,153]);
  names.forEach((id,i)=>frameHit(A(root,'[data-art="'+id+'"]'),research,208,286,researchRects[i]));
  const mini=A(root,'.v291-minimap-frame');
  for(const [id,r] of Object.entries(mapRects))frameHit(A(root,'[data-art="'+id+'"]'),mini,311,238,r);
  const select=A(root,'.v291-selection-frame');
  for(const [id,r] of Object.entries(unitRects))frameHit(A(root,'[data-art="'+id+'"]'),select,379,234,r);
  const more=A(root,'.v291-unit-info');
  frameHit(more,select,379,234,[142,12,44,43]);
 }
 function mobileLayout(){
  const w=window.innerWidth,h=window.innerHeight;
  const portrait=h>w,land=!portrait;
  const coarse=window.matchMedia?.('(pointer: coarse)').matches||false;
  const small=coarse||w<1000||h<640;
  if(!document.body.classList.contains('v291-active')||!small){release();return;}
  managed=true;root.classList.add('v298-managed');
  root.classList.toggle('v298-landscape',land);
  root.classList.toggle('v298-portrait',portrait);
  const top=land?Math.max(30,Math.min(44,h*.072)):Math.max(35,Math.min(47,w*.115));
  const second=portrait?Math.max(26,Math.min(35,w*.085)):0;
  const pauseW=top;
  const brandW=portrait?Math.min(w*.55,top*3.15):Math.min(w*.19,top*3.9);
  const worldW=portrait?Math.max(91,w-brandW-pauseW-3):Math.max(102,Math.min(216,w*.19));
  const date=A(root,'.v291-date'),pause=A(root,'.v291-pause'),play=A(root,'.v291-play');
  const paused=!!window.kingdomsUiV288?.snapshot?.()?.paused;
  area(A(root,'.v291-brand'),0,0,brandW,top);
  area(A(root,'.v291-world'),w-worldW-pauseW,0,worldW,top);
  area(pause,w-pauseW,0,pauseW,top,paused?'none':'block');
  area(play,w-pauseW,0,pauseW,top,paused?'block':'none');
  hide(A(root,'.v291-speed'));hide(date);
  N(root,'.v291-ledger').forEach(hide);
  const counters=A(root,'.v291-mobile-counters');
  if(portrait)area(counters,0,top,w,second,'flex');
  else area(counters,brandW,0,Math.max(0,w-brandW-worldW-pauseW),top,'flex');
  const cards=N(root,'.v291-card');
  const dock=A(root,'.v291-command-dock');
  const wood=A(root,'.v291-wood'),strip=A(root,'.v291-dock-background');
  area(wood,0,h-7,w,7);
  area(strip,0,h-13,w,13);
  const research=A(root,'.v291-research-background'),mini=A(root,'.v291-minimap-frame'),selected=A(root,'.v291-selection-frame');
  const toolbar=A(root,'.v291-mobile-toolbar');
  if(land){
   const researchW=Math.max(91,Math.min(127,h*.235));
   area(research,3,top+8,researchW,researchW*286/208);
   const mapW=Math.max(107,Math.min(166,h*.30));
   const selectedW=Math.max(129,Math.min(189,h*.345));
   area(mini,3,h-mapW*238/311-4,mapW,mapW*238/311);
   area(selected,w-selectedW-3,h-selectedW*234/379-4,selectedW,selectedW*234/379);
   hide(toolbar);
   const gap=Math.max(2,Math.min(6,w*.004));
   const available=w-mapW-selectedW-23;
   const cardH=Math.max(36,Math.min(h*.157,Math.max(35,(available-5*gap)/6)*155/162));
   const cardW=cardH*162/155;
   const groupW=6*cardW+5*gap;
   area(dock,(w-groupW)/2,h-cardH-6,groupW,cardH,'flex');
   set(dock,'gap',gap+'px');set(dock,'justify-content','center');
   for(const card of cards){
    set(card,'position','relative');set(card,'left','auto');set(card,'top','auto');
    set(card,'right','auto');set(card,'bottom','auto');
    set(card,'width',cardW+'px');set(card,'height',cardH+'px');set(card,'display','block');
   }
  }else{
   const drawerTop=top+second+11;
   const showR=root.classList.contains('v291-show-research');
   const showM=root.classList.contains('v291-show-map');
   const showS=root.classList.contains('v291-show-units');
   const rw=Math.min(w*.43,175),mw=Math.min(w*.55,225),sw=Math.min(w*.67,260);
   area(research,5,drawerTop,rw,rw*286/208,showR?'block':'none');
   area(mini,5,drawerTop,mw,mw*238/311,showM?'block':'none');
   area(selected,w-sw-5,drawerTop,sw,sw*234/379,showS?'block':'none');
   const toggleSize=Math.max(31,Math.min(39,w*.092));
   area(toolbar,w-3*toggleSize-14,drawerTop,3*toggleSize+9,toggleSize,'flex');
   const gap=4,colW=(w-16-2*gap)/3,rowH=Math.min(98,Math.max(66,w*.244));
   area(dock,8,h-2*rowH-gap-8,w-16,2*rowH+gap,'grid');
   set(dock,'grid-template-columns','repeat(3,minmax(0,1fr))');
   set(dock,'grid-template-rows','repeat(2,minmax(0,1fr))');
   set(dock,'gap',gap+'px');
   for(const card of cards){
    set(card,'position','relative');set(card,'left','auto');set(card,'top','auto');
    set(card,'right','auto');set(card,'bottom','auto');
    set(card,'width','100%');set(card,'height','100%');set(card,'display','block');
   }
  }
  // The minimap/selection/research artwork already CONTAINS round controls.
  // Their real buttons are transparent hitboxes over those exact painted icons.
  const rVisible=land||root.classList.contains('v291-show-research');
  const mVisible=land||root.classList.contains('v291-show-map');
  const sVisible=land||root.classList.contains('v291-show-units');
  if(!rVisible){hide(A(root,'.v291-research-main'));N(root,'.v291-research-queue').forEach(hide);}
  if(!mVisible)N(root,'.v291-minimap-button').forEach(hide);
  if(!sVisible){N(root,'.v291-unit-button').forEach(hide);hide(A(root,'.v291-unit-info'));}
  const zoom=A(root,'.v292-zoom-out');
  if(zoom){
   if(mVisible){
    const b=mini.getBoundingClientRect();
    area(zoom,b.left+b.width*.72,b.top+b.height*.06,Math.max(23,b.width*.18),Math.max(23,b.width*.18));
   }else hide(zoom);
  }
  lastMode=portrait?'portrait':'landscape';lastW=w;lastH=h;
 }
 function update(){
  frame=0;
  if(!root)return;
  mobileLayout();
  setHotspots();
  const chosen=A(root,'.v291-selected-text');
  if(chosen&&root.classList.contains('v298-managed')){
   set(chosen,'font-size',Math.max(10,Math.min(14,(A(root,'.v291-selection-frame')?.getBoundingClientRect().width||155)*.07))+'px');
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function boot(){
  root=$('v291-hud');if(!root)return;
  schedule();
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  // Game pause/resume can change independent of a click on this HUD.
  setInterval(()=>{if(document.body.classList.contains('v291-active'))schedule();},1200);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
