/**
 * Test fixtures for known Game of Life patterns
 * Cells are represented as 1 (alive) or 0 (dead)
 */

export const patterns = {
  // Still lifes - patterns that don't change
  stillLifes: {
    block: {
      name: 'Block',
      grid: [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ],
      description: '2x2 square that remains stable'
    },
    beehive: {
      name: 'Beehive',
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      description: 'Hexagonal still life'
    },
    loaf: {
      name: 'Loaf',
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      description: 'Common still life'
    },
    boat: {
      name: 'Boat',
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      description: 'Small still life'
    },
    tub: {
      name: 'Tub',
      grid: [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      description: 'Minimal still life'
    }
  },

  // Oscillators - patterns that repeat after a period
  oscillators: {
    blinker: {
      name: 'Blinker',
      period: 2,
      phase1: [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      phase2: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      description: 'Period 2 oscillator'
    },
    toad: {
      name: 'Toad',
      period: 2,
      phase1: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      phase2: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 1, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      description: 'Period 2 oscillator'
    },
    beacon: {
      name: 'Beacon',
      period: 2,
      phase1: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      phase2: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0]
      ],
      description: 'Period 2 oscillator'
    },
    pulsar: {
      name: 'Pulsar',
      period: 3,
      phase1: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      description: 'Period 3 oscillator'
    }
  },

  // Spaceships - patterns that move
  spaceships: {
    glider: {
      name: 'Glider',
      period: 4,
      direction: 'SE', // moves diagonally southeast
      phase1: [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ],
      phase2: [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      phase3: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ],
      phase4: [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 1, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      description: 'Smallest spaceship'
    },
    lwss: {
      name: 'Lightweight Spaceship',
      period: 4,
      direction: 'E', // moves east
      phase1: [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0]
      ],
      description: 'Small orthogonal spaceship'
    }
  },

  // Methuselahs - small patterns that evolve for a long time
  methuselahs: {
    rPentomino: {
      name: 'R-pentomino',
      grid: [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      lifespan: 1103, // generations before stabilizing
      description: 'Small pattern with long evolution'
    },
    diehard: {
      name: 'Diehard',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      lifespan: 130, // generations before dying out
      description: 'Pattern that eventually disappears'
    },
    acorn: {
      name: 'Acorn',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      lifespan: 5206, // generations before stabilizing
      description: 'Small pattern with very long evolution'
    }
  },

  // Edge case patterns for testing boundaries
  edgeCases: {
    cornerGlider: {
      name: 'Corner Glider',
      grid: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1]
      ],
      description: 'Glider at grid corner for boundary testing'
    },
    edgeBlinker: {
      name: 'Edge Blinker',
      grid: [
        [1, 1, 1]
      ],
      description: 'Blinker at grid edge for boundary testing'
    },
    singleCell: {
      name: 'Single Cell',
      grid: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
      ],
      description: 'Isolated cell that should die'
    },
    overcrowded: {
      name: 'Overcrowded',
      grid: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ],
      nextGeneration: [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1]
      ],
      description: 'All cells die except corners due to overcrowding'
    }
  }
};

// Helper function to create empty grid
export function createEmptyGrid(width, height) {
  return Array(height).fill(null).map(() => Array(width).fill(0));
}

// Helper function to place pattern on a grid at specific position
export function placePattern(grid, pattern, x, y) {
  const newGrid = grid.map(row => [...row]);
  for (let i = 0; i < pattern.length; i++) {
    for (let j = 0; j < pattern[i].length; j++) {
      if (y + i < grid.length && x + j < grid[0].length) {
        newGrid[y + i][x + j] = pattern[i][j];
      }
    }
  }
  return newGrid;
}

// Helper function to count alive cells
export function countAliveCells(grid) {
  return grid.reduce((sum, row) => 
    sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0
  );
}

// Helper function to compare grids
export function gridsEqual(grid1, grid2) {
  if (grid1.length !== grid2.length) return false;
  for (let i = 0; i < grid1.length; i++) {
    if (grid1[i].length !== grid2[i].length) return false;
    for (let j = 0; j < grid1[i].length; j++) {
      if (grid1[i][j] !== grid2[i][j]) return false;
    }
  }
  return true;
}

// Helper function to rotate a pattern 90 degrees clockwise
export function rotatePattern(pattern) {
  const rows = pattern.length;
  const cols = pattern[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotated[j][rows - 1 - i] = pattern[i][j];
    }
  }
  return rotated;
}

// Helper function to flip pattern horizontally
export function flipPatternH(pattern) {
  return pattern.map(row => [...row].reverse());
}

// Helper function to flip pattern vertically
export function flipPatternV(pattern) {
  return [...pattern].reverse();
}