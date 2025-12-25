/**
 * Total Serialism - Canvas Controls Manager
 * Provides unified canvas control handling for all algorithms
 *
 * Features:
 * - Consistent default colors across all algorithms
 * - Event listener management with cleanup
 * - Paper size management
 * - Color randomization with WCAG AA contrast
 * - Parameter locking
 *
 * Usage:
 *   const controls = new TSCanvasControls();
 *   controls.bind(params, { autoRegen: true, regenCallback: draw });
 */

(function(global) {
  'use strict';

  class TSCanvasControls {
    /**
     * Default values for canvas controls
     * These are the ONLY source of truth - no more inconsistent defaults
     */
    static DEFAULTS = {
      paperSize: 'a4',
      bgColor: '#ffffff',
      strokeColor: '#000000',
      strokeWeight: 1
    };

    /**
     * Standard paper sizes in pixels (at 96 DPI)
     */
    static PAPER_SIZES = {
      'a4': { width: 794, height: 1123 },
      'a3': { width: 1123, height: 1587 },
      'letter': { width: 816, height: 1056 },
      'square': { width: 800, height: 800 },
      'a4-landscape': { width: 1123, height: 794 },
      'a3-landscape': { width: 1587, height: 1123 }
    };

    /**
     * Pre-defined color pairs with guaranteed WCAG AA contrast
     */
    static SAFE_COLOR_PAIRS = [
      { bg: '#ffffff', stroke: '#000000' },
      { bg: '#000000', stroke: '#ffffff' },
      { bg: '#1a1a2e', stroke: '#eaeaea' },
      { bg: '#f5f5dc', stroke: '#2f4f4f' },
      { bg: '#2c3e50', stroke: '#ecf0f1' },
      { bg: '#fdf6e3', stroke: '#073642' },
      { bg: '#002b36', stroke: '#fdf6e3' },
      { bg: '#282a36', stroke: '#f8f8f2' },
      { bg: '#1e1e1e', stroke: '#d4d4d4' },
      { bg: '#f8f8f8', stroke: '#24292e' }
    ];

    /**
     * Create a new canvas controls manager
     * @param {Object} config - Initial configuration
     */
    constructor(config = {}) {
      this.params = { ...TSCanvasControls.DEFAULTS, ...config };
      this.listeners = new Map();
      this.lockedParams = new Set();
      this.boundParams = null;
      this.regenCallback = null;
      this.autoRegen = false;
    }

    /**
     * Bind canvas controls to an algorithm's params object
     * @param {Object} paramsObject - The algorithm's params object to bind to
     * @param {Object} options - Binding options
     * @param {boolean} options.autoRegen - Auto-trigger regeneration on change
     * @param {Function} options.regenCallback - Function to call for regeneration
     * @returns {TSCanvasControls} this for chaining
     */
    bind(paramsObject, options = {}) {
      // Merge our controls into the algorithm's params
      Object.assign(paramsObject, this.params);
      this.boundParams = paramsObject;

      if (options.autoRegen) {
        this.autoRegen = true;
        this.regenCallback = options.regenCallback || null;
      }

      return this;
    }

    /**
     * Set up event listeners on DOM elements
     * @param {Function} regenCallback - Function to call when values change
     */
    setupEventListeners(regenCallback) {
      // Store callback if provided
      if (regenCallback) {
        this.regenCallback = regenCallback;
      }

      // Define element-to-param mappings
      // Event type auto-detected based on element type
      const mappings = [
        { id: 'paperSize', param: 'paperSize' },
        { id: 'bgColor', param: 'bgColor' },
        { id: 'strokeColor', param: 'strokeColor' },
        { id: 'strokeWeight', param: 'strokeWeight', transform: parseFloat }
      ];

      mappings.forEach(({ id, param, transform }) => {
        const element = document.getElementById(id);
        if (!element) return;

        // Don't attach if already attached
        if (this.listeners.has(element)) return;

        // Auto-detect event type based on element
        const isSelect = element.tagName === 'SELECT';
        const isColorInput = element.type === 'color';
        const event = isSelect ? 'change' : (isColorInput ? 'input' : 'change');

        const handler = (e) => {
          try {
            const value = transform ? transform(e.target.value) : e.target.value;
            this.params[param] = value;

            if (this.boundParams) {
              this.boundParams[param] = value;
            }

            if (this.autoRegen && this.regenCallback) {
              this.regenCallback();
            }
          } catch (error) {
            console.error(`[TSCanvasControls] Error in ${param} handler:`, error);
          }
        };

        element.addEventListener(event, handler);
        this.listeners.set(element, { event, handler });
      });

      // Set up beforeunload cleanup
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => this.cleanup());
      }
    }

    /**
     * Set up the Randomize All button
     * @param {string} buttonId - ID of the randomize button
     */
    setupRandomizeButton(buttonId) {
      const button = document.getElementById(buttonId);
      if (!button) return;

      const handler = () => {
        this.randomizeAll();
      };

      button.addEventListener('click', handler);
      this.listeners.set(button, { event: 'click', handler });
    }

    /**
     * Remove all attached event listeners
     */
    cleanup() {
      this.listeners.forEach(({ event, handler }, element) => {
        element.removeEventListener(event, handler);
      });
      this.listeners.clear();
    }

    /**
     * Get canvas dimensions for current paper size
     * @returns {Object} { width, height }
     */
    getCanvasSize() {
      const size = TSCanvasControls.PAPER_SIZES[this.params.paperSize];
      if (!size) {
        // Fallback to square if unknown paper size
        return TSCanvasControls.PAPER_SIZES['square'];
      }
      return { ...size };
    }

    /**
     * Randomize colors while ensuring WCAG AA contrast
     * @returns {Object} { bgColor, strokeColor }
     */
    randomizeColors() {
      let bgColor, strokeColor;
      let attempts = 0;
      const maxAttempts = 50;

      // Try to generate random colors with good contrast
      while (attempts < maxAttempts) {
        bgColor = TSCanvasControls.generateRandomColor();
        strokeColor = TSCanvasControls.generateContrastingColor(bgColor, 4.5);

        if (TSCanvasControls.getContrastRatio(bgColor, strokeColor) >= 4.5) {
          break;
        }
        attempts++;
      }

      // Fallback to safe pair if we couldn't generate good contrast
      if (attempts >= maxAttempts) {
        const pair = TSCanvasControls.SAFE_COLOR_PAIRS[
          Math.floor(Math.random() * TSCanvasControls.SAFE_COLOR_PAIRS.length)
        ];
        bgColor = pair.bg;
        strokeColor = pair.stroke;
      }

      // Update params if not locked
      if (!this.isLocked('bgColor')) {
        this.params.bgColor = bgColor;
        if (this.boundParams) this.boundParams.bgColor = bgColor;
        this.updateDOMValue('bgColor', bgColor);
      }

      if (!this.isLocked('strokeColor')) {
        this.params.strokeColor = strokeColor;
        if (this.boundParams) this.boundParams.strokeColor = strokeColor;
        this.updateDOMValue('strokeColor', strokeColor);
      }

      return { bgColor: this.params.bgColor, strokeColor: this.params.strokeColor };
    }

    /**
     * Randomize all unlocked parameters
     */
    randomizeAll() {
      this.randomizeColors();

      if (this.autoRegen && this.regenCallback) {
        this.regenCallback();
      }
    }

    /**
     * Update a DOM input value
     * @param {string} id - Element ID
     * @param {string} value - New value
     */
    updateDOMValue(id, value) {
      const element = document.getElementById(id);
      if (!element) return;

      if (element.tagName === 'SELECT') {
        // For select elements, try to find matching option
        const option = Array.from(element.options).find(opt => opt.value === value);
        if (option) {
          element.value = value;
        }
        // If no matching option, don't change (select stays on current value)
      } else {
        element.value = value;
      }
    }

    /**
     * Lock a parameter from randomization
     * @param {string} param - Parameter name
     */
    lockParameter(param) {
      this.lockedParams.add(param);
    }

    /**
     * Unlock a parameter for randomization
     * @param {string} param - Parameter name
     */
    unlockParameter(param) {
      this.lockedParams.delete(param);
    }

    /**
     * Toggle lock state of a parameter
     * @param {string} param - Parameter name
     */
    toggleLock(param) {
      if (this.lockedParams.has(param)) {
        this.lockedParams.delete(param);
      } else {
        this.lockedParams.add(param);
      }
    }

    /**
     * Check if a parameter is locked
     * @param {string} param - Parameter name
     * @returns {boolean}
     */
    isLocked(param) {
      return this.lockedParams.has(param);
    }

    // ==================== Static Utility Methods ====================

    /**
     * Validate a hex color string
     * @param {string} hex - Color string to validate
     * @returns {boolean}
     */
    static validateColor(hex) {
      if (!hex || typeof hex !== 'string') return false;

      // Add # if missing
      const normalized = hex.startsWith('#') ? hex : `#${hex}`;

      // Check valid hex format (3, 4, 6, or 8 hex digits)
      return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized);
    }

    /**
     * Generate a random hex color
     * @returns {string} Hex color string
     */
    static generateRandomColor() {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Generate a contrasting color that meets the specified contrast ratio
     * @param {string} baseColor - The base color to contrast against
     * @param {number} minRatio - Minimum contrast ratio (default 4.5 for WCAG AA)
     * @returns {string} Contrasting hex color
     */
    static generateContrastingColor(baseColor, minRatio = 4.5) {
      // First, check which of black/white gives better contrast
      const blackRatio = TSCanvasControls.getContrastRatio(baseColor, '#000000');
      const whiteRatio = TSCanvasControls.getContrastRatio(baseColor, '#ffffff');

      // If black or white meets threshold, use that as a starting point
      const preferLight = whiteRatio > blackRatio;

      // Try to generate a color in the preferred direction
      for (let i = 0; i < 50; i++) {
        let r, g, b;

        if (preferLight) {
          // Generate very light colors (220-255 for guaranteed high contrast)
          r = 220 + Math.floor(Math.random() * 35);
          g = 220 + Math.floor(Math.random() * 35);
          b = 220 + Math.floor(Math.random() * 35);
        } else {
          // Generate very dark colors (0-35 for guaranteed high contrast)
          r = Math.floor(Math.random() * 35);
          g = Math.floor(Math.random() * 35);
          b = Math.floor(Math.random() * 35);
        }

        const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        if (TSCanvasControls.getContrastRatio(baseColor, color) >= minRatio) {
          return color;
        }
      }

      // Guaranteed fallback: pure black or white (one of these ALWAYS meets 4.5:1 for any color)
      return preferLight ? '#ffffff' : '#000000';
    }

    /**
     * Calculate relative luminance of a color
     * @param {string} hex - Hex color string
     * @returns {number} Luminance value (0-1)
     */
    static getLuminance(hex) {
      // Parse hex
      const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
      const r = parseInt(normalized.slice(0, 2), 16) / 255;
      const g = parseInt(normalized.slice(2, 4), 16) / 255;
      const b = parseInt(normalized.slice(4, 6), 16) / 255;

      // Convert to linear RGB
      const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      const rLin = toLinear(r);
      const gLin = toLinear(g);
      const bLin = toLinear(b);

      // Calculate luminance
      return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    }

    /**
     * Calculate contrast ratio between two colors
     * @param {string} color1 - First hex color
     * @param {string} color2 - Second hex color
     * @returns {number} Contrast ratio (1-21)
     */
    static getContrastRatio(color1, color2) {
      const l1 = TSCanvasControls.getLuminance(color1);
      const l2 = TSCanvasControls.getLuminance(color2);

      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);

      return (lighter + 0.05) / (darker + 0.05);
    }
  }

  // Export for Node.js (testing) and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TSCanvasControls;
  }

  // Add to global scope for browser
  global.TSCanvasControls = TSCanvasControls;

})(typeof window !== 'undefined' ? window : global);
