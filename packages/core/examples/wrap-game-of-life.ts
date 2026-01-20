/**
 * Example: Wrapping the Game of Life algorithm with the new interface
 */

import { GameOfLife } from '../../../src/algorithms/cellular-automata/game-of-life.js';
import { createLegacyAdapter, createParametersFromObject } from '../src/adapters/legacy-adapter';
import type { Algorithm, ParameterDefinition, AlgorithmConfig, ParameterSet } from '../src/types';

// Define parameters for Game of Life
const gameOfLifeParameters: ParameterDefinition[] = [
  {
    name: 'gridWidth',
    label: 'Grid Width',
    type: 'number',
    defaultValue: 50,
    min: 10,
    max: 200,
    step: 10,
    description: 'Number of cells horizontally'
  },
  {
    name: 'gridHeight',
    label: 'Grid Height',
    type: 'number',
    defaultValue: 50,
    min: 10,
    max: 200,
    step: 10,
    description: 'Number of cells vertically'
  },
  {
    name: 'initialDensity',
    label: 'Initial Density',
    type: 'range',
    defaultValue: 0.3,
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Probability of cells being alive initially'
  },
  {
    name: 'generations',
    label: 'Generations',
    type: 'number',
    defaultValue: 50,
    min: 1,
    max: 500,
    step: 10,
    description: 'Number of generations to evolve'
  },
  {
    name: 'boundary',
    label: 'Boundary Condition',
    type: 'select',
    defaultValue: 'wrap',
    options: ['wrap', 'dead', 'alive'],
    description: 'How to handle cells at the edge'
  },
  {
    name: 'renderStyle',
    label: 'Render Style',
    type: 'select',
    defaultValue: 'squares',
    options: ['squares', 'circles', 'dots', 'lines'],
    description: 'How to render living cells'
  },
  {
    name: 'cellSize',
    label: 'Cell Size',
    type: 'number',
    defaultValue: 10,
    min: 2,
    max: 50,
    step: 2,
    description: 'Size of each cell in pixels'
  }
];

// Create the wrapped algorithm
export const wrappedGameOfLife: Algorithm = {
  id: 'game-of-life',
  name: 'Conway\'s Game of Life',
  description: 'The classic cellular automaton that simulates life and death of cells based on simple rules',
  category: 'cellular-automata',
  tags: ['cellular-automata', 'generative', 'grid', 'evolution'],
  author: {
    name: 'John Conway (implementation by pen-plotter-art)'
  },
  version: '1.0.0',
  parameters: gameOfLifeParameters,
  
  generate(params: ParameterSet, config: AlgorithmConfig) {
    // Create Game of Life instance
    const gol = new GameOfLife(params.gridWidth, params.gridHeight, {
      boundary: params.boundary
    });
    
    // Initialize with random cells
    gol.randomize(params.initialDensity);
    
    // Store all generations
    const allPaths = [];
    
    // Generate paths for initial state
    const initialPaths = renderGrid(gol.getGrid(), params, config);
    allPaths.push(...initialPaths);
    
    // Evolve through generations
    for (let i = 0; i < params.generations; i++) {
      gol.step();
      
      // Only render every 10th generation to avoid too many paths
      if (i % 10 === 0) {
        const paths = renderGrid(gol.getGrid(), params, config);
        // Offset each generation slightly for layered effect
        const offset = (i / 10) * 2;
        paths.forEach(path => {
          path.points = path.points.map(([x, y]) => [x + offset, y + offset]);
        });
        allPaths.push(...paths);
      }
    }
    
    return {
      paths: allPaths,
      metadata: {
        seed: params.seed || config.seed,
        timestamp: new Date().toISOString(),
        stats: {
          gridSize: `${params.gridWidth}x${params.gridHeight}`,
          generations: params.generations,
          initialDensity: params.initialDensity,
          finalLivingCells: gol.countLivingCells(),
          pathCount: allPaths.length
        }
      }
    };
  },
  
  validate(params: ParameterSet) {
    if (params.gridWidth * params.gridHeight > 10000) {
      return 'Grid size too large (max 10,000 cells)';
    }
    return true;
  }
};

/**
 * Render a grid based on the selected style
 */
function renderGrid(grid: number[][], params: ParameterSet, config: AlgorithmConfig) {
  const paths = [];
  const cellSize = params.cellSize;
  const margin = config.margin || 50;
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 1) {
        const cx = margin + x * cellSize;
        const cy = margin + y * cellSize;
        
        switch (params.renderStyle) {
          case 'squares':
            paths.push({
              points: [
                [cx, cy],
                [cx + cellSize, cy],
                [cx + cellSize, cy + cellSize],
                [cx, cy + cellSize],
                [cx, cy]
              ],
              style: { strokeWidth: 1 }
            });
            break;
            
          case 'circles':
            // Approximate circle with polygon
            const radius = cellSize / 2;
            const centerX = cx + radius;
            const centerY = cy + radius;
            const circlePoints = [];
            for (let angle = 0; angle <= 360; angle += 30) {
              const rad = (angle * Math.PI) / 180;
              circlePoints.push([
                centerX + Math.cos(rad) * radius,
                centerY + Math.sin(rad) * radius
              ]);
            }
            paths.push({
              points: circlePoints,
              style: { strokeWidth: 1 }
            });
            break;
            
          case 'dots':
            // Small filled circle
            const dotRadius = cellSize / 4;
            const dotCenterX = cx + cellSize / 2;
            const dotCenterY = cy + cellSize / 2;
            const dotPoints = [];
            for (let angle = 0; angle <= 360; angle += 45) {
              const rad = (angle * Math.PI) / 180;
              dotPoints.push([
                dotCenterX + Math.cos(rad) * dotRadius,
                dotCenterY + Math.sin(rad) * dotRadius
              ]);
            }
            paths.push({
              points: dotPoints,
              style: { strokeWidth: 0.5, fillColor: 'black' }
            });
            break;
            
          case 'lines':
            // Cross-hatch pattern
            paths.push({
              points: [
                [cx, cy],
                [cx + cellSize, cy + cellSize]
              ],
              style: { strokeWidth: 0.5 }
            });
            paths.push({
              points: [
                [cx + cellSize, cy],
                [cx, cy + cellSize]
              ],
              style: { strokeWidth: 0.5 }
            });
            break;
        }
      }
    }
  }
  
  return paths;
}

// Example of using the legacy adapter for a simpler approach
const adapter = createLegacyAdapter();

export const simpleWrappedGOL = adapter.wrapClass(GameOfLife, {
  id: 'game-of-life-simple',
  name: 'Game of Life (Simple Wrapper)',
  description: 'Simple wrapper around the Game of Life class',
  category: 'cellular-automata',
  parameters: createParametersFromObject({
    width: 50,
    height: 50,
    density: 0.3,
    generations: 100
  })
});