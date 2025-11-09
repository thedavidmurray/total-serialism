#!/usr/bin/env node

/**
 * Simple test runner to verify Game of Life implementation
 */

import { GameOfLife } from './src/algorithms/cellular-automata/game-of-life.js';
import { CellularAutomataSVGExporter } from './src/exporters/cellular-automata-svg.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Running Game of Life implementation tests...\n');

// Test 1: Basic initialization
console.log('Test 1: Basic initialization');
const game = new GameOfLife(5, 5);
console.log('✓ Game initialized with 5x5 grid');
console.log(`  Grid dimensions: ${game.width}x${game.height}`);
console.log(`  Initial living cells: ${game.countLivingCells()}`);
console.log(`  Generation: ${game.generation}\n`);

// Test 2: Cell manipulation
console.log('Test 2: Cell manipulation');
game.setCell(2, 2, 1);
game.setCell(3, 2, 1);
game.setCell(4, 2, 1);
console.log('✓ Set 3 cells to alive');
console.log(`  Living cells: ${game.countLivingCells()}`);
console.log(`  Cell at (2,2): ${game.getCell(2, 2)}`);
console.log(`  Cell at (0,0): ${game.getCell(0, 0)}\n`);

// Test 3: Neighbor counting
console.log('Test 3: Neighbor counting');
const neighbors = game.countNeighbors(3, 2);
console.log(`✓ Neighbors of cell (3,2): ${neighbors}`);
console.log(`  Neighbors of cell (2,1): ${game.countNeighbors(2, 1)}`);
console.log(`  Neighbors of cell (3, 1): ${game.countNeighbors(3, 1)}\n`);

// Test 4: Evolution
console.log('Test 4: Evolution (Blinker pattern)');
const beforeGrid = game.getGrid();
console.log('Before:');
printGrid(beforeGrid);

game.step();
const afterGrid = game.getGrid();
console.log('\nAfter 1 step:');
printGrid(afterGrid);
console.log(`✓ Generation: ${game.generation}`);
console.log(`  Living cells: ${game.countLivingCells()}\n`);

// Test 5: Pattern loading (Glider)
console.log('Test 5: Pattern loading (Glider)');
const gliderGame = new GameOfLife(10, 10);
const gliderPattern = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1]
];
gliderGame.loadPattern(gliderPattern, 1, 1);
console.log('✓ Loaded glider pattern at (1,1)');
printGrid(gliderGame.getGrid());
console.log(`  Living cells: ${gliderGame.countLivingCells()}\n`);

// Test 6: SVG Export
console.log('Test 6: SVG Export');
const exporter = new CellularAutomataSVGExporter({
  cellSize: 20,
  margin: 10,
  renderStyle: 'squares'
});

const svgContent = exporter.export(gliderGame.getGrid(), 'test-output.svg');
console.log('✓ Generated SVG content');
console.log(`  SVG length: ${svgContent.length} characters`);

// Save test output
const outputDir = './test-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'glider-test.svg');
fs.writeFileSync(outputPath, svgContent);
console.log(`✓ Saved SVG to: ${outputPath}\n`);

// Test 7: Different render styles
console.log('Test 7: Different render styles');
const styles = ['squares', 'circles', 'dots', 'lines'];
styles.forEach(style => {
  const styleExporter = new CellularAutomataSVGExporter({
    cellSize: 15,
    margin: 10,
    renderStyle: style
  });
  
  const styleSvg = styleExporter.export(gliderGame.getGrid());
  const stylePath = path.join(outputDir, `glider-${style}.svg`);
  fs.writeFileSync(stylePath, styleSvg);
  console.log(`✓ Generated ${style} style: ${stylePath}`);
});

console.log('\n✅ All tests completed successfully!');

// Helper function to print grid
function printGrid(grid) {
  for (let y = 0; y < grid.length; y++) {
    let row = '  ';
    for (let x = 0; x < grid[y].length; x++) {
      row += grid[y][x] === 1 ? '█' : '·';
      row += ' ';
    }
    console.log(row);
  }
}