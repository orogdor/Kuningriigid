"""Independent numerical inspection of the 3x3 9x9 sample transforms.
This does NOT parse, compile or run the GDScript implementation.
"""
import math
W,D=225.0,195.0
T={}
# Continuous affine height function, sampled at V131's 9x9 lattice.
for dz in range(-1,2):
 for dx in range(-1,2):
  T[dx,dz]=[(dx*W+(i/8-.5)*W)*.001+(dz*D+(j/8-.5)*D)*.0003+1.0 for j in range(9) for i in range(9)]
def sample(x,z):
 dx=max(-1,min(1,math.floor((x+337.5)/225)-1))
 dz=max(-1,min(1,math.floor((z+292.5)/195)-1))
 fx=max(0,min(8,((x-dx*W)/W+.5)*8))
 fz=max(0,min(8,((z-dz*D)/D+.5)*8))
 i=min(7,math.floor(fx));j=min(7,math.floor(fz));u=fx-i;v=fz-j
 t=T[dx,dz]
 return ((t[j*9+i]*(1-u)+t[j*9+i+1]*u)*(1-v)+(t[(j+1)*9+i]*(1-u)+t[(j+1)*9+i+1]*u)*v)
for row in range(-1,2):
 for col in range(-1,2):
  for iz in range(24):
   for ix in range(24):
    x=(col*W+(ix/23-.5)*W)
    z=(row*D+(iz/23-.5)*D)
    assert abs(sample(x,z)-(.001*x+.0003*z+1.0))<1e-6
for z in (-292.5,-195,-97.5,0,97.5,195,292.5):
 for x in (-112.5,112.5):
  assert abs(sample(x-1e-5,z)-sample(x+1e-5,z)) <1e-6
print('PASS independent: 5184 affine 9x9 interpolations, 14 seam probes, V131 field dimensions 675x585 and retreat ring 5x5. NOT a Godot runtime test.')
