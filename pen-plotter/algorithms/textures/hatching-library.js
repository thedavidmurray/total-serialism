/**
 * HATCHING LIBRARY
 * Advanced hatching and texture patterns for pen plotting
 */

class HatchingLibrary {
  constructor() {
    this.patterns = {
      parallel: this.createParallelHatch,
      crosshatch: this.createCrosshatch,
      diagonal: this.createDiagonalHatch,
      stipple: this.createStipple,
      contour: this.createContourHatch,
      brick: this.createBrickHatch,
      hex: this.createHexHatch,
      wave: this.createWaveHatch,
      spiral: this.createSpiralHatch,
      radial: this.createRadialHatch
    };
  }

  /**
   * Apply hatching pattern to a region
   */
  hatchRegion(canvas, x, y, width, height, pattern, options = {}) {
    const defaultOptions = {
      spacing: 3,
      angle: 0,
      strokeWeight: 0.5,
      density: 1.0,
      variant: 'basic'
    };
    
    const opts = { ...defaultOptions, ...options };
    
    canvas.push();
    canvas.translate(x + width/2, y + height/2);
    canvas.rotate(opts.angle);
    canvas.strokeWeight(opts.strokeWeight);
    canvas.stroke(0);
    canvas.noFill();
    
    if (this.patterns[pattern]) {
      this.patterns[pattern].call(this, canvas, -width/2, -height/2, width, height, opts);
    } else {
      console.warn(`Unknown hatching pattern: ${pattern}`);
      this.createParallelHatch(canvas, -width/2, -height/2, width, height, opts);
    }
    
    canvas.pop();
  }

  /**
   * Parallel line hatching
   */
  createParallelHatch(canvas, x, y, w, h, opts) {
    const lineCount = Math.floor(h / opts.spacing);
    
    for (let i = 0; i <= lineCount; i++) {
      const yPos = y + (i * opts.spacing);
      if (yPos <= y + h) {
        canvas.line(x, yPos, x + w, yPos);
      }
    }
  }

  /**
   * Cross-hatching pattern
   */
  createCrosshatch(canvas, x, y, w, h, opts) {
    // Horizontal lines
    this.createParallelHatch(canvas, x, y, w, h, opts);
    
    // Vertical lines
    canvas.push();
    canvas.rotate(PI/2);
    this.createParallelHatch(canvas, -h/2, -w/2, h, w, { ...opts, spacing: opts.spacing * 1.2 });
    canvas.pop();
  }

  /**
   * Diagonal hatching
   */
  createDiagonalHatch(canvas, x, y, w, h, opts) {
    canvas.push();
    canvas.rotate(PI/4);
    const diagonal = Math.sqrt(w*w + h*h);
    this.createParallelHatch(canvas, -diagonal/2, -diagonal/2, diagonal, diagonal, opts);
    canvas.pop();
  }

  /**
   * Stipple pattern
   */
  createStipple(canvas, x, y, w, h, opts) {
    const dotCount = (w * h) / (opts.spacing * opts.spacing) * opts.density;
    
    for (let i = 0; i < dotCount; i++) {
      const px = x + Math.random() * w;
      const py = y + Math.random() * h;
      canvas.point(px, py);
    }
  }

  /**
   * Contour hatching
   */
  createContourHatch(canvas, x, y, w, h, opts) {
    const levels = Math.floor(Math.min(w, h) / (opts.spacing * 2));
    
    for (let i = 1; i <= levels; i++) {
      const margin = i * opts.spacing;
      canvas.rect(x + margin, y + margin, w - margin*2, h - margin*2);
    }
  }

  /**
   * Brick pattern
   */
  createBrickHatch(canvas, x, y, w, h, opts) {
    const brickHeight = opts.spacing * 2;
    const brickWidth = opts.spacing * 4;
    const rows = Math.floor(h / brickHeight);
    const cols = Math.floor(w / brickWidth);
    
    for (let row = 0; row < rows; row++) {
      const yPos = y + row * brickHeight;
      const offset = (row % 2) * (brickWidth / 2);
      
      for (let col = 0; col < cols + 1; col++) {
        const xPos = x + col * brickWidth + offset;
        if (xPos < x + w && xPos + brickWidth > x) {
          canvas.rect(xPos, yPos, Math.min(brickWidth, x + w - xPos), brickHeight);
        }
      }
    }
  }

  /**
   * Hexagonal pattern
   */
  createHexHatch(canvas, x, y, w, h, opts) {
    const radius = opts.spacing;
    const hexHeight = radius * Math.sqrt(3);
    const hexWidth = radius * 2;
    
    const rows = Math.floor(h / (hexHeight * 0.75));
    const cols = Math.floor(w / hexWidth);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const xPos = x + col * hexWidth + (row % 2) * radius;
        const yPos = y + row * hexHeight * 0.75;
        
        if (xPos >= x && xPos <= x + w && yPos >= y && yPos <= y + h) {
          this.drawHexagon(canvas, xPos, yPos, radius);
        }
      }
    }
  }

  /**
   * Wave pattern
   */
  createWaveHatch(canvas, x, y, w, h, opts) {
    const waveHeight = opts.spacing;
    const wavelength = opts.spacing * 4;
    const rows = Math.floor(h / (waveHeight * 2));
    
    for (let row = 0; row < rows; row++) {
      const yPos = y + row * waveHeight * 2;
      
      canvas.beginShape();
      canvas.noFill();
      
      for (let px = x; px <= x + w; px += 2) {
        const waveY = yPos + Math.sin((px - x) / wavelength * TWO_PI) * waveHeight;
        canvas.vertex(px, waveY);
      }
      
      canvas.endShape();
    }
  }

  /**
   * Spiral hatching
   */
  createSpiralHatch(canvas, x, y, w, h, opts) {
    const centerX = x + w/2;
    const centerY = y + h/2;
    const maxRadius = Math.min(w, h) / 2;
    const spiralSpacing = opts.spacing;
    
    canvas.beginShape();
    canvas.noFill();
    
    let radius = 0;
    let angle = 0;
    
    while (radius < maxRadius) {
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      
      canvas.vertex(px, py);
      
      angle += 0.1;
      radius += spiralSpacing / (TWO_PI * 10);
    }
    
    canvas.endShape();
  }

  /**
   * Radial hatching
   */
  createRadialHatch(canvas, x, y, w, h, opts) {
    const centerX = x + w/2;
    const centerY = y + h/2;
    const maxRadius = Math.min(w, h) / 2;
    const rayCount = Math.floor(360 / (opts.spacing * 2));
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * TWO_PI;
      const endX = centerX + Math.cos(angle) * maxRadius;
      const endY = centerY + Math.sin(angle) * maxRadius;
      
      canvas.line(centerX, centerY, endX, endY);
    }
  }

  /**
   * Helper function to draw hexagon
   */
  drawHexagon(canvas, x, y, radius) {
    canvas.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = i * PI / 3;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      canvas.vertex(px, py);
    }
    canvas.endShape(CLOSE);
  }

  /**
   * Create texture based on grayscale value
   */
  textureFromGrayscale(canvas, x, y, w, h, grayValue, options = {}) {
    const intensity = 1 - (grayValue / 255); // Invert so darker = more texture
    
    if (intensity < 0.1) {
      // Very light - no texture
      return;
    } else if (intensity < 0.3) {
      // Light - simple dots
      this.hatchRegion(canvas, x, y, w, h, 'stipple', { 
        ...options, 
        density: intensity * 0.5,
        spacing: options.spacing || 4
      });
    } else if (intensity < 0.5) {
      // Medium-light - parallel lines
      this.hatchRegion(canvas, x, y, w, h, 'parallel', { 
        ...options, 
        spacing: (options.spacing || 3) / intensity
      });
    } else if (intensity < 0.7) {
      // Medium-dark - cross hatch
      this.hatchRegion(canvas, x, y, w, h, 'crosshatch', { 
        ...options, 
        spacing: (options.spacing || 2) / intensity
      });
    } else {
      // Very dark - dense stipple + cross hatch
      this.hatchRegion(canvas, x, y, w, h, 'crosshatch', { 
        ...options, 
        spacing: options.spacing || 1.5
      });
      this.hatchRegion(canvas, x, y, w, h, 'stipple', { 
        ...options, 
        density: intensity,
        spacing: options.spacing || 2
      });
    }
  }

  /**
   * Get available pattern names
   */
  getAvailablePatterns() {
    return Object.keys(this.patterns);
  }
}

// Global instance
const hatchingLibrary = new HatchingLibrary();

// Convenience functions
function hatchRegion(canvas, x, y, w, h, pattern, options) {
  return hatchingLibrary.hatchRegion(canvas, x, y, w, h, pattern, options);
}

function textureFromGrayscale(canvas, x, y, w, h, grayValue, options) {
  return hatchingLibrary.textureFromGrayscale(canvas, x, y, w, h, grayValue, options);
}