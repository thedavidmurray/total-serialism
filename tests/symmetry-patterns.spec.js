const { test, expect } = require('@playwright/test');

test.describe('Symmetry Pattern Tests', () => {
  test.describe('Zellige Pattern Generator', () => {
    test('Zellige page loads correctly', async ({ page }) => {
      await page.goto('/algorithms/symmetry/zellige-pattern.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('Zellige Pattern Generator');
      await expect(page.locator('.pattern-info')).toContainText('Traditional Moroccan mosaic tilework');
      
      // Check control sections
      await expect(page.locator('h3:has-text("Pattern Type")')).toBeVisible();
      await expect(page.locator('h3:has-text("Tile Properties")')).toBeVisible();
      await expect(page.locator('h3:has-text("Visual Style")')).toBeVisible();
      await expect(page.locator('h3:has-text("Grid Settings")')).toBeVisible();
    });

    test('Pattern types can be selected', async ({ page }) => {
      await page.goto('/algorithms/symmetry/zellige-pattern.html');
      
      const patternSelect = page.locator('#patternType');
      
      // Check available patterns
      const options = await patternSelect.locator('option').allTextContents();
      expect(options).toEqual([
        'Classic 8-fold Star',
        'Hexagonal Tessellation',
        '16-Point Star',
        'Safavid Complex',
        'Geometric Interlock'
      ]);
      
      // Test changing patterns
      await patternSelect.selectOption('hexagonal');
      await expect(patternSelect).toHaveValue('hexagonal');
      
      await patternSelect.selectOption('star16');
      await expect(patternSelect).toHaveValue('star16');
    });

    test('Visual style options work', async ({ page }) => {
      await page.goto('/algorithms/symmetry/zellige-pattern.html');
      
      // Check checkboxes
      const showConstruction = page.locator('#showConstruction');
      const fillShapes = page.locator('#fillShapes');
      const colorCode = page.locator('#colorCode');
      const showSymmetry = page.locator('#showSymmetry');
      
      // Check default states
      await expect(showConstruction).not.toBeChecked();
      await expect(fillShapes).not.toBeChecked();
      await expect(colorCode).toBeChecked();
      await expect(showSymmetry).not.toBeChecked();
      
      // Toggle options
      await showConstruction.check();
      await expect(showConstruction).toBeChecked();
      
      await fillShapes.check();
      await expect(fillShapes).toBeChecked();
    });

    test('Complexity and tile controls update', async ({ page }) => {
      await page.goto('/algorithms/symmetry/zellige-pattern.html');
      
      // Test complexity
      const complexity = page.locator('#complexity');
      await complexity.fill('4');
      await expect(page.locator('#complexity-value')).toHaveText('4');
      
      // Test tile size
      const tileSize = page.locator('#tileSize');
      await tileSize.fill('60');
      await expect(page.locator('#tileSize-value')).toHaveText('60');
      
      // Test spacing
      const spacing = page.locator('#spacing');
      await spacing.fill('5');
      await expect(page.locator('#spacing-value')).toHaveText('5');
    });

    test('Export functions trigger downloads', async ({ page }) => {
      await page.goto('/algorithms/symmetry/zellige-pattern.html');
      
      // Test SVG export
      const svgDownloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export SVG")');
      const svgDownload = await svgDownloadPromise;
      expect(svgDownload.suggestedFilename()).toMatch(/zellige-pattern-\d+\.svg$/);
      
      // Test PNG export
      const pngDownloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export PNG")');
      const pngDownload = await pngDownloadPromise;
      expect(pngDownload.suggestedFilename()).toMatch(/zellige-pattern-\d+\.png$/);
    });
  });

  test.describe('Kumiko Pattern Generator', () => {
    test('Kumiko page loads correctly', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      // Check page loaded
      await expect(page.locator('h2')).toContainText('Kumiko Pattern Generator');
      await expect(page.locator('.pattern-info')).toContainText('Japanese woodworking technique');
      
      // Check control sections
      await expect(page.locator('h3:has-text("Pattern Type")')).toBeVisible();
      await expect(page.locator('h3:has-text("Grid Properties")')).toBeVisible();
      await expect(page.locator('h3:has-text("Visual Style")')).toBeVisible();
      await expect(page.locator('h3:has-text("Variations")')).toBeVisible();
    });

    test('Kumiko patterns can be selected', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      const patternSelect = page.locator('#patternType');
      
      // Check available patterns
      const options = await patternSelect.locator('option').allTextContents();
      expect(options).toEqual([
        'Asanoha (Hemp Leaf)',
        'Seigaiha (Blue Ocean Waves)',
        'Shippo (Seven Treasures)',
        'Yosegi (Parquet)',
        'Kikko (Tortoise Shell)',
        'Sakura (Cherry Blossom)'
      ]);
      
      // Test changing patterns
      await patternSelect.selectOption('seigaiha');
      await expect(patternSelect).toHaveValue('seigaiha');
      
      await patternSelect.selectOption('sakura');
      await expect(patternSelect).toHaveValue('sakura');
    });

    test('Wood effect options work', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      // Check visual options
      const showJoints = page.locator('#showJoints');
      const showOverUnder = page.locator('#showOverUnder');
      const showGrid = page.locator('#showGrid');
      const doubleLines = page.locator('#doubleLines');
      
      // Check default states
      await expect(showJoints).toBeChecked();
      await expect(showOverUnder).toBeChecked();
      await expect(showGrid).not.toBeChecked();
      await expect(doubleLines).not.toBeChecked();
      
      // Toggle double lines for wood effect
      await doubleLines.check();
      await expect(doubleLines).toBeChecked();
    });

    test('Grid and line properties update', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      // Test module size
      const moduleSize = page.locator('#moduleSize');
      await moduleSize.fill('80');
      await expect(page.locator('#moduleSize-value')).toHaveText('80');
      
      // Test line thickness
      const lineThickness = page.locator('#lineThickness');
      await lineThickness.fill('5');
      await expect(page.locator('#lineThickness-value')).toHaveText('5');
      
      // Test joint size
      const jointSize = page.locator('#jointSize');
      await jointSize.fill('7');
      await expect(page.locator('#jointSize-value')).toHaveText('7');
    });

    test('Rotation and offset controls work', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      // Test rotation
      const rotation = page.locator('#rotation');
      await rotation.fill('45');
      await expect(page.locator('#rotation-value')).toHaveText('45');
      
      // Test offset X
      const offsetX = page.locator('#offsetX');
      await offsetX.fill('20');
      await expect(page.locator('#offsetX-value')).toHaveText('20');
      
      // Test offset Y
      const offsetY = page.locator('#offsetY');
      await offsetY.fill('-20');
      await expect(page.locator('#offsetY-value')).toHaveText('-20');
    });

    test('Randomize generates different patterns', async ({ page }) => {
      await page.goto('/algorithms/symmetry/kumiko-pattern.html');
      
      // Get initial values
      const initialDensity = await page.locator('#density').inputValue();
      const initialSize = await page.locator('#moduleSize').inputValue();
      
      // Randomize
      await page.click('button:has-text("Randomize")');
      
      // Check values changed
      const newDensity = await page.locator('#density').inputValue();
      const newSize = await page.locator('#moduleSize').inputValue();
      
      // At least one value should be different
      const valuesChanged = initialDensity !== newDensity || initialSize !== newSize;
      expect(valuesChanged).toBe(true);
    });
  });
});