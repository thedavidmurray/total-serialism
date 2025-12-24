/**
 * Total Serialism - Export Utilities
 * Consolidated export functions for SVG, PNG, and GIF
 *
 * Usage:
 *   <script src="../../shared/export-utils.js"></script>
 *   <script>
 *     // For p5.js canvas
 *     TSExport.downloadSVG(svgContent, 'my-algorithm');
 *     TSExport.downloadPNG(canvas, 'my-algorithm');
 *     TSExport.downloadGIF(frames, 'my-algorithm', { fps: 30 });
 *   </script>
 */

(function(global) {
  'use strict';

  const TSExport = {
    // Default settings
    defaults: {
      filename: 'total-serialism',
      pngScale: 2,       // 2x resolution for crisp exports
      gifFps: 30,
      gifQuality: 10,    // 1-30, lower = better quality
      gifWorkers: 4
    },

    /**
     * Generate timestamp for filenames
     * @returns {string} Timestamp string (YYYYMMDD-HHMMSS)
     */
    getTimestamp: function() {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    },

    /**
     * Trigger file download
     * @param {Blob|string} data Blob or data URL
     * @param {string} filename
     * @param {string} mimeType
     */
    triggerDownload: function(data, filename, mimeType = 'application/octet-stream') {
      const link = document.createElement('a');

      if (data instanceof Blob) {
        link.href = URL.createObjectURL(data);
      } else {
        link.href = data;
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (data instanceof Blob) {
        URL.revokeObjectURL(link.href);
      }
    },

    // ==========================================
    // SVG EXPORT
    // ==========================================

    /**
     * Download SVG content as file
     * @param {string|SVGElement} svg SVG string or element
     * @param {string} name Base filename (without extension)
     */
    downloadSVG: function(svg, name = this.defaults.filename) {
      let svgString;

      if (typeof svg === 'string') {
        svgString = svg;
      } else if (svg instanceof SVGElement) {
        svgString = new XMLSerializer().serializeToString(svg);
      } else {
        console.error('[TSExport] Invalid SVG input');
        return false;
      }

      // Ensure XML declaration
      if (!svgString.startsWith('<?xml')) {
        svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const filename = `${name}-${this.getTimestamp()}.svg`;

      this.triggerDownload(blob, filename);

      if (typeof TSToast !== 'undefined') {
        TSToast.show('SVG exported!', 'success');
      }

      return true;
    },

    /**
     * Convert canvas to SVG (basic rasterized approach)
     * For true vector SVG, algorithms should generate SVG paths directly
     * @param {HTMLCanvasElement} canvas
     * @param {string} name
     */
    canvasToSVG: function(canvas, name = this.defaults.filename) {
      const width = canvas.width;
      const height = canvas.height;
      const dataUrl = canvas.toDataURL('image/png');

      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;

      return this.downloadSVG(svgString, name);
    },

    /**
     * Create SVG from path data
     * @param {Array} paths Array of path objects [{d: 'M...', stroke: '#000', strokeWidth: 1, fill: 'none'}]
     * @param {number} width
     * @param {number} height
     * @param {Object} options Background color, etc.
     * @returns {string} SVG string
     */
    createSVG: function(paths, width, height, options = {}) {
      const bgColor = options.backgroundColor || 'white';
      const strokeColor = options.strokeColor || '#000000';
      const strokeWidth = options.strokeWidth || 1;

      let pathsMarkup = '';
      paths.forEach(path => {
        const d = path.d || path;
        const stroke = path.stroke || strokeColor;
        const sw = path.strokeWidth || strokeWidth;
        const fill = path.fill || 'none';

        pathsMarkup += `  <path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
      });

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
${pathsMarkup}</svg>`;
    },

    /**
     * Convert points array to SVG path
     * @param {Array} points Array of [x, y] or {x, y}
     * @param {boolean} closed Whether to close the path
     * @returns {string} SVG path d attribute
     */
    pointsToPath: function(points, closed = false) {
      if (!points || points.length < 2) return '';

      const getCoord = (p) => Array.isArray(p) ? p : [p.x, p.y];
      const first = getCoord(points[0]);

      let d = `M ${first[0]} ${first[1]}`;

      for (let i = 1; i < points.length; i++) {
        const [x, y] = getCoord(points[i]);
        d += ` L ${x} ${y}`;
      }

      if (closed) {
        d += ' Z';
      }

      return d;
    },

    // ==========================================
    // PNG EXPORT
    // ==========================================

    /**
     * Download canvas as PNG
     * @param {HTMLCanvasElement} canvas
     * @param {string} name Base filename
     * @param {Object} options Scale, etc.
     */
    downloadPNG: function(canvas, name = this.defaults.filename, options = {}) {
      const scale = options.scale || this.defaults.pngScale;

      let exportCanvas = canvas;

      // Scale up if needed
      if (scale !== 1) {
        exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scale;
        exportCanvas.height = canvas.height * scale;

        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scale, scale);
        ctx.drawImage(canvas, 0, 0);
      }

      exportCanvas.toBlob((blob) => {
        if (!blob) {
          console.error('[TSExport] Failed to create PNG blob');
          return;
        }

        const filename = `${name}-${this.getTimestamp()}.png`;
        this.triggerDownload(blob, filename);

        if (typeof TSToast !== 'undefined') {
          TSToast.show('PNG exported!', 'success');
        }
      }, 'image/png');

      return true;
    },

    /**
     * Get canvas from p5.js instance or default canvas
     * @param {Object} p5Instance Optional p5 instance
     * @returns {HTMLCanvasElement}
     */
    getCanvas: function(p5Instance) {
      if (p5Instance && p5Instance.canvas) {
        return p5Instance.canvas;
      }

      // Try to find p5 default canvas
      const defaultCanvas = document.querySelector('#defaultCanvas0');
      if (defaultCanvas) return defaultCanvas;

      // Try any canvas in container
      const containerCanvas = document.querySelector('#canvas-container canvas');
      if (containerCanvas) return containerCanvas;

      // Last resort: any canvas
      return document.querySelector('canvas');
    },

    // ==========================================
    // GIF EXPORT
    // ==========================================

    /**
     * Export animation as GIF
     * Requires gif.js library: https://github.com/jnordberg/gif.js
     *
     * @param {Array} frames Array of canvas elements or image data
     * @param {string} name Base filename
     * @param {Object} options fps, quality, workers, width, height
     * @returns {Promise}
     */
    downloadGIF: function(frames, name = this.defaults.filename, options = {}) {
      return new Promise((resolve, reject) => {
        // Check if gif.js is loaded
        if (typeof GIF === 'undefined') {
          const error = 'gif.js library not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>';
          console.error('[TSExport]', error);

          if (typeof TSToast !== 'undefined') {
            TSToast.show('GIF export requires gif.js library', 'error');
          }

          reject(new Error(error));
          return;
        }

        if (!frames || frames.length === 0) {
          reject(new Error('No frames provided'));
          return;
        }

        const fps = options.fps || this.defaults.gifFps;
        const quality = options.quality || this.defaults.gifQuality;
        const workers = options.workers || this.defaults.gifWorkers;

        // Get dimensions from first frame
        const firstFrame = frames[0];
        const width = options.width || firstFrame.width;
        const height = options.height || firstFrame.height;

        // Show progress
        if (typeof TSToast !== 'undefined') {
          TSToast.show('Creating GIF...', 'info', 30000);
        }

        const gif = new GIF({
          workers: workers,
          quality: quality,
          width: width,
          height: height,
          workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
        });

        // Add frames
        const delay = 1000 / fps;
        frames.forEach(frame => {
          gif.addFrame(frame, { delay: delay, copy: true });
        });

        // Handle completion
        gif.on('finished', (blob) => {
          const filename = `${name}-${this.getTimestamp()}.gif`;
          this.triggerDownload(blob, filename);

          if (typeof TSToast !== 'undefined') {
            TSToast.show('GIF exported!', 'success');
          }

          resolve(blob);
        });

        // Handle progress
        gif.on('progress', (p) => {
          const percent = Math.round(p * 100);
          console.log(`[TSExport] GIF progress: ${percent}%`);
        });

        // Start rendering
        gif.render();
      });
    },

    /**
     * Capture frames from animation for GIF export
     * @param {Function} drawFrame Function that draws a single frame, receives (frameIndex, totalFrames)
     * @param {number} totalFrames Number of frames to capture
     * @param {number} width Canvas width
     * @param {number} height Canvas height
     * @returns {Array} Array of canvas elements
     */
    captureFrames: function(drawFrame, totalFrames, width, height) {
      const frames = [];

      for (let i = 0; i < totalFrames; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        drawFrame(ctx, i, totalFrames);

        frames.push(canvas);
      }

      return frames;
    },

    // ==========================================
    // BUTTON SETUP
    // ==========================================

    /**
     * Set up export buttons with event listeners
     * @param {Object} handlers Object with svg, png, gif handler functions
     */
    setupButtons: function(handlers = {}) {
      const btnSVG = document.getElementById('exportSVG') || document.querySelector('[data-export="svg"]');
      const btnPNG = document.getElementById('exportPNG') || document.querySelector('[data-export="png"]');
      const btnGIF = document.getElementById('exportGIF') || document.querySelector('[data-export="gif"]');

      if (btnSVG && handlers.svg) {
        btnSVG.addEventListener('click', async () => {
          btnSVG.classList.add('exporting');
          try {
            await handlers.svg();
          } finally {
            btnSVG.classList.remove('exporting');
          }
        });
      }

      if (btnPNG && handlers.png) {
        btnPNG.addEventListener('click', async () => {
          btnPNG.classList.add('exporting');
          try {
            await handlers.png();
          } finally {
            btnPNG.classList.remove('exporting');
          }
        });
      }

      if (btnGIF && handlers.gif) {
        btnGIF.addEventListener('click', async () => {
          btnGIF.classList.add('exporting');
          try {
            await handlers.gif();
          } finally {
            btnGIF.classList.remove('exporting');
          }
        });
      }

      console.log('[TSExport] Buttons configured');
    },

    /**
     * Quick setup for algorithms that just need canvas export
     * @param {string} algorithmName Name for exported files
     * @param {Object} options Custom SVG generator, etc.
     */
    quickSetup: function(algorithmName, options = {}) {
      const self = this;

      this.setupButtons({
        svg: () => {
          if (options.getSVG) {
            // Algorithm provides custom SVG
            const svg = options.getSVG();
            self.downloadSVG(svg, algorithmName);
          } else {
            // Fall back to rasterized SVG
            const canvas = self.getCanvas();
            if (canvas) {
              self.canvasToSVG(canvas, algorithmName);
            }
          }
        },

        png: () => {
          const canvas = self.getCanvas();
          if (canvas) {
            self.downloadPNG(canvas, algorithmName, { scale: options.pngScale || 2 });
          }
        },

        gif: options.getGIF ? async () => {
          const { frames, fps } = await options.getGIF();
          await self.downloadGIF(frames, algorithmName, { fps });
        } : null
      });
    }
  };

  // Export to global scope
  global.TSExport = TSExport;

})(typeof window !== 'undefined' ? window : this);
