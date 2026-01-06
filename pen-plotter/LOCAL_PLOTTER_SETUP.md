# Pen Plotter Local Setup - Mac

## Overview

This pen plotter system runs entirely in the browser. Algorithms generate artwork that you export as SVG/PNG/DXF/HPGL files, which are then sent to your plotter via dedicated software.

## Quick Start

```bash
# Start local server
cd /Users/djm/claude-projects/github-repos/total-serialism/pen-plotter
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Export Workflow

1. **Create artwork** → Open any `-gui.html` algorithm in browser
2. **Tweak parameters** → Adjust sliders, randomize colors
3. **Export** → Click "Plotter SVG" for stroke-only output
4. **Send to plotter** → Use software below

## Plotter Software Options

### iDraw (UUNA TEK) - YOUR PLOTTER
```bash
# Inkscape already installed at /Applications/Inkscape.app

# Install iDraw 2.0 Extension:
# 1. Download from: https://idrawhome.com/pages/download
# 2. Extract to Inkscape extensions folder:
#    ~/Library/Application Support/org.inkscape.Inkscape/config/inkscape/extensions/

# Connect via USB, power on, then in Inkscape:
# Extensions > iDraw > iDraw Control
```

**iDraw Settings:**
- Model: **iDraw A3** (configured as default)
- USB connection (no special drivers needed on Mac)
- Uses EiBotBoard protocol (same as AxiDraw)
- Canvas size: 1123×1587px (297×420mm at 96 DPI)

### AxiDraw (Alternative)
```bash
# Install Inkscape (required)
brew install --cask inkscape

# Install AxiDraw extension
# Download from: https://wiki.evilmadscientist.com/Axidraw_Software_Installation
```

### vpype (Path optimization CLI)
```bash
# Install vpype
pip install vpype

# Optimize SVG before plotting
vpype read input.svg linemerge linesort write output.svg

# Preview
vpype read input.svg show
```

### Inkscape CLI (General SVG manipulation)
```bash
# Already installed with brew
inkscape --export-type=svg --export-plain-svg output.svg input.svg
```

## File Locations

- **Exports download to:** `~/Downloads/` (browser default)
- **Algorithm source:** `algorithms/**/*-gui.html`
- **Shared libraries:** `shared/`

## Serial Port Access (USB Plotters)

```bash
# List available serial ports
ls /dev/cu.*

# Typical AxiDraw port
/dev/cu.usbmodem*

# Give permission if needed
sudo chmod 666 /dev/cu.usbmodem*
```

## Export Formats

| Format | Use Case | Software |
|--------|----------|----------|
| SVG (Screen) | Preview, social media | Any image viewer |
| SVG (Plotter) | Pen plotting | Inkscape, vpype |
| PNG | Raster export | N/A |
| DXF | CAD, laser cutting | AutoCAD, Fusion360 |
| HPGL | Vintage plotters | Direct serial send |

## Multi-Color Workflow

For multi-pen plots:
1. Export with "Layer Export" → Generates separate SVG per color
2. Load each layer in Inkscape
3. Plot each layer with different pen

## Paper Sizes Supported

- **A3 (297×420mm)** ← DEFAULT for iDraw A3
- A3 Landscape (420×297mm)
- A4 (210×297mm)
- A4 Landscape (297×210mm)
- Letter (8.5×11")
- Square (custom)

## Troubleshooting

### SVG won't open in Inkscape
- Use "Plotter SVG" export (removes p5.js artifacts)
- Check for valid viewBox attribute

### Paths not optimized
```bash
vpype read input.svg linemerge linesort reloop write optimized.svg
```

### Serial port permission denied
```bash
sudo chmod 666 /dev/cu.usbmodem*
# Or add yourself to dialout group
```

---

**Last updated:** January 2025
**Algorithms:** 50 total with TSCanvasControls
