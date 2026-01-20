/**
 * Integration tests for Cellular Automata SVG generation
 * Tests the conversion of CA grids to plotter-ready SVG files
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';
import {
  patterns,
  createEmptyGrid,
  placePattern
} from '../fixtures/game-of-life-patterns.js';

// Import the CA-to-SVG converter (to be created)
import {
  CellularAutomataSVGExporter,
  RenderStyle,
  LineOptimization,
  PlotterSettings
} from '../../src/exporters/cellular-automata-svg.js';

// Import Game of Life
import { GameOfLife } from '../../src/algorithms/cellular-automata/game-of-life.js';

describe('Cellular Automata SVG Generation', () => {
  let exporter;
  let tempDir;

  beforeEach(async () => {
    // Create temp directory for test outputs
    tempDir = path.join(process.cwd(), 'test-output', 'ca-svg-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });

    exporter = new CellularAutomataSVGExporter();
  });

  afterEach(async () => {
    // Clean up temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Basic SVG Generation', () => {
    it('should generate valid SVG from grid state', async () => {
      const grid = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
      ];

      const svg = exporter.generateSVG(grid);
      
      // Parse SVG to check validity
      const dom = new JSDOM(svg);
      const svgElement = dom.window.document.querySelector('svg');
      
      expect(svgElement).toBeTruthy();
      expect(svgElement.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    });

    it('should set correct dimensions based on grid and cell size', () => {
      const grid = createEmptyGrid(10, 20);
      const cellSize = 5; // mm
      
      const svg = exporter.generateSVG(grid, { cellSize });
      const dom = new JSDOM(svg);
      const svgElement = dom.window.document.querySelector('svg');
      
      expect(svgElement.getAttribute('width')).toBe('50mm');
      expect(svgElement.getAttribute('height')).toBe('100mm');
    });

    it('should include metadata in SVG', () => {
      const grid = createEmptyGrid(5, 5);
      const metadata = {
        pattern: 'glider',
        generation: 42,
        seed: 12345
      };
      
      const svg = exporter.generateSVG(grid, { metadata });
      
      expect(svg).toContain('<metadata>');
      expect(svg).toContain('generation="42"');
      expect(svg).toContain('pattern="glider"');
    });
  });

  describe('Render Styles', () => {
    const testGrid = [
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 1]
    ];

    it('should render cells as squares', () => {
      const svg = exporter.generateSVG(testGrid, {
        renderStyle: RenderStyle.SQUARES
      });
      
      const dom = new JSDOM(svg);
      const rects = dom.window.document.querySelectorAll('rect');
      
      expect(rects.length).toBe(5); // 5 alive cells
      
      // Check first cell position
      expect(rects[0].getAttribute('x')).toBe('0');
      expect(rects[0].getAttribute('y')).toBe('0');
    });

    it('should render cells as circles', () => {
      const svg = exporter.generateSVG(testGrid, {
        renderStyle: RenderStyle.CIRCLES
      });
      
      const dom = new JSDOM(svg);
      const circles = dom.window.document.querySelectorAll('circle');
      
      expect(circles.length).toBe(5); // 5 alive cells
    });

    it('should render cells as dots with configurable size', () => {
      const svg = exporter.generateSVG(testGrid, {
        renderStyle: RenderStyle.DOTS,
        dotRadius: 0.3 // 30% of cell size
      });
      
      const dom = new JSDOM(svg);
      const circles = dom.window.document.querySelectorAll('circle');
      
      expect(circles.length).toBe(5);
      expect(circles[0].getAttribute('r')).toBe('1.5'); // 0.3 * 5mm default cell size
    });

    it('should render grid lines', () => {
      const svg = exporter.generateSVG(testGrid, {
        renderStyle: RenderStyle.GRID_LINES,
        showGrid: true
      });
      
      const dom = new JSDOM(svg);
      const lines = dom.window.document.querySelectorAll('line');
      
      // Should have 4 horizontal + 4 vertical lines for 3x3 grid
      expect(lines.length).toBeGreaterThanOrEqual(8);
    });

    it('should render as connected paths for line art', () => {
      const svg = exporter.generateSVG(testGrid, {
        renderStyle: RenderStyle.LINE_ART
      });
      
      const dom = new JSDOM(svg);
      const paths = dom.window.document.querySelectorAll('path');
      
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].getAttribute('fill')).toBe('none');
      expect(paths[0].getAttribute('stroke')).toBeTruthy();
    });
  });

  describe('Line Optimization for Plotting', () => {
    it('should merge adjacent cells into continuous lines', () => {
      const grid = [
        [1, 1, 1, 1], // Horizontal line
        [0, 0, 0, 0],
        [1, 0, 0, 0], // Vertical line start
        [1, 0, 0, 0],
        [1, 0, 0, 0]
      ];

      const svg = exporter.generateSVG(grid, {
        renderStyle: RenderStyle.LINE_ART,
        optimization: LineOptimization.MERGE_ADJACENT
      });

      const dom = new JSDOM(svg);
      const paths = dom.window.document.querySelectorAll('path');
      
      // Should create 2 optimized paths instead of 7 individual cells
      expect(paths.length).toBe(2);
    });

    it('should optimize path order to minimize pen travel', () => {
      const grid = placePattern(createEmptyGrid(20, 20), patterns.spaceships.glider.phase1, 5, 5);
      
      const svg = exporter.generateSVG(grid, {
        renderStyle: RenderStyle.LINE_ART,
        optimization: LineOptimization.MINIMIZE_TRAVEL
      });

      const paths = exporter.getOptimizedPaths(grid);
      const totalTravel = exporter.calculateTotalPenTravel(paths);
      
      // Optimized travel should be less than naive approach
      const naivePaths = exporter.getOptimizedPaths(grid, { optimize: false });
      const naiveTravel = exporter.calculateTotalPenTravel(naivePaths);
      
      expect(totalTravel).toBeLessThan(naiveTravel);
    });

    it('should group nearby cells to reduce pen lifts', () => {
      const grid = [
        [1, 0, 1, 0, 1], // Scattered cells
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1]
      ];

      const paths = exporter.getOptimizedPaths(grid, {
        optimization: LineOptimization.GROUP_NEARBY,
        groupingDistance: 2 // cells
      });

      // Should group cells into fewer paths
      expect(paths.length).toBeLessThan(9); // Less than 9 individual cells
    });
  });

  describe('Export at Specific Generations', () => {
    it('should export single generation', async () => {
      const gol = new GameOfLife(20, 20);
      gol.setPattern(patterns.oscillators.blinker.phase1, 8, 8);
      
      const filepath = path.join(tempDir, 'blinker-gen0.svg');
      await exporter.exportGeneration(gol, 0, filepath);
      
      const exists = await fs.access(filepath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      const content = await fs.readFile(filepath, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('generation="0"');
    });

    it('should export multiple generations', async () => {
      const gol = new GameOfLife(20, 20);
      gol.setPattern(patterns.oscillators.blinker.phase1, 8, 8);
      
      const generations = [0, 1, 2, 5, 10];
      const files = await exporter.exportGenerations(gol, generations, tempDir);
      
      expect(files.length).toBe(5);
      
      for (let i = 0; i < files.length; i++) {
        const exists = await fs.access(files[i]).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should export generation range', async () => {
      const gol = new GameOfLife(20, 20);
      gol.setPattern(patterns.spaceships.glider.phase1, 5, 5);
      
      const files = await exporter.exportGenerationRange(gol, 0, 10, 2, tempDir);
      
      // Should export generations 0, 2, 4, 6, 8, 10
      expect(files.length).toBe(6);
    });

    it('should track pattern evolution in metadata', async () => {
      const gol = new GameOfLife(30, 30);
      gol.setPattern(patterns.methuselahs.rPentomino.grid, 15, 15);
      
      const files = await exporter.exportGenerationRange(gol, 0, 20, 5, tempDir, {
        trackEvolution: true
      });
      
      // Check that population changes are recorded
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        expect(content).toContain('population=');
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should validate cell size', () => {
      const grid = createEmptyGrid(5, 5);
      
      expect(() => {
        exporter.generateSVG(grid, { cellSize: -1 });
      }).toThrow('Cell size must be positive');
      
      expect(() => {
        exporter.generateSVG(grid, { cellSize: 0 });
      }).toThrow('Cell size must be positive');
    });

    it('should validate grid dimensions', () => {
      expect(() => {
        exporter.generateSVG([]);
      }).toThrow('Grid cannot be empty');
      
      expect(() => {
        exporter.generateSVG([[]]);
      }).toThrow('Grid cannot be empty');
    });

    it('should validate export paths', async () => {
      const gol = new GameOfLife(10, 10);
      
      await expect(
        exporter.exportGeneration(gol, 0, '/invalid/path/file.svg')
      ).rejects.toThrow();
    });

    it('should validate render style options', () => {
      const grid = createEmptyGrid(5, 5);
      
      expect(() => {
        exporter.generateSVG(grid, { renderStyle: 'invalid' });
      }).toThrow('Invalid render style');
    });
  });

  describe('Plotter Settings', () => {
    it('should apply plotter-specific settings', () => {
      const grid = createEmptyGrid(10, 10);
      grid[5][5] = 1;
      
      const plotterSettings = new PlotterSettings({
        penWidth: 0.5, // mm
        paperSize: 'A4',
        margins: { top: 10, right: 10, bottom: 10, left: 10 }, // mm
        orientation: 'landscape'
      });
      
      const svg = exporter.generateSVG(grid, { plotterSettings });
      const dom = new JSDOM(svg);
      const svgElement = dom.window.document.querySelector('svg');
      
      // Check A4 landscape dimensions (297mm x 210mm)
      expect(svgElement.getAttribute('width')).toBe('297mm');
      expect(svgElement.getAttribute('height')).toBe('210mm');
      
      // Check stroke width
      const paths = dom.window.document.querySelectorAll('path, line, rect, circle');
      paths.forEach(path => {
        expect(path.getAttribute('stroke-width')).toBe('0.5');
      });
    });

    it('should center content on page with margins', () => {
      const grid = createEmptyGrid(5, 5);
      placePattern(grid, patterns.stillLifes.block.grid, 1, 1);
      
      const plotterSettings = new PlotterSettings({
        paperSize: { width: 200, height: 200 }, // mm
        margins: { all: 20 }, // mm
        centerContent: true
      });
      
      const svg = exporter.generateSVG(grid, { 
        cellSize: 10,
        plotterSettings 
      });
      
      const dom = new JSDOM(svg);
      const contentGroup = dom.window.document.querySelector('g.content');
      const transform = contentGroup.getAttribute('transform');
      
      // Content should be centered in 160x160 area (200 - 2*20)
      expect(transform).toContain('translate');
    });

    it('should add registration marks for multi-layer plots', () => {
      const grid = createEmptyGrid(10, 10);
      
      const svg = exporter.generateSVG(grid, {
        plotterSettings: {
          registrationMarks: true
        }
      });
      
      const dom = new JSDOM(svg);
      const marks = dom.window.document.querySelectorAll('.registration-mark');
      
      expect(marks.length).toBe(4); // Corner marks
    });
  });

  describe('Advanced Features', () => {
    it('should support multi-state cellular automata', () => {
      // Grid with multiple states (0, 1, 2, 3)
      const multiStateGrid = [
        [0, 1, 2, 3],
        [1, 2, 3, 0],
        [2, 3, 0, 1],
        [3, 0, 1, 2]
      ];

      const svg = exporter.generateSVG(multiStateGrid, {
        renderStyle: RenderStyle.MULTI_STATE,
        stateStyles: {
          0: { visible: false },
          1: { pattern: 'dots', density: 0.3 },
          2: { pattern: 'lines', angle: 45 },
          3: { pattern: 'crosshatch' }
        }
      });

      const dom = new JSDOM(svg);
      const patterns = dom.window.document.querySelectorAll('pattern');
      
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should export animation data for oscillators', async () => {
      const gol = new GameOfLife(20, 20);
      gol.setPattern(patterns.oscillators.blinker.phase1, 8, 8);
      
      const animationData = await exporter.exportAnimation(gol, {
        frames: 10,
        format: 'svg-animation'
      });
      
      expect(animationData.frames).toBe(10);
      expect(animationData.period).toBe(2); // Blinker period
    });

    it('should detect and highlight specific patterns', () => {
      const gol = new GameOfLife(30, 30);
      gol.setPattern(patterns.stillLifes.block.grid, 5, 5);
      gol.setPattern(patterns.oscillators.blinker.phase1, 15, 15);
      gol.setPattern(patterns.spaceships.glider.phase1, 20, 20);
      
      const svg = exporter.generateSVG(gol.getGrid(), {
        highlightPatterns: true,
        patternColors: {
          'still-life': '#ff0000',
          'oscillator': '#00ff00',
          'spaceship': '#0000ff'
        }
      });
      
      const dom = new JSDOM(svg);
      const groups = dom.window.document.querySelectorAll('g.pattern-highlight');
      
      expect(groups.length).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should handle large grids efficiently', async () => {
      const largeGrid = createEmptyGrid(500, 500);
      // Add some random cells
      for (let i = 0; i < 1000; i++) {
        const x = Math.floor(Math.random() * 500);
        const y = Math.floor(Math.random() * 500);
        largeGrid[y][x] = 1;
      }
      
      const start = performance.now();
      const svg = exporter.generateSVG(largeGrid, {
        optimization: LineOptimization.FAST
      });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
      expect(svg.length).toBeGreaterThan(0);
    });

    it('should use streaming for very large exports', async () => {
      const gol = new GameOfLife(200, 200);
      gol.randomize(0.3);
      
      const outputPath = path.join(tempDir, 'large-export.svg');
      
      // Export with streaming
      await exporter.exportGenerationStream(gol, 0, outputPath, {
        streaming: true,
        chunkSize: 50 // Process in 50x50 chunks
      });
      
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});