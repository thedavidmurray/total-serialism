/**
 * Multi-Layer SVG Export System
 * For pen plotters with multiple color pens
 *
 * Usage:
 * const layerExporter = new LayerExporter(svgElement);
 * layerExporter.exportByColor(['#000000', '#ff0000', '#0000ff']);
 * layerExporter.exportByStrokeWeight([0.5, 1.0, 2.0]);
 * layerExporter.exportCustom(customSplitFunction);
 */

class LayerExporter {
  constructor(svgElement) {
    this.svgElement = svgElement;
    this.svgString = svgElement.elt ? svgElement.elt.outerHTML : svgElement.outerHTML;
    this.parser = new DOMParser();
    this.svgDoc = this.parser.parseFromString(this.svgString, 'image/svg+xml');
  }

  /**
   * Export layers split by stroke color
   * @param {Array} colors - Array of color hex strings or 'auto' for automatic detection
   * @param {Object} options - Export options
   */
  exportByColor(colors = 'auto', options = {}) {
    const defaults = {
      filename: 'layer',
      includeUnmatched: true,
      unmatchedName: 'other',
      sortByDensity: false
    };
    const opts = { ...defaults, ...options };

    // Auto-detect colors if requested
    if (colors === 'auto') {
      colors = this.detectUniqueColors();
    }

    const layers = {};

    // Initialize layers
    colors.forEach(color => {
      layers[color] = [];
    });
    if (opts.includeUnmatched) {
      layers['unmatched'] = [];
    }

    // Get all drawable elements
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path, text');

    elements.forEach(element => {
      const stroke = element.getAttribute('stroke') || element.style.stroke;
      const fill = element.getAttribute('fill') || element.style.fill;

      // Determine which color this element belongs to
      let matched = false;

      for (const color of colors) {
        if (this.colorsMatch(stroke, color) || this.colorsMatch(fill, color)) {
          layers[color].push(element.cloneNode(true));
          matched = true;
          break;
        }
      }

      if (!matched && opts.includeUnmatched) {
        layers['unmatched'].push(element.cloneNode(true));
      }
    });

    // Export each layer
    const exports = [];
    Object.entries(layers).forEach(([colorKey, elements], index) => {
      if (elements.length === 0) return;

      const layerName = colorKey === 'unmatched' ?
        opts.unmatchedName :
        `${opts.filename}-color${index + 1}`;

      const svgContent = this.createLayerSVG(elements, colorKey);
      exports.push({
        name: layerName,
        color: colorKey,
        elementCount: elements.length,
        svg: svgContent
      });
    });

    return exports;
  }

  /**
   * Export layers split by stroke weight/width
   * @param {Array} weights - Array of stroke weights or 'auto'
   * @param {Object} options - Export options
   */
  exportByStrokeWeight(weights = 'auto', options = {}) {
    const defaults = {
      filename: 'layer',
      tolerance: 0.1,
      includeUnmatched: true
    };
    const opts = { ...defaults, ...options };

    if (weights === 'auto') {
      weights = this.detectUniqueStrokeWeights();
    }

    const layers = {};
    weights.forEach(weight => {
      layers[weight] = [];
    });
    if (opts.includeUnmatched) {
      layers['unmatched'] = [];
    }

    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path');

    elements.forEach(element => {
      const strokeWidth = parseFloat(
        element.getAttribute('stroke-width') ||
        element.style.strokeWidth ||
        '1'
      );

      let matched = false;
      for (const weight of weights) {
        if (Math.abs(strokeWidth - weight) <= opts.tolerance) {
          layers[weight].push(element.cloneNode(true));
          matched = true;
          break;
        }
      }

      if (!matched && opts.includeUnmatched) {
        layers['unmatched'].push(element.cloneNode(true));
      }
    });

    // Export each layer
    const exports = [];
    Object.entries(layers).forEach(([weight, elements], index) => {
      if (elements.length === 0) return;

      const layerName = weight === 'unmatched' ?
        'layer-other' :
        `${opts.filename}-weight${weight}`;

      const svgContent = this.createLayerSVG(elements, '#000000');
      exports.push({
        name: layerName,
        strokeWeight: weight,
        elementCount: elements.length,
        svg: svgContent
      });
    });

    return exports;
  }

  /**
   * Export layers using custom split function
   * @param {Function} splitFunction - Function that returns layer name for each element
   * @param {Object} options - Export options
   */
  exportCustom(splitFunction, options = {}) {
    const defaults = {
      filename: 'layer'
    };
    const opts = { ...defaults, ...options };

    const layers = {};
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path, text');

    elements.forEach(element => {
      const layerName = splitFunction(element);
      if (layerName) {
        if (!layers[layerName]) {
          layers[layerName] = [];
        }
        layers[layerName].push(element.cloneNode(true));
      }
    });

    // Export each layer
    const exports = [];
    Object.entries(layers).forEach(([layerName, elements]) => {
      if (elements.length === 0) return;

      const svgContent = this.createLayerSVG(elements, '#000000');
      exports.push({
        name: `${opts.filename}-${layerName}`,
        elementCount: elements.length,
        svg: svgContent
      });
    });

    return exports;
  }

  /**
   * Export layers by vertical or horizontal position (useful for multi-pass plotting)
   * @param {string} direction - 'horizontal' or 'vertical'
   * @param {number} divisions - Number of divisions/layers
   * @param {Object} options - Export options
   */
  exportByPosition(direction = 'horizontal', divisions = 2, options = {}) {
    const defaults = {
      filename: 'layer',
      overlap: 0 // Overlap in pixels between layers
    };
    const opts = { ...defaults, ...options };

    const layers = {};
    for (let i = 0; i < divisions; i++) {
      layers[`section-${i + 1}`] = [];
    }

    // Get SVG dimensions
    const svgRoot = this.svgDoc.querySelector('svg');
    const viewBox = svgRoot.getAttribute('viewBox');
    const [, , width, height] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 800, 600];

    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path');

    elements.forEach(element => {
      // Get element bounds
      const bounds = this.getElementBounds(element);
      if (!bounds) return;

      // Determine which section(s) this element belongs to
      if (direction === 'horizontal') {
        const sectionHeight = height / divisions;
        for (let i = 0; i < divisions; i++) {
          const sectionStart = i * sectionHeight - opts.overlap;
          const sectionEnd = (i + 1) * sectionHeight + opts.overlap;

          if (bounds.bottom >= sectionStart && bounds.top <= sectionEnd) {
            layers[`section-${i + 1}`].push(element.cloneNode(true));
          }
        }
      } else { // vertical
        const sectionWidth = width / divisions;
        for (let i = 0; i < divisions; i++) {
          const sectionStart = i * sectionWidth - opts.overlap;
          const sectionEnd = (i + 1) * sectionWidth + opts.overlap;

          if (bounds.right >= sectionStart && bounds.left <= sectionEnd) {
            layers[`section-${i + 1}`].push(element.cloneNode(true));
          }
        }
      }
    });

    // Export each layer
    const exports = [];
    Object.entries(layers).forEach(([sectionName, elements]) => {
      if (elements.length === 0) return;

      const svgContent = this.createLayerSVG(elements, '#000000');
      exports.push({
        name: `${opts.filename}-${sectionName}`,
        elementCount: elements.length,
        svg: svgContent
      });
    });

    return exports;
  }

  /**
   * Download all layers as separate SVG files
   * @param {Array} layers - Array of layer objects from export functions
   */
  downloadLayers(layers) {
    layers.forEach((layer, index) => {
      setTimeout(() => {
        const blob = new Blob([layer.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${layer.name}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }, index * 200); // Stagger downloads to avoid browser blocking
    });
  }

  /**
   * Create a complete SVG document for a layer
   * @param {Array} elements - Array of SVG elements
   * @param {string} defaultColor - Default color for elements
   */
  createLayerSVG(elements, defaultColor) {
    const svgRoot = this.svgDoc.querySelector('svg');
    const width = svgRoot.getAttribute('width') || '800';
    const height = svgRoot.getAttribute('height') || '600';
    const viewBox = svgRoot.getAttribute('viewBox') || `0 0 ${width} ${height}`;

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
  <!-- Layer exported with LayerExporter -->
  <!-- Elements: ${elements.length} -->
  <g id="layer">
`;

    elements.forEach(element => {
      // Ensure element has proper stroke color
      if (!element.getAttribute('stroke') && !element.style.stroke) {
        element.setAttribute('stroke', defaultColor);
      }
      svgContent += '    ' + element.outerHTML + '\n';
    });

    svgContent += `  </g>
</svg>`;

    return svgContent;
  }

  /**
   * Detect unique colors in the SVG
   */
  detectUniqueColors() {
    const colors = new Set();
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path');

    elements.forEach(element => {
      const stroke = element.getAttribute('stroke') || element.style.stroke;
      const fill = element.getAttribute('fill') || element.style.fill;

      if (stroke && stroke !== 'none') colors.add(this.normalizeColor(stroke));
      if (fill && fill !== 'none') colors.add(this.normalizeColor(fill));
    });

    return Array.from(colors);
  }

  /**
   * Detect unique stroke weights in the SVG
   */
  detectUniqueStrokeWeights() {
    const weights = new Set();
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path');

    elements.forEach(element => {
      const strokeWidth = parseFloat(
        element.getAttribute('stroke-width') ||
        element.style.strokeWidth ||
        '1'
      );
      weights.add(strokeWidth);
    });

    return Array.from(weights).sort((a, b) => a - b);
  }

  /**
   * Get bounding box of an element
   */
  getElementBounds(element) {
    // This is a simplified version - you might need more sophisticated bounds detection
    try {
      if (element.tagName === 'line') {
        const x1 = parseFloat(element.getAttribute('x1') || 0);
        const y1 = parseFloat(element.getAttribute('y1') || 0);
        const x2 = parseFloat(element.getAttribute('x2') || 0);
        const y2 = parseFloat(element.getAttribute('y2') || 0);
        return {
          left: Math.min(x1, x2),
          top: Math.min(y1, y2),
          right: Math.max(x1, x2),
          bottom: Math.max(y1, y2)
        };
      } else if (element.tagName === 'rect') {
        const x = parseFloat(element.getAttribute('x') || 0);
        const y = parseFloat(element.getAttribute('y') || 0);
        const w = parseFloat(element.getAttribute('width') || 0);
        const h = parseFloat(element.getAttribute('height') || 0);
        return {
          left: x,
          top: y,
          right: x + w,
          bottom: y + h
        };
      }
      // For other elements, return approximate bounds
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Normalize color to hex format
   */
  normalizeColor(color) {
    if (!color) return '#000000';

    // Already hex
    if (color.startsWith('#')) {
      return color.toLowerCase();
    }

    // RGB format
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches) {
        const r = parseInt(matches[0]).toString(16).padStart(2, '0');
        const g = parseInt(matches[1]).toString(16).padStart(2, '0');
        const b = parseInt(matches[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }

    // Named colors - convert common ones
    const namedColors = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#00ff00',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff'
    };

    return namedColors[color.toLowerCase()] || '#000000';
  }

  /**
   * Check if two colors match
   */
  colorsMatch(color1, color2) {
    if (!color1 || !color2) return false;
    return this.normalizeColor(color1) === this.normalizeColor(color2);
  }

  /**
   * Get layer statistics
   */
  getStats() {
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path, text');
    const colors = this.detectUniqueColors();
    const weights = this.detectUniqueStrokeWeights();

    return {
      totalElements: elements.length,
      uniqueColors: colors.length,
      colors: colors,
      uniqueStrokeWeights: weights.length,
      strokeWeights: weights,
      elementTypes: this.getElementTypeCounts()
    };
  }

  /**
   * Get count of each element type
   */
  getElementTypeCounts() {
    const counts = {};
    const elements = this.svgDoc.querySelectorAll('line, rect, circle, ellipse, polygon, polyline, path, text');

    elements.forEach(element => {
      const type = element.tagName;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayerExporter;
}
