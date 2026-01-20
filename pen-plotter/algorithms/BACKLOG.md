# Pen Plotter Algorithm Backlog

## Priority 0: Standardization (CRITICAL)

**See:** `ALGORITHM-CONTROLS-SPEC.md` for full specification.

**Status:** 4/54 algorithms fully compliant (7%)

### Tier 1: Almost There (4/5 score) - 2 algorithms
- [ ] `10print` - missing bgColor
- [ ] `spiral-burst` - missing strokeColor

### Tier 2: Partial (2-3/5 score) - 6 algorithms
- [ ] `image-to-ascii` - missing layout, strokeColor
- [ ] `flow-field-p5` - missing layout, bgColor, strokeColor
- [ ] `circle-twist` - missing layout, paperSize, bgColor
- [ ] `reaction-diffusion` - missing paperSize, bgColor, strokeColor
- [ ] `tree` - missing layout, bgColor, strokeColor
- [ ] `voronoi-stippling` - missing paperSize, bgColor, strokeColor

### Tier 3: Minimal (1/5 score) - 32 algorithms
All need: layout, paperSize, bgColor, strokeColor (most have randomize)

### Tier 4: No Compliance (0/5) - 10 algorithms
- `parametric-surfaces`, `ml5-patterns`, `chromatography`, `convection-cells`
- `crystallization`, `liesegang-rings`, `mixing-patterns`, `space-filling-curves`
- `maze-generator`, `moire-patterns`, `astronomy`, `differential-growth`

### Excluded (Tools, not algorithms)
- `debug-preview`, `path-optimizer`, `plotter-export`

---

## Priority 1: Bug Fixes (Option B)
- [ ] Fix `vortex-street-gui.html` - JS error reading undefined property '33'
- [ ] Fix `reaction-diffusion-gui.html` - duplicate variable declaration
- [ ] Fix `hatching-demo.html` - appendChild null error
- [ ] Add canvas fallbacks for WebGL algorithms (flow-field-collision, crystal-growth)
- [ ] Fix `elementary-ca-layers.html` - canvas regen detection
- [ ] Fix `hilbert-curve-gui.html` - canvas regen detection

## Priority 2: Infrastructure (Option C)
- [ ] Improve test runner to sample center of canvas (not just 200x200 top-left)
- [ ] Add "requires-image-input" metadata tag for image-processing algorithms
- [ ] Create algorithm gallery/index page with thumbnails
- [ ] Add preset system across all algorithms (save/load configurations)
- [ ] Add keyboard shortcuts (R for regenerate, S for save, etc.)
- [ ] Add URL parameter support for sharing configurations

## Priority 3: Polish Existing (Option D)
- [ ] Maze generator: Add more solvers (A*, Dijkstra visualization)
- [ ] Maze generator: Add maze types (hex grid, circular)
- [ ] Space-filling curves: Add Koch snowflake, Sierpinski triangle
- [ ] Add color modes for SVG export (multi-color paths by layer)
- [ ] Differential growth: Add boundary constraints
- [ ] Moiré patterns: Add wave/ripple variant

## Completed This Session (Dec 24, 2025)
- [x] Lorenz Attractor (includes Rössler, Thomas, Aizawa, Halvorsen)
- [x] String Art Generator (cardioid, nephroid, deltoid, astroid, parabola, web, bezier)
- [x] Mandelbrot/Julia Fractals (contour-based rendering)
- [x] Wave Interference (circular, linear, radial, grid patterns)

## Future Algorithm Ideas
- [ ] Clifford Attractor
- [ ] Hénon Map
- [ ] Barnsley Fern
- [ ] Apollonian Gasket
- [ ] Phyllotaxis (sunflower spirals)
- [ ] Voronoi variations (weighted, curved)
- [ ] Generative typography
- [ ] Op art patterns (Bridget Riley style)
- [ ] Geodesic dome projections
- [ ] Polyhedra wireframes (Platonic/Archimedean solids)

---
*Created: 2025-12-24*
