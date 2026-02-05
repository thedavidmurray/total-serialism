# Total Serialism Pen Plotter - Comprehensive Audit Findings

**Date**: 2026-02-05
**Scope**: All 92 algorithm HTML files, 15 shared infrastructure files, index.html
**Method**: 6 parallel code audit agents + browser automation testing

---

## Executive Summary

| Severity | Code Audit | Browser Audit | Total |
|----------|-----------|---------------|-------|
| CRITICAL | 22 | 3 | **25** |
| HIGH | 62 | 5 | **67** |
| MEDIUM | 142 | 8 | **150** |
| LOW | 103 | 6 | **109** |
| **Total** | **329** | **22** | **351** |

### Top 5 Systemic Issues

1. **p5.js-svg@1.5.1 incompatible with p5.js 1.7.0** - `createGraphics(w,h,SVG)` crashes on 2 pages (kumiko, zellige), and SVG export via `save(svgCanvas,...)` silently produces PNG on 10+ files where canvas was created without SVG renderer
2. **Paper size naming fragmented** - 3 different naming conventions across 92 files, causing silent fallback to default sizes
3. **Script load order bugs** - 5+ files load `panel-controller.js`/`stats-display.js` AFTER the main script tries to use them
4. **11 algorithm files exist on disk but are not linked from index.html** - entire fractals category missing
5. **TSStatsDisplay API fragmented** - 6+ different method signatures called, many non-existent

---

## P0: CRITICAL - Runtime Crashes & Broken Pages

### C1. p5.js-svg@1.5.1 incompatibility with p5.js 1.7.0
**Files**: `kumiko-pattern.html:336`, `zellige-pattern.html:392`
**Error**: `TypeError: Cannot read properties of undefined (reading 'elt')` in `createGraphics(w,h,SVG)`
**Impact**: Pages completely crash on load - blank white page
**Fix**: Remove `createGraphics(w,h,SVG)` call; use manual SVG generation via `TSExport.createSVG()` instead

### C2. Script load order - classes used before script loads
**Files**: `crystallization-gui.html:823-824`, `magnetic-field-gui.html`, `chladni-patterns-gui.html:684-685`, `parametric-surfaces-gui.html:639-640`, `sound-waveform-gui.html:667-668`
**Error**: `ReferenceError: TSPanelController is not defined`
**Fix**: Move `<script src="panel-controller.js">` and `<script src="stats-display.js">` to `<head>`

### C3. Variable shadowing causes crash in perlin-landscape
**File**: `perlin-landscape-gui.html:635,673`
**Error**: `line` forEach parameter shadows p5.js `line()` function - crashes in contour/perspective modes
**Fix**: Rename the forEach parameter to `seg` or `segment`

### C4. Broken path-optimizer import in spiral-fill
**File**: `spiral-fill.html:12`
**Error**: `<script src="../../../../path-optimizer.js">` resolves outside repo - `PathOptimizer is not defined`
**Fix**: Change to `../../path-optimizer.js`

### C5. phyllotaxis randomSeed infinite recursion
**File**: `phyllotaxis-gui.html:910`
**Error**: User-defined `randomSeed()` shadows p5.js built-in, causes infinite recursion
**Fix**: Rename to `newRandomSeed()` or `generateNewSeed()`

### C6. Placeholder curve generators silently return wrong data
**File**: `hilbert-curve-gui.html:674-684`
**Error**: `generateGosper()` and `generateSierpinski()` are stubs returning Hilbert curves
**Fix**: Either implement properly or remove from UI dropdown and show "not implemented" warning

### C7. Lissajous presets reference nonexistent mode
**File**: `lissajous-gui.html:351-355`
**Error**: 'Trefoil Knot' and 'Complex Knot' presets use `mode: 'knot'` which doesn't exist in select
**Fix**: Either add 'knot' mode to the select, or change preset mode to 'single'

### C8. const reassignment in param-manager.js
**File**: `shared/param-manager.js:43-44`
**Error**: `const filepath` reassigned - `TypeError: Assignment to constant variable`
**Fix**: Change `const` to `let`

### C9. Node.js require() in browser file
**File**: `shared/param-manager.js:4-5`
**Error**: `require('fs')` and `require('path')` crash in browser
**Fix**: Delete or rewrite for browser (use localStorage like preset-manager.js)

### C10. Missing collision-detection.js file
**File**: `collision-detection.js` referenced but does not exist on disk
**Fix**: Create stub or remove references

### C11. Plotter optimizer stub methods
**File**: `plotter-optimizer.js:49-68`
**Error**: `removeDuplicatePoints`, `mergeNearbyEndpoints`, `optimizeStrokeOrder` are empty stubs
**Fix**: Implement or delegate to `path-optimizer.js`

---

## P1: HIGH - Broken Features

### H1. SVG export produces raster PNG on 10+ files
**Files**: `hash-tiles-gui.html:666`, `perlin-circles-gui.html:693`, `snowflakes-gui.html:679`, `spirotron-gui.html:733`, `grid-landscape-gui.html:1082`, `circle-rays-gui.html`, `belousov-zhabotinsky-gui.html:691`, `crystallization-gui.html:730`
**Issue**: Canvas created as regular (not SVG) but `save(svgCanvas,...)` called - exports PNG not SVG
**Fix**: Switch to `TSExport.createSVG()` for manual SVG generation

### H2. Broken link in index.html
**File**: `index.html` links to `test-color-controls.html` which returns 404
**Fix**: Remove from index

### H3. 11 unlinked algorithm files
**Files**:
- `geometric/maze-generator-gui.html`
- `geometric/moire-patterns-gui.html`
- `geometric/string-art-gui.html`
- `natural/differential-growth-gui.html`
- `advanced/vortex-street-gui.html`
- `ai/neural-network-art-gui.html`
- `curves/harmonograph-datgui.html`
- `curves/space-filling-expanded-gui.html`
- `fractals/mandelbrot-julia-gui.html` (entire fractals category missing!)
- `tools/algorithm-validator.html`
- `tools/functional-validator.html`
**Fix**: Add to index.html, create fractals category

### H4. Preset value/slider range mismatches
**Files**: `harmonograph-gui.html:406-448`, `lissajous-gui.html:329-360`, `rose-curves-gui.html:309-340`
**Issue**: builtInPresets store pixel values (150-200) but sliders max at 0.95-2.0
**Fix**: Normalize preset values to match slider ranges

### H5. sound-waveform broken SVG export
**File**: `sound-waveform-gui.html:620-644`
**Issue**: Hardcoded canvas size 800px, empty recorded paths, wrong colorMode (HSB values in RGB mode)
**Fix**: Use actual canvas dimensions, populate SVG paths, fix colorMode

### H6. game-of-life stub export functions
**File**: `game-of-life-gui.html:684-691`
**Issue**: `exportAnimation()` and `exportAtGeneration()` just show alert() stubs
**Fix**: Implement or remove buttons

### H7. Paper size naming inconsistency (3 conventions)
**Convention A**: `A4_landscape`, `square_medium` (expected by CanvasLayout)
**Convention B**: `A5`, `A5L`, `A4`, `A4L` (used by some files)
**Convention C**: `a4portrait`, `square800`, `landscape800x600` (used by other files)
**Fix**: Standardize all to Convention A

### H8. Missing PNG export on 7+ files
**Files**: chladni-patterns-gui, parametric-surfaces-gui, sound-waveform-gui, vortex-street-gui, elementary-ca-layers, game-of-life-gui (6+ files)
**Fix**: Add PNG export button using TSExport.downloadPNG()

### H9. Stroke color ignored in rendering
**Files**: `astronomy-gui.html`, `coral-growth-gui.html`, `lightning-gui.html`, `perlin-circles-gui.html`, `hash-tiles-gui.html`, `spirotron-gui.html`, `snowflakes-gui.html`
**Issue**: User-selected strokeColor has no effect - colors hardcoded
**Fix**: Use `params.strokeColor` in draw functions

### H10. rose-curves nestedControl visible on wrong mode
**File**: `rose-curves-gui.html:183`
**Issue**: Layers slider visible in 'single' mode (should be hidden)
**Fix**: Add `style="display:none"` to nestedControl div

### H11. TSStatsDisplay method calls to non-existent API
**Files**: convection-cells (setValue), liesegang-rings (setRings), mixing-patterns (setCustomStat), crystallization (setCustomStat, setSeed), belousov (setSeed, set)
**Fix**: Use `statsDisplay.update({})` which is the actual API

### H12. elementary-ca-layers GIF color bug
**File**: `elementary-ca-layers.html`
**Issue**: `.levels` accessed on hex string return value - GIF frames render blank
**Fix**: Convert hex to p5.Color before accessing .levels

### H13. Path optimizer O(n^2) and O(n^3)
**File**: `path-optimizer.js:71-84,389-406`
**Issue**: No spatial indexing for TSP (O(n^2)) and 2-opt (O(n^3))
**Fix**: Add quadtree/k-d tree for nearest neighbor search

### H14. plotter-formats SVG parser incomplete
**File**: `plotter-formats.js:452-511`
**Issue**: Missing S, T, A commands and all relative (lowercase) variants; bezier curves reduced to lines
**Fix**: Complete the parser or use a library

### H15. layer-export getElementBounds only handles line/rect
**File**: `layer-export.js:362-393`
**Issue**: Returns null for circle, ellipse, polygon, polyline, path - most SVG elements skipped
**Fix**: Implement bounds for all SVG element types

---

## P2: MEDIUM - Significant Issues (selected highlights)

- **Non-deterministic rendering** in astronomy, coral-growth (Math.random in draw)
- **O(n^2) performance** in boids-flocking, differential-growth, space-colonization
- **No seed/reproducibility** on 15+ files
- **Memory leaks** from unrevoked URL.createObjectURL in 8+ files
- **Dead preset containers** in DOM with no PresetManager initialized (6 files)
- **GIF worker URL inconsistency** (/dist/gif.worker.js vs /gif.worker.js)
- **Duplicate functionality** between plotter-optimizer.js (stubs) and path-optimizer.js (real)
- **Inline CSS overrides** (225 lines in space-filling-expanded duplicating algorithm.css)
- **filter buttons don't cover all 19 categories** in index.html (missing textures, packing, hybrid, ai)
- **path-optimizer mergeNearbyEndpoints bug** at line 137-138 (extra array nesting)
- **spiral-burst wrong method** at line 1062 (createObjectURL instead of revokeObjectURL)

---

## Browser Audit Summary

| Test | Result |
|------|--------|
| Total files on disk | 92 |
| Files linked from index | 81 |
| Unlinked files | 11 |
| Broken links | 1 (test-color-controls.html) |
| Pages that crash on load | 2 (kumiko, zellige) |
| Pages missing export | 9 |
| Pages missing presets | 6 |
| Pages missing paper size | 6 |
| Pages missing stats+panel | 23 |
| Pages using raw canvas (no p5) | 13 |

---

## Agent Audit Summary

| Agent | Scope | Files | CRIT | HIGH | MED | LOW |
|-------|-------|-------|------|------|-----|-----|
| Geometric | algorithms/geometric/ | 18 | 8 | 16 | 46 | 32 |
| Natural | algorithms/natural/ | 9 | 1 | 8 | 22 | 23 |
| Chemical+Curves | chemical/ + curves/ | 13 | 5 | 19 | 28 | 15 |
| Physics+Advanced+Cellular | physics/advanced/cellular-automata/ | 15 | 4 | 18 | 28 | 21 |
| Remaining | all other categories | ~20 | ~2 | ~6 | ~12 | ~8 |
| Shared Infrastructure | root JS + shared/ | 15 | 4 | 9 | 18 | 12 |

---

*Generated by Claude Code comprehensive audit - 2026-02-05*
