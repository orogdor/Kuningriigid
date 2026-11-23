extends SceneTree
const Builder=preload("res://scripts/builder_sim.gd")
const Navigation=preload("res://scripts/local_navigation.gd")

func _initialize():
 var nav=Navigation.new(-5,-5,11,11,func(_x,_z):return true)
 var city={"c":0,"r":0,"team":0,"economy":{"buildings":[]}}
 var worker={"x":0,"z":0,"materialJob":"previous","materialLoad":24.0,"carried":24.0}
 var job={"type":"house","x":0,"z":0,"materialsRemaining":20.0}
 Builder.tick_worker({},city,worker,job,0,{},nav,0.1,1.0)
 assert(float(worker.materialLoad)==0.0 and float(worker.carried)==0.0,"Switching jobs must clear both load fields")
 print("BUILDER_LOAD_OK")
 quit()
