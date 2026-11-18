// V361 from clean main/V358; never the rejected V359/V360 designs.
import fs from 'node:fs';
let html=fs.readFileSync('majaehitaja/index.html','utf8');
const read=p=>fs.readFileSync('tools/mesopotamian-v361/'+p,'utf8');
function change(old,newer,count=1){
 const n=html.split(old).length-1;
 if(n!==count)throw Error('Expected '+count+'x, found '+n+' for '+old.slice(0,95));
 html=html.replace(old,newer);
}
function replaceBetween(a,b,newer){
 const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
 if(start<0||end<0||html.indexOf(a,start+a.length)>=0)throw Error('Missing/ambiguous block '+a);
 html=html.slice(0,start)+newer+html.slice(end);
}
change('const wallWalk={width:1.04,deck:1.52,parapet:.38};',
 'const wallWalk={width:1.34,deck:2.22,parapet:1.07};');
change('const run=Math.min(2.65*m,length-1.13*m)',
 'const run=Math.min(3.35*m,length-1.13*m)');
change('const length=from.distanceTo(to),rise=wallWalk.deck,steps=10;',
 'const length=from.distanceTo(to),rise=wallWalk.deck,steps=Math.max(13,Math.ceil(rise/.17));');
// Helpers may refer to terrainBatch defined later in createHutView; all are
// invoked only after createHutView has initialized.
change('  function gateModel(gate){',read('meso-v361-helpers.txt')+'\n  function gateModel(gate){');
change('    if(size<.16)return;\n    const from=place(gate.a),to=place(gate.b);',
 '    if(size<.16)return;\n    if(stone){mesoGateStoneV361(gate);return;}\n    const from=place(gate.a),to=place(gate.b);');
replaceBetween('  function defenseCornerCaps(fences){','  function wallSteps(plan){',
 read('meso-v361-corners.txt'));
replaceBetween('  function fortificationMasonry(a,b,bottom,top,width,seed,bronze){',
 '  function buildFence(fence,index,access,corners){',read('meso-v361-wall.txt'));
replaceBetween('  function stoneTowerShell(state,display,spans,withRoof){',
 '  function towerTops(display,withRoof){',read('meso-v361-tower.txt'));
change('    if(withRoof)ironTowerRoof(x0,x1,z0,z1,top,state);',
 read('meso-v361-iron-crown.txt'));
change("catalog['stonetower@2']={...oldIronTower,roofForm:'gable'",
 "catalog['stonetower@2']={...oldIronTower,roofForm:'battlement'");
fs.writeFileSync('majaehitaja/index.html',html,'utf8');
const path='house-designs-v354.js';
let designs=fs.readFileSync(path,'utf8');
if(!designs.includes("MODEL_VERSION='358a'")||
  !designs.includes("?v=358a"))throw Error('Expected main V358 model cache');
designs=designs.replace("MODEL_VERSION='358a'","MODEL_VERSION='361a'")
 .replace("?v=358a","?v=361a");
fs.writeFileSync(path,designs,'utf8');
console.log('V361 Mesopotamian walls, squared towers, stone gate and cache 361a ready');
