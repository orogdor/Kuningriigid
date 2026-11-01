// V276: fisher huts can be placed on a river bank; river tiles carry fish reachable from a riverside town;
// new games have 20 minutes of peace.
import {Civilization,createGame} from '../civilization-core.js';
import {riverBankPlacement,coastalSites} from '../resource-sites-v88.js';
import {fishingBanks} from '../fishery.js';
import {atWar,peaceV276} from '../diplomacy-v87.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(createGame(20261103,'tectonic'));
const river=g.cells.find(c=>c.land&&c.river&&!c.mountain&&c.riverWidth>=3&&!c.coast);
ok(river,'an inland river tile exists');
ok(river.deposits.fish&&river.fishDepth===1,'river tile has fish');
ok(fishingBanks(g,river,0).some(b=>b.cell===river),'a riverside town can fish its own river');
const sites=coastalSites(g,river,'fisher');
ok(sites.length>0,'fisher sites found on the river bank: '+sites.length);
const p=riverBankPlacement(g,river,'fisher',sites[0]);
ok(!p.error&&p.riverBankV276&&p.landEntry,'river-bank placement valid');
const s={time:10,peaceUntilV276:1200,diplomacy:{}};ok(peaceV276(s)&&!atWar(s,0,1),'no war during the first 20 minutes');
console.log('river bank V276 ok:',sites.length,'sites');
