/**
 * Dithering Library for Total Serialism
 *
 * Image dithering algorithms optimized for pen plotting.
 * Converts grayscale/color images to binary black/white patterns
 * that can be plotted as dots, lines, or stipples.
 *
 * Algorithms:
 * - Floyd-Steinberg: Classic error diffusion
 * - Atkinson: Mac 1984 aesthetic (3/4 error diffusion)
 * - Bayer: Ordered dithering (Game Boy style)
 * - Sierra: Fast error diffusion
 *
 * Usage:
 *   const dithered = Dithering.floydSteinberg(img);
 *   const svg = Dithering.toSVG(dithered, 'dots');
 */

const Dithering = {
  /**
   * Floyd-Steinberg error diffusion dithering
   * The classic algorithm - distributes error to 4 neighbors
   *
   * @param {p5.Image} img - Source image
   * @param {Object} options - Dithering options
   * @returns {p5.Image} - Dithered image
   */
  floydSteinberg: function(img, options = {}) {
    const threshold = options.threshold || 128;
    const result = img.get();
    result.loadPixels();

    for (let y = 0; y < result.height; y++) {
      for (let x = 0; x < result.width; x++) {
        const idx = (x + y * result.width) * 4;

        // Get current pixel brightness
        const oldPixel = result.pixels[idx];

        // Quantize to black or white
        const newPixel = oldPixel < threshold ? 0 : 255;
        result.pixels[idx] = newPixel;
        result.pixels[idx + 1] = newPixel;
        result.pixels[idx + 2] = newPixel;

        // Calculate error
        const err = oldPixel - newPixel;

        // Distribute error to neighbors (Floyd-Steinberg matrix)
        this._addError(result, x + 1, y, err * 7 / 16);
        this._addError(result, x - 1, y + 1, err * 3 / 16);
        this._addError(result, x, y + 1, err * 5 / 16);
        this._addError(result, x + 1, y + 1, err * 1 / 16);
      }
    }

    result.updatePixels();
    return result;
  },

  /**
   * Atkinson dithering - the classic Mac look
   * Only distributes 3/4 of error (6 neighbors, 1/8 each)
   * Creates brighter, higher contrast images
   *
   * @param {p5.Image} img - Source image
   * @param {Object} options - Dithering options
   * @returns {p5.Image} - Dithered image
   */
  atkinson: function(img, options = {}) {
    const threshold = options.threshold || 128;
    const result = img.get();
    result.loadPixels();

    for (let y = 0; y < result.height; y++) {
      for (let x = 0; x < result.width; x++) {
        const idx = (x + y * result.width) * 4;
        const oldPixel = result.pixels[idx];
        const newPixel = oldPixel < threshold ? 0 : 255;

        result.pixels[idx] = newPixel;
        result.pixels[idx + 1] = newPixel;
        result.pixels[idx + 2] = newPixel;

        const err = oldPixel - newPixel;

        // Atkinson matrix: 6 neighbors, 1/8 each
        this._addError(result, x + 1, y, err / 8);
        this._addError(result, x + 2, y, err / 8);
        this._addError(result, x - 1, y + 1, err / 8);
        this._addError(result, x, y + 1, err / 8);
        this._addError(result, x + 1, y + 1, err / 8);
        this._addError(result, x, y + 2, err / 8);
      }
    }

    result.updatePixels();
    return result;
  },

  /**
   * Bayer ordered dithering - the "Game Boy" look
   * Uses a threshold matrix instead of error diffusion
   * Fast and creates characteristic crosshatch patterns
   *
   * @param {p5.Image} img - Source image
   * @param {Object} options - Dithering options
   * @returns {p5.Image} - Dithered image
   */
  bayer: function(img, options = {}) {
    const matrixSize = options.matrixSize || 4;
    const result = img.get();
    result.loadPixels();

    // Bayer matrices
    const matrices = {
      2: [[0, 2], [3, 1]],
      4: [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
      ],
      8: [
        [0, 32, 8, 40, 2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44, 4, 36, 14, 46, 6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3, 35, 11, 43, 1, 33, 9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47, 7, 39, 13, 45, 5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
      ]
    };

    const matrix = matrices[matrixSize] || matrices[4];
    const factor = 256 / (matrixSize * matrixSize);

    for (let y = 0; y < result.height; y++) {
      for (let x = 0; x < result.width; x++) {
        const idx = (x + y * result.width) * 4;
        const pixel = result.pixels[idx];

        const threshold = matrix[x % matrixSize][y % matrixSize] * factor;
        const newPixel = pixel > threshold ? 255 : 0;

        result.pixels[idx] = newPixel;
        result.pixels[idx + 1] = newPixel;
        result.pixels[idx + 2] = newPixel;
      }
    }

    result.updatePixels();
    return result;
  },

  /**
   * Sierra dithering - faster alternative to Floyd-Steinberg
   * Distributes error to more neighbors but with simpler fractions
   *
   * @param {p5.Image} img - Source image
   * @param {Object} options - Dithering options
   * @returns {p5.Image} - Dithered image
   */
  sierra: function(img, options = {}) {
    const threshold = options.threshold || 128;
    const result = img.get();
    result.loadPixels();

    for (let y = 0; y < result.height; y++) {
      for (let x = 0; x < result.width; x++) {
        const idx = (x + y * result.width) * 4;
        const oldPixel = result.pixels[idx];
        const newPixel = oldPixel < threshold ? 0 : 255;

        result.pixels[idx] = newPixel;
        result.pixels[idx + 1] = newPixel;
        result.pixels[idx + 2] = newPixel;

        const err = oldPixel - newPixel;

        // Sierra matrix (simplified)
        this._addError(result, x + 1, y, err * 5 / 32);
        this._addError(result, x + 2, y, err * 3 / 32);
        this._addError(result, x - 2, y + 1, err * 2 / 32);
        this._addError(result, x - 1, y + 1, err * 4 / 32);
        this._addError(result, x, y + 1, err * 5 / 32);
        this._addError(result, x + 1, y + 1, err * 4 / 32);
        this._addError(result, x + 2, y + 1, err * 2 / 32);
        this._addError(result, x - 1, y + 2, err * 2 / 32);
        this._addError(result, x, y + 2, err * 3 / 32);
        this._addError(result, x + 1, y + 2, err * 2 / 32);
      }
    }

    result.updatePixels();
    return result;
  },

  /**
   * Helper: Add error to a pixel
   */
  _addError: function(img, x, y, err) {
    if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;

    const idx = (x + y * img.width) * 4;
    img.pixels[idx] = Math.max(0, Math.min(255, img.pixels[idx] + err));
    img.pixels[idx + 1] = Math.max(0, Math.min(255, img.pixels[idx + 1] + err));
    img.pixels[idx + 2] = Math.max(0, Math.min(255, img.pixels[idx + 2] + err));
  },

  /**
   * Convert dithered image to SVG for pen plotting
   *
   * @param {p5.Image} dithered - Dithered image
   * @param {string} mode - Output mode: 'dots', 'lines', 'stipple'
   * @param {Object} options - SVG options
   * @returns {string} - SVG string
   */
  toSVG: function(dithered, mode = 'dots', options = {}) {
    const dotSize = options.dotSize || 2;
    const lineThickness = options.lineThickness || 1;
    const spacing = options.spacing || 1;

    dithered.loadPixels();

    const elements = [];

    switch (mode) {
      case 'dots':
        // Draw circle at each black pixel
        for (let y = 0; y < dithered.height; y += spacing) {
          for (let x = 0; x < dithered.width; x += spacing) {
            const idx = (x + y * dithered.width) * 4;
            if (dithered.pixels[idx] < 128) {
              elements.push(`<circle cx="${x}" cy="${y}" r="${dotSize * 0.5}"/>`);
            }
          }
        }
        break;

      case 'lines':
        // Draw horizontal lines for continuous black regions
        for (let y = 0; y < dithered.height; y += spacing) {
          let lineStart = null;
          for (let x = 0; x <= dithered.width; x++) {
            const idx = (x + y * dithered.width) * 4;
            const isBlack = x < dithered.width && dithered.pixels[idx] < 128;

            if (isBlack && lineStart === null) {
              lineStart = x;
            } else if (!isBlack && lineStart !== null) {
              elements.push(`<line x1="${lineStart}" y1="${y}" x2="${x}" y2="${y}" stroke-width="${lineThickness}"/>`);
              lineStart = null;
            }
          }
        }
        break;

      case 'stipple':
        // Random stipple placement based on density
        for (let y = 0; y < dithered.height; y += spacing * 2) {
          for (let x = 0; x < dithered.width; x += spacing * 2) {
            const idx = (x + y * dithered.width) * 4;
            if (dithered.pixels[idx] < 128) {
              const rx = x + (Math.random() - 0.5) * spacing;
              const ry = y + (Math.random() - 0.5) * spacing;
              elements.push(`<circle cx="${rx}" cy="${ry}" r="${dotSize * 0.5}"/>`);
            }
          }
        }
        break;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${dithered.width}"
     height="${dithered.height}"
     viewBox="0 0 ${dithered.width} ${dithered.height}">
  <g fill="black" stroke="black">
    ${elements.join('\n    ')}
  </g>
</svg>`;
  },

  /**
   * Get statistics about dithered image
   */
  getStats: function(dithered) {
    dithered.loadPixels();
    let blackPixels = 0;
    let whitePixels = 0;

    for (let i = 0; i < dithered.pixels.length; i += 4) {
      if (dithered.pixels[i] < 128) {
        blackPixels++;
      } else {
        whitePixels++;
      }
    }

    const total = blackPixels + whitePixels;

    return {
      blackPixels,
      whitePixels,
      blackPercent: (blackPixels / total * 100).toFixed(1),
      whitePercent: (whitePixels / total * 100).toFixed(1),
      totalPixels: total
    };
  }
};

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dithering;
}
