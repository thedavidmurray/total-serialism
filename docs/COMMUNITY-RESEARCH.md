# Pen Plotter Community Research

> Research conducted: January 2026
> Purpose: Inform Total Serialism improvements based on community best practices

---

## Table of Contents

1. [Popular Pen Plotter Software](#1-popular-pen-plotter-software)
2. [Community Favorites](#2-community-favorites)
3. [File Format Standards](#3-file-format-standards)
4. [UX Patterns](#4-ux-patterns)
5. [Workflow Integration](#5-workflow-integration)
6. [Recommendations for Total Serialism](#6-recommendations-for-total-serialism)

---

## 1. Popular Pen Plotter Software

### 1.1 AxiDraw Software Ecosystem

**Primary Control Methods:**
- **Inkscape Plugin** (most common) - Wide SVG compatibility, visual parameter adjustment
- **Python API** - Direct programmatic control
- **CLI Tools** - Command-line interface for automation
- **RESTful API** - Full machine control, accessible via RoboPaint

**Key Features:**
- Adjustable pen-up/pen-down heights in Inkscape
- Speed/precision tradeoff settings
- Path optimization (recent firmware addition - saves significant plotting time)
- Hatch fill plugin for shading solid areas
- Multi-pen carousel support (7475A style)

**Sources:**
- [AxiDraw Official](https://www.axidraw.com/)
- [Evil Mad Scientist GitHub](https://github.com/evil-mad/axidraw)
- [Generative Hut AxiDraw Guide](https://www.generativehut.com/post/axidraw)

---

### 1.2 Inkscape Extensions

**Core Capabilities:**
- "AxiDraw Controller" extension tab provides all plotting controls
- Setup tab: pen height configuration
- Options tab: speed and other settings
- Hatch Fill utility for area fills
- "Process Illustrator SVG" for Adobe workflow compatibility

**Compatible Alternatives:**
- **iDraw** - AxiDraw-compatible, uses same extension ecosystem
- **EleksDraw A3** - Budget option, works via GRBL + Inkscape extensions
- **Arduino-based kits** - Open-source GRBL converts Inkscape SVGs to G-code

**Sources:**
- [University of Auckland AxiDraw Tutorial](https://designtech.blogs.auckland.ac.nz/draw-vector-images-with-axidraw-v3-a3-and-inkscape/)
- [UAL CCI AxiDraw Wiki](https://wiki.cci.arts.ac.uk/books/digital-fabrication-lab/page/using-the-axidraw-v3-a3)

---

### 1.3 Processing/p5.js Libraries

**p5.plotSvg** (by Golan Levin, CMU)
- Exports SVG files specifically tailored for pen plotters
- Does not interfere with animation performance
- Easy to add to existing projects
- Current version: 0.1.7 (November 2025)

**p5plotter.com** (Beta)
- Web-based p5.js IDE with plotter focus
- Syntax highlighting and live preview
- Direct SVG export optimized for plotters
- No tool switching required

**canvas-sketch** (by Matt DesLauriers)
- JavaScript API for plotter graphics
- Evolved from the earlier "penplot" tool
- Mature framework for organizing prints

**Other Tools:**
- **Vsketch** - Python API for plotter graphics
- **Penkit** - Paul Butler's well-documented Python API
- **SwiftGraphics** - Swift framework with ray tracer support

**Sources:**
- [p5.plotSvg GitHub](https://github.com/golanlevin/p5.plotSvg)
- [p5plotter.com](https://www.p5plotter.com/)
- [canvas-sketch GitHub](https://github.com/mattdesl/canvas-sketch)

---

### 1.4 vpype - The Swiss Army Knife

**Critical tool for any plotter workflow:**

```bash
# Typical optimization pipeline
vpype read input.svg linesimplify reloop linemerge linesort write output.svg
```

**Key Commands:**
- `linemerge` - Merge lines with endings <0.5mm apart
- `linesort` - Minimize pen-up travel time
- `linesimplify` - Reduce data/improve motion planning
- `splitall` - Break geometries for aggressive optimization
- `multipass` - Extend lines with mirrored copies (for multiple passes)
- `occult` - Remove hidden/occluded lines (plugin)

**Multi-Layer Support:**
- Per-layer or global processing
- Layer commands: `lmove`, `lcopy`, `ldelete`, `lswap`, `lreverse`
- Sort by stroke color: `read --attr stroke`
- Export layers to separate files

**Plugins:**
- `vpype-embroidery` - Embroidery utilities
- `vpype-vectrace` - Vector tracing from images
- `vpype-gcode` - G-code generation for CNC/plotters

**Sources:**
- [vpype GitHub](https://github.com/abey79/vpype)
- [vpype Documentation](https://vpype.readthedocs.io/)
- [vpype Cookbook](https://vpype.readthedocs.io/en/latest/cookbook.html)

---

## 2. Community Favorites

### 2.1 Community Platforms

**#plottertwitter / #PenPlotter**
- Bluesky and Mastodon have active plotterfolk activity
- Videos of plotting machines are "oddly satisfying" - chirping servos, pen-to-paper sounds
- Most popular machine: AxiDraw

**DrawingBots Discord**
- Active community forum
- Real-time troubleshooting and sharing

**Plotter People**
- In-person meetups (SF and NYC)
- Talks and plotter art galleries

**PlotterFiles**
- Community for sharing SVG files

**Plot Party**
- Annual pen plotting art challenge on Instagram

**Sources:**
- [awesome-plotters GitHub](https://github.com/beardicus/awesome-plotters)
- [Generative Hut](https://www.generativehut.com/)

---

### 2.2 What Makes Plotter Art Viral

**Key Appeal Factors:**
1. **Tactile/Human Quality** - Imperfections as pen catches edges or dries up
2. **Unique Outputs** - Each plot is one-of-a-kind due to ink/paper interaction
3. **ASMR-like Videos** - Servo sounds + pen scratching = satisfying content
4. **Physical from Digital** - Tangible objects from generative code
5. **Subtle Variation** - Effects that normal printers cannot replicate

**What Artists Value:**
- Physical outputs that are "no longer bound by the generative systems that shaped them"
- The organic quality of real ink on paper
- Customizable tools and media
- Hours-long intricate outputs

---

### 2.3 Popular Algorithms & Techniques

**Flow Fields / Vector Fields**
- Assign vectors to 2D/3D space points
- Model wind, fluid flow, electromagnetism
- Often combined with particle systems

**Space-Filling Curves**
- **Hilbert Curve** - Visits every point in power-of-2 grid
- Can be drawn without lifting pen
- Expressible as L-system: F = draw, + = left 90 deg, - = right 90 deg
- Applications: image compression, dithering

**Differential Growth**
- Off-lattice diffusion-limited aggregation (DLA)
- Creates chaotic branching structures

**Image Processing Techniques:**

| Technique | Description | Use Case |
|-----------|-------------|----------|
| **Stippling** | Dot-based fills, varying density/size | Grayscale from dots |
| **Hatching** | Line-based fills, continuous lines | Area shading |
| **TSP Art** | Single path connecting all points | Single-line drawings |
| **Weighted Voronoi** | Secord's algorithm for dot distribution | Photo stippling |

**Other Popular Algorithms:**
- Delaunay triangulation
- Perlin noise
- Genetic algorithms
- Flocking algorithms
- L-systems for fractals
- Constraint-solving algorithms

**Sources:**
- [Matt DesLauriers Pen Plotter Art & Algorithms](https://mattdesl.svbtle.com/pen-plotter-1)
- [morphogenesis-resources GitHub](https://github.com/jasonwebb/morphogenesis-resources)
- [Medium: Pen Plotter Programming Basics](https://medium.com/@fogleman/pen-plotter-programming-the-basics-ec0407ab5929)

---

## 3. File Format Standards

### 3.1 SVG Best Practices

**Optimization Priorities:**
1. Path simplification (Ramer-Douglas-Peucker algorithm)
2. Line merging (connect endpoints <0.5mm)
3. Path sorting (minimize pen-up travel)
4. Layer organization (for multi-pen)

**Multi-Pen Layer Conventions:**
```
# vpype layer-by-color workflow
vpype read --attr stroke input.svg [processing] write output.svg
```

- One layer per pen color
- Separate SVG files per color (some workflows)
- Consistent stroke color within layers

**Tools:**
- vpype (primary)
- svgsort - path planning
- Polargraph Optimizer
- penkit-optimize

---

### 3.2 HPGL Format

**Overview:**
- Hewlett-Packard Graphics Language (1977)
- Text-based serial protocol
- Industry standard for vintage and modern vinyl cutters

**Coordinate System:**
- 1 plotter unit = 0.025mm (40 units/mm, 1016/inch)
- User coordinates converted via IP/SC commands

**Essential Commands:**

| Command | Meaning | Example |
|---------|---------|---------|
| `PA` | Pen Absolute | `PA1234,5678;` |
| `PU` | Pen Up | `PU;` or `PU100,200;` |
| `PD` | Pen Down | `PD;` |
| `SP` | Select Pen | `SP1;` |
| `VS` | Velocity Speed | `VS5;` |
| `SC` | Scale | `SC;` |
| `IP` | Input P1/P2 | `IP0,0,10000,7500;` |
| `IN` | Initialize | `IN;` |

**HP-GL/2 (1988):**
- Added line width definition
- Polyline encoding (2/3 file size reduction)
- Better support for inkjet plotters

**Sources:**
- [HPGL Reference Guide](https://www.isoplotec.co.jp/HPGL/eHPGL.htm)
- [HP-GL Wikipedia](https://en.wikipedia.org/wiki/HP-GL)
- [Chiplotle HPGL Commands](http://sites.music.columbia.edu/cmc/chiplotle/manual/chapters/api/hpgl.html)

---

### 3.3 G-code for CNC/Plotters

**Overview:**
- Geometric Code (MIT, 1950s)
- Standard for CNC machines, 3D printers, laser cutters
- Used by DIY plotters running GRBL firmware

**Key Commands:**

| Command | Function |
|---------|----------|
| `G00` | Rapid move (no drawing) |
| `G01` | Linear interpolation (drawing) |
| `M03` | Pen down (or laser on) |
| `M05` | Pen up (or laser off) |

**Pen Control Methods:**
1. Z-axis: positive = up, negative = down
2. M03/M05 commands (for plotters without Z)
3. Servo PWM control

**Conversion Tools:**
- **svg2gcode** - [sameer.github.io/svg2gcode](https://sameer.github.io/svg2gcode)
- **GcodePlot** - Inkscape extension
- **vpype-gcode** - vpype plugin (recommended)

**Firmware Options:**
- **GRBL** - Standard for DIY CNC (Atmega 328)
- **grbl-servo** - Modified PWM frequency (50Hz) for servos
- **Marlin** - 3D printer firmware, adaptable for plotters

**Sender Software:**
- Universal G-code Sender (UGS)
- CNCJS - Web-based interface
- bCNC - Cross-platform

**Sources:**
- [UUNA TEK G-code Guide](https://uunatek.com/blogs/tips-and-tricks/understanding-gcode-and-setting-up-the-idraw-machine-for-the-first-time-gcode-usage)
- [svg2gcode GitHub](https://github.com/sameer/svg2gcode)
- [How to Mechatronics DIY Plotter](https://howtomechatronics.com/projects/diy-pen-plotter-with-automatic-tool-changer-cnc-drawing-machine/)

---

## 4. UX Patterns

### 4.1 Parameter Management

**Random Seed Handling:**
```javascript
// Best practice: Use timestamp for unique seeds
const seed = Date.now();  // or System.nanoTime() equivalent

// Allow manual seed input for reproducibility
function setSeed(n) {
  randomSeed(n);
  console.log(`Seed: ${n}`);  // Always log for recreation
}
```

**Key Principles:**
- Same seed = same output (reproducibility)
- Display seed value for users to save/share
- Option to enter specific seed for recreation
- Random by default, deterministic on demand

---

### 4.2 DrawingBotV3 - Reference Implementation

**Feature Set (Gold Standard):**

| Category | Features |
|----------|----------|
| **Styles** | 50+ built-in, highly customizable |
| **Path Finding** | 3 algorithms (Hatch, Stipple, etc.) |
| **Optimization** | Line simplifying, merging, filtering, sorting |
| **Pen Settings** | Color, stroke width, distribution weight, blend modes |
| **Filters** | 60+ image filters for preprocessing |
| **Preview** | Live drawing preview, OpenGL accelerated |
| **Presets** | Save/import/export for sharing |
| **Batch** | Process entire folders automatically |
| **Export** | Per-pen or per-drawing, multiple formats |
| **Animation** | Export as image sequences or video |

**UI Design Principles:**
- Clean and simple interface
- Straightforward menus
- Quick parameter adjustment
- Live feedback during generation

**Export Formats:**
- Import: .tif, .tga, .png, .jpg, .gif, .bmp, .mp4, .mov, .avi
- Export: .svg, .pdf, .hpgl, .gcode, .png, .mp4, .mov

**Sources:**
- [DrawingBotV3 Official](https://drawingbotv3.com/)
- [DrawingBotV3 Docs](https://docs.drawingbotv3.com/)
- [DrawingBotV3 GitHub](https://github.com/SonarSonic/DrawingBotV3)

---

### 4.3 Randomization UX

**Word Space Randomization (iAuto example):**
- Generates random gaps within min/max values
- Simulates natural handwriting variation
- Adjustable range for fine-tuning

**Best Practices:**
1. Provide min/max bounds for random parameters
2. Show current random value
3. Allow locking specific parameters
4. "Re-roll" button for quick iteration
5. Seed display for reproducibility

---

### 4.4 Preset System Design

**Essential Features:**
- Save current parameters as named preset
- Load preset by name
- Import/export presets (JSON recommended)
- Community preset sharing
- Categorization/tagging

**Implementation Pattern:**
```json
{
  "name": "Organic Flow",
  "author": "artist_name",
  "version": "1.0",
  "seed": 12345,
  "parameters": {
    "algorithm": "flow_field",
    "density": 0.8,
    "noise_scale": 0.02
  }
}
```

---

## 5. Workflow Integration

### 5.1 Typical Workflow: Algorithm to Plotter

```
1. DESIGN
   Processing/p5.js/Python → Generate geometry
   
2. EXPORT
   SVG export → Layer separation (multi-pen)
   
3. OPTIMIZE
   vpype → linesimplify, linemerge, linesort
   
4. PREVIEW
   vpype show / Inkscape → Verify paths
   
5. CONVERT (if needed)
   HPGL (for HP plotters) or G-code (for CNC)
   
6. PLOT
   Inkscape extension / CLI / Serial
```

---

### 5.2 Post-Processing Steps

**Common Operations:**
1. Cut drawing into layers (for multi-color)
2. Centerline trace in Inkscape (vector conversion)
3. Size adjustment to paper
4. Path optimization (vpype)
5. Manual cleanup of artifacts

**Time Considerations:**
- Single color layer: 30 minutes to 12+ hours
- Full multi-color piece: Multiple sessions
- Optimization can reduce time significantly

---

### 5.3 Common Pain Points

| Problem | Solution |
|---------|----------|
| Inkscape export breaks drawings | Use vpype + direct serial export |
| Pen doesn't lift at end | Edit HPGL to remove trailing `PU,0,0;IN` |
| Version updates break workflow | Pin software versions, use vpype |
| Fills not supported | Use hatch/stipple algorithms |
| Slow plotting (8+ hours) | TSP optimization, path sorting |
| Ink bleeding/pooling | Speed adjustment, paper selection |
| G-code generation fails | Use vpype-gcode (most reliable) |

**Workarounds:**
- Save as .hpgl from Inkscape, send via CuteCom/RealTerm
- vpype-gcode for G-code (best success rate)
- Manual serial port control with flow control enabled

---

### 5.4 Integration Tools

**Path Planning & Optimization:**
- svgsort - Reduce pen-up time
- Polargraph Optimizer - Drawing plan optimization
- penkit-optimize - Vehicle routing solver

**Raster to Vector:**
- StippleGen (Evil Mad Scientist) - Stippling
- DrawingBotV3 - Multiple styles
- autotrace - Bitmap to vector

**Hidden Line Removal:**
- plotter.vision - Web-based STL to SVG
- vpype occult plugin - SVG occlusion

---

## 6. Recommendations for Total Serialism

### 6.1 High-Priority Features

Based on community research, these features would align Total Serialism with industry expectations:

**1. Seed Management**
```javascript
// Display current seed
// Allow seed input for reproducibility
// "Copy seed" button
// "Random" button to generate new seed
```

**2. vpype Integration**
- Export optimized SVG compatible with vpype
- Consider bundled optimization presets
- Layer naming conventions for multi-pen

**3. Preset System Enhancement**
- JSON export/import
- Community sharing format
- Preset categories (style, paper size, algorithm)

**4. Batch Generation**
- Generate N variations automatically
- Seed range specification
- Export naming convention

---

### 6.2 Algorithm Additions to Consider

Based on community popularity:

| Algorithm | Popularity | Difficulty |
|-----------|------------|------------|
| Flow Fields | Very High | Medium |
| Hilbert Curve | High | Low |
| Stippling (Voronoi) | High | Medium |
| Differential Growth | Medium | High |
| TSP Art | Medium | High |
| L-Systems | Medium | Low |

---

### 6.3 Export Format Recommendations

**Primary: SVG (current)**
- Ensure stroke-only output (no fills)
- Layer support with color-based grouping
- Metadata for seed/parameters in comments

**Secondary: Add HPGL**
- Essential for vintage HP plotters
- Community still uses 7475A, etc.
- Chiplotle as reference implementation

**Tertiary: Consider G-code**
- Growing DIY plotter community
- vpype-gcode as conversion path

---

### 6.4 UI/UX Improvements

**Based on DrawingBotV3 and Community Patterns:**

1. **Live Preview**
   - Real-time parameter adjustment feedback
   - Path visualization (pen-up vs pen-down)

2. **Progress Indicators**
   - Generation progress bar
   - Estimated plot time calculation

3. **Parameter Randomization**
   - Per-parameter lock/unlock
   - Range sliders with random-within-range
   - "Variations" button for quick exploration

4. **History/Undo**
   - Parameter state history
   - "Undo" to previous generation
   - Gallery of recent outputs with seeds

---

### 6.5 Community Integration

**Consider:**
- Preset sharing format compatible with community standards
- Export documentation with plotting tips
- Integration guides for common workflows

---

## Appendix A: Key Resources

### Official Documentation
- [AxiDraw Wiki](https://wiki.evilmadscientist.com/)
- [vpype Documentation](https://vpype.readthedocs.io/)
- [DrawingBotV3 Docs](https://docs.drawingbotv3.com/)

### Tutorials
- [Matt DesLauriers Pen Plotter Blog](https://mattdesl.svbtle.com/pen-plotter-1)
- [Generative Hut Tutorials](https://www.generativehut.com/)
- [mrmrs Pen Plotting Intro](https://mrmrs.cc/writing/pen-plotting-intro/)

### Community
- [awesome-plotters GitHub](https://github.com/beardicus/awesome-plotters)
- [DrawingBots Discord](https://discord.gg/DrawingBots)
- [#plottertwitter / #PenPlotter on social media]

### Reference Code
- [penplot GitHub](https://github.com/mattdesl/penplot)
- [canvas-sketch GitHub](https://github.com/mattdesl/canvas-sketch)
- [p5.plotSvg GitHub](https://github.com/golanlevin/p5.plotSvg)

---

## Appendix B: Format Quick Reference

### SVG Layer Convention
```xml
<!-- Layer per pen color -->
<g id="layer1" stroke="#000000">
  <!-- black pen paths -->
</g>
<g id="layer2" stroke="#FF0000">
  <!-- red pen paths -->
</g>
```

### HPGL Quick Reference
```
IN;               # Initialize
SP1;              # Select pen 1
PU0,0;            # Pen up, move to origin
PD1000,1000;      # Pen down, draw to point
PU;               # Pen up
SP0;              # Deselect pen
```

### G-code Quick Reference
```gcode
G00 X0 Y0         ; Rapid move to origin
M03               ; Pen down
G01 X100 Y100 F500; Draw to point at feedrate 500
M05               ; Pen up
```

---

*Document generated from community research conducted January 2026*
*For Total Serialism improvement planning*
