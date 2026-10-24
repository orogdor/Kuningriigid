# V2.5 detailnavigation — scope

This is a partial Godot 4 implementation of one aspect of V131 navigation.js, not a byte-for-byte behavior port.

- Every involved world-grid edge is expanded to a paired AStarGrid2D traversal of 45x39 cells per detail tile, spaced 5 metres in 225x195 tile coordinates.
- World BFS eligibility remains mandatory. Local routing may additionally reject any edge when there is no dry passage; bridge tiles can override a test river corridor.
- Geometry is cached per tile and per directed edge. Adding/demolishing buildings or toggling the test bridge invalidates these runtime caches. Material shipments are validated before source stock is debited.
- Partial routes, the current target, travel time, and local points persist with county agents. Old V2.4 saves are readable via migration; new saves use a new filename.
- The *bridge test* is synthetic and labelled as such. It does not reconstruct original world river network, shoreline, ford semantics or bridges in V131's actual atlas.
- Tests in `tests/port_checks.gd` must be RUN within the Godot project. Python tools only perform static and independent model checks.
