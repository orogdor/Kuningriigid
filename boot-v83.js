// Keep the menu actionable only after the simulation and renderer have loaded.
// Import failures and unsupported WebGL must produce visible recovery guidance.
const status=document.getElementById('menu-status');
const english=()=>document.getElementById('menulanguage')?.value!=='et';
try{
 await import('./civilization.js?v=137a');
 if(!window.gameDebug)throw new Error('Game initialization did not finish');
 for(const id of ['continue','newgame','quality','v51export','v51import'])document.getElementById(id).disabled=false;
 status.hidden=true;
}catch(error){
 console.error('Game startup failed:',error);
 document.getElementById('startmenu').hidden=false;
 status.classList.add('menu-error');status.hidden=false;
 status.textContent=english()?'The game could not start. Error: '+String(error?.message||error):'Mängu käivitamine ebaõnnestus. Viga: '+String(error?.message||error);
 const retry=document.createElement('button');retry.textContent=english()?'Reload page':'Laadi leht uuesti';retry.onclick=()=>location.reload();status.append(retry);
 const details=document.createElement('details'),summary=document.createElement('summary'),message=document.createElement('p');
 summary.textContent=english()?'Error details':'Vea üksikasjad';details.open=true;message.style.whiteSpace='pre-wrap';message.style.overflowWrap='anywhere';message.textContent=String(error?.stack||error?.message||error);
 details.append(summary,message);status.append(details);
}
