/**
 * GIF Exporter Utility for p5.js and canvas-sketch
 * Easy-to-integrate GIF recording for generative art
 */

class GifExporter {
  constructor(options = {}) {
    // Default options
    this.options = {
      fps: options.fps || 30,
      quality: options.quality || 10, // Lower is better (1-20)
      width: options.width || 600,
      height: options.height || 600,
      duration: options.duration || 3, // seconds
      workers: options.workers || 4,
      workerScript: options.workerScript || 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
      transparent: options.transparent || false,
      background: options.background || '#FFFFFF',
      dither: options.dither || false,
      debug: options.debug || false,
      ...options
    };

    this.gif = null;
    this.recording = false;
    this.frameCount = 0;
    this.startTime = null;
    this.canvas = null;
    this.progressCallback = null;
    this.completeCallback = null;
    this.frameInterval = null;
    this.capturedFrames = 0;
    
    // Calculate total frames based on duration and fps
    this.totalFrames = Math.floor(this.options.duration * this.options.fps);
  }

  /**
   * Initialize the GIF recorder
   * @param {HTMLCanvasElement} canvas - The canvas to record from
   * @param {Object} callbacks - Optional callbacks for progress and completion
   */
  init(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.progressCallback = callbacks.onProgress || null;
    this.completeCallback = callbacks.onComplete || null;

    // Create new GIF instance
    this.gif = new GIF({
      workers: this.options.workers,
      quality: this.options.quality,
      width: this.options.width,
      height: this.options.height,
      workerScript: this.options.workerScript,
      transparent: this.options.transparent ? 0x000000 : null,
      background: this.options.background,
      dither: this.options.dither,
      debug: this.options.debug
    });

    // Set up event listeners
    this.gif.on('progress', (progress) => {
      if (this.progressCallback) {
        this.progressCallback({
          rendering: true,
          progress: progress,
          phase: 'encoding',
          capturedFrames: this.capturedFrames,
          totalFrames: this.totalFrames
        });
      }
    });

    this.gif.on('finished', (blob) => {
      this.recording = false;
      const url = URL.createObjectURL(blob);
      
      if (this.completeCallback) {
        this.completeCallback({
          blob: blob,
          url: url,
          frames: this.capturedFrames,
          duration: this.options.duration,
          size: blob.size
        });
      }
      
      // Auto-download if specified
      if (this.options.autoDownload) {
        this.download(blob, this.options.filename || `recording-${Date.now()}.gif`);
      }
    });
  }

  /**
   * Start recording frames
   */
  start() {
    if (this.recording) return;
    
    this.recording = true;
    this.frameCount = 0;
    this.capturedFrames = 0;
    this.startTime = performance.now();
    
    // Clear any existing GIF data
    this.gif = new GIF({
      workers: this.options.workers,
      quality: this.options.quality,
      width: this.options.width,
      height: this.options.height,
      workerScript: this.options.workerScript,
      transparent: this.options.transparent ? 0x000000 : null,
      background: this.options.background,
      dither: this.options.dither,
      debug: this.options.debug
    });

    // Re-setup event listeners
    this.gif.on('progress', (progress) => {
      if (this.progressCallback) {
        this.progressCallback({
          rendering: true,
          progress: progress,
          phase: 'encoding',
          capturedFrames: this.capturedFrames,
          totalFrames: this.totalFrames
        });
      }
    });

    this.gif.on('finished', (blob) => {
      this.recording = false;
      const url = URL.createObjectURL(blob);
      
      if (this.completeCallback) {
        this.completeCallback({
          blob: blob,
          url: url,
          frames: this.capturedFrames,
          duration: this.options.duration,
          size: blob.size
        });
      }
      
      if (this.options.autoDownload) {
        this.download(blob, this.options.filename || `recording-${Date.now()}.gif`);
      }
    });

    // Start frame capture interval
    const frameDelay = 1000 / this.options.fps;
    this.frameInterval = setInterval(() => {
      if (!this.recording) {
        clearInterval(this.frameInterval);
        return;
      }
      
      this.captureFrame();
      
      // Check if we've captured enough frames
      if (this.capturedFrames >= this.totalFrames) {
        this.stop();
      }
    }, frameDelay);

    // Capture first frame immediately
    this.captureFrame();
  }

  /**
   * Stop recording and process the GIF
   */
  stop() {
    if (!this.recording) return;
    
    this.recording = false;
    clearInterval(this.frameInterval);
    
    if (this.progressCallback) {
      this.progressCallback({
        rendering: true,
        progress: 0,
        phase: 'processing',
        capturedFrames: this.capturedFrames,
        totalFrames: this.totalFrames
      });
    }
    
    // Render the GIF
    this.gif.render();
  }

  /**
   * Capture a single frame
   */
  captureFrame() {
    if (!this.canvas || !this.recording) return;
    
    try {
      // Create a copy of the canvas at the desired size
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.options.width;
      tempCanvas.height = this.options.height;
      const ctx = tempCanvas.getContext('2d');
      
      // Handle background for transparent GIFs
      if (!this.options.transparent) {
        ctx.fillStyle = this.options.background;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
      
      // Draw the source canvas scaled to fit
      ctx.drawImage(
        this.canvas,
        0, 0, this.canvas.width, this.canvas.height,
        0, 0, this.options.width, this.options.height
      );
      
      // Add frame to GIF with delay
      const delay = 1000 / this.options.fps;
      this.gif.addFrame(tempCanvas, { delay: delay, copy: true });
      
      this.capturedFrames++;
      
      if (this.progressCallback) {
        this.progressCallback({
          rendering: false,
          progress: this.capturedFrames / this.totalFrames,
          phase: 'recording',
          capturedFrames: this.capturedFrames,
          totalFrames: this.totalFrames
        });
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  /**
   * Download the GIF file
   */
  download(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  /**
   * Update options
   */
  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.totalFrames = Math.floor(this.options.duration * this.options.fps);
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.recording;
  }

  /**
   * Get current recording stats
   */
  getStats() {
    return {
      recording: this.recording,
      capturedFrames: this.capturedFrames,
      totalFrames: this.totalFrames,
      duration: this.options.duration,
      fps: this.options.fps,
      progress: this.capturedFrames / this.totalFrames
    };
  }
}

/**
 * Quick setup function for p5.js sketches
 */
function setupGifExporter(sketch, options = {}) {
  const exporter = new GifExporter(options);
  
  // Wait for canvas to be available
  const checkCanvas = setInterval(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      clearInterval(checkCanvas);
      exporter.init(canvas, options.callbacks || {});
      
      // Add keyboard shortcut if enabled (default: 'r' to record)
      if (options.keyboardShortcut !== false) {
        const key = options.recordKey || 'r';
        document.addEventListener('keypress', (e) => {
          if (e.key === key) {
            if (exporter.isRecording()) {
              exporter.stop();
            } else {
              exporter.start();
            }
          }
        });
      }
    }
  }, 100);
  
  return exporter;
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GifExporter, setupGifExporter };
} else if (typeof window !== 'undefined') {
  window.GifExporter = GifExporter;
  window.setupGifExporter = setupGifExporter;
}