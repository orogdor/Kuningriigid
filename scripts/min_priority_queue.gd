class_name MinPriorityQueue
extends RefCounted
var keys: Array[float] = []
var values: Array[int] = []

func push(key: float, value: int) -> void:
	var index := values.size()
	keys.append(key)
	values.append(value)
	while index > 0:
		var parent := (index - 1) >> 1
		if keys[parent] <= key: break
		keys[index] = keys[parent]
		values[index] = values[parent]
		index = parent
	keys[index] = key
	values[index] = value

func pop() -> int:
	var top := values[0]
	var last_key: float = keys.pop_back()
	var last_value: int = values.pop_back()
	if not values.is_empty():
		var index := 0
		while true:
			var child := index * 2 + 1
			if child >= values.size(): break
			if child + 1 < values.size() and keys[child + 1] < keys[child]: child += 1
			if keys[child] >= last_key: break
			keys[index] = keys[child]
			values[index] = values[child]
			index = child
		keys[index] = last_key
		values[index] = last_value
	return top

func size() -> int:
	return values.size()
