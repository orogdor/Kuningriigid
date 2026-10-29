import sys,time,numpy as np
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from glb import load;from qem import weld,simplify;from bake import bake,smooth_normals;from writer import write
name,target,size=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
SRC=sys.argv[4] if len(sys.argv)>4 else 'source-models';OUT=sys.argv[5] if len(sys.argv)>5 else 'models-v221'
m=load(os.path.join(SRC,name+'.glb'))
t=time.time();P,F=weld(m['pos'],m['idx']);P2,F2=simplify(P,F,target);t1=time.time()-t
oP,oUV,oF,src,img=bake(m,P2,F2,size);t2=time.time()-t-t1
N=smooth_normals(P2,F2)[src]

write(os.path.join(OUT,name+'.glb'),oP,N,oUV,oF,img)

print(name,'tris',len(oF),'verts',len(oP),'qem',round(t1,1),'bake',round(t2,1))
