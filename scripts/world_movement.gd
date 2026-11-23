class_name WorldMovement
extends RefCounted
const DETAIL_TILE_X := 225.0
const DETAIL_TILE_Z := 195.0

static func duration(from: Vector2i, to: Vector2i, speed := 3.0, road_multiplier := 1.0) -> float:
	return Vector2((to.x - from.x) * DETAIL_TILE_X, (to.y - from.y) * DETAIL_TILE_Z).length() / (maxf(0.01, speed) * maxf(0.01, road_multiplier))

static func rescale_travel(entity: Dictionary, new_duration: float) -> void:
	var old: float = entity.get("travelDuration", 0.0)
	if old > 0.0 and new_duration > 0.0 and old != new_duration:
		entity.travelClock = float(entity.get("travelClock", 0.0)) * new_duration / old
	entity.travelDuration = new_duration

# Base world step for a settler on land without roads, ships, or border restrictions.
# Callbacks for reveal and road wear are deliberately returned as events.
static func advance_settler(entity: Dictionary, dt: float, migration_active: bool,road_boost: Callable=Callable(),record_step: Callable=Callable()) -> Array:
	var events: Array = []
	if entity.get("embarked") != null or entity.path.is_empty():
		return events
	var speed := (2.2 if int(entity.get("team", 0)) > 0 else 3.0) * (7.5 if migration_active else 1.0)
	var from := Vector2i(int(entity.c), int(entity.r))
	var first: Dictionary = entity.path[0]
	var initial_road: float=float(road_boost.call(entity,first)) if road_boost.is_valid() else 1.0
	rescale_travel(entity, duration(from, Vector2i(int(first.c), int(first.r)), speed,initial_road))
	entity.travelClock = float(entity.get("travelClock", 0.0)) + dt
	for step in 6:
		if entity.path.is_empty(): break
		var next: Dictionary = entity.path[0]
		from = Vector2i(int(entity.c), int(entity.r))
		var target := Vector2i(int(next.c), int(next.r))
		var road: float=float(road_boost.call(entity,next)) if road_boost.is_valid() else 1.0
		var travel_duration := duration(from, target, speed,road)
		entity.travelDuration = travel_duration
		if entity.travelClock + 0.0000001 < travel_duration: break
		entity.travelClock = maxf(0.0, entity.travelClock - travel_duration)
		entity.c = target.x
		entity.r = target.y
		entity.path.pop_front()
		entity.landed = false
		if record_step.is_valid():record_step.call({"c":from.x,"r":from.y},{"c":target.x,"r":target.y})
		events.append({"from": from, "to": target})
	if entity.path.is_empty():
		entity.travelClock = 0.0
		entity.travelDuration = 0.0
	return events

# Strategic army travel without road wear or landmark effects. Returned steps
# allow the caller to reveal scout vision and connect those systems later.
static func advance_army(state: Dictionary,army: Dictionary,dt: float,migration_active: bool,can_traverse: Callable,road_boost: Callable=Callable(),record_step: Callable=Callable()) -> Array:
	var events: Array=[]
	if army.get("embarked")!=null or army.get("path",[]).is_empty():return events
	var multiplier:=ArmyExperience.travel_multiplier(state,army)
	var speed:=3.0*(7.5 if migration_active else 1.0)*multiplier
	var first: Dictionary=army.path[0]
	var initial_road: float=float(road_boost.call(army,first)) if road_boost.is_valid() else 1.0
	rescale_travel(army,duration(Vector2i(int(army.c),int(army.r)),Vector2i(int(first.c),int(first.r)),speed,initial_road))
	army.travelClock=float(army.get("travelClock",0))+dt
	for step in 6:
		if army.path.is_empty():break
		var next: Dictionary=army.path[0]
		if not can_traverse.call(army.team,next):army.path=[];army.travelClock=0.0;break
		var from:=Vector2i(int(army.c),int(army.r));var target:=Vector2i(int(next.c),int(next.r))
		var road: float=float(road_boost.call(army,next)) if road_boost.is_valid() else 1.0
		var travel_duration:=duration(from,target,speed,road);army.travelDuration=travel_duration
		if float(army.travelClock)+0.0000001<travel_duration:break
		army.travelClock=maxf(0,float(army.travelClock)-travel_duration)
		army.c=target.x;army.r=target.y;army.path.pop_front()
		var serial:=int(army.get("worldArrivalV258",{}).get("serial",0))+1
		army.worldArrivalV258={"c":army.c,"r":army.r,"serial":serial}
		if record_step.is_valid():record_step.call({"c":from.x,"r":from.y},{"c":target.x,"r":target.y})
		var has_scout:=false
		for unit in state.units:
			if unit.team==army.team and float(unit.get("hp",0))>0 and not ArmyExperience.is_garrisoned(unit) and int(unit.get("armyId",0))==int(army.get("id",0)) and unit.kind=="scout":has_scout=true;break
		events.append({"from":from,"to":target,"reveal":has_scout})
	if army.path.is_empty():army.travelClock=0.0;army.travelDuration=0.0
	return events
