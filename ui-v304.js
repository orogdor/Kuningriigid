/* V304: one responsive illustrated HUD, sharing the existing game commands.
 * No mirrored simulation state: all counters, portraits and actions are read-only
 * snapshots. Original city/research/trade handlers remain the source of truth. */
(()=>{
 'use strict';
 if(!window.KINGDOMS_UI304)return;
 const $=id=>document.getElementById(id);
 const tr=(et,en)=>(document.documentElement.lang||'en').startsWith('et')?et:en;
 const snapshot=()=>window.kingdomsUiV288?.snapshot?.();
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;parent?.append(n);return n;};
 const picture=(parent,src,cls='')=>{const n=el('img',cls,parent);n.src=src;n.alt='';n.draggable=false;return n;};
 const original=(...ids)=>{for(const id of ids){const b=$(id);if(b&&!b.disabled){b.click();return true;}}return false;};
 const button=(parent,cls,label,action)=>{const n=el('button',cls,parent);n.type='button';n.title=label;n.setAttribute('aria-label',label);n.addEventListener('click',action);return n;};
 const art=name=>'ui-art-v263/'+name+'.webp';
 const cards=[['cities','Linnad','Cities','cmd_city',()=>window.uiListsV264?.toggle('city')],
  ['build','Ehitus','Build','cmd_build',()=>original('hud-build')],
  ['armies','Armeed','Armies','cmd_army',()=>original('hud-army')],
  ['trade','Kaubandus','Trade','res_gold',()=>window.uiListsV264?.toggle('trade')],
  ['diplomacy','Diplomaatia','Diplomacy','cmd_city',()=>openDiplomacy()],
  ['journal','Päevik','Journal','cmd_research',()=>original('journal')]];
 let root,mapHome,mapCanvas,researchMain,researchPic,researchName,researchValue,researchBar,queue,
  selectedName,selectedState,selectedInfo,portrait,actions,pause,world,clock,walk,resourcePanel,diplomacy,previousFocus;
 let resourceKey='';
 const counters=new Map();
 function research(id){
  closeTransient();
  const tree=$('researchtree');if(tree&&id){tree.dataset.selectedTech=id;tree.dataset.renderKey='';}
  if(window.openKuningriigidResearchV296)window.openKuningriigidResearchV296();else original('techtoggle');
 }
 function closeTransient(){
  if(resourcePanel)resourcePanel.hidden=true;
  if(diplomacy)diplomacy.hidden=true;
  root?.classList.remove('show-map','show-research','show-selection');
  document.body.classList.remove('v304-command-detail-open');
  syncBlocking();
 }
 function toggleDrawer(name){
  const was=root.classList.contains('show-'+name);closeTransient();
  if(!was)root.classList.add('show-'+name);
 }
 function build(){
  document.body.classList.add('v304-active');
  root=el('div','',document.body);root.id='v304-hud';root.setAttribute('aria-label','Kingdoms game interface');
  const top=el('div','v304-top v304-panel',root);
  const brand=button(top,'v304-brand','Main menu',()=>{closeTransient();original('menubtn');});
  picture(brand,art('cmd_city'));el('span','',brand,'KUNINGRIIGID');
  const resources=el('div','v304-resources',top);
  for(const [key,icon,et,en] of [['bread','res_food','Toit','Food'],['wood','res_wood','Puit','Wood'],['stone','res_stone','Kivi','Stone'],['gold','res_gold','Kuld','Gold'],['population','res_population','Rahvas','People'],['science','cmd_research','Teadus/min','Science/min']]){
   const b=button(resources,'v304-resource',tr(et,en),()=>key==='science'?research():key==='population'?window.uiListsV264?.toggle('city'):showResources(key,b));
   picture(b,art(icon));const text=el('span','',b);el('small','',text,tr(et,en));const value=el('b','',text,'—');counters.set(key,{button:b,value});
  }
  world=button(top,'v304-world','Switch map',()=>original('maptoggle'));picture(world,art('cmd_map'));el('span','',world,tr('Maailmakaart','World map'));
  clock=el('span','v304-clock',top);
  pause=button(top,'v304-pause',tr('Paus / jätka','Pause / resume'),()=>{original('pause');update();});
  const menu=button(top,'v304-menu',tr('Menüü','Menu'),()=>{closeTransient();original('menubtn');});menu.textContent='☰';
  const discoveries=el('section','v304-discoveries v304-panel',root);discoveries.setAttribute('aria-label','Research');
  el('span','v304-eyebrow',discoveries,tr('AVASTUSTE AJASTU','AGE OF DISCOVERY'));
  researchMain=button(discoveries,'v304-research-main','Open discoveries',()=>research());
  researchPic=picture(researchMain,art('cmd_research'));
  const info=el('span','v304-research-copy',researchMain);el('small','',info,tr('UURIMISEL','RESEARCHING'));
  researchName=el('strong','',info);researchValue=el('small','',info);
  researchBar=el('progress','',discoveries);researchBar.max=100;
  queue=el('div','v304-research-queue',discoveries);queue.setAttribute('aria-label','Four queued discoveries');
  for(let i=0;i<4;i++){
   const b=button(queue,'v304-queue-slot','Add discovery',()=>research(b.dataset.tech));
   picture(b,art('cmd_research'));el('span','',b,'+');
  }
  const mini=el('section','v304-map v304-panel',root);mini.setAttribute('aria-label','World overview');
  el('span','v304-eyebrow',mini,tr('MAADE ATLAS','WORLD ATLAS'));
  const host=el('div','v304-map-host',mini);host.id='v304-map-host';
  const tools=el('div','v304-map-tools',mini);
  for(const [file,label,ids] of [['map_zoom_in','Zoom in',['zin']],['map_zoom_out','Zoom out',['zout']],['map_center','Center camera',['home']],['map_layers','Map details',['hud-map-details']]]){
   const b=button(tools,'',label,()=>original(...ids));picture(b,'ui-art-v303/'+file+'.webp');
  }
  const shortcuts=el('div','v304-map-shortcuts',mini);
  const switchMap=button(shortcuts,'',tr('Vaheta kaarti','Switch map'),()=>original('maptoggle'));picture(switchMap,art('cmd_map'));el('span','',switchMap,tr('Kaardivaade','Map view'));
  walk=button(shortcuts,'',tr('Jaluta linnas','Walk in city'),()=>original('hud-walk'));picture(walk,art('unit_worker'));el('span','',walk,tr('Jaluta','Walk'));
  const dock=el('nav','v304-dock',root);dock.setAttribute('aria-label','Main game commands');
  for(const [id,et,en,,action] of cards){
   const b=button(dock,'v304-command',tr(et,en),()=>{closeTransient();action();});b.dataset.action=id;
   const crop=el('span','v304-command-picture',b);picture(crop,'ui-art-v303/card_'+id+'.webp');el('span','v304-command-label',b,tr(et,en));
  }
  const selected=el('section','v304-selection v304-panel',root);selected.setAttribute('aria-label','Selected object');
  const selectionHead=el('div','v304-selection-head',selected);portrait=picture(selectionHead,art('cmd_map'));
  const selectionCopy=el('div','',selectionHead);selectedName=el('strong','',selectionCopy);selectedState=el('small','',selectionCopy);
  selectedInfo=button(selectionHead,'v304-selection-info',tr('Üksuse kõik käsud ja rivistus','Unit details and formation'),()=>document.body.classList.toggle('v304-command-detail-open'));selectedInfo.textContent='i';
  actions=el('div','v304-selection-actions',selected);
  for(let i=0;i<4;i++){
   const b=button(actions,'','Selection action',()=>dispatch(i));picture(b,'ui-art-v303/action_focus.webp');el('span','',b);
  }
  const mobile=el('div','v304-mobile-tools',root);
  for(const [name,icon,label] of [['research','cmd_research','Research'],['map','cmd_map','Map'],['selection','unit_scout','Selection']]){
   const b=button(mobile,'v304-panel',label,()=>toggleDrawer(name));picture(b,art(icon));el('span','',b,label);
  }
  resourcePanel=el('section','v304-resource-panel v304-panel',document.body);resourcePanel.id='v304-resource-panel';resourcePanel.hidden=true;resourcePanel.setAttribute('role','dialog');
  diplomacy=el('section','v304-diplomacy v304-panel',document.body);diplomacy.id='v304-diplomacy';diplomacy.hidden=true;diplomacy.setAttribute('role','dialog');diplomacy.setAttribute('aria-label','Diplomacy');diplomacy.setAttribute('aria-modal','true');
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  root.addEventListener('click',e=>e.stopPropagation());
 }
 function dispatch(index){
  const s=snapshot(),a=window.KuningriigidSelectionV300?.actions?.(s?.selection,s?.view)?.[index];
  if(!a||a.disabled)return;
  if(a.target==='research')return research();
  if(a.target==='diplomacy')return openDiplomacy();
  const targets=Array.isArray(a.target)?a.target:[a.target];
  original(...targets.filter(id=>id!=='foundcity'||($('settlerpanel')&&!$('settlerpanel').hidden)));
  window.KuningriigidUIV309?.route?.(targets);
 }
 function showResources(key,anchor){
  if(!resourcePanel.hidden&&resourceKey===key){resourcePanel.hidden=true;return;}
  closeTransient();resourceKey=key;resourcePanel.replaceChildren();
  const head=el('div','v304-dialog-heading',resourcePanel);el('h2','',head,tr('Kuningriigi varud','Kingdom stores'));
  button(head,'v304-close',tr('Sulge','Close'),()=>{resourcePanel.hidden=true;}).textContent='×';
  const keys=key==='bread'?['bread','water','grain','fish','meat','flour']:key==='gold'?['gold','pottery','cloth','wine','jewelry','spices']:['wood','stone','plank','clay','cutstone','ore','iron','bronze','steel'];
  for(const k of keys){
   const source=document.querySelector('#resources [data-resource="'+k+'"]');if(!source)continue;
   const painting={cloth:'guilds',wine:'commerce',jewelry:'bronze_crafts',spices:'city_trade',steel:'steelmaking'}[k];
   const row=el('div','v304-store-row',resourcePanel);picture(row,painting?'ui-art-v304/tech/'+painting+'.webp':art(k==='bread'?'res_food':'res_'+k));
   el('span','',row,source.querySelector('small')?.textContent||k);el('b','',row,source.querySelector('b')?.textContent||'0');
   el('small','',row,source.querySelector('em')?.textContent||'');
  }
  resourcePanel.hidden=false;const r=anchor.getBoundingClientRect();resourcePanel.style.left=Math.max(8,Math.min(innerWidth-306,r.left))+'px';
 }
 function dialogHeading(parent,title,close){
  const head=el('div','v304-dialog-heading',parent);el('h2','',head,title);button(head,'v304-close',tr('Sulge','Close'),close).textContent='×';
 }
 function openDiplomacy(){
  closeTransient();previousFocus=document.activeElement;diplomacy.hidden=false;renderDiplomacy();syncBlocking();diplomacy.querySelector('button')?.focus();
 }
 function renderDiplomacy(feedback=''){
  diplomacy.replaceChildren();dialogHeading(diplomacy,tr('Diplomaatia','Diplomacy'),()=>{closeTransient();previousFocus?.focus?.();});
  const banner=el('div','v304-menu-banner',diplomacy);picture(banner,'ui-art-v303/card_diplomacy.webp');
  el('p','v304-muted',diplomacy,tr('Sinu kuningriigi suhted teiste rahvastega.','Your kingdom’s relations with the other nations.'));
  for(const f of snapshot()?.leaders?.filter(f=>f.team>0)||[]){
   const row=el('div','v304-faction',diplomacy);el('strong','',row,f.name);el('small','',row,`${f.population} ${tr('elanikku','people')} · ${f.towns} ${tr('linna','cities')} · ${f.relation}`);
   const controls=el('div','v304-faction-controls',row);
   for(const [status,et,en] of [['friendly','Sõprus','Friendship'],['neutral','Neutraalne','Neutral'],['war','Sõda','War']]){
    const b=button(controls,'',tr(et,en),()=>{const result=window.kingdomsUiV288?.diplomacy?.(f.team,status);renderDiplomacy(result?.error||tr('Suhe muudetud','Relation updated'));});b.textContent=tr(et,en);b.disabled=f.relation===status;
   }
  }
  const feedbackEl=el('p','v304-feedback',diplomacy,feedback);feedbackEl.setAttribute('role','status');
 }
 function syncBlocking(){
  document.body.classList.toggle('v304-blocking',!!(diplomacy&&!diplomacy.hidden&&!diplomacy.classList.contains('v309-embedded'))||!!($('v264-listpanel')&&!$('v264-listpanel').hidden&&!$('v264-listpanel').classList.contains('v309-embedded')));
 }
 function update(){
  const bigMenu=['startmenu','researchpanel','journalpanel','help'].some(id=>$(id)&&!$(id).hidden);
  root.hidden=bigMenu||document.body.classList.contains('fpv-mode');
  const s=snapshot();if(!s)return;
  for(const [key,{button:b,value}] of counters){
   const source=document.querySelector('#resources [data-resource="'+key+'"] b');
   value.textContent=key==='population'?s.leaders?.[0]?.population||'0':key==='science'?s.researchRate||'0':source?.textContent||'0';
   b.setAttribute('aria-label',b.title+': '+value.textContent);
  }
  world.querySelector('span').textContent=s.view==='world'?tr('Maailmakaart','World map'):tr('Detailkaart','Detail map');
  walk.disabled=s.view==='world';
  const t=$('dayclock-v235')?.textContent.match(/\d{1,2}:\d{2}/)?.[0]||'';
  clock.textContent=tr('Käik ','Turn ')+s.turn+(t?' · '+t:'');
  const pauseArt=window.KuningriigidArtV306?.pauseSrc?.(s.paused);
  if(pauseArt){let im=pause.querySelector('img');if(!im)im=picture(pause,pauseArt);if(im.getAttribute('src')!==pauseArt)im.src=pauseArt;}
  else pause.textContent=s.paused?'▶':'Ⅱ';
  pause.setAttribute('aria-pressed',String(s.paused));
  researchName.textContent=s.research||tr('Vali esimene avastus','Choose a discovery');
  researchValue.textContent=s.research?(s.researchPaused?tr('Pausil','Paused'):s.researchPercent+'%')+' · '+s.researchRate+tr(' teadust/min',' science/min'):tr('Uuri uusi teadmisi →','Explore new knowledge →');
  researchBar.value=s.researchPercent||0;researchBar.setAttribute('aria-label',researchName.textContent);
  const image=s.researchActiveId?window.KuningriigidTechArtV293?.src(s.researchActiveId,{age:s.researchActiveAge,name:s.research}):art('cmd_research');
  if(image&&researchPic.getAttribute('src')!==image)researchPic.src=image;
  [...queue.children].forEach((b,i)=>{
   const tech=s.researchQueue?.[i];b.dataset.tech=tech?.id||'';b.classList.toggle('empty',!tech);
   b.title=tech?.name||tr('Lisa avastus järjekorda','Add discovery to queue');b.setAttribute('aria-label',b.title);
   const pic=b.querySelector('img'),src=tech&&window.KuningriigidTechArtV293?.src(tech.id,tech);if(src&&pic.getAttribute('src')!==src)pic.src=src;
  });
  const sel=s.selection||{};selectedName.textContent=sel.name||tr('Sinu kuningriik','Your kingdom');
  selectedInfo.disabled=sel.kind==='none';
  selectedState.textContent=sel.kind==='none'?s.age:$('commandstate')?.textContent||s.age;
  const originalPortrait=$('commandhud')?.querySelector('.v263-portrait:not([hidden])')?.getAttribute('src')||art(sel.kind==='none'?'cmd_map':sel.kind==='city'?'cmd_city':'unit_settler');
  const p=window.KuningriigidArtV306?.portraitSrc?.(sel,originalPortrait)||originalPortrait;
  if(portrait.getAttribute('src')!==p)portrait.src=p;
  const choices=window.KuningriigidSelectionV300?.actions?.(sel,s.view)||[];
  [...actions.children].forEach((b,i)=>{
   const a=choices[i];b.hidden=!a;if(!a)return;b.disabled=!!a.disabled;
   const label=tr(a.ee,a.en);b.title=label;b.setAttribute('aria-label',label);b.querySelector('span').textContent=label;
   const src=window.KuningriigidArtV306?.actionSrc?.(a.icon)||(['move','attack','stop','focus'].includes(a.icon)?'ui-art-v303/action_'+a.icon+'.webp':'ui-art-v300/action_'+a.icon+'.svg');
   const im=b.querySelector('img');if(im.getAttribute('src')!==src)im.src=src;
   b.setAttribute('aria-pressed',String((a.icon==='move'||a.icon==='attack')&&sel.order===a.icon));
  });
  if(mapCanvas&&mapCanvas.parentElement!==$('v304-map-host'))$('v304-map-host').append(mapCanvas);
  syncBlocking();
 }
 function menuArt(){
  const card=document.querySelector('#startmenu .menu-card');if(!card)return;
  const controls=el('div','v304-menu-controls');
  for(const child of [...card.children])controls.append(child);
  const cover=el('div','v304-menu-cover',card);
  el('span','v304-eyebrow',cover,tr('ÜKS MAA. SINU KUNINGRIIK.','ONE WORLD. YOUR KINGDOM.'));
  const title=controls.querySelector('#menutitle');if(title)cover.append(title);
  el('p','',cover,tr('Kiviajast tulevikku. Iga avastus muudab maailma.','From the first settlement to a new age. Every discovery changes the world.'));
  el('span','v304-cover-caption',cover,tr('SEITSE AJASTUT · REAALAJA STRATEEGIA','SEVEN ERAS · REAL-TIME STRATEGY'));
  card.append(controls);
  const toggle=$('v287-style-toggle');if(toggle){toggle.textContent=tr('Kujundus: illustreeritud','Interface: illustrated');toggle.addEventListener('click',e=>{e.stopImmediatePropagation();location.href=location.pathname+'?ui=classic';},{capture:true});}
 }
 function init(){
  // Retire the previous presentation layers for this mode. Keep functional
  // city/tab layouts and classic-mode styles available on a classic reload.
  const replaced=/\/(?:ui-theme-v265|ui-v282|ui-painted-v287|ui-reference-v288|hud-v289|hud-v290|hud-v291|hud-v298-layout|hud-v301-background|hud-v302-pieces|hud-v303-buttons|research-art-v293|research-panel-v294|research-panel-v295)\.css$/;
  for(const link of document.querySelectorAll('link[rel="stylesheet"]'))if(replaced.test(new URL(link.href).pathname))link.disabled=true;
  build();menuArt();
  mapCanvas=$('atlasminimap');if(mapCanvas){mapHome=mapCanvas.parentElement;$('v304-map-host').append(mapCanvas);}
  // All ordinary game panels share the same image-backed material and header art.
  const researchWindow=document.querySelector('#researchpanel .research-window');
  researchWindow?.classList.remove('v294-research-screen','v295-research-screen');
  if($('researchtitle'))$('researchtitle').textContent=tr('Avastuste kroonika','Chronicle of Discoveries');
  const modalIds=['researchpanel','journalpanel','startmenu','help'];
  for(const id of modalIds){const p=$(id);if(p)new MutationObserver(update).observe(p,{attributes:true,attributeFilter:['hidden']});}
  const listObserver=new MutationObserver(()=>{
   const p=$('v264-listpanel');if(p&&!p.dataset.v304){
    p.dataset.v304='1';const banner=el('div','v304-list-banner',p);p.prepend(banner);
    new MutationObserver(()=>{const kind=p.dataset.kind;banner.style.backgroundImage=`url('ui-art-v303/card_${kind==='army'?'armies':kind==='trade'?'trade':'cities'}.webp')`;syncBlocking();}).observe(p,{attributes:true,attributeFilter:['hidden','data-kind']});
   }
  });listObserver.observe(document.body,{childList:true});
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'){if(!diplomacy.hidden){e.stopImmediatePropagation();closeTransient();previousFocus?.focus?.();}else closeTransient();}
   if(e.key==='Tab'&&!diplomacy.hidden&&!diplomacy.classList.contains('v309-embedded')){const focusable=[...diplomacy.querySelectorAll('button:not(:disabled)')],first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  },true);
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#v304-resource-panel,.v304-resource'))resourcePanel.hidden=true;});
  addEventListener('pagehide',()=>{if(mapCanvas&&mapHome)mapHome.append(mapCanvas);},{once:true});
  update();setInterval(update,500);
  let resizeTimer;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
   if($('researchpanel')&&!$('researchpanel').hidden){$('researchtree').dataset.renderKey='';window.openKuningriigidResearchV296?.();}
  },150);},{passive:true});
  window.KuningriigidUIV304={update,close:closeTransient};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
