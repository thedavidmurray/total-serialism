const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  test('SquiggleCam handles large images efficiently', async ({ page }) => {
    await page.goto('/algorithms/image-processing/squigglecam.html');
    
    // Create large test image (1000x1000)
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
      gradient.addColorStop(0, 'black');
      gradient.addColorStop(1, 'white');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1000, 1000);
      
      // Convert to blob and create file
      canvas.toBlob(blob => {
        const file = new File([blob], 'large-test.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        const fileInput = document.getElementById('imageUpload');
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    
    // Wait for image to load
    await page.waitForTimeout(1000);
    
    // Time the generation
    const startTime = Date.now();
    await page.click('button:has-text("Generate Squiggles")');
    
    // Wait for completion
    await expect(page.locator('#processing-status')).toContainText('generated successfully', { timeout: 10000 });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 10 seconds for large image
    expect(duration).toBeLessThan(10000);
    
    // Check memory usage didn't explode
    const metrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    if (metrics) {
      // Heap usage should be reasonable (less than 500MB)
      expect(metrics.usedJSHeapSize).toBeLessThan(500 * 1024 * 1024);
    }
  });

  test('Path optimizer handles complex paths efficiently', async ({ page }) => {
    await page.goto('/algorithms/geometric/spiral-fill.html');
    
    // Set very high complexity
    await page.fill('#turns', '50');
    await page.fill('#spacing', '2');
    await page.selectOption('#spiralType', 'fermat');
    await page.click('#optimizePaths');
    
    // Measure optimization time
    const startTime = Date.now();
    await page.click('button:has-text("Generate Spiral Fill")');
    
    await expect(page.locator('#processing-status')).toContainText('generated successfully');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Get path statistics
    const stats = await page.evaluate(() => {
      const pointCount = document.getElementById('pointCountStat').textContent;
      const pathLength = document.getElementById('pathLengthStat').textContent;
      return { pointCount, pathLength };
    });
    
    console.log(`Generated ${stats.pointCount} points in ${duration}ms`);
    
    // Should handle thousands of points in reasonable time
    expect(duration).toBeLessThan(5000);
  });

  test('Multiple algorithms can run concurrently', async ({ context }) => {
    // Open multiple algorithms in different tabs
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);
    
    // Navigate to different algorithms
    await Promise.all([
      pages[0].goto('/algorithms/image-processing/squigglecam.html'),
      pages[1].goto('/algorithms/image-processing/hatching.html'),
      pages[2].goto('/algorithms/geometric/spiral-fill.html')
    ]);
    
    // Generate in all tabs simultaneously
    const generations = Promise.all([
      pages[0].click('button:has-text("Generate Squiggles")'),
      pages[1].click('button:has-text("Generate Hatching")'),
      pages[2].click('button:has-text("Generate Spiral Fill")')
    ]);
    
    // All should complete without errors
    await generations;
    
    // Verify all completed successfully
    for (const page of pages) {
      await expect(page.locator('#processing-status')).toContainText('successfully');
    }
    
    // Close pages
    await Promise.all(pages.map(p => p.close()));
  });
});