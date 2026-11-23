class_name NavalExploration
extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const Naval=preload("res://scripts/naval_rules.gd")
const Discovery=preload("res://scripts/world_discoveries.gd")
const Armies=preload("res://scripts/army_management.gd")
const Campaign=preload("res://scripts/campaign_state.gd")

static func sea_path_to_unknown(state: Dictionary,ship: Dictionary,cells: Array,distances: PackedInt32Array) -> Variant:
 var c:=int(ship.c);var r:=int(ship.r);var origin:=r*Grid.COLS+c
 if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return null
 var previous:=PackedInt32Array();previous.resize(Grid.COLS*Grid.ROWS);previous.fill(-2);previous[origin]=-1
 var queue: Array[int]=[origin];var head:=0;var team:=int(ship.team)
 while head<queue.size():
  var current:=queue[head];head+=1;var p:=Vector2i(current%Grid.COLS,floori(float(current)/Grid.COLS))
  if current!=origin and not state.explored[team].has(str(p.x)+":"+str(p.y)):
   var result: Array=[];var at:=current
   while at!=origin:result.append({"c":at%Grid.COLS,"r":floori(float(at)/Grid.COLS)});at=previous[at]
   result.reverse();return result
  for direction in Grid.DIRECTIONS:
   var next: Vector2i=p+direction
   if next.x<0 or next.y<0 or next.x>=Grid.COLS or next.y>=Grid.ROWS:continue
   var index: int=next.y*Grid.COLS+next.x
   if previous[index]!=-2 or not Naval.sea_allowed(cells,distances,state.research[team].known,next):continue
   previous[index]=current;queue.append(index)
 return null

static func continue_scout(state: Dictionary,ship: Dictionary,army: Dictionary,cells: Array,distances: PackedInt32Array,can_traverse: Callable,find_path: Callable,territory: Dictionary) -> void:
 if not ship.get("path",[]).is_empty():return
 # Prefer a new landmass to endlessly surveying already visited coastal water.
 if ship.get("boardingLand") is Dictionary:
  for dr in range(-1,2):
   for dc in range(-1,2):
    var shore={"c":int(ship.c)+dc,"r":int(ship.r)+dr}
    if not can_traverse.call(shore):continue
    if find_path.call(ship.boardingLand,shore,ship.team)!=null:continue
    var error:=Naval.disembark_army(state,ship,shore,cells,func(_team,p):return can_traverse.call(p),func(team,p,radius):Campaign.reveal(state,team,int(p.c),int(p.r),radius))
    if error.is_empty():army.autoExplore=true;ship.autoScout=false;return
 var path: Variant=sea_path_to_unknown(state,ship,cells,distances)
 if path is Array and not path.is_empty():ship.path=path;return
 # Once all reachable water is explored, allow landing on neutral or own land.
 for dr in range(-1,2):
  for dc in range(-1,2):
   var shore={"c":int(ship.c)+dc,"r":int(ship.r)+dr};var key:=str(shore.c)+":"+str(shore.r)
   if not can_traverse.call(shore):continue
   if territory.has(key) and int(territory[key].team)!=int(ship.team):continue
   var error:=Naval.disembark_army(state,ship,shore,cells,func(_team,p):return can_traverse.call(p),func(team,p,radius):Campaign.reveal(state,team,int(p.c),int(p.r),radius))
   if error.is_empty():ship.autoScout=false;return

static func tick_player(state: Dictionary,cells: Array,distances: PackedInt32Array,can_traverse: Callable,find_path: Callable,territory: Dictionary) -> void:
 for army in state.armies:
  if int(army.team)!=0 or not army.get("autoExplore",false) or army.get("embarked")!=null or not army.get("path",[]).is_empty() or not Discovery.army_has_scout(state,army) or Armies.units(state,army).is_empty():continue
  var placed:=false
  for ship in state.get("ships",[]):
   if int(ship.team)!=0 or ship.kind!="transport" or float(ship.hp)<=0 or ship.get("cargo")!=null:continue
   if Naval.near(ship,army):
    if Naval.embark_army(state,ship,int(army.get("id",0)),cells).is_empty():ship.autoScout=true;placed=true
   else:
    for dr in range(-1,2):
     for dc in range(-1,2):
      var land={"c":int(ship.c)+dc,"r":int(ship.r)+dr}
      if not can_traverse.call(land):continue
      var path: Variant=find_path.call(army,land,0)
      if path is Array and not path.is_empty():army.path=path;placed=true;break
     if placed:break
   if placed:break
 for ship in state.get("ships",[]):
  if int(ship.team)!=0 or ship.kind!="transport" or float(ship.hp)<=0 or not ship.get("autoScout",false) or not ship.get("cargo") is Dictionary or ship.cargo.get("kind")!="army":continue
  var army: Variant=Naval.cargo_army(state,ship)
  if army==null or not army.get("autoExplore",false):ship.autoScout=false;continue
  continue_scout(state,ship,army,cells,distances,can_traverse,find_path,territory)

