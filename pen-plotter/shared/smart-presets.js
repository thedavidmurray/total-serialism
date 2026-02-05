/**
 * SMART PRESETS SYSTEM
 * Paper-size aware defaults and intelligent preset management
 */

class SmartPresets {
  constructor() {
    this.presets = this.initializeDefaultPresets();
    this.paperSizes = this.initializePaperSizes();
  }

  /**
   * Initialize default optimization presets
   */
  initializeDefaultPresets() {
    return {
      // Quick draft settings for fast iteration
      'draft': {
        name: 'Draft (Fast)',
        description: 'Quick optimization for testing',
        settings: {
          removeShortPaths: true,
          minLength: 2.0,
          simplifyPaths: true,
          simplifyTolerance: 0.5,
          fitArcs: false,
          mergeEndpoints: true,
          mergeThreshold: 2.0,
          optimizeOrder: true,
          orderMethod: 'nearestNeighbor',
          finalTwoOpt: false
        },
        penSpeed: 30,
        penUpSpeed: 80
      },

      // Balanced settings for most use cases
      'balanced': {
        name: 'Balanced (Recommended)',
        description: 'Good balance of speed and quality',
        settings: {
          removeShortPaths: true,
          minLength: 1.0,
          simplifyPaths: true,
          simplifyTolerance: 0.2,
          fitArcs: true,
          arcAngleThreshold: 15,
          arcMinSegments: 3,
          mergeEndpoints: true,
          mergeThreshold: 1.0,
          optimizeOrder: true,
          orderMethod: 'lookAhead',
          lookAheadDepth: 3,
          finalTwoOpt: true
        },
        penSpeed: 20,
        penUpSpeed: 60
      },

      // Maximum quality for final plots
      'highQuality': {
        name: 'High Quality (Slow)',
        description: 'Best quality, longer optimization time',
        settings: {
          removeShortPaths: true,
          minLength: 0.5,
          simplifyPaths: true,
          simplifyTolerance: 0.1,
          fitArcs: true,
          arcAngleThreshold: 10,
          arcMinSegments: 4,
          mergeEndpoints: true,
          mergeThreshold: 0.5,
          optimizeOrder: true,
          orderMethod: 'multiStart',
          startPoints: 10,
          finalTwoOpt: true,
          twoOptIterations: 200
        },
        penSpeed: 15,
        penUpSpeed: 50
      },

      // Large format settings
      'largeFormat': {
        name: 'Large Format (A3+)',
        description: 'Optimized for large paper sizes',
        settings: {
          removeShortPaths: true,
          minLength: 1.5,
          simplifyPaths: true,
          simplifyTolerance: 0.3,
          fitArcs: true,
          arcAngleThreshold: 12,
          arcMinSegments: 3,
          mergeEndpoints: true,
          mergeThreshold: 1.5,
          optimizeOrder: true,
          orderMethod: 'lookAhead',
          lookAheadDepth: 5,
          finalTwoOpt: true
        },
        penSpeed: 25,
        penUpSpeed: 70
      },

      // Minimal processing for already optimized work
      'minimal': {
        name: 'Minimal Processing',
        description: 'Light optimization, preserves detail',
        settings: {
          removeShortPaths: true,
          minLength: 0.3,
          simplifyPaths: false,
          fitArcs: false,
          mergeEndpoints: true,
          mergeThreshold: 0.5,
          optimizeOrder: true,
          orderMethod: 'nearestNeighbor',
          finalTwoOpt: false
        },
        penSpeed: 20,
        penUpSpeed: 60
      }
    };
  }

  /**
   * Initialize paper size configurations
   */
  initializePaperSizes() {
    return {
      'A6': {
        width: 105,
        height: 148,
        units: 'mm',
        recommendedPreset: 'balanced',
        margin: 10
      },
      'A5': {
        width: 148,
        height: 210,
        units: 'mm',
        recommendedPreset: 'balanced',
        margin: 15
      },
      'A4': {
        width: 210,
        height: 297,
        units: 'mm',
        recommendedPreset: 'balanced',
        margin: 20
      },
      'A3': {
        width: 297,
        height: 420,
        units: 'mm',
        recommendedPreset: 'largeFormat',
        margin: 25
      },
      'A2': {
        width: 420,
        height: 594,
        units: 'mm',
        recommendedPreset: 'largeFormat',
        margin: 30
      },
      'Letter': {
        width: 215.9,
        height: 279.4,
        units: 'mm',
        recommendedPreset: 'balanced',
        margin: 20
      },
      'Legal': {
        width: 215.9,
        height: 355.6,
        units: 'mm',
        recommendedPreset: 'balanced',
        margin: 20
      },
      'Tabloid': {
        width: 279.4,
        height: 431.8,
        units: 'mm',
        recommendedPreset: 'largeFormat',
        margin: 25
      }
    };
  }

  /**
   * Get preset by name
   */
  getPreset(name) {
    return this.presets[name] || this.presets['balanced'];
  }

  /**
   * Get paper size configuration
   */
  getPaperSize(name) {
    return this.paperSizes[name] || this.paperSizes['A4'];
  }

  /**
   * Get recommended preset for paper size
   */
  getRecommendedPreset(paperSize) {
    const paper = this.getPaperSize(paperSize);
    return this.getPreset(paper.recommendedPreset);
  }

  /**
   * Create custom preset
   */
  createCustomPreset(name, description, settings, penSpeed, penUpSpeed) {
    this.presets[name] = {
      name: name,
      description: description,
      settings: settings,
      penSpeed: penSpeed || 20,
      penUpSpeed: penUpSpeed || 60,
      custom: true
    };

    return this.presets[name];
  }

  /**
   * Auto-select best preset based on artwork characteristics
   */
  autoSelectPreset(paths, paperSize = 'A4') {
    const pathCount = paths.length;
    const totalPoints = paths.reduce((sum, path) => sum + path.length, 0);
    const avgPointsPerPath = totalPoints / pathCount;

    const paper = this.getPaperSize(paperSize);
    const area = paper.width * paper.height;

    // Decision logic
    let presetName = 'balanced';

    // Very complex artwork -> high quality
    if (pathCount > 5000 || avgPointsPerPath > 100) {
      presetName = 'highQuality';
    }
    // Simple artwork -> draft is fine
    else if (pathCount < 100 && avgPointsPerPath < 20) {
      presetName = 'draft';
    }
    // Large paper -> use large format preset
    else if (area > 80000) {
      presetName = 'largeFormat';
    }
    // Detailed but not too complex -> balanced
    else {
      presetName = 'balanced';
    }

    console.log(`Auto-selected "${presetName}" preset:`);
    console.log(`  Paths: ${pathCount}, Avg points: ${avgPointsPerPath.toFixed(1)}, Paper: ${paperSize}`);

    return this.getPreset(presetName);
  }

  /**
   * Scale settings for paper size
   * Adjusts tolerances based on paper dimensions
   */
  scaleSettingsForPaper(preset, paperSize) {
    const paper = this.getPaperSize(paperSize);
    const scaled = JSON.parse(JSON.stringify(preset)); // Deep copy

    // Calculate scale factor based on paper size (A4 = 1.0)
    const a4Area = 210 * 297;
    const paperArea = paper.width * paper.height;
    const scaleFactor = Math.sqrt(paperArea / a4Area);

    // Scale distance-based settings
    if (scaled.settings.minLength) {
      scaled.settings.minLength *= scaleFactor;
    }
    if (scaled.settings.simplifyTolerance) {
      scaled.settings.simplifyTolerance *= scaleFactor;
    }
    if (scaled.settings.mergeThreshold) {
      scaled.settings.mergeThreshold *= scaleFactor;
    }

    console.log(`Scaled settings for ${paperSize} (factor: ${scaleFactor.toFixed(2)})`);

    return scaled;
  }

  /**
   * Generate preset selector UI
   */
  createPresetSelector(container, onSelect) {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'preset-selector';
    selectorDiv.style.cssText = `
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 10px 0;
    `;

    const title = document.createElement('h4');
    title.textContent = 'Optimization Preset';
    title.style.marginTop = '0';

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 8px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    // Add options
    Object.keys(this.presets).forEach(key => {
      const preset = this.presets[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = preset.name;
      select.appendChild(option);
    });

    // Description area
    const desc = document.createElement('p');
    desc.style.cssText = `
      margin: 10px 0 0 0;
      font-size: 12px;
      color: #666;
    `;
    desc.textContent = this.presets['balanced'].description;

    // Update description on change
    select.onchange = (e) => {
      const preset = this.presets[e.target.value];
      desc.textContent = preset.description;
      if (onSelect) {
        onSelect(preset);
      }
    };

    selectorDiv.appendChild(title);
    selectorDiv.appendChild(select);
    selectorDiv.appendChild(desc);

    container.appendChild(selectorDiv);

    return { selector: selectorDiv, select: select };
  }

  /**
   * Generate paper size selector UI
   */
  createPaperSizeSelector(container, onSelect) {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'paper-size-selector';
    selectorDiv.style.cssText = `
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 10px 0;
    `;

    const title = document.createElement('h4');
    title.textContent = 'Paper Size';
    title.style.marginTop = '0';

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 8px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    // Add options
    Object.keys(this.paperSizes).forEach(key => {
      const paper = this.paperSizes[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${key} (${paper.width}x${paper.height}${paper.units})`;
      select.appendChild(option);
    });

    // Info area
    const info = document.createElement('p');
    info.style.cssText = `
      margin: 10px 0 0 0;
      font-size: 12px;
      color: #666;
    `;
    const defaultPaper = this.paperSizes['A4'];
    info.textContent = `Recommended preset: ${defaultPaper.recommendedPreset}`;

    // Update info on change
    select.onchange = (e) => {
      const paper = this.paperSizes[e.target.value];
      info.textContent = `Recommended preset: ${paper.recommendedPreset}`;
      if (onSelect) {
        onSelect(paper);
      }
    };

    selectorDiv.appendChild(title);
    selectorDiv.appendChild(select);
    selectorDiv.appendChild(info);

    container.appendChild(selectorDiv);

    return { selector: selectorDiv, select: select };
  }

  /**
   * Export presets to JSON
   */
  exportPresets() {
    return JSON.stringify({
      presets: this.presets,
      paperSizes: this.paperSizes
    }, null, 2);
  }

  /**
   * Import presets from JSON
   */
  importPresets(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;

      if (data.presets) {
        Object.assign(this.presets, data.presets);
      }
      if (data.paperSizes) {
        Object.assign(this.paperSizes, data.paperSizes);
      }

      return true;
    } catch (error) {
      console.error('Failed to import presets:', error);
      return false;
    }
  }

  /**
   * Get optimization summary for preset
   */
  getPresetSummary(presetName) {
    const preset = this.getPreset(presetName);

    const features = [];
    if (preset.settings.removeShortPaths) features.push('Short path removal');
    if (preset.settings.simplifyPaths) features.push('Path simplification');
    if (preset.settings.fitArcs) features.push('Arc fitting');
    if (preset.settings.mergeEndpoints) features.push('Endpoint merging');
    if (preset.settings.orderMethod) features.push(`Order: ${preset.settings.orderMethod}`);
    if (preset.settings.finalTwoOpt) features.push('2-Opt refinement');

    return {
      name: preset.name,
      description: preset.description,
      features: features,
      penSpeed: preset.penSpeed,
      penUpSpeed: preset.penUpSpeed
    };
  }
}

// Global instance
const smartPresets = new SmartPresets();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartPresets;
}
