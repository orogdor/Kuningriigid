const fs=require('fs'),path=require('path'),url=require('url');
const source=process.argv[2];
(async()=>{
 const campaign=await import(url.pathToFileURL(path.join(source,'campaign.js')).href);
 const core=await import(url.pathToFileURL(path.join(source,'civilization-core.js')).href);
 const b=JSON.parse(fs.readFileSync('tests/bow_stall_fixture.json','utf8'));
 const before=b.squads.filter(q=>q.kind==='iron_archer').map(q=>({x:q.x,z:q.z}));
 for(let step=0;step<12000&&!b.result;step++)campaign.tickBattle(b,.1,core.TROOPS,[1,1],null);
 const after=b.squads.filter(q=>q.kind==='iron_archer').map(q=>({x:q.x,z:q.z}));
 if(!after.some((q,i)=>Math.hypot(q.x-before[i].x,q.z-before[i].z)>1))throw Error('Bow squads remained stationary');
 if(!b.result)throw Error('Battle remained unresolved');
 console.log('WEB_BOW_STALL_OK',JSON.stringify({elapsed:b.elapsed,result:b.result,before,after}));
})().catch(e=>{console.error(e);process.exitCode=1});
