extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")

func _initialize():
 call_deferred("run_test")

func run_test():
 var panel=HousePanel.new();root.add_child(panel)
 var design={"rooms":[{"type":"rect","a":{"x":0,"y":0},"b":{"x":146,"y":73}}]}
 panel.update_measurements(design)
 assert(panel.measurements.text.contains("2.0 × 1.0 m"))
 assert(panel.measurements.text.contains("2.0 m²"))
 assert(panel.ledger_text.text.contains("Välisseinad: 6.0 m"))
 assert(panel.ledger_text.text.contains("Suurim ruum: 8.5 m"))
 panel.update_measurements({"rooms":[]})
 assert(panel.measurements.text=="Mõõdud: —")
 panel.update_measurements({"rooms":[],"openSite":true,"plot":[{"x":0,"y":0},{"x":146,"y":0},{"x":146,"y":73},{"x":0,"y":73}],"fences":[{"kind":"rail","a":{"x":0,"y":0},"b":{"x":146,"y":0}}]})
 assert(panel.ledger_text.text.contains("Ehitusala: 2 m²") and panel.ledger_text.text.contains("Aiad: 2.0 m"))
 print("HOUSE_MEASUREMENTS_OK")
 quit()
