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
├── index.html                    # Main entry point for web interface
├── total-serialism-*.js          # Core JavaScript engines
├── total-serialism-*.html        # Various visualization interfaces
├── pen-plotter/                  # Pen plotter specific tools
│   ├── algorithms/               # Advanced generative algorithms
│   │   ├── advanced/            # Complex pattern generators
│   │   ├── flow-fields/         # Flow field visualizations
│   │   ├── natural/            # Nature-inspired algorithms
│   │   ├── reaction-diffusion/ # Reaction-diffusion systems
│   │   ├── textures/           # Texture generation
│   │   └── tools/              # Utility tools
│   └── docs/                    # Documentation
├── linedraw/                     # Python tools for image processing
│   ├── linedraw.py              # Main line drawing converter
│   ├── filters.py               # Image filters
│   ├── perlin.py                # Perlin noise generation
│   └── strokesort.py            # Stroke optimization
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

### Pen Plotter Tools
- Path optimization
- Stroke sorting
- Debug preview
- Export to various plotter formats

### Python Line Drawing
- Convert raster images to vector lines
- Multiple drawing styles
- Perlin noise integration
- Customizable filters

## Getting Started

### Web Interface

1. Start a local server:
```bash
npm start
# or
python3 -m http.server 8080
```

2. Open http://localhost:8080 in your browser

3. Navigate to different tools:
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

- [ ] Unified control interface across all tools
- [ ] Better documentation and examples
- [ ] Performance optimizations for complex patterns
- [ ] More export formats (DXF, HPGL)
- [ ] Real-time collaboration features
- [ ] Gallery of generated works
- [ ] Preset management system
- [ ] Animation and time-based patterns

## Contributing

This is a private repository. Please create feature branches and submit pull requests for any changes.

## License

MIT License - See LICENSE file for details

## Author

David Murray

---

*Note: This project is under active development. Some features may be experimental or incomplete.*