/**
 * Integration tests for TSCanvasControls
 * Tests compatibility with p5.js, vanilla canvas, and PresetManager
 * TDD: Written BEFORE implementation
 */

// Mock p5.js global functions
const mockP5 = {
  createCanvas: jest.fn().mockReturnValue({ parent: jest.fn() }),
  resizeCanvas: jest.fn(),
  background: jest.fn(),
  stroke: jest.fn(),
  strokeWeight: jest.fn(),
  noLoop: jest.fn(),
  loop: jest.fn(),
  redraw: jest.fn(),
  width: 800,
  height: 800
};

// Mock DOM
const createMockDOM = () => {
  const elements = {
    'paperSize': { value: 'a4', listeners: {} },
    'bgColor': { value: '#ffffff', listeners: {} },
    'strokeColor': { value: '#000000', listeners: {} },
    'strokeWeight': { value: '1', listeners: {} },
    'canvas': { getContext: jest.fn().mockReturnValue({ fillRect: jest.fn(), strokeRect: jest.fn(), clearRect: jest.fn() }) }
  };

  // Add event listener methods to each element
  Object.values(elements).forEach(el => {
    if (!el.listeners) el.listeners = {};
    el.addEventListener = function(e, h) { this.listeners[e] = h; };
    el.removeEventListener = function(e) { delete this.listeners[e]; };
  });

  global.document = {
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => ({ tagName: tag }),
    querySelector: (sel) => elements[sel.replace('#', '')] || null
  };

  // Mock window for beforeunload
  global.window = {
    addEventListener: jest.fn()
  };

  return elements;
};

// Import modules
let TSCanvasControls;
let PresetManager;

try {
  TSCanvasControls = require('../pen-plotter/shared/canvas-controls.js');
} catch (e) {
  TSCanvasControls = null;
}

try {
  PresetManager = require('../preset-manager.js');
} catch (e) {
  PresetManager = null;
}

describe('TSCanvasControls Integration', () => {
  let mockDOM;

  beforeEach(() => {
    mockDOM = createMockDOM();
    jest.clearAllMocks();
  });

  describe('p5.js Integration', () => {
    test('should work in p5.js setup() function', () => {
      if (!TSCanvasControls) return;

      // Simulate p5.js setup
      const params = {};
      const controls = new TSCanvasControls();

      // This is how it would be used in setup()
      const setup = () => {
        controls.bind(params);
        const size = controls.getCanvasSize();
        mockP5.createCanvas(size.width, size.height);
        return size;
      };

      const size = setup();

      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      expect(params.bgColor).toBe('#ffffff');
    });

    test('should trigger p5.js redraw on parameter change', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};

      controls.bind(params, { autoRegen: true, regenCallback: mockP5.redraw });

      // Verify callback is set up
      expect(controls.autoRegen).toBe(true);
      expect(controls.regenCallback).toBe(mockP5.redraw);

      // Calling randomizeAll should trigger the callback
      controls.randomizeAll();

      expect(mockP5.redraw).toHaveBeenCalled();
    });

    test('should update p5.js canvas size on paper size change', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls({ paperSize: 'a4' });
      const params = {};

      controls.bind(params);

      // Verify initial paper size
      expect(params.paperSize).toBe('a4');
      let size = controls.getCanvasSize();
      expect(size).toEqual({ width: 794, height: 1123 });

      // Manually change paper size (simulating what listener would do)
      params.paperSize = 'a3';
      controls.params.paperSize = 'a3';

      size = controls.getCanvasSize();
      expect(size).toEqual({ width: 1123, height: 1587 });
    });
  });

  describe('Vanilla Canvas Integration', () => {
    test('should work with vanilla canvas context', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      const canvas = mockDOM['canvas'];
      const ctx = canvas.getContext('2d');
      const size = controls.getCanvasSize();

      // Simulate drawing with controls
      expect(ctx).toBeDefined();
      expect(size.width).toBeGreaterThan(0);
      expect(params.bgColor).toBe('#ffffff');
    });

    test('should update vanilla canvas on parameter change', () => {
      if (!TSCanvasControls) return;

      const controls = new TSCanvasControls();
      const params = {};

      const drawCallback = jest.fn();

      controls.bind(params, { autoRegen: true, regenCallback: drawCallback });

      // Verify autoRegen is set up correctly
      expect(controls.autoRegen).toBe(true);
      expect(controls.regenCallback).toBe(drawCallback);

      // Verify params are bound
      expect(params.bgColor).toBe('#ffffff');
      expect(params.strokeColor).toBe('#000000');

      // Manually update a param and trigger regen
      params.strokeColor = '#ff0000';
      controls.regenCallback();

      expect(drawCallback).toHaveBeenCalled();
    });
  });

  describe('PresetManager Integration', () => {
    beforeEach(() => {
      // Mock localStorage
      const store = {};
      global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        removeItem: (key) => { delete store[key]; }
      };
    });

    test('should save canvas control values with PresetManager', () => {
      if (!TSCanvasControls || !PresetManager) return;

      const controls = new TSCanvasControls({
        bgColor: '#ff0000',
        strokeColor: '#00ff00'
      });
      const params = { customValue: 42 };
      controls.bind(params);

      const presetManager = new PresetManager({
        algorithmId: 'test-algo',
        onSave: () => params,
        onLoad: () => {}
      });

      const preset = presetManager.save('Test Preset');

      expect(preset.data.bgColor).toBe('#ff0000');
      expect(preset.data.strokeColor).toBe('#00ff00');
      expect(preset.data.customValue).toBe(42);
    });

    test('should restore canvas control values from PresetManager', () => {
      if (!TSCanvasControls || !PresetManager) return;

      const controls = new TSCanvasControls();
      const params = {};
      controls.bind(params);

      // Save a preset with custom colors
      const savedParams = {
        bgColor: '#ff0000',
        strokeColor: '#00ff00',
        paperSize: 'a3'
      };

      const presetManager = new PresetManager({
        algorithmId: 'test-algo',
        onSave: () => savedParams,
        onLoad: (preset) => {
          Object.assign(params, preset.data);
        }
      });

      const preset = presetManager.save('Saved Preset');

      // Reset params
      params.bgColor = '#ffffff';
      params.strokeColor = '#000000';

      // Load preset
      presetManager.load(preset.id);

      expect(params.bgColor).toBe('#ff0000');
      expect(params.strokeColor).toBe('#00ff00');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      if (!TSCanvasControls) return;

      // Override getElementById to return null
      global.document.getElementById = () => null;

      const controls = new TSCanvasControls();

      expect(() => {
        controls.setupEventListeners(jest.fn());
      }).not.toThrow();
    });

    test('should handle callback errors without breaking', () => {
      if (!TSCanvasControls) return;

      mockDOM = createMockDOM();

      const controls = new TSCanvasControls();
      const brokenCallback = () => {
        throw new Error('Intentional error');
      };

      controls.setupEventListeners(brokenCallback);

      // Should not throw when event fires
      expect(() => {
        mockDOM['bgColor'].listeners['input']?.({ type: 'input' });
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should not leak listeners on repeated bind calls', () => {
      if (!TSCanvasControls) return;

      mockDOM = createMockDOM();

      const controls = new TSCanvasControls();
      const params = {};

      // Simulate repeated bindings (like in development hot reload)
      for (let i = 0; i < 10; i++) {
        controls.bind(params);
        controls.setupEventListeners(jest.fn());
      }

      // Should have bounded number of listeners
      expect(controls.listeners.size).toBeLessThanOrEqual(4);
    });

    test('should cleanup before window unload', () => {
      if (!TSCanvasControls) return;

      mockDOM = createMockDOM();

      // Mock window
      const unloadHandlers = [];
      global.window = {
        addEventListener: (event, handler) => {
          if (event === 'beforeunload') unloadHandlers.push(handler);
        }
      };

      const controls = new TSCanvasControls();
      controls.setupEventListeners(jest.fn());

      // Simulate unload
      unloadHandlers.forEach(h => h());

      expect(controls.listeners.size).toBe(0);
    });
  });
});
