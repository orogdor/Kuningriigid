import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),arg=name=>args.includes(name)?args[args.indexOf(name)+1]:null,root=path.resolve(arg('--source')||new URL('../../',import.meta.url).pathname);
const load=name=>import(pathToFileURL(path.join(root,name)).href),{tickDeployments}=await load('campaign.js'),{Navigation}=await load('navigation.js'),{TROOPS}=await load('civilization-core.js'),{squadRadius}=await load('soldier-collision-v90.js');
const cases=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url))),reports=[],allStart=performance.now();let failures=0;
for(const fixture of cases.filter(c=>!arg('--case')||c.id===arg('--case'))){
 const kind=fixture.kind||'spearman',positions=[...fixture.starts,...fixture.parked||[]],units=positions.map(()=>({kind,team:0,armyId:0,hp:125,maxHp:125}));
 const tile=Object.fromEntries(positions.map(([x,z],i)=>[i,{x,z,target:i<fixture.starts.length?(fixture.goals?{x:fixture.goals[i][0],z:fixture.goals[i][1]}:{...fixture.goal}):null}])),camp={armies:[{id:0,team:0,c:10,r:10}],deployments:{'10:10':tile}};
 const buildings=fixture.buildings.map(b=>({...b,hp:100,ready:true})),terrain=(x,z)=>!fixture.gate||Math.abs(x-fixture.gate.x)>1.5||Math.abs(z)<fixture.gate.halfWidth;
 const nav=new Navigation({resources:[]},terrain,()=>buildings,{minX:-85,minZ:-65,w:171,h:131}),r=squadRadius(units[0]),start=performance.now();const crossed=new Set();let maxZ=0,steps=0,minClearance=Infinity,stagnant=0,previous=positions.map(([x,z])=>({x,z})),failure=null;
 try{
  for(const p of Object.values(tile))assert.ok(nav.open(p.x,p.z),'fixture must start on passable ground');
  for(;steps<fixture.maxSeconds*20&&Object.values(tile).some(p=>p.target);steps++){
   const oldX=Object.values(tile).map(p=>p.x);tickDeployments(camp,units,TROOPS,.05,()=>nav);
   const values=Object.values(tile);
   for(let i=0;i<values.length;i++){
    assert.ok(nav.open(values[i].x,values[i].z),'must not walk through houses/walls');maxZ=Math.max(maxZ,Math.abs(values[i].z));if(fixture.gate&&((oldX[i]<0&&values[i].x>=0)||(oldX[i]>0&&values[i].x<=0))&&Math.abs(values[i].z)<2)crossed.add(i);
    for(let j=0;j<i;j++){const clearance=Math.hypot(values[i].x-values[j].x,values[i].z-values[j].z)-r*2;minClearance=Math.min(minClearance,clearance);assert.ok(clearance>=-.001,'must not walk through another formation');}
   }
   if((steps+1)%100===0){const movement=values.reduce((n,p,i)=>n+Math.hypot(p.x-previous[i].x,p.z-previous[i].z),0);stagnant=movement<.5?stagnant+5:0;previous=values.map(p=>({x:p.x,z:p.z}));assert.ok(stagnant<15,'no progress/oscillation for 15 simulation seconds');}
  }
  assert.ok(Object.values(tile).every(p=>!p.target),'every ordered formation must arrive and clear its order');
  if(fixture.gate)assert.equal(crossed.size,fixture.starts.length,'every formation must pass through the gate');
  if(fixture.id==='gate-counterflow')assert.ok(maxZ>5,'waiting formation must yield out of the opposing lane');
  assert.ok(Object.values(tile).slice(0,fixture.starts.length).every((p,i)=>Math.hypot(p.x-(fixture.goals?.[i][0]??fixture.goal.x),p.z-(fixture.goals?.[i][1]??fixture.goal.z))<r*7+5),'arrival slots must remain near the ordered area');
 }catch(e){failures++;failure=e.message;}
 const report={id:fixture.id,passed:!failure,failure,simulationSeconds:steps*.05,wallSeconds:(performance.now()-start)/1000,minClearance,maxZ,crossed:[...crossed],positions:Object.values(tile).map(p=>({x:p.x,z:p.z,pending:!!p.target})),fixture};reports.push(report);console.log(JSON.stringify({...report,fixture:undefined}));
}
const result={passed:failures===0,cases:reports.length,failures,wallSeconds:(performance.now()-allStart)/1000,reports};
if(arg('--report')){fs.mkdirSync(path.dirname(arg('--report')),{recursive:true});fs.writeFileSync(arg('--report'),JSON.stringify(result,null,2));}
if(args.includes('--expect-failure'))assert.ok(failures>0,'baseline must reproduce at least one regression');else assert.equal(failures,0,'traffic regression failed');
