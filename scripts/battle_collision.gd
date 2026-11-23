class_name BattleCollision
extends RefCounted
const Contact=preload("res://scripts/battle_contact.gd")
const Battle=preload("res://scripts/battle_state.gd")
static func squad_radius(u: Dictionary) -> float:
 if u.kind in ["bronze_catapult","catapult"]:return 2.3
 var n:=Battle.soldier_count(u)
 if n==1:return 0.45
 if u.kind=="chariot":return 12.8
 if Contact.troop_role(u.kind) in ["cavalry","vehicle"]:return 9.4
 return 3.5 if n>=24 else 2.05
static func radius(p: Dictionary) -> float:
 return float(p.radius) if p.get("radius")!=null else squad_radius(p)
static func constrain_step(agent: Dictionary,to: Dictionary,others: Array,open: Callable=Callable()) -> bool:
 var ox:=float(agent.x);var oz:=float(agent.z);var dx:=float(to.x)-ox;var dz:=float(to.z)-oz;var length:=sqrt(dx*dx+dz*dz)
 if length==0:return false
 var fraction:=1.0
 for other in others:
  if is_same(other,agent):continue
  var r:=radius(agent)+radius(other)+0.02;var px:=ox-float(other.x);var pz:=oz-float(other.z);var c:=px*px+pz*pz-r*r;var dot:=px*dx+pz*dz
  if c<0:
   if dot<0:fraction=0
   continue
  var disc:=dot*dot-length*length*c
  if dot<0 and disc>=0:fraction=minf(fraction,maxf(0,(-dot-sqrt(disc))/(length*length)-0.001/length))
 var f:=minf(1,0.25/length)
 while f<=fraction:
  if open.is_valid() and not open.call(ox+dx*f,oz+dz*f):fraction=maxf(0,f-0.25/length);break
  f+=0.25/length
 var x:=ox+dx*fraction;var z:=oz+dz*fraction
 if open.is_valid() and not open.call(x,z):return false
 agent.x=x;agent.z=z;return fraction>0.001
