# RevDanCatt-Inspired Pen Plotter Algorithms

Based on https://revdancatt.com/penplotter/, here are algorithms we can implement:

## 1. 10PRINT Pattern ✅ IMPLEMENTED
Classic maze-like pattern from the famous one-liner:
```
10 PRINT CHR$(205.5+RND(1)); : GOTO 10
```
- Creates diagonal lines (/ or \) based on random choice
- Can be enhanced with:
  - Variable grid sizes
  - Different line angles
  - Probability controls
  - Multi-layer variations

**Implementation:** `/algorithms/geometric/10print-gui.html`
- Multiple line types (diagonal, straight, curved, mixed)
- Pattern variations (classic, triangular, hexagonal, truchet)
- Color modes and parameter saving

## 2. Perlin Noise Landscapes
### 2.1 Perlin Landscape ✅ IMPLEMENTED
- Use Perlin noise to generate topographical contour lines
- Parameters:
  - Noise scale (frequency)
  - Amplitude (height variation)
  - Contour line spacing
  - Optional: Multiple octaves for detail

**Implementation:** `/algorithms/geometric/perlin-landscape-gui.html`
- Marching squares algorithm for smooth contours
- Multiple view modes (top, perspective, cross-section, dual)
- Various contour styles (simple, weighted, dashed)
- Color schemes (mono, elevation, heatmap, topographic)

### 2.2 Perlin Circles ✅ IMPLEMENTED
- Apply Perlin noise to circular forms
- Distort circle radius based on noise values
- Create organic, flowing circular patterns

**Implementation:** `/algorithms/geometric/perlin-circles-gui.html`
- Multiple pattern types (concentric, spiral, flower, ripple, vortex, turbulence)
- Noise types (perlin, simplex-like, ridged, turbulent)
- Animated noise support
- Octave control for complexity

### 2.3 Perlin Spiral
- Spiral with radius modulated by Perlin noise
- Creates organic, nature-inspired spiral forms

## 3. Circle-Based Algorithms
### 3.1 Circle Twist Layers
- Multiple concentric circles
- Each layer rotated/twisted relative to others
- Parameters:
  - Number of layers
  - Twist amount per layer
  - Circle segmentation

### 3.2 Circle Rays ✅ IMPLEMENTED
- Radial lines emanating from center
- Variable density and length
- Can combine with circles for complex patterns

**Implementation:** `/algorithms/geometric/circle-rays-gui.html`
- Multiple ray patterns (straight, curved, zigzag, spiral, branching, wavy)
- Density patterns (uniform, clusters, gradient, noise, fibonacci)
- Customizable cap styles and color modes
- Layer export support

### 3.3 Spokes and Circles
- Combination of radial spokes and concentric circles
- Create mandala-like patterns
- Variable spoke count and circle spacing

## 4. Grid-Based Patterns
### 4.1 Speed Hash
- Fast hash-based pattern generation
- Create pseudo-random but deterministic patterns
- Use grid cells with hash-based fills

### 4.2 Hash Tiles
- Tileable patterns using hash functions
- Each tile contains unique hash-generated design
- Seamless tiling for large areas

### 4.3 Grid Landscape ✅ IMPLEMENTED
- Grid-based terrain generation
- Height values at grid points
- Connect with lines to create landscape effect

**Implementation:** `/algorithms/geometric/grid-landscape-gui.html`
- Multiple height generation algorithms (Perlin, Diamond-Square, Fault Lines, Erosion)
- Various visualization styles (wireframe, contours, dots, 3D columns, isometric)
- Terrain types (mountains, hills, plateau, canyon, islands)
- River generation with flow simulation

## 5. Geometric Generators
### 5.1 Spirotron
- Spirograph-inspired patterns
- Multiple rotating circles creating complex paths
- Parameters:
  - Inner/outer circle ratios
  - Pen position offset
  - Rotation counts

### 5.2 Snowflakes ✅ IMPLEMENTED
- Procedural snowflake generation
- 6-fold symmetry
- Recursive branching patterns
- Variable complexity levels

**Implementation:** `/algorithms/geometric/snowflakes-gui.html`
- Recursive branching with customizable levels
- Multiple presets (stellar, plate, column, needle, fern)
- Decorations (crystal tips, dendritic growth, hexagonal plates)
- Branch distribution patterns (even, weighted, random, golden ratio)

### 5.3 Glyphs
- Algorithmic symbol generation
- Grid-based glyph construction
- Can create alien alphabets or abstract symbols

## Implementation Priority
1. **10PRINT** - Simple and iconic ✅
2. **Perlin Circles** - Builds on existing noise knowledge ✅
3. **Circle Rays** - Straightforward radial pattern ✅
4. **Snowflakes** - Visually striking and seasonal ✅
5. **Grid Landscape** - Combines grid and noise techniques

## Implemented Algorithms (6/15)
- ✅ 10PRINT Pattern
- ✅ Perlin Circles
- ✅ Circle Rays
- ✅ Snowflakes
- ✅ Perlin Landscape
- ✅ Grid Landscape

## Next to Implement
- Spirotron (spirograph patterns)
- Hash Tiles
- Perlin Spiral
- Circle Twist Layers
- Speed Hash
- Glyphs

## Technical Notes
- All algorithms should support:
  - SVG export for pen plotting
  - Parameter randomization
  - Seed-based generation
  - Multi-layer/color support
  - A3/A4 paper sizing
- Consider using existing utilities:
  - Perlin noise from p5.js
  - Path optimization from our optimizer
  - GIF export for animations