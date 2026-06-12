/**
 * Total Serialism - Config-Driven Auto-Init
 *
 * Reads the current page's config from TSPageConfig and calls shared utilities
 * to mount export controls, standardize titles, etc.
 *
 * This script should be loaded AFTER page-config.js and export-utils.js:
 *
 *   <script src="../../shared/export-utils.js"></script>
 *   <script src="../../shared/page-config.js"></script>
 *   <script src="../../shared/init.js"></script>
 *
 * For unmigrated pages (not in PAGE_CONFIGS), this script does nothing.
 */

(function(global) {
  'use strict';

  function init() {
    if (typeof TSPageConfig === 'undefined') {
      console.warn('[TSInit] TSPageConfig not loaded -- skipping auto-init');
      return;
    }

    const config = TSPageConfig.getCurrent();
    if (!config) {
      // Unmigrated page -- silently skip
      return;
    }

    const key = TSPageConfig.resolvePageKey(window.location.pathname);
    console.log(`[TSInit] Initializing page: ${key}`);

    // 0. Hide debug overlays by default (show with ?debug=1)
    applyDebugVisibility();

    // 1. Mount export controls (unless page handles its own)
    if (config.exports && !config.skipExportMount) {
      if (typeof TSExport !== 'undefined' && TSExport.mountControls) {
        // Find the best insertion point: before informational content,
        // after the last .control-group with actual controls
        const controls = document.getElementById('controls');
        if (controls) {
          // Try to insert before the discovery panel or stats section
          const insertBefore =
            '.ts-discovery-panel, .algorithm-info, .stats, [data-ts-init="info"]';

          TSExport.mountControls({
            exports: config.exports,
            algorithmName: config.algorithmName,
            getCanvas: config.getCanvas,
            handlers: config.handlers || {},
            mountTarget: controls,
            insertBefore: insertBefore,
          });
        }
      } else {
        console.warn('[TSInit] TSExport.mountControls not available');
      }
    }

    // 2. Mount paper size selector if config requests it and CanvasLayout is available
    if (config.paperSizes && typeof CanvasLayout !== 'undefined' && CanvasLayout.mountSelector) {
      const controls = document.getElementById('controls');
      if (controls) {
        CanvasLayout.mountSelector({
          container: controls,
          algorithmName: config.algorithmName,
          getCanvas: config.getCanvas,
        });
      }
    }

    // 3. Standardize title typography
    if (config.titleClass) {
      standardizeTitle(config.titleClass);
    }

    console.log(`[TSInit] Page initialized: ${key}`);
  }

  /**
   * Hide debug overlays by default. Show them only when ?debug=1 is present.
   * Targets elements with class: ts-debug, debug-overlay, debug-info,
   * or data-ts-debug attribute, or id containing "debug".
   */
  function applyDebugVisibility() {
    const params = new URLSearchParams(window.location.search);
    const showDebug = params.get('debug') === '1';

    // Inject a <style> rule -- faster than iterating the DOM
    const styleId = 'ts-debug-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      if (!showDebug) {
        style.textContent = [
          '.ts-debug { display: none !important; }',
          '.debug-overlay { display: none !important; }',
          '.debug-info { display: none !important; }',
          '[data-ts-debug] { display: none !important; }',
          '#debug-overlay { display: none !important; }',
          '#debug-info { display: none !important; }',
          '#debug-panel { display: none !important; }',
        ].join('\n');
      }
      document.head.appendChild(style);
    }
  }

  /**
   * Standardize the algorithm title to use a consistent CSS class.
   * Finds the first h2 in #controls and ensures it has the right class.
   */
  function standardizeTitle(className) {
    const controls = document.getElementById('controls');
    if (!controls) return;

    const title = controls.querySelector('h2');
    if (!title) return;

    // Remove any italic/serif styling that some pages have
    title.style.fontStyle = '';
    title.style.fontFamily = '';
    title.style.color = '';

    // Add the standardized class
    if (!title.classList.contains(className)) {
      title.classList.add(className);
    }
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    // Small delay to let other scripts (p5, presets) finish setup
    setTimeout(init, 100);
  }

  // Public API for manual triggering
  global.TSInit = {
    init: init,
    standardizeTitle: standardizeTitle,
    applyDebugVisibility: applyDebugVisibility,
  };

})(typeof window !== 'undefined' ? window : this);
