// Ownership remapping only. No resources, technology, buildings or troops added.
export function takeOverAI(input,sourceTeam=1){
 if(![1,2,3].includes(sourceTeam))throw Error('Vali AI riik 1–3.');
 const s=JSON.parse(JSON.stringify(input)),swap=n=>n===0?sourceTeam:n===sourceTeam?0:n;
 const teamFields=new Set(['team','ownerTeam','claimedBy','guardOwner','winner','pursuitStoppedTeam','enemyTeam','targetTeam']);
 function rekey(v){return Object.fromEntries(Object.entries(v||{}).map(([k,x])=>[String(swap(Number(k))),x]));}
 function walk(obj){
  if(!obj||typeof obj!=='object')return;
  for(const [key,value]of Object.entries(obj)){
   if(key==='ironAITestV128')continue;
   if(teamFields.has(key)&&Number.isInteger(value)&&value>=0&&value<=3){obj[key]=swap(value);continue;}
   if(['realms','ages','research','explored','coastalStartPositions'].includes(key)&&Array.isArray(value)&&value.length===4){[value[0],value[sourceTeam]]=[value[sourceTeam],value[0]];}
   if(key==='blockedMerchants')obj[key]=rekey(value);
   walk(obj[key]);
  }
 }
 walk(s);
 for(const key of ['aiRecruitAt','aiSettlerLastAt','aiLastWarAt','enemyIntel'])if(s[key])s[key]=rekey(s[key]);
 const primary=s.armies.slice(0,4);[primary[0],primary[sourceTeam]]=[primary[sourceTeam],primary[0]];
 s.armies=[...primary,...s.armies.slice(4)];
 s.relations=Object.fromEntries(Object.entries(s.relations||{}).map(([key,r])=>[key.split(':').map(Number).map(swap).sort((a,b)=>a-b).join(':'),r]));
 s.factionNames=['Kadaka','Ida','Põhja','Lõuna'];[s.factionNames[0],s.factionNames[sourceTeam]]=[s.factionNames[sourceTeam],s.factionNames[0]];
 s.demo='iron-ai';s.takeoverV128={sourceTeam,name:s.factionNames[0],turn:s.ironAITestV128?.turn||Math.floor(s.time/60)};
 s.events.push({time:s.time,text:'Mängija võttis üle AI riigi '+s.factionNames[0]+'. Kõik ressursid ja üksused pärinevad testmängust.'});
 return s;
}
export async function loadIronAITest(fetcher=fetch){
 const response=await fetcher('./scenarios/iron-ai-v128.json?v=128a');
 if(!response.ok)throw Error('Rauaaja AI testsalvestust ei saanud laadida ('+response.status+').');
 return takeOverAI(await response.json(),1);
}
