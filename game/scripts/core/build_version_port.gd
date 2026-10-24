extends RefCounted
## Release metadata is embedded into each tested game.pck during CI export.
## Offline/local builds stay explicitly unverified; never present an old cached
## version number as the latest verified release.
const PACK_INFO: String = "res://data/build_info.json"
const LAST_CHECK: String = "user://ota/latest.json"
const RELEASES_API: String = "https://api.github.com/repos/orogdor/Kuningriigid/releases?per_page=20"

static func _json_file(path: String) -> Dictionary:
    var file: FileAccess = FileAccess.open(path,FileAccess.READ)
    if file == null:
        return {}
    var decoded: Variant = JSON.parse_string(file.get_as_text())
    return decoded if decoded is Dictionary else {}

static func release_number(tag: String) -> int:
    if not tag.begins_with("godot-dev-"):
        return -1
    var digits: String = tag.trim_prefix("godot-dev-")
    return int(digits) if digits.is_valid_int() and int(digits)>=0 else -1

static func latest_from_releases(releases: Variant) -> String:
    if not (releases is Array):
        return ""
    var best: int = -1
    for release in releases:
        if not (release is Dictionary) or bool(release.get("draft",false)):
            continue
        var tag: String = str(release.get("tag_name",""))
        var run: int = release_number(tag)
        if run > best:
            best = run
    return "godot-dev-"+str(best) if best >= 0 else ""

static func compare_tags(installed: String,latest: String) -> int:
    var have: int = release_number(installed)
    var remote: int = release_number(latest)
    if have < 0 or remote < 0:
        return 0 if installed == latest and installed != "" else -2
    if have == remote:
        return 0
    return -1 if have < remote else 1

static func status_for(installed: String,latest: Dictionary) -> Dictionary:
    var clean_tag: String = installed if release_number(installed) >= 0 else "teadmata"
    var checked: bool = bool(latest.get("checked",false))
    var remote_tag: String = str(latest.get("tag",""))
    var compare: int = compare_tags(installed,remote_tag) if checked else -2
    var status: String = "KONTROLLIMATA"
    if compare == 0 or compare == 1:
        status = "UUSIM KONTROLLIMISE HETKEL"
    elif compare == -1:
        status = "UUENDUS SAADAVAL"
    return {"tag":clean_tag,"latest":remote_tag if checked else "",
        "status":status,"checked":checked,"update":compare==-1,
        "verified":checked and compare>=0,"checked_at":int(latest.get("checked_at",0))}

static func snapshot() -> Dictionary:
    var build: Dictionary = _json_file(PACK_INFO)
    return status_for(str(build.get("tag","")), _json_file(LAST_CHECK))

static func hud_text(data: Dictionary) -> String:
    var installed: String = str(data.get("tag","teadmata"))
    var short_state: String = "? KONTROLLIMATA"
    if bool(data.get("update",false)):
        short_state = "↑ UUENDUS"
    elif bool(data.get("verified",false)):
        short_state = "✓ UUSIM"
    return installed+"  |  "+short_state

static func detail_text(data: Dictionary) -> String:
    var latest: String = str(data.get("latest",""))
    if latest == "":
        return "Viimast GitHubi versiooni ei õnnestunud käivitamisel kontrollida"
    return "Viimane GitHubis: "+latest+" | "+str(data.get("status","KONTROLLIMATA"))
