const path=require('path'),{pathToFileURL}=require('url');
const hash=text=>[...text].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0);
(async()=>{
 const {Civilization,createGame}=await import(pathToFileURL(path.join(process.argv[2],'civilization-core.js')));
 for(const {seed,type} of [{seed:'20261123',type:'inland'},{seed:'42',type:'inland'},{seed:'12345',type:'inland'},{seed:'42',type:'continents'},{seed:'42',type:'tectonic'},{seed:'12345',type:'continents'},{seed:'12345',type:'tectonic'}]){
  if(process.argv.length>3&&!process.argv.slice(3).includes(type))continue;
  const state=createGame(hash(seed),type);state.migrationV274={until:120};state.peaceUntilV276=1200;
  const game=new Civilization(state);
  for(let i=0;i<484;i++){
   game.tick(.25);
   if(type==='continents'&&seed==='42'&&i===431)console.log('WEB_MIGRATION_SUGGESTIONS',JSON.stringify(game.siteSuggestionsV280(3)));
  }
  console.log('WEB_SEED_CITIES',JSON.stringify({seed,type,cities:game.s.cities.map(c=>({team:c.team,c:c.c,r:c.r}))}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
