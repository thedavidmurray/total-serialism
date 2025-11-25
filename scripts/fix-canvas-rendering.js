#!/usr/bin/env node

/**
 * Fix Canvas Rendering Issues
 *
 * Fixes blank canvas problems in SVG-mode algorithms by:
 * 1. Using more reliable CDN (jsdelivr instead of unpkg)
 * 2. Adding try-catch error handling
 * 3. Falling back to regular canvas if SVG fails
 *
 * Run with: node scripts/fix-canvas-rendering.js
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

  // Step 1: Replace unpkg CDN with jsdelivr (more reliable)
  const oldCDN = 'https://unpkg.com/p5.js-svg@1.5.1';
  const newCDN = 'https://cdn.jsdelivr.net/npm/p5.js-svg@1.5.1/dist/p5.svg.min.js';

  if (content.includes(oldCDN)) {
    content = content.replace(oldCDN, newCDN);
    modified = true;
  }

  // Step 2: Add error handling for library load
  const scriptTagPattern = /<script src="[^"]*p5\.js-svg[^"]*"><\/script>/;
  const match = content.match(scriptTagPattern);

  if (match && !content.includes('onerror=')) {
    const oldTag = match[0];
    const newTag = oldTag.replace('></script>', ' onerror="console.error(\'p5.js-svg failed to load from CDN\')"></script>');
    content = content.replace(oldTag, newTag);
    modified = true;
  }

  // Step 3: Add try-catch around createCanvas(SVG) calls
  // Look for patterns like: svgCanvas = createCanvas(width, height, SVG);
  const createCanvasPattern = /(\s+)((?:const |let |var |)[\w\s]*=\s*)?createCanvas\(([^,]+),\s*([^,]+),\s*SVG\);/g;

  if (content.match(createCanvasPattern)) {
    content = content.replace(createCanvasPattern, (match, indent, varDecl, width, height) => {
      // Check if there's already a try-catch
      const contextBefore = content.substring(Math.max(0, content.indexOf(match) - 100), content.indexOf(match));
      if (contextBefore.includes('try {')) {
        return match; // Already has error handling
      }

      const varName = varDecl ? varDecl.trim() : '';
      return `${indent}// Try SVG mode with fallback to canvas mode
${indent}let usingSVG = true;
${indent}try {
${indent}  ${varName}createCanvas(${width}, ${height}, SVG);
${indent}} catch (e) {
${indent}  console.warn('SVG mode failed, using canvas mode:', e);
${indent}  ${varName}createCanvas(${width}, ${height});
${indent}  usingSVG = false;
${indent}}`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing Canvas Rendering Issues\n');
  console.log('='.repeat(60));

  let fixed = 0;
  let skipped = 0;

  SVG_FILES.forEach(filePath => {
    const relativePath = filePath;

    try {
      if (fixFile(filePath)) {
        console.log(`  ✅ Fixed: ${relativePath}`);
        fixed++;
      } else {
        console.log(`  ⏭  Skipped: ${relativePath} (already fixed or no changes needed)`);
        skipped++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${relativePath} - ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);

  if (fixed > 0) {
    console.log('\n✅ All SVG-mode algorithms now have fallback rendering!');
    console.log('   Canvases will display even if p5.js-svg fails to load.\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
