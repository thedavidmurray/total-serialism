/**
 * TSPanelController - Collapsible control panel for Total Serialism algorithms
 *
 * Provides a toggle to show/hide the control panel, allowing the canvas to
 * take the full viewport width. State persists via localStorage.
 */

(function(global) {
  'use strict';

  /**
   * Default options for TSPanelController
   */
  const DEFAULTS = {
    panelSelector: '#controls',
    toggleSelector: null,
    canvasAreaSelector: '#canvas-container',
    startCollapsed: false,
    persistState: true,
    storageKey: 'ts-panel-collapsed',
    transitionDuration: 350,
    labelExpanded: 'Close Controls',
    labelCollapsed: 'Show Controls',
    onToggle: null,
    onTransitionEnd: null
  };

  /**
   * TSPanelController class
   */
  class TSPanelController {
    constructor(options = {}) {
      this.options = { ...DEFAULTS, ...options };
      this._collapsed = this.options.startCollapsed;
      this._panelEl = null;
      this._canvasEl = null;
      this._toggleBtn = null;
      this._createdButton = false;
      this._listeners = [];
      this._attached = false;
      this._resizeTimeout = null;
    }

    /**
     * Attach controller to DOM and set up event listeners
     * @returns {TSPanelController} this for chaining
     */
    attach() {
      // Prevent duplicate attach
      if (this._attached) {
        console.warn('[TSPanelController] Already attached. Call destroy() first.');
        return this;
      }

      // Get DOM elements
      this._panelEl = document.querySelector(this.options.panelSelector);
      this._canvasEl = document.querySelector(this.options.canvasAreaSelector);

      if (!this._panelEl) {
        console.error('[TSPanelController] Panel element not found:', this.options.panelSelector);
        return this;
      }

      // Restore state from localStorage if enabled
      if (this.options.persistState) {
        const savedState = localStorage.getItem(this.options.storageKey);
        if (savedState === 'true') {
          this._collapsed = true;
        }
      }

      // Get or create toggle button
      if (this.options.toggleSelector) {
        this._toggleBtn = document.querySelector(this.options.toggleSelector);
      } else {
        this._createToggleButton();
      }

      // Set up ARIA attributes
      if (this._toggleBtn) {
        this._toggleBtn.setAttribute('aria-expanded', String(!this._collapsed));
        this._toggleBtn.setAttribute('aria-controls', this._panelEl.id || 'controls');
      }

      // Apply initial state
      this._applyState();

      // Set up event listeners
      this._setupListeners();

      this._attached = true;
      return this;
    }

    /**
     * Create the toggle button if not provided
     */
    _createToggleButton() {
      const btn = document.createElement('button');
      btn.className = 'ts-panel-toggle';
      btn.id = 'ts-panel-toggle';
      btn.innerHTML = `
        <span class="ts-panel-toggle-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </span>
        <span class="ts-panel-toggle-label">${this._collapsed ? this.options.labelCollapsed : this.options.labelExpanded}</span>
      `;

      // Insert into canvas container or body
      const container = this._canvasEl || document.body;
      container.appendChild(btn);

      this._toggleBtn = btn;
      this._createdButton = true;
    }

    /**
     * Set up event listeners
     */
    _setupListeners() {
      // Toggle button click
      if (this._toggleBtn) {
        const clickHandler = () => this.toggle();
        this._toggleBtn.addEventListener('click', clickHandler);
        this._listeners.push({ el: this._toggleBtn, event: 'click', handler: clickHandler });
      }

      // Keyboard shortcuts
      const keyHandler = (e) => this._handleKeydown(e);
      document.addEventListener('keydown', keyHandler);
      this._listeners.push({ el: document, event: 'keydown', handler: keyHandler });
    }

    /**
     * Handle keyboard shortcuts
     */
    _handleKeydown(e) {
      // Check if target is an input/textarea
      const target = e.target;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.tagName === 'SELECT' ||
                      target.isContentEditable;

      // ] key toggles panel (when not typing)
      if (e.key === ']' && !isInput) {
        this.toggle();
        return;
      }

      // Escape collapses panel (when focus inside panel)
      if (e.key === 'Escape' && this._panelEl && this._panelEl.contains(target)) {
        this.collapse();
      }
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
      this._collapsed = !this._collapsed;
      this._applyState();
      this._saveState();
      this._notifyToggle();
      this._dispatchResize();
    }

    /**
     * Force collapse panel
     */
    collapse() {
      if (this._collapsed) return; // Already collapsed
      this._collapsed = true;
      this._applyState();
      this._saveState();
      this._notifyToggle();
      this._dispatchResize();
    }

    /**
     * Force expand panel
     */
    expand() {
      if (!this._collapsed) return; // Already expanded
      this._collapsed = false;
      this._applyState();
      this._saveState();
      this._notifyToggle();
      this._dispatchResize();
    }

    /**
     * Check if panel is collapsed
     * @returns {boolean}
     */
    isCollapsed() {
      return this._collapsed;
    }

    /**
     * Update button labels
     * @param {string} expanded - Label when panel is visible
     * @param {string} collapsed - Label when panel is hidden
     */
    setLabel(expanded, collapsed) {
      this.options.labelExpanded = expanded;
      this.options.labelCollapsed = collapsed;
      this._updateButtonLabel();
    }

    /**
     * Clean up and remove controller
     */
    destroy() {
      // Clear pending timeout
      if (this._resizeTimeout) {
        clearTimeout(this._resizeTimeout);
        this._resizeTimeout = null;
      }

      // Remove event listeners
      for (const { el, event, handler } of this._listeners) {
        el.removeEventListener(event, handler);
      }
      this._listeners = [];

      // Remove body class
      document.body.classList.remove('ts-panel-collapsed');

      // Remove panel class
      if (this._panelEl) {
        this._panelEl.classList.remove('ts-collapsed');
      }

      // Remove auto-created button only
      if (this._createdButton && this._toggleBtn && this._toggleBtn.parentNode) {
        this._toggleBtn.parentNode.removeChild(this._toggleBtn);
      }

      this._toggleBtn = null;
      this._panelEl = null;
      this._canvasEl = null;
      this._attached = false;
    }

    /**
     * Apply current state to DOM
     */
    _applyState() {
      if (this._collapsed) {
        document.body.classList.add('ts-panel-collapsed');
        if (this._panelEl) {
          this._panelEl.classList.add('ts-collapsed');
        }
      } else {
        document.body.classList.remove('ts-panel-collapsed');
        if (this._panelEl) {
          this._panelEl.classList.remove('ts-collapsed');
        }
      }

      // Update button ARIA and label
      if (this._toggleBtn) {
        this._toggleBtn.setAttribute('aria-expanded', String(!this._collapsed));
        if (this._collapsed) {
          this._toggleBtn.classList.add('collapsed');
        } else {
          this._toggleBtn.classList.remove('collapsed');
        }
      }

      this._updateButtonLabel();
    }

    /**
     * Update button label text
     */
    _updateButtonLabel() {
      if (!this._toggleBtn) return;
      const labelEl = this._toggleBtn.querySelector('.ts-panel-toggle-label');
      if (labelEl) {
        labelEl.textContent = this._collapsed
          ? this.options.labelCollapsed
          : this.options.labelExpanded;
      }
    }

    /**
     * Save state to localStorage
     */
    _saveState() {
      if (!this.options.persistState) return;
      try {
        localStorage.setItem(this.options.storageKey, String(this._collapsed));
      } catch (e) {
        console.error('[TSPanelController] Could not save state:', e);
      }
    }

    /**
     * Notify callback of state change
     */
    _notifyToggle() {
      if (typeof this.options.onToggle === 'function') {
        this.options.onToggle(this._collapsed);
      }
    }

    /**
     * Dispatch resize event for p5.js and other listeners
     */
    _dispatchResize() {
      // Dispatch after a brief delay to allow CSS transition
      this._resizeTimeout = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this._resizeTimeout = null;
      }, this.options.transitionDuration);
    }
  }

  // Static defaults
  TSPanelController.DEFAULTS = DEFAULTS;

  // Export for Node (testing) and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TSPanelController;
  }
  global.TSPanelController = TSPanelController;

})(typeof window !== 'undefined' ? window : global);
