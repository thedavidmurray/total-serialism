/**
 * Unit tests for Game of Life cellular automaton
 * Following Conway's rules:
 * 1. Any live cell with 2-3 live neighbors survives
 * 2. Any dead cell with exactly 3 live neighbors becomes alive
 * 3. All other live cells die, all other dead cells stay dead
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  patterns,
  createEmptyGrid,
  placePattern,
  countAliveCells,
  gridsEqual,
  rotatePattern,
  flipPatternH
} from '../../fixtures/game-of-life-patterns.js';

// Import the Game of Life implementation (to be created)
import {
  GameOfLife,
  countNeighbors,
  applyRules,
  nextGeneration,
  createGrid,
  GridBoundary
} from '../../../src/algorithms/cellular-automata/game-of-life.js';

describe('Game of Life - Cell State Transitions', () => {
  describe('countNeighbors', () => {
    it('should count neighbors correctly for center cell', () => {
      const grid = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
      ];
      expect(countNeighbors(grid, 1, 1)).toBe(8);
    });

    it('should count neighbors correctly for corner cells', () => {
      const grid = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0]
      ];
      expect(countNeighbors(grid, 0, 0)).toBe(2); // top-left
      expect(countNeighbors(grid, 0, 2)).toBe(2); // top-right
      expect(countNeighbors(grid, 2, 0)).toBe(2); // bottom-left
      expect(countNeighbors(grid, 2, 2)).toBe(2); // bottom-right
    });

    it('should count neighbors correctly for edge cells', () => {
      const grid = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ];
      expect(countNeighbors(grid, 0, 1)).toBe(3); // top edge
      expect(countNeighbors(grid, 1, 0)).toBe(3); // left edge
      expect(countNeighbors(grid, 1, 2)).toBe(3); // right edge
      expect(countNeighbors(grid, 2, 1)).toBe(3); // bottom edge
    });

    it('should handle empty grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      expect(countNeighbors(grid, 1, 1)).toBe(0);
    });
  });

  describe('applyRules', () => {
    it('should kill live cell with fewer than 2 neighbors (underpopulation)', () => {
      expect(applyRules(1, 0)).toBe(0);
      expect(applyRules(1, 1)).toBe(0);
    });

    it('should keep live cell with 2-3 neighbors alive (survival)', () => {
      expect(applyRules(1, 2)).toBe(1);
      expect(applyRules(1, 3)).toBe(1);
    });

    it('should kill live cell with more than 3 neighbors (overpopulation)', () => {
      expect(applyRules(1, 4)).toBe(0);
      expect(applyRules(1, 5)).toBe(0);
      expect(applyRules(1, 6)).toBe(0);
      expect(applyRules(1, 7)).toBe(0);
      expect(applyRules(1, 8)).toBe(0);
    });

    it('should birth dead cell with exactly 3 neighbors (reproduction)', () => {
      expect(applyRules(0, 3)).toBe(1);
    });

    it('should keep dead cell dead with non-3 neighbors', () => {
      expect(applyRules(0, 0)).toBe(0);
      expect(applyRules(0, 1)).toBe(0);
      expect(applyRules(0, 2)).toBe(0);
      expect(applyRules(0, 4)).toBe(0);
      expect(applyRules(0, 5)).toBe(0);
      expect(applyRules(0, 6)).toBe(0);
      expect(applyRules(0, 7)).toBe(0);
      expect(applyRules(0, 8)).toBe(0);
    });
  });

  describe('nextGeneration', () => {
    it('should correctly evolve a blinker', () => {
      const blinker = patterns.oscillators.blinker;
      const gen1 = nextGeneration(blinker.phase1);
      expect(gridsEqual(gen1, blinker.phase2)).toBe(true);
      
      const gen2 = nextGeneration(gen1);
      expect(gridsEqual(gen2, blinker.phase1)).toBe(true);
    });

    it('should handle edge case patterns', () => {
      const overcrowded = patterns.edgeCases.overcrowded;
      const nextGen = nextGeneration(overcrowded.grid);
      expect(gridsEqual(nextGen, overcrowded.nextGeneration)).toBe(true);
    });

    it('should kill isolated cells', () => {
      const singleCell = patterns.edgeCases.singleCell;
      const nextGen = nextGeneration(singleCell.grid);
      const expectedDead = createEmptyGrid(3, 3);
      expect(gridsEqual(nextGen, expectedDead)).toBe(true);
    });
  });
});

describe('Game of Life - Known Patterns', () => {
  describe('Still Lifes', () => {
    it('should keep block pattern stable', () => {
      const block = patterns.stillLifes.block;
      const nextGen = nextGeneration(block.grid);
      expect(gridsEqual(nextGen, block.grid)).toBe(true);
    });

    it('should keep beehive pattern stable', () => {
      const beehive = patterns.stillLifes.beehive;
      const nextGen = nextGeneration(beehive.grid);
      expect(gridsEqual(nextGen, beehive.grid)).toBe(true);
    });

    it('should keep loaf pattern stable', () => {
      const loaf = patterns.stillLifes.loaf;
      const nextGen = nextGeneration(loaf.grid);
      expect(gridsEqual(nextGen, loaf.grid)).toBe(true);
    });

    it('should keep boat pattern stable', () => {
      const boat = patterns.stillLifes.boat;
      const nextGen = nextGeneration(boat.grid);
      expect(gridsEqual(nextGen, boat.grid)).toBe(true);
    });

    it('should keep tub pattern stable', () => {
      const tub = patterns.stillLifes.tub;
      const nextGen = nextGeneration(tub.grid);
      expect(gridsEqual(nextGen, tub.grid)).toBe(true);
    });
  });

  describe('Oscillators', () => {
    it('should oscillate blinker with period 2', () => {
      const blinker = patterns.oscillators.blinker;
      let grid = blinker.phase1;
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, blinker.phase2)).toBe(true);
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, blinker.phase1)).toBe(true);
    });

    it('should oscillate toad with period 2', () => {
      const toad = patterns.oscillators.toad;
      let grid = toad.phase1;
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, toad.phase2)).toBe(true);
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, toad.phase1)).toBe(true);
    });

    it('should oscillate beacon with period 2', () => {
      const beacon = patterns.oscillators.beacon;
      let grid = beacon.phase1;
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, beacon.phase2)).toBe(true);
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, beacon.phase1)).toBe(true);
    });

    it('should oscillate pulsar with period 3', () => {
      const pulsar = patterns.oscillators.pulsar;
      let grid = pulsar.phase1;
      
      // Evolve for 3 generations to complete one period
      for (let i = 0; i < pulsar.period; i++) {
        grid = nextGeneration(grid);
      }
      
      expect(gridsEqual(grid, pulsar.phase1)).toBe(true);
    });
  });

  describe('Spaceships', () => {
    it('should move glider diagonally after 4 generations', () => {
      const glider = patterns.spaceships.glider;
      let grid = createEmptyGrid(10, 10);
      grid = placePattern(grid, glider.phase1, 1, 1);
      
      // After 4 generations, glider should have moved diagonally
      for (let i = 0; i < 4; i++) {
        grid = nextGeneration(grid);
      }
      
      // Check that glider has moved (position shifted by 1,1)
      const cellCount = countAliveCells(grid);
      expect(cellCount).toBe(5); // Glider always has 5 cells
      
      // The glider pattern should appear at position (2,2)
      const expectedGrid = createEmptyGrid(10, 10);
      const expectedPattern = placePattern(expectedGrid, glider.phase1, 2, 2);
      expect(gridsEqual(grid, expectedPattern)).toBe(true);
    });

    it('should preserve glider through all 4 phases', () => {
      const glider = patterns.spaceships.glider;
      let grid = glider.phase1;
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, glider.phase2)).toBe(true);
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, glider.phase3)).toBe(true);
      
      grid = nextGeneration(grid);
      expect(gridsEqual(grid, glider.phase4)).toBe(true);
    });
  });

  describe('Methuselahs', () => {
    it('should evolve R-pentomino for many generations', () => {
      const rpent = patterns.methuselahs.rPentomino;
      let grid = createEmptyGrid(100, 100); // Need larger grid
      grid = placePattern(grid, rpent.grid, 48, 48);
      
      const initialCells = countAliveCells(grid);
      expect(initialCells).toBe(5);
      
      // Evolve for 10 generations and check it's still changing
      for (let i = 0; i < 10; i++) {
        grid = nextGeneration(grid);
      }
      
      const cellsAfter10 = countAliveCells(grid);
      expect(cellsAfter10).toBeGreaterThan(initialCells);
    });

    it('should make diehard pattern eventually die', () => {
      const diehard = patterns.methuselahs.diehard;
      let grid = createEmptyGrid(50, 50);
      grid = placePattern(grid, diehard.grid, 20, 20);
      
      // Evolve past its lifespan
      for (let i = 0; i < diehard.lifespan + 10; i++) {
        grid = nextGeneration(grid);
      }
      
      expect(countAliveCells(grid)).toBe(0);
    });
  });
});

describe('Game of Life - Boundary Conditions', () => {
  let gol;

  describe('Fixed boundary (cells outside grid are dead)', () => {
    beforeEach(() => {
      gol = new GameOfLife(10, 10, GridBoundary.FIXED);
    });

    it('should treat cells outside grid as dead', () => {
      gol.setCell(0, 0, 1);
      gol.setCell(0, 1, 1);
      gol.setCell(1, 0, 1);
      
      // Corner cell (0,0) has only 3 neighbors, one of which is alive
      const neighbors = gol.countNeighbors(0, 0);
      expect(neighbors).toBe(2);
    });

    it('should not allow patterns to wrap around edges', () => {
      // Place a glider at the edge
      const glider = patterns.spaceships.glider;
      gol.setPattern(glider.phase1, 8, 8);
      
      // Evolve and check it doesn't wrap
      for (let i = 0; i < 10; i++) {
        gol.nextGeneration();
      }
      
      // Pattern should have moved off the edge, not wrapped
      expect(gol.countAliveCells()).toBeLessThan(5);
    });
  });

  describe('Toroidal boundary (wrapping edges)', () => {
    beforeEach(() => {
      gol = new GameOfLife(10, 10, GridBoundary.TOROIDAL);
    });

    it('should wrap neighbors around edges', () => {
      // Create a horizontal blinker at the top edge
      gol.setCell(0, 0, 1);
      gol.setCell(0, 1, 1);
      gol.setCell(0, 2, 1);
      
      gol.nextGeneration();
      
      // Should create vertical blinker wrapping around
      expect(gol.getCell(9, 1)).toBe(1); // Wrapped to bottom
      expect(gol.getCell(0, 1)).toBe(1);
      expect(gol.getCell(1, 1)).toBe(1);
    });

    it('should allow gliders to wrap around edges', () => {
      const glider = patterns.spaceships.glider;
      gol.setPattern(glider.phase1, 8, 8);
      
      // Evolve until glider wraps around
      const initialCount = gol.countAliveCells();
      for (let i = 0; i < 20; i++) {
        gol.nextGeneration();
      }
      
      // Glider should still exist (wrapped around)
      expect(gol.countAliveCells()).toBe(initialCount);
    });

    it('should correctly count corner neighbors with wrapping', () => {
      // Set cells that would be neighbors if wrapped
      gol.setCell(0, 0, 1);    // target cell
      gol.setCell(9, 9, 1);    // diagonal wrap
      gol.setCell(0, 9, 1);    // horizontal wrap
      gol.setCell(9, 0, 1);    // vertical wrap
      
      const neighbors = gol.countNeighbors(0, 0);
      expect(neighbors).toBe(3);
    });
  });

  describe('Reflective boundary (mirror at edges)', () => {
    beforeEach(() => {
      gol = new GameOfLife(10, 10, GridBoundary.REFLECTIVE);
    });

    it('should mirror cells at boundaries', () => {
      // Place cells at edge
      gol.setCell(0, 0, 1);
      gol.setCell(0, 1, 1);
      
      // Count neighbors with reflection
      const neighbors = gol.countNeighbors(0, 0);
      expect(neighbors).toBeGreaterThan(1); // Should see reflected neighbors
    });
  });
});

describe('Game of Life - Pattern Library', () => {
  let gol;

  beforeEach(() => {
    gol = new GameOfLife(50, 50);
  });

  describe('Pattern placement and manipulation', () => {
    it('should place patterns at specified coordinates', () => {
      const block = patterns.stillLifes.block.grid;
      gol.setPattern(block, 10, 10);
      
      expect(gol.getCell(11, 11)).toBe(1);
      expect(gol.getCell(11, 12)).toBe(1);
      expect(gol.getCell(12, 11)).toBe(1);
      expect(gol.getCell(12, 12)).toBe(1);
    });

    it('should rotate patterns', () => {
      const glider = patterns.spaceships.glider.phase1;
      const rotated = rotatePattern(glider);
      
      gol.setPattern(rotated, 10, 10);
      expect(gol.countAliveCells()).toBe(5);
    });

    it('should flip patterns horizontally', () => {
      const glider = patterns.spaceships.glider.phase1;
      const flipped = flipPatternH(glider);
      
      gol.setPattern(flipped, 10, 10);
      expect(gol.countAliveCells()).toBe(5);
    });

    it('should clear the grid', () => {
      gol.setPattern(patterns.stillLifes.block.grid, 10, 10);
      expect(gol.countAliveCells()).toBeGreaterThan(0);
      
      gol.clear();
      expect(gol.countAliveCells()).toBe(0);
    });

    it('should randomize the grid with density control', () => {
      gol.randomize(0.3); // 30% density
      const totalCells = 50 * 50;
      const aliveCells = gol.countAliveCells();
      
      // Should be roughly 30% alive (with some variance)
      expect(aliveCells).toBeGreaterThan(totalCells * 0.2);
      expect(aliveCells).toBeLessThan(totalCells * 0.4);
    });
  });

  describe('Pattern detection', () => {
    it('should detect still life patterns', () => {
      gol.setPattern(patterns.stillLifes.block.grid, 10, 10);
      const detected = gol.detectPatterns();
      
      expect(detected).toContainEqual({
        type: 'still-life',
        name: 'block',
        position: { x: 10, y: 10 }
      });
    });

    it('should detect oscillator patterns', () => {
      gol.setPattern(patterns.oscillators.blinker.phase1, 20, 20);
      const detected = gol.detectPatterns();
      
      expect(detected).toContainEqual({
        type: 'oscillator',
        name: 'blinker',
        period: 2,
        position: { x: 20, y: 20 }
      });
    });
  });
});

describe('Game of Life - Performance and Edge Cases', () => {
  it('should handle large grids efficiently', () => {
    const gol = new GameOfLife(1000, 1000);
    gol.randomize(0.1);
    
    const start = performance.now();
    gol.nextGeneration();
    const end = performance.now();
    
    // Should complete in reasonable time (< 100ms for 1M cells)
    expect(end - start).toBeLessThan(100);
  });

  it('should handle empty grids', () => {
    const gol = new GameOfLife(10, 10);
    gol.nextGeneration();
    
    expect(gol.countAliveCells()).toBe(0);
  });

  it('should handle fully populated grids', () => {
    const gol = new GameOfLife(5, 5);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        gol.setCell(i, j, 1);
      }
    }
    
    gol.nextGeneration();
    
    // Only corners should survive (3 neighbors each)
    expect(gol.getCell(0, 0)).toBe(1);
    expect(gol.getCell(0, 4)).toBe(1);
    expect(gol.getCell(4, 0)).toBe(1);
    expect(gol.getCell(4, 4)).toBe(1);
    
    // Center cells should die (8 neighbors)
    expect(gol.getCell(2, 2)).toBe(0);
  });

  it('should maintain pattern integrity over many generations', () => {
    const gol = new GameOfLife(20, 20);
    gol.setPattern(patterns.stillLifes.block.grid, 8, 8);
    
    const initialCount = gol.countAliveCells();
    
    // Run for 100 generations
    for (let i = 0; i < 100; i++) {
      gol.nextGeneration();
    }
    
    // Block should remain stable
    expect(gol.countAliveCells()).toBe(initialCount);
  });

  it('should handle invalid inputs gracefully', () => {
    const gol = new GameOfLife(10, 10);
    
    // Out of bounds
    expect(() => gol.setCell(-1, 0, 1)).toThrow();
    expect(() => gol.setCell(0, 10, 1)).toThrow();
    expect(() => gol.setCell(10, 0, 1)).toThrow();
    
    // Invalid cell values
    expect(() => gol.setCell(0, 0, 2)).toThrow();
    expect(() => gol.setCell(0, 0, -1)).toThrow();
  });
});