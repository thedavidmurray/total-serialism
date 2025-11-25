#!/usr/bin/env node

/**
 * Fix SVG Export Button in Fallback Mode
 *
 * When p5.js-svg fails and we fall back to canvas mode,
 * disable or hide the SVG export button to prevent confusion.
 *
 * Run with: node scripts/fix-svg-export-fallback.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

const SVG_FILES = [
  'pen-plotter/algorithms/ai/ml5-patterns-gui.html',
  'pen-plotter/algorithms/chemical/belousov-zhabotinsky-gui.html',
  'pen-plotter/algorithms/chemical/crystallization-gui.html',
  'pen-plotter/algorithms/flow-fields/flow-field-p5-gui.html',
  'pen-plotter/algorithms/geometric/10print-gui.html',
  'pen-plotter/algorithms/geometric/circle-rays-gui.html',
  'pen-plotter/algorithms/geometric/circle-twist-gui.html',
  'pen-plotter/algorithms/geometric/grid-landscape-gui.html',
  'pen-plotter/algorithms/geometric/hash-tiles-gui.html',
  'pen-plotter/algorithms/geometric/perlin-circles-gui.html',
  'pen-plotter/algorithms/geometric/perlin-landscape-gui.html',
  'pen-plotter/algorithms/geometric/perlin-spiral-gui.html',
  'pen-plotter/algorithms/geometric/snowflakes-gui.html',
  'pen-plotter/algorithms/geometric/spirotron-gui.html',
  'pen-plotter/algorithms/image-processing/image-to-ascii-gui.html',
  'pen-plotter/algorithms/textures/hatching-demo.html',
  'pen-plotter/algorithms/trees-lsystems/lsystem-simple.html',
  'pen-plotter/algorithms/trees-lsystems/tree-gui.html'
];

function fixFile(filePath) {
  const fullPath = path.join(REPO_ROOT, filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Find the setup() function and add button disabling after try-catch
  const setupPattern = /usingSVG = false;\s*\n\s*\}/;

  if (content.match(setupPattern) && !content.includes('Disable SVG export')) {
    content = content.replace(setupPattern, (match) => {
      return match.replace('}', `  // Disable SVG export button since we're in canvas mode
    const svgBtn = document.querySelector('[onclick*="exportSVG"]');
    if (svgBtn) {
      svgBtn.disabled = true;
      svgBtn.title = 'SVG export unavailable (using canvas fallback)';
      svgBtn.style.opacity = '0.5';
    }
  }`);
    });
    modified = true;
  }

  // Fix spacing issues in createCanvas calls
  content = content.replace(/svgCanvas =createCanvas/g, 'svgCanvas = createCanvas');
  modified = true;

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Adding SVG Export Fallback Handling\n');
  console.log('='.repeat(60));

  let fixed = 0;

  SVG_FILES.forEach(filePath => {
    try {
      if (fixFile(filePath)) {
        console.log(`  ✅ Fixed: ${filePath}`);
        fixed++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${filePath} - ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Fixed ${fixed} files`);
  console.log('   SVG export button now disables gracefully in fallback mode.\n');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
