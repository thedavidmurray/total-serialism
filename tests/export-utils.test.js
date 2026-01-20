/**
 * ExportUtils Test Suite
 * Comprehensive tests for export utilities
 */

const ExportUtils = require('../src/utils/export-utils');

describe('ExportUtils', () => {
  describe('generateFilename', () => {
    beforeEach(() => {
      // Mock Date for consistent timestamps
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-19T14:30:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should generate basic filename with timestamp', () => {
      const filename = ExportUtils.generateFilename('flow-field');
      expect(filename).toBe('flow-field_20260119-143000.svg');
    });

    it('should handle algorithm name with spaces', () => {
      const filename = ExportUtils.generateFilename('Islamic Patterns');
      expect(filename).toBe('islamic-patterns_20260119-143000.svg');
    });

    it('should handle algorithm name with special characters', () => {
      const filename = ExportUtils.generateFilename('Test@Algorithm#123!');
      expect(filename).toBe('test-algorithm-123_20260119-143000.svg');
    });

    it('should include seed when provided', () => {
      const filename = ExportUtils.generateFilename('flow-field', 'svg', { seed: 42 });
      expect(filename).toBe('flow-field_20260119-143000_seed-42.svg');
    });

    it('should include suffix when provided', () => {
      const filename = ExportUtils.generateFilename('flow-field', 'svg', { suffix: 'final' });
      expect(filename).toBe('flow-field_20260119-143000_final.svg');
    });

    it('should include both seed and suffix', () => {
      const filename = ExportUtils.generateFilename('flow-field', 'svg', {
        seed: 42,
        suffix: 'variant-a'
      });
      expect(filename).toBe('flow-field_20260119-143000_seed-42_variant-a.svg');
    });

    it('should handle different file extensions', () => {
      const pngFile = ExportUtils.generateFilename('test', 'png');
      expect(pngFile).toMatch(/\.png$/);

      const jpgFile = ExportUtils.generateFilename('test', 'jpg');
      expect(jpgFile).toMatch(/\.jpg$/);
    });

    it('should handle extension with leading dot', () => {
      const filename = ExportUtils.generateFilename('test', '.svg');
      expect(filename).toBe('test_20260119-143000.svg');
    });

    it('should use custom timestamp when provided', () => {
      const customDate = new Date('2025-12-25T10:15:30.000Z');
      const filename = ExportUtils.generateFilename('test', 'svg', { timestamp: customDate });
      expect(filename).toBe('test_20251225-101530.svg');
    });

    it('should throw error for missing algorithm name', () => {
      expect(() => ExportUtils.generateFilename()).toThrow('Algorithm name is required');
      expect(() => ExportUtils.generateFilename(null)).toThrow('Algorithm name is required');
      expect(() => ExportUtils.generateFilename('')).toThrow('Algorithm name is required');
    });

    it('should throw error for non-string algorithm name', () => {
      expect(() => ExportUtils.generateFilename(123)).toThrow('must be a string');
      expect(() => ExportUtils.generateFilename({})).toThrow('must be a string');
    });

    it('should sanitize suffix with special characters', () => {
      const filename = ExportUtils.generateFilename('test', 'svg', { suffix: 'v@2.1!' });
      expect(filename).toBe('test_20260119-143000_v-2-1-.svg');
    });
  });

  describe('validateSVG', () => {
    it('should validate correct SVG content', () => {
      const validSvg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect x="0" y="0" width="100" height="100"/>
</svg>`;
      expect(ExportUtils.validateSVG(validSvg)).toBe(true);
    });

    it('should reject SVG without xmlns', () => {
      const invalidSvg = '<svg width="100" height="100"></svg>';
      expect(ExportUtils.validateSVG(invalidSvg)).toBe(false);
    });

    it('should reject SVG without opening tag', () => {
      const invalidSvg = 'content</svg>';
      expect(ExportUtils.validateSVG(invalidSvg)).toBe(false);
    });

    it('should reject SVG without closing tag', () => {
      const invalidSvg = '<svg xmlns="http://www.w3.org/2000/svg">';
      expect(ExportUtils.validateSVG(invalidSvg)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(ExportUtils.validateSVG('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(ExportUtils.validateSVG(null)).toBe(false);
      expect(ExportUtils.validateSVG(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(ExportUtils.validateSVG(123)).toBe(false);
      expect(ExportUtils.validateSVG({})).toBe(false);
    });

    it('should validate minimal valid SVG', () => {
      const minimalSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      expect(ExportUtils.validateSVG(minimalSvg)).toBe(true);
    });
  });

  describe('optimizeForPlotter', () => {
    it('should remove unnecessary whitespace', () => {
      const input = '<svg>  <g>  <path />  </g>  </svg>';
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).toBe('<svg><g><path /></g></svg>');
    });

    it('should remove comments', () => {
      const input = '<svg><!-- This is a comment --><path /></svg>';
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).not.toContain('<!--');
      expect(output).not.toContain('comment');
    });

    it('should consolidate multiple spaces', () => {
      const input = '<svg   width="100"    height="200"><path /></svg>';
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).not.toContain('  ');
    });

    it('should remove empty groups', () => {
      const input = '<svg><g></g><path /></svg>';
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).toBe('<svg><path /></svg>');
    });

    it('should handle null or undefined input', () => {
      expect(ExportUtils.optimizeForPlotter(null)).toBeNull();
      expect(ExportUtils.optimizeForPlotter(undefined)).toBeUndefined();
    });

    it('should handle non-string input', () => {
      expect(ExportUtils.optimizeForPlotter(123)).toBe(123);
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '  <svg><path /></svg>  ';
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).toBe('<svg><path /></svg>');
    });

    it('should remove multi-line comments', () => {
      const input = `<svg>
<!-- Multi
line
comment -->
<path /></svg>`;
      const output = ExportUtils.optimizeForPlotter(input);
      expect(output).not.toContain('<!--');
      expect(output).not.toContain('Multi');
    });
  });

  describe('exportSVG', () => {
    // Mock document and DOM APIs for exportSVG tests
    let mockLink;
    let mockBlob;
    let mockURL;

    beforeEach(() => {
      // Mock document.createElement
      mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };

      global.document = {
        createElement: jest.fn(() => mockLink),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }
      };

      // Mock Blob
      mockBlob = {};
      global.Blob = jest.fn(() => mockBlob);

      // Mock URL
      mockURL = {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn()
      };
      global.URL = mockURL;

      // Mock setTimeout for cleanup
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
      delete global.document;
      delete global.Blob;
      delete global.URL;
    });

    it('should export simple paths as SVG', () => {
      const paths = [
        [{ x: 0, y: 0 }, { x: 100, y: 100 }]
      ];

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg');

      expect(global.Blob).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('<svg')]),
        { type: 'image/svg+xml;charset=utf-8' }
      );
    });

    it('should handle array-based points', () => {
      const paths = [
        [[0, 0], [100, 100]]
      ];

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg');

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).toContain('M 0,0');
      expect(svgContent).toContain('L 100,100');
    });

    it('should handle object-based points', () => {
      const paths = [
        [{ x: 50, y: 50 }, { x: 150, y: 150 }]
      ];

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg');

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).toContain('M 50,50');
      expect(svgContent).toContain('L 150,150');
    });

    it('should respect custom stroke options', () => {
      const paths = [[[0, 0], [100, 100]]];
      const options = {
        strokeColor: '#FF0000',
        strokeWidth: 3
      };

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg', options);

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).toContain('stroke="#FF0000"');
      expect(svgContent).toContain('stroke-width="3"');
    });

    it('should round coordinates to 2 decimal places', () => {
      const paths = [
        [[0.123456, 0.789012], [100.999999, 100.111111]]
      ];

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg');

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).toContain('M 0.12,0.79');
      expect(svgContent).toContain('L 101,100.11');
    });

    it('should include metadata when requested', () => {
      const paths = [[[0, 0], [100, 100]]];
      const options = { includeMetadata: true };

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg', options);

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).toContain('<metadata>');
      expect(svgContent).toContain('<dc:title>test.svg</dc:title>');
    });

    it('should exclude metadata when not requested', () => {
      const paths = [[[0, 0], [100, 100]]];
      const options = { includeMetadata: false };

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg', options);

      const svgContent = global.Blob.mock.calls[0][0][0];
      expect(svgContent).not.toContain('<metadata>');
    });

    it('should optimize when requested', () => {
      const paths = [[[0, 0], [100, 100]]];
      const options = { optimize: true };

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg', options);

      const svgContent = global.Blob.mock.calls[0][0][0];
      // Optimized SVG should not have excessive whitespace
      expect(svgContent).not.toMatch(/>\s{2,}</);
    });

    it('should skip empty paths', () => {
      const paths = [
        [[0, 0], [100, 100]],
        [],
        [[200, 200], [300, 300]]
      ];

      ExportUtils.exportSVG(paths, 400, 400, 'test.svg');

      const svgContent = global.Blob.mock.calls[0][0][0];
      const pathCount = (svgContent.match(/<path/g) || []).length;
      expect(pathCount).toBe(2); // Only non-empty paths
    });

    it('should throw error for non-array paths', () => {
      expect(() => ExportUtils.exportSVG('not-array', 200, 200, 'test.svg'))
        .toThrow('Paths must be an array');
    });

    it('should throw error for non-numeric dimensions', () => {
      const paths = [[[0, 0], [100, 100]]];
      expect(() => ExportUtils.exportSVG(paths, '200', 200, 'test.svg'))
        .toThrow('Width and height must be numbers');
    });

    it('should throw error for non-positive dimensions', () => {
      const paths = [[[0, 0], [100, 100]]];
      expect(() => ExportUtils.exportSVG(paths, 0, 200, 'test.svg'))
        .toThrow('Width and height must be positive numbers');
      expect(() => ExportUtils.exportSVG(paths, 200, -100, 'test.svg'))
        .toThrow('Width and height must be positive numbers');
    });

    it('should create download link with correct attributes', () => {
      const paths = [[[0, 0], [100, 100]]];

      ExportUtils.exportSVG(paths, 200, 200, 'my-art.svg');

      expect(mockLink.download).toBe('my-art.svg');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should clean up blob URL after download', () => {
      const paths = [[[0, 0], [100, 100]]];

      ExportUtils.exportSVG(paths, 200, 200, 'test.svg');

      jest.advanceTimersByTime(100);
      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('downloadSVG', () => {
    let mockLink;
    let mockBlob;
    let mockURL;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };

      global.document = {
        createElement: jest.fn(() => mockLink),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }
      };

      mockBlob = {};
      global.Blob = jest.fn(() => mockBlob);

      mockURL = {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn()
      };
      global.URL = mockURL;

      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
      delete global.document;
      delete global.Blob;
      delete global.URL;
    });

    it('should download valid SVG content', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

      ExportUtils.downloadSVG(svg, 'test.svg');

      expect(global.Blob).toHaveBeenCalledWith([svg], { type: 'image/svg+xml;charset=utf-8' });
      expect(mockLink.download).toBe('test.svg');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should throw error for missing SVG content', () => {
      expect(() => ExportUtils.downloadSVG(null, 'test.svg'))
        .toThrow('SVG content is required');
      expect(() => ExportUtils.downloadSVG('', 'test.svg'))
        .toThrow('SVG content is required');
    });

    it('should throw error for missing filename', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      expect(() => ExportUtils.downloadSVG(svg, null))
        .toThrow('Filename is required');
      expect(() => ExportUtils.downloadSVG(svg, ''))
        .toThrow('Filename is required');
    });

    it('should warn about invalid SVG', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidSvg = '<div>Not an SVG</div>';

      ExportUtils.downloadSVG(invalidSvg, 'test.svg');

      expect(consoleWarnSpy).toHaveBeenCalledWith('SVG content may be invalid');
      consoleWarnSpy.mockRestore();
    });

    it('should clean up DOM elements', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

      ExportUtils.downloadSVG(svg, 'test.svg');

      expect(global.document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(global.document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('exportPNG', () => {
    let mockCanvas;
    let mockBlob;

    beforeEach(() => {
      // Mock Blob if not available
      if (typeof Blob === 'undefined') {
        global.Blob = class Blob {
          constructor(data, options) {
            this.data = data;
            this.type = options?.type || '';
          }
        };
      }
      mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });

      mockCanvas = {
        toBlob: jest.fn((callback) => callback(mockBlob))
      };

      global.document = {
        createElement: jest.fn(() => ({
          href: '',
          download: '',
          click: jest.fn()
        })),
        querySelector: jest.fn(() => mockCanvas),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }
      };

      global.URL = {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn()
      };

      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
      delete global.document;
      delete global.URL;
    });

    it('should export default canvas when none provided', () => {
      ExportUtils.exportPNG('test.png');

      expect(global.document.querySelector).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.toBlob).toHaveBeenCalled();
    });

    it('should use provided canvas', () => {
      const customCanvas = {
        toBlob: jest.fn((callback) => callback(mockBlob))
      };

      ExportUtils.exportPNG('test.png', customCanvas);

      expect(global.document.querySelector).not.toHaveBeenCalled();
      expect(customCanvas.toBlob).toHaveBeenCalled();
    });

    it('should throw error when no canvas found', () => {
      global.document.querySelector = jest.fn(() => null);

      expect(() => ExportUtils.exportPNG('test.png'))
        .toThrow('No canvas found');
    });

    it('should throw error for missing filename', () => {
      expect(() => ExportUtils.exportPNG(null))
        .toThrow('Filename is required');
    });
  });
});
