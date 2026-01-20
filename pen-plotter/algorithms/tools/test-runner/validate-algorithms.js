#!/usr/bin/env node
/**
 * Total Serialism Algorithm Validator
 * Puppeteer-based functional testing for all pen plotter algorithms
 *
 * Usage:
 *   npm test                          # Run all tests
 *   npm test -- --verbose             # Verbose output
 *   npm test -- --category geometric  # Test one category
 *   npm test -- --single spiral-burst # Test one algorithm
 *   npm test -- --headed              # Show browser window
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Algorithm registry
const ALGORITHMS = {
  'advanced': [
    'chladni-patterns-gui.html',
    'lorenz-attractor-gui.html',
    'parametric-surfaces-gui.html',
    'sound-waveform-gui.html',
    'vortex-street-gui.html'
  ],
  'ai': ['ml5-patterns-gui.html'],
  'cellular-automata': [
    'elementary-ca-layers.html',
    'elementary-ca.html',
    'game-of-life-gui.html',
    'game-of-life-layers.html'
  ],
  'chemical': [
    'belousov-zhabotinsky-gui.html',
    'chromatography-gui.html',
    'convection-cells-gui.html',
    'crystallization-gui.html',
    'liesegang-rings-gui.html',
    'mixing-patterns-gui.html'
  ],
  'curves': ['hilbert-curve-gui.html', 'space-filling-curves-gui.html'],
  'flow-fields': ['flow-field-collision.html', 'flow-field-p5-gui.html'],
  'fractals': ['mandelbrot-julia-gui.html'],
  'geometric': [
    '10print-gui.html',
    '10print-simple.html',
    'circle-rays-gui.html',
    'circle-twist-gui.html',
    'grid-landscape-gui.html',
    'hash-tiles-gui.html',
    'islamic-patterns-gui.html',
    'maze-generator-gui.html',
    'moire-patterns-gui.html',
    'penrose-tiling-gui.html',
    'perlin-circles-gui.html',
    'perlin-landscape-gui.html',
    'perlin-spiral-gui.html',
    'snowflakes-gui.html',
    'spiral-burst-gui.html',
    'spiral-fill.html',
    'spirotron-gui.html',
    'string-art-gui.html'
  ],
  'hybrid': ['hybrid-composer-gui.html'],
  'image-processing': [
    'ascii-art-gui.html',
    'dithering-gui.html',
    'halftone.html',
    'hatching.html',
    'image-to-ascii-gui.html',
    'squigglecam.html'
  ],
  'natural': [
    'astronomy-gui.html',
    'coral-growth-gui.html',
    'crystal-growth-gui.html',
    'differential-growth-gui.html',
    'lightning-gui.html'
  ],
  'packing': ['circle-packing-gui.html'],
  'physics': ['particle-system-gui.html', 'test-color-controls.html', 'wave-interference-gui.html'],
  'reaction-diffusion': [
    'reaction-diffusion-enhanced.html',
    'reaction-diffusion-gui.html',
    'reaction-diffusion-layers.html'
  ],
  'symmetry': ['kumiko-pattern.html', 'truchet-tiles-gui.html', 'zellige-pattern.html'],
  'textures': ['hatching-demo.html'],
  'trees-lsystems': ['lsystem-simple.html', 'tree-gui.html', 'tree-working.html'],
  'voronoi': ['tsp-art-gui.html', 'voronoi-stippling-gui.html']
};

// Parse CLI args
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const HEADED = args.includes('--headed');
const categoryIdx = args.indexOf('--category');
const singleIdx = args.indexOf('--single');
const FILTER_CATEGORY = categoryIdx !== -1 ? args[categoryIdx + 1] : null;
const FILTER_SINGLE = singleIdx !== -1 ? args[singleIdx + 1] : null;

// Test configuration
const BASE_URL = 'http://localhost:8080/algorithms';
const TIMEOUT = 15000;
const RENDER_WAIT = 2000;

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Logging helpers
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  verbose: (msg) => VERBOSE && console.log(chalk.gray('  │'), chalk.gray(msg)),
  header: (msg) => console.log('\n' + chalk.bold.cyan(msg)),
  divider: () => console.log(chalk.gray('─'.repeat(60)))
};

/**
 * Start local HTTP server
 */
async function startServer() {
  return new Promise((resolve, reject) => {
    // Server from pen-plotter root so /algorithms path works
    const serverPath = join(__dirname, '..', '..', '..');
    const server = spawn('npx', ['http-server', serverPath, '-p', '8080', '-c-1', '--silent'], {
      stdio: 'pipe',
      shell: true
    });

    server.on('error', reject);

    // Give server time to start
    setTimeout(() => resolve(server), 1500);
  });
}

/**
 * Test: Canvas exists and has dimensions
 */
async function testCanvasExists(page) {
  const canvas = await page.$('canvas');
  if (!canvas) {
    return { pass: false, detail: 'No canvas element found' };
  }

  const dims = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? { width: c.width, height: c.height } : null;
  });

  if (!dims || dims.width === 0 || dims.height === 0) {
    return { pass: false, detail: 'Canvas has zero dimensions' };
  }

  return { pass: true, detail: `${dims.width}×${dims.height}` };
}

/**
 * Test: Canvas has rendered content
 */
async function testCanvasContent(page) {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { pass: false, detail: 'No canvas' };

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Try WebGL
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) return { pass: true, detail: 'WebGL canvas' };
        return { pass: false, detail: 'No rendering context' };
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let nonEmpty = 0;
      let totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        // Check if pixel is non-transparent and non-black
        if (data[i+3] > 0 && (data[i] > 0 || data[i+1] > 0 || data[i+2] > 0)) {
          nonEmpty++;
        }
      }

      const percent = (nonEmpty / totalPixels * 100).toFixed(1);

      // Consider pass if >0.1% of pixels have content
      if (nonEmpty > totalPixels * 0.001) {
        return { pass: true, detail: `${percent}% filled` };
      }

      // Check for white canvas (might be intentional)
      let whitePixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250 && data[i+3] > 250) {
          whitePixels++;
        }
      }

      if (whitePixels > totalPixels * 0.9) {
        return { pass: true, detail: 'White canvas (may be intentional)', warn: true };
      }

      return { pass: false, detail: `Only ${percent}% filled - appears blank` };
    } catch (e) {
      return { pass: false, detail: e.message };
    }
  });

  return result;
}

/**
 * Test: Controls exist (sliders, checkboxes, selects)
 */
async function testControlsExist(page) {
  const counts = await page.evaluate(() => {
    return {
      sliders: document.querySelectorAll('input[type="range"]').length,
      checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
      selects: document.querySelectorAll('select').length,
      buttons: document.querySelectorAll('button').length,
      numberInputs: document.querySelectorAll('input[type="number"]').length
    };
  });

  const total = counts.sliders + counts.checkboxes + counts.selects + counts.numberInputs;
  const detail = `${counts.sliders} sliders, ${counts.checkboxes} checkboxes, ${counts.selects} selects`;

  return {
    pass: total > 0,
    detail,
    warn: total === 0 && counts.buttons > 0
  };
}

/**
 * Test: TS Design System APIs are loaded
 */
async function testTSAPIs(page) {
  const apis = await page.evaluate(() => {
    const check = ['TSCanvas', 'TSAutoRegen', 'TSControls', 'TSZoom', 'TSToast', 'TSSeed'];
    return check.filter(name => typeof window[name] !== 'undefined');
  });

  if (apis.length === 0) {
    return { pass: null, detail: 'No TS APIs (might be older algorithm)' };
  }

  return {
    pass: apis.length >= 2,
    detail: apis.join(', '),
    warn: apis.length < 4 && apis.length > 0
  };
}

/**
 * Test: Slider interaction changes value
 */
async function testSliderInteraction(page) {
  const result = await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    if (!slider) return { pass: null, detail: 'No sliders to test' };

    const oldValue = parseFloat(slider.value);
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const range = max - min;

    // Move slider to a different position
    let newValue = min + range * 0.5;
    // If already near middle, move to 75%
    if (Math.abs(oldValue - newValue) < range * 0.1) {
      newValue = min + range * 0.75;
    }

    slider.value = newValue;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));

    const actualValue = parseFloat(slider.value);

    // Pass if value changed from old value
    return {
      pass: Math.abs(actualValue - oldValue) > 0.001,
      detail: `${oldValue.toFixed(2)} → ${actualValue.toFixed(2)}`
    };
  });

  return result;
}

/**
 * Test: Canvas regenerates when controls change
 */
async function testCanvasRegeneration(page) {
  // Capture initial canvas state
  const initialHash = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'webgl';

      const data = ctx.getImageData(0, 0, Math.min(200, canvas.width), Math.min(200, canvas.height)).data;
      let hash = 0;
      for (let i = 0; i < data.length; i += 40) {
        hash = ((hash << 5) - hash + data[i]) | 0;
      }
      return hash;
    } catch (e) {
      return null;
    }
  });

  if (initialHash === null) {
    return { pass: null, detail: 'Could not capture canvas state' };
  }

  if (initialHash === 'webgl') {
    return { pass: null, detail: 'WebGL canvas - skipping regen test' };
  }

  // Try to trigger regeneration
  const triggered = await page.evaluate(() => {
    // Method 1: Click regenerate button
    const regenBtn = document.getElementById('regenerateBtn') ||
                     document.querySelector('button[onclick*="generate"]') ||
                     document.querySelector('button[onclick*="draw"]');
    if (regenBtn) {
      regenBtn.click();
      return 'button';
    }

    // Method 2: Use TSAutoRegen
    if (typeof TSAutoRegen !== 'undefined' && TSAutoRegen.force) {
      TSAutoRegen.force();
      return 'TSAutoRegen';
    }

    // Method 3: Change a slider
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      slider.value = min + (max - min) * Math.random();
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      return 'slider';
    }

    return null;
  });

  if (!triggered) {
    return { pass: null, detail: 'No regeneration method found' };
  }

  // Wait for regeneration
  await page.waitForTimeout(1000);

  // Compare canvas state
  const newHash = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const data = ctx.getImageData(0, 0, Math.min(200, canvas.width), Math.min(200, canvas.height)).data;
      let hash = 0;
      for (let i = 0; i < data.length; i += 40) {
        hash = ((hash << 5) - hash + data[i]) | 0;
      }
      return hash;
    } catch (e) {
      return null;
    }
  });

  if (newHash === null) {
    return { pass: null, detail: 'Could not compare canvas state' };
  }

  const changed = initialHash !== newHash;
  return {
    pass: changed,
    detail: changed ? `Regenerated via ${triggered}` : `No change after ${triggered}`
  };
}

/**
 * Run all tests on a single algorithm
 */
async function testAlgorithm(browser, category, filename) {
  const url = `${BASE_URL}/${category}/${filename}`;
  const name = filename.replace(/-gui\.html$/, '').replace(/\.html$/, '').replace(/-/g, ' ');

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  const testResults = {
    name,
    category,
    filename,
    url,
    tests: {},
    consoleErrors: [],
    pageErrors: [],
    status: 'pass'
  };

  try {
    // Navigate to page
    log.verbose(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT });

    // Wait for rendering
    await page.waitForTimeout(RENDER_WAIT);

    // Run tests
    const tests = [
      { id: 'canvas-exists', name: 'Canvas exists', fn: testCanvasExists },
      { id: 'canvas-content', name: 'Canvas has content', fn: testCanvasContent },
      { id: 'controls-exist', name: 'Controls exist', fn: testControlsExist },
      { id: 'ts-apis', name: 'TS APIs loaded', fn: testTSAPIs },
      { id: 'slider-interaction', name: 'Slider interaction', fn: testSliderInteraction },
      { id: 'canvas-regen', name: 'Canvas regenerates', fn: testCanvasRegeneration }
    ];

    for (const test of tests) {
      try {
        const result = await test.fn(page);
        testResults.tests[test.id] = { name: test.name, ...result };
        log.verbose(`  ${test.name}: ${result.pass ? '✓' : result.pass === false ? '✗' : '–'} ${result.detail}`);
      } catch (e) {
        testResults.tests[test.id] = { name: test.name, pass: false, detail: e.message };
        log.verbose(`  ${test.name}: ✗ ${e.message}`);
      }
    }

    // Check for console errors
    testResults.consoleErrors = consoleErrors;
    testResults.pageErrors = pageErrors;

    if (pageErrors.length > 0) {
      testResults.tests['no-errors'] = {
        name: 'No JS errors',
        pass: false,
        detail: pageErrors[0].substring(0, 80)
      };
    } else if (consoleErrors.length > 0) {
      testResults.tests['no-errors'] = {
        name: 'No console errors',
        pass: false,
        detail: consoleErrors[0].substring(0, 80),
        warn: true
      };
    } else {
      testResults.tests['no-errors'] = { name: 'No errors', pass: true, detail: 'Clean' };
    }

    // Determine overall status
    const testValues = Object.values(testResults.tests);
    const failures = testValues.filter(t => t.pass === false && !t.warn);
    const warnings = testValues.filter(t => t.warn);

    if (failures.length > 0) {
      testResults.status = 'fail';
    } else if (warnings.length > 0) {
      testResults.status = 'warn';
    }

  } catch (e) {
    testResults.status = 'fail';
    testResults.error = e.message;
    log.verbose(`  Error: ${e.message}`);
  } finally {
    await page.close();
  }

  return testResults;
}

/**
 * Print test result summary
 */
function printResult(result) {
  const statusIcon = result.status === 'pass' ? chalk.green('✓') :
                     result.status === 'warn' ? chalk.yellow('⚠') :
                     chalk.red('✗');

  const statusColor = result.status === 'pass' ? chalk.green :
                      result.status === 'warn' ? chalk.yellow :
                      chalk.red;

  console.log(`${statusIcon} ${statusColor(result.name)} ${chalk.gray(`(${result.category})`)}`);

  if (VERBOSE || result.status !== 'pass') {
    Object.values(result.tests).forEach(test => {
      const icon = test.pass === true ? chalk.green('  ✓') :
                   test.pass === false ? (test.warn ? chalk.yellow('  ⚠') : chalk.red('  ✗')) :
                   chalk.gray('  –');
      const detailColor = test.pass === true ? chalk.gray :
                         test.pass === false ? chalk.yellow : chalk.gray;
      console.log(`${icon} ${test.name}: ${detailColor(test.detail)}`);
    });
  }

  if (result.error) {
    console.log(chalk.red(`  Error: ${result.error}`));
  }
}

/**
 * Main runner
 */
async function main() {
  console.log(chalk.bold.cyan('\n🎨 Total Serialism Algorithm Validator\n'));

  // Start local server
  log.info('Starting local HTTP server on port 8080...');
  let server;
  try {
    server = await startServer();
    log.success('Server started');
  } catch (e) {
    log.error(`Failed to start server: ${e.message}`);
    log.info('Make sure port 8080 is available, or run: npm run serve');
    process.exit(1);
  }

  // Launch browser
  log.info('Launching browser...');
  const browser = await puppeteer.launch({
    headless: HEADED ? false : 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  log.success('Browser launched');

  // Build test list
  let testList = [];

  if (FILTER_SINGLE) {
    // Find matching algorithm
    for (const [cat, files] of Object.entries(ALGORITHMS)) {
      const match = files.find(f => f.includes(FILTER_SINGLE));
      if (match) {
        testList.push({ category: cat, filename: match });
        break;
      }
    }
    if (testList.length === 0) {
      log.error(`No algorithm matching "${FILTER_SINGLE}" found`);
      process.exit(1);
    }
  } else if (FILTER_CATEGORY) {
    if (!ALGORITHMS[FILTER_CATEGORY]) {
      log.error(`Category "${FILTER_CATEGORY}" not found`);
      log.info(`Available: ${Object.keys(ALGORITHMS).join(', ')}`);
      process.exit(1);
    }
    testList = ALGORITHMS[FILTER_CATEGORY].map(f => ({ category: FILTER_CATEGORY, filename: f }));
  } else {
    // All algorithms
    for (const [cat, files] of Object.entries(ALGORITHMS)) {
      for (const file of files) {
        testList.push({ category: cat, filename: file });
      }
    }
  }

  log.info(`Testing ${testList.length} algorithms...\n`);
  log.divider();

  // Run tests
  for (let i = 0; i < testList.length; i++) {
    const { category, filename } = testList[i];

    if (!VERBOSE) {
      process.stdout.write(`\r${chalk.gray(`[${i + 1}/${testList.length}]`)} Testing ${filename}...`);
    }

    const result = await testAlgorithm(browser, category, filename);
    results.tests.push(result);

    if (result.status === 'pass') results.passed++;
    else if (result.status === 'warn') results.warnings++;
    else results.failed++;

    if (VERBOSE || result.status !== 'pass') {
      if (!VERBOSE) console.log(); // Clear the progress line
      printResult(result);
    }
  }

  // Clear progress line
  if (!VERBOSE) {
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
  }

  // Cleanup
  await browser.close();
  server.kill();

  // Print summary
  log.divider();
  log.header('Summary');
  console.log(`  ${chalk.green('Passed:')}   ${results.passed}`);
  console.log(`  ${chalk.yellow('Warnings:')} ${results.warnings}`);
  console.log(`  ${chalk.red('Failed:')}   ${results.failed}`);
  console.log(`  ${chalk.gray('Total:')}    ${results.tests.length}`);

  // Save report
  const reportDir = join(__dirname, 'reports');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = join(reportDir, `validation-${new Date().toISOString().split('T')[0]}.json`);
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log.info(`Report saved to ${reportPath}`);

  // List failures
  if (results.failed > 0) {
    log.header('Failed Algorithms');
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`  ${chalk.red('✗')} ${t.category}/${t.filename}`);
        Object.values(t.tests)
          .filter(test => test.pass === false && !test.warn)
          .forEach(test => {
            console.log(`    ${chalk.gray('└')} ${test.name}: ${test.detail}`);
          });
      });
  }

  console.log();
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(e => {
  log.error(e.message);
  process.exit(1);
});
