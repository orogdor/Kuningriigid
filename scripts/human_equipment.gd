extends RefCounted

const Motion=preload("res://scripts/human_motion.gd")
static var scenes: Dictionary={}
const FLIP:={"stone_lumber":-0.18,"stone_forester":-0.18,"stone_worker":-0.18,"stone_miner":-0.18,"stone_builder":-0.15,"stone_fisher":-0.08,"stone_hunter":-0.08,"scout":-0.08}
const WORK:={"lumber":"stone_lumber","forester":"stone_forester","quarry":"stone_miner","mine":"stone_miner","coppermine":"stone_miner","tinmine":"stone_miner","hunter":"stone_hunter","fisher":"stone_fisher","berries":"stone_gatherer","market_woman":"stone_gatherer","well":"stone_watercarrier","farm":"stone_farmer","pasture":"stone_herder","study":"stone_elder","claypit":"stone_digger","mason":"stone_builder","builder":"stone_builder"}

static func attach(model: Node,bone: String,kind: String,offset:=Vector3.ZERO) -> Node3D:
	var skeleton:=Motion.find_skeleton(model)
	if skeleton==null or skeleton.find_bone(bone)<0:return null
	var path: String="res://assets/people/equipment/"+kind+".glb"
	if not ResourceLoader.exists(path):return null
	if not scenes.has(kind):scenes[kind]=load(path)
	var attachment:=BoneAttachment3D.new();attachment.bone_name=bone;skeleton.add_child(attachment)
	var prop: Node3D=scenes[kind].instantiate();prop.position=offset
	if FLIP.has(kind):prop.rotation.z=PI;prop.position.y+=float(FLIP[kind])
	if kind=="stone_herder":prop.rotation.x=1.4
	attachment.add_child(prop);return prop

static func job(model: Node,kind: String) -> Node3D:
	var tool: String=WORK.get(kind,"stone_worker")
	if kind=="pottery_kiln":return null
	return attach(model,"hand_R",tool)

static func load_for(model: Node,kind: String) -> Node3D:
	var load_kind: String="wood" if kind in ["lumber","forester"] else "basket" if kind in ["berries","gatherer","berry"] else "sack"
	var prop:=attach(model,"hand_L","load_"+load_kind,Vector3(0,-0.06,0.055))
	if prop!=null:prop.visible=false
	return prop
