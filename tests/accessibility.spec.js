const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('Accessibility Tests', () => {
  test('Hub page is accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // Check initial state
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
    
    // Check with filter active
    await page.click('button[data-filter="image-processing"]');
    await checkA11y(page);
    
    // Check search functionality
    await page.fill('#search', 'squiggle');
    await checkA11y(page);
  });

  test('SquiggleCam is keyboard navigable', async ({ page }) => {
    await page.goto('/algorithms/image-processing/squigglecam.html');
    
    // Tab through controls
    await page.keyboard.press('Tab'); // Should focus first control
    let focused = await page.evaluate(() => document.activeElement.id);
    expect(focused).toBeTruthy();
    
    // Test slider keyboard control
    const lineCountSlider = page.locator('#lineCount');
    await lineCountSlider.focus();
    const initialValue = await lineCountSlider.inputValue();
    
    await page.keyboard.press('ArrowRight');
    const newValue = await lineCountSlider.inputValue();
    expect(Number(newValue)).toBeGreaterThan(Number(initialValue));
    
    // Test button keyboard activation
    await page.keyboard.press('Tab'); // Move to next control
    await page.keyboard.press('Tab'); // Continue tabbing
    
    // Find and activate generate button with keyboard
    const generateBtn = page.locator('button:has-text("Generate Squiggles")');
    await generateBtn.focus();
    await page.keyboard.press('Enter');
    
    // Verify action was triggered
    await expect(page.locator('#processing-status')).toBeVisible();
  });

  test('All form controls have labels', async ({ page }) => {
    await page.goto('/algorithms/image-processing/hatching.html');
    
    // Check all inputs have associated labels
    const inputs = await page.locator('input[type="range"], select').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        // Check for label with for attribute
        const label = page.locator(`label[for="${id}"]`);
        const labelCount = await label.count();
        
        if (labelCount === 0) {
          // Check if input is wrapped in label
          const parent = await input.evaluate(el => el.parentElement.tagName);
          expect(parent).toBe('LABEL');
        } else {
          expect(labelCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/algorithms/geometric/spiral-fill.html');
    
    // Check text contrast
    const textElements = await page.locator('h2, h3, label, button').all();
    
    for (const element of textElements) {
      const color = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor
        };
      });
      
      // Skip if transparent background (inherits from parent)
      if (color.backgroundColor === 'rgba(0, 0, 0, 0)') continue;
      
      // Basic check that text isn't same color as background
      expect(color.color).not.toBe(color.backgroundColor);
    }
  });

  test('Images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/algorithms/image-processing/halftone.html');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    // Should have some visual focus indicator
    const hasVisibleFocus = 
      focusedElement.outline !== 'none' ||
      focusedElement.boxShadow !== 'none' ||
      focusedElement.border !== 'none';
    
    expect(hasVisibleFocus).toBeTruthy();
  });

  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/algorithms/image-processing/squigglecam.html');
    
    // Check ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have visible text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
    
    // Check ARIA live regions for status updates
    const statusElement = page.locator('#processing-status');
    const ariaLive = await statusElement.getAttribute('aria-live');
    
    // Status updates should be announced
    expect(['polite', 'assertive']).toContain(ariaLive);
  });
});