/**
 * Total Serialism - Page Configuration Registry
 *
 * Config-driven initialization for algorithm pages.
 * Each entry maps a page path (relative to pen-plotter/algorithms/) to its
 * feature flags: which exports to offer, whether to show paper sizes, etc.
 *
 * Pages NOT listed here are unmigrated and will skip auto-init (no breakage).
 *
 * Usage:
 *   <script src="../../shared/page-config.js"></script>
 *   <script src="../../shared/init.js"></script>
 *
 * The init.js script reads this config on DOMContentLoaded and calls the
 * appropriate shared utility functions.
 */

(function(global) {
  'use strict';

  const PAGE_CONFIGS = {
    // -------------------------------------------------------------------
    // PILOT PAGE 1: 10PRINT (geometric)
    // Already has inline export buttons + GIF export, so we wire handlers
    // rather than mounting new buttons. Uses TSExport.getCanvas().
    // -------------------------------------------------------------------
    'geometric/10print-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: '10print',
      paperSizes: true,
      presets: true,
      getCanvas: () => {
        // p5.js default canvas
        return document.querySelector('#defaultCanvas0') || document.querySelector('canvas');
      },
      // 10print already renders its own export buttons, so skip mounting
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    // -------------------------------------------------------------------
    // PILOT PAGE 2: Arrows (packing)
    // Already has export buttons wired manually. We register config but
    // skip mount since it handles its own exports.
    // -------------------------------------------------------------------
    'packing/arrows-gui': {
      exports: ['svg', 'plotter-svg', 'png'],
      algorithmName: 'arrows',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#canvas canvas') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    // -------------------------------------------------------------------
    // PILOT PAGE 3: Flow Field P5 (flow-fields)
    // Has inline onclick exportSVG/exportGIF but no standardized buttons.
    // Mount controls to give consistent UI.
    // -------------------------------------------------------------------
    'flow-fields/flow-field-p5-gui': {
      exports: ['svg', 'png'],
      algorithmName: 'flow-field',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: false,
      titleClass: 'ts-algo-title',
    },

    // -------------------------------------------------------------------
    // PILOT PAGE 4: Phyllotaxis (natural)
    // Has inline export buttons in HTML. Register for config system.
    // -------------------------------------------------------------------
    'natural/phyllotaxis-gui': {
      exports: ['svg', 'png'],
      algorithmName: 'phyllotaxis',
      paperSizes: false,
      presets: false,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: false,
      titleClass: 'ts-algo-title',
    },

    // -------------------------------------------------------------------
    // PILOT PAGE 5: Hilbert Curve (curves)
    // Has inline SVG + PNG export. Mount standardized controls.
    // -------------------------------------------------------------------
    'curves/hilbert-curve-gui': {
      exports: ['svg', 'png'],
      algorithmName: 'hilbert-curve',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: false,
      titleClass: 'ts-algo-title',
    },

    // ===================================================================
    // BATCH 2: Geometric algorithms
    // All use p5.js SVG canvas, have inline export buttons (skipExportMount),
    // and a #controls sidebar with a h2 title.
    // ===================================================================

    'geometric/circle-rays-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'circle-rays',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/circle-twist-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'circle-twist',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/grid-landscape-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'grid-landscape',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/hash-tiles-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'hash-tiles',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/perlin-circles-gui': {
      exports: ['svg', 'png'],
      algorithmName: 'perlin-circles',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/perlin-landscape-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'perlin-landscape',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/perlin-spiral-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'perlin-spiral',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'geometric/snowflakes-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'snowflakes',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    // ===================================================================
    // BATCH 3: Natural algorithms
    // Use class="controls" (not id), canvas id="canvas". Already have
    // export buttons wired. skipExportMount to avoid double-mounting.
    // ===================================================================

    'natural/astronomy-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'astronomy',
      paperSizes: false,
      presets: false,
      getCanvas: () => document.querySelector('#canvas') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'natural/coral-growth-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'coral-growth',
      paperSizes: false,
      presets: false,
      getCanvas: () => document.querySelector('#canvas') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'natural/crystal-growth-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'crystal-growth',
      paperSizes: false,
      presets: false,
      getCanvas: () => document.querySelector('#canvas') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'natural/lightning-gui': {
      exports: ['svg', 'png', 'gif'],
      algorithmName: 'lightning',
      paperSizes: false,
      presets: false,
      getCanvas: () => document.querySelector('#canvas') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    // ===================================================================
    // BATCH 4: Symmetry algorithms
    // Use #controls sidebar with h2 title and inline export buttons.
    // ===================================================================

    'symmetry/kumiko-pattern': {
      exports: ['svg', 'png'],
      algorithmName: 'kumiko',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    'symmetry/zellige-pattern': {
      exports: ['svg', 'png'],
      algorithmName: 'zellige',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },

    // ===================================================================
    // BATCH 5: Trees / L-systems
    // ===================================================================

    'trees-lsystems/tree-gui': {
      exports: ['svg', 'gif'],
      algorithmName: 'lsystem-tree',
      paperSizes: true,
      presets: true,
      getCanvas: () => document.querySelector('#defaultCanvas0') || document.querySelector('canvas'),
      skipExportMount: true,
      titleClass: 'ts-algo-title',
    },
  };

  /**
   * Resolve the current page's config key from the URL.
   * Strips everything up to and including 'algorithms/' and removes '.html'.
   *
   * Examples:
   *   /pen-plotter/algorithms/geometric/10print-gui.html -> 'geometric/10print-gui'
   *   /total-serialism/pen-plotter/algorithms/curves/hilbert-curve-gui.html -> 'curves/hilbert-curve-gui'
   */
  function resolvePageKey(pathname) {
    const marker = 'algorithms/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;

    let key = pathname.slice(idx + marker.length);
    key = key.replace(/\.html$/, '');
    // Remove trailing slash if present
    key = key.replace(/\/$/, '');
    return key;
  }

  // Public API
  global.TSPageConfig = {
    configs: PAGE_CONFIGS,
    resolvePageKey: resolvePageKey,

    /**
     * Get the config for the current page, or null if unmigrated.
     */
    getCurrent: function() {
      const key = resolvePageKey(window.location.pathname);
      if (!key) return null;
      return PAGE_CONFIGS[key] || null;
    },

    /**
     * Register a new page config at runtime (for pages that self-configure).
     */
    register: function(key, config) {
      PAGE_CONFIGS[key] = config;
    },
  };

})(typeof window !== 'undefined' ? window : this);
