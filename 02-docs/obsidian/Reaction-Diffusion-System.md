# Reaction-Diffusion System

#algorithm #generative-art #pen-plotter #reaction-diffusion #chemical-simulation

## Overview

Reaction-diffusion systems simulate the interaction between two or more chemical substances as they diffuse through space and react with each other. These systems produce organic patterns found throughout nature: animal markings, coral growth, chemical waves, and cellular structures.

## Mathematical Foundation

### The Gray-Scott Model

The most popular model for generative art, using two chemicals A and B:

```
∂A/∂t = D_A ∇²A - AB² + f(1-A)
∂B/∂t = D_B ∇²B + AB² - (k+f)B
```

Where:
- `D_A, D_B` = Diffusion rates
- `f` = Feed rate
- `k` = Kill rate
- `∇²` = Laplacian operator

### Discrete Implementation

```javascript
class ReactionDiffusion {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Chemical concentrations
    this.a = Array(height).fill().map(() => Array(width).fill(1.0));
    this.b = Array(height).fill().map(() => Array(width).fill(0.0));
    
    // Parameters
    this.dA = 1.0;    // Diffusion rate A
    this.dB = 0.5;    // Diffusion rate B
    this.feed = 0.055; // Feed rate
    this.kill = 0.062; // Kill rate
    this.dt = 1.0;     // Time step
  }
  
  laplacian(grid, x, y) {
    let sum = 0;
    sum += grid[y][x] * -1;
    sum += grid[y][(x-1+this.width)%this.width] * 0.2;
    sum += grid[y][(x+1)%this.width] * 0.2;
    sum += grid[(y-1+this.height)%this.height][x] * 0.2;
    sum += grid[(y+1)%this.height][x] * 0.2;
    sum += grid[(y-1+this.height)%this.height][(x-1+this.width)%this.width] * 0.05;
    sum += grid[(y-1+this.height)%this.height][(x+1)%this.width] * 0.05;
    sum += grid[(y+1)%this.height][(x-1+this.width)%this.width] * 0.05;
    sum += grid[(y+1)%this.height][(x+1)%this.width] * 0.05;
    return sum;
  }
  
  step() {
    // Create new grids for next state
    const nextA = Array(this.height).fill().map(() => Array(this.width).fill(0));
    const nextB = Array(this.height).fill().map(() => Array(this.width).fill(0));
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const a = this.a[y][x];
        const b = this.b[y][x];
        
        // Calculate laplacians
        const laplA = this.laplacian(this.a, x, y);
        const laplB = this.laplacian(this.b, x, y);
        
        // Apply reaction-diffusion equations
        nextA[y][x] = a + (
          this.dA * laplA -
          a * b * b +
          this.feed * (1 - a)
        ) * this.dt;
        
        nextB[y][x] = b + (
          this.dB * laplB +
          a * b * b -
          (this.kill + this.feed) * b
        ) * this.dt;
        
        // Constrain values
        nextA[y][x] = Math.max(0, Math.min(1, nextA[y][x]));
        nextB[y][x] = Math.max(0, Math.min(1, nextB[y][x]));
      }
    }
    
    this.a = nextA;
    this.b = nextB;
  }
  
  seed(x, y, radius = 5) {
    // Add chemical B in a circular region
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx*dx + dy*dy <= radius*radius) {
          const px = (x + dx + this.width) % this.width;
          const py = (y + dy + this.height) % this.height;
          this.b[py][px] = 1.0;
        }
      }
    }
  }
}
```

## Pattern Types & Parameters

### Classic Patterns

Different feed and kill rates produce distinct patterns:

```javascript
const patterns = {
  spots: {
    feed: 0.055,
    kill: 0.062,
    description: "Stable spots, cheetah-like"
  },
  
  stripes: {
    feed: 0.055,
    kill: 0.063,
    description: "Zebra stripes"
  },
  
  spirals: {
    feed: 0.014,
    kill: 0.054,
    description: "Spiral waves"
  },
  
  coral: {
    feed: 0.0545,
    kill: 0.062,
    description: "Coral-like growth"
  },
  
  mitosis: {
    feed: 0.028,
    kill: 0.062,
    description: "Cell division patterns"
  },
  
  waves: {
    feed: 0.014,
    kill: 0.045,
    description: "Traveling waves"
  },
  
  worms: {
    feed: 0.078,
    kill: 0.061,
    description: "Worm-like structures"
  }
};
```

### Parameter Space Exploration

```javascript
function exploreParameterSpace(baseRD, fRange, kRange, samples = 5) {
  const results = [];
  
  for (let fi = 0; fi < samples; fi++) {
    for (let ki = 0; ki < samples; ki++) {
      const f = fRange[0] + (fRange[1] - fRange[0]) * fi / (samples - 1);
      const k = kRange[0] + (kRange[1] - kRange[0]) * ki / (samples - 1);
      
      // Clone base system
      const rd = cloneRD(baseRD);
      rd.feed = f;
      rd.kill = k;
      
      // Evolve
      for (let i = 0; i < 1000; i++) {
        rd.step();
      }
      
      results.push({
        feed: f,
        kill: k,
        pattern: classifyPattern(rd),
        complexity: measureComplexity(rd)
      });
    }
  }
  
  return results;
}
```

## Rendering Techniques

### Threshold-Based Rendering

Convert chemical concentrations to binary patterns:

```javascript
function renderThreshold(rd, threshold = 0.5) {
  const svg = [];
  const cellSize = 2;
  
  for (let y = 0; y < rd.height; y++) {
    for (let x = 0; x < rd.width; x++) {
      if (rd.b[y][x] > threshold) {
        svg.push(`<rect x="${x*cellSize}" y="${y*cellSize}" 
                  width="${cellSize}" height="${cellSize}" 
                  fill="none" stroke="black" stroke-width="0.3"/>`);
      }
    }
  }
  
  return svg.join('\n');
}
```

### Contour Lines

Extract isolines for smoother patterns:

```javascript
function renderContours(rd, levels = [0.2, 0.4, 0.6, 0.8]) {
  const paths = [];
  
  levels.forEach(level => {
    const contours = marchingSquares(rd.b, level);
    contours.forEach(contour => {
      const path = contour.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
      ).join(' ');
      paths.push(`<path d="${path}" fill="none" 
                  stroke="black" stroke-width="0.3"/>`);
    });
  });
  
  return paths.join('\n');
}
```

### Gradient Mapping

Use concentration values for variable density:

```javascript
function renderGradient(rd) {
  const paths = [];
  const lineSpacing = 2;
  
  for (let y = 0; y < rd.height; y += lineSpacing) {
    const segments = [];
    let drawing = false;
    
    for (let x = 0; x < rd.width; x++) {
      const density = rd.b[y][x];
      const shouldDraw = Math.random() < density;
      
      if (shouldDraw && !drawing) {
        segments.push({ start: x, points: [x] });
        drawing = true;
      } else if (shouldDraw && drawing) {
        segments[segments.length - 1].points.push(x);
      } else if (!shouldDraw && drawing) {
        drawing = false;
      }
    }
    
    // Convert segments to paths
    segments.forEach(seg => {
      const path = `M ${seg.start} ${y} L ${seg.points[seg.points.length - 1]} ${y}`;
      paths.push(`<path d="${path}" stroke="black" stroke-width="0.3"/>`);
    });
  }
  
  return paths.join('\n');
}
```

## Advanced Techniques

### Multi-Scale Systems

Combine different scales for complex patterns:

```javascript
class MultiScaleRD {
  constructor(width, height) {
    this.coarse = new ReactionDiffusion(width / 4, height / 4);
    this.medium = new ReactionDiffusion(width / 2, height / 2);
    this.fine = new ReactionDiffusion(width, height);
    
    // Different parameters for each scale
    this.coarse.feed = 0.028;
    this.coarse.kill = 0.062;
    
    this.medium.feed = 0.055;
    this.medium.kill = 0.062;
    
    this.fine.feed = 0.078;
    this.fine.kill = 0.061;
  }
  
  step() {
    // Evolve each scale
    this.coarse.step();
    this.medium.step();
    this.fine.step();
    
    // Couple scales
    this.coupleScales();
  }
  
  coupleScales() {
    // Upscale coarse to influence medium
    for (let y = 0; y < this.medium.height; y++) {
      for (let x = 0; x < this.medium.width; x++) {
        const cx = Math.floor(x / 2);
        const cy = Math.floor(y / 2);
        const influence = this.coarse.b[cy][cx] * 0.1;
        this.medium.b[y][x] += influence;
      }
    }
    
    // Similar for medium to fine...
  }
}
```

### Anisotropic Diffusion

Direction-dependent diffusion rates:

```javascript
class AnisotropicRD extends ReactionDiffusion {
  constructor(width, height) {
    super(width, height);
    this.diffusionField = this.createDiffusionField();
  }
  
  createDiffusionField() {
    // Create a field that varies diffusion by direction
    const field = [];
    
    for (let y = 0; y < this.height; y++) {
      field[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Example: circular anisotropy
        const cx = this.width / 2;
        const cy = this.height / 2;
        const angle = Math.atan2(y - cy, x - cx);
        
        field[y][x] = {
          dx: 1.0 + 0.5 * Math.cos(angle),
          dy: 1.0 + 0.5 * Math.sin(angle)
        };
      }
    }
    
    return field;
  }
  
  laplacianAnisotropic(grid, x, y) {
    const { dx, dy } = this.diffusionField[y][x];
    // Modified laplacian with directional weights
    // ... implementation
  }
}
```

### Temporal Variations

Parameters that change over time:

```javascript
class TemporalRD extends ReactionDiffusion {
  constructor(width, height) {
    super(width, height);
    this.time = 0;
    this.baseFeed = 0.055;
    this.baseKill = 0.062;
  }
  
  step() {
    // Oscillating parameters
    this.feed = this.baseFeed + 0.01 * Math.sin(this.time * 0.01);
    this.kill = this.baseKill + 0.001 * Math.cos(this.time * 0.02);
    
    super.step();
    this.time++;
  }
}
```

## Optimization Strategies

### Spatial Hashing

Only compute active regions:

```javascript
class OptimizedRD extends ReactionDiffusion {
  constructor(width, height) {
    super(width, height);
    this.activeRegions = new Set();
  }
  
  markActive(x, y, radius = 2) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const key = `${x+dx},${y+dy}`;
        this.activeRegions.add(key);
      }
    }
  }
  
  step() {
    const newActive = new Set();
    
    this.activeRegions.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      
      // Only compute if chemical B is present
      if (this.b[y][x] > 0.01) {
        // Compute reaction-diffusion
        this.updateCell(x, y);
        
        // Mark neighbors as potentially active
        this.markActiveNeighbors(x, y, newActive);
      }
    });
    
    this.activeRegions = newActive;
  }
}
```

### GPU Acceleration (WebGL)

```javascript
class WebGLReactionDiffusion {
  constructor(canvas) {
    this.gl = canvas.getContext('webgl2');
    this.setupShaders();
    this.setupTextures();
  }
  
  fragmentShaderSource = `
    precision highp float;
    
    uniform sampler2D u_chemicals;
    uniform vec2 u_resolution;
    uniform float u_dA;
    uniform float u_dB;
    uniform float u_feed;
    uniform float u_kill;
    uniform float u_dt;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 texel = 1.0 / u_resolution;
      
      // Sample current state
      vec2 ab = texture2D(u_chemicals, uv).rg;
      float a = ab.r;
      float b = ab.g;
      
      // Calculate laplacian
      vec2 laplAB = -ab;
      laplAB += texture2D(u_chemicals, uv + vec2(-texel.x, 0)).rg * 0.2;
      laplAB += texture2D(u_chemicals, uv + vec2(texel.x, 0)).rg * 0.2;
      laplAB += texture2D(u_chemicals, uv + vec2(0, -texel.y)).rg * 0.2;
      laplAB += texture2D(u_chemicals, uv + vec2(0, texel.y)).rg * 0.2;
      laplAB += texture2D(u_chemicals, uv + vec2(-texel.x, -texel.y)).rg * 0.05;
      laplAB += texture2D(u_chemicals, uv + vec2(texel.x, -texel.y)).rg * 0.05;
      laplAB += texture2D(u_chemicals, uv + vec2(-texel.x, texel.y)).rg * 0.05;
      laplAB += texture2D(u_chemicals, uv + vec2(texel.x, texel.y)).rg * 0.05;
      
      // Reaction-diffusion
      float reaction = a * b * b;
      float nextA = a + (u_dA * laplAB.r - reaction + u_feed * (1.0 - a)) * u_dt;
      float nextB = b + (u_dB * laplAB.g + reaction - (u_kill + u_feed) * b) * u_dt;
      
      gl_FragColor = vec4(
        clamp(nextA, 0.0, 1.0),
        clamp(nextB, 0.0, 1.0),
        0.0,
        1.0
      );
    }
  `;
}
```

## Creative Applications

### Pattern Masking

Use images or shapes to constrain growth:

```javascript
function applyMask(rd, maskFunction) {
  for (let y = 0; y < rd.height; y++) {
    for (let x = 0; x < rd.width; x++) {
      if (!maskFunction(x, y)) {
        rd.a[y][x] = 1.0;
        rd.b[y][x] = 0.0;
      }
    }
  }
}

// Example: Circular mask
applyMask(rd, (x, y) => {
  const cx = rd.width / 2;
  const cy = rd.height / 2;
  const r = Math.min(cx, cy) * 0.8;
  return (x - cx) ** 2 + (y - cy) ** 2 < r ** 2;
});
```

### Multiple Chemical Systems

Extend to 3+ chemicals:

```javascript
class TripleRD {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.a = this.createGrid(1.0);
    this.b = this.createGrid(0.0);
    this.c = this.createGrid(0.0);
    
    // Interaction matrix
    this.interactions = {
      ab: 1.0,  // A + B reaction strength
      bc: 0.8,  // B + C reaction strength
      ca: 0.5   // C + A reaction strength
    };
  }
  
  step() {
    // Extended reaction-diffusion with three chemicals
    // Each chemical can react with the others
    // Creating more complex patterns
  }
}
```

## Integration with Other Systems

### With [[Cellular-Automata-Algorithms]]

Use CA patterns as RD seeds:

```javascript
// Generate interesting CA pattern
const gameOfLife = new GameOfLife(100, 100);
gameOfLife.randomize(0.3);
for (let i = 0; i < 50; i++) gameOfLife.step();

// Seed RD system with CA pattern
const rd = new ReactionDiffusion(200, 200);
const caGrid = gameOfLife.getGrid();

for (let y = 0; y < 100; y++) {
  for (let x = 0; x < 100; x++) {
    if (caGrid[y][x] === 1) {
      rd.seed(x * 2, y * 2, 3);
    }
  }
}
```

### With [[Flow-Fields-Algorithm]]

Use RD patterns to modulate flow fields:

```javascript
function getRDModulatedFlow(x, y, rd) {
  // Sample RD concentration
  const rdX = Math.floor(x / scale);
  const rdY = Math.floor(y / scale);
  const concentration = rd.b[rdY][rdX];
  
  // Base flow field
  const baseAngle = noise2D(x * 0.005, y * 0.005) * Math.PI * 2;
  
  // Modulate by RD pattern
  const modulation = concentration * Math.PI;
  
  return {
    x: Math.cos(baseAngle + modulation),
    y: Math.sin(baseAngle + modulation)
  };
}
```

## Best Practices for Plotting

1. **Resolution Balance**: Match simulation resolution to plotting resolution
2. **Parameter Recording**: Always save successful parameter sets
3. **Seed Placement**: Strategic seeding creates controlled patterns
4. **Evolution Time**: Some patterns need thousands of steps
5. **Multiple Runs**: Combine multiple RD runs for complexity

## Troubleshooting

### Pattern Dies Out
- Increase feed rate slightly
- Decrease kill rate
- Add more seed points
- Check boundary conditions

### Pattern Too Uniform
- Add parameter noise
- Use multiple seed points
- Vary parameters spatially
- Introduce anisotropy

### Simulation Too Slow
- Reduce grid resolution
- Implement spatial optimization
- Use GPU acceleration
- Simplify laplacian calculation

## Example Workflows

### Organic Textures
```javascript
// 1. Initialize with coral parameters
const rd = new ReactionDiffusion(300, 300);
rd.feed = 0.0545;
rd.kill = 0.062;

// 2. Multiple random seeds
for (let i = 0; i < 5; i++) {
  rd.seed(
    Math.random() * rd.width,
    Math.random() * rd.height,
    Math.random() * 5 + 3
  );
}

// 3. Evolve
for (let i = 0; i < 2000; i++) {
  rd.step();
}

// 4. Render with contours
const svg = renderContours(rd, [0.1, 0.3, 0.5, 0.7]);
```

### Controlled Patterns
```javascript
// 1. Create with stripe parameters
const rd = new ReactionDiffusion(400, 400);
rd.feed = 0.055;
rd.kill = 0.063;

// 2. Geometric seeding
const center = rd.width / 2;
for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
  const x = center + Math.cos(angle) * 50;
  const y = center + Math.sin(angle) * 50;
  rd.seed(x, y, 4);
}

// 3. Evolve with monitoring
const snapshots = [];
for (let i = 0; i < 3000; i++) {
  rd.step();
  if (i % 500 === 0) {
    snapshots.push(rd.b.map(row => [...row]));
  }
}
```

## Related Topics
- [[Pen-Plotter-Art-Overview]] - Project context
- [[Cellular-Automata-Algorithms]] - Discrete systems
- [[Flow-Fields-Algorithm]] - Vector fields
- [[Creative-Combinations]] - Hybrid approaches

## References & Resources
- [Gray-Scott Reaction-Diffusion](http://mrob.com/pub/comp/xmorphia/)
- [Reaction-Diffusion Tutorial](https://www.karlsims.com/rd.html)
- [Pattern Formation in Nature](https://en.wikipedia.org/wiki/Pattern_formation)
- [Turing Patterns](https://en.wikipedia.org/wiki/Turing_pattern)

#chemical-simulation #pattern-formation #organic-patterns #mathematical-biology