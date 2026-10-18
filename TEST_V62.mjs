import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {COLS,ROWS} from './campaign.js';
import {COAST_START_DISTANCE} from './coastal-starts.js';

const directions=[[1,0],[-1,0],[0,1],[0,-1]];
const coastNeighbors=(game,p)=>directions.map(([dc,dr])=>game.cell({c:p.c+dc,r:p.r+dr})).filter(c=>c&&!c.land).length;
const nearLand=(game,p)=>{let n=0;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const c=game.cell({c:p.c+dc,r:p.r+dr});if(c?.land&&!c.mountain)n++}return n};
let count=0;
for(const mode of ['continents','inland']){
 for(const seed of [17,31,77,12345,777,20261018,42,999,13579,982451]){
  const state=createGame(seed,mode),game=new Civilization(state),start=state.coastalStartPositions;
  assert.equal(start.length,4,'all factions get start');
  assert.equal(game.s.version,4,'save format stays unchanged');
  assert.equal(game.s.coastalStartsVersion,1);
  assert.equal(game.cells.length,COLS*ROWS);
  assert.equal(state.settlers.length,4);
  for(let i=0;i<4;i++){
   const pos=start[i],cell=game.cell(pos);
   assert.deepEqual({c:state.settlers[i].c,r:state.settlers[i].r},pos,'settler starts on resolved coast');
   assert.deepEqual({c:state.armies[i].c,r:state.armies[i].r},pos,'army shares coast');
   assert.ok(cell.land&&!cell.mountain,'capital is on dry traversable land: '+mode+' '+seed+' '+i);
   assert.ok(coastNeighbors(game,pos)>=1,'real ocean is directly adjacent: '+mode+' '+seed+' '+i+' '+JSON.stringify(pos));
   assert.ok(nearLand(game,pos)>=9,'capital has buildable hinterland: '+mode+' '+seed+' '+i);
   assert.ok(cell.deposits.wood&&cell.deposits.stone&&cell.deposits.water&&cell.deposits.game,
     'starting resources remain available');
   for(let j=0;j<i;j++)assert.ok(Math.hypot(pos.c-start[j].c,pos.r-start[j].r)>=COAST_START_DISTANCE);
  }
  // Opening a save after the settler or army has moved must NOT reposition it.
  state.settlers[0].c+=2;state.settlers[0].r+=1;state.armies[0].c+=2;state.armies[0].r+=1;
  const saved=JSON.parse(JSON.stringify(game.s));
  const reload=new Civilization(saved);
  assert.deepEqual(reload.s.coastalStartPositions,start);
  assert.equal(reload.s.settlers[0].c,state.settlers[0].c);
  assert.equal(reload.s.armies[0].r,state.armies[0].r);
  const check=reload.cell(start[0]);
  assert.ok(check.land&&!check.mountain&&coastNeighbors(reload,start[0])>0,'coast stays deterministic on reload');
  count++;
  console.log('V62 coast',mode,seed,JSON.stringify(start));
 }
}
// Old V61 games never receive new coordinates or topology when opened.
const old=createGame(73,'continents');
delete old.coastalStartsVersion;
const oldPosition={c:old.settlers[0].c,r:old.settlers[0].r};
const oldGame=new Civilization(old);
assert.equal(old.coastalStartPositions,undefined);
assert.deepEqual({c:old.settlers[0].c,r:old.settlers[0].r},oldPosition);
assert.deepEqual(oldGame.startLocations[0],oldPosition);
console.log('V62 PASS: '+count+' worlds, four direct-coast starts per world, intact old saves');
