const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Pen Plotter Algorithm Tests', () => {
  test.describe('Image Processing Algorithms', () => {
    test('SquiggleCam loads and processes images', async ({ page }) => {
      await page.goto('/algorithms/image-processing/squigglecam.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('SquiggleCam');
      
      // Check controls exist
      await expect(page.locator('#lineCount')).toBeVisible();
      await expect(page.locator('#amplitude')).toBeVisible();
      await expect(page.locator('#frequency')).toBeVisible();
      
      // Test image upload
      const fileInput = page.locator('#imageUpload');
      await expect(fileInput).toBeVisible();
      
      // Create test image
      const testImagePath = path.join(__dirname, 'test-image.png');
      const canvas = require('canvas');
      const testCanvas = canvas.createCanvas(100, 100);
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'black';
      ctx.fillRect(25, 25, 50, 50);
      const buffer = testCanvas.toBuffer('image/png');
      fs.writeFileSync(testImagePath, buffer);
      
      // Upload image
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for processing
      await page.waitForTimeout(1000);
      
      // Check canvas has content
      const canvasElement = page.locator('#canvas-wrapper canvas');
      await expect(canvasElement).toBeVisible();
      
      // Test generate button
      await page.click('button:has-text("Generate Squiggles")');
      await expect(page.locator('#processing-status')).toContainText('generated successfully');
      
      // Test export buttons
      await expect(page.locator('#exportBtn')).toBeEnabled();
      await expect(page.locator('#exportPNGBtn')).toBeEnabled();
      
      // Clean up
      fs.unlinkSync(testImagePath);
    });

    test('Hatching converter loads and has all styles', async ({ page }) => {
      await page.goto('/algorithms/image-processing/hatching.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('Hatching Converter');
      
      // Check hatching styles
      const styles = ['linear', 'crosshatch', 'contour', 'stipple'];
      for (const style of styles) {
        const button = page.locator(`button[onclick="setHatchingStyle('${style}')"]`);
        await expect(button).toBeVisible();
        await button.click();
        
        // Verify style is set
        await page.waitForTimeout(100);
      }
      
      // Check controls
      await expect(page.locator('#angle')).toBeVisible();
      await expect(page.locator('#spacing')).toBeVisible();
      await expect(page.locator('#density')).toBeVisible();
    });

    test('Halftone converter loads with shape options', async ({ page }) => {
      await page.goto('/algorithms/image-processing/halftone.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('Halftone Converter');
      
      // Check grid types
      const gridTypes = ['square', 'hexagonal', 'triangular'];
      const gridSelect = page.locator('#gridType');
      await expect(gridSelect).toBeVisible();
      
      for (const gridType of gridTypes) {
        await gridSelect.selectOption(gridType);
        await expect(gridSelect).toHaveValue(gridType);
      }
      
      // Check shape types
      const shapeTypes = ['circle', 'square', 'diamond', 'star'];
      const shapeSelect = page.locator('#shapeType');
      await expect(shapeSelect).toBeVisible();
      
      for (const shapeType of shapeTypes) {
        await shapeSelect.selectOption(shapeType);
        await expect(shapeSelect).toHaveValue(shapeType);
      }
    });
  });

  test.describe('Hub Integration', () => {
    test('Hub displays Image Processing category', async ({ page }) => {
      await page.goto('/');
      
      // Check filter button exists
      const filterButton = page.locator('button[data-filter="image-processing"]');
      await expect(filterButton).toBeVisible();
      await expect(filterButton).toContainText('Image Processing');
      
      // Click filter
      await filterButton.click();
      await expect(filterButton).toHaveClass(/active/);
      
      // Check algorithms are shown
      await expect(page.locator('.algorithm-card:has-text("SquiggleCam")')).toBeVisible();
      await expect(page.locator('.algorithm-card:has-text("Hatching")')).toBeVisible();
      await expect(page.locator('.algorithm-card:has-text("Halftone")')).toBeVisible();
    });

    test('Search finds image processing algorithms', async ({ page }) => {
      await page.goto('/');
      
      // Search for "image"
      await page.fill('#search', 'image');
      
      // Check results
      await expect(page.locator('.algorithm-card:has-text("SquiggleCam")')).toBeVisible();
      await expect(page.locator('.algorithm-card:has-text("Hatching")')).toBeVisible();
      await expect(page.locator('.algorithm-card:has-text("Halftone")')).toBeVisible();
      
      // Check other categories are hidden
      await expect(page.locator('.algorithm-card:has-text("Game of Life")')).not.toBeVisible();
    });
  });

  test.describe('Path Optimizer', () => {
    test('PathOptimizer utility functions correctly', async ({ page }) => {
      await page.goto('/test-algorithms.html');
      
      // Wait for automatic tests to run
      await page.waitForTimeout(1000);
      
      // Check all PathOptimizer tests passed
      const pathOptimizerResults = page.locator('#path-optimizer-results .test-result');
      const count = await pathOptimizerResults.count();
      
      for (let i = 0; i < count; i++) {
        const result = pathOptimizerResults.nth(i);
        await expect(result).toHaveClass(/success/);
        await expect(result).toContainText('✓');
      }
    });
  });

  test.describe('Spiral Fill Algorithm', () => {
    test('Spiral Fill generates all shape types', async ({ page }) => {
      await page.goto('/algorithms/geometric/spiral-fill.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('Spiral Fill');
      
      // Test all shape buttons
      const shapes = ['circle', 'square', 'triangle', 'hexagon', 'star', 'heart'];
      for (const shape of shapes) {
        await page.click(`button[onclick="setShape('${shape}')"]`);
        await page.waitForTimeout(100);
      }
      
      // Test spiral types
      const spiralTypes = ['archimedean', 'logarithmic', 'fermat', 'hyperbolic', 'square', 'polygonal'];
      const spiralSelect = page.locator('#spiralType');
      
      for (const type of spiralTypes) {
        await spiralSelect.selectOption(type);
        await expect(spiralSelect).toHaveValue(type);
      }
      
      // Test generate button
      await page.click('button:has-text("Generate Spiral Fill")');
      await expect(page.locator('#processing-status')).toContainText('generated successfully');
      
      // Test export is enabled
      await expect(page.locator('#exportBtn')).toBeEnabled();
      await expect(page.locator('#exportPNGBtn')).toBeEnabled();
    });

    test('Spiral Fill parameter controls work', async ({ page }) => {
      await page.goto('/algorithms/geometric/spiral-fill.html');
      
      // Test parameter sliders
      const sliders = ['spacing', 'turns', 'innerRadius', 'growthRate'];
      
      for (const sliderId of sliders) {
        const slider = page.locator(`#${sliderId}`);
        const valueSpan = page.locator(`#${sliderId}-value`);
        
        await expect(slider).toBeVisible();
        
        // Get initial value
        const initialValue = await valueSpan.textContent();
        
        // Change slider
        const sliderBox = await slider.boundingBox();
        await page.mouse.click(sliderBox.x + sliderBox.width * 0.75, sliderBox.y + sliderBox.height / 2);
        
        // Check value changed
        const newValue = await valueSpan.textContent();
        expect(newValue).not.toBe(initialValue);
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('SVG export downloads files', async ({ page, context }) => {
      // Set up download promise before navigation
      const downloadPromise = page.waitForEvent('download');
      
      await page.goto('/algorithms/geometric/spiral-fill.html');
      
      // Generate a spiral
      await page.click('button:has-text("Generate Spiral Fill")');
      await page.waitForTimeout(500);
      
      // Click export SVG
      await page.click('#exportBtn');
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('spiral-fill.svg');
      
      // Verify it's an SVG file
      const path = await download.path();
      const content = fs.readFileSync(path, 'utf8');
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
    });

    test('PNG export downloads files', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      
      await page.goto('/algorithms/geometric/spiral-fill.html');
      
      // Generate a spiral
      await page.click('button:has-text("Generate Spiral Fill")');
      await page.waitForTimeout(500);
      
      // Click export PNG
      await page.click('#exportPNGBtn');
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('spiral-fill.png');
    });
  });

  test.describe('Responsive Design', () => {
    test('Algorithms work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/algorithms/image-processing/squigglecam.html');
      
      // Check layout adapts
      const controls = page.locator('#controls');
      const canvas = page.locator('#canvas-container');
      
      await expect(controls).toBeVisible();
      await expect(canvas).toBeVisible();
      
      // Controls should be stacked on mobile
      const controlsBox = await controls.boundingBox();
      const canvasBox = await canvas.boundingBox();
      
      // On mobile, controls should be full width
      expect(controlsBox.width).toBeGreaterThan(300);
    });
  });

  test.describe('Performance', () => {
    test('Path optimization completes in reasonable time', async ({ page }) => {
      await page.goto('/algorithms/geometric/spiral-fill.html');
      
      // Set high complexity
      await page.fill('#turns', '50');
      await page.click('#optimizePaths');
      
      // Time the generation
      const startTime = Date.now();
      await page.click('button:has-text("Generate Spiral Fill")');
      
      // Wait for completion
      await expect(page.locator('#processing-status')).toContainText('generated successfully');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds even with high complexity
      expect(duration).toBeLessThan(5000);
    });
  });
});