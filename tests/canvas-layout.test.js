/**
 * Tests for CanvasLayout paper presets, alias normalization, and
 * the fit-to-paper contract used by algorithm pages.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadCanvasLayout() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'pen-plotter', 'shared', 'canvas-layout.js'),
    'utf8'
  );
  const sandbox = { window: { addEventListener: () => {} } };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.CanvasLayout;
}

describe('CanvasLayout', () => {
  const layout = loadCanvasLayout();

  describe('getSize alias normalization', () => {
    test('resolves canonical keys', () => {
      expect(layout.getSize('a4')).toMatchObject({ width: 1240, height: 1754 });
      expect(layout.getSize('a3landscape')).toMatchObject({ width: 2480, height: 1754 });
    });

    test('resolves hyphenated aliases used by algorithm pages', () => {
      expect(layout.getSize('a3-landscape')).toMatchObject({ width: 2480, height: 1754 });
      expect(layout.getSize('a4-landscape')).toMatchObject({ width: 1754, height: 1240 });
      expect(layout.getSize('letter-portrait')).toMatchObject({ width: 1275, height: 1650 });
    });

    test('resolves underscore and mixed-case aliases', () => {
      expect(layout.getSize('A3_landscape')).toMatchObject({ width: 2480, height: 1754 });
      expect(layout.getSize('A4 Portrait')).toMatchObject({ width: 1240, height: 1754 });
    });

    test('unknown presets still fall back to custom', () => {
      expect(layout.getSize('not-a-size')).toBe(layout.paperPresets.custom);
      expect(layout.getSize()).toBe(layout.paperPresets.custom);
    });

    test('every paper-size option value used by algorithm pages resolves', () => {
      const algorithmsRoot = path.join(__dirname, '..', 'pen-plotter');
      const optionValues = new Set();
      const collect = (dir) => {
        fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) return collect(full);
          if (!entry.name.endsWith('.html')) return;
          const html = fs.readFileSync(full, 'utf8');
          const selects = html.match(/<select[^>]*(paper|canvas)[^>]*>[\s\S]*?<\/select>/gi) || [];
          selects.forEach((select) => {
            (select.match(/value="([^"]+)"/g) || []).forEach((m) => {
              optionValues.add(m.slice(7, -1));
            });
          });
        });
      };
      collect(path.join(algorithmsRoot, 'algorithms'));

      const unresolved = [...optionValues].filter((value) => {
        if (value === 'custom') return false;
        const size = layout.getSize(value);
        return size === layout.paperPresets.custom;
      });
      expect(unresolved).toEqual([]);
    });
  });

  describe('fitToPaper contract', () => {
    test('scales art down uniformly to fit inside margins and centers it', () => {
      const fit = layout.fitToPaper({ artWidth: 5000, artHeight: 2500, preset: 'a4', margin: 100 });
      expect(fit.width).toBe(1240);
      expect(fit.height).toBe(1754);
      // Limited by inner width: (1240 - 200) / 5000
      expect(fit.scale).toBeCloseTo(1040 / 5000, 6);
      expect(fit.offsetX).toBeCloseTo((1240 - 5000 * fit.scale) / 2, 6);
      expect(fit.offsetY).toBeCloseTo((1754 - 2500 * fit.scale) / 2, 6);
      // Scaled art never exceeds the paper minus margins
      expect(5000 * fit.scale).toBeLessThanOrEqual(1240 - 200 + 1e-9);
      expect(2500 * fit.scale).toBeLessThanOrEqual(1754 - 200 + 1e-9);
    });

    test('never scales art up past 1:1', () => {
      const fit = layout.fitToPaper({ artWidth: 100, artHeight: 100, preset: 'a3', margin: 0 });
      expect(fit.scale).toBe(1);
      expect(fit.offsetX).toBeCloseTo((1754 - 100) / 2, 6);
    });

    test('accepts aliased preset names', () => {
      const fit = layout.fitToPaper({ artWidth: 1000, artHeight: 1000, preset: 'a3-landscape', margin: 0 });
      expect(fit.width).toBe(2480);
      expect(fit.height).toBe(1754);
    });
  });
});
