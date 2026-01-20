const { test, expect } = require('@playwright/test');

test.describe('Flow Field Collision Detection Tests', () => {
  test('Flow Field Collision page loads correctly', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Check page loaded
    await expect(page.locator('h2')).toContainText('Flow Field with Collision');
    await expect(page.locator('p')).toContainText('Particles avoid crossing existing paths');
    
    // Check control sections exist
    await expect(page.locator('h3:has-text("Flow Field")')).toBeVisible();
    await expect(page.locator('h3:has-text("Particles")')).toBeVisible();
    await expect(page.locator('h3:has-text("Collision Detection")')).toBeVisible();
    await expect(page.locator('h3:has-text("Visual Style")')).toBeVisible();
    await expect(page.locator('h3:has-text("Controls")')).toBeVisible();
  });

  test('Collision detection options are functional', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Check collision detection controls
    const enableCollision = page.locator('#enableCollision');
    const showCollisionGrid = page.locator('#showCollisionGrid');
    const dynamicAvoidance = page.locator('#dynamicAvoidance');
    
    // Verify default states
    await expect(enableCollision).toBeChecked();
    await expect(showCollisionGrid).not.toBeChecked();
    await expect(dynamicAvoidance).toBeChecked();
    
    // Test toggling collision detection
    await enableCollision.uncheck();
    await expect(enableCollision).not.toBeChecked();
    
    // Test showing collision grid
    await showCollisionGrid.check();
    await expect(showCollisionGrid).toBeChecked();
    
    // Check detection radius control
    const detectionRadius = page.locator('#detectionRadius');
    await expect(detectionRadius).toHaveValue('3');
    
    // Change detection radius
    await detectionRadius.fill('5');
    await expect(page.locator('#detectionRadius-value')).toHaveText('5');
  });

  test('Flow field types can be changed', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    const fieldTypeSelect = page.locator('#fieldType');
    
    // Check available options
    const options = await fieldTypeSelect.locator('option').allTextContents();
    expect(options).toEqual(['Curl Noise', 'Perlin Noise', 'Turbulent', 'Radial', 'Spiral']);
    
    // Change field type
    await fieldTypeSelect.selectOption('radial');
    await expect(fieldTypeSelect).toHaveValue('radial');
    
    await fieldTypeSelect.selectOption('spiral');
    await expect(fieldTypeSelect).toHaveValue('spiral');
  });

  test('Particle spawn patterns work correctly', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    const spawnPatternSelect = page.locator('#spawnPattern');
    
    // Check available patterns
    const patterns = await spawnPatternSelect.locator('option').allTextContents();
    expect(patterns).toEqual(['Random', 'Edges', 'Center', 'Circle', 'Grid']);
    
    // Test changing patterns
    await spawnPatternSelect.selectOption('circle');
    await expect(spawnPatternSelect).toHaveValue('circle');
    
    await spawnPatternSelect.selectOption('grid');
    await expect(spawnPatternSelect).toHaveValue('grid');
  });

  test('Statistics are displayed and updated', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Wait for initial particles
    await page.waitForTimeout(1000);
    
    // Check statistics are visible
    const stats = page.locator('#stats');
    await expect(stats).toBeVisible();
    
    // Check active particles count
    const activeParticles = page.locator('#activeParticles');
    await expect(activeParticles).not.toHaveText('0');
    
    // Check that statistics update
    const initialCount = await activeParticles.textContent();
    await page.waitForTimeout(2000);
    const updatedCount = await activeParticles.textContent();
    
    // Particles should be changing as they spawn and die
    expect(initialCount).not.toBe(updatedCount);
  });

  test('Generate and clear functions work', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Generate new field
    await page.click('button:has-text("Generate New Field")');
    await expect(page.locator('#processing-status')).toContainText('Flow field generated');
    
    // Clear canvas
    await page.click('button:has-text("Clear Canvas")');
    await expect(page.locator('#processing-status')).toContainText('Canvas cleared');
    
    // Check collision counter reset
    await expect(page.locator('#collisionsAvoided')).toHaveText('0');
  });

  test('Pause/resume functionality works', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    const pauseBtn = page.locator('#pauseBtn');
    
    // Initially should say "Pause"
    await expect(pauseBtn).toHaveText('Pause');
    
    // Click to pause
    await pauseBtn.click();
    await expect(pauseBtn).toHaveText('Resume');
    await expect(page.locator('#processing-status')).toContainText('Simulation paused');
    
    // Click to resume
    await pauseBtn.click();
    await expect(pauseBtn).toHaveText('Pause');
    await expect(page.locator('#processing-status')).toContainText('Simulation resumed');
  });

  test('Visual style controls update display', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Test line weight
    const lineWeight = page.locator('#lineWeight');
    await lineWeight.fill('2');
    await expect(page.locator('#lineWeight-value')).toHaveText('2');
    
    // Test opacity
    const opacity = page.locator('#opacity');
    await opacity.fill('50');
    await expect(page.locator('#opacity-value')).toHaveText('50');
    
    // Test visual toggles
    const fadeTrails = page.locator('#fadeTrails');
    const colorBySpeed = page.locator('#colorBySpeed');
    const showParticles = page.locator('#showParticles');
    
    await expect(fadeTrails).toBeChecked();
    await expect(colorBySpeed).not.toBeChecked();
    await expect(showParticles).not.toBeChecked();
    
    // Toggle options
    await colorBySpeed.check();
    await expect(colorBySpeed).toBeChecked();
    
    await showParticles.check();
    await expect(showParticles).toBeChecked();
  });

  test('Export SVG button triggers download', async ({ page, context }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Wait for download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export SVG")');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/flow-field-collision\.svg$/);
    
    // Check success message
    await expect(page.locator('#processing-status')).toContainText('SVG exported successfully');
  });

  test('Time evolution updates flow field', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    const timeEvolution = page.locator('#timeEvolution');
    
    // Initially should be 0
    await expect(timeEvolution).toHaveValue('0');
    await expect(page.locator('#timeEvolution-value')).toHaveText('0.0');
    
    // Set time evolution
    await timeEvolution.fill('0.01');
    await expect(page.locator('#timeEvolution-value')).toHaveText('0.01');
    
    // Flow field should be updating over time when non-zero
    await page.waitForTimeout(2000);
  });

  test('Collision avoidance parameters affect behavior', async ({ page }) => {
    await page.goto('/algorithms/flow-fields/flow-field-collision.html');
    
    // Test avoidance strength
    const avoidanceStrength = page.locator('#avoidanceStrength');
    await avoidanceStrength.fill('1.5');
    await expect(page.locator('#avoidanceStrength-value')).toHaveText('1.5');
    
    // Test grid resolution
    const gridResolution = page.locator('#gridResolution');
    await gridResolution.fill('20');
    await expect(page.locator('#gridResolution-value')).toHaveText('20');
    
    // Generate new field with new parameters
    await page.click('button:has-text("Generate New Field")');
    
    // Wait for collisions to be detected
    await page.waitForTimeout(3000);
    
    // Should have some collisions avoided
    const collisionsAvoided = await page.locator('#collisionsAvoided').textContent();
    expect(parseInt(collisionsAvoided)).toBeGreaterThan(0);
  });
});