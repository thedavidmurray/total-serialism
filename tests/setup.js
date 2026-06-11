/**
 * Jest test setup file
 * Configure global test utilities and mocks
 */

// jsdom test environment does not provide TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add custom matchers for grid comparison
expect.extend({
  toEqualGrid(received, expected) {
    const pass = this.equals(received, expected);
    if (pass) {
      return {
        message: () => `expected grids not to be equal`,
        pass: true
      };
    } else {
      return {
        message: () => {
          const diff = [];
          for (let i = 0; i < Math.max(received.length, expected.length); i++) {
            for (let j = 0; j < Math.max(received[0]?.length || 0, expected[0]?.length || 0); j++) {
              const r = received[i]?.[j] ?? undefined;
              const e = expected[i]?.[j] ?? undefined;
              if (r !== e) {
                diff.push(`[${i},${j}]: ${r} !== ${e}`);
              }
            }
          }
          return `expected grids to be equal\n\nDifferences:\n${diff.join('\n')}`;
        },
        pass: false
      };
    }
  },

  toHavePattern(grid, pattern, x, y) {
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;
    
    let matches = true;
    const mismatches = [];
    
    for (let i = 0; i < patternHeight; i++) {
      for (let j = 0; j < patternWidth; j++) {
        const gridCell = grid[y + i]?.[x + j] ?? 0;
        const patternCell = pattern[i][j];
        if (gridCell !== patternCell) {
          matches = false;
          mismatches.push(`[${y + i},${x + j}]: ${gridCell} !== ${patternCell}`);
        }
      }
    }
    
    if (matches) {
      return {
        message: () => `expected grid not to have pattern at position (${x}, ${y})`,
        pass: true
      };
    } else {
      return {
        message: () => `expected grid to have pattern at position (${x}, ${y})\n\nMismatches:\n${mismatches.join('\n')}`,
        pass: false
      };
    }
  },

  toBeStablePattern(grid, nextGrid) {
    const pass = this.equals(grid, nextGrid);
    if (pass) {
      return {
        message: () => `expected pattern not to be stable`,
        pass: true
      };
    } else {
      return {
        message: () => `expected pattern to be stable (unchanged after one generation)`,
        pass: false
      };
    }
  }
});

// Mock performance.now() if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Helper function to visualize grids in test output
global.visualizeGrid = (grid, title = 'Grid') => {
  console.log(`\n${title}:`);
  console.log('┌' + '─'.repeat(grid[0].length * 2 + 1) + '┐');
  for (const row of grid) {
    console.log('│ ' + row.map(cell => cell ? '■' : '·').join(' ') + ' │');
  }
  console.log('└' + '─'.repeat(grid[0].length * 2 + 1) + '┘');
};

// Helper to create test directories
import fs from 'fs/promises';
import path from 'path';

global.createTestDir = async (name) => {
  const testDir = path.join(process.cwd(), 'test-output', name);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
};

global.cleanupTestDir = async (dir) => {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // Ignore errors
  }
};