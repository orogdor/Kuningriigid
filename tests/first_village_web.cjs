const path=require('path'),{pathToFileURL}=require('url');
(async()=>{
 const root=process.argv[2];
 const {Civilization,createGame}=await import(pathToFileURL(path.join(root,'civilization-core.js')));
 const {stoneVillageFoundingTileV169:select}=await import(pathToFileURL(path.join(root,'stone-village-site-v169.js')));
 const {reserveStoneVillageRingV168:reserve}=await import(pathToFileURL(path.join(root,'stone-village-defenses-v166.js')));
 const game=new Civilization(createGame(2374510691,'inland'));
 const cells=new Map([[10,{c:10,r:10,land:true,deposits:{wood:true,stone:true}}],[11,{c:11,r:10,land:true,deposits:{wood:true,stone:true}}]]);
 const mock={s:{seed:1,ages:[0,0],cities:[]},cell:p=>p.r===10?cells.get(p.c):null,territoryOwner:()=>null,landPath:()=>[],nav:cell=>({passable:(x)=>cell.c===11||x<10})};
 const shifted=select(mock,{team:1,c:10,r:10},cells.get(10));if(shifted.c!==11||shifted.r!==10)throw Error('Web blocked-perimeter reference failed');
 console.log('WEB_FIRST_VILLAGE_BLOCKED_OK');
 const cases=[{team:1,start:{c:179,r:14},target:{c:179,r:14}},{team:2,start:{c:40,r:149},target:{c:40,r:147}},{team:3,start:{c:163,r:150},target:{c:163,r:150}}];
 for(const test of cases){const settler={team:test.team,...test.start};const target=game.cell(test.target);const selected=select(game,settler,target);const fake={...test.target,team:test.team,economy:{buildings:[{type:'hall',hp:1200,ready:true,x:-18,z:-12}]}};const survey=reserve(game,fake);const nav=game.nav(target);console.log('WEB_FIRST_VILLAGE',JSON.stringify({...test,blocked:survey?.terrainBlockedAtFounding,wood:target.deposits?.wood,stone:target.deposits?.stone,preferred:[-4,0,4].every(dx=>[-4,0,4].every(dz=>nav.passable(-18+dx,-12+dz))),path:game.landPath(settler,target,test.team)?.length,selected:{c:selected.c,r:selected.r}}));}
 if(process.argv.includes('--scan')){
  const settler={team:2,c:40,r:149};let found=0;
  for(let r=144;r<=152&&found<3;r++)for(let c=36;c<=44&&found<3;c++){
   const target=game.cell({c,r});if(!target?.land||target.mountain||!target.deposits?.wood||!target.deposits?.stone)continue;
   const selected=select(game,settler,target);if(selected.c!==c||selected.r!==r){console.log('WEB_SHIFT',JSON.stringify({target:{c,r},selected:{c:selected.c,r:selected.r}}));found++;}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
