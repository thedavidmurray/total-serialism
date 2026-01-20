# Total Serialism

A comprehensive toolkit for generative art, pen plotting, and creative coding using p5.js and Python.

## Overview

Total Serialism is a collection of tools and algorithms for creating algorithmic art suitable for pen plotting and digital display. The project combines:

- **Web-based generative art** using p5.js
- **Pen plotter optimization** for physical drawing machines
- **Python image-to-line conversion** tools
- **Advanced algorithms** for pattern generation

## Project Structure

```
total-serialism/
├── browse.html                   # 🌟 Algorithm browser (START HERE!)
├── algorithm-catalog.json        # Structured catalog of all algorithms
├── index.html                    # Main entry point for web interface
├── total-serialism-*.js          # Core JavaScript engines
├── total-serialism-*.html        # Various visualization interfaces
├── pen-plotter/                  # Pen plotter specific tools
│   ├── algorithms/               # 65+ generative algorithms
│   │   ├── advanced/            # Complex pattern generators
│   │   ├── flow-fields/         # Flow field visualizations
│   │   ├── natural/            # Nature-inspired algorithms
│   │   ├── reaction-diffusion/ # Reaction-diffusion systems
│   │   ├── chemical/           # Chemical engineering art
│   │   ├── cellular-automata/  # Game of Life, elementary CA
│   │   ├── geometric/          # Geometric patterns & spirals
│   │   ├── lsystems/           # L-System trees
│   │   ├── symmetry/           # Zellige, kumiko patterns
│   │   ├── image-processing/   # Halftone, hatching, squigglecam
│   │   ├── physics/            # Particle systems
│   │   ├── textures/           # Texture generation
│   │   └── tools/              # Path optimizer, export tools
│   └── docs/                    # Documentation
├── linedraw/                     # Python tools for image processing
│   ├── linedraw.py              # Main line drawing converter
│   ├── filters.py               # Image filters
│   ├── perlin.py                # Perlin noise generation
│   └── strokesort.py            # Stroke optimization
├── RESEARCH-SUMMARY.md           # Best practices research
├── IMPROVEMENT-ROADMAP.md        # Development roadmap
└── backlog/                      # Work in progress and experiments
```

## Features

### Core Generative Engine
- Multiple rendering modes (Fidenza-inspired, geometric patterns, organic forms)
- Real-time parameter controls
- SVG export for pen plotting
- High-resolution canvas rendering

### Algorithms Included
- Flow fields and particle systems
- Reaction-diffusion patterns
- Crystal growth simulation
- Lightning generation
- Astronomy patterns
- Sound waveform visualization
- Vortex streets
- Parametric surfaces
- Chladni patterns

### Pen Plotter Tools ✨ NEW!
- **Path optimization** - vpype-style algorithms (merge, sort, reloop, simplify)
- **Time estimation** - Calculate plot time before drawing
- **Visual comparison** - See before/after optimization
- Stroke sorting and path reordering
- Debug preview
- Export to various plotter formats

### Python Line Drawing
- Convert raster images to vector lines
- Multiple drawing styles
- Perlin noise integration
- Customizable filters

### Preset Management ✨ NEW!
- Save/load algorithm parameters
- Export/import presets as JSON
- Share configurations with others
- Search and organize presets
- Built-in randomization
- LocalStorage persistence

See [PRESET-MANAGER-GUIDE.md](PRESET-MANAGER-GUIDE.md) for integration instructions.

## Getting Started

### 🎨 Quick Start - Algorithm Browser (NEW!)

The easiest way to explore all 65+ algorithms:

1. Start a local server:
```bash
npm start
# or
python3 -m http.server 8080
```

2. Open http://localhost:8080/browse.html in your browser

3. Features:
   - 📱 **Search** - Find algorithms by name or description
   - 🏷️ **Filter** - By difficulty (beginner/intermediate/advanced)
   - ⭐ **Featured** - Curated selection of best algorithms
   - ❤️ **Favorites** - Save your preferred algorithms locally
   - 📂 **Categories** - Browse by type (Geometric, Flow Fields, Natural, Chemical, etc.)

### Alternative: Direct Access

Navigate directly to specific tools:
   - Algorithm Browser: `browse.html` ⭐ **Start here!**
   - Main interface: `index.html`
   - Fidenza style: `total-serialism-fidenza.html`
   - Version 3 engine: `total-serialism-v3.html`
   - Pen plotter tools: `pen-plotter/index.html`

### Python Line Drawing

```bash
cd linedraw
python3 linedraw.py input_image.jpg
```

## Development

### Prerequisites
- Node.js (for package management)
- Python 3.x (for linedraw tools)
- Modern web browser with ES6 support

### Installation

```bash
git clone [your-private-repo-url]
cd total-serialism
npm install  # If dependencies are added later
```

## Improvements Roadmap

- [x] **Algorithm browser with search and categorization** ✨ NEW!
- [x] **Preset management system (save/load parameters)** ✨ NEW!
- [x] **Path optimization tools (vpype-style)** ✨ NEW!
- [ ] Calibration wizard for pen plotters
- [ ] Unified control interface across all tools
- [ ] Better documentation and examples
- [ ] Performance optimizations for complex patterns
- [ ] More export formats (DXF, HPGL)
- [ ] Gallery of generated works
- [ ] Animation and time-based patterns

See [IMPROVEMENT-ROADMAP.md](IMPROVEMENT-ROADMAP.md) for detailed plans.

## Contributing

This is a personal repository. Please create feature branches and submit pull requests for any changes.

## License

MIT License - See LICENSE file for details

## Author

David Murray

---

*Note: This project is under active development. Some features may be experimental or incomplete.*
