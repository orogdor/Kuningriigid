"""Check exported binary GLBs, accessor indices, finite vertices and grounded pivots."""
import hashlib,json,math,struct,io
from PIL import Image
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/sapling-trees';checks=[]
for path in sorted(OUT.glob('*/*.glb')):
 raw=path.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw),path
 n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);bin=raw[28+n:];tris=0;positions=[]
 def access(i):
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];stride=v.get('byteStride',struct.calcsize(fmt)*size);start=v.get('byteOffset',0)+a.get('byteOffset',0)
  assert start+(a['count']-1)*stride+size*struct.calcsize(fmt)<=len(bin)
  return [struct.unpack_from('<'+fmt*size,bin,start+k*stride) for k in range(a['count'])]
 for mesh in doc['meshes']:
  for p in mesh['primitives']:
   vs=access(p['attributes']['POSITION']);assert vs and all(math.isfinite(x) for v in vs for x in v),path
   positions.extend(vs);ix=access(p['indices']);assert all(0<=v[0]<len(vs) for v in ix);assert len(ix)%3==0;tris+=len(ix)//3
 for image in doc.get('images',[]):assert 'bufferView' in image,'external texture'
 if path.stem!='far':
  assert -.05<=min(v[1] for v in positions)<.3,('ungrounded tree',path)
 else:
  for material in doc['materials']:
   assert material['alphaMode']=='MASK' and 'baseColorTexture' in material['pbrMetallicRoughness']
  for image in doc['images']:
   view=doc['bufferViews'][image['bufferView']];start=view.get('byteOffset',0);im=Image.open(io.BytesIO(bin[start:start+view['byteLength']])).convert('RGBA')
   assert im.getchannel('A').getextrema()==(0,255),('empty or opaque impostor',path)
 report=json.loads((path.parent/'report.json').read_text())[path.stem];assert tris==report['triangles'],(path,tris,report)
 assert hashlib.sha256(raw).hexdigest()==report['sha256']
 checks.append({'path':str(path.relative_to(ROOT)),'triangles':tris,'vertices':len(positions),'bytes':len(raw),'embeddedTextures':len(doc.get('images',[]))})
assert checks,'No assets produced'
(ROOT/'reports').mkdir(exist_ok=True);(ROOT/'reports/sapling-trees-validation.json').write_text(json.dumps({'passed':True,'files':checks},indent=2));print('VALIDATED',len(checks),'GLB files')
