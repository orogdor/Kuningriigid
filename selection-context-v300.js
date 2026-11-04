/* V300: pure visual command catalogue, backed by real Kuningriigid game IDs.
 * No guessed attacks, no invented gameplay; the live selection snapshot controls
 * every icon. Four painted buttons always occupy the same image coordinates. */
(function(){
 'use strict';
 const command=(icon,ee,en,target,disabled=false)=>({icon,ee,en,target,disabled:!!disabled});
 function actions(sel={},view='world'){
  const k=sel.kind||'none',own=sel.own!==false,movable=!!sel.movable&&own;
  if(k==='city')return [
   command('city','Linna ülevaade','City overview',view==='local'?['citytab-info','hud-city']:['hud-city']),
   command('build','Ehita','Build',['hud-build']),
   command('recruit','Värba','Recruit',['hud-army']),
   command('trade','Kaubandus','Trade',['hud-trade-v276'])
  ];
  if(k==='worker')return [
   command('move','Liigu','Move',['commandmove'],!movable),
   command('build','Ehita või asuta','Build or settle',view==='world'?['foundcity','hud-build']:['hud-build'],!own),
   command('resources','Ressursid','Resources',['hud-resource-toggle']),
   command('stop','Peata','Stop',['commandstop'],!movable)
  ];
  if(k==='unit')return [
   command('move','Liigu','Move',['commandmove'],!movable),
   sel.attackable&&own
    ?command('attack','Ründa','Attack',['commandattack'])
    :sel.scout&&own
     ?command('explore','Avasta','Explore',['commandexplore'])
     :command('recruit','Armeed','Armies',['hud-army']),
   command('stop','Peata','Stop',['commandstop'],!movable),
   command('focus','Keskenda','Focus',['commandfocus'])
  ];
  if(k==='building')return [
   command('info','Hoone teave','Building info',['citytab-info','hud-city']),
   command('build','Ehitus','Construction',['hud-build']),
   command('workers','Töölised','Workers',['citytab-workers']),
   command('focus','Keskenda','Focus',['commandfocus'])
  ];
  if(k==='trade')return [
   command('trade','Kaubandus','Trade',['hud-trade-v276']),
   command('world','Kaart','Map',['maptoggle']),
   command('journal','Sündmused','Journal',['journal']),
   command('focus','Keskenda','Focus',['commandfocus'])
  ];
  return [
   command('world','Vaheta kaarti','Switch map',['maptoggle']),
   command('science','Avastused','Research','research'),
   command('journal','Sündmused','Journal',['journal']),
   command('diplomacy','Diplomaatia','Diplomacy','diplomacy')
  ];
 }
 window.KuningriigidSelectionV300={actions};
})();