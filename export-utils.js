/**
 * Export Utilities for Total Serialism
 * Shared functions for SVG and PNG export across all algorithms
 */

class ExportUtils {
  /**
   * Export paths as SVG with proper formatting
   * @param {Array} paths - Array of path objects or arrays of points
   * @param {Number} width - Canvas width
   * @param {Number} height - Canvas height
   * @param {String} filename - Output filename (without extension)
   * @param {Object} options - Additional options
   */
  static exportSVG(paths, width, height, filename, options = {}) {
    const {
      backgroundColor = 'white',
      strokeColor = 'black',
      strokeWidth = 1,
      fill = 'none',
      metadata = {}
    } = options;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  <g stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fill}">
`;

    // Handle different path formats
    paths.forEach(path => {
      if (Array.isArray(path)) {
        // Array of points: [{x, y}, {x, y}, ...]
        if (path.length > 1) {
          svg += '    <polyline points="';
          svg += path.map(p => `${p.x},${p.y}`).join(' ');
          svg += '"/>\n';
        }
      } else if (path.points) {
        // Object with points array
        if (path.points.length > 1) {
          svg += '    <polyline points="';
          svg += path.points.map(p => `${p.x},${p.y}`).join(' ');
          svg += `" ${path.closed ? 'stroke-linejoin="round"' : ''}/>\n`;
        }
      } else if (path.path) {
        // Object with nested path
        const pathStr = path.path.map((p, i) =>
          i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
        ).join(' ');
        svg += `    <path d="${pathStr}"/>\n`;
      }
    });

    svg += `  </g>\n</svg>`;

    this.downloadFile(svg, `${filename}.svg`, 'image/svg+xml');
  }

  /**
   * Export canvas as PNG
   * @param {String} filename - Output filename (without extension)
   * @param {HTMLCanvasElement} canvas - Optional canvas element (uses p5 canvas if not provided)
   */
  static exportPNG(filename, canvas = null) {
    if (typeof saveCanvas !== 'undefined') {
      // p5.js environment
      saveCanvas(filename, 'png');
    } else if (canvas) {
      // Native canvas
      canvas.toBlob(blob => {
        this.downloadFile(blob, `${filename}.png`, 'image/png');
      });
    } else {
      console.error('No canvas available for PNG export');
    }
  }

  /**
   * Export simple SVG shapes (circles, rectangles, etc.)
   * @param {Array} shapes - Array of shape objects
   * @param {Number} width - Canvas width
   * @param {Number} height - Canvas height
   * @param {String} filename - Output filename
   * @param {Object} options - Additional options
   */
  static exportShapesSVG(shapes, width, height, filename, options = {}) {
    const {
      backgroundColor = 'white',
      defaultStroke = 'black',
      defaultStrokeWidth = 1,
      defaultFill = 'none'
    } = options;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
`;

    shapes.forEach(shape => {
      const stroke = shape.stroke || defaultStroke;
      const strokeWidth = shape.strokeWeight || shape.strokeWidth || defaultStrokeWidth;
      const fill = shape.fill || defaultFill;

      switch (shape.type) {
        case 'circle':
          svg += `  <circle cx="${shape.x}" cy="${shape.y}" r="${shape.r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
          break;

        case 'rect':
          svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
          break;

        case 'line':
          svg += `  <line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" stroke="${stroke}" stroke-width="${strokeWidth}"/>\n`;
          break;

        case 'ellipse':
          svg += `  <ellipse cx="${shape.x}" cy="${shape.y}" rx="${shape.rx}" ry="${shape.ry}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
          break;

        case 'polygon':
          if (shape.points && shape.points.length > 0) {
            const points = shape.points.map(p => `${p.x},${p.y}`).join(' ');
            svg += `  <polygon points="${points}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
          }
          break;

        case 'path':
          if (shape.d) {
            svg += `  <path d="${shape.d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
          }
          break;
      }
    });

    svg += `</svg>`;

    this.downloadFile(svg, `${filename}.svg`, 'image/svg+xml');
  }

  /**
   * Download a file
   * @param {String|Blob} content - File content
   * @param {String} filename - Filename
   * @param {String} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    let blob;
    if (content instanceof Blob) {
      blob = content;
    } else {
      blob = new Blob([content], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export JSON configuration
   * @param {Object} config - Configuration object
   * @param {String} filename - Output filename
   */
  static exportJSON(config, filename) {
    const json = JSON.stringify(config, null, 2);
    this.downloadFile(json, `${filename}.json`, 'application/json');
  }

  /**
   * Generate timestamp for unique filenames
   * @returns {String} Timestamp string
   */
  static timestamp() {
    return Date.now();
  }

  /**
   * Create filename with seed and timestamp
   * @param {String} algorithmName - Algorithm name
   * @param {Number} seed - Seed value
   * @returns {String} Generated filename
   */
  static generateFilename(algorithmName, seed = null) {
    const parts = [algorithmName];
    if (seed !== null) {
      parts.push(`seed-${seed}`);
    }
    parts.push(this.timestamp());
    return parts.join('-');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ExportUtils = ExportUtils;
}
