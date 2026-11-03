/* V289: independent responsive HUD. V263/V288 pictures are the only reused visuals.
   Original game controls remain hidden but dispatch real actions; the existing minimap
   canvas is moved rather than copied so its click handlers keep working. */
(()=>{
const $=id=>document.getElementById(id);
const img=n=>'ui-art-v263/'+n+'.webp';
const tr=(e,n)=>(document.documentElement.lang||'').startsWith('et')?e:n;
const data=()=>window.kingdomsUiV288?.snapshot?.();
const api=()=>window.kingdomsUiV288;
const legacy=(id)=>{const el=$(id);if(el&&!el.disabled){el.click();return true;}return false;};
const create=(tag,cls,parent)=>{const el=document.createElement(tag);if(cls)el.className=cls;parent?.append(el);return el;};
const btn=(parent,cls,title,cb)=>{const el=create('button',cls,parent);el.type='button';el.title=title;el.setAttribute('aria-label',title);el.addEventListener('click',cb);return el;};
const stats=[['bread','res_food','Toit','Food'],['wood','res_wood','Puit','Wood'],['stone','res_stone','Kivi','Stone'],['gold','res_gold','Kuld','Gold'],['science','cmd_research','Teadus','Research'],['population','res_population','Rahvas','Population']];
const cards=[['build','bld_house','Ehitised','Buildings','hud-build'],['units','unit_spearman','Üksused','Units','hud-army'],['research','cmd_research','Uurimus','Research','techtoggle'],['diplomacy','unit_scout','Diplomaatia','Diplomacy',null],['trade','res_gold','Kaubandus','Trade','hud-trade-v276'],['empire','bld_hall','Riik','Empire','hud-city']];
let root,home,mini,sigTips='',sigFactions='',sigSelection='',dipTeam=null;
function build(){
 root=create('div','',document.body);root.id='v289-hud';root.setAttribute('aria-label','Kingdoms illustrated HUD');
 root.innerHTML=[
 '<div class="v289-bar" role="banner"><div class="v289-brand"><img class="v289-crest" src="ui-art-v288/crest.svg" alt=""><div class="v289-name"><strong>KUNINGRIIGID</strong><small>UI V289 · MÄNG V286</small></div><img class="v289-hero" src="ui-art-v263/unit_spearman.webp" alt=""></div><div class="v289-ledger"></div><div class="v289-turn"><b></b><small></small></div><div class="v289-head-actions"></div></div>',
 '<section class="v289-goals v289-plate"><h2>✧ <span></span></h2><div class="v289-goal-rows"></div></section>',
 '<section class="v289-factions v289-plate"><h2>⚜ <span></span></h2><div class="v289-faction-rows"></div></section>',
 '<div class="v289-foot"><section class="v289-mini v289-plate"><div class="v289-mini-head"><b>✥ <span></span></b><button type="button" class="v289-mini-collapse" aria-label="Minimap visibility">▤</button></div><div class="v289-mini-body"><div class="v289-mini-host"></div><div class="v289-mini-controls"></div></div></section>',
 '<nav class="v289-cards" aria-label="Game actions"></nav>',
 '<section class="v289-selected v289-plate"><div class="v289-selected-main"><img class="v289-selected-photo" src="ui-art-v263/bld_hall.webp" alt=""><div><h2></h2><p class="v289-selected-sub"></p><p class="v289-selected-status"></p></div></div><div class="v289-selected-actions"></div></section>',
 '<button class="v289-pause" type="button"><span class="v289-pause-glyph">Ⅱ</span><b></b></button></div>',
 '<div class="v289-mobile"><button type="button" data-panel="goals"></button><button type="button" data-panel="factions"></button><button type="button" data-panel="mini"></button></div>',
 '<section class="v289-diplomacy v289-plate" role="dialog" aria-label="Diplomacy" hidden><div class="v289-dialog-head"><h2></h2><button type="button" class="v289-dip-close" aria-label="Close">✕</button></div><div class="v289-dialog-list"></div><p class="v289-dialog-message" role="status"></p></section>'
 ].join('');
 const head=root.querySelector('.v289-head-actions');
 for(const [glyph,e,n,id] of [['?','Abi','Help','help'],['⚙','Seaded','Settings','menubtn'],['☰','Menüü','Menu','menubtn']]){
  const b=btn(head,'v289-head-button',tr(e,n),()=>id==='help'?document.querySelector('#tools [data-tab="help"]')?.click():legacy(id));b.textContent=glyph;
 }
 const ledger=root.querySelector('.v289-ledger');
 for(const [key,icon,e,n] of stats){
  const b=btn(ledger,'v289-stat',tr(e,n),()=>{
   if(key==='science')legacy('techtoggle');
   else if(key==='population')legacy('hud-city');
   else {const group={bread:'food',wood:'build',stone:'build',gold:'lux'}[key];document.querySelector('#resources .v264-chip[data-group="'+group+'"]')?.click();}
  });b.dataset.key=key;
  b.innerHTML='<img src="'+img(icon)+'" alt=""><span><small></small><strong></strong><em></em></span>';
 }
 const nav=root.querySelector('.v289-cards');
 for(const [key,icon,e,n,original] of cards){
  const b=btn(nav,'v289-action',tr(e,n),()=>original?legacy(original):openDiplomacy());b.dataset.action=key;
  const art=key==='research'?'ui-art-v288/research.svg':key==='diplomacy'?'ui-art-v288/diplomacy.svg':key==='trade'?'ui-art-v288/trade.svg':key==='empire'?'ui-art-v288/empire.svg':img(icon);
  b.innerHTML='<span class="v289-art"><img src="'+art+'" alt=""></span><span class="v289-label"></span>';
 }
 const controls=root.querySelector('.v289-mini-controls');
 for(const [t,g,id] of [['Map details','▤','hud-map-details'],['Zoom in','+','hud-zoom-in'],['Zoom out','−','hud-zoom-out']]){
  const b=btn(controls,'v289-map-button',t,()=>legacy(id));b.textContent=g;
 }
 root.querySelector('.v289-mini-collapse').onclick=()=>root.querySelector('.v289-mini').classList.toggle('v289-mini-folded');
 root.querySelector('.v289-pause').onclick=()=>legacy('pause');
 root.querySelector('.v289-dip-close').onclick=closeDiplomacy;
 // The V264 document-level click-away listener must not instantly close a panel
 // opened through our mirrored Army/City/Trade button on the same click.
 root.addEventListener('click',event=>{if(event.target.closest('button'))event.stopPropagation();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')closeDiplomacy();});
 for(const [panel,e,n] of [['goals','Ülesanded','Goals'],['factions','Riigid','Factions'],['mini','Kaart','Map']]){
  const b=root.querySelector('.v289-mobile [data-panel="'+panel+'"]');b.textContent=tr(e,n);
  b.addEventListener('click',()=>{const cl='v289-show-'+panel;const on=root.classList.contains(cl);root.classList.remove('v289-show-goals','v289-show-factions','v289-show-mini');if(!on)root.classList.add(cl);});
 }
}
function activate(){
 const enabled=document.body.classList.contains('ui-paint-v287')&&document.body.classList.contains('atlas');
 const currently=document.body.classList.contains('v289-active');
 if(enabled===currently)return;
 document.body.classList.toggle('v289-active',enabled);
 if(enabled){const canvas=$('atlasminimap');if(canvas){if(!home){home=document.createComment('v289-original-minimap');canvas.parentNode.insertBefore(home,canvas);}root.querySelector('.v289-mini-host').append(canvas);mini=canvas;}render(true);}
 else{if(mini&&home?.parentNode&&mini.parentNode!==home.parentNode)home.parentNode.insertBefore(mini,home);closeDiplomacy();}
}
function renderStats(s){
 for(const [key,ic,e,n] of stats){
  const el=root.querySelector('.v289-stat[data-key="'+key+'"]');el.querySelector('small').textContent=tr(e,n);
  let value='',gain='';
  if(key==='science')value=String(s?.researchRate??0);
  else if(key==='population')value=Number(s?.leaders?.[0]?.population||0).toLocaleString();
  else{
   const source=document.querySelector('#resources span[data-resource="'+key+'"]');
   value=source?.querySelector('b')?.textContent?.trim()||document.querySelector('#resources .v264-val[data-k="'+key+'"] i')?.textContent?.trim()||'0';
   gain=source?.querySelector('em')?.textContent?.trim()||'';
  }
  el.querySelector('strong').textContent=value;el.querySelector('em').textContent=gain;
 }
 root.querySelector('.v289-turn b').textContent=(s?.turn??'–')+' · '+(s?.age??'');
 root.querySelector('.v289-turn small').textContent=$('dayclock-v235')?.textContent?.trim()||'';
 const pause=root.querySelector('.v289-pause');pause.querySelector('b').textContent=s?.paused?tr('Jätka','Resume'):tr('Paus','Pause');
 pause.title=s?.paused?tr('Jätka mängu','Resume game'):tr('Peata mäng','Pause game');
}
function renderGoals(force){
 const src=[...document.querySelectorAll('#v51tips button')].slice(0,3);
 const signature=src.map(x=>x.textContent).join('|')+tr('e','n');if(!force&&signature===sigTips)return;sigTips=signature;
 root.querySelector('.v289-goals h2 span').textContent=tr('Soovitatud tegevused','Suggested Next Actions');
 const rows=root.querySelector('.v289-goal-rows');rows.replaceChildren();
 if(!src.length){const p=create('p','',rows);p.textContent=tr('Tutvu oma riigiga','Explore your kingdom');}
 src.forEach((original,index)=>{
  const b=btn(rows,'v289-goal',original.textContent||'',()=>document.querySelectorAll('#v51tips button')[index]?.click());
  b.innerHTML='<span class="v289-goal-icon">'+['⚒','⌂','⚗'][index]+'</span><span class="v289-goal-text"></span><span class="v289-goal-arrow">›</span>';
  b.querySelector('.v289-goal-text').textContent=(original.textContent||'').trim().replace(/\s+/g,' ').slice(0,105);
 });
}
function renderFactions(s,force){
 const leaders=s?.leaders||[];const signature=leaders.map(x=>[x.name,x.population,x.relation].join(':')).join('|')+tr('e','n');if(!force&&signature===sigFactions)return;sigFactions=signature;
 root.querySelector('.v289-factions h2 span').textContent=tr('Riigid ja suhted','Rivals & Factions');
 const rows=root.querySelector('.v289-faction-rows');rows.replaceChildren();
 leaders.forEach((f,i)=>{
  const b=btn(rows,'v289-faction',f.name,()=>f.team===0?legacy('hud-city'):openDiplomacy(f.team));
  b.innerHTML='<img src="'+img(['unit_spearman','unit_scout','unit_axeman','unit_slinger'][i%4])+'" alt=""><span><b></b><small></small></span><strong></strong>';
  b.querySelector('b').textContent=f.name;b.querySelector('small').textContent=f.team===0?tr('Sinu riik','Your kingdom'):f.relation;
  b.querySelector('strong').textContent=Number(f.population||0).toLocaleString();
 });
}
function renderSelected(force){
 const hud=$('commandhud'),kind=hud?.dataset.unitKind||'';
 const name=$('commandname')?.textContent?.trim()||'';
 const selected=!!kind&&!/vali üksus|select unit/i.test(name);
 const city=window.kingdomsUiV264?.cities?.()?.find(c=>c.type==='city');
 const title=selected?name:(city?.name||tr('Vali linn','Select city'));
 const sub=selected?($('commandmode')?.textContent?.trim()||tr('Üksus','Unit')):(city?tr('Linn · elanikke ','City · population ')+city.pop:tr('Maailmakaart','World map'));
 const status=selected?($('commandstate')?.textContent?.trim()||''):tr('Vali üksus või ava linn','Select an army or open a city');
 const src=selected?hud?.querySelector('.v263-portrait:not([hidden])')?.getAttribute('src')||img('unit_spearman'):img('bld_hall');
 const signature=[title,sub,status,src,selected].join('|')+tr('e','n');if(!force&&signature===sigSelection)return;sigSelection=signature;
 const box=root.querySelector('.v289-selected');
 box.querySelector('.v289-selected-photo').src=src;box.querySelector('h2').textContent=title;
 box.querySelector('.v289-selected-sub').textContent=sub;box.querySelector('.v289-selected-status').textContent=status;
 const actions=box.querySelector('.v289-selected-actions');actions.replaceChildren();
 const a=selected?[['➜','Liigu','Move','commandmove'],['⚔','Ründa','Attack','commandattack'],['■','Peata','Stop','commandstop'],['⋯','Käsud','Commands','hud-command-toggle']]:
 [['⚒','Ehita','Build','hud-build'],['⚔','Väed','Troops','hud-army'],['⚙','Juhi','Manage','hud-city'],['ℹ','Linn','City','opencity']];
 for(const [glyph,e,n,id] of a){const b=btn(actions,'v289-selected-button',tr(e,n),()=>legacy(id));b.innerHTML='<span>'+glyph+'</span><small>'+tr(e,n)+'</small>';b.disabled=!$(id)||$(id).disabled;}
}
function openDiplomacy(team=null){dipTeam=team;root.querySelector('.v289-diplomacy').hidden=false;renderDiplomacy();}
function closeDiplomacy(){dipTeam=null;if(root)root.querySelector('.v289-diplomacy').hidden=true;}
function renderDiplomacy(){
 const panel=root.querySelector('.v289-diplomacy');if(panel.hidden)return;
 panel.querySelector('h2').textContent=tr('Diplomaatia','Diplomacy');
 const content=panel.querySelector('.v289-dialog-list');content.replaceChildren();
 for(const f of (data()?.leaders||[]).filter(x=>x.team>0&&(dipTeam==null||dipTeam===x.team))){
  const row=create('div','v289-dip-row',content);create('strong','',row).textContent=f.name+' · '+f.relation;
  const buttons=create('div','v289-dip-buttons',row);
  for(const [code,e,n] of [['friendly','Sõprus','Friendship'],['neutral','Neutraalne','Neutral'],['war','Sõda','War']]){
   const b=btn(buttons,'v289-dip-option',tr(e,n),()=>{
    const res=api()?.diplomacy?.(f.team,code);
    panel.querySelector('.v289-dialog-message').textContent=res?.error||tr('Suhe muudetud','Relation updated');
    renderDiplomacy();renderFactions(data(),true);
   });b.textContent=tr(e,n);b.disabled=f.relation===code;
  }
 }
}
function render(force=false){
 if(!root||!document.body.classList.contains('v289-active'))return;
 const s=data();renderStats(s);renderGoals(force);renderFactions(s,force);renderSelected(force);
 const modal=['startmenu','help','researchpanel','journalpanel'].some(id=>$(id)&&!$(id).hidden);
 root.classList.toggle('v289-behind-modal',modal);
 for(const [key,e,n] of cards){const el=root.querySelector('.v289-action[data-action="'+key+'"]');el.querySelector('.v289-label').textContent=tr(e,n);}
 root.querySelector('.v289-mini-head span').textContent=tr('Maailmakaart','World Map');
}
function start(){
 build();activate();
 new MutationObserver(activate).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>render(true)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 setInterval(()=>{activate();render()},850);
 window.addEventListener('pagehide',()=>{if(mini&&home?.parentNode)home.parentNode.insertBefore(mini,home)},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();