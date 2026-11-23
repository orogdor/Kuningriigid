class_name ResearchLayout
extends RefCounted

# Web game research-preview-v123.js and tech-tree-layout-v119.js.
const Research=preload("res://scripts/research_rules.gd")
const NODE_W:=218.0
const NODE_H:=124.0
const COL_GAP:=34.0
const ROW_GAP:=64.0
const MARGIN_X:=36.0
const TOP_GAP:=74.0
const BOTTOM_GAP:=24.0
const ERA_GAP:=65.0

static func progressive(techs: Dictionary,research: Dictionary) -> Dictionary:
	var known: Array=research.get("known",[])
	var present: Array=[]
	var opened: Array=[]
	for id in techs:
		if id in known or research.get("active")==id or Research.tech_block(research,id)=="":present.append(id)
		if id not in known and (research.get("active")==id or Research.tech_block(research,id)==""):opened.append(id)
	var previews: Dictionary={}
	for current in opened:
		var simulated:=research.duplicate()
		simulated.known=known.duplicate();simulated.known.append(current)
		simulated.active=null;simulated.v118LegacyActive=null
		for id in techs:
			if id in known or id in opened or Research.tech_block(simulated,id)!="":continue
			if not previews.has(id):previews[id]=[]
			previews[id].append(current)
	var ids:=present.duplicate()
	for id in previews:
		if id not in ids:ids.append(id)
	return {"ids":ids,"present":present,"previews":previews}

static func predecessors(techs: Dictionary,id: String,shown: Dictionary,era_ids: Array) -> Array:
	var t: Dictionary=techs[id]
	var result: Array=[]
	for p in t.get("requires",[])+t.get("oneOf",[]):
		if shown.has(p) and p not in result:result.append(p)
	var age:=int(t.age)
	var gate: String=era_ids[age]
	var has_same:=false
	for p in result:
		if int(techs[p].age)==age:has_same=true;break
	if age>0 and id!=gate and shown.has(gate) and not has_same and gate not in result:result.append(gate)
	return result

static func rank(id: String,techs: Dictionary,shown: Dictionary,era_ids: Array,levels: Dictionary,visiting: Dictionary) -> int:
	if levels.has(id):return levels[id]
	if visiting.has(id):return 0
	visiting[id]=true
	var level:=0
	for p in predecessors(techs,id,shown,era_ids):
		if int(techs[p].age)==int(techs[id].age):level=maxi(level,rank(p,techs,shown,era_ids,levels,visiting)+1)
	visiting.erase(id);levels[id]=level
	return level

static func layout(techs: Dictionary,ids: Array,era_names: Array,era_ids: Array,columns:=4) -> Dictionary:
	columns=maxi(1,columns)
	var width:=columns*(NODE_W+COL_GAP)-COL_GAP+2*MARGIN_X
	var shown: Dictionary={};var positions: Dictionary={};var bands: Array=[];var edges: Array=[]
	for id in ids:shown[id]=true
	var top:=TOP_GAP
	for age in era_names.size():
		var group: Array=[]
		for id in ids:
			if int(techs[id].age)==age:group.append(id)
		if group.is_empty():continue
		var levels: Dictionary={};var visiting: Dictionary={};var max_rank:=0
		for id in group:max_rank=maxi(max_rank,rank(id,techs,shown,era_ids,levels,visiting))
		var start:=top-48
		for row in range(max_rank+1):
			var nodes: Array=[]
			for id in group:
				if int(levels[id])==row:nodes.append(id)
			nodes.sort_custom(func(a,b):
				var ca:=str(techs[a].get("category",""));var cb:=str(techs[b].get("category",""))
				return ca<cb if ca!=cb else str(a)<str(b))
			for offset in range(0,nodes.size(),columns):
				var count:=mini(columns,nodes.size()-offset)
				var left: float=(width-(count*NODE_W+(count-1)*COL_GAP))/2.0
				for i in count:positions[nodes[offset+i]]={"x":roundf(left+i*(NODE_W+COL_GAP)),"y":roundf(top),"age":age}
				top+=NODE_H+ROW_GAP
		bands.append({"age":age,"start":maxf(0,start),"end":top})
		top+=ERA_GAP
	for id in ids:
		var t: Dictionary=techs[id]
		var added: Dictionary={}
		for p in t.get("requires",[]):add_edge(edges,added,positions,p,id,false,false)
		for p in t.get("oneOf",[]):add_edge(edges,added,positions,p,id,true,false)
		var age:=int(t.age);var gate: String=era_ids[age];var has_same:=false
		for edge in edges:
			if edge.to==id and int(techs[edge.from].age)==age:has_same=true;break
		if age>0 and id!=gate and not has_same:add_edge(edges,added,positions,gate,id,false,true)
	return {"ids":ids,"positions":positions,"bands":bands,"edges":edges,"width":width,"height":maxf(360,top+BOTTOM_GAP),"columns":columns}

static func add_edge(edges: Array,added: Dictionary,positions: Dictionary,source: String,dest: String,optional: bool,implicit: bool) -> void:
	if not positions.has(source) or not positions.has(dest) or added.has(source):return
	if float(positions[source].y)>=float(positions[dest].y):return
	added[source]=true
	edges.append({"from":source,"to":dest,"optional":optional,"implicit":implicit})
