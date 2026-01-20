/**
 * Total Serialism - Hybrid Engine
 * Layer-based algorithm composition for combining generative art algorithms
 *
 * Usage:
 *   const engine = new HybridEngine();
 *   engine.registerAlgorithm('spirals', { name: 'Spirals', generate: (w, h, params) => ({paths}), parameters: {} });
 *   const layerId = engine.addLayer({ algorithm: 'spirals', blendMode: 'overlay', opacity: 1.0 });
 *   await engine.generateLayers();
 *   const result = engine.compose();
 */

(function(global) {
  'use strict';

  class HybridEngine {
    constructor(options = {}) {
      this.width = options.width || 800;
      this.height = options.height || 600;
      this.algorithms = {};
      this.layers = [];
      this.layerIdCounter = 0;
      this.generatedPaths = new Map(); // layerId -> paths
    }

    /**
     * Register an algorithm for use in layers
     * @param {string} key - Unique identifier
     * @param {Object} algorithm - Algorithm definition { name, generate, parameters }
     */
    registerAlgorithm(key, algorithm) {
      this.algorithms[key] = algorithm;
      console.log(`[HybridEngine] Registered algorithm: ${algorithm.name}`);
    }

    /**
     * Add a new layer
     * @param {Object} config - Layer configuration
     * @returns {number} Layer ID
     */
    addLayer(config = {}) {
      const layerId = this.layerIdCounter++;

      const layer = {
        id: layerId,
        algorithm: config.algorithm || Object.keys(this.algorithms)[0] || null,
        blendMode: config.blendMode || 'overlay',
        opacity: config.opacity !== undefined ? config.opacity : 1.0,
        enabled: config.enabled !== undefined ? config.enabled : true,
        parameters: config.parameters || {}
      };

      // Initialize parameters from algorithm defaults
      if (layer.algorithm && this.algorithms[layer.algorithm]) {
        const algoParams = this.algorithms[layer.algorithm].parameters || {};
        for (const [key, param] of Object.entries(algoParams)) {
          if (layer.parameters[key] === undefined) {
            layer.parameters[key] = param.default;
          }
        }
      }

      this.layers.push(layer);
      return layerId;
    }

    /**
     * Remove a layer
     * @param {number} layerId
     */
    removeLayer(layerId) {
      const index = this.layers.findIndex(l => l.id === layerId);
      if (index !== -1) {
        this.layers.splice(index, 1);
        this.generatedPaths.delete(layerId);
      }
    }

    /**
     * Update layer configuration
     * @param {number} layerId
     * @param {Object} updates
     */
    updateLayer(layerId, updates) {
      const layer = this.layers.find(l => l.id === layerId);
      if (!layer) return;

      if (updates.algorithm !== undefined) {
        layer.algorithm = updates.algorithm;
        // Reset parameters to defaults for new algorithm
        if (this.algorithms[updates.algorithm]) {
          const algoParams = this.algorithms[updates.algorithm].parameters || {};
          layer.parameters = {};
          for (const [key, param] of Object.entries(algoParams)) {
            layer.parameters[key] = param.default;
          }
        }
      }
      if (updates.blendMode !== undefined) layer.blendMode = updates.blendMode;
      if (updates.opacity !== undefined) layer.opacity = updates.opacity;
      if (updates.enabled !== undefined) layer.enabled = updates.enabled;
      if (updates.parameters !== undefined) {
        layer.parameters = { ...layer.parameters, ...updates.parameters };
      }
    }

    /**
     * Update a specific parameter for a layer
     * @param {number} layerId
     * @param {string} paramKey
     * @param {*} value
     */
    updateLayerParameter(layerId, paramKey, value) {
      const layer = this.layers.find(l => l.id === layerId);
      if (layer) {
        layer.parameters[paramKey] = value;
      }
    }

    /**
     * Generate paths for all enabled layers
     * @returns {Promise}
     */
    async generateLayers() {
      this.generatedPaths.clear();

      for (const layer of this.layers) {
        if (!layer.enabled) continue;

        const algorithm = this.algorithms[layer.algorithm];
        if (!algorithm || !algorithm.generate) {
          console.warn(`[HybridEngine] No generator for algorithm: ${layer.algorithm}`);
          continue;
        }

        try {
          const result = await Promise.resolve(
            algorithm.generate(this.width, this.height, layer.parameters)
          );
          this.generatedPaths.set(layer.id, result.paths || []);
        } catch (e) {
          console.error(`[HybridEngine] Error generating layer ${layer.id}:`, e);
          this.generatedPaths.set(layer.id, []);
        }
      }
    }

    /**
     * Compose all layers into final output
     * @returns {Object} { paths: Array, canvas: HTMLCanvasElement }
     */
    compose() {
      const composedPaths = [];
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);

      for (const layer of this.layers) {
        if (!layer.enabled) continue;

        const paths = this.generatedPaths.get(layer.id) || [];
        if (paths.length === 0) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = this.getCompositeOperation(layer.blendMode);

        // Draw paths to canvas
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const path of paths) {
          if (Array.isArray(path) && path.length > 0) {
            ctx.beginPath();
            const first = path[0];
            ctx.moveTo(first.x || first[0], first.y || first[1]);

            for (let i = 1; i < path.length; i++) {
              const p = path[i];
              ctx.lineTo(p.x || p[0], p.y || p[1]);
            }
            ctx.stroke();

            // Also add to composed paths for SVG export
            composedPaths.push({
              points: path,
              opacity: layer.opacity,
              blendMode: layer.blendMode
            });
          }
        }

        ctx.restore();
      }

      return { paths: composedPaths, canvas };
    }

    /**
     * Map blend mode to canvas composite operation
     * @param {string} blendMode
     * @returns {string}
     */
    getCompositeOperation(blendMode) {
      const mapping = {
        'overlay': 'source-over',
        'mask': 'destination-in',
        'modulate': 'multiply',
        'intersect': 'source-atop',
        'add': 'lighter',
        'multiply': 'multiply',
        'difference': 'difference',
        'screen': 'screen',
        'darken': 'darken',
        'lighten': 'lighten'
      };
      return mapping[blendMode] || 'source-over';
    }

    /**
     * Export composed result as SVG
     * @returns {string} SVG markup
     */
    exportSVG() {
      let pathsMarkup = '';

      for (const layer of this.layers) {
        if (!layer.enabled) continue;

        const paths = this.generatedPaths.get(layer.id) || [];

        for (const path of paths) {
          if (Array.isArray(path) && path.length > 1) {
            const first = path[0];
            let d = `M ${first.x || first[0]} ${first.y || first[1]}`;

            for (let i = 1; i < path.length; i++) {
              const p = path[i];
              d += ` L ${p.x || p[0]} ${p.y || p[1]}`;
            }

            pathsMarkup += `  <path d="${d}" stroke="#000000" stroke-width="1" fill="none" opacity="${layer.opacity}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
          }
        }
      }

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
  <rect width="100%" height="100%" fill="white"/>
${pathsMarkup}</svg>`;
    }

    /**
     * Get current configuration for saving
     * @returns {Object}
     */
    getConfiguration() {
      return {
        width: this.width,
        height: this.height,
        layers: this.layers.map(layer => ({
          algorithm: layer.algorithm,
          blendMode: layer.blendMode,
          opacity: layer.opacity,
          enabled: layer.enabled,
          parameters: { ...layer.parameters }
        }))
      };
    }

    /**
     * Load configuration from saved state
     * @param {Object} config
     */
    loadConfiguration(config) {
      if (config.width) this.width = config.width;
      if (config.height) this.height = config.height;

      // Clear existing layers
      this.layers = [];
      this.generatedPaths.clear();
      this.layerIdCounter = 0;

      // Restore layers
      if (config.layers && Array.isArray(config.layers)) {
        for (const layerConfig of config.layers) {
          this.addLayer(layerConfig);
        }
      }
    }

    /**
     * Clear all layers
     */
    clear() {
      this.layers = [];
      this.generatedPaths.clear();
      this.layerIdCounter = 0;
    }
  }

  // Export to global scope
  global.HybridEngine = HybridEngine;

})(typeof window !== 'undefined' ? window : this);
