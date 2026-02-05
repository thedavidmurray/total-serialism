# SVG Export Fix Summary

## Problem
Five pen-plotter algorithm files were using `createGraphics(w, h, SVG)` inside their export functions. This crashes because p5.js-svg@1.5.1 is incompatible with p5.js 1.7.0's createGraphics API.

## Solution
Replaced all `createGraphics(w, h, SVG)` calls with manual SVG generation using template strings and TSExport utility methods.

## Files Fixed

### 1. voronoi-stippling-gui.html
- **Functions modified**: `exportSVG()`, `exportPlotterSVG()`
- **Approach**: Generate `<circle>` elements manually for each stipple point
- **Plotter version**: Stroke-only circles (no fill, transparent background)

### 2. tsp-art-gui.html
- **Functions modified**: `exportSVG()`
- **Approach**: Build SVG path string from TSP path array using M/L commands
- **Includes**: Optional point rendering as red circles

### 3. particle-system-gui.html
- **Functions modified**: `exportSVG()`
- **Approach**: Convert particle trails to SVG `<path>` elements with RGB color
- **Includes**: Force markers (circles, rects, star patterns)

### 4. spiral-burst-gui.html
- **Functions modified**: `exportSVG()`, `exportPlotterSVG()`, `exportLayers()`
- **Approach**: Added helper functions `generateSpiralSVGPaths()`, `generateBurstSVGPaths()`, etc.
- **Modes**: Both spiral dots and radial burst patterns
- **Plotter version**: Black ink only, no background

### 5. tree-working.html
- **Functions modified**: `exportSVG()`
- **Approach**: Collect line segments via turtle graphics state machine, then render as SVG `<line>` elements
- **Added**: Import for `../../shared/export-utils.js`

## Technical Details

### Manual SVG Pattern
All exports follow this pattern:

```javascript
function exportSVG() {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="${bgColor}"/>
`;
  
  // Generate SVG elements (circles, paths, lines)
  for (const item of items) {
    svg += `<circle cx="${item.x}" cy="${item.y}" r="${item.r}" fill="${item.color}"/>
`;
  }
  
  svg += '</svg>';
  
  TSExport.downloadSVG(svg, filename);
}
```

### Plotter-Ready Exports
Plotter versions follow these rules:
- NO background fill (transparent)
- NO filled shapes (stroke-only)
- Black ink (#000000) for universal compatibility
- Standard stroke weights (0.5-1px)

### TSExport Utility
Uses `TSExport.downloadSVG(svgString, filename)` from `shared/export-utils.js`:
- Ensures XML declaration
- Creates blob and triggers download
- Adds timestamp to filename automatically

## Verification
All files verified:
- ✅ No remaining `createGraphics(w, h, SVG)` calls
- ✅ All exports use `TSExport.downloadSVG()`
- ✅ Manual SVG generation with proper XML headers
- ✅ Valid SVG structure (xmlns, viewBox, proper closing tags)

## Testing Recommendations
1. Open each HTML file in a browser
2. Generate artwork/patterns
3. Click "Export SVG" and "Export SVG (Plotter)" buttons
4. Verify SVG files download successfully
5. Open SVG files in Inkscape/browser to validate rendering
6. For plotter files, verify no background and stroke-only rendering

## Migration Notes
- Tree file required adding `export-utils.js` script import
- All other files already had the import
- L-system export now properly collects line segments before rendering
- Spiral-burst required the most refactoring due to multiple export variants

