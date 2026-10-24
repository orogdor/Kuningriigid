// V148 browser check: the ten V124 battle replays (Stone Age … Modern) render the new
// soldier models, animate them while the battle runs and produce no page errors.
// Needs a static server on 127.0.0.1:8765 (python3 -m http.server 8765).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out = 'artifacts-v148'; fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const results = [];
const ids = (process.env.V148_REPLAYS || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
try {
  for (const id of ids) {
    for (const mobile of id === 6 ? [false, true] : [false]) {
      const context = await browser.newContext({viewport: mobile ? {width: 390, height: 844} : {width: 1366, height: 768}, isMobile: mobile, hasTouch: mobile});
      if (mobile) await context.addInitScript(() => localStorage.setItem('kingdoms-quality', 'low'));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:8765/?v=148&demo=v124-' + id, {waitUntil: 'domcontentloaded', timeout: 60000});
      await page.waitForFunction(i => window.gameDebug?.state?.battle?.testReplayV124?.id === i, id, {timeout: 150000});
      const count = () => page.evaluate(() => {
        const kinds = {}, legacy = {};
        let v148 = 0, instanced = 0;
        window.gameDebug.localScene.traverse(o => {
          if (o.name?.startsWith('v148:')) { v148++; kinds[o.name.slice(5)] = (kinds[o.name.slice(5)] || 0) + 1; }
          if (o.isInstancedMesh && o.material?.name?.startsWith('v148')) instanced += o.count;
          if (o.userData?.rig && !o.userData.v148 && o.userData.unitKind) legacy[o.userData.unitKind] = (legacy[o.userData.unitKind] || 0) + 1;
        });
        return {v148, instanced, kinds, legacy};
      });
      const before = await count();
      await page.screenshot({path: `${out}/replay-${id}${mobile ? '-mobile' : ''}-start.png`, timeout: 120000});
      // run the battle for a few seconds so soldiers march and fight
      await page.evaluate(() => document.getElementById('pause')?.click());
      await page.waitForTimeout(6000);
      const snap = () => page.evaluate(() => {
        const v = [];
        window.gameDebug.localScene.traverse(o => { if (o.name?.startsWith('v148:') && v.length < 400) { const b = o.userData.rig.bones; v.push(b.chest.rotation.x, b.head.rotation.y, b.upperArm_R.rotation.x, b.thigh_L.rotation.x); } });
        return v;
      });
      const fps = () => page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
      const a = await snap(); const rate = await fps(); const b2 = await snap();
      let moved = 0; for (let i = 0; i < a.length; i += 4) if ([0, 1, 2, 3].some(k => Math.abs(a[i + k] - b2[i + k]) > 1e-4)) moved++;
      const pose = {moved, total: a.length / 4, fps: +rate.toFixed(1), elapsed: await page.evaluate(() => window.gameDebug.state.battle?.elapsed)};
      await page.screenshot({path: `${out}/replay-${id}${mobile ? '-mobile' : ''}-fight.png`, timeout: 120000});
      const r = {id, mobile, before, pose, errors};
      results.push(r);
      console.log('V148_REPLAY', JSON.stringify(r));
      assert.deepEqual(errors, [], 'no page errors');
      assert.ok(before.v148 > 20, `replay ${id}: new soldier models in the battle`);
      assert.ok(before.instanced > 0, `replay ${id}: V148 soldiers are drawn through the instanced soldier batch`);
      assert.ok(pose.moved > 0, `replay ${id}: soldiers animate`);
      await context.close();
    }
  }
  fs.writeFileSync(out + '/test-results.json', JSON.stringify(results, null, 2));
  console.log('V148 BROWSER PASS');
} finally { await browser.close(); }
