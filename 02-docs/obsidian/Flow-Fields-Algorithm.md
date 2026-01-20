# Flow Fields Algorithm

#algorithm #generative-art #pen-plotter #flow-fields #vector-fields

## Overview

Flow fields are vector fields that define a direction and magnitude at every point in space. When particles or lines follow these fields, they create organic, flowing patterns reminiscent of wind, water, or magnetic fields.

## Mathematical Foundation

### Basic Vector Field

A flow field is defined by a function that maps 2D positions to 2D vectors:

```javascript
// Basic flow field function
function getFlowVector(x, y) {
  return {
    x: Math.cos(x * 0.01) * Math.sin(y * 0.01),
    y: Math.sin(x * 0.01) * Math.cos(y * 0.01)
  };
}
```

### Perlin Noise Fields

The most common approach uses Perlin noise for organic randomness:

```javascript
// Perlin noise flow field
function getPerlinFlowVector(x, y, z = 0) {
  const scale = 0.005;  // Adjust for field complexity
  const angle = noise(x * scale, y * scale, z) * Math.PI * 2;
  
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}
```

## Implementation Examples

### Basic Flow Field Sketch

```javascript
const canvasSketch = require('canvas-sketch');
const { lerp, noise2D } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: 'A4',
  units: 'mm',
  pixelsPerInch: 300
};

const sketch = () => {
  return ({ context, width, height }) => {
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // Drawing settings
    context.strokeStyle = 'black';
    context.lineWidth = 0.3;
    
    // Flow field parameters
    const margin = 10;
    const particleCount = 500;
    const stepLength = 2;
    const steps = 100;
    const noiseScale = 0.003;
    
    // Generate particles
    for (let i = 0; i < particleCount; i++) {
      // Random starting position
      let x = random.range(margin, width - margin);
      let y = random.range(margin, height - margin);
      
      context.beginPath();
      context.moveTo(x, y);
      
      // Follow flow field
      for (let step = 0; step < steps; step++) {
        // Get flow direction from noise
        const angle = noise2D(x * noiseScale, y * noiseScale) * Math.PI * 2;
        
        // Move particle
        x += Math.cos(angle) * stepLength;
        y += Math.sin(angle) * stepLength;
        
        // Draw line
        context.lineTo(x, y);
        
        // Stop if outside bounds
        if (x < 0 || x > width || y < 0 || y > height) break;
      }
      
      context.stroke();
    }
  };
};

canvasSketch(sketch, settings);
```

### Advanced Techniques

#### Curl Noise

Creates divergence-free fields (no sources or sinks):

```javascript
function getCurlNoise(x, y, scale = 0.01) {
  const epsilon = 0.0001;
  
  // Sample potential field
  const n1 = noise2D(x * scale, y * scale);
  const n2 = noise2D(x * scale, (y + epsilon) * scale);
  const n3 = noise2D((x + epsilon) * scale, y * scale);
  
  // Compute curl
  const dx = (n2 - n1) / epsilon;
  const dy = -(n3 - n1) / epsilon;
  
  return { x: dx, y: dy };
}
```

#### Layered Fields

Combine multiple noise octaves for complexity:

```javascript
function getLayeredFlow(x, y) {
  let angle = 0;
  let amplitude = 1;
  let frequency = 0.003;
  
  // Add multiple octaves
  for (let i = 0; i < 4; i++) {
    angle += noise2D(x * frequency, y * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}
```

## Parameters & Effects

### Key Parameters

| Parameter | Effect | Range | Notes |
|-----------|--------|-------|-------|
| `noiseScale` | Field complexity | 0.001 - 0.01 | Lower = larger features |
| `stepLength` | Line smoothness | 0.5 - 5 | Shorter = smoother curves |
| `particleCount` | Density | 100 - 5000 | Balance with performance |
| `steps` | Line length | 50 - 500 | Longer = more coverage |
| `lineWidth` | Visual weight | 0.1 - 1.0 | Match pen capabilities |

### Visual Variations

#### Density Mapping
```javascript
// Vary particle density by position
const density = noise2D(x * 0.001, y * 0.001);
if (random.value() > density) continue;
```

#### Variable Line Weight
```javascript
// Change line weight based on speed
const speed = Math.sqrt(dx * dx + dy * dy);
context.lineWidth = lerp(0.1, 0.5, speed);
```

#### Color Fields (for multi-pen plots)
```javascript
// Assign colors based on field regions
const colorAngle = Math.atan2(dy, dx);
const colorIndex = Math.floor((colorAngle + Math.PI) / (Math.PI * 2) * 4);
```

## Optimization for Plotting

### Path Sorting
Minimize pen travel time:

```javascript
// Group nearby starting points
const spatialHash = new Map();
particles.forEach(p => {
  const key = `${Math.floor(p.x/10)},${Math.floor(p.y/10)}`;
  if (!spatialHash.has(key)) spatialHash.set(key, []);
  spatialHash.get(key).push(p);
});
```

### Line Simplification
Reduce points while maintaining quality:

```javascript
// Douglas-Peucker algorithm
function simplifyPath(points, tolerance = 0.5) {
  // Implementation for reducing point count
  // while preserving path character
}
```

## Creative Variations

### Attractor Fields
Add points of interest:

```javascript
function getAttractorField(x, y, attractors) {
  let totalDx = 0, totalDy = 0;
  
  attractors.forEach(attr => {
    const dx = attr.x - x;
    const dy = attr.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const strength = attr.strength / (dist * dist);
    
    totalDx += (dx / dist) * strength;
    totalDy += (dy / dist) * strength;
  });
  
  // Combine with base field
  const baseAngle = noise2D(x * 0.005, y * 0.005) * Math.PI * 2;
  return {
    x: Math.cos(baseAngle) + totalDx * 0.1,
    y: Math.sin(baseAngle) + totalDy * 0.1
  };
}
```

### Turbulent Fields
Add chaotic elements:

```javascript
function getTurbulentFlow(x, y, time) {
  const base = getPerlinFlowVector(x, y);
  const turb = noise2D(x * 0.01, y * 0.01, time) * 0.5;
  
  return {
    x: base.x + Math.sin(turb * Math.PI) * 0.3,
    y: base.y + Math.cos(turb * Math.PI) * 0.3
  };
}
```

## Example Parameter Sets

### Gentle Streams
```javascript
{
  noiseScale: 0.002,
  stepLength: 3,
  steps: 200,
  particleCount: 300,
  lineWidth: 0.3
}
```

### Turbulent Rapids
```javascript
{
  noiseScale: 0.008,
  stepLength: 1,
  steps: 150,
  particleCount: 1000,
  lineWidth: 0.2,
  turbulence: 0.5
}
```

### Magnetic Fields
```javascript
{
  fieldType: 'dipole',
  poleStrength: 100,
  noiseAmount: 0.1,
  particleCount: 500,
  lineWidth: 0.4
}
```

## Integration with Other Algorithms

### With [[Cellular-Automata-Algorithms]]
Use cellular automata to seed particle positions:

```javascript
// Place particles on living cells
gameOfLife.getGrid().forEach((row, y) => {
  row.forEach((cell, x) => {
    if (cell === 1) {
      particles.push({ x: x * cellSize, y: y * cellSize });
    }
  });
});
```

### With [[Reaction-Diffusion-System]]
Use reaction-diffusion patterns to modulate field strength:

```javascript
const concentration = reactionDiffusion.getConcentration(x, y);
const fieldStrength = lerp(0.1, 1.0, concentration);
```

## Tips for Best Results

1. **Start Simple**: Begin with basic Perlin noise fields
2. **Test Small**: Use fewer particles for parameter testing
3. **Layer Gradually**: Build complexity through multiple passes
4. **Mind the Physics**: Consider pen acceleration limits
5. **Document Settings**: Save successful parameter combinations

## Common Issues & Solutions

### Lines Too Uniform
- Add noise to step length
- Vary starting positions
- Introduce turbulence

### Overcrowded Areas
- Implement collision detection
- Use density maps
- Add particle death conditions

### Plotting Too Slow
- Optimize path order
- Reduce point density
- Group nearby paths

## Related Algorithms
- [[Reaction-Diffusion-System]] - For organic patterns
- [[Cellular-Automata-Algorithms]] - For discrete systems
- [[Creative-Combinations]] - Mixing techniques
- [[Pen-Plotter-Art-Overview]] - Project overview

## Resources & References
- [Perlin Noise](https://mrl.cs.nyu.edu/~perlin/noise/)
- [Curl Noise for Procedural Fluid Flow](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf)
- [Vector Field Visualization](https://en.wikipedia.org/wiki/Vector_field)

#tutorial #code-examples #parameters #vector-math