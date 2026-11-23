const path=require('path'),url=require('url'),assert=require('assert');
(async()=>{
 const {tacticalGoal}=await import(url.pathToFileURL(path.join(process.argv[2],'historical-tactics-v92.js')).href);
 const bow={team:0,kind:'iron_archer',x:0,z:0,hp:100,battleSide:1,formation:'loose',tacticalRole:'missile',ammoRemaining:10,deployment:{x:0,z:0}};
 const enemy={team:1,kind:'iron_archer',x:20,z:0,hp:100},battle={elapsed:100},stats={range:17};
 assert(tacticalGoal(bow,enemy,[bow,enemy],battle,stats).x>0);
 enemy.x=10;assert.equal(tacticalGoal(bow,enemy,[bow,enemy],battle,stats),null);
 bow.formation='hold';bow.anchor={x:0,z:0};enemy.x=20;
 assert.equal(tacticalGoal(bow,enemy,[bow,enemy],battle,stats).x,0);
 bow.kind='crossbowman';bow.formation='loose';assert.equal(tacticalGoal(bow,enemy,[bow,enemy],battle,stats),null);
 console.log('WEB_BOW_GOAL_OK');
})().catch(e=>{console.error(e);process.exitCode=1});
