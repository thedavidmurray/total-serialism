/**
 * ASCII Art Library for Total Serialism
 *
 * Converts images to ASCII art suitable for pen plotting.
 * Three modes: character-based, density-based, and edge-detected.
 *
 * Usage:
 *   const ascii = ASCIIArt.imageToASCII(img, { charSet: 'detailed', cellWidth: 8 });
 *   const svg = ASCIIArt.asciiToSVG(ascii);
 *   const dots = ASCIIArt.asciiToDots(ascii, { dotSize: 2 });
 */

const ASCIIArt = {
  // Character sets from dense to sparse
  CHAR_SETS: {
    detailed: '@%#*+=-:. ',
    simple: '@%*+. ',
    blocks: '█▓▒░ ',
    binary: '█ '
  },

  /**
   * Convert image to ASCII using character density
   *
   * @param {p5.Image} img - Source image
   * @param {Object} options - Conversion options
   * @returns {string} - ASCII art string
   */
  imageToASCII: function(img, options = {}) {
    const charSet = this.CHAR_SETS[options.charSet || 'detailed'];
    const cellWidth = options.cellWidth || 8;
    const cellHeight = options.cellHeight || 12;
    const invert = options.invert || false;

    img.loadPixels();

    const cols = Math.floor(img.width / cellWidth);
    const rows = Math.floor(img.height / cellHeight);

    let ascii = [];

    for (let y = 0; y < rows; y++) {
      let row = '';
      for (let x = 0; x < cols; x++) {
        // Sample average brightness in cell
        let sum = 0;
        let count = 0;

        for (let cy = 0; cy < cellHeight; cy++) {
          for (let cx = 0; cx < cellWidth; cx++) {
            const px = x * cellWidth + cx;
            const py = y * cellHeight + cy;

            if (px < img.width && py < img.height) {
              const idx = (px + py * img.width) * 4;
              sum += img.pixels[idx];
              count++;
            }
          }
        }

        const avgBrightness = sum / count;
        const normalized = invert ? (255 - avgBrightness) / 255 : avgBrightness / 255;
        const charIndex = Math.floor(normalized * (charSet.length - 1));
        row += charSet[charIndex];
      }
      ascii.push(row);
    }

    return ascii.join('\n');
  },

  /**
   * Convert ASCII to plottable paths
   * Each character becomes a small drawn character
   *
   * @param {string} asciiText - ASCII art string
   * @param {Object} options - SVG options
   * @returns {string} - SVG string
   */
  asciiToSVG: function(asciiText, options = {}) {
    const charWidth = options.charWidth || 8;
    const charHeight = options.charHeight || 12;
    const font = options.font || 'monospace';
    const fontSize = options.fontSize || 10;

    const lines = asciiText.split('\n');
    const width = Math.max(...lines.map(l => l.length)) * charWidth;
    const height = lines.length * charHeight;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <g font-family="${font}" font-size="${fontSize}" fill="black">
`;

    lines.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        if (char.trim()) {
          const px = x * charWidth;
          const py = (y + 1) * charHeight;
          svg += `    <text x="${px}" y="${py}">${this._escapeXML(char)}</text>\n`;
        }
      }
    });

    svg += `  </g>\n</svg>`;
    return svg;
  },

  /**
   * Convert ASCII to dot pattern (better for plotting)
   * Density of characters determines dot size
   *
   * @param {string} asciiText - ASCII art string
   * @param {Object} options - Dot options
   * @returns {string} - SVG string
   */
  asciiToDots: function(asciiText, options = {}) {
    const dotSize = options.dotSize || 2;
    const spacing = options.spacing || 8;

    const lines = asciiText.split('\n');
    const width = Math.max(...lines.map(l => l.length)) * spacing;
    const height = lines.length * spacing;

    const dots = [];

    lines.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        // Denser characters = more/larger dots
        const density = this._charDensity(char);

        if (density > 0) {
          const px = x * spacing;
          const py = y * spacing;
          const size = dotSize * density;
          dots.push(`<circle cx="${px}" cy="${py}" r="${size}"/>`);
        }
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <g fill="black">
    ${dots.join('\n    ')}
  </g>
</svg>`;
  },

  /**
   * Helper: Get character density (0-1)
   */
  _charDensity: function(char) {
    const allChars = '@%#*+=-:. █▓▒░';
    const densities = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 1.0, 0.75, 0.5, 0.25];
    const idx = allChars.indexOf(char);
    return idx >= 0 ? densities[idx] : 0;
  },

  /**
   * Helper: Escape XML entities
   */
  _escapeXML: function(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  /**
   * Get statistics about ASCII output
   */
  getStats: function(asciiText) {
    const lines = asciiText.split('\n');
    const totalChars = asciiText.length;
    const nonSpaceChars = asciiText.replace(/\s/g, '').length;

    return {
      lines: lines.length,
      columns: Math.max(...lines.map(l => l.length)),
      totalChars,
      nonSpaceChars,
      coverage: ((nonSpaceChars / totalChars) * 100).toFixed(1)
    };
  }
};

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ASCIIArt;
}
