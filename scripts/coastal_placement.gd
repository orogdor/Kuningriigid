class_name CoastalPlacement
extends RefCounted

static func river(type: String,p: Vector2,surface: Callable,detail: Callable,nearest: Callable) -> Dictionary:
 var river: Dictionary=nearest.call(p.x,p.y)
 var distance:=float(river.get("distance",INF));var width:=float(river.get("width",0.0))
 if distance>=width+6.0:return {"error":"Vali mererand või jõekallas."}
 if type=="harbor" and width<6.0:return {"error":"Sadam vajab laevatatavat (laia) jõge."}
 var left:=float(nearest.call(p.x-0.25*4.5,p.y).distance);var right:=float(nearest.call(p.x+0.25*4.5,p.y).distance)
 var back:=float(nearest.call(p.x,p.y-0.25*3.9).distance);var front:=float(nearest.call(p.x,p.y+0.25*3.9).distance)
 if not is_finite(left) or not is_finite(right) or not is_finite(back) or not is_finite(front):return {"error":"Vali jõekallas, mitte jõe keskkoht."}
 var gradient:=Vector2(right-left,front-back)
 if gradient.length()<0.0001:return {"error":"Vali jõekallas, mitte jõe keskkoht."}
 var inland_world:=gradient.normalized();var shift:=width+1.4-distance
 var q:=p+Vector2(inland_world.x*shift*4.5,inland_world.y*shift*3.9)
 var inland:=Vector2(inland_world.x*4.5,inland_world.y*3.9).normalized()
 if absf(q.x)>129 or absf(q.y)>114:return {"error":"Kogu hoone peab mahtuma sellele detailkaardile."}
 var dry:=q+inland*6.0;var entry:=q+inland*11.5
 if float(surface.call(dry.x,dry.y))<=0.15 or float(surface.call(entry.x,entry.y))<=0.15 or float(detail.call(entry.x,entry.y))<=0.2:return {"error":"Kaldal puudub kuiv ligipääs."}
 # The current detail river follows the sampled ground rather than carving the
 # original river bed. Keep the hut above that visible surface until the bed
 # and its water level have been fully ported.
 var base_y:=maxf(0.22,float(detail.call(q.x,q.y))+0.22)
 return {"p":{"x":q.x,"z":q.y},"shoreAngle":atan2(inland.x,inland.y),"landEntry":{"x":entry.x,"z":entry.y},"baseY":base_y,"riverBankV276":true}

# The source samples the continuous surface around the shoreline. Surface,
# detail height and navigable sea are supplied by the active world tile.
static func sea(type: String,p: Vector2,surface: Callable,detail: Callable,ocean: Callable) -> Dictionary:
 var dx: float=surface.call(p.x+2,p.y)-surface.call(p.x-2,p.y)
 var dz: float=surface.call(p.x,p.y+2)-surface.call(p.x,p.y-2)
 var length:=sqrt(dx*dx+dz*dz)
 if length<0.001:return {"error":"Vali mererand: pool hoonest peab jääma merre ja pool maale."}
 var inland:=Vector2(dx/length,dz/length);var side:=Vector2(inland.y,-inland.x)
 var low:=p-inland*6;var high:=p+inland*6
 if float(surface.call(low.x,low.y))>=0 or float(surface.call(high.x,high.y))<=0.15:return {"error":"Vali rannajoon, mitte sisemaa või avameri."}
 var lo:=-6.0;var hi:=6.0
 for i in 12:
  var mid:=(lo+hi)/2;var q:=p+inland*mid
  if float(surface.call(q.x,q.y))>0:hi=mid
  else:lo=mid
 var q:=p+inland*((lo+hi)/2);var depth:=8.0 if type=="harbor" else 6.0
 if absf(q.x)>129 or absf(q.y)>114:return {"error":"Kogu rannahoone peab mahtuma sellele detailkaardile."}
 for u in [-2,0,2]:
  var land: Vector2=q+inland*7.5+side*float(u);var water: Vector2=q-inland*7.5+side*float(u)
  if float(surface.call(land.x,land.y))<=0.15 or float(surface.call(water.x,water.y))>=0 or not bool(ocean.call(water.x,water.y)):return {"error":"Hoone maaosa peab jääma kuivale ja kai merre."}
 var entry:=q+inland*maxf(11.5,depth+4)
 if float(detail.call(entry.x,entry.y))<=0.2 or float(surface.call(entry.x,entry.y))<=0.15:return {"error":"Hoone maapoolsele sissepääsule puudub kuiv ligipääs."}
 return {"p":{"x":q.x,"z":q.y},"shoreAngle":atan2(inland.x,inland.y),"landEntry":{"x":entry.x,"z":entry.y},"baseY":0.22}
