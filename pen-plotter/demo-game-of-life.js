#!/usr/bin/env node

/**
 * Demo: Conway's Game of Life patterns for pen plotting
 * Generates various classic patterns as SVG files
 */

import { GameOfLife } from './src/algorithms/cellular-automata/game-of-life.js';
import { CellularAutomataSVGExporter, RenderStyle } from './src/exporters/cellular-automata-svg.js';
import { patterns } from './tests/fixtures/game-of-life-patterns.js';
import fs from 'fs';
import path from 'path';

// Ensure output directory exists
const outputDir = './output/game-of-life';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Conway\'s Game of Life - Pen Plotter Art Demo\n');

// Demo 1: Still Life Gallery
console.log('1. Still Life Gallery');
const stillLifeGame = new GameOfLife(40, 40);
const stillLifeExporter = new CellularAutomataSVGExporter({
  cellSize: 10,
  margin: 20,
  renderStyle: RenderStyle.SQUARES
});

// Place various still life patterns
stillLifeGame.loadPattern(patterns.stillLifes.block.grid, 5, 5);
stillLifeGame.loadPattern(patterns.stillLifes.beehive.grid, 15, 5);
stillLifeGame.loadPattern(patterns.stillLifes.loaf.grid, 25, 5);
stillLifeGame.loadPattern(patterns.stillLifes.boat.grid, 5, 15);
stillLifeGame.loadPattern(patterns.stillLifes.tub.grid, 15, 15);

const stillLifeSvg = stillLifeExporter.export(stillLifeGame.getGrid());
fs.writeFileSync(path.join(outputDir, 'still-lifes.svg'), stillLifeSvg);
console.log('  ✓ Generated: still-lifes.svg');

// Demo 2: Oscillator Animation Frames
console.log('\n2. Oscillator Animation');
const oscillatorGame = new GameOfLife(20, 20);

// Blinker animation
const blinkerExporter = new CellularAutomataSVGExporter({
  cellSize: 15,
  margin: 10,
  renderStyle: RenderStyle.CIRCLES
});

oscillatorGame.loadPattern(patterns.oscillators.blinker.phase1, 8, 8);
for (let i = 0; i < 4; i++) {
  const svg = blinkerExporter.export(oscillatorGame.getGrid());
  fs.writeFileSync(path.join(outputDir, `blinker-phase-${i}.svg`), svg);
  oscillatorGame.step();
}
console.log('  ✓ Generated: blinker animation (4 frames)');

// Demo 3: Glider Evolution
console.log('\n3. Glider Evolution');
const gliderGame = new GameOfLife(30, 30);
const gliderExporter = new CellularAutomataSVGExporter({
  cellSize: 8,
  margin: 10,
  renderStyle: RenderStyle.DOTS
});

gliderGame.loadPattern(patterns.spaceships.glider.phase1, 5, 5);
for (let i = 0; i < 12; i++) {
  const svg = gliderExporter.export(gliderGame.getGrid());
  fs.writeFileSync(path.join(outputDir, `glider-gen-${i}.svg`), svg);
  gliderGame.step();
}
console.log('  ✓ Generated: glider evolution (12 generations)');

// Demo 4: R-pentomino Chaos
console.log('\n4. R-pentomino Evolution');
const rpentGame = new GameOfLife(60, 60);
const rpentExporter = new CellularAutomataSVGExporter({
  cellSize: 5,
  margin: 10,
  renderStyle: RenderStyle.SQUARES,
  optimizePaths: true
});

rpentGame.loadPattern(patterns.methuselahs.rPentomino.grid, 28, 28);

// Generate key generations
const keyGenerations = [0, 10, 50, 100, 200, 500];
for (let gen = 0; gen <= 500; gen++) {
  if (keyGenerations.includes(gen)) {
    const svg = rpentExporter.export(rpentGame.getGrid());
    fs.writeFileSync(path.join(outputDir, `rpentomino-gen-${gen}.svg`), svg);
    console.log(`  ✓ Generated: rpentomino-gen-${gen}.svg (${rpentGame.countLivingCells()} cells)`);
  }
  rpentGame.step();
}

// Demo 5: Different Render Styles
console.log('\n5. Render Style Comparison');
const styleGame = new GameOfLife(25, 25);

// Create an interesting pattern
const customPattern = [
  [0,1,1,0,0,0,1,1,0],
  [0,1,1,0,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,0],
  [1,1,1,0,0,0,1,1,1],
  [0,1,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,1,0,1,0,0,0],
  [0,0,0,1,1,1,0,0,0]
];

styleGame.loadPattern(customPattern, 8, 8);

const styles = [
  { name: 'squares', style: RenderStyle.SQUARES },
  { name: 'circles', style: RenderStyle.CIRCLES },
  { name: 'dots', style: RenderStyle.DOTS },
  { name: 'lines', style: RenderStyle.LINES }
];

for (const { name, style } of styles) {
  const exporter = new CellularAutomataSVGExporter({
    cellSize: 12,
    margin: 15,
    renderStyle: style
  });
  const svg = exporter.export(styleGame.getGrid());
  fs.writeFileSync(path.join(outputDir, `style-comparison-${name}.svg`), svg);
  console.log(`  ✓ Generated: style-comparison-${name}.svg`);
}

// Demo 6: Large-scale Random Pattern
console.log('\n6. Large Random Pattern');
const randomGame = new GameOfLife(100, 100);
randomGame.randomize(0.3); // 30% density

const randomExporter = new CellularAutomataSVGExporter({
  cellSize: 3,
  margin: 10,
  renderStyle: RenderStyle.SQUARES,
  optimizePaths: true,
  strokeWidth: 0.5
});

// Evolve for a few generations to create interesting patterns
for (let i = 0; i < 5; i++) {
  randomGame.step();
}

const randomSvg = randomExporter.export(randomGame.getGrid());
fs.writeFileSync(path.join(outputDir, 'random-evolved.svg'), randomSvg);
console.log(`  ✓ Generated: random-evolved.svg (${randomGame.countLivingCells()} cells)`);

// Create an index HTML file to view all outputs
const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Game of Life - Pen Plotter Art</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .item { border: 1px solid #ccc; padding: 10px; text-align: center; }
    .item img { max-width: 100%; height: auto; border: 1px solid #eee; }
    h2 { margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Conway's Game of Life - Pen Plotter Art Gallery</h1>
  
  <h2>Still Life Patterns</h2>
  <div class="gallery">
    <div class="item">
      <img src="still-lifes.svg" alt="Still Lifes">
      <p>Collection of still life patterns</p>
    </div>
  </div>

  <h2>Oscillators</h2>
  <div class="gallery">
    ${[0,1,2,3].map(i => `
    <div class="item">
      <img src="blinker-phase-${i}.svg" alt="Blinker Phase ${i}">
      <p>Blinker Phase ${i}</p>
    </div>`).join('')}
  </div>

  <h2>Glider Evolution</h2>
  <div class="gallery">
    ${[0,3,6,9].map(i => `
    <div class="item">
      <img src="glider-gen-${i}.svg" alt="Glider Generation ${i}">
      <p>Generation ${i}</p>
    </div>`).join('')}
  </div>

  <h2>R-pentomino Chaos</h2>
  <div class="gallery">
    ${keyGenerations.map(gen => `
    <div class="item">
      <img src="rpentomino-gen-${gen}.svg" alt="R-pentomino Generation ${gen}">
      <p>Generation ${gen}</p>
    </div>`).join('')}
  </div>

  <h2>Render Styles</h2>
  <div class="gallery">
    ${styles.map(({name}) => `
    <div class="item">
      <img src="style-comparison-${name}.svg" alt="${name} style">
      <p>${name.charAt(0).toUpperCase() + name.slice(1)} Style</p>
    </div>`).join('')}
  </div>

  <h2>Random Evolution</h2>
  <div class="gallery">
    <div class="item">
      <img src="random-evolved.svg" alt="Random Pattern">
      <p>Evolved random pattern (30% initial density)</p>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
console.log('\n✅ Demo complete! View results in: output/game-of-life/index.html');
console.log('\n📄 SVG files are ready for pen plotting!');