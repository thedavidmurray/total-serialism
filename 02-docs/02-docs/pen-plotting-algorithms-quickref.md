# Pen Plotting Algorithms Quick Reference

## 🌀 Flow Fields
```javascript
// Basic flow field
function flowField(x, y) {
  return noise(x * 0.01, y * 0.01) * TWO_PI;
}

// Turbulent flow field
function turbulentFlow(x, y) {
  let base = noise(x * 0.01, y * 0.01) * TWO_PI;
  let turb = sin(x * 0.05) * cos(y * 0.05) * 0.5;
  return base + turb;
}
```

## ⚫ Weighted Voronoi Stippling
```javascript
// Initialize points with rejection sampling
function initStipples(img, count) {
  let points = [];
  while (points.length < count) {
    let p = {x: random(img.width), y: random(img.height)};
    if (random() > brightness(img.get(p.x, p.y)) / 255) {
      points.push(p);
    }
  }
  return points;
}

// Lloyd's relaxation (one iteration)
function relax(points, img) {
  // Use d3-delaunay or similar for Voronoi
  let voronoi = d3.voronoi(points);
  return voronoi.polygons().map(cell => {
    // Calculate weighted centroid
    let wx = 0, wy = 0, w = 0;
    // Sample pixels in cell...
    return {x: wx/w, y: wy/w};
  });
}
```

## 🌊 Squiggle Algorithms
```javascript
// Image to squiggly lines
function squigglify(img, lineCount) {
  let lines = [];
  for (let i = 0; i < lineCount; i++) {
    let y = map(i, 0, lineCount, 0, img.height);
    let line = [];
    for (let x = 0; x < img.width; x++) {
      let bright = brightness(img.get(x, y));
      let amp = map(bright, 0, 255, 20, 0);
      let wave = sin(x * 0.1) * amp;
      line.push({x, y: y + wave});
    }
    lines.push(line);
  }
  return lines;
}
```

## 🌟 Superformula
```javascript
// r = (|cos(m*φ/4)/a|^n2 + |sin(m*φ/4)/b|^n3)^(-1/n1)
function superformula(phi, a, b, m, n1, n2, n3) {
  let t1 = Math.abs(Math.cos(m * phi / 4) / a);
  let t2 = Math.abs(Math.sin(m * phi / 4) / b);
  return Math.pow(Math.pow(t1, n2) + Math.pow(t2, n3), -1/n1);
}

// Generate superformula path
function superPath(params, points = 360) {
  let path = [];
  for (let i = 0; i < points; i++) {
    let phi = (i / points) * TWO_PI;
    let r = superformula(phi, ...params);
    path.push({
      x: r * cos(phi) + width/2,
      y: r * sin(phi) + height/2
    });
  }
  return path;
}
```

## 🕌 Islamic/Geometric Patterns
```javascript
// Generate n-fold star
function starPattern(n, size) {
  let angles = [];
  for (let i = 0; i < n; i++) {
    angles.push((i / n) * TWO_PI);
  }
  
  let lines = [];
  angles.forEach((a1, i) => {
    // Connect to every other point
    let a2 = angles[(i + 2) % n];
    lines.push([
      {x: cos(a1) * size, y: sin(a1) * size},
      {x: cos(a2) * size, y: sin(a2) * size}
    ]);
  });
  return lines;
}
```

## 🎌 Wallpaper Symmetries
```javascript
// Apply p4 symmetry (4-fold rotation)
function p4Symmetry(point) {
  return [0, 90, 180, 270].map(angle => 
    rotate(point, angle)
  );
}

// Apply p6m symmetry (6-fold + mirrors)
function p6mSymmetry(point) {
  let results = [];
  for (let i = 0; i < 6; i++) {
    let angle = i * 60;
    results.push(rotate(point, angle));
    results.push(reflect(rotate(point, angle), angle));
  }
  return results;
}
```

## 🎵 Audio to Visual
```javascript
// Audio peaks to path
function audioToPath(audioBuffer, width) {
  let samples = audioBuffer.length;
  let path = [];
  
  for (let i = 0; i < width; i++) {
    let idx = floor(map(i, 0, width, 0, samples));
    let amp = audioBuffer[idx];
    path.push({x: i, y: height/2 + amp * 100});
  }
  
  return path;
}

// FFT to radial plot
function fftToRadial(fftData) {
  let path = [];
  fftData.forEach((mag, i) => {
    let angle = map(i, 0, fftData.length, 0, TWO_PI);
    let r = map(mag, 0, 255, 50, 200);
    path.push({
      x: cos(angle) * r + width/2,
      y: sin(angle) * r + height/2
    });
  });
  return path;
}
```

## 🗺️ TSP Optimization
```javascript
// Nearest neighbor TSP
function nearestNeighbor(points) {
  let path = [points[0]];
  let unvisited = points.slice(1);
  
  while (unvisited.length > 0) {
    let current = path[path.length - 1];
    let nearest = unvisited.reduce((min, p) => 
      dist(current, p) < dist(current, min) ? p : min
    );
    path.push(nearest);
    unvisited = unvisited.filter(p => p !== nearest);
  }
  
  return path;
}
```

## ✏️ Hatching
```javascript
// Adaptive hatching based on brightness
function adaptiveHatch(x, y, w, h, brightness) {
  let spacing = map(brightness, 0, 255, 2, 10);
  let lines = [];
  
  // Horizontal lines
  for (let i = y; i < y + h; i += spacing) {
    lines.push([{x, y: i}, {x: x + w, y: i}]);
  }
  
  // Add vertical lines if dark
  if (brightness < 128) {
    for (let i = x; i < x + w; i += spacing) {
      lines.push([{x: i, y}, {x: i, y: y + h}]);
    }
  }
  
  return lines;
}
```

## 🔄 Path Operations
```javascript
// Simplify path (Douglas-Peucker)
function simplify(path, tolerance) {
  if (path.length <= 2) return path;
  
  // Find point furthest from line
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < path.length - 1; i++) {
    let d = pointToLineDistance(path[i], path[0], path[path.length-1]);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }
  
  if (maxDist > tolerance) {
    let left = simplify(path.slice(0, maxIdx + 1), tolerance);
    let right = simplify(path.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  
  return [path[0], path[path.length-1]];
}

// Merge nearby paths
function mergePaths(paths, threshold) {
  let merged = [];
  let used = new Set();
  
  paths.forEach((path, i) => {
    if (used.has(i)) return;
    
    let current = [...path];
    let found = true;
    
    while (found) {
      found = false;
      paths.forEach((other, j) => {
        if (i === j || used.has(j)) return;
        
        let endDist = dist(current[current.length-1], other[0]);
        if (endDist < threshold) {
          current = current.concat(other);
          used.add(j);
          found = true;
        }
      });
    }
    
    merged.push(current);
  });
  
  return merged;
}
```

## 🎯 Common Patterns

### Spiral Generator
```javascript
function spiral(turns, spacing) {
  let path = [];
  let steps = turns * 360;
  
  for (let i = 0; i < steps; i++) {
    let angle = (i / 360) * TWO_PI;
    let r = i * spacing / 360;
    path.push({
      x: cos(angle) * r + width/2,
      y: sin(angle) * r + height/2
    });
  }
  
  return path;
}
```

### Concentric Shapes
```javascript
function concentricShapes(shapeFunc, count, spacing) {
  let shapes = [];
  
  for (let i = 0; i < count; i++) {
    let scale = (i + 1) * spacing;
    shapes.push(shapeFunc(scale));
  }
  
  return shapes;
}
```

### Grid Deformation
```javascript
function deformGrid(cols, rows, deformFunc) {
  let paths = [];
  
  // Horizontal lines
  for (let y = 0; y <= rows; y++) {
    let path = [];
    for (let x = 0; x <= cols; x++) {
      let p = {
        x: x * (width / cols),
        y: y * (height / rows)
      };
      path.push(deformFunc(p));
    }
    paths.push(path);
  }
  
  // Vertical lines
  for (let x = 0; x <= cols; x++) {
    let path = [];
    for (let y = 0; y <= rows; y++) {
      let p = {
        x: x * (width / cols),
        y: y * (height / rows)
      };
      path.push(deformFunc(p));
    }
    paths.push(path);
  }
  
  return paths;
}
```

## 💡 Pro Tips

1. **Always test with small datasets first**
2. **Use Web Workers for heavy computation**
3. **Preview before plotting** - simulate pen travel
4. **Layer your work** - separate by color/tool
5. **Optimize last** - get it working, then make it fast

## 🚀 Quick Start Examples

```javascript
// Example 1: Flow field portrait
let img = loadImage('portrait.jpg');
let field = createFlowField(img);
let paths = tracePaths(field, 100);
let optimized = optimizeTSP(paths);
exportSVG(optimized, 'portrait.svg');

// Example 2: Audio visualization
let audio = loadAudio('song.mp3');
let fft = analyzeFFT(audio);
let radial = fftToRadial(fft);
let symmetric = p6mSymmetry(radial);
exportSVG(symmetric, 'audio-viz.svg');

// Example 3: Stippled landscape
let landscape = loadImage('landscape.jpg');
let stipples = initStipples(landscape, 5000);
for (let i = 0; i < 50; i++) {
  stipples = relax(stipples, landscape);
}
let path = nearestNeighbor(stipples);
exportSVG(path, 'landscape-stippled.svg');
```