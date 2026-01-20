/**
 * Total Serialism - GIF Exporter
 * Frame-by-frame GIF recording utility
 *
 * Requires gif.js: https://github.com/jnordberg/gif.js
 * Add before this script:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js"></script>
 *
 * Usage:
 *   const exporter = new GifExporter({ fps: 30, duration: 3 });
 *   exporter.init(canvas, { onProgress, onFinish });
 *   exporter.start();
 *   // In draw loop: exporter.captureFrame();
 *   exporter.stop(); // Finalizes and downloads
 */

(function(global) {
  'use strict';

  class GifExporter {
    /**
     * @param {Object} options
     * @param {number} options.fps - Frames per second (default: 30)
     * @param {number} options.duration - Duration in seconds (default: 3)
     * @param {number} options.quality - 1-30, lower = better (default: 10)
     * @param {number} options.width - Canvas width (auto-detected if not set)
     * @param {number} options.height - Canvas height (auto-detected if not set)
     * @param {string} options.workerScript - gif.js worker URL
     */
    constructor(options = {}) {
      this.fps = options.fps || 30;
      this.duration = options.duration || 3;
      this.quality = options.quality || 10;
      this.width = options.width || null;
      this.height = options.height || null;
      this.workerScript = options.workerScript ||
        'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';

      this.canvas = null;
      this.gif = null;
      this.recording = false;
      this.frames = [];
      this.capturedFrames = 0;
      this.totalFrames = 0;

      this.onProgress = null;
      this.onFinish = null;
    }

    /**
     * Initialize with canvas and callbacks
     * @param {HTMLCanvasElement} canvas
     * @param {Object} callbacks
     */
    init(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.width = this.width || canvas.width;
      this.height = this.height || canvas.height;
      this.totalFrames = Math.ceil(this.fps * this.duration);

      this.onProgress = callbacks.onProgress || (() => {});
      this.onFinish = callbacks.onFinish || (() => {});

      // Check for gif.js
      if (typeof GIF === 'undefined') {
        console.warn('[GifExporter] gif.js not loaded. Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js"></script>');
      }
    }

    /**
     * Check if currently recording
     * @returns {boolean}
     */
    isRecording() {
      return this.recording;
    }

    /**
     * Start recording
     */
    start() {
      if (typeof GIF === 'undefined') {
        console.error('[GifExporter] gif.js library not loaded');
        if (typeof TSToast !== 'undefined') {
          TSToast.show('GIF export requires gif.js library', 'error');
        }
        return;
      }

      this.recording = true;
      this.frames = [];
      this.capturedFrames = 0;

      this.gif = new GIF({
        workers: 4,
        quality: this.quality,
        width: this.width,
        height: this.height,
        workerScript: this.workerScript
      });

      this.onProgress({
        phase: 'recording',
        capturedFrames: 0,
        totalFrames: this.totalFrames,
        progress: 0
      });

      console.log(`[GifExporter] Recording started (${this.totalFrames} frames @ ${this.fps}fps)`);
    }

    /**
     * Capture current canvas frame
     */
    captureFrame() {
      if (!this.recording || !this.gif) return;

      if (this.capturedFrames >= this.totalFrames) {
        this.stop();
        return;
      }

      // Create a copy of the canvas content
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = this.width;
      frameCanvas.height = this.height;
      const ctx = frameCanvas.getContext('2d');
      ctx.drawImage(this.canvas, 0, 0, this.width, this.height);

      this.gif.addFrame(frameCanvas, { delay: 1000 / this.fps, copy: true });
      this.capturedFrames++;

      this.onProgress({
        phase: 'recording',
        capturedFrames: this.capturedFrames,
        totalFrames: this.totalFrames,
        progress: this.capturedFrames / this.totalFrames
      });
    }

    /**
     * Stop recording and render GIF
     */
    stop() {
      if (!this.gif) return;

      this.recording = false;

      console.log(`[GifExporter] Recording stopped. Rendering ${this.capturedFrames} frames...`);

      this.onProgress({
        phase: 'rendering',
        capturedFrames: this.capturedFrames,
        totalFrames: this.totalFrames,
        progress: 0
      });

      this.gif.on('progress', (p) => {
        this.onProgress({
          phase: 'rendering',
          capturedFrames: this.capturedFrames,
          totalFrames: this.totalFrames,
          progress: p
        });
      });

      this.gif.on('finished', (blob) => {
        // Download the GIF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `animation-${timestamp}.gif`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        console.log(`[GifExporter] GIF exported: ${filename}`);

        if (typeof TSToast !== 'undefined') {
          TSToast.show('GIF exported!', 'success');
        }

        this.onFinish({
          blob: blob,
          frames: this.capturedFrames,
          filename: filename
        });

        this.gif = null;
      });

      this.gif.render();
    }

    /**
     * Cancel recording without rendering
     */
    cancel() {
      this.recording = false;
      this.gif = null;
      this.frames = [];
      this.capturedFrames = 0;
      console.log('[GifExporter] Recording cancelled');
    }
  }

  // Export to global scope
  global.GifExporter = GifExporter;

})(typeof window !== 'undefined' ? window : this);
