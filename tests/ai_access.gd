extends SceneTree
const Navigation=preload("res://scripts/local_navigation.gd")

func _initialize():
 var nav=Navigation.new(-10,-10,21,21,func(_x,z):return z==0)
 var hall={"type":"hall","x":-20,"z":0,"hp":100,"accessEntry":{"x":-8,"z":0}}
 var buildings=[hall];nav.rebuild(buildings,[])
 var workers={"builder":{"x":8,"z":0,"carried":1}}
 assert(not nav.preserves_access({"type":"house","x":0,"z":0},buildings,workers,[]),"A house must not close the only route to a worker")
 assert(nav.preserves_access({"type":"house","x":0,"z":9},buildings,workers,[]),"A house away from the route should be allowed")
 print("AI_ACCESS_OK")
 quit()
