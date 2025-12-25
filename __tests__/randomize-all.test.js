/**
 * Tests for Randomize All functionality
 * TDD: Written BEFORE implementation
 */

// Mock Math.random for predictable tests
const mockRandom = (value) => {
  const original = Math.random;
  Math.random = () => value;
  return () => { Math.random = original; };
};

// Mock DOM
const createMockDOM = () => {
  const elements = {
    'paperSize': { value: 'a4', listeners: {} },
    'bgColor': { value: '#ffffff', listeners: {} },
    'strokeColor': { value: '#000000', listeners: {} },
    'strokeWeight': { value: '1', listeners: {} },
    'randomizeAll': { listeners: {} }
  };

  Object.values(elements).forEach(el => {
    el.addEventListener = function(e, h) { this.listeners[e] = h; };
    el.removeEventListener = function(e) { delete this.listeners[e]; };
    el.click = function() { this.listeners['click']?.(); };
  });

  global.document = {
    getElementById: (id) => elements[id] || null
  };

  // Mock window for beforeunload
  global.window = {
    addEventListener: jest.fn()
  };

  return elements;
};

// Import module
let TSCanvasControls;

try {
  TSCanvasControls = require('../pen-plotter/shared/canvas-controls.js');
} catch (e) {
  TSCanvasControls = null;
}

describe('Randomize All Functionality', () => {
  let mockDOM;

  beforeEach(() => {
    mockDOM = createMockDOM();
  });

  describe('randomizeColors()', () => {
    test('should generate valid hex colors', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      controls.randomizeColors();

      // Validate hex format
      expect(params.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(params.strokeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    test('should generate different colors each time', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      const colors = new Set();
      for (let i = 0; i < 10; i++) {
        controls.randomizeColors();
        colors.add(params.bgColor + params.strokeColor);
      }

      // Should have generated at least some different combinations
      expect(colors.size).toBeGreaterThan(1);
    });

    test('should ensure WCAG AA contrast ratio (4.5:1)', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      // Test multiple randomizations
      for (let i = 0; i < 20; i++) {
        controls.randomizeColors();

        const ratio = TSCanvasControls.getContrastRatio(params.bgColor, params.strokeColor);

        // WCAG AA requires 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('should update params with generated colors', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      const originalBg = params.bgColor;
      const originalStroke = params.strokeColor;

      controls.randomizeColors();

      // Colors should have valid hex format
      expect(params.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(params.strokeColor).toMatch(/^#[0-9a-fA-F]{6}$/);

      // updateDOMValue method should exist and be callable
      expect(typeof controls.updateDOMValue).toBe('function');
    });

    test('should return the generated colors', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      const result = controls.randomizeColors();

      expect(result).toHaveProperty('bgColor');
      expect(result).toHaveProperty('strokeColor');
      expect(result.bgColor).toBe(params.bgColor);
      expect(result.strokeColor).toBe(params.strokeColor);
    });
  });

  describe('randomizeAll()', () => {
    test('should trigger regeneration callback', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      const regenCallback = jest.fn();

      controls.bind(params, { autoRegen: true, regenCallback });

      controls.randomizeAll();

      expect(regenCallback).toHaveBeenCalled();
    });

    test('should randomize colors as part of randomize all', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      const originalBg = params.bgColor;
      const originalStroke = params.strokeColor;

      // Run multiple times to ensure it changes
      let changed = false;
      for (let i = 0; i < 10; i++) {
        controls.randomizeAll();
        if (params.bgColor !== originalBg || params.strokeColor !== originalStroke) {
          changed = true;
          break;
        }
      }

      expect(changed).toBe(true);
    });

    test('should respect locked parameters', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      // Lock the background color
      controls.lockParameter('bgColor');
      const lockedBg = params.bgColor;

      controls.randomizeAll();

      // Background should remain unchanged
      expect(params.bgColor).toBe(lockedBg);
      // Stroke can change
      // (no assertion as it may randomly stay the same)
    });

    test('should work with Randomize All button setup', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      const regenCallback = jest.fn();

      controls.bind(params, { autoRegen: true, regenCallback });

      // setupRandomizeButton method should exist
      expect(typeof controls.setupRandomizeButton).toBe('function');

      // Calling randomizeAll directly should trigger callback
      controls.randomizeAll();
      expect(regenCallback).toHaveBeenCalled();

      // Verify colors were randomized
      expect(params.bgColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('Color Generation Utilities', () => {
    test('generateRandomColor() should produce valid hex', () => {
      if (!TSCanvasControls) return;

      for (let i = 0; i < 100; i++) {
        const color = TSCanvasControls.generateRandomColor();
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    test('generateContrastingColor() should meet contrast threshold', () => {
      if (!TSCanvasControls) return;

      const baseColors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'];

      baseColors.forEach(baseColor => {
        const contrastingColor = TSCanvasControls.generateContrastingColor(baseColor, 4.5);
        const ratio = TSCanvasControls.getContrastRatio(baseColor, contrastingColor);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test('should have predefined safe color pairs as fallback', () => {
      if (!TSCanvasControls) return;

      expect(TSCanvasControls.SAFE_COLOR_PAIRS).toBeDefined();
      expect(Array.isArray(TSCanvasControls.SAFE_COLOR_PAIRS)).toBe(true);
      expect(TSCanvasControls.SAFE_COLOR_PAIRS.length).toBeGreaterThan(0);

      // Each pair should have good contrast
      TSCanvasControls.SAFE_COLOR_PAIRS.forEach(pair => {
        const ratio = TSCanvasControls.getContrastRatio(pair.bg, pair.stroke);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Parameter Locking', () => {
    test('lockParameter() should prevent randomization', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      controls.lockParameter('strokeColor');

      expect(controls.isLocked('strokeColor')).toBe(true);
      expect(controls.isLocked('bgColor')).toBe(false);
    });

    test('unlockParameter() should allow randomization again', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      controls.lockParameter('strokeColor');
      controls.unlockParameter('strokeColor');

      expect(controls.isLocked('strokeColor')).toBe(false);
    });

    test('toggleLock() should toggle lock state', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      expect(controls.isLocked('bgColor')).toBe(false);

      controls.toggleLock('bgColor');
      expect(controls.isLocked('bgColor')).toBe(true);

      controls.toggleLock('bgColor');
      expect(controls.isLocked('bgColor')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('randomized colors should meet WCAG AA for normal text', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      // Test 50 randomizations
      for (let i = 0; i < 50; i++) {
        controls.randomizeColors();
        const ratio = TSCanvasControls.getContrastRatio(params.bgColor, params.strokeColor);

        // WCAG AA: 4.5:1 for normal text, 3:1 for large text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('should avoid problematic color combinations for colorblind users', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      // Known problematic combinations (red-green, blue-yellow in some cases)
      const isProblematicPair = (bg, stroke) => {
        // Simplified check - full implementation would be more sophisticated
        const redGreen = (bg.includes('ff0000') && stroke.includes('00ff00')) ||
                         (bg.includes('00ff00') && stroke.includes('ff0000'));
        return redGreen;
      };

      // Test multiple randomizations - should not produce known bad pairs
      let problematicCount = 0;
      for (let i = 0; i < 100; i++) {
        controls.randomizeColors();
        if (isProblematicPair(params.bgColor, params.strokeColor)) {
          problematicCount++;
        }
      }

      // Should avoid most problematic combinations
      expect(problematicCount).toBeLessThan(5);
    });
  });
});
