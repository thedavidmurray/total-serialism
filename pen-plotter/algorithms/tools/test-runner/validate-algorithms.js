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
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse CLI args
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const HEADED = args.includes('--headed');
const SKIP_SERVER = args.includes('--no-server');
const categoryIdx = args.indexOf('--category');
const singleIdx = args.indexOf('--single');
const browserUrlIdx = args.indexOf('--browser-url');
const FILTER_CATEGORY = categoryIdx !== -1 ? args[categoryIdx + 1] : null;
const FILTER_SINGLE = singleIdx !== -1 ? args[singleIdx + 1] : null;
const BROWSER_URL = browserUrlIdx !== -1 ? args[browserUrlIdx + 1] : process.env.BROWSER_URL || null;

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const TIMEOUT = 30000;
const RENDER_WAIT = 2500;

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

function loadAlgorithmCatalog() {
  const catalogPath = join(__dirname, '..', '..', '..', '..', 'algorithm-catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

  return catalog.algorithms
    .filter((algorithm) => algorithm.path && algorithm.path.endsWith('.html'))
    .map((algorithm) => ({
      name: algorithm.name,
      category: algorithm.category,
      path: algorithm.path,
      filename: algorithm.path.split('/').pop()
    }));
}

function buildAlgorithmRegistry(algorithms) {
  return algorithms.reduce((registry, algorithm) => {
    registry[algorithm.category] ||= [];
    registry[algorithm.category].push(algorithm);
    return registry;
  }, {});
}

const ALGORITHMS = loadAlgorithmCatalog();
const ALGORITHMS_BY_CATEGORY = buildAlgorithmRegistry(ALGORITHMS);

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

async function connectBrowser() {
  if (BROWSER_URL) {
    log.info(`Connecting to existing browser at ${BROWSER_URL}...`);
    const browser = await puppeteer.connect({ browserURL: BROWSER_URL });
    log.success('Connected to existing browser');
    return { browser, ownsBrowser: false };
  }

  log.info('Launching browser...');
  const browser = await puppeteer.launch({
    headless: HEADED ? false : 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  log.success('Browser launched');
  return { browser, ownsBrowser: true };
}

/**
 * Test: Canvas exists and has dimensions
 */
async function testCanvasExists(page) {
  const surface = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-container canvas, canvas');
    if (canvas) {
      return { type: 'canvas', width: canvas.width, height: canvas.height };
    }

    const svg = document.querySelector('#canvas-container svg, svg');
    if (svg) {
      const viewBox = svg.viewBox?.baseVal;
      const width = viewBox?.width || parseFloat(svg.getAttribute('width')) || svg.clientWidth || 0;
      const height = viewBox?.height || parseFloat(svg.getAttribute('height')) || svg.clientHeight || 0;
      return { type: 'svg', width, height };
    }

    return null;
  });

  if (!surface) {
    return { pass: false, detail: 'No canvas or SVG element found' };
  }

  if (surface.width === 0 || surface.height === 0) {
    return { pass: false, detail: `${surface.type.toUpperCase()} has zero dimensions` };
  }

  return { pass: true, detail: `${surface.type.toUpperCase()} ${surface.width}×${surface.height}` };
}

/**
 * Test: Canvas has rendered content
 */
async function testCanvasContent(page) {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-container canvas, canvas');
    if (canvas) {
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
    }

    const svg = document.querySelector('#canvas-container svg, svg');
    if (!svg) return { pass: false, detail: 'No canvas or SVG surface' };

    const drawableCount = svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect, text, use').length;
    if (drawableCount > 0) {
      return { pass: true, detail: `SVG with ${drawableCount} drawable elements` };
    }

    return { pass: false, detail: 'SVG surface has no drawable elements' };
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
    const stepAttr = parseFloat(slider.step);
    const step = Number.isFinite(stepAttr) && stepAttr > 0 ? stepAttr : Math.max(range / 100, 0.00001);

    // Move slider to a different position
    let newValue = min + range * 0.5;
    // If already near middle, move to 75%
    if (Math.abs(oldValue - newValue) < range * 0.1) {
      newValue = min + range * 0.75;
    }
    newValue = min + Math.round((newValue - min) / step) * step;
    newValue = Math.min(max, Math.max(min, newValue));

    slider.value = newValue;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));

    const actualValue = parseFloat(slider.value);
    const precision = step < 0.01 ? 5 : step < 1 ? 2 : 0;
    const epsilon = Math.max(step * 0.5, range * 0.001, 0.000001);

    // Pass if value changed from old value
    return {
      pass: Math.abs(actualValue - oldValue) > epsilon,
      detail: `${oldValue.toFixed(precision)} → ${actualValue.toFixed(precision)}`
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
    const canvas = document.querySelector('#canvas-container canvas, canvas');
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'webgl';

        const data = ctx.getImageData(0, 0, Math.min(200, canvas.width), Math.min(200, canvas.height)).data;
        let hash = 0;
        for (let i = 0; i < data.length; i += 40) {
          hash = ((hash << 5) - hash + data[i]) | 0;
        }
        return `canvas:${hash}`;
      } catch (e) {
        return null;
      }
    }

    const svg = document.querySelector('#canvas-container svg, svg');
    if (!svg) return null;

    const markup = svg.outerHTML;
    let hash = 0;
    for (let i = 0; i < markup.length; i += 20) {
      hash = ((hash << 5) - hash + markup.charCodeAt(i)) | 0;
    }
    return `svg:${hash}:${markup.length}`;
  });

  if (initialHash === null) {
    return { pass: null, detail: 'Could not capture drawing surface state' };
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

  // Compare drawing surface state
  const newHash = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-container canvas, canvas');
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const data = ctx.getImageData(0, 0, Math.min(200, canvas.width), Math.min(200, canvas.height)).data;
        let hash = 0;
        for (let i = 0; i < data.length; i += 40) {
          hash = ((hash << 5) - hash + data[i]) | 0;
        }
        return `canvas:${hash}`;
      } catch (e) {
        return null;
      }
    }

    const svg = document.querySelector('#canvas-container svg, svg');
    if (!svg) return null;

    const markup = svg.outerHTML;
    let hash = 0;
    for (let i = 0; i < markup.length; i += 20) {
      hash = ((hash << 5) - hash + markup.charCodeAt(i)) | 0;
    }
    return `svg:${hash}:${markup.length}`;
  });

  if (newHash === null) {
    return { pass: null, detail: 'Could not compare drawing surface state' };
  }

  const changed = initialHash !== newHash;
  return {
    pass: changed,
    warn: !changed,
    detail: changed ? `Regenerated via ${triggered}` : `No visible change after ${triggered}`
  };
}

/**
 * Run all tests on a single algorithm
 */
async function testAlgorithm(browser, algorithm) {
  const { category, filename, path } = algorithm;
  const url = `${BASE_URL}/${path}?audit=${Date.now()}`;
  const name = algorithm.name || filename.replace(/-gui\.html$/, '').replace(/\.html$/, '').replace(/-/g, ' ');

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.setDefaultTimeout(TIMEOUT);
  page.setDefaultNavigationTimeout(TIMEOUT);

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  page.on('dialog', async (dialog) => {
    consoleErrors.push(`Dialog dismissed: ${dialog.message()}`);
    await dialog.dismiss();
  });

  const testResults = {
    name,
    category,
    filename,
    path,
    url,
    tests: {},
    consoleErrors: [],
    pageErrors: [],
    status: 'pass'
  };

  try {
    await page.setCacheEnabled(false);

    // Navigate to page
    log.verbose(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

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
    try {
      await Promise.race([
        page.close({ runBeforeUnload: false }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch {
      // Ignore page teardown failures; they should not block the full audit.
    }
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
  if (SKIP_SERVER) {
    log.info('Skipping server startup (--no-server)');
  } else {
    try {
      server = await startServer();
      log.success('Server started');
    } catch (e) {
      log.error(`Failed to start server: ${e.message}`);
      log.info('Make sure port 8080 is available, or run: npm run serve');
      process.exit(1);
    }
  }

  const { browser, ownsBrowser } = await connectBrowser();

  // Build test list
  let testList = [];

  if (FILTER_SINGLE) {
    const match = ALGORITHMS.find(({ filename, name, path }) => {
      const needle = FILTER_SINGLE.toLowerCase();
      return filename.toLowerCase().includes(needle) ||
        path.toLowerCase().includes(needle) ||
        (name && name.toLowerCase().includes(needle));
    });

    if (match) {
      testList.push(match);
    }

    if (testList.length === 0) {
      log.error(`No algorithm matching "${FILTER_SINGLE}" found`);
      process.exit(1);
    }
  } else if (FILTER_CATEGORY) {
    if (!ALGORITHMS_BY_CATEGORY[FILTER_CATEGORY]) {
      log.error(`Category "${FILTER_CATEGORY}" not found`);
      log.info(`Available: ${Object.keys(ALGORITHMS_BY_CATEGORY).join(', ')}`);
      process.exit(1);
    }
    testList = [...ALGORITHMS_BY_CATEGORY[FILTER_CATEGORY]];
  } else {
    testList = [...ALGORITHMS];
  }

  log.info(`Testing ${testList.length} algorithms...\n`);
  log.divider();

  // Run tests
  for (let i = 0; i < testList.length; i++) {
    const { filename } = testList[i];

    if (!VERBOSE) {
      process.stdout.write(`\r${chalk.gray(`[${i + 1}/${testList.length}]`)} Testing ${filename}...`);
    }

    const result = await testAlgorithm(browser, testList[i]);
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
  if (ownsBrowser) {
    await browser.close();
  } else {
    await browser.disconnect();
  }

  if (server) {
    server.kill();
  }

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
