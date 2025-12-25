# Total Serialism Pen Plotter - Algorithm Landscape

## Current Status (Dec 2025)
- **Total Algorithms**: 67
- **Test Results**: 24 Passed, 1 Warning, 42 Failed
- **New algorithms added this session**: 8 (Moiré, Maze, Space-filling, Differential Growth, Lorenz Attractor, String Art, Mandelbrot/Julia, Wave Interference)

## Algorithm Categories

### 1. Advanced (5 algorithms)
- Chladni patterns
- **Lorenz attractor (NEW)** - 5 attractors: Lorenz, Rössler, Thomas, Aizawa, Halvorsen
- Parametric surfaces
- Sound waveform
- Vortex street

### 2. AI (1)
- ml5 patterns (requires ML5 library)

### 3. Cellular Automata (4)
- Elementary CA (layers, simple)
- Game of Life (gui, layers)

### 4. Chemical Simulations (6)
- Belousov-Zhabotinsky reaction
- Chromatography
- Convection cells
- Crystallization
- Liesegang rings
- Mixing patterns

### 5. Curves (2)
- Hilbert curve
- **Space-filling curves (NEW)** - Peano, Moore, Gosper, Dragon, Sierpinski

### 6. Flow Fields (2)
- Flow field collision
- Flow field p5

### 7. Fractals (1 - NEW)
- **Mandelbrot/Julia (NEW)** - Marching squares contour rendering

### 8. Geometric (18)
- 10PRINT (gui, simple)
- Circle rays, Circle twist
- Grid landscape
- Hash tiles
- Islamic patterns
- **Maze generator (NEW)** - 6 algorithms
- **Moiré patterns (NEW)** - circles, lines, radial, grid, spiral
- Penrose tiling
- Perlin variations (circles, landscape, spiral)
- Snowflakes
- Spiral burst, Spiral fill
- Spirotron
- **String art (NEW)** - cardioid, nephroid, deltoid, astroid, parabola, web, bezier

### 9. Hybrid (1)
- Hybrid composer (layer-based)

### 10. Image Processing (6)
- ASCII art
- Dithering
- Halftone
- Hatching
- Image to ASCII
- Squigglecam

### 11. Natural (5)
- Astronomy
- Coral growth
- Crystal growth
- **Differential growth (NEW)** - organic simulation
- Lightning

### 12. Packing (1)
- Circle packing

### 13. Physics (3)
- Particle system
- Test color controls
- **Wave interference (NEW)** - circular, linear, radial, grid patterns

### 14. Reaction-Diffusion (3)
- Enhanced, GUI, Layers versions

### 15. Symmetry (3)
- Kumiko pattern
- Truchet tiles
- Zellige pattern

### 16. Textures (1)
- Hatching demo

### 17. Trees/L-systems (3)
- L-system simple
- Tree (gui, working)

### 18. Voronoi (2)
- TSP art
- Voronoi stippling

---

## Identified Gaps

### High Priority (Classic Pen Plotter Art)

1. **Strange Attractors / Chaos** ✅ COMPLETE
   - ~~Lorenz attractor~~ ✅
   - ~~Rössler attractor~~ ✅ (in Lorenz)
   - Hénon map
   - Clifford attractor

2. **More Fractals** ✅ PARTIAL
   - ~~Mandelbrot set~~ ✅
   - ~~Julia sets~~ ✅
   - Dragon curve variations (in space-filling)
   - Barnsley fern

3. **String Art / Bezier** ✅ COMPLETE
   - ~~Cardioid string art~~ ✅
   - ~~Circle chord patterns~~ ✅
   - ~~Bezier curve art~~ ✅
   - ~~Envelope curves~~ ✅

4. **Wave Patterns** ✅ COMPLETE
   - ~~Ripple interference~~ ✅
   - Standing waves (in wave-interference)
   - ~~Wave propagation~~ ✅

### Medium Priority

5. **Polyhedra / 3D Projections**
   - Wireframe polyhedra
   - Geodesic domes
   - Stereographic projection
   - Isometric patterns

6. **More Tessellations**
   - Wang tiles
   - Escher-style metamorphic
   - Aperiodic tilings (beyond Penrose)

7. **Generative Typography**
   - Letter-based patterns
   - Text flow fields
   - Font deconstruction

8. **Op Art Patterns**
   - More optical illusions
   - Kinetic art simulations
   - Victor Vasarely style

### Lower Priority

9. **Noise Textures**
   - Wood grain
   - Marble patterns
   - Procedural landscapes

10. **Data Visualization**
    - Generative charts
    - Network graphs
    - Sankey diagrams

---

## Recommended Next Additions

1. **Lorenz Attractor** - Classic chaos theory, beautiful 3D curves
2. **String Art Generator** - Parametric envelope curves
3. **Mandelbrot/Julia** - Iconic fractals with edge-only rendering
4. **Wave Interference** - Water ripple patterns
5. **Wireframe Polyhedra** - Platonic/Archimedean solids

---

## Test Failure Categories

### 1. Canvas Detection Issues
Many algorithms work but the test can't detect regeneration:
- Test samples only 200x200 from top-left
- Algorithms with centered/small content may appear unchanged

### 2. Image Input Required
These algorithms need user to load an image:
- halftone.html
- hatching.html
- squigglecam.html
- ascii-art-gui.html
- dithering-gui.html

### 3. Actual JS Errors
These need code fixes:
- vortex-street-gui.html - undefined property
- reaction-diffusion-gui.html - duplicate variable declaration
- hatching-demo.html - appendChild null

### 4. WebGL/Complex Rendering
Some use WebGL which the test can't capture:
- flow-field-collision.html
- crystal-growth-gui.html
