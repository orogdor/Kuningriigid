import json,struct,numpy as np,io
from PIL import Image
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def load(path):
    b=open(path,'rb').read();L=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+L]);o=20+L
    L2=struct.unpack('<I',b[o:o+4])[0];bin_=b[o+8:o+8+L2]
    def acc(i):
        a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];off=bv.get('byteOffset',0)+a.get('byteOffset',0)
        dt=np.dtype(CT[a['componentType']]);n=NC[a['type']];cnt=a['count'];stride=bv.get('byteStride',0)
        if stride and stride!=dt.itemsize*n:
            arr=np.ndarray((cnt,n),dtype=dt,buffer=bin_,offset=off,strides=(stride,dt.itemsize)).copy()
        else: arr=np.frombuffer(bin_,dtype=dt,count=cnt*n,offset=off).reshape(cnt,n).copy()
        return arr
    def tex(t):
        t=j['textures'][t];return t['source'] if 'source' in t else list(t.get('extensions',{}).values())[0]['source']
    def img(i):
        im=j['images'][i];bv=j['bufferViews'][im['bufferView']];off=bv.get('byteOffset',0)
        return Image.open(io.BytesIO(bin_[off:off+bv['byteLength']]))
    p=j['meshes'][0]['primitives'][0];a=p['attributes']
    pos=acc(a['POSITION']).astype(np.float64);uv=acc(a['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in a else None
    idx=acc(p['indices']).reshape(-1,3).astype(np.int64) if 'indices' in p else np.arange(len(pos)).reshape(-1,3)
    mat=j['materials'][p.get('material',0)] if j.get('materials') else {}
    images={}
    pbr=mat.get('pbrMetallicRoughness',{})
    if 'baseColorTexture' in pbr: images['base']=img(tex(pbr['baseColorTexture']['index']))
    if 'metallicRoughnessTexture' in pbr: images['mr']=img(tex(pbr['metallicRoughnessTexture']['index']))
    if 'normalTexture' in mat: images['normal']=img(tex(mat['normalTexture']['index']))
    return dict(pos=pos,uv=uv,idx=idx,images=images,mat=mat,json=j)
