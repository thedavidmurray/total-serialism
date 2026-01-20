/**
 * Layer Export UI Component
 * Provides a ready-to-use UI for multi-layer SVG exports
 *
 * Usage:
 * const layerUI = new LayerExportUI(svgCanvas, containerSelector);
 * layerUI.render();
 */

class LayerExportUI {
  constructor(svgCanvas, containerSelector = '#layer-export-controls') {
    this.svgCanvas = svgCanvas;
    this.container = typeof containerSelector === 'string' ?
      document.querySelector(containerSelector) :
      containerSelector;
    this.layerExporter = null;
  }

  /**
   * Render the layer export UI
   */
  render() {
    if (!this.container) {
      console.error('Layer export container not found');
      return;
    }

    this.container.innerHTML = `
      <div class="layer-export-panel">
        <h3 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 14px;">
          🎨 MULTI-LAYER EXPORT
        </h3>

        <div class="layer-info" id="layer-info" style="
          background: #001100;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 11px;
          border: 1px solid #003300;
        ">
          <div><strong>Total Elements:</strong> <span id="total-elements">-</span></div>
          <div><strong>Unique Colors:</strong> <span id="unique-colors">-</span></div>
          <div><strong>Stroke Weights:</strong> <span id="unique-weights">-</span></div>
        </div>

        <div class="control" style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-size: 12px;">
            Split Method:
          </label>
          <select id="layer-split-method" style="
            width: 100%;
            padding: 8px;
            background: #001100;
            color: #00ff00;
            border: 1px solid #003300;
            font-family: monospace;
          ">
            <option value="color">By Color (Pen Colors)</option>
            <option value="stroke">By Stroke Weight</option>
            <option value="horizontal">By Horizontal Position</option>
            <option value="vertical">By Vertical Position</option>
            <option value="density">By Element Density</option>
          </select>
        </div>

        <div id="layer-options">
          <!-- Dynamic options will appear here -->
        </div>

        <div class="control" style="margin-bottom: 10px;">
          <label style="display: flex; align-items: center;">
            <input type="checkbox" id="include-unmatched" checked style="margin-right: 8px;">
            Include unmatched elements
          </label>
        </div>

        <button id="analyze-layers-btn" style="
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          background: #003300;
          color: #00ff00;
          border: 2px solid #00ff00;
          cursor: pointer;
          font-family: monospace;
          font-weight: bold;
        ">
          🔍 ANALYZE LAYERS
        </button>

        <div id="layer-preview" style="
          margin: 15px 0;
          padding: 10px;
          background: #000;
          border: 1px solid #003300;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          display: none;
        ">
          <!-- Layer preview will appear here -->
        </div>

        <button id="export-layers-btn" style="
          width: 100%;
          padding: 12px;
          margin: 5px 0;
          background: #004400;
          color: #00ff00;
          border: 2px solid #00ff00;
          cursor: pointer;
          font-family: monospace;
          font-weight: bold;
          font-size: 14px;
          display: none;
        ">
          💾 EXPORT ALL LAYERS
        </button>

        <div id="export-status" style="
          margin-top: 10px;
          font-size: 11px;
          color: #00aa00;
          text-align: center;
        "></div>
      </div>
    `;

    this.setupEventListeners();
    this.updateInfo();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const splitMethod = document.getElementById('layer-split-method');
    const analyzeBtn = document.getElementById('analyze-layers-btn');
    const exportBtn = document.getElementById('export-layers-btn');

    if (splitMethod) {
      splitMethod.addEventListener('change', () => {
        this.renderOptions();
        document.getElementById('layer-preview').style.display = 'none';
        document.getElementById('export-layers-btn').style.display = 'none';
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeLayers());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLayers());
    }

    // Initial options render
    this.renderOptions();
  }

  /**
   * Render method-specific options
   */
  renderOptions() {
    const optionsContainer = document.getElementById('layer-options');
    const method = document.getElementById('layer-split-method').value;

    let optionsHTML = '';

    switch (method) {
      case 'color':
        optionsHTML = `
          <div class="control" style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 11px;">
              Specify Colors (comma-separated hex, or 'auto'):
            </label>
            <input type="text" id="color-list" value="auto" style="
              width: 100%;
              padding: 6px;
              background: #001100;
              color: #00ff00;
              border: 1px solid #003300;
              font-family: monospace;
              font-size: 11px;
            ">
            <div style="font-size: 10px; color: #00aa00; margin-top: 3px;">
              Example: #000000, #ff0000, #0000ff
            </div>
          </div>
        `;
        break;

      case 'stroke':
        optionsHTML = `
          <div class="control" style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 11px;">
              Stroke Weights (comma-separated, or 'auto'):
            </label>
            <input type="text" id="weight-list" value="auto" style="
              width: 100%;
              padding: 6px;
              background: #001100;
              color: #00ff00;
              border: 1px solid #003300;
              font-family: monospace;
              font-size: 11px;
            ">
            <div style="font-size: 10px; color: #00aa00; margin-top: 3px;">
              Example: 0.5, 1.0, 2.0
            </div>
          </div>
        `;
        break;

      case 'horizontal':
      case 'vertical':
        optionsHTML = `
          <div class="control" style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 11px;">
              Number of Divisions:
            </label>
            <input type="number" id="divisions" value="2" min="2" max="10" style="
              width: 100%;
              padding: 6px;
              background: #001100;
              color: #00ff00;
              border: 1px solid #003300;
              font-family: monospace;
            ">
          </div>
          <div class="control" style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 11px;">
              Overlap (px):
            </label>
            <input type="number" id="overlap" value="5" min="0" max="50" style="
              width: 100%;
              padding: 6px;
              background: #001100;
              color: #00ff00;
              border: 1px solid #003300;
              font-family: monospace;
            ">
          </div>
        `;
        break;

      case 'density':
        optionsHTML = `
          <div class="control" style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 11px;">
              Density Levels:
            </label>
            <input type="number" id="density-levels" value="3" min="2" max="5" style="
              width: 100%;
              padding: 6px;
              background: #001100;
              color: #00ff00;
              border: 1px solid #003300;
              font-family: monospace;
            ">
            <div style="font-size: 10px; color: #00aa00; margin-top: 3px;">
              Split by visual density (light, medium, heavy)
            </div>
          </div>
        `;
        break;
    }

    optionsContainer.innerHTML = optionsHTML;
  }

  /**
   * Update layer information
   */
  updateInfo() {
    if (!this.svgCanvas) return;

    try {
      this.layerExporter = new LayerExporter(this.svgCanvas);
      const stats = this.layerExporter.getStats();

      document.getElementById('total-elements').textContent = stats.totalElements;
      document.getElementById('unique-colors').textContent =
        `${stats.uniqueColors} (${stats.colors.join(', ')})`;
      document.getElementById('unique-weights').textContent =
        `${stats.uniqueStrokeWeights} (${stats.strokeWeights.join(', ')})`;
    } catch (e) {
      console.error('Error analyzing SVG:', e);
    }
  }

  /**
   * Analyze layers based on selected method
   */
  analyzeLayers() {
    const status = document.getElementById('export-status');
    status.textContent = 'Analyzing...';

    try {
      this.layerExporter = new LayerExporter(this.svgCanvas);
      const method = document.getElementById('layer-split-method').value;
      let layers = [];

      switch (method) {
        case 'color':
          const colorInput = document.getElementById('color-list').value.trim();
          const colors = colorInput === 'auto' ? 'auto' :
            colorInput.split(',').map(c => c.trim());
          layers = this.layerExporter.exportByColor(colors, {
            filename: 'layer',
            includeUnmatched: document.getElementById('include-unmatched').checked
          });
          break;

        case 'stroke':
          const weightInput = document.getElementById('weight-list').value.trim();
          const weights = weightInput === 'auto' ? 'auto' :
            weightInput.split(',').map(w => parseFloat(w.trim()));
          layers = this.layerExporter.exportByStrokeWeight(weights, {
            filename: 'layer',
            includeUnmatched: document.getElementById('include-unmatched').checked
          });
          break;

        case 'horizontal':
          const hDivisions = parseInt(document.getElementById('divisions').value);
          const hOverlap = parseInt(document.getElementById('overlap').value);
          layers = this.layerExporter.exportByPosition('horizontal', hDivisions, {
            filename: 'layer',
            overlap: hOverlap
          });
          break;

        case 'vertical':
          const vDivisions = parseInt(document.getElementById('divisions').value);
          const vOverlap = parseInt(document.getElementById('overlap').value);
          layers = this.layerExporter.exportByPosition('vertical', vDivisions, {
            filename: 'layer',
            overlap: vOverlap
          });
          break;

        case 'density':
          // Implement density-based splitting
          status.textContent = 'Density splitting coming soon!';
          return;
      }

      this.currentLayers = layers;
      this.showLayerPreview(layers);
      status.textContent = `Found ${layers.length} layers!`;

    } catch (e) {
      status.textContent = `Error: ${e.message}`;
      console.error('Analysis error:', e);
    }
  }

  /**
   * Show preview of layers
   */
  showLayerPreview(layers) {
    const preview = document.getElementById('layer-preview');
    const exportBtn = document.getElementById('export-layers-btn');

    let html = '<div style="font-size: 12px; margin-bottom: 10px; color: #00ff00;">📋 Layer Preview:</div>';

    layers.forEach((layer, index) => {
      const colorBox = layer.color ?
        `<span style="display: inline-block; width: 12px; height: 12px; background: ${layer.color}; border: 1px solid #00ff00; margin-right: 5px;"></span>` :
        '';

      html += `
        <div style="
          padding: 8px;
          margin: 5px 0;
          background: #001100;
          border-left: 3px solid #00ff00;
          font-size: 11px;
        ">
          ${colorBox}<strong>${layer.name}</strong><br>
          <span style="color: #00aa00;">
            Elements: ${layer.elementCount}
            ${layer.color ? ` | Color: ${layer.color}` : ''}
            ${layer.strokeWeight ? ` | Weight: ${layer.strokeWeight}` : ''}
          </span>
        </div>
      `;
    });

    preview.innerHTML = html;
    preview.style.display = 'block';
    exportBtn.style.display = 'block';
  }

  /**
   * Export all layers
   */
  exportLayers() {
    if (!this.currentLayers || this.currentLayers.length === 0) {
      alert('Please analyze layers first!');
      return;
    }

    const status = document.getElementById('export-status');
    status.textContent = `Exporting ${this.currentLayers.length} layers...`;

    this.layerExporter.downloadLayers(this.currentLayers);

    status.textContent = `✓ Exported ${this.currentLayers.length} layers!`;
    setTimeout(() => {
      status.textContent = '';
    }, 5000);
  }

  /**
   * Update with new SVG canvas
   */
  updateCanvas(newCanvas) {
    this.svgCanvas = newCanvas;
    this.updateInfo();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayerExportUI;
}
