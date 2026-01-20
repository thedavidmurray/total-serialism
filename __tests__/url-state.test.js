/**
 * @jest-environment jsdom
 */

// Tests for TSUrlState - compact URL state serialization
// TDD: Write tests first, then implement

describe('TSUrlState', () => {
  let TSUrlState;

  beforeEach(() => {
    // Reset modules
    jest.resetModules();

    // Mock window.location
    delete window.location;
    window.location = {
      search: '',
      href: 'https://example.com/test.html',
      origin: 'https://example.com',
      pathname: '/test.html'
    };

    // Load module
    TSUrlState = require('../pen-plotter/shared/url-state.js');
  });

  describe('Constructor', () => {
    test('should initialize with schema', () => {
      const schema = [
        { key: 'seed', type: 'int', bytes: 4 }
      ];
      const urlState = new TSUrlState({ schema });

      expect(urlState).toBeDefined();
      expect(urlState._schema).toEqual(schema);
    });

    test('should accept algorithmId for namespacing', () => {
      const urlState = new TSUrlState({
        algorithmId: 'spirotron',
        schema: []
      });

      expect(urlState._algorithmId).toBe('spirotron');
    });

    test('should use default param key "s"', () => {
      const urlState = new TSUrlState({ schema: [] });
      expect(urlState._paramKey).toBe('s');
    });

    test('should allow custom param key', () => {
      const urlState = new TSUrlState({ schema: [], paramKey: 'state' });
      expect(urlState._paramKey).toBe('state');
    });
  });

  describe('Schema Types', () => {
    describe('int type', () => {
      test('should encode 4-byte int', () => {
        const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ seed: 441969 });
        const decoded = urlState.decode(encoded);

        expect(decoded.seed).toBe(441969);
      });

      test('should encode 2-byte int', () => {
        const schema = [{ key: 'radius', type: 'int', bytes: 2 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ radius: 12345 });
        const decoded = urlState.decode(encoded);

        expect(decoded.radius).toBe(12345);
      });

      test('should encode 1-byte int', () => {
        const schema = [{ key: 'count', type: 'int', bytes: 1 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ count: 200 });
        const decoded = urlState.decode(encoded);

        expect(decoded.count).toBe(200);
      });

      test('should clamp int to byte range', () => {
        const schema = [{ key: 'count', type: 'int', bytes: 1 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ count: 300 }); // > 255
        const decoded = urlState.decode(encoded);

        expect(decoded.count).toBe(255); // Clamped
      });

      test('should handle negative ints as unsigned', () => {
        const schema = [{ key: 'value', type: 'int', bytes: 2 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ value: -1 });
        const decoded = urlState.decode(encoded);

        expect(decoded.value).toBe(0); // Clamped to 0
      });
    });

    describe('float type', () => {
      test('should encode float with range', () => {
        const schema = [{ key: 'weight', type: 'float', min: 0, max: 5, bytes: 1 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ weight: 2.5 });
        const decoded = urlState.decode(encoded);

        expect(decoded.weight).toBeCloseTo(2.5, 1);
      });

      test('should encode float with 2-byte precision', () => {
        const schema = [{ key: 'ratio', type: 'float', min: 0, max: 1, bytes: 2 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ ratio: 0.12345 });
        const decoded = urlState.decode(encoded);

        expect(decoded.ratio).toBeCloseTo(0.12345, 3);
      });

      test('should clamp float to range', () => {
        const schema = [{ key: 'value', type: 'float', min: 0, max: 10, bytes: 1 }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ value: 15 }); // > max
        const decoded = urlState.decode(encoded);

        expect(decoded.value).toBeCloseTo(10, 1); // Clamped to max
      });
    });

    describe('color type', () => {
      test('should encode hex color string', () => {
        const schema = [{ key: 'bg', type: 'color' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ bg: '#ff5500' });
        const decoded = urlState.decode(encoded);

        expect(decoded.bg).toBe('#ff5500');
      });

      test('should handle color without hash', () => {
        const schema = [{ key: 'bg', type: 'color' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ bg: 'aabbcc' });
        const decoded = urlState.decode(encoded);

        expect(decoded.bg).toBe('#aabbcc');
      });

      test('should handle 3-char shorthand colors', () => {
        const schema = [{ key: 'bg', type: 'color' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ bg: '#f00' });
        const decoded = urlState.decode(encoded);

        expect(decoded.bg).toBe('#ff0000');
      });

      test('should preserve case-insensitivity', () => {
        const schema = [{ key: 'bg', type: 'color' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ bg: '#AABBCC' });
        const decoded = urlState.decode(encoded);

        expect(decoded.bg.toLowerCase()).toBe('#aabbcc');
      });
    });

    describe('bool type', () => {
      test('should encode true', () => {
        const schema = [{ key: 'animate', type: 'bool' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ animate: true });
        const decoded = urlState.decode(encoded);

        expect(decoded.animate).toBe(true);
      });

      test('should encode false', () => {
        const schema = [{ key: 'animate', type: 'bool' }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ animate: false });
        const decoded = urlState.decode(encoded);

        expect(decoded.animate).toBe(false);
      });

      test('should pack multiple bools efficiently', () => {
        const schema = [
          { key: 'a', type: 'bool' },
          { key: 'b', type: 'bool' },
          { key: 'c', type: 'bool' },
          { key: 'd', type: 'bool' }
        ];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ a: true, b: false, c: true, d: false });
        const decoded = urlState.decode(encoded);

        expect(decoded).toEqual({ a: true, b: false, c: true, d: false });
        // Should be very compact - 4 bools in 1 byte + version
      });
    });

    describe('enum type', () => {
      test('should encode enum by index', () => {
        const schema = [{
          key: 'mode',
          type: 'enum',
          options: ['hypotrochoid', 'epitrochoid', 'rose']
        }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ mode: 'epitrochoid' });
        const decoded = urlState.decode(encoded);

        expect(decoded.mode).toBe('epitrochoid');
      });

      test('should handle first option', () => {
        const schema = [{
          key: 'mode',
          type: 'enum',
          options: ['a', 'b', 'c']
        }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ mode: 'a' });
        const decoded = urlState.decode(encoded);

        expect(decoded.mode).toBe('a');
      });

      test('should handle last option', () => {
        const schema = [{
          key: 'mode',
          type: 'enum',
          options: ['a', 'b', 'c']
        }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ mode: 'c' });
        const decoded = urlState.decode(encoded);

        expect(decoded.mode).toBe('c');
      });

      test('should fallback to first option for invalid value', () => {
        const schema = [{
          key: 'mode',
          type: 'enum',
          options: ['a', 'b', 'c']
        }];
        const urlState = new TSUrlState({ schema });

        const encoded = urlState.encode({ mode: 'invalid' });
        const decoded = urlState.decode(encoded);

        expect(decoded.mode).toBe('a');
      });
    });
  });

  describe('encode()', () => {
    test('should return URL-safe base64 string', () => {
      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      const encoded = urlState.encode({ seed: 12345 });

      // Should only contain URL-safe chars
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should not include padding', () => {
      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      const encoded = urlState.encode({ seed: 12345 });

      expect(encoded).not.toContain('=');
    });

    test('should include version byte', () => {
      const schema = [{ key: 'seed', type: 'int', bytes: 1 }];
      const urlState = new TSUrlState({ schema, version: 2 });

      const encoded = urlState.encode({ seed: 100 });
      const decoded = urlState.decode(encoded);

      expect(decoded.seed).toBe(100);
      expect(urlState._decodedVersion).toBe(2);
    });

    test('should handle missing params with defaults', () => {
      const schema = [
        { key: 'a', type: 'int', bytes: 1, default: 50 },
        { key: 'b', type: 'int', bytes: 1, default: 100 }
      ];
      const urlState = new TSUrlState({ schema });

      const encoded = urlState.encode({ a: 25 }); // b missing
      const decoded = urlState.decode(encoded);

      expect(decoded.a).toBe(25);
      expect(decoded.b).toBe(100); // default
    });
  });

  describe('decode()', () => {
    test('should decode valid string', () => {
      const schema = [{ key: 'value', type: 'int', bytes: 2 }];
      const urlState = new TSUrlState({ schema });

      const encoded = urlState.encode({ value: 1000 });
      const decoded = urlState.decode(encoded);

      expect(decoded.value).toBe(1000);
    });

    test('should return defaults for invalid string', () => {
      const schema = [
        { key: 'value', type: 'int', bytes: 1, default: 42 }
      ];
      const urlState = new TSUrlState({ schema });

      const decoded = urlState.decode('!!!invalid!!!');

      expect(decoded.value).toBe(42);
    });

    test('should return defaults for empty string', () => {
      const schema = [
        { key: 'value', type: 'int', bytes: 1, default: 42 }
      ];
      const urlState = new TSUrlState({ schema });

      const decoded = urlState.decode('');

      expect(decoded.value).toBe(42);
    });

    test('should handle version mismatch gracefully', () => {
      const schema = [
        { key: 'value', type: 'int', bytes: 1, default: 99 }
      ];
      const urlState = new TSUrlState({ schema, version: 1 });

      // Create a string with different version
      const oldVersionState = new TSUrlState({ schema, version: 255 });
      const encoded = oldVersionState.encode({ value: 50 });

      // Should return defaults for incompatible version
      const decoded = urlState.decode(encoded);

      expect(decoded.value).toBe(99); // default
    });
  });

  describe('URL Integration', () => {
    test('getUrl() should return full URL with state param', () => {
      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      const url = urlState.getUrl({ seed: 12345 });

      expect(url).toContain('?s=');
      expect(url).toContain('example.com');
    });

    test('getUrl() should preserve existing params', () => {
      // Update href to include existing params
      window.location.href = 'https://example.com/test.html?existing=value';
      window.location.search = '?existing=value';

      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      const url = urlState.getUrl({ seed: 12345 });

      expect(url).toContain('existing=value');
      expect(url).toContain('s=');
    });

    test('fromUrl() should parse state from current URL', () => {
      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      // First encode
      const encoded = urlState.encode({ seed: 99999 });

      // Update href to include the encoded state
      window.location.href = `https://example.com/test.html?s=${encoded}`;
      window.location.search = `?s=${encoded}`;

      // Then decode from URL
      const params = urlState.fromUrl();

      expect(params.seed).toBe(99999);
    });

    test('fromUrl() should return defaults if no state in URL', () => {
      const schema = [
        { key: 'seed', type: 'int', bytes: 4, default: 12345 }
      ];
      const urlState = new TSUrlState({ schema });

      window.location.href = 'https://example.com/test.html';
      window.location.search = '';

      const params = urlState.fromUrl();

      expect(params.seed).toBe(12345);
    });

    test('pushState() should update URL without reload', () => {
      const pushStateSpy = jest.spyOn(history, 'pushState').mockImplementation(() => {});

      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      urlState.pushState({ seed: 55555 });

      expect(pushStateSpy).toHaveBeenCalled();
      const url = pushStateSpy.mock.calls[0][2];
      expect(url).toContain('s=');

      pushStateSpy.mockRestore();
    });

    test('replaceState() should update URL without history entry', () => {
      const replaceStateSpy = jest.spyOn(history, 'replaceState').mockImplementation(() => {});

      const schema = [{ key: 'seed', type: 'int', bytes: 4 }];
      const urlState = new TSUrlState({ schema });

      urlState.replaceState({ seed: 55555 });

      expect(replaceStateSpy).toHaveBeenCalled();

      replaceStateSpy.mockRestore();
    });
  });

  describe('Complex Schema', () => {
    test('should handle realistic spirotron schema', () => {
      const schema = [
        { key: 'seed', type: 'int', bytes: 4 },
        { key: 'outerRadius', type: 'int', bytes: 2 },
        { key: 'innerRadius', type: 'int', bytes: 1 },
        { key: 'penDistance', type: 'int', bytes: 1 },
        { key: 'rotations', type: 'int', bytes: 1 },
        { key: 'strokeWeight', type: 'float', min: 0.1, max: 5, bytes: 1 },
        { key: 'bgColor', type: 'color' },
        { key: 'strokeColor', type: 'color' },
        { key: 'patternType', type: 'enum', options: ['hypotrochoid', 'epitrochoid', 'rose'] },
        { key: 'animate', type: 'bool' }
      ];

      const urlState = new TSUrlState({ schema });

      const params = {
        seed: 441969,
        outerRadius: 200,
        innerRadius: 65,
        penDistance: 43,
        rotations: 20,
        strokeWeight: 1.5,
        bgColor: '#ffffff',
        strokeColor: '#000000',
        patternType: 'hypotrochoid',
        animate: false
      };

      const encoded = urlState.encode(params);
      const decoded = urlState.decode(encoded);

      expect(decoded.seed).toBe(441969);
      expect(decoded.outerRadius).toBe(200);
      expect(decoded.innerRadius).toBe(65);
      expect(decoded.penDistance).toBe(43);
      expect(decoded.rotations).toBe(20);
      expect(decoded.strokeWeight).toBeCloseTo(1.5, 1);
      expect(decoded.bgColor).toBe('#ffffff');
      expect(decoded.strokeColor).toBe('#000000');
      expect(decoded.patternType).toBe('hypotrochoid');
      expect(decoded.animate).toBe(false);

      // Should be compact - roughly 18 bytes → ~25 chars Base64
      expect(encoded.length).toBeLessThan(35);
    });

    test('should produce shorter URLs than query params', () => {
      const schema = [
        { key: 'seed', type: 'int', bytes: 4 },
        { key: 'radius', type: 'int', bytes: 2 },
        { key: 'color', type: 'color' },
        { key: 'mode', type: 'enum', options: ['a', 'b', 'c'] }
      ];

      const urlState = new TSUrlState({ schema });

      const params = {
        seed: 123456,
        radius: 500,
        color: '#ff5500',
        mode: 'b'
      };

      const encoded = urlState.encode(params);

      // Compare to verbose query string
      const verbose = 'seed=123456&radius=500&color=%23ff5500&mode=b';

      expect(encoded.length).toBeLessThan(verbose.length);
    });
  });

  describe('Static Helpers', () => {
    test('createShareUrl() should be available', () => {
      expect(TSUrlState.createShareUrl).toBeDefined();
    });

    test('parseShareUrl() should be available', () => {
      expect(TSUrlState.parseShareUrl).toBeDefined();
    });
  });
});
