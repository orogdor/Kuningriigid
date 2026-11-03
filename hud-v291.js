/* Kuningriigid V291 — actual image sprites from user's approved compact 1671x941
 * reference. No screenshot used as the interface: every visible region is separate
 * artwork and each action is a real button calling original game commands.
 * Opt-in: ?ui=art . All game state, camera, saves and AI remain unchanged.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id), A='ui-art-v291/';
 const art=name=>A+name+'.webp';
 const et=()=> (document.documentElement.lang||'en').startsWith('et');
 const tr=(ee,en)=>et()?ee:en;
 const snap=()=>window.kingdomsUiV288?.snapshot?.();
 const original=(...ids)=>{for(const id of ids){const el=$(id);if(el&&!el.disabled){el.click();return true;}}return false;};
 const make=(tag,cl,parent)=>{const e=document.createElement(tag);if(cl)e.className=cl;parent?.append(e);return e;};
 const image=(parent,name,cl='v291-sprite')=>{const e=make('img',cl,parent);e.src=art(name);e.alt='';e.draggable=false;return e;};
 const click=(parent,cl,label,fn)=>{const e=make('button',cl,parent);e.type='button';e.setAttribute('aria-label',label);e.title=label;e.addEventListener('click',fn);return e;};
 let root,active=false,liveMap,oldMapHome,lastSource='',factionTeam=null;
 const slots=[
  ['gold','header_gold',262,0,175,64,'Kuld','Gold'],
  ['bread','header_food',433,0,143,64,'Toit','Food'],
  ['stone','header_stone',571,0,158,64,'Kivi','Stone'],
  ['population','header_population',994,0,189,64,'Rahvas','Population'],
  ['science','header_science',1179,0,174,64,'Teadus','Research']
 ];
 const cards=[
  ['card_cities',317,745,162,152,'Linnad ja kaardid','Cities & maps',()=>original('hud-city')],
  ['card_build',478,743,162,155,'Ehitus ja rajatised','Construction',()=>original('hud-build')],
  ['card_armies',647,741,161,156,'Armeed','Armies',()=>original('hud-army')],
  ['card_trade',812,741,160,156,'Kaubandus','Trade',()=>original('hud-trade-v276')],
  ['card_diplomacy',977,742,143,156,'Diplomaatia','Diplomacy',()=>openDiplomacy()],
  ['card_journal',1125,740,163,158,'Sündmuste logi','Journal',()=>original('journal')]
 ];
 const pos=(el,x,y,w,h)=>{el.dataset.x=x;el.dataset.y=y;el.dataset.w=w;el.dataset.h=h;};
 function sprite(parent,name,x,y,w,h,cl=''){
  const el=make('div','v291-element '+cl,parent);pos(el,x,y,w,h);el.dataset.art=name;image(el,name);return el;
 }
 function buttonSprite(parent,name,x,y,w,h,label,fn,cl=''){
  const el=click(parent,'v291-element v291-art-button '+cl,label,fn);pos(el,x,y,w,h);el.dataset.art=name;image(el,name);return el;
 }
 function build(){
  root=make('div','',document.body);root.id='v291-hud';root.setAttribute('aria-label',tr('Kuningriikide maailmakaardi juhtpaneel','Kingdoms world map HUD'));
  sprite(root,'footer_wood',0,904,1671,37,'v291-wood');
  sprite(root,'footer_navy',307,734,991,170,'v291-dock-background');
  sprite(root,'header_brand',0,0,262,65,'v291-brand');
  for(const [key,name,x,y,w,h,ee,en] of slots){
    const holder=sprite(root,name,x,y,w,h,'v291-ledger');holder.dataset.resource=key;
    const value=make('span','v291-real-number',holder);value.textContent='—';
    if(key==='science')click(holder,'v291-frame-click',tr(ee,en),()=>original('techtoggle'));
    else if(key==='population')click(holder,'v291-frame-click',tr(ee,en),()=>original('hud-city'));
    else click(holder,'v291-frame-click',tr(ee,en),()=>{
      const group={gold:'lux',bread:'food',stone:'build'}[key];
      document.querySelector('#resources .v264-chip[data-group="'+group+'"]')?.click();
    });
  }
  buttonSprite(root,'header_world',714,0,293,66,tr('Vaheta maailmakaarti ja detailkaarti','Switch world and detail maps'),()=>original('maptoggle'),'v291-world');
  const date=sprite(root,'header_date',1345,0,163,64,'v291-date');make('span','v291-date-text',date);
  const miniCounters=make('div','v291-mobile-counters',root);
  for(const [key,name,x,y,w,h,ee,en] of slots){const cell=make('div','v291-mobile-counter',miniCounters);cell.dataset.resource=key;image(cell,name);make('span','v291-mobile-value',cell);}
  buttonSprite(root,'header_pause',1497,1,58,59,tr('Paus','Pause'),()=>original('pause'),'v291-pause');
  buttonSprite(root,'header_play',1545,1,54,59,tr('Jätka mängu','Resume'),()=>{if(snap()?.paused)original('pause');},'v291-play');
  const ff=buttonSprite(root,'header_speed',1592,1,59,59,tr('Mängu kiirus on fikseeritud','Game speed is fixed'),()=>{},'v291-speed');
  ff.disabled=true;
  sprite(root,'research_panel',10,72,208,286,'v291-research-background');
  const research=click(root,'v291-research-main',tr('Ava avastuste puu','Open research tree'),()=>original('techtoggle'));
  pos(research,34,76,173,153);make('span','v291-research-title',research);
  for(const [n,x,y,w,h] of [['research_compass',12,224,53,56],['research_tools',52,232,58,61],['research_gate',94,231,55,63],['research_ship',133,224,55,59],['research_city',173,221,47,54]]){
    buttonSprite(root,n,x,y,w,h,tr('Avastuste järjekord','Research queue'),()=>original('techtoggle'),'v291-research-queue');
  }
  // Actual minimap canvas is placed UNDER the photographed ring; the artwork
  // itself has a transparent aperture and cannot swallow minimap map clicks.
  const mini=sprite(root,'minimap_frame',0,691,311,238,'v291-minimap-frame');
  const mapHost=make('div','v291-real-map',mini);
  for(const [n,x,y,w,h,ee,en,fn] of [
    ['map_zoom_in',203,713,68,71,'Suurenda','Zoom in',()=>original('zin','hud-zoom-in')],
    ['map_camera',237,755,69,74,'Kaamera keskpunkt','Center camera',()=>original('home','commandfocus')],
    ['map_show',230,816,78,80,'Kaardi info ja kihid','Map details & layers',()=>original('hud-map-details','hud-resource-toggle')]
  ])buttonSprite(root,n,x,y,w,h,tr(ee,en),fn,'v291-minimap-button');
  const dock=make('nav','v291-command-dock',root);dock.setAttribute('aria-label',tr('Mängu põhimenüü','Main game commands'));
  cards.forEach(([n,x,y,w,h,ee,en,fn])=>{
    const b=buttonSprite(dock,n,x,y,w,h,tr(ee,en),fn,'v291-card');b.dataset.action=n;
  });
  const selection=sprite(root,'selection_frame',1292,698,379,234,'v291-selection-frame');
  const portrait=make('div','v291-portrait',selection);image(portrait,'portrait_castle','v291-portrait-image');
  const selectedText=make('div','v291-selected-text',selection);selectedText.textContent=tr('Vali üksus','Select unit');
  for(const [n,x,y,w,h,ee,en,fn] of [
    ['cmd_attack',1283,744,86,84,'Ründa','Attack',()=>original('commandattack')],
    ['cmd_move',1354,708,74,81,'Liigu','Move',()=>original('commandmove')],
    ['cmd_defend',1283,809,80,83,'Peata üksus','Stop unit',()=>original('commandstop')],
    ['cmd_city',1363,816,67,67,'Linna juhtimine','City management',()=>original('hud-city')]
  ])buttonSprite(root,n,x,y,w,h,tr(ee,en),fn,'v291-unit-button');
  // A fifth genuine command gets its own image: selected entity details.
  const details=click(root,'v291-unit-info',tr('Kõik üksuse käsud','All unit commands'),()=>original('hud-command-toggle'));
  pos(details,1430,704,40,48);details.textContent='';
  const modal=make('section','v291-dialog',root);modal.id='v291-dialog';modal.hidden=true;modal.setAttribute('role','dialog');
  const mh=make('header','v291-dialog-header',modal);make('h2','',mh).textContent=tr('Diplomaatia','Diplomacy');
  click(mh,'v291-dialog-close',tr('Sulge','Close'),closeDiplomacy).textContent='×';
  make('div','v291-dialog-body',modal);make('div','v291-dialog-feedback',modal);
  const mob=make('div','v291-mobile-toolbar',root);
  for(const [type,icon,ee,en] of [['research','research_compass','Avastused','Research'],['map','map_show','Kaart','Map'],['units','cmd_attack','Valitud','Selection']]){
    const b=click(mob,'v291-mobile-toggle',tr(ee,en),()=>{const on=root.classList.contains('v291-show-'+type);root.classList.remove('v291-show-research','v291-show-map','v291-show-units');if(!on)root.classList.add('v291-show-'+type)});
    image(b,icon);b.dataset.panel=type;
  }
  // Ignore click-away detection only on actual new HUD buttons.
  root.addEventListener('click',e=>{if(e.target.closest('button'))e.stopPropagation();});
  root.addEventListener('keydown',e=>{if(e.key==='Escape')closeDiplomacy()});
  updateScales();
 }
 function updateScales(){
  if(!root)return;
  const sx=innerWidth/1671,sy=innerHeight/941;
  const s=Math.min(sx,sy);
  root.style.setProperty('--v291-scale',String(s));
  root.style.setProperty('--v291-x',String(sx));
  root.classList.toggle('v291-compact',innerWidth<780||innerHeight<530);
  const oy=(innerHeight-941*s);
  for(const el of root.querySelectorAll('[data-x][data-y][data-w][data-h]')){
    const x=+el.dataset.x,y=+el.dataset.y,w=+el.dataset.w,h=+el.dataset.h;
    const dx=Math.max(0,(innerWidth-1671*s)/2);
    el.style.left=(dx+x*s)+'px';
    el.style.top=(y>=690?oy+y*s:y*s)+'px';
    el.style.width=(w*s)+'px';el.style.height=(h*s)+'px';
  }
 }
 function visible(){return document.body.classList.contains('atlas')&&new URLSearchParams(location.search).get('ui')==='art'}
 function activate(){
  if(!root)return;
  const yes=visible();if(yes===active)return;
  active=yes;document.body.classList.toggle('v291-active',yes);
  if(yes){
    const canvas=$('atlasminimap');
    if(canvas){
      if(!oldMapHome){oldMapHome=document.createComment('V291 original minimap home');canvas.parentNode.insertBefore(oldMapHome,canvas);}
      root.querySelector('.v291-real-map').append(canvas);liveMap=canvas;
    }
    update(true);
  }else{
    if(liveMap&&oldMapHome?.parentNode)oldMapHome.parentNode.insertBefore(liveMap,oldMapHome);
    closeDiplomacy();
  }
 }
 function update(force=false){
  if(!active)return;
  const s=snap();
  const keys=['gold','bread','stone','population','science'];
  for(const key of keys){
    const slot=root.querySelector('.v291-ledger[data-resource="'+key+'"] .v291-real-number');
    if(!slot)continue;
    let n='0';
    if(key==='population')n=Number(s?.leaders?.[0]?.population||0).toLocaleString('et-EE');
    else if(key==='science')n=Number(s?.researchRate||0).toLocaleString('et-EE');
    else{
      const raw=document.querySelector('#resources span[data-resource="'+key+'"]');
      n=raw?.querySelector('b')?.textContent?.trim()||document.querySelector('#resources .v264-val[data-k="'+key+'"] i')?.textContent?.trim()||'0';
    }
    slot.textContent=n;
    const mobile=root.querySelector('.v291-mobile-counter[data-resource="'+key+'"] .v291-mobile-value');if(mobile)mobile.textContent=n;
  }
  const d=$('dayclock-v235')?.textContent?.trim()||'';
  root.querySelector('.v291-date-text').textContent=(s?.turn?tr('Käik ','Turn ')+s.turn+' · ':'')+d;
  root.querySelector('.v291-research-title').textContent=(s?.research||tr('Vali avastus','Choose research'));
  const command=$('commandhud');
  const chosen=$('commandname')?.textContent?.trim()||'';
  const portrait=command?.querySelector('.v263-portrait:not([hidden])');
  const src=portrait?.getAttribute('src');
  const valid=!!src&&!!chosen&&!/Vali üksus|Select unit/i.test(chosen);
  const p=root.querySelector('.v291-portrait-image');
  if(valid){p.src=src;p.onerror=()=>{p.onerror=null;p.src=art('portrait_castle')};root.querySelector('.v291-selected-text').textContent=chosen;}
  else if(force||lastSource){p.src=art('portrait_castle');root.querySelector('.v291-selected-text').textContent=tr('Vali üksus','Select unit')}
  lastSource=valid?src:'';
  const modal=['startmenu','researchpanel','journalpanel','help'].some(id=>$(id)&&!$(id).hidden);
  root.classList.toggle('v291-behind-modal',modal);
  const pause=root.querySelector('.v291-pause');const play=root.querySelector('.v291-play');
  pause.disabled=!!s?.paused;play.disabled=!s?.paused;
 }
 function openDiplomacy(team=null){
  factionTeam=team;const panel=$('v291-dialog');panel.hidden=false;renderDiplomacy();
 }
 function closeDiplomacy(){factionTeam=null;if($('v291-dialog'))$('v291-dialog').hidden=true}
 function renderDiplomacy(){
  const panel=$('v291-dialog');if(panel?.hidden)return;
  const body=panel.querySelector('.v291-dialog-body');body.replaceChildren();
  for(const f of (snap()?.leaders||[]).filter(v=>v.team>0&&(factionTeam==null||v.team===factionTeam))){
    const row=make('div','v291-faction-row',body);make('strong','',row).textContent=f.name+' · '+f.relation;
    const controls=make('div','v291-faction-buttons',row);
    for(const [status,ee,en] of [['friendly','Sõprus','Friendship'],['neutral','Neutraalne','Neutral'],['war','Sõda','War']]){
      const b=click(controls,'v291-faction-action',tr(ee,en),()=>{
        const response=window.kingdomsUiV288?.diplomacy?.(f.team,status);
        panel.querySelector('.v291-dialog-feedback').textContent=response?.error||tr('Suhe muudetud','Relation updated');
        renderDiplomacy();
      });b.textContent=tr(ee,en);b.disabled=f.relation===status;
    }
  }
 }
 function boot(){build();activate();addEventListener('resize',updateScales,{passive:true});
   new MutationObserver(activate).observe(document.body,{attributes:true,attributeFilter:['class']});
   setInterval(()=>{activate();update()},850);
   addEventListener('pagehide',()=>{if(liveMap&&oldMapHome?.parentNode)oldMapHome.parentNode.insertBefore(liveMap,oldMapHome)},{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();