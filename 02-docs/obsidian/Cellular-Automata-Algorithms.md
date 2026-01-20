# Cellular Automata Algorithms

#algorithm #generative-art #pen-plotter #cellular-automata #discrete-systems

## Overview

Cellular automata (CA) are discrete models consisting of a grid of cells, each in one of a finite number of states. The state of each cell evolves over time according to a set of rules based on the states of neighboring cells. These simple rules can produce remarkably complex and beautiful patterns.

## Core Concepts

### Grid Structure
- **2D Grid**: Most common for visual art
- **Cell States**: Typically binary (alive/dead) but can be multi-state
- **Neighborhoods**: Moore (8 neighbors) or Von Neumann (4 neighbors)
- **Boundary Conditions**: Toroidal wrap, dead borders, or alive borders

### Evolution Rules
Rules determine the next state based on:
1. Current cell state
2. Neighbor states
3. Sometimes: cell history or global patterns

## Conway's Game of Life

The most famous CA, with simple rules that create complex behaviors.

### Rules
1. **Underpopulation**: Live cell with < 2 neighbors dies
2. **Survival**: Live cell with 2-3 neighbors survives
3. **Overpopulation**: Live cell with > 3 neighbors dies
4. **Reproduction**: Dead cell with exactly 3 neighbors becomes alive

### Implementation

```javascript
import { GameOfLife, GridBoundary } from './cellular-automata/game-of-life.js';

// Create a 50x50 grid with wrapping edges
const game = new GameOfLife(50, 50, {
  boundary: GridBoundary.WRAP
});

// Load a glider pattern
const glider = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1]
];
game.loadPattern(glider, 10, 10);

// Evolve the system
for (let i = 0; i < 100; i++) {
  game.step();
}

// Export current state
const grid = game.getGrid();
```

### Classic Patterns

#### Still Lifes (Stable)
```javascript
const patterns = {
  block: [
    [1, 1],
    [1, 1]
  ],
  
  beehive: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ],
  
  loaf: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 0]
  ]
};
```

#### Oscillators (Periodic)
```javascript
const oscillators = {
  blinker: {
    phase1: [[1, 1, 1]],
    phase2: [[1], [1], [1]]
  },
  
  toad: {
    phase1: [
      [0, 1, 1, 1],
      [1, 1, 1, 0]
    ],
    phase2: [
      [0, 0, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 0, 0]
    ]
  }
};
```

#### Spaceships (Moving)
```javascript
const spaceships = {
  glider: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
  ],
  
  lwss: [ // Lightweight spaceship
    [0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ]
};
```

## Elementary Cellular Automata

1D cellular automata with fascinating emergent properties.

### Rule Definition
Each rule is defined by an 8-bit number (0-255):

```javascript
class ElementaryCA {
  constructor(rule, width) {
    this.rule = rule;
    this.width = width;
    this.cells = new Array(width).fill(0);
    this.cells[Math.floor(width / 2)] = 1; // Center seed
  }
  
  getNextState(left, center, right) {
    const index = (left << 2) | (center << 1) | right;
    return (this.rule >> index) & 1;
  }
  
  step() {
    const newCells = new Array(this.width);
    
    for (let i = 0; i < this.width; i++) {
      const left = this.cells[(i - 1 + this.width) % this.width];
      const center = this.cells[i];
      const right = this.cells[(i + 1) % this.width];
      
      newCells[i] = this.getNextState(left, center, right);
    }
    
    this.cells = newCells;
    return this.cells;
  }
}
```

### Notable Rules
- **Rule 30**: Chaotic behavior, used in random number generation
- **Rule 90**: Sierpinski triangle pattern
- **Rule 110**: Proven to be Turing complete
- **Rule 184**: Traffic flow modeling

## Advanced Cellular Automata

### Multi-State Systems

#### Brian's Brain
Three states: dead, alive, dying

```javascript
class BriansBrain {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // States: 0 = dead, 1 = alive, 2 = dying
    this.grid = this.createGrid(0);
  }
  
  applyRules(state, aliveNeighbors) {
    switch(state) {
      case 0: // Dead
        return aliveNeighbors === 2 ? 1 : 0;
      case 1: // Alive
        return 2; // Always becomes dying
      case 2: // Dying
        return 0; // Always becomes dead
    }
  }
}
```

#### Langton's Ant
Agent-based CA with emergent highway behavior:

```javascript
class LangtonsAnt {
  constructor(width, height) {
    this.grid = this.createGrid(0);
    this.ant = {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
      direction: 0 // 0=up, 1=right, 2=down, 3=left
    };
  }
  
  step() {
    const { x, y, direction } = this.ant;
    
    // Turn based on current cell
    if (this.grid[y][x] === 0) {
      // White cell: turn right
      this.ant.direction = (direction + 1) % 4;
    } else {
      // Black cell: turn left
      this.ant.direction = (direction + 3) % 4;
    }
    
    // Flip cell color
    this.grid[y][x] = 1 - this.grid[y][x];
    
    // Move forward
    const moves = [[0,-1], [1,0], [0,1], [-1,0]];
    const [dx, dy] = moves[this.ant.direction];
    this.ant.x = (x + dx + this.width) % this.width;
    this.ant.y = (y + dy + this.height) % this.height;
  }
}
```

## Rendering for Pen Plotting

### SVG Export Strategies

```javascript
import { CellularAutomataSVGExporter, RenderStyle } from './exporters/cellular-automata-svg.js';

// Different rendering styles
const styles = {
  squares: new CellularAutomataSVGExporter({
    cellSize: 5,
    renderStyle: RenderStyle.SQUARES,
    strokeWidth: 0.3
  }),
  
  circles: new CellularAutomataSVGExporter({
    cellSize: 6,
    renderStyle: RenderStyle.CIRCLES,
    strokeWidth: 0.2
  }),
  
  dots: new CellularAutomataSVGExporter({
    cellSize: 4,
    renderStyle: RenderStyle.DOTS,
    strokeWidth: 0.5
  }),
  
  lines: new CellularAutomataSVGExporter({
    cellSize: 5,
    renderStyle: RenderStyle.LINES,
    lineSpacing: 1.5
  })
};
```

### Path Optimization

Group adjacent cells to minimize pen travel:

```javascript
function optimizeCellularPaths(grid) {
  const paths = [];
  const visited = createGrid(grid[0].length, grid.length, false);
  
  // Find connected components
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === 1 && !visited[y][x]) {
        const component = floodFill(grid, visited, x, y);
        paths.push(createOptimalPath(component));
      }
    }
  }
  
  return sortPathsByProximity(paths);
}
```

## Creative Applications

### Pattern Generation

#### Symmetric Initialization
```javascript
function createSymmetricSeed(game, symmetry = 4) {
  const center = game.width / 2;
  const points = [];
  
  // Generate random points in one sector
  for (let i = 0; i < 10; i++) {
    const r = Math.random() * center * 0.3;
    const theta = Math.random() * (Math.PI * 2 / symmetry);
    points.push({
      x: center + r * Math.cos(theta),
      y: center + r * Math.sin(theta)
    });
  }
  
  // Reflect across symmetry axes
  points.forEach(p => {
    for (let s = 0; s < symmetry; s++) {
      const angle = s * (Math.PI * 2 / symmetry);
      const x = center + (p.x - center) * Math.cos(angle) - (p.y - center) * Math.sin(angle);
      const y = center + (p.x - center) * Math.sin(angle) + (p.y - center) * Math.cos(angle);
      game.setCell(Math.floor(x), Math.floor(y), 1);
    }
  });
}
```

#### Evolution Snapshots
Capture interesting moments in CA evolution:

```javascript
function findInterestingGenerations(game, maxGen = 1000) {
  const snapshots = [];
  let lastComplexity = 0;
  
  for (let gen = 0; gen < maxGen; gen++) {
    game.step();
    
    const complexity = calculateComplexity(game.getGrid());
    const delta = Math.abs(complexity - lastComplexity);
    
    // Capture moments of change
    if (delta > 0.1 || gen % 50 === 0) {
      snapshots.push({
        generation: gen,
        complexity: complexity,
        grid: game.getGrid()
      });
    }
    
    lastComplexity = complexity;
  }
  
  return snapshots;
}

function calculateComplexity(grid) {
  // Measure pattern complexity (entropy, edge count, etc.)
  let edges = 0;
  for (let y = 0; y < grid.length - 1; y++) {
    for (let x = 0; x < grid[0].length - 1; x++) {
      if (grid[y][x] !== grid[y][x+1]) edges++;
      if (grid[y][x] !== grid[y+1][x]) edges++;
    }
  }
  return edges / (grid.length * grid[0].length);
}
```

### Hybrid Rules

Combine different CA rules in space or time:

```javascript
class HybridCA {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = this.createGrid();
    this.ruleMap = this.createRuleMap();
  }
  
  createRuleMap() {
    // Different rules in different regions
    const map = this.createGrid();
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (dist < this.width * 0.2) {
          map[y][x] = 'gameOfLife';
        } else if (dist < this.width * 0.4) {
          map[y][x] = 'briansBrain';
        } else {
          map[y][x] = 'custom';
        }
      }
    }
    
    return map;
  }
}
```

## Parameter Libraries

### Game of Life Variations

```javascript
const lifeVariants = {
  standard: { birth: [3], survival: [2, 3] },        // B3/S23
  highLife: { birth: [3, 6], survival: [2, 3] },     // B36/S23
  seeds: { birth: [2], survival: [] },               // B2/S
  lifewithoutDeath: { birth: [3], survival: [0,1,2,3,4,5,6,7,8] }, // B3/S012345678
  dayAndNight: { birth: [3,6,7,8], survival: [3,4,6,7,8] }  // B3678/S34678
};
```

### Rendering Parameters

```javascript
const renderPresets = {
  fine: {
    cellSize: 2,
    strokeWidth: 0.1,
    margin: 10
  },
  
  medium: {
    cellSize: 5,
    strokeWidth: 0.3,
    margin: 15
  },
  
  bold: {
    cellSize: 10,
    strokeWidth: 0.5,
    margin: 20
  }
};
```

## Integration with Other Systems

### With [[Flow-Fields-Algorithm]]
Use CA patterns to seed flow field particles:

```javascript
// Generate CA pattern
const game = new GameOfLife(100, 100);
game.randomize(0.3);
for (let i = 0; i < 20; i++) game.step();

// Place flow field particles on living cells
const particles = [];
game.getGrid().forEach((row, y) => {
  row.forEach((cell, x) => {
    if (cell === 1) {
      particles.push({
        x: x * cellScale,
        y: y * cellScale,
        age: 0
      });
    }
  });
});
```

### With [[Reaction-Diffusion-System]]
Use CA to mask or seed reaction-diffusion:

```javascript
// Initialize RD system with CA pattern
const rd = new ReactionDiffusion(200, 200);
const caGrid = game.getGrid();

for (let y = 0; y < rd.height; y++) {
  for (let x = 0; x < rd.width; x++) {
    const caX = Math.floor(x * caGrid[0].length / rd.width);
    const caY = Math.floor(y * caGrid.length / rd.height);
    
    if (caGrid[caY][caX] === 1) {
      rd.addChemical(x, y, 'B', 1.0);
    }
  }
}
```

## Best Practices

1. **Start Small**: Test rules on small grids first
2. **Save Seeds**: Document interesting starting configurations
3. **Track Generations**: Some patterns emerge after many steps
4. **Combine Techniques**: Layer multiple CA runs
5. **Respect Constraints**: Consider pen plotting limitations

## Common Patterns & Solutions

### Problem: Static Patterns
- Add noise to initial configuration
- Use different boundary conditions
- Introduce rule variations

### Problem: Too Chaotic
- Reduce initial density
- Use more conservative rules
- Apply spatial constraints

### Problem: Slow Plotting
- Optimize path ordering
- Reduce cell size
- Use selective rendering

## Related Topics
- [[Pen-Plotter-Art-Overview]] - Project context
- [[Flow-Fields-Algorithm]] - Continuous systems
- [[Reaction-Diffusion-System]] - Chemical simulations
- [[Creative-Combinations]] - Mixing techniques

## References & Resources
- [Golly](http://golly.sourceforge.net/) - CA simulator
- [Wolfram's New Kind of Science](https://www.wolframscience.com/nks/)
- [Conway's Game of Life Wiki](https://conwaylife.com/)
- [Cellular Automata Rules](https://plato.stanford.edu/entries/cellular-automata/)

#discrete-mathematics #emergence #pattern-generation #grid-systems