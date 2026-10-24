// V149 browser check: the world map and a detail map use the new terrain, water and road
// shaders, river/road geometry still exists, and the page has no errors (high and low quality).
// Needs a static server on 127.0.0.1:8765 (python3 -m http.server 8765).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out = 'artifacts-v149'; fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const results = [];
try {
  for (const quality of ['high', 'low']) {
    const context = await browser.newContext({viewport: {width: 1280, height: 760}});
    await context.addInitScript(q => localStorage.setItem('kingdoms-quality', q), quality);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/?demo=ai-iron-v143&v=149', {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.gameDebug && document.getElementById('menu-status').hidden, {timeout: 200000});
    const scan = scene => page.evaluate(which => {
      const keys = {}, s = which === 'world' ? gameDebug.worldScene : gameDebug.localScene;
      s.traverse(o => { const k = o.material?.customProgramCacheKey?.(); if (k && /v149/.test(k)) { const t = k.split('-')[0]; keys[t] = (keys[t] || 0) + 1; } });
      return keys;
    }, scene);
    await page.evaluate(() => gameDebug.openWorld());
    await page.waitForTimeout(2500);
    const world = await scan('world');
    await page.screenshot({path: `${out}/world-${quality}.png`});
    const tile = await page.evaluate(() => {
      const g = gameDebug.game, c = g.cells.find(c => c.land && c.river && g.seen(0, c) && !c.mountain);
      gameDebug.openTile(c); return {c: c.c, r: c.r};
    });
    await page.waitForTimeout(4000);
    const detail = await scan('local');
    await page.screenshot({path: `${out}/detail-${quality}.png`});
    const r = {quality, tile, world, detail, errors};
    results.push(r); console.log('V149', JSON.stringify(r));
    assert.deepEqual(errors, []);
    assert.ok(world.terrain >= 1 && world.water >= 1 && world.road >= 1, 'world map uses V149 terrain, water and road shaders');
    assert.ok(detail.terrain >= 1 && detail.water >= 1, 'detail map uses V149 terrain and water shaders');
    await context.close();
  }
  fs.writeFileSync(out + '/test-results.json', JSON.stringify(results, null, 2));
  console.log('V149 BROWSER PASS');
} finally { await browser.close(); }
