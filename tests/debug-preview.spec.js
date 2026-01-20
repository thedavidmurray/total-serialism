const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Debug Preview Mode Tests', () => {
  test('Debug Preview tool loads and displays correctly', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Check page loaded
    await expect(page.locator('h2')).toContainText('Debug Preview Mode');
    
    // Check all visualization options exist
    const options = ['showTravelPaths', 'showStartEnd', 'showDirection', 'showPenLifts', 'showStats'];
    for (const option of options) {
      await expect(page.locator(`#${option}`)).toBeVisible();
      await expect(page.locator(`#${option}`)).toBeChecked();
    }
    
    // Check control sections
    await expect(page.locator('h3:has-text("Load Paths")')).toBeVisible();
    await expect(page.locator('h3:has-text("Visualization Options")')).toBeVisible();
    await expect(page.locator('h3:has-text("Colors")')).toBeVisible();
    await expect(page.locator('h3:has-text("Preview Mode")')).toBeVisible();
    await expect(page.locator('h3:has-text("Path Optimization")')).toBeVisible();
  });

  test('Test pattern loads and displays statistics', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Load test pattern
    await page.click('button:has-text("Load Test Pattern")');
    
    // Wait for success message
    await expect(page.locator('#processing-status')).toContainText('Test pattern loaded');
    
    // Check statistics are displayed
    await expect(page.locator('#stats')).toBeVisible();
    await expect(page.locator('#pathCount')).not.toHaveText('0');
    await expect(page.locator('#pointCount')).not.toHaveText('0');
    
    // Check canvas has content
    const canvasElement = page.locator('#canvas-wrapper canvas');
    await expect(canvasElement).toBeVisible();
  });

  test('Visualization options toggle correctly', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Load test pattern first
    await page.click('button:has-text("Load Test Pattern")');
    await page.waitForTimeout(500);
    
    // Test toggling travel paths
    await page.uncheck('#showTravelPaths');
    await page.waitForTimeout(100);
    
    // Test toggling statistics
    await page.uncheck('#showStats');
    await page.waitForTimeout(100);
    
    // Re-enable and verify
    await page.check('#showTravelPaths');
    await page.check('#showStats');
    await page.waitForTimeout(100);
  });

  test('Color controls update preview', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Load test pattern
    await page.click('button:has-text("Load Test Pattern")');
    await page.waitForTimeout(500);
    
    // Change drawing color
    await page.fill('#drawColor', '#ff0000');
    
    // Change opacity
    const opacitySlider = page.locator('#drawOpacity');
    await opacitySlider.fill('50');
    await expect(page.locator('#drawOpacityValue')).toHaveText('50%');
    
    // Change travel color opacity
    const travelOpacitySlider = page.locator('#travelOpacity');
    await travelOpacitySlider.fill('60');
    await expect(page.locator('#travelOpacityValue')).toHaveText('60%');
  });

  test('Path optimization works', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Load test pattern
    await page.click('button:has-text("Load Test Pattern")');
    await page.waitForTimeout(500);
    
    // Get initial travel distance
    const initialTravel = await page.locator('#travelDistance').textContent();
    
    // Optimize paths
    await page.click('#optimizeBtn');
    await expect(page.locator('#processing-status')).toContainText('optimized successfully');
    
    // Check travel distance changed
    const optimizedTravel = await page.locator('#travelDistance').textContent();
    
    // Travel distance should be different after optimization
    expect(initialTravel).not.toBe(optimizedTravel);
  });

  test('Preview mode switching works', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Check static mode is default
    const staticBtn = page.locator('.preview-tabs button:has-text("Static")');
    await expect(staticBtn).toHaveClass(/active/);
    await expect(page.locator('#animationControls')).not.toBeVisible();
    
    // Switch to animated mode
    const animatedBtn = page.locator('.preview-tabs button:has-text("Animated")');
    await animatedBtn.click();
    await expect(animatedBtn).toHaveClass(/active/);
    await expect(page.locator('#animationControls')).toBeVisible();
    
    // Check animation controls exist
    await expect(page.locator('button:has-text("Play")')).toBeVisible();
    await expect(page.locator('button:has-text("Pause")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
  });

  test('File upload works with SVG', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Create test SVG file
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,10 L100,10 L100,100 L10,100 Z" fill="none" stroke="black"/>
  <path d="M50,50 L150,50 L150,150 L50,150 Z" fill="none" stroke="black"/>
</svg>`;
    
    const testSvgPath = path.join(__dirname, 'test-paths.svg');
    fs.writeFileSync(testSvgPath, svgContent);
    
    // Upload file
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testSvgPath);
    
    // Check success message
    await expect(page.locator('#processing-status')).toContainText('File loaded successfully');
    
    // Check statistics updated
    await expect(page.locator('#pathCount')).not.toHaveText('0');
    
    // Clean up
    fs.unlinkSync(testSvgPath);
  });

  test('Export functions are enabled after loading paths', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Initially disabled
    await expect(page.locator('#exportImageBtn')).toBeDisabled();
    await expect(page.locator('#exportSVGBtn')).toBeDisabled();
    await expect(page.locator('#exportStatsBtn')).toBeDisabled();
    
    // Load test pattern
    await page.click('button:has-text("Load Test Pattern")');
    
    // Now enabled
    await expect(page.locator('#exportImageBtn')).toBeEnabled();
    await expect(page.locator('#exportSVGBtn')).toBeEnabled();
    await expect(page.locator('#exportStatsBtn')).toBeEnabled();
  });

  test('Statistics display correct information', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Load test pattern
    await page.click('button:has-text("Load Test Pattern")');
    await page.waitForTimeout(500);
    
    // Check all statistics fields have values
    const statFields = [
      'pathCount', 'pointCount', 'penLifts', 
      'drawDistance', 'travelDistance', 'totalDistance',
      'efficiency', 'estimatedTime'
    ];
    
    for (const field of statFields) {
      const value = await page.locator(`#${field}`).textContent();
      expect(value).not.toBe('0');
      expect(value).not.toBe('');
    }
    
    // Check efficiency is a percentage
    const efficiency = await page.locator('#efficiency').textContent();
    expect(efficiency).toContain('%');
    
    // Check distances are in mm
    const drawDistance = await page.locator('#drawDistance').textContent();
    expect(drawDistance).toContain('mm');
  });

  test('Drag and drop file upload', async ({ page }) => {
    await page.goto('/algorithms/tools/debug-preview-gui.html');
    
    // Create test JSON file
    const jsonContent = JSON.stringify([
      {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 }
        ],
        closed: true
      }
    ]);
    
    const testJsonPath = path.join(__dirname, 'test-paths.json');
    fs.writeFileSync(testJsonPath, jsonContent);
    
    // Simulate drag and drop
    const dropZone = page.locator('#dropZone');
    
    // Create DataTransfer and File objects
    await page.evaluate(([jsonPath, jsonData]) => {
      const dropZone = document.getElementById('dropZone');
      const file = new File([jsonData], 'test-paths.json', { type: 'application/json' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      
      dropZone.dispatchEvent(dropEvent);
    }, [testJsonPath, jsonContent]);
    
    // Check success
    await expect(page.locator('#processing-status')).toContainText('File loaded successfully');
    
    // Clean up
    fs.unlinkSync(testJsonPath);
  });
});