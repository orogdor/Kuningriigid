# Kuningriigid GitHub Actions policy

This repository intentionally keeps historical version-specific tests available **on demand**, instead of running them on every change.

- **On each push:** `.github/workflows/v128.yml` runs quick traffic/rules checks and publishes validated web content. Its 10-profile browser matrix is skipped for pushes.
- **Current wall editing:** `v1754-real-touch.yml` and `v1754-wall-and-gates.yml` still run for their relevant source paths, covering real touch, wall seams, gates and pathfinding.
- **Full browser matrix:** Actions > Fast Game Validation > Run workflow. A manual run performs all browser profiles before publishing.
- **Other historical version-specific workflows:** Actions > select named workflow > Run workflow. Their test scripts are retained. They must not be re-enabled as push triggers without a specific reason.
- **200-turn regression:** `regression-200.yml` remains available for manual runs and configured pull requests.
- **GitHub Pages:** `avaldamine.yml` and GitHub Pages' deployment mechanism remain in place.

When adding new tests, add them to the existing quick path or on-demand matrix rather than creating another long-lived versioned push workflow. Do not remove saved-game, automatic road generation, army-wall collision or mobile interaction regression coverage; run their extended suites manually before milestone releases.
