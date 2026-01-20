# Pen Plotting Algorithms Deep Dive

## Overview
This document synthesizes advanced pen plotting algorithms and tools discovered through deep research of drawingbots.net resources. These algorithms represent the cutting edge of computational art for drawing machines.

## 1. Superformula (Supershapes)

### Mathematical Foundation
The superformula, discovered by Johan Gielis, generates complex organic shapes through a single equation:
```
r(φ) = (|cos(m*φ/4)/a|^n2 + |sin(m*φ/4)/b|^n3)^(-1/n1)
```

### Key Parameters
- **a, b**: Lateral and vertical stretching
- **m**: Rotational symmetry (higher = more peaks)
- **n1, n2, n3**: Control spike concavity/convexity and extension

### Implementation Insights
- **Jason Webb's SuperformulaSVG**: Processing-based generator
- Supports iterative decay (parameters decrease each iteration)
- Creates concentric forms with evolving characteristics
- SVG export optimized for pen plotters

### Creative Applications
- Organic, flower-like forms
- Symmetrical but complex geometries
- Animations through parameter interpolation
- Combining multiple superformulas

## 2. Weighted Voronoi Stippling

### Algorithm Overview
Implements Adrian Secord's technique for converting images to stipple patterns optimal for pen plotting.

### Process Steps
1. **Initial Distribution**: Rejection sampling based on image brightness
2. **Voronoi Tessellation**: Calculate cell boundaries
3. **Weighted Centroids**: Move points toward brightness-weighted centers
4. **Lloyd's Relaxation**: Iteratively refine positions
5. **TSP Optimization**: Create single continuous path

### Key Implementations

#### StippleGen (Evil Mad Scientist)
- Processing-based, handles up to 10,000 points
- TSP path optimization for minimal pen travel
- Variable dot sizes for tonal range
- Toxiclibs for Voronoi calculations

#### Observable/D3 Implementation
- Web Worker for parallel processing
- Dampening factor: k^-0.8
- "Wiggle" to prevent local minima
- 80 iterations typical for convergence

### Mathematical Optimizations
```javascript
// Weighted centroid calculation
let weightedX = 0, weightedY = 0, totalWeight = 0;
for (pixel in cell) {
  let weight = 1 - pixel.lightness; // Dark pixels have more weight
  weightedX += pixel.x * weight;
  weightedY += pixel.y * weight;
  totalWeight += weight;
}
newX = weightedX / totalWeight;
newY = weightedY / totalWeight;
```

## 3. Squiggle Algorithms (SquiggleCam)

### Core Concept
Convert raster images to horizontal squiggly lines where amplitude represents darkness.

### Algorithm Steps
1. Sample image brightness row by row
2. Generate sine wave base path
3. Modulate amplitude based on pixel darkness
4. Apply rotation/frequency variations

### Key Parameters
- **LINE_COUNT**: Horizontal line density
- **SPACING**: Vertical gap between lines
- **AMPLITUDE**: Maximum wave height
- **FREQUENCY**: Oscillation rate

### Mathematical Formula
```javascript
// For each row
for (x = 0; x < width; x++) {
  brightness = getPixelBrightness(x, y);
  amplitude = map(brightness, 0, 255, maxAmplitude, 0);
  yOffset = sin(x * frequency) * amplitude;
  path.push({x: x, y: baseY + yOffset});
}
```

## 4. Flow Field Algorithms

### Concept
Create organic curves by following vector fields, perfect for pen plotting.

### Implementation (from Fidenza)
1. **Field Generation**: Create 2D vector field
2. **Particle Tracing**: Follow field directions
3. **Collision Detection**: Prevent overlapping paths
4. **Thickness Variation**: Organic line weights

### Key Techniques
```javascript
// Flow field function
function getFieldVector(x, y) {
  // Perlin noise for organic flow
  let angle = noise(x * scale, y * scale) * TWO_PI;
  // Add turbulence
  angle += turbulence * sin(x * 0.1) * cos(y * 0.1);
  return {x: cos(angle), y: sin(angle)};
}

// Trace path
function tracePath(startX, startY) {
  let path = [];
  let x = startX, y = startY;
  while (inBounds(x, y) && !collision(x, y)) {
    path.push({x, y});
    let field = getFieldVector(x, y);
    x += field.x * stepSize;
    y += field.y * stepSize;
  }
  return path;
}
```

## 5. Islamic/Geometric Pattern Generators

### Moroccan Zellige Patterns

#### Mathematical Foundation
- Based on regular polygons and star-and-polygon compositions
- Tessellation through reflection and rotation
- Girih tiles: decagon, pentagon, hexagon, bow-tie, rhombus

#### Construction Algorithm
1. Create base polygon grid
2. Apply subdivision rules
3. Generate interlacing patterns
4. Ensure continuity at boundaries

### Japanese Kumiko Patterns

#### Core Principles
- Triangular, square, or hexagonal grids
- No glue or nails - pure geometric interlocking
- Patterns: Asanoha (hemp leaf), Shippo (seven treasures), etc.

#### Generation Method
```javascript
// Generate triangular grid
function kumikoGrid(size) {
  let points = [];
  for (let y = 0; y < height; y += size * sqrt(3)/2) {
    for (let x = 0; x < width; x += size) {
      // Offset every other row
      let offset = (y / (size * sqrt(3)/2)) % 2 ? size/2 : 0;
      points.push({x: x + offset, y: y});
    }
  }
  return points;
}
```

## 6. Wallpaper Groups (17 Symmetries)

### Mathematical Groups
The 17 plane symmetry groups represent all possible 2D repeating patterns.

### Key Transformations
1. **p1**: Translation only
2. **pm**: Mirror reflection
3. **pg**: Glide reflection
4. **cm**: Mirror + glide
5. **p2**: 180° rotation
6. **p4**: 90° rotation
7. **p6**: 60° rotation
8. **p3**: 120° rotation

### Implementation Pattern
```javascript
function applySymmetry(point, group) {
  let results = [point];
  
  switch(group) {
    case 'p4': // 4-fold rotation
      for (let i = 1; i < 4; i++) {
        results.push(rotate(point, i * 90));
      }
      break;
      
    case 'p6m': // 6-fold rotation + mirrors
      for (let i = 0; i < 6; i++) {
        let rotated = rotate(point, i * 60);
        results.push(rotated);
        results.push(reflect(rotated, i * 60));
      }
      break;
  }
  
  return results;
}
```

## 7. Audio to Visual Algorithms

### Audioplotter Approach

#### Peak Analysis
```javascript
// Calculate peaks for N time slots
function analyzePeaks(audioBuffer, slotCount) {
  let slotSize = audioBuffer.length / slotCount;
  let peaks = [];
  
  for (let i = 0; i < slotCount; i++) {
    let max = 0;
    for (let j = 0; j < slotSize; j++) {
      let sample = Math.abs(audioBuffer[i * slotSize + j]);
      if (sample > max) max = sample;
    }
    peaks.push(max);
  }
  return peaks;
}
```

#### Drawing Modes

**Zigzag Mode**:
```javascript
peaks.forEach((peak, i) => {
  let x = map(i, 0, peaks.length, 0, width);
  let y = centerY + (i % 2 ? peak : -peak) * amplitude;
  path.lineTo(x, y);
});
```

**Saw Mode**:
```javascript
peaks.forEach((peak, i) => {
  let x = map(i, 0, peaks.length, 0, width);
  let sawPhase = (i % sawPeriod) / sawPeriod;
  let y = centerY + peak * sin(sawPhase * TWO_PI);
  path.lineTo(x, y);
});
```

### Frequency-Based Visualization
- FFT analysis for frequency bands
- Map low frequencies to thick lines
- High frequencies to rapid oscillations
- Color/layer separation by frequency range

## 8. TSP Optimization for Plotting

### Problem
Convert point sets or multiple paths into single continuous path minimizing pen travel.

### Algorithms

#### Nearest Neighbor (Simple)
```javascript
function nearestNeighborTSP(points) {
  let path = [points[0]];
  let remaining = points.slice(1);
  
  while (remaining.length > 0) {
    let current = path[path.length - 1];
    let nearest = findNearest(current, remaining);
    path.push(nearest);
    remaining = remaining.filter(p => p !== nearest);
  }
  
  return path;
}
```

#### 2-Opt Improvement
```javascript
function twoOpt(path) {
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < path.length - 2; i++) {
      for (let j = i + 2; j < path.length; j++) {
        if (swapImproves(path, i, j)) {
          reversePath(path, i + 1, j);
          improved = true;
        }
      }
    }
  }
  return path;
}
```

## 9. Advanced Techniques

### Multi-Layer Optimization
- Separate by tool/color
- Minimize tool changes
- Layer order for visual effect

### Adaptive Density
```javascript
// Vary line density based on image content
function adaptiveDensity(image) {
  let detailMap = calculateDetailLevel(image);
  return (x, y) => {
    let detail = detailMap.get(x, y);
    return map(detail, 0, 1, minDensity, maxDensity);
  };
}
```

### Hatching Algorithms
```javascript
// Cross-hatching for shading
function crossHatch(brightness, x, y, size) {
  let lines = [];
  let spacing = map(brightness, 0, 255, 2, size);
  
  // Primary direction
  for (let i = 0; i < size; i += spacing) {
    lines.push([{x: x, y: y + i}, {x: x + size, y: y + i}]);
  }
  
  // Cross direction if dark enough
  if (brightness < 128) {
    for (let i = 0; i < size; i += spacing) {
      lines.push([{x: x + i, y: y}, {x: x + i, y: y + size}]);
    }
  }
  
  return lines;
}
```

## 10. Optimization Strategies

### Path Merging
- Connect nearby endpoints
- Reduce pen lifts
- Tolerance-based joining

### Curve Simplification
- Douglas-Peucker algorithm
- Preserve visual fidelity
- Reduce point count

### Physical Constraints
- Minimum line length
- Maximum acceleration
- Corner speed limits

## Implementation Recommendations

### For Your Tools
1. **Add Flow Field Drawing**
   - Implement Perlin noise fields
   - Particle system with collision detection
   - Export optimized paths

2. **Integrate Voronoi Stippling**
   - Web Worker for computation
   - Progressive refinement preview
   - TSP optimization option

3. **Audio Visualization Pipeline**
   - FFT analysis module
   - Multiple drawing modes
   - Real-time preview

4. **Symmetry Tools**
   - Wallpaper group presets
   - Live symmetry preview
   - Custom symmetry rules

5. **Advanced SVG Export**
   - Layer organization
   - Path optimization
   - Metadata for pen settings

## Resources for Further Study

### Academic Papers
- "Weighted Voronoi Stippling" - Adrian Secord
- "Example-Based Stippling" - Kim et al.
- "Artistic Screening" - Ostromoukhov

### Code Repositories
- Evil Mad Scientist StippleGen
- Jason Webb's Superformula
- Observable Notebooks on Voronoi

### Communities
- DrawingBots.net forums
- PlotterTwitter (#plottertwitter)
- AxiDraw user groups

## Conclusion

These algorithms represent sophisticated approaches to computational art, each offering unique aesthetic possibilities. The key to mastery is understanding not just the implementation, but the mathematical principles that create visual harmony. Combining these techniques—using flow fields with stippling, or audio analysis with symmetry groups—opens endless creative possibilities for pen plotting art.