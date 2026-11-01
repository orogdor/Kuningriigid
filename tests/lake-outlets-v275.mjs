// V275: some large lakes drain to the sea through a wide, navigable river that is connected cell by cell.
import {Civilization,createGame} from '../civilization-core.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(createGame(77,'tectonic'));
const outlet=g.cells.filter(c=>c.lakeOutletV275);
ok(g.lakeOutletsV275>=1&&outlet.length>0,'seed 77 has lake outlets');
for(const c of outlet){ok(c.river&&c.riverNavigable&&c.riverWidth>=7&&c.riverWidth<=16,'wide navigable outlet cell');
 const to=g.cell(c.riverTo);ok(to,'outlet flows to a neighbour');ok(Math.abs(to.c-c.c)+Math.abs(to.r-c.r)===1,'adjacent step');}
// every outlet chain ends in water
for(const start of outlet){let c=start,guard=0;while(c&&c.land&&guard++<200){if(!c.riverTo)break;c=g.cell(c.riverTo);}ok(c&&!c.land,'outlet reaches water');}
const old=createGame(77,'tectonic');delete old.lakeOutletsV275;ok(!new Civilization(old).cells.some(c=>c.lakeOutletV275),'saved worlds without the flag keep their rivers');
console.log('lake outlets V275 ok:',g.lakeOutletsV275,'outlets,',outlet.length,'cells');
