/**
 * @jest-environment jsdom
 */

const TSStatsDisplay = require('../pen-plotter/shared/stats-display.js');

// Setup DOM structure
function setupDOM() {
  document.body.innerHTML = '';
  const container = document.createElement('div');
  container.id = 'canvas-container';
  document.body.appendChild(container);
}

describe('TSStatsDisplay', () => {
  beforeEach(() => {
    setupDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const stats = new TSStatsDisplay();

      expect(stats.options.containerSelector).toBe('#canvas-container');
      expect(stats.options.visible).toBe(true);
      expect(stats.options.debounceMs).toBe(0);
      expect(stats.options.emptyLabel).toBe('—');
    });

    test('should accept and apply custom options', () => {
      const stats = new TSStatsDisplay({
        containerSelector: '#custom-container',
        debounceMs: 100,
        emptyLabel: 'N/A'
      });

      expect(stats.options.containerSelector).toBe('#custom-container');
      expect(stats.options.debounceMs).toBe(100);
      expect(stats.options.emptyLabel).toBe('N/A');
    });
  });

  describe('attach', () => {
    test('should create stats bar element in container', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      const bar = document.querySelector('.ts-stats-bar');
      expect(bar).not.toBeNull();
      expect(bar.id).toBe('ts-stats-bar');
    });

    test('should insert stats bar at body level (Dan Catt style)', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      // Stats bar should be first child of body for viewport-fixed header
      const firstChild = document.body.firstElementChild;
      expect(firstChild.classList.contains('ts-stats-bar')).toBe(true);
    });

    test('should return this for method chaining', () => {
      const stats = new TSStatsDisplay();
      const result = stats.attach();

      expect(result).toBe(stats);
    });

    test('should set ARIA attributes for accessibility', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      const bar = document.querySelector('.ts-stats-bar');
      expect(bar.getAttribute('role')).toBe('status');
      expect(bar.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('update', () => {
    test('should process object format {key: value}', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 1234, vertices: 5678 });

      const items = document.querySelectorAll('.ts-stats-item');
      expect(items.length).toBe(2);
    });

    test('should process object format with metadata {key: {value, label}}', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({
        lines: { value: 1234, label: 'Total Lines' }
      });

      const label = document.querySelector('.ts-stats-label');
      expect(label.textContent).toBe('Total Lines');
    });

    test('should process array format [{key, value}]', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update([
        { key: 'lines', value: 1234 },
        { key: 'vertices', value: 5678 }
      ]);

      const items = document.querySelectorAll('.ts-stats-item');
      expect(items.length).toBe(2);
    });

    test('should replace all existing stats on update', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 100 });
      expect(document.querySelectorAll('.ts-stats-item').length).toBe(1);

      stats.update({ vertices: 200, seed: 42 });
      expect(document.querySelectorAll('.ts-stats-item').length).toBe(2);

      // 'lines' should be gone
      expect(document.querySelector('[data-stat-key="lines"]')).toBeNull();
    });
  });

  describe('set', () => {
    test('should update single stat without affecting others', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 100, vertices: 200 });
      stats.set('lines', 150);

      expect(document.querySelector('[data-stat-key="lines"] .ts-stats-value').textContent).toBe('150');
      expect(document.querySelector('[data-stat-key="vertices"] .ts-stats-value').textContent).toBe('200');
    });

    test('should add new stat if not exists', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 100 });
      stats.set('seed', 42069);

      expect(document.querySelectorAll('.ts-stats-item').length).toBe(2);
      expect(document.querySelector('[data-stat-key="seed"]')).not.toBeNull();
    });

    test('should accept custom label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.set('gen', 5, 'Generation');

      const label = document.querySelector('[data-stat-key="gen"] .ts-stats-label');
      expect(label.textContent).toBe('Generation');
    });
  });

  describe('clear', () => {
    test('should remove all stat items', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 100, vertices: 200, seed: 42 });
      expect(document.querySelectorAll('.ts-stats-item').length).toBe(3);

      stats.clear();
      expect(document.querySelectorAll('.ts-stats-item').length).toBe(0);
    });
  });

  describe('show and hide', () => {
    test('show should make stats bar visible', () => {
      const stats = new TSStatsDisplay({ visible: false });
      stats.attach();

      const bar = document.querySelector('.ts-stats-bar');
      expect(bar.classList.contains('hidden')).toBe(true);

      stats.show();
      expect(bar.classList.contains('hidden')).toBe(false);
    });

    test('hide should make stats bar hidden', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.hide();

      const bar = document.querySelector('.ts-stats-bar');
      expect(bar.classList.contains('hidden')).toBe(true);
    });

    test('isVisible should return correct state', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      expect(stats.isVisible()).toBe(true);

      stats.hide();
      expect(stats.isVisible()).toBe(false);

      stats.show();
      expect(stats.isVisible()).toBe(true);
    });
  });

  describe('destroy', () => {
    test('should remove stats bar from DOM', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      expect(document.querySelector('.ts-stats-bar')).not.toBeNull();

      stats.destroy();

      expect(document.querySelector('.ts-stats-bar')).toBeNull();
    });

    test('should clear any pending debounce timers', () => {
      jest.useFakeTimers();

      const stats = new TSStatsDisplay({ debounceMs: 100 });
      stats.attach();

      stats.update({ lines: 100 });
      stats.destroy();

      // Advance timers - should not throw
      expect(() => jest.advanceTimersByTime(200)).not.toThrow();

      jest.useRealTimers();
    });
  });

  describe('number formatting', () => {
    test('should format integers with thousand separators', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ lines: 1234567 });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('1,234,567');
    });

    test('should format floats with 2 decimal places', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ time: 1234.567 });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('1,234.57');
    });

    test('should format time values in milliseconds', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({
        time: { value: 0.045, format: 'time' }
      });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('45ms');
    });

    test('should format time values in seconds', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({
        time: { value: 2.5, format: 'time' }
      });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('2.50s');
    });

    test('should format percent values', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({
        progress: { value: 0.756, format: 'percent' }
      });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('75.6%');
    });

    test('should pass through raw format unchanged', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({
        status: { value: 'Running', format: 'raw' }
      });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('Running');
    });

    test('should display emptyLabel for NaN/undefined values', () => {
      const stats = new TSStatsDisplay({ emptyLabel: 'N/A' });
      stats.attach();

      stats.update({ lines: undefined });

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('N/A');
    });
  });

  describe('debouncing', () => {
    test('should update immediately when debounceMs is 0', () => {
      const stats = new TSStatsDisplay({ debounceMs: 0 });
      stats.attach();

      stats.update({ lines: 100 });

      // Should be immediate
      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('100');
    });

    test('should batch updates when debounceMs > 0', () => {
      jest.useFakeTimers();

      const stats = new TSStatsDisplay({ debounceMs: 100 });
      stats.attach();

      stats.update({ lines: 100 });

      // Not yet updated
      let items = document.querySelectorAll('.ts-stats-item');
      expect(items.length).toBe(0);

      jest.advanceTimersByTime(100);

      // Now updated
      items = document.querySelectorAll('.ts-stats-item');
      expect(items.length).toBe(1);

      jest.useRealTimers();
    });

    test('should use last value when multiple updates within debounce window', () => {
      jest.useFakeTimers();

      const stats = new TSStatsDisplay({ debounceMs: 100 });
      stats.attach();

      stats.update({ lines: 100 });
      stats.update({ lines: 200 });
      stats.update({ lines: 300 });

      jest.advanceTimersByTime(100);

      const value = document.querySelector('.ts-stats-value');
      expect(value.textContent).toBe('300');

      jest.useRealTimers();
    });
  });

  describe('convenience methods', () => {
    test('setLines should set lines stat with label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.setLines(1234);

      const item = document.querySelector('[data-stat-key="lines"]');
      expect(item).not.toBeNull();
      expect(item.querySelector('.ts-stats-label').textContent).toBe('Lines');
      expect(item.querySelector('.ts-stats-value').textContent).toBe('1,234');
    });

    test('setVertices should set vertices stat', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.setVertices(5678);

      const item = document.querySelector('[data-stat-key="vertices"]');
      expect(item).not.toBeNull();
      expect(item.querySelector('.ts-stats-value').textContent).toBe('5,678');
    });

    test('setSeed should set seed stat', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.setSeed(42069);

      const item = document.querySelector('[data-stat-key="seed"]');
      expect(item).not.toBeNull();
      expect(item.querySelector('.ts-stats-value').textContent).toBe('42,069');
    });

    test('setGeneration should set generation stat', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.setGeneration(15);

      const item = document.querySelector('[data-stat-key="generation"]');
      expect(item).not.toBeNull();
      expect(item.querySelector('.ts-stats-label').textContent).toBe('Gen');
      expect(item.querySelector('.ts-stats-value').textContent).toBe('15');
    });
  });

  describe('error handling', () => {
    test('should handle missing container gracefully', () => {
      document.body.innerHTML = ''; // Remove all elements

      const stats = new TSStatsDisplay();

      expect(() => stats.attach()).not.toThrow();
    });

    test('should handle invalid stat data gracefully', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      expect(() => stats.update(null)).not.toThrow();
      expect(() => stats.update(undefined)).not.toThrow();
      expect(() => stats.update('invalid')).not.toThrow();
    });
  });

  describe('label generation', () => {
    test('should titlecase key for default label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();

      stats.update({ totalLines: 100 });

      const label = document.querySelector('.ts-stats-label');
      // 'totalLines' should become something like 'Total Lines' or 'Totallines'
      expect(label.textContent.toLowerCase()).toContain('total');
    });
  });

  describe('edge cases - null, undefined, zero', () => {
    test('should handle null with empty label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('nullStat', null);

      const value = document.querySelector('[data-stat-key="nullStat"] .ts-stats-value');
      expect(value.textContent).toBe('—');
    });

    test('should handle undefined with empty label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('undefinedStat', undefined);

      const value = document.querySelector('[data-stat-key="undefinedStat"] .ts-stats-value');
      expect(value.textContent).toBe('—');
    });

    test('should display zero correctly (not as empty)', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('zero', 0);

      const value = document.querySelector('[data-stat-key="zero"] .ts-stats-value');
      expect(value.textContent).toBe('0');
    });

    test('should handle NaN with empty label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('nanStat', NaN);

      const value = document.querySelector('[data-stat-key="nanStat"] .ts-stats-value');
      expect(value.textContent).toBe('—');
    });

    test('should handle Infinity with empty label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('infStat', Infinity);

      const value = document.querySelector('[data-stat-key="infStat"] .ts-stats-value');
      expect(value.textContent).toBe('—');
    });

    test('should handle -Infinity with empty label', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('negInfStat', -Infinity);

      const value = document.querySelector('[data-stat-key="negInfStat"] .ts-stats-value');
      expect(value.textContent).toBe('—');
    });

    test('should use custom empty label', () => {
      const stats = new TSStatsDisplay({ emptyLabel: 'N/A' });
      stats.attach();
      stats.set('nullStat', null);

      const value = document.querySelector('[data-stat-key="nullStat"] .ts-stats-value');
      expect(value.textContent).toBe('N/A');
    });

    test('should handle negative numbers', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('negative', -1234);

      const value = document.querySelector('[data-stat-key="negative"] .ts-stats-value');
      expect(value.textContent).toBe('-1,234');
    });

    test('should preserve empty string', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('empty', '');

      const value = document.querySelector('[data-stat-key="empty"] .ts-stats-value');
      expect(value.textContent).toBe('');
    });

    test('should preserve string values', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.set('status', 'Running');

      const value = document.querySelector('[data-stat-key="status"] .ts-stats-value');
      expect(value.textContent).toBe('Running');
    });
  });

  describe('plotter-specific stats', () => {
    test('setPathLength should format small lengths as mm', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPathLength(500);

      const value = document.querySelector('[data-stat-key="pathLength"] .ts-stats-value');
      expect(value.textContent).toBe('500.0mm');
    });

    test('setPathLength should format large lengths as meters', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPathLength(2500);

      const value = document.querySelector('[data-stat-key="pathLength"] .ts-stats-value');
      expect(value.textContent).toBe('2.50m');
    });

    test('setPlotTime should format seconds', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPlotTime(45);

      const value = document.querySelector('[data-stat-key="plotTime"] .ts-stats-value');
      expect(value.textContent).toBe('45s');
    });

    test('setPlotTime should format minutes and seconds', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPlotTime(125);

      const value = document.querySelector('[data-stat-key="plotTime"] .ts-stats-value');
      expect(value.textContent).toBe('2m 5s');
    });

    test('setPlotTime should format hours and minutes', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPlotTime(7200);

      const value = document.querySelector('[data-stat-key="plotTime"] .ts-stats-value');
      expect(value.textContent).toBe('2h 0m');
    });

    test('setPenLifts should set pen lifts count', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPenLifts(150);

      const label = document.querySelector('[data-stat-key="penLifts"] .ts-stats-label');
      const value = document.querySelector('[data-stat-key="penLifts"] .ts-stats-value');
      expect(label.textContent).toBe('Pen Lifts');
      expect(value.textContent).toBe('150');
    });

    test('setPathCount should set path count', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPathCount(42);

      const label = document.querySelector('[data-stat-key="pathCount"] .ts-stats-label');
      const value = document.querySelector('[data-stat-key="pathCount"] .ts-stats-value');
      expect(label.textContent).toBe('Paths');
      expect(value.textContent).toBe('42');
    });

    test('setPlotterStats should set multiple plotter stats', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPlotterStats({
        pathLength: 1500,
        plotTime: 120,
        penLifts: 50,
        pathCount: 25
      });

      expect(document.querySelector('[data-stat-key="pathLength"]')).not.toBeNull();
      expect(document.querySelector('[data-stat-key="plotTime"]')).not.toBeNull();
      expect(document.querySelector('[data-stat-key="penLifts"]')).not.toBeNull();
      expect(document.querySelector('[data-stat-key="pathCount"]')).not.toBeNull();
    });

    test('setPlotterStats should handle partial updates', () => {
      const stats = new TSStatsDisplay();
      stats.attach();
      stats.setPlotterStats({
        pathLength: 1000,
        penLifts: 30
      });

      expect(document.querySelector('[data-stat-key="pathLength"]')).not.toBeNull();
      expect(document.querySelector('[data-stat-key="penLifts"]')).not.toBeNull();
      expect(document.querySelector('[data-stat-key="plotTime"]')).toBeNull();
      expect(document.querySelector('[data-stat-key="pathCount"]')).toBeNull();
    });
  });

  describe('static utility methods', () => {
    describe('calculatePathLength', () => {
      test('should calculate length for single path', () => {
        const paths = [[
          { x: 10, y: 10 },
          { x: 110, y: 10 },
          { x: 110, y: 110 }
        ]];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // 100px + 100px = 200px * 0.264583 = 52.9166mm
        expect(length).toBeCloseTo(52.92, 1);
      });

      test('should calculate length for multiple paths', () => {
        const paths = [
          [{ x: 10, y: 10 }, { x: 110, y: 10 }],
          [{ x: 20, y: 20 }, { x: 20, y: 120 }]
        ];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // 100px + 100px = 200px * 0.264583 = 52.9166mm
        expect(length).toBeCloseTo(52.92, 1);
      });

      test('should handle array coordinate format', () => {
        const paths = [[[10, 10], [110, 10]]];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // 100px * 0.264583 = 26.4583mm
        expect(length).toBeCloseTo(26.46, 1);
      });

      test('should handle paths with points property', () => {
        const paths = [{
          points: [{ x: 10, y: 10 }, { x: 110, y: 10 }]
        }];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // 100px * 0.264583 = 26.4583mm
        expect(length).toBeCloseTo(26.46, 1);
      });

      test('should accept custom pxToMm conversion', () => {
        const paths = [[{ x: 10, y: 10 }, { x: 110, y: 10 }]];
        const length = TSStatsDisplay.calculatePathLength(paths, 1.0);
        expect(length).toBe(100);
      });

      test('should ignore empty paths', () => {
        const paths = [
          [],
          [{ x: 10, y: 10 }],
          [{ x: 10, y: 10 }, { x: 110, y: 10 }]
        ];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // Only the valid path: 100px * 0.264583 = 26.4583mm
        expect(length).toBeCloseTo(26.46, 1);
      });

      test('should handle zero coordinates correctly', () => {
        // Fixed: Now uses !== undefined instead of || to handle x=0 or y=0
        const paths = [[{ x: 0, y: 0 }, { x: 100, y: 0 }]];
        const length = TSStatsDisplay.calculatePathLength(paths);
        // Should calculate correctly even when x=0 or y=0
        expect(length).toBeCloseTo(26.46, 1);
      });
    });

    describe('countPenLifts', () => {
      test('should count valid paths', () => {
        const paths = [
          [{ x: 10, y: 10 }, { x: 110, y: 10 }],
          [{ x: 20, y: 20 }, { x: 20, y: 120 }]
        ];
        expect(TSStatsDisplay.countPenLifts(paths)).toBe(2);
      });

      test('should ignore empty paths', () => {
        const paths = [
          [],
          [{ x: 10, y: 10 }],
          [{ x: 10, y: 10 }, { x: 110, y: 10 }]
        ];
        expect(TSStatsDisplay.countPenLifts(paths)).toBe(1);
      });

      test('should handle paths with points property', () => {
        const paths = [
          { points: [{ x: 10, y: 10 }, { x: 110, y: 10 }] },
          { points: [] }
        ];
        expect(TSStatsDisplay.countPenLifts(paths)).toBe(1);
      });
    });

    describe('estimatePlotTime', () => {
      test('should calculate time for single path', () => {
        const paths = [[{ x: 10, y: 10 }, { x: 110, y: 10 }]];
        const time = TSStatsDisplay.estimatePlotTime(paths);
        expect(time).toBeGreaterThan(0);
      });

      test('should include pen lift time', () => {
        const paths = [
          [{ x: 10, y: 10 }, { x: 110, y: 10 }],
          [{ x: 200, y: 10 }, { x: 300, y: 10 }]
        ];
        const time = TSStatsDisplay.estimatePlotTime(paths);
        // Should include time for 2 pen lifts (2 * 0.3s = 0.6s)
        expect(time).toBeGreaterThan(0.6);
      });

      test('should accept custom speed options', () => {
        const paths = [[{ x: 10, y: 10 }, { x: 110, y: 10 }]];
        const time1 = TSStatsDisplay.estimatePlotTime(paths, { drawSpeed: 100 });
        const time2 = TSStatsDisplay.estimatePlotTime(paths, { drawSpeed: 50 });
        expect(time2).toBeGreaterThan(time1);
      });

      test('should handle array coordinate format', () => {
        const paths = [[[10, 10], [110, 10]]];
        const time = TSStatsDisplay.estimatePlotTime(paths);
        expect(time).toBeGreaterThan(0);
      });
    });

    describe('getPlotterStats', () => {
      test('should return all stats', () => {
        const paths = [
          [{ x: 10, y: 10 }, { x: 110, y: 10 }],
          [{ x: 200, y: 10 }, { x: 300, y: 10 }]
        ];
        const stats = TSStatsDisplay.getPlotterStats(paths);

        expect(stats).toHaveProperty('pathLength');
        expect(stats).toHaveProperty('plotTime');
        expect(stats).toHaveProperty('penLifts');
        expect(stats).toHaveProperty('pathCount');
        expect(stats.pathCount).toBe(2);
        expect(stats.penLifts).toBe(2);
      });

      test('should accept custom options', () => {
        const paths = [[{ x: 10, y: 10 }, { x: 110, y: 10 }]];
        const stats = TSStatsDisplay.getPlotterStats(paths, { pxToMm: 1.0 });
        expect(stats.pathLength).toBe(100);
      });
    });
  });
});
