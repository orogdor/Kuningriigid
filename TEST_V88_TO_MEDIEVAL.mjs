import {execFileSync} from 'node:child_process';
import {Civilization,createGame} from './civilization-core.js';
import {CampaignLog} from './campaign-log-v88.mjs';
const seed=8417,game=new Civilization(createGame(seed));
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const entered=[0,0,0,0],previous=[...game.s.ages],transitions=[];
const turn=time=>+(time/60).toFixed(4),log=new CampaignLog(game,'V88_POOLHIND_TEST',revision);
let outcome,failed=[];
log.observe();log.snapshot(entered);
for(let tick=0;!outcome;tick++){
 if(tick%24===0)game.aiTeam(0);
 for(let team=0;team<4;team++)if(game.s.ages[team]>=3)game.s.research[team].paused=true;
 game.tick(.5);log.observe();
 for(let team=0;team<4;team++)if(game.s.ages[team]!==previous[team]){
  const event={team,from:previous[team],to:game.s.ages[team],turn:turn(game.s.time),duration:turn(game.s.time-entered[team])};
  transitions.push(event);log.event('era_changed',event);console.log('ERA '+JSON.stringify(event));
  entered[team]=game.s.time;previous[team]=game.s.ages[team];
 }
 failed=[0,1,2,3].filter(team=>game.s.ages[team]<3&&game.s.time-entered[team]>=6000);
 if(failed.length)outcome='STOP_100_TURNS';else if(game.s.ages.every(age=>age>=3))outcome='ALL_MEDIEVAL';
 if((tick+1)%120===0)log.snapshot(entered);
 if((tick+1)%1200===0)console.log('PROGRESS '+turn(game.s.time)+' '+JSON.stringify(game.s.ages));
 // Research/discovery display queues do not affect simulation; drain them.
 game.researchEvents.length=0;game.discoveryEvents.length=0;
}
const report=log.finish({seed,revision,outcome,stopTurn:turn(game.s.time),failed,transitions,nations:log.snapshot(entered)});
console.log('RESULT '+JSON.stringify({outcome,stopTurn:report.stopTurn,failed}));
