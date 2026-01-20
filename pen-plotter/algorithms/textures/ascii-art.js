/**
 * ASCII ART LIBRARY
 * Convert images to ASCII art with pen-plotter optimized patterns
 */

class ASCIIArt {
  constructor() {
    this.characterSets = {
      simple: [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'],
      detailed: [' ', '`', '.', "'", ',', ':', ';', 'c', 'l', 'x', 'o', 'k', 'X', 'd', 'O', '0', 'K', 'N', 'W', 'M'],
      blocks: [' ', '░', '▒', '▓', '█'],
      lines: [' ', '-', '=', '≡', '█']
    };
    
    this.defaultOptions = {
      characterSet: 'simple',
      fontSize: 8,
      spacing: 1.2,
      invert: false,
      contrast: 1.0
    };
  }

  /**
   * Convert image to ASCII art
   */
  imageToASCII(img, cols, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const chars = this.characterSets[opts.characterSet];
    
    const aspectRatio = img.height / img.width;
    const rows = Math.floor(cols * aspectRatio * 0.5); // Adjust for character aspect ratio
    
    const cellWidth = img.width / cols;
    const cellHeight = img.height / rows;
    
    let ascii = '';
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.floor(col * cellWidth);
        const y = Math.floor(row * cellHeight);
        
        // Sample pixel from image
        const pixelColor = img.get(x, y);
        const brightness = (red(pixelColor) + green(pixelColor) + blue(pixelColor)) / 3;
        
        // Apply contrast and inversion
        let adjustedBrightness = brightness / 255 * opts.contrast;
        if (opts.invert) adjustedBrightness = 1 - adjustedBrightness;
        
        // Map to character
        const charIndex = Math.floor(adjustedBrightness * (chars.length - 1));
        ascii += chars[charIndex];
      }
      ascii += '\n';
    }
    
    return ascii;
  }

  /**
   * Draw ASCII art text for pen plotting (stroke-only)
   */
  drawASCIIText(canvas, asciiText, x, y, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    canvas.push();
    canvas.textFont('monospace');
    canvas.textSize(opts.fontSize);
    canvas.fill(0);
    canvas.noStroke();
    
    const lines = asciiText.split('\n');
    const lineHeight = opts.fontSize * opts.spacing;
    
    lines.forEach((line, index) => {
      canvas.text(line, x, y + index * lineHeight);
    });
    
    canvas.pop();
  }

  /**
   * Draw ASCII art for pen plotting using individual character paths
   */
  drawASCIIForPlotter(canvas, asciiText, x, y, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    canvas.push();
    canvas.stroke(0);
    canvas.strokeWeight(0.5);
    canvas.noFill();
    
    const lines = asciiText.split('\n');
    const charWidth = opts.fontSize * 0.6;
    const lineHeight = opts.fontSize * opts.spacing;
    
    lines.forEach((line, rowIndex) => {
      for (let colIndex = 0; colIndex < line.length; colIndex++) {
        const char = line[colIndex];
        if (char !== ' ') {
          const charX = x + colIndex * charWidth;
          const charY = y + rowIndex * lineHeight;
          this.drawCharacterPath(canvas, char, charX, charY, opts.fontSize);
        }
      }
    });
    
    canvas.pop();
  }

  /**
   * Draw simplified character paths for pen plotting
   */
  drawCharacterPath(canvas, char, x, y, size) {
    const scale = size / 10;
    
    canvas.push();
    canvas.translate(x, y);
    canvas.scale(scale);
    
    switch (char) {
      case '.':
        canvas.point(0, 0);
        break;
      case ':':
        canvas.point(0, -2);
        canvas.point(0, 2);
        break;
      case '-':
        canvas.line(-3, 0, 3, 0);
        break;
      case '=':
        canvas.line(-3, -1, 3, -1);
        canvas.line(-3, 1, 3, 1);
        break;
      case '+':
        canvas.line(-3, 0, 3, 0);
        canvas.line(0, -3, 0, 3);
        break;
      case '*':
        canvas.line(-3, 0, 3, 0);
        canvas.line(0, -3, 0, 3);
        canvas.line(-2, -2, 2, 2);
        canvas.line(-2, 2, 2, -2);
        break;
      case '#':
        canvas.line(-3, -1, 3, -1);
        canvas.line(-3, 1, 3, 1);
        canvas.line(-1, -3, -1, 3);
        canvas.line(1, -3, 1, 3);
        break;
      case '%':
        canvas.circle(-2, -2, 2);
        canvas.circle(2, 2, 2);
        canvas.line(-3, 3, 3, -3);
        break;
      case '@':
        canvas.circle(0, 0, 6);
        canvas.circle(0, 0, 3);
        break;
      default:
        // For complex characters, draw a simple representation
        canvas.rect(-2, -4, 4, 8);
        break;
    }
    
    canvas.pop();
  }

  /**
   * Generate ASCII art from canvas content
   */
  canvasToASCII(canvas, cols, options = {}) {
    // Create a temporary graphics buffer to sample from
    const tempCanvas = createGraphics(canvas.width, canvas.height);
    tempCanvas.image(canvas, 0, 0);
    
    return this.imageToASCII(tempCanvas, cols, options);
  }

  /**
   * Create ASCII art pattern overlay
   */
  createASCIIPattern(canvas, sourceImage, overlayOptions = {}) {
    const defaultOverlayOptions = {
      cols: 80,
      opacity: 0.5,
      blend: MULTIPLY,
      characterSet: 'simple'
    };
    
    const opts = { ...defaultOverlayOptions, ...overlayOptions };
    const asciiText = this.imageToASCII(sourceImage, opts.cols, opts);
    
    // Create overlay
    const overlay = createGraphics(canvas.width, canvas.height);
    overlay.background(255, 0); // Transparent background
    
    this.drawASCIIText(overlay, asciiText, 0, 20, {
      fontSize: canvas.width / opts.cols,
      characterSet: opts.characterSet
    });
    
    // Apply to main canvas
    canvas.push();
    canvas.tint(255, opts.opacity * 255);
    canvas.blendMode(opts.blend);
    canvas.image(overlay, 0, 0);
    canvas.pop();
    
    overlay.remove();
  }

  /**
   * Export ASCII as plotter-ready paths
   */
  exportASCIIForPlotter(asciiText, paperSize = 'A4', options = {}) {
    const paper = {
      'A4': { width: 210, height: 297 },
      'A3': { width: 297, height: 420 },
      'Letter': { width: 216, height: 279 }
    };
    
    const dims = paper[paperSize] || paper['A4'];
    const plotterCanvas = createGraphics(dims.width * 3.78, dims.height * 3.78, SVG); // Convert mm to pixels
    
    const margin = 20;
    this.drawASCIIForPlotter(
      plotterCanvas, 
      asciiText, 
      margin, 
      margin, 
      { ...options, fontSize: 6 }
    );
    
    return plotterCanvas;
  }
}

// Global instance
const asciiArt = new ASCIIArt();

// Convenience functions
function imageToASCII(img, cols, options) {
  return asciiArt.imageToASCII(img, cols, options);
}

function drawASCIIForPlotter(canvas, asciiText, x, y, options) {
  return asciiArt.drawASCIIForPlotter(canvas, asciiText, x, y, options);
}

function createASCIIPattern(canvas, sourceImage, options) {
  return asciiArt.createASCIIPattern(canvas, sourceImage, options);
}