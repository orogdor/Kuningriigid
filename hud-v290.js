/* Kuningriigid V290 — UI constructed from real artwork cropped out of the user's
 * approved 1672 × 941 design. Layout CSS positions images; clickable transparent
 * hotspots call the actual game's existing handlers. V289 remains as rollback.
 */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 const $=id=>document.getElementById(id);
 const A='ui-art-v290/';
 const image=n=>A+n+'.webp';
 const T=(et,en)=>(document.documentElement.lang||'').startsWith('et')?et:en;
 const game=()=>window.kingdomsUiV288?.snapshot?.()||null;
 let root, canvas, home, active=false, lastSel='', lastTurn=-1;
 const call=id=>{const el=$(id);if(el&&!el.disabled){el.click();return true;}return false;};
 function hotspot(parent,cls,title,callback){
   const b=document.createElement('button');b.type='button';b.className=cls;
   b.setAttribute('aria-label',title);b.title=title;b.addEventListener('click',callback);
   parent.appendChild(b);return b;
 }
 function svgImage(parent,cls,src){const im=document.createElement('img');im.className=cls;im.src=src;im.alt='';im.draggable=false;parent.appendChild(im);return im;}
 function make(tag,cls,parent){const e=document.createElement(tag);e.className=cls;if(parent)parent.appendChild(e);return e;}
 const commands=[
   ['card_cities',T('Linnad ja ehitamine','Cities and building'),'hud-city'],
   ['card_build',T('Ehitamine','Construction'),'hud-build'],
   ['card_armies',T('Armeed','Armies'),'hud-army'],
   ['card_trade',T('Kaubandus','Trade'),'hud-trade-v276'],
   ['card_diplomacy',T('Diplomaatia','Diplomacy'),null],
   ['card_journal',T('Sündmuste logi','Event journal'),'journal']
 ];
 function diplomacy(){
   const panel=$('v290-diplomacy');panel.hidden=!panel.hidden;
   if(panel.hidden)return;
   const list=panel.querySelector('.v290-dialog-content');list.replaceChildren();
   const snap=game();
   (snap?.leaders||[]).filter(x=>x.team>0).forEach(f=>{
     const row=make('div','v290-dialog-row',list);
     const title=make('strong','',row);title.textContent=f.name+' · '+f.relation;
     const actions=make('div','v290-dialog-actions',row);
     for(const [rel,et,en] of [['friendly','Sõprus','Friendly'],['neutral','Neutraalne','Neutral'],['war','Sõda','War']]){
       const b=hotspot(actions,'v290-dialog-btn',T(et,en),()=>{
         const result=window.kingdomsUiV288?.diplomacy?.(f.team,rel);
         const status=panel.querySelector('.v290-dialog-status');
         status.textContent=result?.error||T('Suhe uuendatud','Relation updated');diplomacy();diplomacy();
       });b.textContent=T(et,en);b.disabled=f.relation===rel;
     }
   });
 }
 function create(){
   root=make('div','',document.body);root.id='v290-hud';root.setAttribute('aria-label',T('Kuningriigid maailmakaardi juhtpaneel','Kingdoms world-map HUD'));
   const top=make('div','v290-top',root);svgImage(top,'v290-background',image('topbar'));
   const headerText=make('div','v290-live-date',top);headerText.innerHTML='<span class="v290-turn"></span><span class="v290-age"></span>';
   const ledger=make('div','v290-live-ledger',top);
   for(const [key,label] of [['gold',T('Kuld','Gold')],['bread',T('Toit','Food')],['stone',T('Kivi','Stone')],['population',T('Elanikud','Population')],['science',T('Teadus','Science')]]){
     const box=make('div','v290-counter',ledger);box.dataset.key=key;
     const text=make('span','v290-counter-value',box);text.textContent='—';box.title=label;
   }
   for(const [cls,id,label] of [['v290-top-pause','pause',T('Paus','Pause')],['v290-top-menu','menubtn',T('Menüü','Menu')]])hotspot(top,'v290-hit '+cls,label,()=>call(id));
   const discover=make('section','v290-discovery',root);svgImage(discover,'v290-background',image('discovery'));
   const prog=make('div','v290-research-name',discover);prog.textContent=T('Vali avastus','Choose discovery');
   hotspot(discover,'v290-research-hit',T('Ava avastused','Open research'),()=>call('techtoggle'));
   for(let i=0;i<5;i++)hotspot(discover,'v290-queue-hit v290-queue-'+i,T('Avastuste järjekord','Research queue'),()=>call('techtoggle'));
   const footer=make('div','v290-footer-texture',root);svgImage(footer,'v290-background',image('wood_footer'));
   const minimap=make('section','v290-minimap',root);svgImage(minimap,'v290-background',image('minimap'));
   const mapHost=make('div','v290-real-map-host',minimap);
   // Same canvas with the existing pointerdown navigation handler is reused.
   hotspot(minimap,'v290-map-world',T('Maailma- ja detailkaardi vahetus','Switch world/detail map'),()=>call('maptoggle'));
   hotspot(minimap,'v290-map-plus',T('Suurenda','Zoom in'),()=>call('hud-zoom-in'));
   hotspot(minimap,'v290-map-minus',T('Vähenda','Zoom out'),()=>call('hud-zoom-out'));
   hotspot(minimap,'v290-map-camera',T('Kaamera ja vaated','Camera and views'),()=>call('hud-map-details'));
   hotspot(minimap,'v290-map-visibility',T('Ressursikihid','Map layers'),()=>call('hud-resource-toggle'));
   const cards=make('nav','v290-cards',root);cards.setAttribute('aria-label',T('Mängu menüüd','Game menus'));
   for(const [name,label,id] of commands){const b=hotspot(cards,'v290-card',label,()=>id?call(id):diplomacy());svgImage(b,'v290-card-image',image(name));}
   const right=make('section','v290-selection',root);svgImage(right,'v290-background',image('selection'));
   const portrait=make('div','v290-live-portrait',right);portrait.hidden=true;const portraitImg=make('img','',portrait);portraitImg.alt='';
   const selName=make('div','v290-sel-name',right);selName.hidden=true;
   for(const [cls,id,et,en] of [
     ['v290-sel-move','commandmove','Liigu','Move'],
     ['v290-sel-attack','commandattack','Ründa','Attack'],
     ['v290-sel-defense','commandstop','Peata','Stop'],
     ['v290-sel-options','hud-command-toggle','Käsud','Commands'],
     ['v290-sel-city','hud-city','Linn','City']
   ])hotspot(right,'v290-sel-hit '+cls,T(et,en),()=>call(id));
   const mob=make('div','v290-mobile-buttons',root);
   for(const [name,label] of [['discovery',T('Avastused','Research')],['minimap',T('Kaart','Map')],['selection',T('Valitud','Selection')]]){
     const b=hotspot(mob,'v290-mobile-button',label,()=>{
       const cls='v290-show-'+name,was=root.classList.contains(cls);
       root.classList.remove('v290-show-discovery','v290-show-minimap','v290-show-selection');
       if(!was)root.classList.add(cls);
     });b.textContent=label;
   }
   const popup=make('section','v290-popup',root);popup.id='v290-diplomacy';popup.setAttribute('role','dialog');popup.hidden=true;
   const head=make('div','v290-dialog-head',popup);const h=make('h2','',head);h.textContent=T('Diplomaatia','Diplomacy');
   hotspot(head,'v290-dialog-close',T('Sulge','Close'),()=>popup.hidden=true).textContent='✕';
   make('div','v290-dialog-content',popup);make('p','v290-dialog-status',popup);
   root.addEventListener('keydown',e=>{if(e.key==='Escape')popup.hidden=true;});
   const res=()=>resize();window.addEventListener('resize',res,{passive:true});resize();
 }
 function resize(){
   if(!root)return;
   const w=window.innerWidth,h=window.innerHeight;
   const sc=Math.min(w/1672,h/941);
   root.style.setProperty('--art-scale',String(Math.min(1.9,Math.max(.51,sc))));
   root.dataset.mode=(w<940||h<590)?'compact':'desktop';
 }
 function shouldShow(){return document.body.classList.contains('atlas')&&new URLSearchParams(location.search).get('ui')==='picture';}
 function activate(){
   if(!root)return;
   const yes=shouldShow();if(active===yes)return;active=yes;
   document.body.classList.toggle('v290-active',yes);
   if(yes){
     canvas=$('atlasminimap');
     if(canvas){if(!home){home=document.createComment('v290 real minimap original');canvas.parentNode.insertBefore(home,canvas);}
       root.querySelector('.v290-real-map-host').append(canvas);}
     update(true);
   }else{
     if(canvas&&home?.parentNode)home.parentNode.insertBefore(canvas,home);
     const pop=$('v290-diplomacy');if(pop)pop.hidden=true;
   }
 }
 function update(force=false){
   if(!active)return;const snap=game();
   if(snap){
     const turn=root.querySelector('.v290-turn');if(turn)turn.textContent=T('Käik ','Turn ')+snap.turn;
     const age=root.querySelector('.v290-age');if(age)age.textContent=snap.age;
     if(snap.turn!==lastTurn||force){
       const title=root.querySelector('.v290-research-name');title.textContent=T('Avastus:\n','Discovery:\n')+(snap.research||T('Vali avastus','Choose discovery'));lastTurn=snap.turn;
     }
   }
   const day=$('dayclock-v235')?.textContent||'';root.querySelector('.v290-live-date').title=day.trim();
   for(const key of ['gold','bread','stone','population','science']){
     const el=root.querySelector('.v290-counter[data-key="'+key+'"] .v290-counter-value');
     if(!el)continue;
     let value='';
     if(key==='population')value=Number(snap?.leaders?.[0]?.population||0).toLocaleString('et-EE');
     else if(key==='science')value=String(snap?.researchRate??0);
     else{
       const src=document.querySelector('#resources span[data-resource="'+key+'"]');
       value=src?.querySelector('b')?.textContent?.trim()||document.querySelector('#resources .v264-val[data-k="'+key+'"] i')?.textContent?.trim()||'0';
     }
     el.textContent=value;
   }
   const hud=$('commandhud');const name=$('commandname')?.textContent?.trim()||'';
   const portrait=hud?.querySelector('.v263-portrait:not([hidden])');const src=portrait?.getAttribute('src');
   const selected=!!src&&!!name&&!/Vali üksus|Select unit/i.test(name);
   const p=root.querySelector('.v290-live-portrait');const n=root.querySelector('.v290-sel-name');
   if(selected){
     p.hidden=false;n.hidden=false;n.textContent=name;
     if(src!==lastSel){p.querySelector('img').src=src;lastSel=src;}
   }else{p.hidden=true;n.hidden=true;lastSel='';}
   const modal=['startmenu','researchpanel','journalpanel','help'].some(id=>$(id)&&!$(id).hidden);
   root.classList.toggle('v290-modal-behind',modal);
 }
 function boot(){create();activate();
   new MutationObserver(activate).observe(document.body,{attributes:true,attributeFilter:['class']});
   setInterval(()=>{activate();update();},700);
   window.addEventListener('pagehide',()=>{if(canvas&&home?.parentNode)home.parentNode.insertBefore(canvas,home);},{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();