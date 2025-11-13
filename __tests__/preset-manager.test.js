/**
 * Unit tests for PresetManager
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

global.localStorage = localStorageMock;

const PresetManager = require('../preset-manager.js');

describe('PresetManager', () => {
  let presetManager;
  let testParams;

  beforeEach(() => {
    localStorage.clear();

    testParams = {
      density: 50,
      speed: 2.5,
      color: '#4CAF50'
    };

    presetManager = new PresetManager({
      algorithmId: 'test-algorithm',
      onSave: () => testParams,
      onLoad: (preset) => {
        testParams = { ...preset.data };
      }
    });
  });

  describe('Constructor', () => {
    test('should initialize with config', () => {
      expect(presetManager.algorithmId).toBe('test-algorithm');
      expect(presetManager.onSave).toBeDefined();
      expect(presetManager.onLoad).toBeDefined();
    });

    test('should have default algorithm ID', () => {
      const manager = new PresetManager({
        onSave: () => ({}),
        onLoad: () => {}
      });
      expect(manager.algorithmId).toBe('default');
    });

    test('should load existing presets from storage', () => {
      const existingPresets = [
        {
          id: '123',
          name: 'Test Preset',
          data: { value: 42 },
          timestamp: new Date().toISOString()
        }
      ];

      localStorage.setItem(
        'total-serialism-presets-test-algorithm',
        JSON.stringify(existingPresets)
      );

      const manager = new PresetManager({
        algorithmId: 'test-algorithm',
        onSave: () => ({}),
        onLoad: () => {}
      });

      expect(manager.presets.length).toBe(1);
      expect(manager.presets[0].name).toBe('Test Preset');
    });
  });

  describe('save', () => {
    test('should save preset with name', () => {
      const preset = presetManager.save('My Test Preset');

      expect(preset.name).toBe('My Test Preset');
      expect(preset.data).toEqual(testParams);
      expect(preset.id).toBeDefined();
      expect(preset.timestamp).toBeDefined();
      expect(presetManager.presets.length).toBe(1);
    });

    test('should throw error for empty name', () => {
      expect(() => presetManager.save('')).toThrow('Preset name is required');
      expect(() => presetManager.save('   ')).toThrow('Preset name is required');
    });

    test('should overwrite existing preset with same name', () => {
      presetManager.save('Test');
      testParams.density = 100;
      presetManager.save('Test');

      expect(presetManager.presets.length).toBe(1);
      expect(presetManager.presets[0].data.density).toBe(100);
    });

    test('should trim whitespace from name', () => {
      const preset = presetManager.save('  Test Name  ');
      expect(preset.name).toBe('Test Name');
    });

    test('should add preset to beginning of list', () => {
      presetManager.save('First');
      presetManager.save('Second');

      expect(presetManager.presets[0].name).toBe('Second');
      expect(presetManager.presets[1].name).toBe('First');
    });
  });

  describe('load', () => {
    test('should load preset by ID', () => {
      const saved = presetManager.save('Test Preset');

      testParams = { density: 0 }; // Change params
      presetManager.load(saved.id);

      expect(testParams.density).toBe(50); // Restored
    });

    test('should throw error for non-existent ID', () => {
      expect(() => presetManager.load('nonexistent')).toThrow('Preset not found');
    });
  });

  describe('delete', () => {
    test('should delete preset by ID', () => {
      const preset = presetManager.save('To Delete');
      expect(presetManager.presets.length).toBe(1);

      presetManager.delete(preset.id);
      expect(presetManager.presets.length).toBe(0);
    });

    test('should handle non-existent ID gracefully', () => {
      expect(() => presetManager.delete('nonexistent')).not.toThrow();
    });
  });

  describe('rename', () => {
    test('should rename preset', () => {
      const preset = presetManager.save('Old Name');
      presetManager.rename(preset.id, 'New Name');

      expect(presetManager.presets[0].name).toBe('New Name');
    });

    test('should trim whitespace when renaming', () => {
      const preset = presetManager.save('Test');
      presetManager.rename(preset.id, '  Renamed  ');

      expect(presetManager.presets[0].name).toBe('Renamed');
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      // Mock window.confirm
      global.confirm = jest.fn(() => true);
    });

    test('should clear all presets with confirmation', () => {
      presetManager.save('Preset 1');
      presetManager.save('Preset 2');

      presetManager.clear();

      expect(presetManager.presets.length).toBe(0);
      expect(global.confirm).toHaveBeenCalled();
    });

    test('should not clear if user cancels', () => {
      global.confirm = jest.fn(() => false);

      presetManager.save('Preset 1');
      presetManager.clear();

      expect(presetManager.presets.length).toBe(1);
    });
  });

  describe('exportPreset', () => {
    test('should export preset as JSON', () => {
      const preset = presetManager.save('Export Test');

      // Mock document and URL APIs
      global.document = {
        createElement: jest.fn(() => ({
          click: jest.fn(),
          href: '',
          download: ''
        }))
      };

      global.URL = {
        createObjectURL: jest.fn(() => 'blob:test'),
        revokeObjectURL: jest.fn()
      };

      presetManager.exportPreset(preset.id);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Storage persistence', () => {
    test('should persist to localStorage on save', () => {
      presetManager.save('Persistent Test');

      const stored = localStorage.getItem('total-serialism-presets-test-algorithm');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('Persistent Test');
    });

    test('should load from localStorage on init', () => {
      presetManager.save('Test 1');
      presetManager.save('Test 2');

      // Create new manager with same algorithm ID
      const newManager = new PresetManager({
        algorithmId: 'test-algorithm',
        onSave: () => ({}),
        onLoad: () => {}
      });

      expect(newManager.presets.length).toBe(2);
    });

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('total-serialism-presets-corrupted', 'invalid json');

      const manager = new PresetManager({
        algorithmId: 'corrupted',
        onSave: () => ({}),
        onLoad: () => {}
      });

      expect(manager.presets).toEqual([]);
    });
  });

  describe('escapeHtml', () => {
    test('should escape HTML entities', () => {
      const escaped = presetManager.escapeHtml('<script>alert("xss")</script>');
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    test('should handle special characters', () => {
      const escaped = presetManager.escapeHtml('Test & "quotes" \'single\'');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
    });
  });

  describe('import', () => {
    test('should import preset from JSON', async () => {
      const presetData = {
        id: 'imported-1',
        name: 'Imported Preset',
        data: { value: 123 },
        timestamp: new Date().toISOString(),
        algorithmId: 'test-algorithm'
      };

      const jsonString = JSON.stringify(presetData);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Mock File API
      const file = new File([blob], 'preset.json', { type: 'application/json' });

      const imported = await presetManager.import(file);

      expect(imported.length).toBe(1);
      expect(imported[0].name).toBe('Imported Preset');
      expect(presetManager.presets.length).toBe(1);
    });

    test('should import array of presets', async () => {
      const presetArray = [
        {
          id: '1',
          name: 'Preset 1',
          data: {},
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Preset 2',
          data: {},
          timestamp: new Date().toISOString()
        }
      ];

      const jsonString = JSON.stringify(presetArray);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'presets.json', { type: 'application/json' });

      const imported = await presetManager.import(file);

      expect(imported.length).toBe(2);
      expect(presetManager.presets.length).toBe(2);
    });

    test('should handle name conflicts on import', async () => {
      presetManager.save('Test Preset');

      const importData = {
        id: 'import-1',
        name: 'Test Preset',
        data: {},
        timestamp: new Date().toISOString()
      };

      const jsonString = JSON.stringify(importData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'preset.json', { type: 'application/json' });

      await presetManager.import(file);

      // Should have both, with imported one renamed
      expect(presetManager.presets.length).toBe(2);
      expect(presetManager.presets.some(p => p.name.includes('(1)'))).toBe(true);
    });

    test('should reject invalid JSON', async () => {
      const blob = new Blob(['invalid json'], { type: 'application/json' });
      const file = new File([blob], 'invalid.json', { type: 'application/json' });

      await expect(presetManager.import(file)).rejects.toThrow('Invalid preset file');
    });
  });

  describe('Randomization', () => {
    test('should call onRandomize when provided', () => {
      const randomizeFn = jest.fn();

      const manager = new PresetManager({
        algorithmId: 'random-test',
        onSave: () => ({}),
        onLoad: () => {},
        onRandomize: randomizeFn
      });

      expect(manager.onRandomize).toBe(randomizeFn);
    });
  });

  describe('Data integrity', () => {
    test('should generate unique IDs for presets', () => {
      const preset1 = presetManager.save('Preset 1');
      const preset2 = presetManager.save('Preset 2');

      expect(preset1.id).not.toBe(preset2.id);
    });

    test('should include timestamp in ISO format', () => {
      const preset = presetManager.save('Timestamped');

      expect(preset.timestamp).toBeDefined();
      expect(() => new Date(preset.timestamp)).not.toThrow();
    });

    test('should include algorithm ID in preset', () => {
      const preset = presetManager.save('Test');

      expect(preset.algorithmId).toBe('test-algorithm');
    });

    test('should deep clone data to prevent mutation', () => {
      const preset = presetManager.save('Clone Test');

      testParams.density = 999;

      expect(preset.data.density).toBe(50); // Original value
    });
  });
});
