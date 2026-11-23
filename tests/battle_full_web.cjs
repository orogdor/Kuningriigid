const fs=require('fs'),path=require('path'),url=require('url');
(async()=>{
 const dir=process.argv[2];const campaign=await import(url.pathToFileURL(path.join(dir,'campaign.js')).href);
 const formations=await import(url.pathToFileURL(path.join(dir,'formations-v94.js')).href),core=await import(url.pathToFileURL(path.join(dir,'civilization-core.js')).href);
 const fixture=JSON.parse(fs.readFileSync('tests/battle_fixture.json','utf8')),b=structuredClone(fixture.initial);let ci=0;
 for(let step=0;step<18000&&!b.result;step++){
  while(ci<fixture.commands.length&&fixture.commands[ci].at<=b.elapsed+1e-8){const c=fixture.commands[ci++],u=b.squads.find(q=>q.source===c.source);
   if(c.kind==='manual_move'){u.combatMode='manual';u.target={x:c.x,z:c.z};u.attackTargetSource=null;u.manualOrder=true;u.advance=false;}
   else if(c.kind==='auto'){u.combatMode='auto';u.target=null;u.attackTargetSource=null;u.manualOrder=false;u.anchor={x:u.x,z:u.z};u.advance=true;}
   else if(c.kind==='formation')formations.setFormation(u,c.value,core.TROOPS,b.elapsed,true);
  }
  campaign.tickBattle(b,.1,core.TROOPS,[1,1],null);
 }
 console.log('WEB_BATTLE_FINAL',JSON.stringify({elapsed:b.elapsed,result:b.result,winner:b.winnerTeam,casualties:b.casualties}));
 if(!b.result)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
