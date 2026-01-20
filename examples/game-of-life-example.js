/**
 * Example: Using the Game of Life implementation for pen plotter art
 * This shows how to create custom patterns and export them for plotting
 */

import { GameOfLife, GridBoundary } from '../src/algorithms/cellular-automata/game-of-life.js';
import { 
  CellularAutomataSVGExporter, 
  RenderStyle, 
  PlotterSettings 
} from '../src/exporters/cellular-automata-svg.js';

// Create a Game of Life instance
const game = new GameOfLife(50, 50, {
  boundary: GridBoundary.WRAP  // Toroidal topology
});

// Example 1: Create a custom pattern
const customPattern = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1]
];

// Load the pattern at position (20, 20)
game.loadPattern(customPattern, 20, 20);

// Create an SVG exporter with custom settings
const exporter = new CellularAutomataSVGExporter({
  ...PlotterSettings.AXIDRAW_V3,  // Use AxiDraw V3 presets
  cellSize: 6,                     // 6mm per cell
  renderStyle: RenderStyle.CIRCLES, // Use circles instead of squares
  strokeWidth: 0.3                  // Fine pen width
});

// Evolve the pattern for a few generations
console.log('Initial state:', game.countLivingCells(), 'living cells');

for (let i = 0; i < 10; i++) {
  game.step();
  console.log(`Generation ${i + 1}:`, game.countLivingCells(), 'living cells');
}

// Export to SVG
const svgContent = exporter.export(game.getGrid());

// Save to file (async)
const outputPath = './output/custom-pattern.svg';
await exporter.save(svgContent, outputPath);
console.log(`\nSaved to: ${outputPath}`);

// Example 2: Create a symmetrical pattern
const symmetricGame = new GameOfLife(40, 40);

// Create a symmetric seed
for (let i = 0; i < 5; i++) {
  const x = Math.floor(Math.random() * 10) + 15;
  const y = Math.floor(Math.random() * 10) + 15;
  
  // Set cell and its reflections
  symmetricGame.setCell(x, y, 1);
  symmetricGame.setCell(39 - x, y, 1);
  symmetricGame.setCell(x, 39 - y, 1);
  symmetricGame.setCell(39 - x, 39 - y, 1);
}

// Evolve to create interesting symmetric patterns
for (let i = 0; i < 20; i++) {
  symmetricGame.step();
}

// Export with a different style
const symmetricExporter = new CellularAutomataSVGExporter({
  cellSize: 5,
  renderStyle: RenderStyle.DOTS,
  strokeWidth: 0.5,
  margin: 15
});

await symmetricExporter.exportToFile(
  symmetricGame.getGrid(), 
  './output/symmetric-pattern.svg'
);

console.log('Symmetric pattern saved!');

// Example 3: Animation frames for plotting
const animGame = new GameOfLife(30, 30);

// Create a pulsar (period-3 oscillator)
const pulsar = [
  [0,0,1,1,1,0,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [0,0,1,1,1,0,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,0,0,0,1,1,1,0,0],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,0,0,0,1,1,1,0,0]
];

animGame.loadPattern(pulsar, 8, 8);

// Export animation frames
const frameExporter = new CellularAutomataSVGExporter({
  cellSize: 8,
  renderStyle: RenderStyle.SQUARES,
  optimizePaths: true
});

for (let frame = 0; frame < 3; frame++) {
  await frameExporter.exportToFile(
    animGame.getGrid(),
    `./output/pulsar-frame-${frame}.svg`
  );
  animGame.step();
}

console.log('Animation frames saved!');
console.log('\n✨ All examples completed successfully!');