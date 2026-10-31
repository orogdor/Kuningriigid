"""V244: mid/far levels for the detailed Stone Age GLBs (models-stone-near/) WITHOUT re-baking the texture.
Vertex clustering on a grid (the same rule as stone-near-lod.js simplifyStoneFarGeometry): vertices in one
cell that also share a rounded UV are merged, so UV atlas seams stay and the ORIGINAL texture is reused.
Usage: python3 lod_cluster.py <name> <cells | -target_triangles for QEM> <texture_px> <level> [src] [out] [uv_steps]
V244 used: mid = 32 cells, 64 UV steps, 1024 px; far = 24 cells, 32 UV steps, 512 px.
(12 UV steps, as at runtime, shifts UVs up to ~85 texels and gives dark speckles on thatch.)"""
import sys,os,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from glb import load;from writer import write
from PIL import Image
def source_normals(path):
    import json,struct
    b=open(path,'rb').read();L=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+L]);o=20+L;bin_=b[o+8:o+8+struct.unpack('<I',b[o:o+4])[0]]
    a=j['meshes'][0]['primitives'][0]['attributes'].get('NORMAL')
    if a is None:return None
    a=j['accessors'][a];bv=j['bufferViews'][a['bufferView']];off=bv.get('byteOffset',0)+a.get('byteOffset',0);st=bv.get('byteStride',0)
    if st and st!=12:return np.ndarray((a['count'],3),np.float32,bin_,off,(st,4)).astype(np.float64)
    return np.frombuffer(bin_,np.float32,a['count']*3,off).reshape(-1,3).astype(np.float64)
def cluster(pos,uv,idx,cells,nrm=None,uvq=12):
    mn=pos.min(0);step=max((pos.max(0)-mn).max(),1e-6)/max(8,cells)
    g=np.floor((pos-mn)/step).astype(np.int64)
    key=np.concatenate([g,np.round(uv*uvq).astype(np.int64)],1) if uv is not None else g
    _,remap,count=np.unique(key,axis=0,return_inverse=True,return_counts=True);remap=remap.ravel()
    n=len(count);P=np.zeros((n,3));np.add.at(P,remap,pos);P/=count[:,None]
    UV=None
    if uv is not None:UV=np.zeros((n,2));np.add.at(UV,remap,uv);UV/=count[:,None]
    N=None
    if nrm is not None:N=np.zeros((n,3));np.add.at(N,remap,nrm)
    F=remap[idx];ok=(F[:,0]!=F[:,1])&(F[:,1]!=F[:,2])&(F[:,0]!=F[:,2]);F=F[ok]
    # drop exact duplicate triangles
    F=np.unique(F,axis=0)
    used=np.unique(F);new=-np.ones(n,np.int64);new[used]=np.arange(len(used))
    if N is not None:
        N=N[used];l=np.linalg.norm(N,axis=1,keepdims=True);bad=l[:,0]<1e-6;l[l==0]=1;N=N/l
    return P[used],(UV[used] if UV is not None else None),new[F],N
def normals(P,F):
    N=np.zeros_like(P);fn=np.cross(P[F[:,1]]-P[F[:,0]],P[F[:,2]]-P[F[:,0]])
    for k in range(3):np.add.at(N,F[:,k],fn)
    l=np.linalg.norm(N,axis=1,keepdims=True);l[l==0]=1;return N/l
def qem_keep_uv(pos,uv,idx,nrm,target):
    """V244: QEM edge collapse (qem.py, flip test included) on a mesh welded by position AND uv, so atlas
    seams are borders; each kept vertex keeps its own original uv and normal."""
    from qem import simplify
    key=np.concatenate([np.round(pos/1e-5),np.round(uv*1e5)],1).astype(np.int64)
    _,first,inv=np.unique(key,axis=0,return_index=True,return_inverse=True);inv=inv.ravel()
    P=pos[first].copy();F=inv[idx];ok=(F[:,0]!=F[:,1])&(F[:,1]!=F[:,2])&(F[:,0]!=F[:,2]);F=F[ok]
    extra=np.concatenate([uv[first],nrm[first] if nrm is not None else np.zeros((len(first),3))],1)
    P2,F2,X=simplify(P,F,target,uv=extra)
    N=X[:,2:5];l=np.linalg.norm(N,axis=1,keepdims=True);l[l==0]=1
    return P2,X[:,:2],F2,(N/l if nrm is not None else None)
if __name__=='__main__':
    name,cells,px,level=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
    src=sys.argv[5] if len(sys.argv)>5 else 'models-stone-near';out=sys.argv[6] if len(sys.argv)>6 else 'models-stone-lod-v244'
    path=os.path.join(src,name+'.glb');m=load(path)
    if cells<0: P,UV,F,N=qem_keep_uv(m['pos'],m['uv'],m['idx'],source_normals(path),-cells)
    else: P,UV,F,N=cluster(m['pos'],m['uv'],m['idx'],cells,source_normals(path),int(sys.argv[7]) if len(sys.argv)>7 else 12)
    # averaged ORIGINAL normals keep the shading of the detailed model; face normals only where missing
    fn=normals(P,F)
    if N is None:N=fn
    else:
        bad=np.linalg.norm(N,axis=1)<.5;N[bad]=fn[bad]
    # clustering flips some small triangles; a flipped one shows its dark back side (DoubleSide
    # material), which looked like dark speckles on thatch. Re-orient each triangle to agree with
    # the averaged original normals of its corners.
    if cells<0: flip_fix=False
    else: flip_fix=True
    face=np.cross(P[F[:,1]]-P[F[:,0]],P[F[:,2]]-P[F[:,0]]);flip=(face*(N[F[:,0]]+N[F[:,1]]+N[F[:,2]])).sum(1)<0
    if flip_fix: F[flip]=F[flip][:,[0,2,1]]  # QEM keeps the original winding (its own flip test)
    print('re-oriented',int(flip.sum()),'of',len(F))
    img=m['images'].get('base');
    if img is not None and max(img.size)>px:img=img.resize((px,px),Image.LANCZOS)
    rough=.92
    if 'mr' in m['images']:rough=float(np.asarray(m['images']['mr'].convert('RGB'))[...,1].mean()/255)*float(m['mat'].get('pbrMetallicRoughness',{}).get('roughnessFactor',1))
    write(os.path.join(out,name+'_'+level+'.glb'),P,N,UV,F,img,roughness=round(min(1,max(.3,rough)),3))
    print(name,level,'cells',cells,'tris',len(F),'verts',len(P),'src tris',len(m['idx']))
