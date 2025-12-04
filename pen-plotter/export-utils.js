/**
 * STANDARDIZED EXPORT UTILITIES
 * Universal export functions for all Total Serialism algorithms
 * Eliminates duplicate code and ensures consistent quality
 */

class ExportUtils {
  constructor() {
    this.defaultSettings = {
      svg: {
        strokeWeight: 0.5,
        strokeColor: 0,
        plotter: {
          removeBackground: true,
          removeGradients: true,
          convertFillsToStrokes: true,
          optimizePaths: true
        }
      },
      png: {
        maxSize: 4000,
        quality: 0.9
      },
      gif: {
        duration: 3,
        delay: 100,
        maxFrames: 30
      },
      naming: {
        includeTimestamp: true,
        includeParams: true,
        separator: '-'
      }
    };
  }

  /**
   * Generate standardized filename
   */
  generateFilename(algorithmName, mode = '', params = {}, extension = 'svg') {
    let filename = algorithmName;
    
    if (mode) {
      filename += `${this.defaultSettings.naming.separator}${mode}`;
    }
    
    if (this.defaultSettings.naming.includeParams) {
      if (params.seed) filename += `${this.defaultSettings.naming.separator}${params.seed}`;
      if (params.iteration !== undefined) filename += `${this.defaultSettings.naming.separator}i${params.iteration}`;
    }
    
    if (this.defaultSettings.naming.includeTimestamp) {
      filename += `${this.defaultSettings.naming.separator}${Date.now()}`;
    }
    
    return `${filename}.${extension}`;
  }

  /**
   * SCREEN SVG EXPORT - For visual display (keeps backgrounds, fills)
   */
  exportScreenSVG(drawFunction, algorithmName, params = {}) {
    const canvas = createGraphics(width, height, SVG);
    drawFunction(canvas, 'screen');
    
    const filename = this.generateFilename(algorithmName, 'screen', params, 'svg');
    save(canvas, filename);
    canvas.remove();
    
    return filename;
  }

  /**
   * PLOTTER SVG EXPORT - Optimized for pen plotting (no backgrounds, stroke-only)
   */
  exportPlotterSVG(drawFunction, algorithmName, params = {}) {
    const canvas = createGraphics(width, height, SVG);
    
    // Set plotter-optimized defaults
    canvas.stroke(this.defaultSettings.svg.strokeColor);
    canvas.strokeWeight(this.defaultSettings.svg.strokeWeight);
    canvas.noFill();
    
    drawFunction(canvas, 'plotter');
    
    const filename = this.generateFilename(algorithmName, 'plotter', params, 'svg');
    save(canvas, filename);
    canvas.remove();
    
    return filename;
  }

  /**
   * PNG EXPORT - With performance safeguards
   */
  exportPNG(algorithmName, params = {}) {
    // Performance safeguard
    if (width > this.defaultSettings.png.maxSize || height > this.defaultSettings.png.maxSize) {
      const proceed = confirm(`Canvas is ${width}×${height}px. Large PNG exports may be slow. Continue?`);
      if (!proceed) return null;
    }
    
    const filename = this.generateFilename(algorithmName, 'png', params, 'png');
    save(filename);
    
    return filename;
  }

  /**
   * ANIMATED GIF EXPORT - With frame limiting
   */
  exportGIF(frames, algorithmName, params = {}) {
    if (frames.length > this.defaultSettings.gif.maxFrames) {
      console.warn(`Limiting GIF to ${this.defaultSettings.gif.maxFrames} frames for performance`);
      frames = frames.slice(0, this.defaultSettings.gif.maxFrames);
    }
    
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: width,
      height: height
    });
    
    frames.forEach(frame => {
      gif.addFrame(frame, { delay: this.defaultSettings.gif.delay });
    });
    
    gif.on('finished', (blob) => {
      const filename = this.generateFilename(algorithmName, 'gif', params, 'gif');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    gif.render();
  }

  /**
   * LAYER EXPORT - Multiple SVGs for different elements
   */
  exportLayers(layers, algorithmName, params = {}) {
    const filenames = [];
    
    layers.forEach((layer, index) => {
      const canvas = createGraphics(width, height, SVG);
      layer.drawFunction(canvas);
      
      const filename = this.generateFilename(
        algorithmName, 
        `layer${index + 1}-${layer.name}`, 
        params, 
        'svg'
      );
      
      save(canvas, filename);
      canvas.remove();
      filenames.push(filename);
    });
    
    return filenames;
  }

  /**
   * BATCH EXPORT - Multiple formats at once
   */
  exportBatch(drawFunction, algorithmName, params = {}, formats = ['screen-svg', 'plotter-svg', 'png']) {
    const results = {};
    
    if (formats.includes('screen-svg')) {
      results.screenSvg = this.exportScreenSVG(drawFunction, algorithmName, params);
    }
    
    if (formats.includes('plotter-svg')) {
      results.plotterSvg = this.exportPlotterSVG(drawFunction, algorithmName, params);
    }
    
    if (formats.includes('png')) {
      results.png = this.exportPNG(algorithmName, params);
    }
    
    return results;
  }

  /**
   * QUICK EXPORT BUTTONS - Add to any algorithm
   */
  addExportButtons(container, drawFunction, algorithmName, params = {}) {
    const exportGroup = document.createElement('div');
    exportGroup.className = 'control-group export-group';
    exportGroup.innerHTML = `
      <h3>💾 Export</h3>
      <div class="button-row">
        <button class="export-btn screen-svg">📺 Screen SVG</button>
        <button class="export-btn plotter-svg" style="background-color: #4CAF50;">🖋️ Plotter SVG</button>
        <button class="export-btn png">🖼️ PNG</button>
        <button class="export-btn batch">📦 Batch Export</button>
      </div>
    `;
    
    // Add event listeners
    exportGroup.querySelector('.screen-svg').addEventListener('click', () => {
      this.exportScreenSVG(drawFunction, algorithmName, params);
    });
    
    exportGroup.querySelector('.plotter-svg').addEventListener('click', () => {
      this.exportPlotterSVG(drawFunction, algorithmName, params);
    });
    
    exportGroup.querySelector('.png').addEventListener('click', () => {
      this.exportPNG(algorithmName, params);
    });
    
    exportGroup.querySelector('.batch').addEventListener('click', () => {
      this.exportBatch(drawFunction, algorithmName, params);
    });
    
    container.appendChild(exportGroup);
  }
}

// Global instance
const exportUtils = new ExportUtils();

// Legacy compatibility functions
function exportScreenSVG(drawFunction, algorithmName, params) {
  return exportUtils.exportScreenSVG(drawFunction, algorithmName, params);
}

function exportPlotterSVG(drawFunction, algorithmName, params) {
  return exportUtils.exportPlotterSVG(drawFunction, algorithmName, params);
}

function exportPNG(algorithmName, params) {
  return exportUtils.exportPNG(algorithmName, params);
}

function exportBatch(drawFunction, algorithmName, params, formats) {
  return exportUtils.exportBatch(drawFunction, algorithmName, params, formats);
}