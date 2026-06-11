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
    },

    // ==========================================
    // CONFIG-DRIVEN MOUNT CONTROLS
    // ==========================================

    /**
     * Mount export control buttons into the sidebar, driven by config.
     * Creates the Export control-group HTML and wires up event listeners.
     *
     * @param {Object} config Page configuration object
     * @param {string[]} config.exports Array of export types: 'svg', 'plotter-svg', 'png', 'gif'
     * @param {Object} [config.handlers] Custom handler functions per export type
     * @param {Function} [config.handlers.svg] Custom SVG export handler
     * @param {Function} [config.handlers.plotterSvg] Custom Plotter SVG handler
     * @param {Function} [config.handlers.png] Custom PNG handler
     * @param {Function} [config.handlers.gif] Custom GIF handler
     * @param {Function} [config.getCanvas] Function returning the canvas element
     * @param {string} [config.algorithmName] Name for exported filenames
     * @param {Element} [config.mountTarget] DOM element to mount into (defaults to #controls)
     * @param {string} [config.insertBefore] CSS selector -- insert export group before this element
     */
    mountControls: function(config = {}) {
      const self = this;
      const exports = config.exports || ['png'];
      const handlers = config.handlers || {};
      const algorithmName = config.algorithmName || self.defaults.filename;
      const getCanvas = config.getCanvas || (() => self.getCanvas());

      // Build button markup
      const cols = exports.length >= 3 ? 'three' : '';
      const buttonMarkup = exports.map(type => {
        const id = `ts-export-${type}`;
        const labels = {
          'svg': 'SVG',
          'plotter-svg': 'Plotter SVG',
          'png': 'PNG',
          'gif': 'GIF'
        };
        return `<button id="${id}" class="secondary">${labels[type] || type.toUpperCase()}</button>`;
      }).join('\n        ');

      const html = `
    <div class="control-group ts-export-controls" data-ts-init="export">
      <h3>Export</h3>
      <div class="button-group ${cols}">
        ${buttonMarkup}
      </div>
    </div>`;

      // Find mount point
      const mountTarget = config.mountTarget || document.getElementById('controls');
      if (!mountTarget) {
        console.warn('[TSExport] No mount target found for export controls');
        return;
      }

      // Don't mount twice
      if (mountTarget.querySelector('[data-ts-init="export"]')) {
        console.log('[TSExport] Export controls already mounted');
        return;
      }

      // Insert before a specific element if specified, otherwise append
      const insertRef = config.insertBefore
        ? mountTarget.querySelector(config.insertBefore)
        : null;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = html.trim();
      const exportGroup = wrapper.firstElementChild;

      if (insertRef) {
        insertRef.parentNode.insertBefore(exportGroup, insertRef);
      } else {
        mountTarget.appendChild(exportGroup);
      }

      // Wire event listeners
      const defaultHandlers = {
        'svg': handlers.svg || (() => {
          const canvas = getCanvas();
          if (canvas) self.canvasToSVG(canvas, algorithmName);
        }),
        'plotter-svg': handlers.plotterSvg || null,
        'png': handlers.png || (() => {
          const canvas = getCanvas();
          if (canvas) self.downloadPNG(canvas, algorithmName, { scale: 2 });
        }),
        'gif': handlers.gif || null,
      };

      exports.forEach(type => {
        const btn = document.getElementById(`ts-export-${type}`);
        const handler = defaultHandlers[type];
        if (btn && handler) {
          btn.addEventListener('click', async () => {
            btn.classList.add('exporting');
            btn.disabled = true;
            try {
              await handler();
            } catch (err) {
              console.error(`[TSExport] ${type} export failed:`, err);
              if (typeof TSToast !== 'undefined') {
                TSToast.show(`${type.toUpperCase()} export failed`, 'error');
              }
            } finally {
              btn.classList.remove('exporting');
              btn.disabled = false;
            }
          });
        } else if (btn && !handler) {
          btn.disabled = true;
          btn.title = `${type} export not configured for this algorithm`;
          btn.style.opacity = '0.4';
        }
      });

      console.log(`[TSExport] Mounted controls: ${exports.join(', ')}`);
    },

    // ==========================================
    // PLOTTER FORMAT EXPORTS (DXF, HPGL, GCODE)
    // ==========================================

    /**
     * Download paths as DXF file (AutoCAD format)
     * @param {Array} paths Array of path objects {points: [{x, y}], color, weight}
     * @param {string} name Base filename
     * @param {Object} options Paper size, units, etc.
     */
    downloadDXF: function(paths, name = this.defaults.filename, options = {}) {
      const opts = {
        unit: 'mm',
        paperWidth: 297,
        paperHeight: 210,
        layerByColor: true,
        ...options
      };

      let dxf = this._createDXFHeader(opts);
      const layers = this._organizeLayers(paths, opts);
      dxf += this._createDXFLayers(layers);
      dxf += this._createDXFEntities(paths, layers, opts);
      dxf += '0\nEOF\n';

      const blob = new Blob([dxf], { type: 'application/dxf' });
      const filename = `${name}-${this.getTimestamp()}.dxf`;
      this.triggerDownload(blob, filename);

      if (typeof TSToast !== 'undefined') {
        TSToast.show('DXF exported!', 'success');
      }

      return true;
    },

    /**
     * Download paths as HPGL file (HP pen plotter format)
     * @param {Array} paths Array of path objects
     * @param {string} name Base filename
     * @param {Object} options Pen speed, force, scaling
     */
    downloadHPGL: function(paths, name = this.defaults.filename, options = {}) {
      const opts = {
        penSpeed: 38,     // cm/s
        penForce: 3,      // 1-8 scale
        scaling: 1.0,
        ...options
      };

      let hpgl = '';
      hpgl += 'IN;';                        // Initialize
      hpgl += 'SP1;';                       // Select pen 1
      hpgl += `VS${opts.penSpeed};`;        // Velocity
      hpgl += `FS${opts.penForce};`;        // Force

      const scale = 40 * opts.scaling;      // 40 units = 1mm in HPGL

      paths.forEach(path => {
        const points = path.points || path;
        if (!Array.isArray(points) || points.length < 2) return;

        // Select pen based on color
        const penNumber = this._colorToPenNumber(path.color) || 1;
        hpgl += `SP${penNumber};`;

        // Move to start (pen up)
        const p0 = points[0];
        const x0 = Math.round((p0.x !== undefined ? p0.x : p0[0]) * scale);
        const y0 = Math.round((p0.y !== undefined ? p0.y : p0[1]) * scale);
        hpgl += `PU${x0},${y0};`;

        // Draw path (pen down)
        hpgl += 'PD';
        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          const x = Math.round((p.x !== undefined ? p.x : p[0]) * scale);
          const y = Math.round((p.y !== undefined ? p.y : p[1]) * scale);
          hpgl += `${x},${y}`;
          if (i < points.length - 1) hpgl += ',';
        }
        hpgl += ';PU;';
      });

      hpgl += 'PU0,0;SP0;';  // Return home, park pen

      const blob = new Blob([hpgl], { type: 'application/hpgl' });
      const filename = `${name}-${this.getTimestamp()}.hpgl`;
      this.triggerDownload(blob, filename);

      if (typeof TSToast !== 'undefined') {
        TSToast.show('HPGL exported!', 'success');
      }

      return true;
    },

    /**
     * Download paths as G-code file (CNC/GRBL plotters)
     * @param {Array} paths Array of path objects
     * @param {string} name Base filename
     * @param {Object} options Feed rate, Z heights, etc.
     */
    downloadGCODE: function(paths, name = this.defaults.filename, options = {}) {
      const opts = {
        feedRate: 3000,       // mm/min
        travelRate: 5000,     // mm/min
        penUp: 5,             // Z height when pen up (mm)
        penDown: 0,           // Z height when pen down (mm)
        safeHeight: 10,       // Z height for safe travel
        pxToMm: 0.264583,     // 96dpi default
        ...options
      };

      let gcode = '';
      gcode += '; Generated by Total Serialism\n';
      gcode += `; ${new Date().toISOString()}\n`;
      gcode += 'G21 ; Set units to mm\n';
      gcode += 'G90 ; Absolute positioning\n';
      gcode += `G0 Z${opts.safeHeight} ; Move to safe height\n`;
      gcode += 'G0 X0 Y0 ; Home XY\n';

      paths.forEach((path, idx) => {
        const points = path.points || path;
        if (!Array.isArray(points) || points.length < 2) return;

        gcode += `; Path ${idx + 1}\n`;

        // Move to start (pen up)
        const p0 = points[0];
        const x0 = ((p0.x !== undefined ? p0.x : p0[0]) * opts.pxToMm).toFixed(3);
        const y0 = ((p0.y !== undefined ? p0.y : p0[1]) * opts.pxToMm).toFixed(3);
        gcode += `G0 Z${opts.penUp} ; Pen up\n`;
        gcode += `G0 X${x0} Y${y0} F${opts.travelRate} ; Move to start\n`;
        gcode += `G1 Z${opts.penDown} F${opts.feedRate} ; Pen down\n`;

        // Draw path
        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          const x = ((p.x !== undefined ? p.x : p[0]) * opts.pxToMm).toFixed(3);
          const y = ((p.y !== undefined ? p.y : p[1]) * opts.pxToMm).toFixed(3);
          gcode += `G1 X${x} Y${y}\n`;
        }
      });

      gcode += `G0 Z${opts.safeHeight} ; Final pen up\n`;
      gcode += 'G0 X0 Y0 ; Return home\n';
      gcode += 'M2 ; End program\n';

      const blob = new Blob([gcode], { type: 'text/plain' });
      const filename = `${name}-${this.getTimestamp()}.gcode`;
      this.triggerDownload(blob, filename);

      if (typeof TSToast !== 'undefined') {
        TSToast.show('G-code exported!', 'success');
      }

      return true;
    },

    // ==========================================
    // PLOTTER FORMAT HELPERS
    // ==========================================

    _createDXFHeader: function(opts) {
      return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n9\n$MEASUREMENT\n70\n1\n0\nENDSEC\n`;
    },

    _createDXFLayers: function(layers) {
      let dxf = `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n${layers.length}\n`;

      layers.forEach(layer => {
        const aci = this._colorToACI(layer.color);
        dxf += `0\nLAYER\n2\n${layer.name}\n70\n0\n62\n${aci}\n6\nCONTINUOUS\n`;
      });

      dxf += `0\nENDTAB\n0\nENDSEC\n`;
      return dxf;
    },

    _createDXFEntities: function(paths, layers, opts) {
      let dxf = `0\nSECTION\n2\nENTITIES\n`;

      paths.forEach(path => {
        const points = path.points || path;
        if (!Array.isArray(points) || points.length < 2) return;

        const layerName = path.color || 'default';

        if (points.length === 2) {
          // LINE entity
          const p1 = points[0], p2 = points[1];
          const x1 = p1.x !== undefined ? p1.x : p1[0];
          const y1 = p1.y !== undefined ? p1.y : p1[1];
          const x2 = p2.x !== undefined ? p2.x : p2[0];
          const y2 = p2.y !== undefined ? p2.y : p2[1];
          dxf += `0\nLINE\n8\n${layerName}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
        } else {
          // LWPOLYLINE entity
          dxf += `0\nLWPOLYLINE\n8\n${layerName}\n90\n${points.length}\n70\n0\n`;
          points.forEach(p => {
            const x = p.x !== undefined ? p.x : p[0];
            const y = p.y !== undefined ? p.y : p[1];
            dxf += `10\n${x}\n20\n${y}\n`;
          });
        }
      });

      dxf += `0\nENDSEC\n`;
      return dxf;
    },

    _organizeLayers: function(paths, opts) {
      const layerMap = new Map();

      paths.forEach(path => {
        const layerKey = path.color || 'default';
        if (!layerMap.has(layerKey)) {
          layerMap.set(layerKey, {
            name: layerKey,
            color: path.color || '#000000'
          });
        }
      });

      return Array.from(layerMap.values());
    },

    _colorToACI: function(color) {
      if (!color) return 7;
      const map = {
        '#ff0000': 1, '#ffff00': 2, '#00ff00': 3, '#00ffff': 4,
        '#0000ff': 5, '#ff00ff': 6, '#ffffff': 7, '#000000': 7
      };
      return map[color.toLowerCase()] || 7;
    },

    _colorToPenNumber: function(color) {
      if (!color) return 1;
      const map = {
        '#000000': 1, '#ff0000': 2, '#0000ff': 3, '#00ff00': 4,
        '#ffff00': 5, '#ff00ff': 6, '#00ffff': 7, '#ffffff': 8
      };
      return map[color.toLowerCase()] || 1;
    },

    // ==========================================
    // PATH OPTIMIZATION (Pen Plotter)
    // ==========================================

    /**
     * Optimize paths for pen plotting using PathOptimizer.
     * Reorders paths to minimize pen travel, merges nearby endpoints,
     * removes short paths, and simplifies geometry.
     *
     * Requires shared/path-optimizer.js to be loaded.
     * Falls back gracefully (returns original paths) if not available.
     *
     * @param {Array} paths Array of paths. Each path is an array of points [{x,y}] or [[x,y]]
     * @param {Object} options Optimization options
     * @param {number} options.mergeThreshold Distance threshold for merging endpoints (default: 2)
     * @param {number} options.minPathLength Minimum path length to keep (default: 3)
     * @param {number} options.simplifyTolerance Douglas-Peucker tolerance (default: 0.5)
     * @param {boolean} options.reorder Whether to reorder paths via TSP (default: true)
     * @param {boolean} options.merge Whether to merge nearby endpoints (default: true)
     * @param {boolean} options.simplify Whether to simplify paths (default: false)
     * @returns {Object} { paths: optimizedPaths, report: { original, optimized, reduction, travelSaved } }
     */
    optimizePaths: function(paths, options = {}) {
      if (!paths || paths.length === 0) {
        return { paths: [], report: null };
      }

      // Check if PathOptimizer is available
      if (typeof PathOptimizer === 'undefined') {
        console.warn('[TSExport] PathOptimizer not loaded. Include shared/path-optimizer.js for optimization.');
        return { paths: paths, report: null };
      }

      const opts = {
        mergeThreshold: options.mergeThreshold || 2,
        minPathLength: options.minPathLength || 3,
        simplifyTolerance: options.simplifyTolerance || 0.5,
        reorder: options.reorder !== false,
        merge: options.merge !== false,
        simplify: options.simplify || false,
        ...options
      };

      try {
        const optimizer = new PathOptimizer();

        // Normalize paths to [{x,y}] format for the optimizer
        const normalized = paths.map(path => {
          if (!Array.isArray(path)) return path;
          return path.map(p => {
            if (Array.isArray(p)) return { x: p[0], y: p[1] };
            return p;
          });
        });

        let result = normalized;

        if (opts.merge) {
          result = optimizer.mergeNearbyEndpoints(result, opts.mergeThreshold);
        }
        if (opts.reorder) {
          result = optimizer.optimizePathOrder(result);
          result = optimizer.twoOptOptimize(result, 100);
        }
        if (opts.simplify) {
          result = result.map(path => optimizer.simplifyPath(path, opts.simplifyTolerance));
        }

        result = optimizer.removeShortPaths(result, opts.minPathLength);

        const report = optimizer.generateReport(normalized, result);
        console.log(`[TSExport] Optimization: ${normalized.length} → ${result.length} paths (${report.pathReduction || 'N/A'}% reduction)`);

        return { paths: result, report: report };
      } catch (e) {
        console.error('[TSExport] Optimization failed, using original paths:', e);
        return { paths: paths, report: null };
      }
    },

    /**
     * Create an optimized SVG for pen plotting.
     * Runs path optimization then serializes to SVG.
     *
     * @param {Array} paths Array of paths (arrays of points)
     * @param {number} width SVG width
     * @param {number} height SVG height
     * @param {Object} options Includes optimization options + SVG options
     * @param {string} options.strokeColor Stroke color (default: '#000000')
     * @param {number} options.strokeWidth Stroke width (default: 1)
     * @param {string} options.backgroundColor Background fill (default: 'white')
     * @param {boolean} options.optimize Whether to optimize (default: true)
     * @returns {Object} { svg: svgString, report: optimizationReport }
     */
    createOptimizedSVG: function(paths, width, height, options = {}) {
      const shouldOptimize = options.optimize !== false;

      let finalPaths = paths;
      let report = null;

      if (shouldOptimize) {
        const result = this.optimizePaths(paths, options);
        finalPaths = result.paths;
        report = result.report;
      }

      // Convert to SVG path data
      const svgPaths = finalPaths.map(path => {
        const d = this.pointsToPath(path);
        return { d: d };
      }).filter(p => p.d);

      const svg = this.createSVG(svgPaths, width, height, {
        backgroundColor: options.backgroundColor || 'white',
        strokeColor: options.strokeColor || '#000000',
        strokeWidth: options.strokeWidth || 1
      });

      return { svg: svg, report: report };
    },

    /**
     * Reorder an array of elements using nearest-neighbor to minimize pen travel.
     * Works with any element type - just needs a function to extract position.
     *
     * @param {Array} elements Array of elements to reorder
     * @param {Function} getStart Function(element) returning {x, y} start position
     * @param {Function} getEnd Function(element) returning {x, y} end position (optional, defaults to getStart)
     * @returns {Array} Reordered copy of the elements array
     */
    reorderElements: function(elements, getStart, getEnd) {
      if (!elements || elements.length <= 1) return elements.slice();

      getEnd = getEnd || getStart;
      const remaining = new Set(elements.map((_, i) => i));
      const result = [];

      // Start with element nearest to origin
      let bestIdx = 0;
      let bestDist = Infinity;
      for (const idx of remaining) {
        const pos = getStart(elements[idx]);
        const d = pos.x * pos.x + pos.y * pos.y;
        if (d < bestDist) { bestDist = d; bestIdx = idx; }
      }

      remaining.delete(bestIdx);
      result.push(elements[bestIdx]);
      let currentEnd = getEnd(elements[bestIdx]);

      while (remaining.size > 0) {
        let nearestIdx = -1;
        let nearestDist = Infinity;

        for (const idx of remaining) {
          const pos = getStart(elements[idx]);
          const dx = pos.x - currentEnd.x;
          const dy = pos.y - currentEnd.y;
          const d = dx * dx + dy * dy;
          if (d < nearestDist) { nearestDist = d; nearestIdx = idx; }
        }

        remaining.delete(nearestIdx);
        result.push(elements[nearestIdx]);
        currentEnd = getEnd(elements[nearestIdx]);
      }

      console.log(`[TSExport] Reordered ${elements.length} elements for plotter`);
      return result;
    }
  };

  // Export to global scope
  global.TSExport = TSExport;

})(typeof window !== 'undefined' ? window : this);
