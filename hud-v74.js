// V74: visual/UI state only. Does not touch Civilization state or save keys.
(()=>{
 const id=name=>document.getElementById(name),body=document.body;
 const mobile=()=>matchMedia('(max-width:900px), (max-height:580px)').matches;
 const mini=id('hud-minimap-toggle'),command=id('hud-command-toggle');
 const resource=id('hud-tile-resources');
 if(!mini||!command||!resource)return;
 function setMini(open){
  const visible=!!open&&mobile()&&body.classList.contains('atlas');
  body.classList.toggle('hud-mini-open',visible);
  mini.setAttribute('aria-expanded',String(visible));
  mini.setAttribute('aria-label',visible?'Peida minikaart':'Näita minikaarti');
  mini.title=visible?'Peida minikaart':'Näita minikaarti';
 }
 function setCommands(open){
  body.classList.toggle('hud-command-open',!!open&&mobile());
  command.setAttribute('aria-expanded',String(!!open&&mobile()));
  command.setAttribute('aria-label',open?'Peida üksuse käsud':'Näita kõiki üksuse käske');
 }
 mini.addEventListener('click',()=>setMini(!body.classList.contains('hud-mini-open')));
 command.addEventListener('click',()=>setCommands(!body.classList.contains('hud-command-open')));
 const setResource=()=>body.classList.toggle('hud-resource-open',mobile()&&!resource.hidden);
 new MutationObserver(setResource).observe(resource,{attributes:true,attributeFilter:['hidden']});
 setResource();
 const touchTabs=new Set(['hud-city','hud-army','hud-build']);
 let lastCityTab=null;
 // Capturing listener can close the already open sheet before the older click handler
 // unconditionally reopens it. Other actions keep their original game behaviour.
 document.addEventListener('click',event=>{
  if(!mobile())return;
  const button=event.target.closest?.('#tools button,#hud-map-details,#hud-close-map,#hud-cities-overview');
  if(!button)return;
  const name=button.id;
  if(name==='hud-map-details'||name==='hud-close-map'||name==='hud-cities-overview'){
   setMini(false);setCommands(false);return;
  }
  const sheetWasOpen=body.classList.contains('hud-city-open');
  if(touchTabs.has(name)&&sheetWasOpen&&lastCityTab===name){
   body.classList.remove('hud-city-open','hud-queue-open','hud-army-tab','hud-building-tab');
   lastCityTab=null;
   event.preventDefault();event.stopImmediatePropagation();return;
  }
  if(touchTabs.has(name)){
   lastCityTab=name;
   body.classList.toggle('hud-building-tab',name==='hud-build');
   body.classList.toggle('hud-army-tab',name==='hud-army');
   if(body.classList.contains('hud-explore-open'))id('hud-explore-close')?.click();
  }else{
   lastCityTab=null;
   body.classList.remove('hud-army-tab','hud-building-tab');
  }
  setMini(false);setCommands(false);
 },true);
 id('hud-city-collapse')?.addEventListener('click',()=>{
  lastCityTab=null;body.classList.remove('hud-building-tab','hud-army-tab');
 });
 // When closing the current resource tile on mobile, the zoom keys reappear.
 const media=matchMedia('(max-width:900px), (max-height:580px)');
 media.addEventListener?.('change',()=>{
  if(!mobile()){setMini(false);setCommands(false)}
  setResource();
 });
 // Avoid leaving stale drawers after the renderer enters the detail view.
 const observer=new MutationObserver(()=>{
  if(!body.classList.contains('atlas'))setMini(false);
 });
 observer.observe(body,{attributes:true,attributeFilter:['class']});
})();
