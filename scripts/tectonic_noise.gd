class_name TectonicNoise
extends RefCounted
# Numeric primitives for the original world-tectonic-v248.js generator.
const MASK := 0xffffffff
var random_state: int
var seed: int

func _init(value: int) -> void:
	seed = value & MASK
	random_state = (seed ^ 0x2545f491) & MASK
	if random_state == 0: random_state = 1

func random_value() -> float:
	random_state = (random_state ^ ((random_state << 13) & MASK)) & MASK
	random_state = (random_state ^ (random_state >> 17)) & MASK
	random_state = (random_state ^ ((random_state << 5) & MASK)) & MASK
	return float(random_state) / 4294967296.0

static func hash_value(x: int, y: int, value: int) -> float:
	var h: int = (((x * 374761393) & MASK) ^ ((y * 668265263) & MASK) ^ ((value * 1442695041) & MASK)) & MASK
	h = (((h ^ (h >> 13)) * 1274126177) & MASK)
	return float((h ^ (h >> 16)) & MASK) / 4294967296.0

static func noise(x: float, y: float, value: int, octaves := 4) -> float:
	var total := 0.0
	var amplitude := 1.0
	var frequency := 1.0
	var norm := 0.0
	for octave in octaves:
		var px := x * frequency + octave * 17.3
		var py := y * frequency - octave * 9.1
		var xi := floori(px)
		var yi := floori(py)
		var u := px - xi
		var v := py - yi
		u = u * u * (3.0 - 2.0 * u)
		v = v * v * (3.0 - 2.0 * v)
		var a := hash_value(xi, yi, value)
		var b := hash_value(xi + 1, yi, value)
		var c := hash_value(xi, yi + 1, value)
		var d := hash_value(xi + 1, yi + 1, value)
		total += (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * amplitude
		norm += amplitude
		amplitude *= 0.5
		frequency *= 2.03
	return total / norm
