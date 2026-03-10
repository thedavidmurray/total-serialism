/**
 * TSStatsDisplay - Statistics display for Total Serialism algorithms
 *
 * Displays real-time algorithm metrics in a bar at the top of the canvas area.
 * Supports multiple stats, automatic number formatting, and debounced updates.
 */

(function(global) {
  'use strict';

  /**
   * Default options for TSStatsDisplay
   */
  const DEFAULTS = {
    containerSelector: '#canvas-container',
    visible: true,
    debounceMs: 0,
    emptyLabel: '—',
    numberFormat: { useGrouping: true }
  };

  /**
   * TSStatsDisplay class
   */
  class TSStatsDisplay {
    constructor(options = {}) {
      if (typeof options === 'string') {
        options = {
          containerSelector: options.startsWith('#') ? options : `#${options}`
        };
      }

      this.options = { ...DEFAULTS, ...options };
      this._container = null;
      this._barEl = null;
      this._stats = new Map();
      this._visible = this.options.visible;
      this._updateTimer = null;
      this._pendingStats = null;
      this._attached = false;
    }

    /**
     * Attach stats display to DOM
     * @returns {TSStatsDisplay} this for chaining
     */
    attach() {
      if (this._attached) {
        console.warn('[TSStatsDisplay] Already attached. Call destroy() first.');
        return this;
      }

      // For Dan Catt-style header, insert at body level
      // containerSelector is kept for backwards compatibility but bar goes to body
      this._container = document.querySelector(this.options.containerSelector);
      if (!this._container) {
        console.warn('[TSStatsDisplay] Container not found, falling back to document.body:', this.options.containerSelector);
        this._container = document.body;
      }

      // Create stats bar
      this._barEl = document.createElement('div');
      this._barEl.className = 'ts-stats-bar';
      this._barEl.id = 'ts-stats-bar';
      this._barEl.setAttribute('role', 'status');
      this._barEl.setAttribute('aria-live', 'polite');

      // Apply initial visibility
      if (!this._visible) {
        this._barEl.classList.add('hidden');
      }

      // Insert at body level for viewport-fixed header (Dan Catt style)
      document.body.insertBefore(this._barEl, document.body.firstChild);

      this._attached = true;
      return this;
    }

    /**
     * Update all displayed stats
     * @param {Object|Array} stats - Stats data
     */
    update(stats) {
      if (!stats || typeof stats !== 'object') {
        return;
      }

      this._pendingStats = stats;

      if (this.options.debounceMs === 0) {
        this._applyUpdate();
      } else {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(() => {
          this._applyUpdate();
        }, this.options.debounceMs);
      }
    }

    /**
     * Apply pending stats update to DOM
     */
    _applyUpdate() {
      if (!this._barEl || !this._pendingStats) return;

      // Clear existing stats
      this._stats.clear();
      this._barEl.replaceChildren();

      // Normalize to array format
      const statsArray = this._normalizeStats(this._pendingStats);

      // Render each stat
      for (const stat of statsArray) {
        this._renderStat(stat);
      }

      this._pendingStats = null;
    }

    /**
     * Normalize stats to array format
     */
    _normalizeStats(stats) {
      if (Array.isArray(stats)) {
        return stats;
      }

      // Object format
      return Object.entries(stats).map(([key, value]) => {
        if (value && typeof value === 'object' && 'value' in value) {
          return { key, ...value };
        }
        return { key, value };
      });
    }

    /**
     * Render a single stat item
     */
    _renderStat(stat) {
      const { key, value, label, format } = stat;

      const item = document.createElement('div');
      item.className = 'ts-stats-item';
      item.setAttribute('data-stat-key', key);

      const labelEl = document.createElement('span');
      labelEl.className = 'ts-stats-label';
      labelEl.textContent = label || this._titleCase(key);

      const valueEl = document.createElement('span');
      valueEl.className = 'ts-stats-value';
      valueEl.textContent = this._formatValue(value, format);

      item.appendChild(labelEl);
      item.appendChild(valueEl);
      this._barEl.appendChild(item);

      this._stats.set(key, { value, label, format, element: item });
    }

    /**
     * Set or update a single stat
     * @param {string} key - Stat key
     * @param {number|string} value - Stat value
     * @param {string} [label] - Custom label
     */
    set(key, value, label) {
      if (!this._barEl) return;

      const existing = this._stats.get(key);

      if (existing) {
        // Update existing
        const valueEl = existing.element.querySelector('.ts-stats-value');
        if (valueEl) {
          valueEl.textContent = this._formatValue(value, existing.format);
        }
        existing.value = value;
      } else {
        // Add new
        this._renderStat({
          key,
          value,
          label: label || this._titleCase(key)
        });
      }
    }

    /**
     * Backwards-compatible alias used by older algorithms.
     * @param {string} label Human-readable label
     * @param {number|string} value Stat value
     */
    add(label, value) {
      this.set(this._statKey(label), value, label);
    }

    /**
     * Backwards-compatible alias used by older algorithms.
     * @param {string} label Human-readable label
     * @param {number|string} value Stat value
     */
    setValue(label, value) {
      this.set(this._statKey(label), value, label);
    }

    /**
     * Backwards-compatible alias used by older algorithms.
     * @param {string} label Human-readable label
     * @param {number|string} value Stat value
     */
    setCustomStat(label, value) {
      this.set(this._statKey(label), value, label);
    }

    /**
     * Clear all stats
     */
    clear() {
      if (this._barEl) {
        this._barEl.replaceChildren();
      }
      this._stats.clear();
    }

    /**
     * Show stats bar
     */
    show() {
      this._visible = true;
      if (this._barEl) {
        this._barEl.classList.remove('hidden');
      }
    }

    /**
     * Hide stats bar
     */
    hide() {
      this._visible = false;
      if (this._barEl) {
        this._barEl.classList.add('hidden');
      }
    }

    /**
     * Check if stats bar is visible
     * @returns {boolean}
     */
    isVisible() {
      return this._visible;
    }

    /**
     * Remove stats display from DOM
     */
    destroy() {
      // Clear pending timer
      if (this._updateTimer) {
        clearTimeout(this._updateTimer);
        this._updateTimer = null;
      }

      // Remove from DOM
      if (this._barEl && this._barEl.parentNode) {
        this._barEl.parentNode.removeChild(this._barEl);
      }

      this._barEl = null;
      this._container = null;
      this._stats.clear();
      this._attached = false;
    }

    /**
     * Format a value for display
     */
    _formatValue(value, format) {
      // Handle empty/invalid values
      if (value === undefined || value === null) {
        return this.options.emptyLabel;
      }

      // String values pass through
      if (typeof value === 'string') {
        return value;
      }

      // Handle invalid numbers (NaN, Infinity)
      if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) {
        return this.options.emptyLabel;
      }

      // Apply explicit format
      if (format === 'raw') {
        return String(value);
      }

      if (format === 'time') {
        return this._formatTime(value);
      }

      if (format === 'percent') {
        return this._formatPercent(value);
      }

      // Default number formatting
      return this._formatNumber(value);
    }

    /**
     * Format a number with thousand separators
     */
    _formatNumber(value) {
      if (typeof value !== 'number') {
        return String(value);
      }

      // Check if integer or has decimals
      if (Number.isInteger(value)) {
        return value.toLocaleString('en-US');
      }

      // Float - limit to 2 decimal places
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    /**
     * Format a time value (seconds to ms/s display)
     */
    _formatTime(seconds) {
      if (seconds < 1) {
        // Show as milliseconds
        return Math.round(seconds * 1000) + 'ms';
      }
      // Show as seconds with 2 decimals
      return seconds.toFixed(2) + 's';
    }

    /**
     * Format a value as percentage
     */
    _formatPercent(value) {
      return (value * 100).toFixed(1) + '%';
    }

    /**
     * Normalize a human-readable stat label to a stable key.
     */
    _statKey(label) {
      return String(label)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'stat';
    }

    /**
     * Convert key to title case for label
     */
    _titleCase(str) {
      // Handle camelCase
      const spaced = str.replace(/([A-Z])/g, ' $1').trim();
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    // Convenience methods

    /**
     * Set lines stat
     * @param {number} count
     */
    setLines(count) {
      this.set('lines', count, 'Lines');
    }

    /**
     * Set vertices stat
     * @param {number} count
     */
    setVertices(count) {
      this.set('vertices', count, 'Vertices');
    }

    /**
     * Set seed stat
     * @param {number} seed
     */
    setSeed(seed) {
      this.set('seed', seed, 'Seed');
    }

    /**
     * Set generation stat
     * @param {number} gen
     */
    setGeneration(gen) {
      this.set('generation', gen, 'Gen');
    }

    /**
     * Set points stat
     * @param {number} count
     */
    setPoints(count) {
      this.set('points', count, 'Points');
    }

    /**
     * Backwards-compatible helper for ring-based algorithms.
     * @param {number} count
     */
    setRings(count) {
      this.set('rings', count, 'Rings');
    }

    // ==========================================
    // PLOTTER-SPECIFIC STATS
    // ==========================================

    /**
     * Set total path length
     * @param {number} mm Length in millimeters
     */
    setPathLength(mm) {
      const formatted = mm >= 1000
        ? (mm / 1000).toFixed(2) + 'm'
        : mm.toFixed(1) + 'mm';
      this.set('pathLength', formatted, 'Path Length');
    }

    /**
     * Set estimated plot time
     * @param {number} seconds Time in seconds
     */
    setPlotTime(seconds) {
      let formatted;
      if (seconds < 60) {
        formatted = Math.round(seconds) + 's';
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        formatted = `${mins}m ${secs}s`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        formatted = `${hours}h ${mins}m`;
      }
      this.set('plotTime', formatted, 'Est. Time');
    }

    /**
     * Set pen lift count
     * @param {number} count Number of pen lifts
     */
    setPenLifts(count) {
      this.set('penLifts', count, 'Pen Lifts');
    }

    /**
     * Set path count
     * @param {number} count Number of paths
     */
    setPathCount(count) {
      this.set('pathCount', count, 'Paths');
    }

    /**
     * Set all plotter stats at once
     * @param {Object} stats Object with pathLength, plotTime, penLifts, pathCount
     */
    setPlotterStats(stats) {
      if (stats.pathLength !== undefined) this.setPathLength(stats.pathLength);
      if (stats.plotTime !== undefined) this.setPlotTime(stats.plotTime);
      if (stats.penLifts !== undefined) this.setPenLifts(stats.penLifts);
      if (stats.pathCount !== undefined) this.setPathCount(stats.pathCount);
    }

    /**
     * Backwards-compatible alias used by older algorithms.
     * @param {Object|Array} stats
     */
    updateStats(stats) {
      this.update(stats);
    }
  }

  // ==========================================
  // STATIC CALCULATION UTILITIES
  // ==========================================

  /**
   * Calculate total path length from paths array
   * @param {Array} paths Array of path objects with points [{x, y}]
   * @param {number} pxToMm Pixels to mm conversion (default: 0.264583 for 96dpi)
   * @returns {number} Total length in mm
   */
  TSStatsDisplay.calculatePathLength = function(paths, pxToMm = 0.264583) {
    let totalLength = 0;

    paths.forEach(path => {
      const points = path.points || path;
      if (!Array.isArray(points) || points.length < 2) return;

      // Helper to get coordinate (handles both {x,y} objects and [x,y] arrays)
      // Uses !== undefined to correctly handle zero values
      const getX = (p) => p.x !== undefined ? p.x : p[0];
      const getY = (p) => p.y !== undefined ? p.y : p[1];

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const dx = getX(p2) - getX(p1);
        const dy = getY(p2) - getY(p1);
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    });

    return totalLength * pxToMm;
  };

  /**
   * Estimate plot time based on path length and pen movements
   * @param {Array} paths Array of path objects
   * @param {Object} options Plotter speed settings
   * @returns {number} Estimated time in seconds
   */
  TSStatsDisplay.estimatePlotTime = function(paths, options = {}) {
    const drawSpeed = options.drawSpeed || 50;      // mm/s while drawing (default: 50mm/s)
    const travelSpeed = options.travelSpeed || 100; // mm/s while traveling (default: 100mm/s)
    const penLiftTime = options.penLiftTime || 0.3; // seconds per pen lift/lower cycle
    const pxToMm = options.pxToMm || 0.264583;

    let drawDistance = 0;
    let travelDistance = 0;
    let penLifts = 0;
    let lastPoint = null;

    paths.forEach(path => {
      const points = path.points || path;
      if (!Array.isArray(points) || points.length < 2) return;

      // Travel to start of path
      const firstPoint = points[0];
      const fx = firstPoint.x !== undefined ? firstPoint.x : firstPoint[0];
      const fy = firstPoint.y !== undefined ? firstPoint.y : firstPoint[1];

      if (lastPoint) {
        const dx = fx - lastPoint.x;
        const dy = fy - lastPoint.y;
        travelDistance += Math.sqrt(dx * dx + dy * dy);
      }
      penLifts++;

      // Draw the path
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const x1 = p1.x !== undefined ? p1.x : p1[0];
        const y1 = p1.y !== undefined ? p1.y : p1[1];
        const x2 = p2.x !== undefined ? p2.x : p2[0];
        const y2 = p2.y !== undefined ? p2.y : p2[1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        drawDistance += Math.sqrt(dx * dx + dy * dy);
      }

      // Update last point
      const lastPathPoint = points[points.length - 1];
      lastPoint = {
        x: lastPathPoint.x !== undefined ? lastPathPoint.x : lastPathPoint[0],
        y: lastPathPoint.y !== undefined ? lastPathPoint.y : lastPathPoint[1]
      };
    });

    // Convert to mm and calculate time
    const drawMm = drawDistance * pxToMm;
    const travelMm = travelDistance * pxToMm;

    const drawTime = drawMm / drawSpeed;
    const travelTime = travelMm / travelSpeed;
    const penTime = penLifts * penLiftTime;

    return drawTime + travelTime + penTime;
  };

  /**
   * Count pen lifts (number of separate paths)
   * @param {Array} paths Array of path objects
   * @returns {number} Number of pen lifts
   */
  TSStatsDisplay.countPenLifts = function(paths) {
    return paths.filter(path => {
      const points = path.points || path;
      return Array.isArray(points) && points.length >= 2;
    }).length;
  };

  /**
   * Get all plotter stats for a paths array
   * @param {Array} paths Array of path objects
   * @param {Object} options Speed settings, pxToMm conversion
   * @returns {Object} {pathLength, plotTime, penLifts, pathCount}
   */
  TSStatsDisplay.getPlotterStats = function(paths, options = {}) {
    const pathLength = this.calculatePathLength(paths, options.pxToMm);
    const plotTime = this.estimatePlotTime(paths, options);
    const penLifts = this.countPenLifts(paths);
    const pathCount = paths.length;

    return { pathLength, plotTime, penLifts, pathCount };
  }

  // Static defaults
  TSStatsDisplay.DEFAULTS = DEFAULTS;

  // Export for Node (testing) and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TSStatsDisplay;
  }
  global.TSStatsDisplay = TSStatsDisplay;

})(typeof window !== 'undefined' ? window : global);
