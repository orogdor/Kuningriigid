# Sapling 30 trees — actual output and measurement

30 variants, 90 GLB files. Blender 5.2.3 / Sapling 1.0.0. Near: 2293–2536 triangles; mid: 294–312; far: 6. Khronos: 0 errors / 0 warnings. Main branch unchanged; draft PR #49 awaits visual approval.

Measurements: GitHub Actions, 1280×800, explicit SwiftShader CPU renderer. These are low-sample software measurements, not phone/RTX performance. p95 has insufficient samples; see raw report.

| Trees | View | FPS | Mean frame ms | p95 ms | Samples | Draw calls | Triangles | Asset memory estimate MiB |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 300 | near | 0.290 | 3449.9 | 6616.4 | 3 | 119 | 334803 | 102.3 |
| 300 | mid | 0.233 | 4286.5 | 10033.0 | 5 | 61 | 1802 | 102.3 |
| 300 | far | 0.348 | 2870.7 | 3833.1 | 4 | 61 | 1802 | 102.3 |
| 3000 | near | 1.405 | 711.9 | 3599.9 | 7 | 181 | 720265 | 103.3 |
| 3000 | mid | 0.286 | 3495.7 | 7316.3 | 4 | 121 | 75754 | 103.3 |
| 3000 | far | 0.077 | 12941.2 | 12949.5 | 2 | 61 | 18002 | 103.3 |
| 12000 | near | 0.800 | 1250.0 | 2133.3 | 5 | 181 | 668015 | 106.5 |
| 12000 | mid | 1.682 | 594.4 | 2133.2 | 9 | 121 | 139632 | 106.5 |
| 12000 | far | 0.166 | 6022.0 | 9216.2 | 3 | 61 | 72002 | 106.5 |

All nine cases reported no browser errors. Heap reading: 33.1 MB; VRAM is an estimate, not a direct GPU reading. Low sample count is flagged in every case. Existing placement tests and all 23 required regression groups passed. Real game map rendering integration and real hardware performance remain pending.
