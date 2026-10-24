extends RefCounted
## Reproducible V131 Earth-mode source-height/drainage data.
## Baked offline from pinned V131 formulas, with 14 legacy synthetic city sites protected.
const COLS: int = 220
const ROWS: int = 165
const BUNDLE_PATH: String = "res://data/v131_earth_seed131_atlas.bin"
const DISPLAY_SCALE: float = 0.145

static func load_baked() -> Dictionary:
    var file := FileAccess.open(BUNDLE_PATH,FileAccess.READ)
    if file == null:
        push_error("V131 atlas file missing: " + BUNDLE_PATH)
        return {}
    var magic: PackedByteArray = file.get_buffer(4)
    if magic.size() != 4 or magic.get_string_from_ascii() != "K131":
        push_error("Invalid V131 atlas header")
        return {}
    file.big_endian = false
    var w: int = file.get_32()
    var h: int = file.get_32()
    var seed: int = file.get_32()
    var scale: float = file.get_float()
    if w != COLS or h != ROWS or seed != 131 or absf(scale-DISPLAY_SCALE) > .00001:
        push_error("V131 atlas dimensions, seed or scale mismatch")
        return {}
    var samples := PackedFloat32Array()
    var drainage := PackedInt32Array()
    var widths := PackedFloat32Array()
    var fords := PackedByteArray()
    samples.resize(w*h)
    drainage.resize(w*h)
    widths.resize(w*h)
    fords.resize(w*h)
    for i in range(w*h):
        samples[i] = file.get_float()
        var next: int = file.get_32()
        drainage[i] = -1 if next == 4294967295 else next
        widths[i] = file.get_float()
        fords[i] = file.get_8()
    if file.get_position() != file.get_length():
        push_warning("Unexpected trailing atlas bytes")
    return {"heights":samples,"downstream":drainage,"widths":widths,"fords":fords,"seed":seed,"scale":scale}

static func world_passable(height: float,river_to: int,ford: int,bridge_open: bool) -> bool:
    # campaign.js: ocean and mountains do not admit land traffic.
    # world-geography.js: an unbridged deep river blocks land crossing.
    return height >= DISPLAY_SCALE and height <= 30.0*DISPLAY_SCALE and (river_to < 0 or ford != 0 or bridge_open)
