class_name HumanMotion
extends RefCounted
const BONES := ["hips","spine","chest","neck","head","upperArm_L","forearm_L","hand_L","upperArm_R","forearm_R","hand_R","thigh_L","shin_L","foot_L","thigh_R","shin_R","foot_R"]
var last_time: Variant=null
var motion_move: Variant=null
var motion_work: Variant=null
var work_clock: Variant=null
var phase:=0.0

static func smooth_ease(a: float,b: float,t: float) -> float:
	var x:=clampf((t-a)/(b-a),0,1)
	return x*x*(3-2*x)

static func damp(old: float,target: float,dt: float,speed: float) -> float:
	return old+(target-old)*(1-exp(-clampf(dt,0,0.12)*speed))

static func point(poses: Dictionary,name: String,x: float,y:=0.0,z:=0.0,weight:=1.0) -> void:
	var old: Vector3=poses[name]
	poses[name]=old.lerp(Vector3(x,y,z),weight)

func calculate(time: float,moving: bool,action: String="",work_rate:=1.0) -> Dictionary:
	var t:=time+phase
	var dt:=1.0/30.0 if last_time==null else clampf(time-float(last_time),0,0.12)
	last_time=time
	if work_clock==null:work_clock=time
	work_clock=float(work_clock)+dt*clampf(work_rate,0,4)
	var work_t: float=work_clock+phase
	if motion_move==null:motion_move=1.0 if moving else 0.0
	if motion_work==null:motion_work=1.0 if not action.is_empty() and not moving and action!="carry" else 0.0
	motion_move=damp(motion_move,1.0 if moving else 0.0,dt,11)
	motion_work=damp(motion_work,1.0 if not action.is_empty() and not moving and action!="carry" else 0.0,dt,9)
	var locomotion: float=motion_move
	var work: float=motion_work*(1-locomotion)
	var poses: Dictionary={};for name in BONES:poses[name]=Vector3.ZERO
	var breath:=sin(t*1.65);var balance:=sin(t*0.55)
	point(poses,"spine",0.012*breath,0,0.014*balance)
	point(poses,"chest",0.017*breath,0.015*balance)
	point(poses,"head",-0.014*breath,0.055*sin(t*0.43))
	point(poses,"upperArm_L",-0.11,0,0.08);point(poses,"upperArm_R",-0.11,0,-0.08)
	point(poses,"forearm_L",-0.23);point(poses,"forearm_R",-0.23)
	var hip_y:=0.50+0.004*breath
	var stride:=sin(t*7.6)
	var lift_l:=maxf(0,sin(t*7.6+1.05));var lift_r:=maxf(0,sin(t*7.6+1.05+PI))
	point(poses,"thigh_L",-0.56*stride,0,0.027,locomotion);point(poses,"thigh_R",0.56*stride,0,-0.027,locomotion)
	point(poses,"shin_L",0.66*lift_l,0,0,locomotion);point(poses,"shin_R",0.66*lift_r,0,0,locomotion)
	point(poses,"foot_L",-0.23*lift_l+0.12*maxf(0,-stride),0,0,locomotion);point(poses,"foot_R",-0.23*lift_r+0.12*maxf(0,stride),0,0,locomotion)
	point(poses,"upperArm_L",0.42*stride,0,0.08,locomotion);point(poses,"upperArm_R",-0.42*stride,0,-0.08,locomotion)
	point(poses,"forearm_L",-0.30-0.12*lift_l,0,0,locomotion);point(poses,"forearm_R",-0.30-0.12*lift_r,0,0,locomotion)
	point(poses,"spine",0.075,0.045*stride,0.028*stride,locomotion);point(poses,"chest",0.01,-0.055*stride,0,locomotion);point(poses,"head",-0.03,-0.025*stride,0,locomotion)
	hip_y+=locomotion*(0.007+0.012*(1-cos(t*15.2))*0.5)
	if work>0.0001 and action in ["mine","chop","forge","build","work","saw","mill","train"]:
		var mining:=action=="mine";var chopping:=action in ["chop","forge"]
		var duration:=1.85 if mining else (1.45 if chopping else 1.12)
		var u:=fposmod((work_t+phase*0.06)/duration,1.0)
		var wind:=smooth_ease(0.04,0.43,u)*(1-smooth_ease(0.45,0.62,u))
		var strike:=smooth_ease(0.44,0.61,u)*(1-smooth_ease(0.63,0.90,u))
		var reach:=1.0 if mining else (0.9 if chopping else 0.55)
		point(poses,"upperArm_R",-0.36-1.45*reach*wind+0.72*strike,0,-0.18,work)
		point(poses,"forearm_R",-0.62-0.43*wind+0.23*strike,0,0,work)
		point(poses,"upperArm_L",-0.24-(1.32 if mining else (0.95 if chopping else 0.25))*wind,0,0.16,work)
		point(poses,"forearm_L",-0.42-0.36*wind,0,0,work)
		point(poses,"spine",0.17+0.24*strike,0.16*wind-0.13*strike,0.05,work)
		point(poses,"chest",-0.04,0.12*wind-0.1*strike,0,work)
		point(poses,"head",-0.12,0,0,work)
		point(poses,"thigh_L",-0.18,0,0.06,work);point(poses,"thigh_R",0.12,0,-0.05,work);point(poses,"shin_L",0.18,0,0,work)
		hip_y-=0.018*work*strike
	elif work>0.0001 and action in ["gather","plant","farm"]:
		var u:=fposmod(work_t/2.2,1.0)
		var reach:=smooth_ease(0.12,0.4,u)*(1-smooth_ease(0.68,0.93,u))
		point(poses,"spine",0.58+0.13*reach,0,0,work)
		point(poses,"chest",0.16,0,0,work);point(poses,"head",-0.32,0,0,work)
		point(poses,"upperArm_L",-0.6-0.4*reach,0,0.10,work);point(poses,"upperArm_R",-0.65-0.44*reach,0,-0.10,work)
		point(poses,"forearm_L",-0.36-0.18*reach,0,0,work);point(poses,"forearm_R",-0.36-0.17*reach,0,0,work)
		point(poses,"thigh_L",-0.43,0,0.06,work);point(poses,"thigh_R",-0.34,0,-0.06,work)
		point(poses,"shin_L",0.62,0,0,work);point(poses,"shin_R",0.44,0,0,work)
		hip_y-=0.035*work
	elif work>0.0001 and action in ["fishing","hunt"]:
		var u:=fposmod(work_t/3.1,1.0)
		var cast:=smooth_ease(0.26,0.55,u)*(1-smooth_ease(0.63,0.85,u))
		point(poses,"upperArm_R",-1.10-0.8*cast,0,-0.1,work);point(poses,"forearm_R",-0.6+0.26*cast,0,0,work)
		point(poses,"upperArm_L",-0.72,0,0.1,work);point(poses,"forearm_L",-0.76,0,0,work)
		point(poses,"spine",0.10-0.09*cast,0.12*cast,0,work)
		point(poses,"thigh_L",-0.14,0,0,work);point(poses,"thigh_R",0.08,0,0,work)
	elif work>0.0001 and action=="water":
		var wave:=sin(work_t*2.8)
		point(poses,"upperArm_L",-0.96+0.16*wave,0,0.18,work);point(poses,"upperArm_R",-0.96-0.16*wave,0,-0.18,work)
		point(poses,"forearm_L",-0.83,0,0,work);point(poses,"forearm_R",-0.83,0,0,work);point(poses,"spine",0.10,0,0,work)
	elif work>0.0001 and action=="study":
		var u:=fposmod(work_t/5.0,1.0)
		var draw:=smooth_ease(0,0.15,u)*(1-smooth_ease(0.55,0.65,u))
		var talk:=smooth_ease(0.62,0.7,u)*(1-smooth_ease(0.92,1,u))
		point(poses,"spine",0.25*draw+0.05,0.10*talk,0,work);point(poses,"head",-0.30*draw+0.05*talk,0.15*talk*sin(work_t*2),0,work)
		point(poses,"upperArm_R",-0.60-0.25*draw-0.6*talk,0.15*sin(work_t*3)*draw,-0.10,work);point(poses,"forearm_R",-0.40-0.5*talk,0,0,work)
		point(poses,"upperArm_L",-0.20-0.3*talk,0,0.12,work);point(poses,"forearm_L",-0.45-0.4*talk*maxf(0,sin(work_t*2.4)),0,0,work)
	elif work>0.0001 and action=="herd":
		var u:=fposmod(work_t/6.0,1.0)
		var wave:=smooth_ease(0.70,0.78,u)*(1-smooth_ease(0.85,0.95,u))
		point(poses,"upperArm_R",-0.85-0.9*wave,0,-0.18,work);point(poses,"forearm_R",-0.65+0.3*wave,0,0,work)
		point(poses,"upperArm_L",-0.25,0,0.10,work);point(poses,"forearm_L",-0.40,0,0,work)
		point(poses,"spine",0.06,0.25*sin(work_t*0.4),0,work);point(poses,"head",0,0.45*sin(work_t*0.33),0,work)
		point(poses,"thigh_L",-0.06,0,0.05,work)
	elif work>0.0001 and action in ["sit","eat"]:
		var u:=fposmod(work_t/3.2,1.0)
		var bite:=smooth_ease(0.1,0.3,u)*(1-smooth_ease(0.45,0.6,u)) if action=="eat" else 0.0
		point(poses,"thigh_L",-1.5,0,0.22,work);point(poses,"thigh_R",-1.5,0,-0.22,work)
		point(poses,"shin_L",0.08,0,0,work);point(poses,"shin_R",0.16,0,0,work)
		point(poses,"spine",0.12,0,0,work);point(poses,"head",-0.06+0.04*sin(work_t*0.6),0.2*sin(work_t*0.4),0,work)
		point(poses,"upperArm_L",-0.45,0,0.18,work);point(poses,"forearm_L",-0.6,0,0,work)
		point(poses,"upperArm_R",-0.45-0.75*bite,0,-0.18,work);point(poses,"forearm_R",-0.6-1.25*bite,0,0,work)
		hip_y-=0.40*work
	elif work>0.0001 and action=="play":
		var hop:=maxf(0,sin(work_t*5.2))
		point(poses,"upperArm_L",-1.6-0.4*hop,0,0.4,work);point(poses,"upperArm_R",-1.5-0.5*hop,0,-0.4,work)
		point(poses,"forearm_L",-0.3,0,0,work);point(poses,"forearm_R",-0.3,0,0,work)
		point(poses,"thigh_L",-0.35*hop,0,0.05,work);point(poses,"thigh_R",-0.35*hop,0,-0.05,work)
		point(poses,"shin_L",0.6*hop,0,0,work);point(poses,"shin_R",0.6*hop,0,0,work);hip_y+=0.10*work*hop
	elif work>0.0001 and action=="guard":
		point(poses,"upperArm_R",-1.05,0,-0.22,work);point(poses,"forearm_R",-0.85,0,0,work)
		point(poses,"upperArm_L",-0.15,0,0.12,work);point(poses,"forearm_L",-0.3,0,0,work)
		point(poses,"thigh_L",-0.08,0,0.08,work);point(poses,"thigh_R",0.06,0,-0.04,work)
		point(poses,"spine",0.02,0.30*sin(work_t*0.35),0,work);point(poses,"head",0,0.55*sin(work_t*0.27+1),0,work)
	elif work>0.0001 and action=="talk":
		var g1:=maxf(0,sin(work_t*1.9));var g2:=maxf(0,sin(work_t*1.3+2.1))
		point(poses,"upperArm_R",-0.30-0.55*g1,0,-0.12-0.15*g1,work);point(poses,"forearm_R",-0.55-0.75*g1,0,0,work)
		point(poses,"upperArm_L",-0.20-0.35*g2,0,0.10+0.1*g2,work);point(poses,"forearm_L",-0.45-0.55*g2,0,0,work)
		point(poses,"head",-0.06+0.08*sin(work_t*2.7),0.18*sin(work_t*0.7),0,work);point(poses,"spine",0.03,0.08*sin(work_t*0.5),0,work)
	elif work>0.0001 and action=="dig":
		var u:=fposmod(work_t/1.7,1.0)
		var lift:=smooth_ease(0.05,0.40,u)*(1-smooth_ease(0.42,0.58,u))
		var push:=smooth_ease(0.42,0.58,u)*(1-smooth_ease(0.70,0.95,u))
		point(poses,"upperArm_R",-0.95-0.75*lift+0.45*push,0,-0.12,work);point(poses,"forearm_R",-0.70-0.30*lift,0,0,work)
		point(poses,"upperArm_L",-0.70-0.65*lift+0.40*push,0,0.12,work);point(poses,"forearm_L",-0.85-0.25*lift,0,0,work)
		point(poses,"spine",0.30+0.25*push,0,0,work);point(poses,"chest",0.08,0,0,work);point(poses,"head",-0.18,0,0,work)
		point(poses,"thigh_L",-0.30-0.15*push,0,0.06,work);point(poses,"thigh_R",0.10,0,-0.05,work);point(poses,"shin_L",0.35+0.2*push,0,0,work)
		hip_y-=0.03*work*push
	elif work>0.0001:
		var wave:=sin(work_t*3.2)
		point(poses,"upperArm_L",-0.54+0.25*wave,0,0.06,work);point(poses,"upperArm_R",-0.54-0.25*wave,0,-0.06,work)
		point(poses,"forearm_L",-0.55,0,0,work);point(poses,"forearm_R",-0.55,0,0,work);point(poses,"spine",0.12,0,0,work)
	if action=="carry":
		point(poses,"upperArm_L",-0.80,0,0.12,0.93);point(poses,"upperArm_R",-0.80,0,-0.12,0.93)
		point(poses,"forearm_L",-1.07,0,0,0.93);point(poses,"forearm_R",-1.07,0,0,0.93)
		point(poses,"chest",-0.04,0,0,0.55)
	if action=="stalk":
		point(poses,"spine",0.55,0,0,0.9);point(poses,"chest",0.12,0,0,0.9);point(poses,"head",-0.38,0,0,0.9)
		point(poses,"upperArm_R",-1.0,0,-0.18,0.9);point(poses,"forearm_R",-0.85,0,0,0.9)
		point(poses,"upperArm_L",-0.65,0,0.15,0.9);point(poses,"forearm_L",-0.7,0,0,0.9);hip_y-=0.09*0.9
	return {"poses":poses,"hip_y":hip_y}

static func find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D:return node
	for child in node.get_children():
		var result:=find_skeleton(child)
		if result!=null:return result
	return null

func apply(model: Node,time: float,moving: bool,action: String="",work_rate:=1.0) -> void:
	var skeleton:=find_skeleton(model)
	if skeleton==null:return
	var result:=calculate(time,moving,action,work_rate)
	for name in BONES:
		var i:=skeleton.find_bone(name)
		if i>=0:skeleton.set_bone_pose_rotation(i,Basis.from_euler(result.poses[name],EULER_ORDER_XYZ).get_rotation_quaternion())
	var hips:=skeleton.find_bone("hips")
	if hips>=0:
		var p:=skeleton.get_bone_rest(hips).origin;p.y=result.hip_y;skeleton.set_bone_pose_position(hips,p)

