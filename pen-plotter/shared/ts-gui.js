/**
 * TSGui - dat.gui wrapper for Total Serialism pen plotter algorithms
 *
 * Provides a simplified API for creating floating control panels with:
 * - Standard folder organization (Settings > Custom > Export)
 * - LocalStorage persistence
 * - Integration with TSStatsDisplay and TSExport
 * - Dan Catt-style floating accordion UI
 *
 * Usage:
 *   const gui = new TSGui({ algorithmId: 'harmonograph' });
 *   gui.addSlider(params, 'frequency', 0, 10, { folder: 'custom' });
 *   gui.addColor(params, 'strokeColor', { folder: 'settings' });
 *   gui.onAnyChange(() => regenerate());
 */

(function(global) {
  'use strict';

  // Check if dat.gui is loaded
  if (typeof dat === 'undefined') {
    console.error('[TSGui] dat.gui library not found. Include it before ts-gui.js');
    console.error('Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.9/dat.gui.min.js"></script>');
    return;
  }

  /**
   * Default options
   */
  const DEFAULTS = {
    algorithmId: 'algorithm',
    width: 300,
    autoPlace: true,
    closed: false,
    useLocalStorage: true,
    folders: {
      settings: { name: 'Settings', open: false },
      custom: { name: 'Custom', open: true },
      export: { name: 'Export', open: false }
    }
  };

  /**
   * Paper size presets for dropdown
   */
  const PAPER_SIZES = {
    'Square (800×800)': 'square_medium',
    'Square (1200×1200)': 'square_large',
    'A4 Landscape': 'A4_landscape',
    'A4 Portrait': 'A4_portrait',
    'A3 Landscape': 'A3_landscape',
    'A3 Portrait': 'A3_portrait',
    'Letter Landscape': 'letter_landscape',
    'Letter Portrait': 'letter_portrait'
  };

  /**
   * TSGui class
   */
  class TSGui {
    constructor(options = {}) {
      this.options = { ...DEFAULTS, ...options };
      this._gui = null;
      this._folders = {};
      this._controllers = new Map();
      this._changeCallbacks = [];
      this._finishCallbacks = [];
      this._params = null;

      this._init();
    }

    /**
     * Initialize dat.gui instance
     */
    _init() {
      // Create main GUI
      this._gui = new dat.GUI({
        width: this.options.width,
        autoPlace: this.options.autoPlace,
        closed: this.options.closed
      });

      // Create standard folders
      Object.entries(this.options.folders).forEach(([key, config]) => {
        const folder = this._gui.addFolder(config.name);
        if (config.open) folder.open();
        this._folders[key] = folder;
      });

      // Apply custom styling
      this._applyStyles();

      // Load saved state if enabled
      if (this.options.useLocalStorage) {
        this._loadState();
      }
    }

    /**
     * Apply Total Serialism styling to dat.gui
     */
    _applyStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* dat.gui Total Serialism theme */
        .dg.ac {
          z-index: 1000 !important;
        }

        .dg.main {
          font-family: 'JetBrains Mono', 'SF Mono', monospace !important;
          font-size: 11px !important;
        }

        .dg.main .close-button {
          background: #13131b !important;
          color: #00d4aa !important;
          font-family: 'JetBrains Mono', monospace !important;
        }

        .dg li:not(.folder) {
          background: #1a1a24 !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }

        .dg li.folder {
          border-left: 3px solid #00d4aa !important;
        }

        .dg li.title {
          background: #13131b !important;
          color: #9898a8 !important;
          font-weight: 600 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
        }

        .dg .c {
          color: #e8e8ec !important;
        }

        .dg .c input[type=text] {
          background: #06060a !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #00d4aa !important;
          font-family: 'JetBrains Mono', monospace !important;
        }

        .dg .c .slider {
          background: #06060a !important;
        }

        .dg .c .slider-fg {
          background: linear-gradient(90deg, #00d4aa, #7b68ee) !important;
        }

        .dg .c select {
          background: #06060a !important;
          color: #e8e8ec !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }

        .dg .cr.function {
          border-left: 3px solid #00d4aa !important;
        }

        .dg .cr.function:hover {
          background: #22222e !important;
        }

        .dg .property-name {
          color: #9898a8 !important;
        }

        .dg .cr.boolean input[type=checkbox] {
          accent-color: #00d4aa !important;
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Get or create a folder
     * @param {string} name - Folder key or name
     * @returns {dat.GUI} Folder instance
     */
    _getFolder(name) {
      if (!name || name === 'root') return this._gui;

      // Check if it's a predefined folder
      if (this._folders[name]) {
        return this._folders[name];
      }

      // Create new folder if doesn't exist
      if (!this._folders[name]) {
        this._folders[name] = this._gui.addFolder(name);
      }

      return this._folders[name];
    }

    /**
     * Bind params object for two-way binding
     * @param {Object} params - Parameters object
     * @returns {TSGui} this for chaining
     */
    bind(params) {
      this._params = params;
      return this;
    }

    /**
     * Add a slider control
     * @param {Object} obj - Object containing the property
     * @param {string} prop - Property name
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {Object} options - { step, folder, label }
     * @returns {dat.Controller}
     */
    addSlider(obj, prop, min, max, options = {}) {
      const folder = this._getFolder(options.folder);
      const controller = folder.add(obj, prop, min, max);

      if (options.step) controller.step(options.step);
      if (options.label) controller.name(options.label);

      this._setupChangeHandlers(controller);
      this._controllers.set(prop, controller);

      return controller;
    }

    /**
     * Add a color picker
     * @param {Object} obj - Object containing the property
     * @param {string} prop - Property name
     * @param {Object} options - { folder, label }
     * @returns {dat.Controller}
     */
    addColor(obj, prop, options = {}) {
      const folder = this._getFolder(options.folder);
      const controller = folder.addColor(obj, prop);

      if (options.label) controller.name(options.label);

      this._setupChangeHandlers(controller);
      this._controllers.set(prop, controller);

      return controller;
    }

    /**
     * Add a dropdown select
     * @param {Object} obj - Object containing the property
     * @param {string} prop - Property name
     * @param {Array|Object} options - Options array or object
     * @param {Object} config - { folder, label }
     * @returns {dat.Controller}
     */
    addSelect(obj, prop, options, config = {}) {
      const folder = this._getFolder(config.folder);
      const controller = folder.add(obj, prop, options);

      if (config.label) controller.name(config.label);

      this._setupChangeHandlers(controller);
      this._controllers.set(prop, controller);

      return controller;
    }

    /**
     * Add a checkbox
     * @param {Object} obj - Object containing the property
     * @param {string} prop - Property name
     * @param {Object} options - { folder, label }
     * @returns {dat.Controller}
     */
    addCheckbox(obj, prop, options = {}) {
      const folder = this._getFolder(options.folder);
      const controller = folder.add(obj, prop);

      if (options.label) controller.name(options.label);

      this._setupChangeHandlers(controller);
      this._controllers.set(prop, controller);

      return controller;
    }

    /**
     * Add a button
     * @param {string} label - Button label
     * @param {Function} callback - Click handler
     * @param {Object} options - { folder }
     * @returns {dat.Controller}
     */
    addButton(label, callback, options = {}) {
      const folder = this._getFolder(options.folder);
      const obj = { [label]: callback };
      const controller = folder.add(obj, label);

      return controller;
    }

    /**
     * Add standard paper size selector
     * @param {Object} obj - Params object with paperSize property
     * @param {Object} options - { folder, onResize }
     * @returns {dat.Controller}
     */
    addPaperSize(obj, options = {}) {
      const controller = this.addSelect(obj, 'paperSize', PAPER_SIZES, {
        folder: options.folder || 'settings',
        label: 'Paper Size'
      });

      if (options.onResize) {
        controller.onFinishChange(options.onResize);
      }

      return controller;
    }

    /**
     * Add standard export buttons
     * @param {Object} handlers - { svg, png, gif, dxf, hpgl, gcode }
     */
    addExportButtons(handlers = {}) {
      const folder = this._getFolder('export');

      if (handlers.svg) this.addButton('Save SVG', handlers.svg, { folder: 'export' });
      if (handlers.png) this.addButton('Save PNG', handlers.png, { folder: 'export' });
      if (handlers.gif) this.addButton('Save GIF', handlers.gif, { folder: 'export' });
      if (handlers.dxf) this.addButton('Save DXF', handlers.dxf, { folder: 'export' });
      if (handlers.hpgl) this.addButton('Save HPGL', handlers.hpgl, { folder: 'export' });
      if (handlers.gcode) this.addButton('Save G-code', handlers.gcode, { folder: 'export' });
    }

    /**
     * Add standard action buttons (Regenerate, Randomize)
     * @param {Object} handlers - { regenerate, randomize }
     */
    addActions(handlers = {}) {
      if (handlers.randomize) {
        this.addButton('Randomize', handlers.randomize, { folder: 'root' });
      }
      if (handlers.regenerate) {
        this.addButton('Regenerate', handlers.regenerate, { folder: 'root' });
      }
    }

    /**
     * Setup change handlers for a controller
     */
    _setupChangeHandlers(controller) {
      controller.onChange((value) => {
        this._changeCallbacks.forEach(cb => cb(value, controller));
        this._saveState();
      });

      controller.onFinishChange((value) => {
        this._finishCallbacks.forEach(cb => cb(value, controller));
      });
    }

    /**
     * Register callback for any control change
     * @param {Function} callback - Called on any change
     * @returns {TSGui} this for chaining
     */
    onAnyChange(callback) {
      this._changeCallbacks.push(callback);
      return this;
    }

    /**
     * Register callback for control finish change (slider release, etc)
     * @param {Function} callback - Called when user finishes adjusting
     * @returns {TSGui} this for chaining
     */
    onAnyFinish(callback) {
      this._finishCallbacks.push(callback);
      return this;
    }

    /**
     * Update all controllers to reflect current param values
     */
    updateDisplay() {
      this._controllers.forEach(controller => {
        controller.updateDisplay();
      });
    }

    /**
     * Open a folder
     * @param {string} name - Folder name
     */
    openFolder(name) {
      const folder = this._folders[name];
      if (folder) folder.open();
    }

    /**
     * Close a folder
     * @param {string} name - Folder name
     */
    closeFolder(name) {
      const folder = this._folders[name];
      if (folder) folder.close();
    }

    /**
     * Save current state to localStorage
     */
    _saveState() {
      if (!this.options.useLocalStorage || !this._params) return;

      try {
        const key = `ts-gui-${this.options.algorithmId}`;
        localStorage.setItem(key, JSON.stringify(this._params));
      } catch (e) {
        console.warn('[TSGui] Could not save state:', e);
      }
    }

    /**
     * Load state from localStorage
     */
    _loadState() {
      if (!this.options.useLocalStorage) return null;

      try {
        const key = `ts-gui-${this.options.algorithmId}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        console.warn('[TSGui] Could not load state:', e);
        return null;
      }
    }

    /**
     * Get saved state (for manual restoration)
     * @returns {Object|null} Saved params or null
     */
    getSavedState() {
      return this._loadState();
    }

    /**
     * Restore params from saved state
     * @param {Object} params - Params object to update
     * @returns {boolean} True if state was restored
     */
    restoreState(params) {
      const saved = this._loadState();
      if (saved) {
        Object.assign(params, saved);
        this.updateDisplay();
        return true;
      }
      return false;
    }

    /**
     * Hide the GUI
     */
    hide() {
      this._gui.hide();
    }

    /**
     * Show the GUI
     */
    show() {
      this._gui.show();
    }

    /**
     * Close/minimize the GUI
     */
    close() {
      this._gui.close();
    }

    /**
     * Open/expand the GUI
     */
    open() {
      this._gui.open();
    }

    /**
     * Destroy the GUI
     */
    destroy() {
      this._gui.destroy();
      this._controllers.clear();
      this._changeCallbacks = [];
      this._finishCallbacks = [];
    }

    /**
     * Get the underlying dat.gui instance
     * @returns {dat.GUI}
     */
    getGUI() {
      return this._gui;
    }
  }

  // Static paper sizes
  TSGui.PAPER_SIZES = PAPER_SIZES;
  TSGui.DEFAULTS = DEFAULTS;

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TSGui;
  }
  global.TSGui = TSGui;

})(typeof window !== 'undefined' ? window : global);
