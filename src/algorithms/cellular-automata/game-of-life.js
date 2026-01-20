/**
 * Conway's Game of Life implementation for pen plotter art
 */

// Export boundary condition constants
export const GridBoundary = {
  WRAP: 'wrap',
  DEAD: 'dead', 
  ALIVE: 'alive'
};

// Helper function to create an empty grid
export function createGrid(width, height, fillValue = 0) {
  return Array(height).fill().map(() => Array(width).fill(fillValue));
}

// Standalone function to count neighbors
export function countNeighbors(grid, x, y, boundary = GridBoundary.DEAD) {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  let count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      let nx = x + dx;
      let ny = y + dy;
      
      // Handle boundary conditions
      if (boundary === GridBoundary.WRAP) {
        nx = (nx + width) % width;
        ny = (ny + height) % height;
      } else if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        if (boundary === GridBoundary.ALIVE) {
          count++;
        }
        continue;
      }
      
      count += grid[ny][nx];
    }
  }
  
  return count;
}

// Standalone function to apply rules
export function applyRules(currentState, neighbors) {
  if (currentState === 1) {
    return (neighbors === 2 || neighbors === 3) ? 1 : 0;
  } else {
    return neighbors === 3 ? 1 : 0;
  }
}

// Standalone function to compute next generation
export function nextGeneration(grid, boundary = GridBoundary.DEAD) {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const newGrid = createGrid(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors = countNeighbors(grid, x, y, boundary);
      newGrid[y][x] = applyRules(grid[y][x], neighbors);
    }
  }
  
  return newGrid;
}

export class GameOfLife {
  /**
   * Initialize the Game of Life
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {Object} options - Configuration options
   */
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.options = {
      boundary: GridBoundary.WRAP,
      ...options
    };
    
    // Initialize grid with all dead cells
    this.grid = Array(height).fill().map(() => Array(width).fill(0));
    this.generation = 0;
  }

  /**
   * Set the state of a specific cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} state - Cell state (0 or 1)
   */
  setCell(x, y, state) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new Error(`Cell coordinates (${x}, ${y}) are out of bounds`);
    }
    this.grid[y][x] = state;
  }

  /**
   * Get the state of a specific cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Cell state (0 or 1)
   */
  getCell(x, y) {
    // Handle boundary conditions
    if (this.options.boundary === GridBoundary.WRAP) {
      // Wrap around edges
      x = (x + this.width) % this.width;
      y = (y + this.height) % this.height;
    } else if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      // Outside grid
      return this.options.boundary === GridBoundary.ALIVE ? 1 : 0;
    }
    
    return this.grid[y][x];
  }

  /**
   * Count the number of living neighbors for a cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Number of living neighbors
   */
  countNeighbors(x, y) {
    let count = 0;
    
    // Check all 8 neighboring cells
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Skip the cell itself
        if (dx === 0 && dy === 0) continue;
        
        count += this.getCell(x + dx, y + dy);
      }
    }
    
    return count;
  }

  /**
   * Apply Conway's Game of Life rules to determine next state
   * @param {number} currentState - Current cell state
   * @param {number} neighbors - Number of living neighbors
   * @returns {number} Next cell state
   */
  applyRules(currentState, neighbors) {
    if (currentState === 1) {
      // Living cell
      // Dies if underpopulated (< 2) or overpopulated (> 3)
      return (neighbors === 2 || neighbors === 3) ? 1 : 0;
    } else {
      // Dead cell
      // Becomes alive if exactly 3 neighbors
      return neighbors === 3 ? 1 : 0;
    }
  }

  /**
   * Evolve the grid by one generation
   */
  step() {
    // Create new grid for next generation
    const newGrid = Array(this.height).fill().map(() => Array(this.width).fill(0));
    
    // Apply rules to each cell
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentState = this.grid[y][x];
        const neighbors = this.countNeighbors(x, y);
        newGrid[y][x] = this.applyRules(currentState, neighbors);
      }
    }
    
    this.grid = newGrid;
    this.generation++;
  }

  /**
   * Load a pattern into the grid
   * @param {Array<Array<number>>} pattern - 2D array of cell states
   * @param {number} offsetX - X offset for pattern placement
   * @param {number} offsetY - Y offset for pattern placement
   */
  loadPattern(pattern, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        this.setCell(x + offsetX, y + offsetY, pattern[y][x]);
      }
    }
  }

  /**
   * Get a snapshot of the current grid
   * @returns {Array<Array<number>>} Copy of the current grid
   */
  getGrid() {
    return this.grid.map(row => [...row]);
  }

  /**
   * Get the current generation number
   * @returns {number} Generation count
   */
  getGeneration() {
    return this.generation;
  }

  /**
   * Count the number of living cells
   * @returns {number} Number of living cells
   */
  countLivingCells() {
    return this.grid.reduce((total, row) => 
      total + row.reduce((rowTotal, cell) => rowTotal + cell, 0), 0
    );
  }

  /**
   * Clear the grid (set all cells to dead)
   */
  clear() {
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
    this.generation = 0;
  }

  /**
   * Randomize the grid
   * @param {number} density - Probability of a cell being alive (0-1)
   */
  randomize(density = 0.5) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = Math.random() < density ? 1 : 0;
      }
    }
  }

  /**
   * Alias for loadPattern to match test expectations
   */
  setPattern(pattern, offsetX = 0, offsetY = 0) {
    this.loadPattern(pattern, offsetX, offsetY);
  }

  /**
   * Alias for countLivingCells to match test expectations
   */
  countAliveCells() {
    return this.countLivingCells();
  }

  /**
   * Alias for step to match test expectations
   */
  nextGeneration() {
    this.step();
  }

  /**
   * Detect known patterns in the grid (simplified version)
   */
  detectPatterns() {
    const patterns = [];
    
    // Simple block detection (2x2 squares)
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        if (this.grid[y][x] === 1 && 
            this.grid[y][x+1] === 1 &&
            this.grid[y+1][x] === 1 &&
            this.grid[y+1][x+1] === 1) {
          patterns.push({
            type: 'block',
            position: { x, y }
          });
        }
      }
    }

    // Simple blinker detection (3 in a row)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width - 2; x++) {
        if (this.grid[y][x] === 1 && 
            this.grid[y][x+1] === 1 &&
            this.grid[y][x+2] === 1) {
          patterns.push({
            type: 'blinker',
            position: { x, y },
            orientation: 'horizontal'
          });
        }
      }
    }

    return patterns;
  }
}