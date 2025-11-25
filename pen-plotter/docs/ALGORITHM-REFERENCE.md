# Algorithm Reference Guide

Complete reference for all 78 pen plotter algorithms with parameters, outputs, and best practices.

## Quick Reference

### Export Formats by Algorithm

| Format | Count | Coverage |
|--------|-------|----------|
| SVG | 78/78 | 100% |
| PNG | 59/78 | 76% |
| GIF | 48/78 | 62% |
| Multi-Layer SVG | 1/78 | 1% |
| DXF | Available via module | ✓ |
| HPGL | Available via module | ✓ |

### Paper Size Support

Currently 6 algorithms support custom paper sizes (A3, A4, A5, Letter, Legal, Tabloid):
- Image to ASCII
- (More to be added)

---

## Image Processing Algorithms

### Image to ASCII
**Path:** `pen-plotter/algorithms/image-processing/image-to-ascii-gui.html`
**Complexity:** Beginner | **Featured:** ✓

Converts uploaded images to ASCII art using monospace characters, optimized for pen plotting.

**Parameters:**
- **Paper Size**: A3, A4, A5, Letter, Legal, Tabloid, Custom
- **Character Set**: Standard (` .:-=+*#%@`), Detailed (90 chars), Blocks (`░▒▓█`), Simple, Binary
- **Font Size**: 6-24pt (affects detail level)
- **Columns**: 40-200 (higher = more detail)
- **Brightness**: -100 to +100 (image adjustment)
- **Contrast**: 0-200 (increases edge definition)
- **Invert Colors**: Boolean (light/dark reversal)
- **Edge Detection**: Boolean (Sobel operator for outlines)

**Export Formats:**
- SVG (vector, scalable)
- PNG (raster preview)
- TXT (raw ASCII text)
- HTML (standalone webpage)

**Best Use Cases:**
- Photo portraits with high contrast
- Logo conversion for plotting
- Text-based artistic effects
- Educational demonstrations

**Tips:**
- Use "Detailed" character set for photorealistic results
- Use "Binary" for high-contrast silhouettes
- Enable edge detection for technical drawings
- Lower column count for faster plotting

---

### Halftone
**Path:** `pen-plotter/algorithms/image-processing/halftone.html`
**Complexity:** Intermediate | **Featured:** ✓

Converts images to halftone dot patterns using circle sizes based on brightness.

**Parameters:**
- **Dot Spacing**: 4-20px (grid resolution)
- **Min/Max Dot Size**: Circle diameter range
- **Invert**: Reverse light/dark mapping
- **Shape**: Circle, Square, Cross

**Export Formats:**
- SVG (optimized for plotting)
- PNG (preview)

**Best Use Cases:**
- Newspaper-style imagery
- Retro printing aesthetics
- Gradient representation with solid dots

---

### Hatching
**Path:** `pen-plotter/algorithms/image-processing/hatching.html`
**Complexity:** Intermediate

Converts images to cross-hatching patterns using directional line density.

**Parameters:**
- **Line Spacing**: 3-15px
- **Angle Variation**: 0-90° (hatching direction)
- **Layers**: 1-4 (cross-hatching depth)

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Engraving-style artwork
- Shading with line work
- Technical illustration

---

### SquiggleCam
**Path:** `pen-plotter/algorithms/image-processing/squigglecam.html`
**Complexity:** Intermediate

Converts images to flowing squiggly lines following brightness contours.

**Parameters:**
- **Line Count**: 50-500
- **Amplitude**: Squiggle intensity
- **Frequency**: Wave frequency
- **Smoothness**: Curve interpolation

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Organic, flowing artwork
- Portrait stylization
- Abstract interpretations

---

### Image Dithering
**Path:** `pen-plotter/algorithms/image-processing/dithering-gui.html`
**Complexity:** Intermediate | **Featured:** ✓

Converts grayscale/color images to binary black-and-white patterns using classic dithering algorithms.

**Algorithms:**
- **Floyd-Steinberg**: Classic error diffusion (7/16, 3/16, 5/16, 1/16 distribution)
- **Atkinson**: Mac 1984 aesthetic (3/4 error, 6 neighbors, brighter output)
- **Bayer**: Ordered dithering with threshold matrices (2×2, 4×4, 8×8)
- **Sierra**: Fast error diffusion (10 neighbors, simpler fractions)
- **Simple Threshold**: Binary cutoff (fastest, no diffusion)

**Parameters:**
- **Algorithm**: Floyd-Steinberg, Atkinson, Bayer 2×2/4×4/8×8, Sierra, Threshold
- **Threshold**: 0-255 (brightness cutoff, lower = more black pixels)
- **Resolution Scale**: 0.1-2.0 (downscale for faster processing)
- **Export Mode**: Dots (circles), Lines (horizontal regions), Stipple (random)
- **Dot/Line Size**: 0.5-5px
- **Spacing**: 1-5px (pixel sampling interval)

**Export Formats:**
- SVG (vector dots/lines)
- PNG (raster preview)

**Best Use Cases:**
- Photo portraits with Floyd-Steinberg
- Game Boy aesthetic with Bayer 4×4
- Vintage Mac look with Atkinson
- High-contrast silhouettes with Threshold
- Stippled art with dots mode
- Fast plotting with lines mode

**Tips:**
- Floyd-Steinberg produces photorealistic results but complex paths
- Bayer creates consistent patterns, ideal for textures
- Atkinson creates brighter, higher-contrast images
- Lower threshold = darker overall image
- Dots mode best for pen plotting (predictable strokes)
- Lines mode fastest to plot (fewer pen lifts)
- Use scale < 1.0 to reduce detail and plotting time

**Plotting Time Estimates:**
- Dots mode: ~1-5 minutes per 10,000 black pixels
- Lines mode: ~30 seconds per 1,000 lines
- Coverage: 30-70% black typical for good images

---

## Voronoi & Stippling

### Voronoi Stippling
**Path:** `pen-plotter/algorithms/voronoi/voronoi-stippling-gui.html`
**Complexity:** Intermediate | **Featured:** ✓

Weighted point distribution using Lloyd's relaxation algorithm for creating stippled images.

**Parameters:**
- **Point Count**: 100-10,000 (total stipples)
- **Point Size**: 0.5-10px (dot diameter)
- **Iterations**: 1-200 (relaxation cycles)
- **Mode**: Weighted (image-based), Uniform, Random, Grid
- **Density Bias**: 0.1-5.0 (darkness weight)
- **Invert Image**: Boolean

**Display Options:**
- Show Voronoi Cells
- Show Delaunay Triangulation
- Show Source Image

**Export Formats:**
- SVG (pure stipples, no image)
- PNG

**Algorithm:** Adrian Secord's Weighted Voronoi Stippling with centroid-based Lloyd's relaxation

**Best Use Cases:**
- Photo-realistic stippling
- Pointillist artwork
- Preparatory work for TSP Art
- Scientific visualization

**Tips:**
- Use 2000-5000 points for balanced detail/speed
- Higher iterations (100+) for better distribution
- Density bias 2.0-3.0 for dramatic contrast
- Upload high-contrast images for best results

---

### TSP Art Generator
**Path:** `pen-plotter/algorithms/voronoi/tsp-art-gui.html`
**Complexity:** Intermediate | **Featured:** ✓

Creates continuous single-line drawings by solving the Traveling Salesman Problem through points.

**Parameters:**

**Point Generation:**
- **Mode**: Random, Image-Based (brightness), Grid, Poisson Disc, Manual
- **Point Count**: 10-2000
- **Seed**: Random seed for reproducibility

**Image Mode (when selected):**
- **Brightness Threshold**: 0-255
- **Density Bias**: 0.5-3.0 (darker = more points)

**TSP Algorithm:**
- **Algorithm**: Nearest Neighbor (fast), 2-Opt (optimized), Both (NN + 2-Opt)
- **2-Opt Iterations**: 10-500

**Display:**
- **Show Points**: Boolean
- **Show Path**: Boolean
- **Show Source Image**: Boolean
- **Line Weight**: 0.5-5px
- **Point Size**: 1-10px

**Export Formats:**
- SVG (single continuous path)
- PNG

**Algorithm Details:**
1. **Nearest Neighbor**: Greedy heuristic, O(n²) time
2. **2-Opt**: Local optimization swapping path segments
3. Typical improvement: 10-30% path length reduction

**Best Use Cases:**
- Single-line portraits
- Continuous path plotting (minimal pen lifts)
- Optimization demonstrations
- Maze-like abstract art

**Tips:**
- Use Poisson Disc for even distribution
- Image mode works best with high-contrast photos
- 500-1000 points balances detail and plotting time
- Always use "Both" algorithm for best path quality
- Manual mode lets you click to place points

---

## Flow Fields

### Flow Field
**Path:** `pen-plotter/algorithms/flow-fields/flow-field-p5-gui.html`
**Complexity:** Intermediate | **Featured:** ✓
**Layer Export:** ✓ Integrated

Particles following Perlin noise-based vector fields to create organic flowing patterns.

**Parameters:**
- **Particle Count**: 100-5000
- **Step Length**: 0.5-10px (movement per frame)
- **Steps**: 10-500 (path length)
- **Noise Scale**: 0.001-0.01 (field frequency)
- **Noise Strength**: 0.5-2.0 (field influence)
- **Line Width**: 0.5-5px
- **Start Pattern**: Random, Grid, Circle, Edges
- **Margin**: 0-100px
- **Fade Edges**: Boolean
- **Fade Strength**: 10-100px
- **Seed**: Random seed

**Export Formats:**
- SVG
- GIF (animated)
- Multi-layer SVG (NEW!)
  - Split by color
  - Split by stroke weight
  - Split by position (horizontal/vertical)
  - Split by density

**Best Use Cases:**
- Abstract flowing artwork
- Organic backgrounds
- Multi-color pen plotting
- Hair/fur texture simulation

**Layer Export Tips:**
- Use "By Color" to separate different pen colors
- Use "By Position" for large prints (split across multiple sheets)
- Use "Auto" detection to find all unique colors/weights
- Preview layers before exporting

---

### Flow Field Collision
**Path:** `pen-plotter/algorithms/flow-fields/flow-field-collision.html`
**Complexity:** Advanced

Enhanced flow field with particle collision detection and avoidance.

**Additional Parameters:**
- **Collision Radius**: Particle separation distance
- **Repulsion Strength**: Avoidance force

**Export Formats:**
- SVG

**Best Use Cases:**
- Dense particle systems
- Avoiding overlapping lines
- Technical flow visualizations

---

## Geometric Patterns

### Perlin Landscape
**Path:** `pen-plotter/algorithms/geometric/perlin-landscape-gui.html`
**Complexity:** Beginner | **Featured:** ✓

Topographical contour lines generated using 2D Perlin noise elevation mapping.

**Parameters:**
- **Rows**: 10-100 (contour line count)
- **Columns**: 20-200 (points per line)
- **Noise Scale**: 0.001-0.05 (terrain frequency)
- **Amplitude**: 10-200 (height variation)
- **Z Offset**: 0-100 (layer separation)
- **Rotation**: 0-360° (view angle)
- **Perspective**: 0-1.0 (3D effect strength)
- **Line Weight**: 0.5-5px

**Export Formats:**
- SVG
- PNG
- GIF (rotating animation, 60 frames)

**Best Use Cases:**
- Topographical maps
- 3D landscape visualization
- Terrain generation
- Abstract mountain ranges

**Tips:**
- Low noise scale (0.005-0.01) for smooth terrain
- High amplitude (100+) for dramatic peaks
- Rotation 315° mimics classic topographic view
- GIF export creates rotating 360° animation

---

### Snowflakes
**Path:** `pen-plotter/algorithms/geometric/snowflakes-gui.html`
**Complexity:** Beginner

Procedural snowflake generator using recursive branching with hexagonal symmetry.

**Structure Parameters:**
- **Branch Levels**: 1-5 (recursion depth)
- **Initial Length**: 50-300px
- **Branch Reduction**: 0.3-0.9 (size scaling per level)
- **Branch Angle**: 10-90°

**Branching Pattern:**
- **Branch Points**: 1-5 (splits per segment)
- **Distribution**: Even, Weighted to End, Random, Golden Ratio
- **Branches per Point**: 1-4
- **Symmetric Branches**: Boolean

**Variation:**
- **Length Variation**: 0-0.5 (randomness)
- **Angle Variation**: 0-0.5
- **Complexity**: Simple, Standard, Complex, Ornate

**Decorations:**
- **Crystal Tips**: Boolean
- **Dendritic Growth**: Boolean (side branches)
- **Hexagonal Plates**: Boolean (end caps)
- **Center Style**: None, Hexagon, Star, Circle

**Display:**
- **Stroke Weight**: 0.5-5px
- **Line Taper**: 0.5-1.0 (thickness reduction)
- **Show Construction**: Boolean (debug view)

**Presets:**
- Stellar Dendrite
- Plate Crystal
- Column Crystal
- Needle Crystal
- Fernlike

**Export Formats:**
- SVG
- PNG
- Multiple (6 random snowflakes)
- GIF (rotating animation)

**Best Use Cases:**
- Winter holiday cards
- Scientific snowflake studies
- Fractal demonstrations
- Ornamental designs

---

### Perlin Circles
**Path:** `pen-plotter/algorithms/geometric/perlin-circles-gui.html`
**Complexity:** Beginner

Concentric circles with Perlin noise-based distortion creating organic variations.

**Parameters:**
- **Circle Count**: 5-50
- **Radius Increment**: 5-50px
- **Noise Scale**: 0.001-0.1
- **Distortion Amount**: 0-100
- **Resolution**: 50-500 (points per circle)
- **Center X/Y**: 0-800 (offset position)
- **Seed**: Random seed

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Topographic circles
- Tree ring patterns
- Ripple effects
- Abstract targets

---

### Spirotron
**Path:** `pen-plotter/algorithms/geometric/spirotron-gui.html`
**Complexity:** Beginner

Spirograph-style pattern generator using mathematical epicycles and hypocycles.

**Parameters:**
- **Fixed Radius**: Outer circle
- **Moving Radius**: Inner circle
- **Pen Position**: Pen offset from moving circle center
- **Rotations**: Total number of cycles
- **Resolution**: Points per rotation

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Mathematical art
- Spirograph nostalgia
- Harmonic patterns
- Cyclic designs

---

### Hilbert Curve
**Path:** `pen-plotter/algorithms/curves/hilbert-curve-gui.html`
**Complexity:** Intermediate | **Featured:** ✓

Space-filling curves generator supporting multiple fractal types.

**Curve Types:**
- Hilbert
- Peano
- Moore
- Dragon
- Gosper
- Sierpinski

**Parameters:**
- **Order**: 1-7 (recursion depth, exponential complexity)
- **Size**: Canvas fitting
- **Line Weight**: 0.5-5px

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Mathematical education
- Space-filling patterns
- Fractal art
- Continuous line challenges

**Warning:** Order 6+ can be slow to generate and plot

---

## Natural Phenomena

### Crystal Growth
**Path:** `pen-plotter/algorithms/natural/crystal-growth-gui.html`
**Complexity:** Intermediate | **Featured:** ✓

Diffusion-Limited Aggregation (DLA) simulation creating snowflake-like crystal formations.

**Parameters:**
- **Particle Count**: 100-5000
- **Stickiness**: 0.1-1.0 (adhesion probability)
- **Walk Step**: 1-10px (brownian motion size)
- **Seed Type**: Point, Line, Circle
- **Particle Size**: 1-10px

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Organic growth patterns
- Snowflake-like structures
- Scientific visualization
- Abstract natural forms

**Algorithm:** Particles random walk until adjacent to existing structure, then stick with probability

---

### Lightning
**Path:** `pen-plotter/algorithms/natural/lightning-gui.html`
**Complexity:** Intermediate

Fractal lightning bolt generation using recursive branching with angular constraints.

**Parameters:**
- **Generations**: 1-8 (branching depth)
- **Branch Angle**: 10-60°
- **Branch Probability**: 0-1.0
- **Segment Length**: 5-50px
- **Jaggedness**: 0-1.0 (angular deviation)

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Lightning effects
- Tree-like branching
- Electrical discharge visualization
- Organic branching patterns

---

## Chemical Patterns

### Reaction-Diffusion
**Path:** `pen-plotter/algorithms/reaction-diffusion/reaction-diffusion-gui.html`
**Complexity:** Advanced | **Featured:** ✓

Gray-Scott model reaction-diffusion system creating organic patterns.

**Parameters:**
- **Feed Rate (f)**: 0.01-0.1 (A chemical feed)
- **Kill Rate (k)**: 0.03-0.07 (B chemical removal)
- **Diffusion A (dA)**: 0.5-1.5
- **Diffusion B (dB)**: 0.1-0.8
- **Speed**: 1-50 iterations per frame
- **Grid Size**: 100-400 (resolution, performance impact)
- **Render Mode**: Chemical, Contour, Threshold, Heatmap
- **Threshold**: 0-1.0 (pattern cutoff)

**Presets:**
- Coral
- Spots
- Waves
- Worms

**Export Formats:**
- SVG (current state)
- Contour Lines (vector paths)
- Threshold Pattern (binary regions)
- GIF (animated evolution, 60 frames)

**Best Use Cases:**
- Organic pattern generation
- Animal skin patterns
- Abstract biology-inspired art
- Turing pattern demonstrations

**Tips:**
- Let simulation run 1000+ iterations before exporting
- Coral preset (f=0.055, k=0.062) is most stable
- Use Contour export for pen plotting
- Threshold 0.5 gives balanced positive/negative space

---

## Cellular Automata

### Game of Life
**Path:** `pen-plotter/algorithms/cellular-automata/game-of-life-gui.html`
**Complexity:** Beginner

Conway's classic cellular automaton with evolution rules.

**Parameters:**
- **Grid Size**: 20-200 cells
- **Cell Size**: 3-20px
- **Speed**: 1-30 generations per second
- **Show Grid**: Boolean
- **Wrap Edges**: Boolean (toroidal topology)

**Patterns:**
- Glider
- Gosper Glider Gun
- Pulsar
- Pentadecathlon
- Random
- Clear

**Export Formats:**
- SVG (current generation)
- PNG
- GIF (50 generations animated)

**Best Use Cases:**
- Evolution visualization
- Emergent complexity demos
- Glider/spaceship tracking
- Mathematical art

---

## Symmetry & Tiling

### Truchet Tiles
**Path:** `pen-plotter/algorithms/symmetry/truchet-tiles-gui.html`
**Complexity:** Beginner | **Featured:** ✓

Classic maze-like patterns from rotated geometric tiles.

**Parameters:**
- **Grid Size**: 5-50 tiles
- **Tile Type**: Quarter Circles, Diagonal Lines, X Pattern
- **Rotation**: Random, Alternating, Custom
- **Tile Size**: 10-100px
- **Stroke Weight**: 0.5-5px

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Maze patterns
- Textile designs
- Modular patterns
- Quick abstracts

---

### Penrose Tiling
**Path:** `pen-plotter/algorithms/geometric/penrose-tiling-gui.html`
**Complexity:** Advanced | **Featured:** ✓

Aperiodic patterns with five-fold symmetry using kite-dart or rhombus tiles.

**Parameters:**
- **Type**: Kite-Dart, Rhombus
- **Iterations**: 0-6 (subdivision depth)
- **Scale**: Canvas fitting
- **Show Edges**: Boolean
- **Show Vertices**: Boolean

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Mathematical art
- Aperiodic tiling demonstrations
- Decorative patterns
- Geometric explorations

---

## Physics Simulations

### Particle System
**Path:** `pen-plotter/algorithms/physics/particle-system-gui.html`
**Complexity:** Intermediate

Physics-based particle simulation with gravity, attraction, and collision.

**Parameters:**
- **Particle Count**: 10-500
- **Gravity**: 0-2.0
- **Attraction/Repulsion**: -2.0 to 2.0
- **Drag**: 0-0.99
- **Particle Size**: 1-20px
- **Trace Paths**: Boolean

**Export Formats:**
- SVG (particle trails)
- PNG

**Best Use Cases:**
- Dynamic motion traces
- Physics demonstrations
- Abstract movement patterns

---

## Advanced Algorithms

### Chladni Patterns
**Path:** `pen-plotter/algorithms/advanced/chladni-patterns-gui.html`
**Complexity:** Advanced | **Featured:** ✓

Vibration and standing wave visualization on plates.

**Parameters:**
- **Resolution**: 50-200
- **Frequency n**: 1-20
- **Frequency m**: 1-20
- **Threshold**: 0-0.5 (pattern cutoff)
- **Mode**: Sine, Cosine, Both

**Export Formats:**
- SVG
- PNG

**Best Use Cases:**
- Wave pattern visualization
- Cymatics-inspired art
- Mathematical physics art
- Resonance demonstrations

---

## Tools

### Path Optimizer
**Path:** `path-optimizer-tool.html`
**Complexity:** Beginner | **Featured:** ✓

vpype-style SVG optimization: merge paths, sort for efficiency, simplify geometry.

**Operations:**
- Merge overlapping paths
- Sort by plotting efficiency (nearest-neighbor)
- Reloop (optimize start/end points)
- Simplify (reduce point count)
- Remove duplicates

**Export Formats:**
- Optimized SVG

**Best Use Cases:**
- Pre-plotting optimization
- Reducing plot time
- Cleaning up generated SVGs

---

### Plotter Prep
**Path:** `pen-plotter/algorithms/tools/plotter-prep.html`
**Complexity:** Beginner | **Featured:** ✓

Upload SVG files to split layers, optimize paths, and prepare for physical plotting.

**Features:**
- SVG upload
- Layer splitting (auto-detect colors/weights)
- Path optimization
- Preview separated layers
- Batch export

**Best Use Cases:**
- Multi-pen plotting prep
- Color separation
- SVG cleanup before plotting

---

## Export Format Reference

### SVG
- **Vector format** - infinitely scalable
- **Plotting ready** - direct import to vpype, Inkscape, AxiDraw
- **File size** - Small for simple patterns, large for complex
- **Preservation** - Perfect accuracy

### PNG
- **Raster format** - fixed resolution
- **Preview** - Quick visualization
- **Sharing** - Web/social media ready
- **File size** - Larger than SVG

### GIF
- **Animated format** - Shows evolution/rotation
- **Frame count** - Typically 50-60 frames
- **Duration** - 5-10 seconds at 10fps
- **File size** - Large (compression applied)

### Multi-Layer SVG (New!)
- **Splitting methods:**
  - By Color (auto-detect or specified hex colors)
  - By Stroke Weight (for different pen tips)
  - By Position (horizontal/vertical splits for large prints)
  - By Density (light/medium/heavy regions)
- **Output** - Separate SVG file per layer
- **Registration** - Perfect alignment across layers
- **Best for** - Multi-pen/multi-color plotting

### DXF (✓ Available)
- **CAD format** - Industry standard, AutoCAD-compatible
- **CNC compatibility** - Laser cutters, routers, professional CAD software
- **Layer support** - Native multi-layer by color or stroke weight
- **Precision** - Exact coordinate geometry preservation
- **Use cases**: Professional fabrication, laser cutting, CNC routing, CAD workflows

**Implementation:** Use `plotter-formats.js` module:
```javascript
const exporter = new PlotterFormats();
exporter.exportSVGCanvasToDXF(canvas, 'drawing.dxf', {
  unit: 'mm',
  paperWidth: 297,  // A4
  paperHeight: 210,
  layerByColor: true
});
```

### HPGL (✓ Available)
- **Plotter format** - Hewlett-Packard Graphics Language
- **Direct control** - Pen up/down, speed, force commands
- **Hardware** - HP plotters, vintage machines, professional plotters
- **8-pen support** - Automatic color-to-pen mapping
- **Use cases**: Vintage HP plotters, museum reproductions, specialized hardware

**Implementation:** Use `plotter-formats.js` module:
```javascript
const exporter = new PlotterFormats();
exporter.exportSVGCanvasToHPGL(canvas, 'drawing.hpgl', {
  penSpeed: 38,  // cm/s
  penForce: 3,   // 1-8
  scaling: 1.0
});
```

**HPGL Pen Color Mapping:**
- Pen 1: Black (#000000)
- Pen 2: Red (#ff0000)
- Pen 3: Blue (#0000ff)
- Pen 4: Green (#00ff00)
- Pen 5: Yellow (#ffff00)
- Pen 6: Magenta (#ff00ff)
- Pen 7: Cyan (#00ffff)
- Pen 8: White (#ffffff)

---

## Performance Guide

### Browser Performance

**Fast Algorithms** (< 1 second):
- All geometric primitives (circles, spirals, landscapes)
- Snowflakes (levels 1-4)
- Truchet Tiles
- Simple L-Systems

**Medium Algorithms** (1-10 seconds):
- Flow Fields (< 2000 particles)
- Voronoi Stippling (< 3000 points)
- TSP Art (< 1000 points, NN algorithm)
- Hilbert Curves (order < 6)

**Slow Algorithms** (> 10 seconds):
- Reaction-Diffusion (grid 300+, 1000+ iterations)
- TSP Art (> 1000 points with 2-Opt)
- Particle Systems (> 500 particles with collision)
- Chladni Patterns (resolution 200+)

**Optimization Tips:**
1. Use lower resolutions for testing, high for final export
2. Disable preview animations during generation
3. Close other browser tabs
4. Use Firefox/Chrome (better canvas performance)
5. Consider WebGL versions for particle systems (future enhancement)

---

## Plotting Time Estimates

**Quick Plots** (< 10 minutes):
- Simple geometric patterns
- Low particle counts (< 500)
- Basic snowflakes
- 10 PRINT mazes

**Medium Plots** (10-60 minutes):
- Flow fields (1000-2000 particles)
- TSP Art (500-1000 points)
- Voronoi Stippling (2000-3000 points)
- Perlin landscapes (50 rows)

**Long Plots** (1-3 hours):
- Dense flow fields (3000+ particles)
- Complex TSP Art (1500+ points)
- Heavy stippling (5000+ points)
- Reaction-diffusion contours

**Marathon Plots** (3+ hours):
- Maximum complexity flow fields
- High-resolution halftone
- Multi-layer compositions
- Penrose tilings (large scale)

*Actual times vary by plotter speed, pen type, and paper*

---

## Paper Recommendations

**Best Paper Types:**
- **Bristol Board**: Smooth, minimal bleeding, durable
- **HP Bright White**: Affordable, good pen adhesion
- **Strathmore 300**: Artist-grade, archival
- **Cardstock**: Sturdy for detailed work
- **Watercolor Paper**: Textured effects (may cause skipping)

**Avoid:**
- Glossy photo paper (poor pen adhesion)
- Newsprint (too absorbent, bleeds)
- Copy paper (warps with wet ink)

**Pen Recommendations:**
- **Pigma Micron**: Archival, various widths (0.1-0.8mm)
- **Staedtler Pigment Liners**: Consistent, waterproof
- **Sakura Gelly Roll**: Metallic/white inks
- **Sharpie Fine Point**: Bold lines (may bleed)
- **Pilot G-2**: Smooth gel, good for flow fields

---

## Common Issues & Solutions

**Issue:** SVG appears blank
- **Solution:** Check if elements have stroke (not just fill)
- **Solution:** Verify viewBox matches canvas dimensions
- **Solution:** Export with "show path" enabled

**Issue:** GIF export fails
- **Solution:** Reduce frame count or canvas size
- **Solution:** Check browser memory (close other tabs)
- **Solution:** Try in Chrome/Firefox (better gif.js support)

**Issue:** Plotter skips/drags
- **Solution:** Slow down plotter speed
- **Solution:** Check pen alignment and pressure
- **Solution:** Use higher quality paper
- **Solution:** Clean plotter carriage

**Issue:** Multi-layer alignment issues
- **Solution:** Use "perfect registration" mode
- **Solution:** Don't move paper between pen changes
- **Solution:** Calibrate plotter home position

**Issue:** Browser freezes during generation
- **Solution:** Reduce algorithm complexity
- **Solution:** Lower resolution/particle count
- **Solution:** Use faster computer
- **Solution:** Wait patiently (may recover)

---

## Development Roadmap

### High Priority
- [ ] DXF export support
- [ ] HPGL export support
- [ ] Unified control interface
- [ ] Calibration wizard for paper/pen combos
- [ ] Performance profiling and WebGL rendering

### Medium Priority
- [ ] Expand multi-layer export to all algorithms
- [ ] Paper size support across all tools
- [ ] Gallery of community works
- [ ] Animation/time-based pattern variations
- [ ] Mobile-responsive controls

### Future Enhancements
- [ ] Real-time preview during generation
- [ ] Custom color palette editor
- [ ] Batch processing multiple seeds
- [ ] Cloud save/load for presets
- [ ] Social sharing integrations

---

## Contributing

To add documentation for a new algorithm:

1. Add entry to `algorithm-catalog.json`
2. Document parameters in this reference
3. Add export formats and use cases
4. Include tips and best practices
5. Update statistics (totalAlgorithms, etc.)

---

**Last Updated:** 2024-11-25
**Total Algorithms:** 77
**Total Categories:** 15
**Documented:** 30+ (ongoing)
**Export Formats:** SVG, PNG, GIF, Multi-Layer SVG, DXF, HPGL
