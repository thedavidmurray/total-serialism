# Total Serialism V3 - Setup Instructions

## Quick Start

1. **Open the main application:**
   - `total-serialism-v3.html` - The complete V3 system with all features

2. **Test individual algorithms:**
   - `test-all-algorithms.html` - Grid view of all 6 algorithms
   - `test-v3-enhanced.html` - Test collision detection and golden ratio

3. **View older versions:**
   - `index.html` - Landing page with version selection
   - `total-serialism-fidenza.html` - Original V1
   - `total-serialism-v2-fixed.html` - Working V2 with SVG export

## File Structure

### Core Files
- `total-serialism-v3-engine.js` - Main engine with all algorithms
- `collision-detection.js` - Spatial hashing system
- `golden-ratio-composition.js` - Composition rules
- `total-serialism-v3.html` - Main application

### Test Files
- `test-all-algorithms.html` - Visual test of all algorithms
- `test-v3-enhanced.html` - Feature testing

### Documentation
- `V3-FEATURES.md` - Complete feature list
- `V3-COLLISION-DETECTION.md` - Collision system details
- `V3-GOLDEN-RATIO.md` - Composition system details
- `V3-TESSELLATION-COMPLETE.md` - Algorithm documentation
- `V3-PROGRESS-REPORT.md` - Development summary

## How to Run

### Option 1: Direct File Opening
Simply open any HTML file in a modern web browser (Chrome, Firefox, Safari).

### Option 2: Local Web Server (Recommended)
```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Node.js
npx http-server -p 8080
```

Then navigate to `http://localhost:8080/total-serialism-v3.html`

## Browser Requirements

- Modern browser with ES6 support
- Canvas/WebGL support
- SVG support for export feature

## Controls

### Main Interface
- **Generate** - Create new artwork
- **Mutate** - Slight variations of current
- **Surprise Me!** - Randomize everything
- **Save PNG/SVG** - Export artwork

### Parameters
- **Complexity** - Detail level and subdivisions
- **Density** - Number of elements
- **Chaos** - Randomness/turbulence
- **Scale** - Global size multiplier
- **Saturation/Brightness** - Color adjustments

### Advanced Features
- **Collision Detection** - Prevents overlapping
- **Golden Ratio** - Aesthetic placement
- **Debug Modes** - Visualize systems

## Keyboard Shortcuts
- `R` - Regenerate
- `P` - Save PNG
- `S` - Save SVG
- `Space` - Surprise mode
- `M` - Mutate

## Troubleshooting

### Black Screen
- Check browser console for errors
- Ensure all JS files are in same directory
- Try refreshing the page

### Performance Issues
- Reduce density parameter
- Disable collision detection
- Use Chrome for best performance

### Export Not Working
- Check browser permissions
- Try different browser
- Ensure sufficient disk space

## Algorithm Types

1. **Flow Fields** - Organic particle flows
2. **Ring Systems** - Circular patterns
3. **Particle Swarms** - Flocking behaviors
4. **Tessellations** - Geometric patterns (Voronoi, Delaunay, Penrose, Islamic)
5. **Wave Interference** - Overlapping waves
6. **Hybrid Mode** - Mixed algorithms

## Tips for Best Results

- Start with default parameters
- Use "Mutate" when you like a pattern
- Enable golden ratio for better compositions
- Try different palettes with same algorithm
- Export as SVG for infinite scaling

Enjoy creating generative art!