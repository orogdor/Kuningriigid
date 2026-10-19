// V69 non-gameplay HUD behaviour. All major actions are dispatched by civilization.js.
const id=name=>document.getElementById(name);
const body=document.body;
function openMapActions(show){
 const open=!!show&&body.classList.contains('atlas');
 body.classList.toggle('hud-map-open',open);
 id('hud-map-details')?.setAttribute('aria-expanded',String(open));
 if(open)body.classList.remove('hud-city-overview');
}
id('hud-map-details')?.addEventListener('click',()=>openMapActions(!body.classList.contains('hud-map-open')));
id('hud-close-map')?.addEventListener('click',()=>openMapActions(false));
id('hud-cities-overview')?.addEventListener('click',()=>{
 const show=!body.classList.contains('hud-city-overview');
 openMapActions(false);
 body.classList.toggle('hud-city-overview',show);
});
id('hud-objective-toggle')?.addEventListener('click',()=>{
 const closed=body.classList.toggle('hud-objective-closed');
 id('hud-objective-toggle').setAttribute('aria-expanded',String(!closed));
 id('hud-objective-toggle').textContent=closed?'⌄':'⌃';
});
id('menubtn')?.addEventListener('click',()=>{body.classList.remove('hud-map-open','hud-city-open','hud-city-overview')});
id('techtoggle')?.addEventListener('click',()=>{body.classList.remove('hud-map-open','hud-city-overview')});
id('hud-help')?.addEventListener('click',()=>{
 id('startmenu').hidden=true;
 id('help').hidden=false;
});
id('closehelp')?.addEventListener('click',()=>{if(body.classList.contains('hud-help-from-menu')){id('startmenu').hidden=false;body.classList.remove('hud-help-from-menu')}});
document.querySelectorAll('#tools button').forEach(button=>{
 button.setAttribute('type','button');
});
// Close overlays with Escape while leaving the game keyboard handler intact.
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 if(body.classList.contains('hud-map-open')){openMapActions(false);event.stopImmediatePropagation();}
 else if(body.classList.contains('hud-city-overview')){body.classList.remove('hud-city-overview');event.stopImmediatePropagation();}
});
