// V148: new soldier models and animations (data checks, runs in Node without a browser).
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('models-v148/manifest.json', 'utf8'));
const expected = ['scout', 'militia', 'slinger', 'spearman', 'axeman', 'archer', 'bronze_spearman', 'bronze_axeman', 'bronze_archer',
  'bronze_cavalry', 'infantry', 'cavalry', 'iron_archer', 'javelinman', 'man_at_arms', 'halberdier', 'crossbowman', 'knight',
  'heavy_cavalry', 'pikeman', 'arquebusier', 'musketeer', 'cuirassier', 'rifleman', 'line_infantry', 'dragoon', 'modern_infantry', 'rocket_team'];
assert.deepEqual(Object.keys(manifest.models).sort(), [...expected].sort(), 'every soldier kind has a V148 model');

function readPack(path) {
  const buf = fs.readFileSync(path), ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), dv = new DataView(ab);
  assert.equal(dv.getUint32(0, true), 0x3156534B, path + ' magic');
  const len = dv.getUint32(4, true), header = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 8, len)));
  return { header, blob: ab.slice(8 + len) };
}
const GLB_MAGIC = 0x46546C67;
for (const lod of ['high', 'low']) {
  const { header, blob } = readPack(`models-v148/soldiers-v148-${lod}.bin`);
  for (const kind of expected) {
    const d = header.kinds[kind];
    assert.ok(d, `${lod}: ${kind} present`);
    const bones = d.bones.map(b => b[0]);
    for (const b of ['body', 'chest', 'head', 'upperArm_L', 'forearm_L', 'hand_L', 'upperArm_R', 'forearm_R', 'hand_R', 'thigh_L', 'shin_L', 'thigh_R', 'shin_R'])
      assert.ok(bones.includes(b), `${kind} has bone ${b}`);
    for (const c of ['idle', 'walk', 'run', 'attack', 'hit']) assert.ok(d.clips[c]?.f?.length >= 2, `${kind} clip ${c}`);
    if (d.riding) for (const b of ['horse', 'horseNeck', 'horseHead', 'horseLeg_FL', 'horseShin_HR']) assert.ok(bones.includes(b), `${kind} horse bone ${b}`);
    let tris = 0;
    for (const [bone, group, tags, mat, color, po, no, n, io, ic] of d.chunks) {
      assert.ok(bones.includes(bone), `${kind} chunk bone ${bone}`);
      assert.ok(['cloth', 'metal'].includes(mat));
      assert.match(color, /^(#[0-9a-f]{6}|TEAM|TEAM_D|TEAM_L)$/);
      assert.ok(po % 2 === 0 && io % 2 === 0 && po + n * 6 <= blob.byteLength && no + n * 3 <= blob.byteLength && io + ic * 2 <= blob.byteLength, `${kind} chunk in range`);
      const ind = new Uint16Array(blob, io, ic);
      for (let i = 0; i < ic; i++) if (ind[i] >= n) throw Error(`${kind}: index out of range`);
      tris += ic / 3;
    }
    // knees and elbows only bend the anatomically possible way in every frame
    for (const [name, clip] of Object.entries(d.clips)) for (const f of clip.f) for (const [b, r] of Object.entries(f.r)) {
      if (b.startsWith('shin_')) assert.ok(r[0] >= -1e-3 && r[0] <= 2.46, `${kind}/${name}: knee ${r[0]}`);
      if (b.startsWith('forearm_')) assert.ok(r[0] <= 1e-3 && r[0] >= -2.56, `${kind}/${name}: elbow ${r[0]}`);
    }
    const limit = lod === 'high' ? (d.riding ? 16000 : 9000) : (d.riding ? 8500 : 4500);
    assert.ok(tris < limit * 3 && tris > 500, `${kind} ${lod} triangle budget (${tris})`);
  }
}
for (const kind of expected) {
  const m = manifest.models[kind];
  assert.equal(m.checks, 'ok', `${kind}: generator checks ${JSON.stringify(m.checks)}`);
  const buf = fs.readFileSync('models-v148/' + m.glb);
  assert.equal(buf.readUInt32LE(0), GLB_MAGIC, kind + ' is a GLB');
  assert.equal(buf.readUInt32LE(4), 2, kind + ' glTF 2.0');
  assert.equal(buf.readUInt32LE(8), buf.length, kind + ' GLB length');
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString());
  const names = json.animations.map(a => a.name);
  for (const c of ['idle', 'walk', 'run', 'attack', 'hit']) assert.ok(names.includes(c), `${kind}.glb animation ${c}`);
  assert.equal(json.skins.length, 1);
}
// The game still starts in Node (no fetch of the pack): soldiers fall back to the earlier visuals.
const visuals = await import('./visuals.js');
assert.equal(typeof visuals.createSoldier, 'function');
console.log('V148 PASS', expected.length, 'soldier models,', Object.values(manifest.models).reduce((n, m) => n + m.clips.length, 0), 'clips');
