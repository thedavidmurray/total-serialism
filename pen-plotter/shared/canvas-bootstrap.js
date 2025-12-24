/**
 * Total Serialism - Canvas Bootstrap
 * Handles responsive canvas sizing, error boundaries, and lifecycle management
 *
 * Usage:
 *   <script src="../../shared/canvas-bootstrap.js"></script>
 *   <script>
 *     TSCanvas.init({
 *       container: '#canvas-container',
 *       aspectRatio: 1,           // 1 = square, 0.75 = portrait, etc.
 *       minSize: 400,
 *       maxSize: 1200,
 *       onResize: (width, height) => { /* redraw */ },
 *       onError: (error) => { /* handle */ }
 *     });
 *   </script>
 */

(function(global) {
  'use strict';

  const TSCanvas = {
    // State
    container: null,
    canvas: null,
    width: 800,
    height: 800,
    aspectRatio: 1,
    minSize: 300,
    maxSize: 2000,
    resizeObserver: null,
    resizeTimeout: null,
    isInitialized: false,

    // Callbacks
    onResize: null,
    onError: null,

    /**
     * Initialize the canvas system
     * @param {Object} options Configuration options
     */
    init: function(options = {}) {
      // Merge options
      this.aspectRatio = options.aspectRatio || 1;
      this.minSize = options.minSize || 300;
      this.maxSize = options.maxSize || 2000;
      this.onResize = options.onResize || null;
      this.onError = options.onError || null;

      // Find container
      const containerSelector = options.container || '#canvas-container';
      this.container = typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;

      if (!this.container) {
        console.error('[TSCanvas] Container not found:', containerSelector);
        return false;
      }

      // Calculate initial size
      this.calculateSize();

      // Set up ResizeObserver
      this.setupResizeObserver();

      // Set up error boundary
      this.setupErrorBoundary();

      // Mark as initialized
      this.isInitialized = true;

      console.log(`[TSCanvas] Initialized: ${this.width}x${this.height}`);
      return true;
    },

    /**
     * Calculate canvas size based on container and aspect ratio
     */
    calculateSize: function() {
      if (!this.container) return;

      const rect = this.container.getBoundingClientRect();
      const padding = 48; // Account for container padding

      let availableWidth = rect.width - padding;
      let availableHeight = rect.height - padding;

      // Calculate size maintaining aspect ratio
      let width, height;

      if (this.aspectRatio >= 1) {
        // Landscape or square
        width = Math.min(availableWidth, availableHeight * this.aspectRatio);
        height = width / this.aspectRatio;
      } else {
        // Portrait
        height = Math.min(availableHeight, availableWidth / this.aspectRatio);
        width = height * this.aspectRatio;
      }

      // Apply bounds
      width = Math.max(this.minSize, Math.min(this.maxSize, Math.floor(width)));
      height = Math.max(this.minSize / this.aspectRatio, Math.min(this.maxSize, Math.floor(height)));

      this.width = width;
      this.height = height;
    },

    /**
     * Set up ResizeObserver for responsive sizing
     */
    setupResizeObserver: function() {
      if (!this.container || !window.ResizeObserver) return;

      this.resizeObserver = new ResizeObserver((entries) => {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          const oldWidth = this.width;
          const oldHeight = this.height;

          this.calculateSize();

          // Only trigger callback if size actually changed
          if (this.width !== oldWidth || this.height !== oldHeight) {
            console.log(`[TSCanvas] Resized: ${this.width}x${this.height}`);

            if (this.onResize) {
              try {
                this.onResize(this.width, this.height);
              } catch (error) {
                this.handleError(error, 'resize callback');
              }
            }
          }
        }, 150);
      });

      this.resizeObserver.observe(this.container);
    },

    /**
     * Set up global error handling
     */
    setupErrorBoundary: function() {
      window.addEventListener('error', (event) => {
        // Only handle errors related to canvas/drawing
        if (event.message && (
          event.message.includes('p5') ||
          event.message.includes('canvas') ||
          event.message.includes('draw')
        )) {
          this.handleError(event.error || event.message, 'global');
          event.preventDefault();
        }
      });
    },

    /**
     * Handle errors gracefully
     * @param {Error|string} error The error
     * @param {string} context Where the error occurred
     */
    handleError: function(error, context = 'unknown') {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[TSCanvas] Error in ${context}:`, message);

      // Show error in UI
      this.showErrorState(message);

      // Call user error handler
      if (this.onError) {
        this.onError(error, context);
      }
    },

    /**
     * Show loading state in container
     */
    showLoadingState: function() {
      if (!this.container) return;

      const existing = this.container.querySelector('.ts-canvas-loading');
      if (existing) return;

      const loader = document.createElement('div');
      loader.className = 'ts-canvas-loading ts-loading-state';
      loader.innerHTML = `
        <div class="ts-spinner"></div>
        <span style="font-size: 0.75rem; letter-spacing: 0.1em; color: var(--ts-text-muted);">GENERATING</span>
      `;
      this.container.appendChild(loader);
    },

    /**
     * Hide loading state
     */
    hideLoadingState: function() {
      if (!this.container) return;

      const loader = this.container.querySelector('.ts-canvas-loading');
      if (loader) {
        loader.remove();
      }
    },

    /**
     * Show error state in container
     * @param {string} message Error message
     */
    showErrorState: function(message) {
      if (!this.container) return;

      // Remove loading state if present
      this.hideLoadingState();

      const existing = this.container.querySelector('.ts-error-state');
      if (existing) existing.remove();

      const errorEl = document.createElement('div');
      errorEl.className = 'ts-error-state ts-fade-in';
      errorEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="ts-error-message">${message}</p>
        <button class="ts-btn ts-btn-secondary ts-mt-lg" onclick="location.reload()">
          Reload Page
        </button>
      `;
      this.container.appendChild(errorEl);
    },

    /**
     * Clear error state
     */
    clearErrorState: function() {
      if (!this.container) return;

      const errorEl = this.container.querySelector('.ts-error-state');
      if (errorEl) errorEl.remove();
    },

    /**
     * Get current dimensions
     * @returns {Object} {width, height}
     */
    getSize: function() {
      return {
        width: this.width,
        height: this.height
      };
    },

    /**
     * Clean up resources
     */
    destroy: function() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      clearTimeout(this.resizeTimeout);
      this.isInitialized = false;
    }
  };

  // Auto-regeneration manager
  const TSAutoRegen = {
    enabled: true,
    callback: null,
    debounceMs: 100,
    timeout: null,

    /**
     * Initialize auto-regeneration
     * @param {Function} callback Function to call when regenerating
     * @param {number} debounceMs Debounce time in ms
     */
    init: function(callback, debounceMs = 100) {
      this.callback = callback;
      this.debounceMs = debounceMs;

      // Load preference from localStorage
      const saved = localStorage.getItem('ts-auto-regen');
      this.enabled = saved !== null ? saved === 'true' : true;

      // Set up toggle if it exists
      this.setupToggle();

      return this;
    },

    /**
     * Set up the auto-regen toggle UI
     */
    setupToggle: function() {
      const toggle = document.getElementById('autoRegen');
      const container = document.querySelector('.ts-auto-regen');

      if (toggle) {
        toggle.checked = this.enabled;

        toggle.addEventListener('change', (e) => {
          this.setEnabled(e.target.checked);
        });
      }

      // Update visual state
      if (container) {
        container.classList.toggle('active', this.enabled);
      }
    },

    /**
     * Enable or disable auto-regeneration
     * @param {boolean} enabled
     */
    setEnabled: function(enabled) {
      this.enabled = enabled;
      localStorage.setItem('ts-auto-regen', String(enabled));

      // Update UI
      const container = document.querySelector('.ts-auto-regen');
      if (container) {
        container.classList.toggle('active', enabled);
      }

      // Update toggle checkbox
      const toggle = document.getElementById('autoRegen');
      if (toggle && toggle.checked !== enabled) {
        toggle.checked = enabled;
      }

      console.log(`[TSAutoRegen] ${enabled ? 'Enabled' : 'Disabled'}`);
    },

    /**
     * Trigger regeneration (respects enabled state and debounce)
     */
    trigger: function() {
      if (!this.enabled || !this.callback) return;

      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        try {
          this.callback();
        } catch (error) {
          console.error('[TSAutoRegen] Error in callback:', error);
        }
      }, this.debounceMs);
    },

    /**
     * Force regeneration (ignores enabled state)
     */
    force: function() {
      if (!this.callback) return;

      clearTimeout(this.timeout);
      try {
        this.callback();
      } catch (error) {
        console.error('[TSAutoRegen] Error in callback:', error);
      }
    }
  };

  // Control helpers
  const TSControls = {
    /**
     * Attach change listeners to all controls that trigger auto-regen
     * @param {string} containerSelector Selector for controls container
     */
    attachListeners: function(containerSelector = '#controls') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      // Sliders
      container.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', () => {
          this.updateSliderValue(slider);
          TSAutoRegen.trigger();
        });
        // Initialize value display
        this.updateSliderValue(slider);
      });

      // Checkboxes (except auto-regen toggle)
      container.querySelectorAll('input[type="checkbox"]:not(#autoRegen)').forEach(checkbox => {
        checkbox.addEventListener('change', () => TSAutoRegen.trigger());
      });

      // Selects
      container.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => TSAutoRegen.trigger());
      });

      // Number inputs
      container.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', () => TSAutoRegen.trigger());
      });

      // Color inputs
      container.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', () => TSAutoRegen.trigger());
      });

      // Regenerate button
      const regenBtn = document.getElementById('regenerateBtn');
      if (regenBtn) {
        regenBtn.addEventListener('click', () => TSAutoRegen.force());
      }

      console.log('[TSControls] Listeners attached');
    },

    /**
     * Update slider value display
     * @param {HTMLInputElement} slider The slider element
     */
    updateSliderValue: function(slider) {
      // Find associated value display
      const label = slider.closest('.ts-control-row')?.querySelector('.ts-label-value');
      const legacyLabel = slider.parentElement?.querySelector('.slider-value');

      const display = label || legacyLabel;
      if (display) {
        display.textContent = slider.value;
      }

      // Update CSS variable for fill (if using ts-slider-container)
      const container = slider.closest('.ts-slider-container');
      if (container) {
        const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        container.style.setProperty('--progress', percent);
      }
    },

    /**
     * Get all parameter values from controls
     * @param {string} containerSelector
     * @returns {Object} Parameter name -> value map
     */
    getValues: function(containerSelector = '#controls') {
      const container = document.querySelector(containerSelector);
      if (!container) return {};

      const values = {};

      container.querySelectorAll('input, select').forEach(el => {
        const name = el.name || el.id;
        if (!name) return;

        if (el.type === 'checkbox') {
          values[name] = el.checked;
        } else if (el.type === 'range' || el.type === 'number') {
          values[name] = parseFloat(el.value);
        } else {
          values[name] = el.value;
        }
      });

      return values;
    },

    /**
     * Set control values
     * @param {Object} values Parameter name -> value map
     * @param {string} containerSelector
     */
    setValues: function(values, containerSelector = '#controls') {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      Object.entries(values).forEach(([name, value]) => {
        const el = container.querySelector(`[name="${name}"], #${name}`);
        if (!el) return;

        if (el.type === 'checkbox') {
          el.checked = Boolean(value);
        } else {
          el.value = value;
          if (el.type === 'range') {
            this.updateSliderValue(el);
          }
        }
      });
    },

    /**
     * Set up collapsible sections
     */
    setupCollapsible: function() {
      document.querySelectorAll('.ts-control-group-header').forEach(header => {
        header.addEventListener('click', () => {
          const group = header.closest('.ts-control-group');
          if (group) {
            group.classList.toggle('collapsed');
          }
        });
      });
    }
  };

  // Toast notifications
  const TSToast = {
    container: null,
    timeout: null,

    /**
     * Show a toast notification
     * @param {string} message
     * @param {string} type 'success' | 'error' | 'info'
     * @param {number} duration Duration in ms
     */
    show: function(message, type = 'info', duration = 3000) {
      // Create or get container
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'ts-toast';
        document.body.appendChild(this.container);
      }

      // Update content
      this.container.textContent = message;
      this.container.className = `ts-toast ${type}`;

      // Show
      requestAnimationFrame(() => {
        this.container.classList.add('show');
      });

      // Auto-hide
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.hide();
      }, duration);
    },

    /**
     * Hide the toast
     */
    hide: function() {
      if (this.container) {
        this.container.classList.remove('show');
      }
    }
  };

  // Mobile drawer
  const TSDrawer = {
    panel: null,
    handle: null,
    startY: 0,
    currentY: 0,

    /**
     * Initialize mobile drawer functionality
     */
    init: function() {
      this.panel = document.querySelector('.ts-control-panel');
      if (!this.panel) return;

      // Create drawer handle if not exists
      if (!this.panel.querySelector('.ts-drawer-handle')) {
        this.handle = document.createElement('div');
        this.handle.className = 'ts-drawer-handle';
        this.panel.insertBefore(this.handle, this.panel.firstChild);
      } else {
        this.handle = this.panel.querySelector('.ts-drawer-handle');
      }

      // Click to toggle
      this.handle.addEventListener('click', () => this.toggle());

      // Touch gestures
      this.setupTouchGestures();
    },

    /**
     * Set up touch gestures for drawer
     */
    setupTouchGestures: function() {
      if (!this.handle) return;

      this.handle.addEventListener('touchstart', (e) => {
        this.startY = e.touches[0].clientY;
      }, { passive: true });

      this.handle.addEventListener('touchmove', (e) => {
        this.currentY = e.touches[0].clientY;
      }, { passive: true });

      this.handle.addEventListener('touchend', () => {
        const delta = this.startY - this.currentY;
        if (Math.abs(delta) > 50) {
          if (delta > 0) {
            this.open();
          } else {
            this.close();
          }
        }
      });
    },

    /**
     * Toggle drawer open/closed
     */
    toggle: function() {
      if (this.panel) {
        this.panel.classList.toggle('open');
      }
    },

    /**
     * Open drawer
     */
    open: function() {
      if (this.panel) {
        this.panel.classList.add('open');
      }
    },

    /**
     * Close drawer
     */
    close: function() {
      if (this.panel) {
        this.panel.classList.remove('open');
      }
    }
  };

  // Export to global scope
  global.TSCanvas = TSCanvas;
  global.TSAutoRegen = TSAutoRegen;
  global.TSControls = TSControls;
  global.TSToast = TSToast;
  global.TSDrawer = TSDrawer;

})(typeof window !== 'undefined' ? window : this);
