'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../windows');
test('V330 comparison EXE has an independent application identity and no automatic update',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const main=fs.readFileSync(path.join(root,'main.cjs'),'utf8');
 assert.equal(p.build.appId,'ee.kuningriigid.v330.frozen');
 assert.equal(p.build.productName,'Kuningriigid V330 Frozen');
 assert.equal(p.build.win.artifactName,'Kuningriigid-V330-FROZEN-win-${arch}.${ext}');
 assert.match(main,/const FROZEN_V330=true/);
 assert.match(main,/if\(!smoke&&!FROZEN_V330\).*checkUpdate\(\)/);
 assert.match(main,/if\(FROZEN_V330\)await store\.setState\(\{active:store\.base\.version,previous:null,pending:null,booting:false,blocked:null\}\)/);
 assert.match(main,/if\(!smoke\)app\.setPath\('userData'.*Kuningriigid-V330-Frozen/);
 assert.match(main,/if\(FROZEN_V330\)return;if\(await saved\(\)\)/);
});
