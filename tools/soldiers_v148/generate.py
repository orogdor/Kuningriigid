"""Build all V148 soldier models.

usage: python3 tools/soldiers_v148/generate.py [kind ...]
Writes models-v148/glb/<kind>.glb, models-v148/soldiers-v148-high.bin,
models-v148/soldiers-v148-low.bin and models-v148/manifest.json.
"""
import json
import os
import struct
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import roster
import export
import checks

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'models-v148'


def write_pack(path, header, blob):
    js = json.dumps(header, separators=(',', ':')).encode()
    while (8 + len(js)) % 4:
        js += b' '
    with open(path, 'wb') as f:
        f.write(struct.pack('<II', 0x3156534B, len(js)))   # 'KSV1'
        f.write(js)
        f.write(bytes(blob))


def build_kind(kind):
    m0 = roster.build(kind, 0)
    clips = roster.clips_for(m0)
    m1 = roster.build(kind, 1)
    problems = checks.check_model(m0, clips)
    problems += [p + ' (LOD1)' for p in checks.check_geometry(m1)]
    name, era, desc = roster.DESCRIPTIONS[kind]
    stats = export.write_glb(m0, clips, OUT / 'glb' / f'{kind}.glb',
                             extras={'kind': kind, 'name_et': name, 'era': era, 'description_et': desc})
    problems += ['GLB: ' + e for e in checks.validate_glb(OUT / 'glb' / f'{kind}.glb')]
    packs = {}
    for lod, m in ((0, m0), (1, m1)):
        blob = bytearray()
        d = export.pack_model(m, clips, blob)
        packs[lod] = (d, bytes(blob))
    info = {'name_et': name, 'era': era, 'description_et': desc, 'style': m0.meta['style'],
            'riding': m0.meta['riding'], 'glb': f'glb/{kind}.glb', 'glb_bytes': stats['size'],
            'glb_triangles': stats['triangles'], 'quads_lod0_per_figure': checks.instance_quads(m0),
            'quads_lod1_per_figure': checks.instance_quads(m1), 'bones': len(m0.order), 'clips': [c.name for c in clips],
            'checks': problems or 'ok'}
    return kind, info, packs


def main(kinds):
    from multiprocessing import Pool
    (OUT / 'glb').mkdir(parents=True, exist_ok=True)
    manifest = {'version': 148, 'units': 'metres, +Y up, figures face +Z (character left = +X)',
                'workflow': 'Quad-lofted rigid-section characters (tools/soldiers_v148). Same source exported as GLB and as the game pack.',
                'height_m': 1.76, 'models': {}}
    packs = {0: {'kinds': {}}, 1: {'kinds': {}}}
    blobs = {0: bytearray(), 1: bytearray()}
    t0 = time.time()
    bad = 0
    with Pool(os.cpu_count() or 2) as pool:
        for kind, info, kp in pool.imap(build_kind, kinds):
            manifest['models'][kind] = info
            for lod in (0, 1):
                d, blob = kp[lod]
                while len(blobs[lod]) % 4:
                    blobs[lod].append(0)
                base = len(blobs[lod])
                for c in d['chunks']:
                    c[5] += base
                    c[6] += base
                    c[8] += base
                blobs[lod].extend(blob)
                packs[lod]['kinds'][kind] = d
            p = info['checks']
            bad += p != 'ok'
            print(f"{kind:16s} quads {info['quads_lod0_per_figure']:5d}/{info['quads_lod1_per_figure']:4d}  glb {info['glb_bytes'] / 1024:6.1f} KB  {'OK' if p == 'ok' else p}", flush=True)
    for lod, name in ((0, 'high'), (1, 'low')):
        write_pack(OUT / f'soldiers-v148-{name}.bin', packs[lod], blobs[lod])
        manifest[f'pack_{name}_bytes'] = (OUT / f'soldiers-v148-{name}.bin').stat().st_size
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    print('done in %.1fs' % (time.time() - t0))
    return 1 if bad else 0


if __name__ == '__main__':
    kinds = sys.argv[1:] or list(roster.BUILDERS)
    sys.exit(main(kinds))
