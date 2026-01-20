/**
 * ExportUtils - Centralized export functionality for pen plotter art
 * Provides standardized file naming, SVG generation, and optimization
 */

class ExportUtils {
  /**
   * Generate standardized filename with timestamp
   * @param {string} algorithmName - e.g., 'flow-field', 'islamic-patterns'
   * @param {string} extension - file extension (default: 'svg')
   * @param {Object} options - { seed, suffix, timestamp }
   * @returns {string} - formatted filename
   */
  static generateFilename(algorithmName, extension = 'svg', options = {}) {
    if (!algorithmName || typeof algorithmName !== 'string') {
      throw new Error('Algorithm name is required and must be a string');
    }

    const {
      seed = null,
      suffix = '',
      timestamp = new Date()
    } = options;

    // Sanitize algorithm name (lowercase, replace spaces/special chars with hyphens)
    const sanitizedName = algorithmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Format timestamp as YYYYMMDD-HHMMSS
    const iso = timestamp.toISOString();
    const dateStr = iso.slice(0, 4) + iso.slice(5, 7) + iso.slice(8, 10) + '-' +
                    iso.slice(11, 13) + iso.slice(14, 16) + iso.slice(17, 19);

    // Build filename parts
    const parts = [sanitizedName, dateStr];

    if (seed !== null) {
      parts.push(`seed-${seed}`);
    }

    if (suffix) {
      const sanitizedSuffix = suffix.replace(/[^a-z0-9-]/gi, '-');
      parts.push(sanitizedSuffix);
    }

    // Ensure extension starts with a dot
    const ext = extension.startsWith('.') ? extension : `.${extension}`;

    return `${parts.join('_')}${ext}`;
  }

  /**
   * Export SVG string as downloadable file
   * @param {string} svgContent - SVG markup string
   * @param {string} filename - output filename
   */
  static downloadSVG(svgContent, filename) {
    if (!svgContent || typeof svgContent !== 'string') {
      throw new Error('SVG content is required and must be a string');
    }

    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename is required and must be a string');
    }

    // Validate SVG content
    if (!this.validateSVG(svgContent)) {
      console.warn('SVG content may be invalid');
    }

    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Export canvas as PNG
   * @param {string} filename - Output filename
   * @param {HTMLCanvasElement} canvas - Optional canvas (uses default if not provided)
   */
  static exportPNG(filename, canvas = null) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename is required and must be a string');
    }

    // Use provided canvas or try to find default p5.js canvas
    const targetCanvas = canvas || document.querySelector('canvas');

    if (!targetCanvas) {
      throw new Error('No canvas found. Provide a canvas element or ensure p5.js canvas exists.');
    }

    // Convert canvas to blob and download
    targetCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  }

  /**
   * Export paths as SVG file
   * @param {Array} paths - Array of path data
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string} filename - Output filename
   * @param {Object} options - Export options
   */
  static exportSVG(paths, width, height, filename, options = {}) {
    if (!Array.isArray(paths)) {
      throw new Error('Paths must be an array');
    }

    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('Width and height must be numbers');
    }

    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }

    const {
      strokeColor = '#000000',
      strokeWidth = 1,
      optimize = true,
      includeMetadata = true
    } = options;

    // Build SVG header
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" `;
    svgContent += `width="${width}" height="${height}" `;
    svgContent += `viewBox="0 0 ${width} ${height}">\n`;

    // Add metadata if requested
    if (includeMetadata) {
      svgContent += `  <metadata>\n`;
      svgContent += `    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n`;
      svgContent += `             xmlns:dc="http://purl.org/dc/elements/1.1/">\n`;
      svgContent += `      <rdf:Description>\n`;
      svgContent += `        <dc:title>${filename}</dc:title>\n`;
      svgContent += `        <dc:creator>Pen Plotter Art Generator</dc:creator>\n`;
      svgContent += `        <dc:date>${new Date().toISOString()}</dc:date>\n`;
      svgContent += `      </rdf:Description>\n`;
      svgContent += `    </rdf:RDF>\n`;
      svgContent += `  </metadata>\n`;
    }

    // Add group for paths
    svgContent += `  <g stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none">\n`;

    // Convert paths to SVG path elements
    for (const path of paths) {
      if (!Array.isArray(path) || path.length === 0) {
        continue;
      }

      let pathData = 'M ';

      for (let i = 0; i < path.length; i++) {
        const point = path[i];

        // Support different point formats
        const x = point.x !== undefined ? point.x : point[0];
        const y = point.y !== undefined ? point.y : point[1];

        if (typeof x !== 'number' || typeof y !== 'number') {
          continue;
        }

        // Round to 2 decimal places for file size optimization
        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(y * 100) / 100;

        if (i === 0) {
          pathData += `${roundedX},${roundedY} `;
        } else {
          pathData += `L ${roundedX},${roundedY} `;
        }
      }

      svgContent += `    <path d="${pathData.trim()}" />\n`;
    }

    svgContent += `  </g>\n`;
    svgContent += `</svg>`;

    // Optimize if requested
    if (optimize) {
      svgContent = this.optimizeForPlotter(svgContent);
    }

    // Download the file
    this.downloadSVG(svgContent, filename);
  }

  /**
   * Validate SVG content
   * @param {string} svgContent - SVG markup
   * @returns {boolean} - true if valid
   */
  static validateSVG(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') {
      return false;
    }

    // Basic validation checks
    const hasSvgTag = /<svg[^>]*>/.test(svgContent);
    const hasClosingTag = /<\/svg>/.test(svgContent);
    const hasXmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svgContent);

    return hasSvgTag && hasClosingTag && hasXmlns;
  }

  /**
   * Optimize SVG for pen plotter
   * @param {string} svgContent - Raw SVG
   * @returns {string} - Optimized SVG
   */
  static optimizeForPlotter(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') {
      return svgContent;
    }

    let optimized = svgContent;

    // Remove unnecessary whitespace between tags
    optimized = optimized.replace(/>\s+</g, '><');

    // Remove comments
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

    // Consolidate multiple spaces
    optimized = optimized.replace(/\s{2,}/g, ' ');

    // Remove empty groups
    optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, '');

    // Remove unnecessary precision (keep 2 decimal places)
    optimized = optimized.replace(/(\d+\.\d{2})\d+/g, '$1');

    // Trim leading/trailing whitespace
    optimized = optimized.trim();

    return optimized;
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}
