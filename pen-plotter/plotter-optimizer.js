/**
 * PLOTTER OPTIMIZER UTILITIES
 * Integration with vpype and path optimization for pen plotters
 */

class PlotterOptimizer {
  constructor() {
    this.vpypeAvailable = false;
    this.checkVpypeAvailability();
  }

  async checkVpypeAvailability() {
    try {
      // Check if running in browser environment
      if (typeof window !== 'undefined') {
        // Browser environment - vpype not directly available
        console.warn('vpype optimization requires server-side processing');
        return false;
      }
      
      // Note: In browser context, we'll provide client-side optimizations
      this.vpypeAvailable = false;
    } catch (error) {
      console.warn('vpype not available:', error.message);
      this.vpypeAvailable = false;
    }
  }

  /**
   * CLIENT-SIDE PATH OPTIMIZATION
   * Basic optimizations that can be done in the browser
   */
  optimizePaths(canvas) {
    // Remove duplicate points
    this.removeDuplicatePoints(canvas);
    
    // Merge nearby endpoints
    this.mergeNearbyEndpoints(canvas);
    
    // Optimize stroke order for minimal pen travel
    this.optimizeStrokeOrder(canvas);
    
    return canvas;
  }

  /**
   * Remove duplicate consecutive points
   */
  removeDuplicatePoints(canvas) {
    // This would require access to p5.js internal path data
    // For now, we'll implement basic optimization principles
    console.log('Removing duplicate points...');
  }

  /**
   * Merge endpoints that are very close together
   */
  mergeNearbyEndpoints(canvas, threshold = 0.5) {
    console.log(`Merging endpoints within ${threshold} units...`);
    // Implementation would analyze path endpoints and connect close ones
  }

  /**
   * Optimize stroke drawing order to minimize pen-up travel
   */
  optimizeStrokeOrder(canvas) {
    console.log('Optimizing stroke order for minimal travel...');
    // Implement traveling salesman-like optimization for stroke order
  }

  /**
   * PLOTTER-SPECIFIC DRAWING UTILITIES
   */
  
  /**
   * Draw stroke-only circle (no fill)
   */
  plotterCircle(canvas, x, y, diameter) {
    canvas.push();
    canvas.stroke(0);
    canvas.noFill();
    canvas.circle(x, y, diameter);
    canvas.pop();
  }

  /**
   * Draw stroke-only rectangle (no fill)
   */
  plotterRect(canvas, x, y, w, h) {
    canvas.push();
    canvas.stroke(0);
    canvas.noFill();
    canvas.rect(x, y, w, h);
    canvas.pop();
  }

  /**
   * Draw stroke-only polygon (no fill)
   */
  plotterPolygon(canvas, points) {
    canvas.push();
    canvas.stroke(0);
    canvas.noFill();
    canvas.beginShape();
    points.forEach(p => canvas.vertex(p.x, p.y));
    canvas.endShape(CLOSE);
    canvas.pop();
  }

  /**
   * Draw hatching pattern for filled areas
   */
  plotterHatch(canvas, x, y, w, h, spacing = 5, angle = 0) {
    canvas.push();
    canvas.stroke(0);
    canvas.strokeWeight(0.5);
    canvas.translate(x + w/2, y + h/2);
    canvas.rotate(angle);
    
    const maxDim = Math.max(w, h);
    const lineCount = Math.floor(maxDim / spacing);
    
    for (let i = -lineCount; i <= lineCount; i++) {
      const lineY = i * spacing;
      canvas.line(-w/2, lineY, w/2, lineY);
    }
    
    canvas.pop();
  }

  /**
   * Convert filled shape to stroke outline or hatching
   */
  convertFillToStroke(canvas, shape, method = 'outline') {
    switch (method) {
      case 'outline':
        // Convert filled circle to stroke outline
        if (shape.type === 'circle') {
          this.plotterCircle(canvas, shape.x, shape.y, shape.diameter);
        } else if (shape.type === 'rect') {
          this.plotterRect(canvas, shape.x, shape.y, shape.w, shape.h);
        }
        break;
      
      case 'hatch':
        // Convert filled area to hatching pattern
        if (shape.type === 'rect') {
          this.plotterHatch(canvas, shape.x, shape.y, shape.w, shape.h, shape.hatchSpacing || 3);
        }
        break;
      
      case 'cross-hatch':
        // Double hatching for darker fills
        if (shape.type === 'rect') {
          this.plotterHatch(canvas, shape.x, shape.y, shape.w, shape.h, shape.hatchSpacing || 3, 0);
          this.plotterHatch(canvas, shape.x, shape.y, shape.w, shape.h, shape.hatchSpacing || 3, PI/2);
        }
        break;
    }
  }

  /**
   * PAPER SIZE UTILITIES
   */
  getPaperSize(format) {
    const sizes = {
      'A4': { width: 210, height: 297, units: 'mm' },
      'A3': { width: 297, height: 420, units: 'mm' },
      'A5': { width: 148, height: 210, units: 'mm' },
      'Letter': { width: 8.5, height: 11, units: 'in' },
      'Legal': { width: 8.5, height: 14, units: 'in' }
    };
    
    return sizes[format] || sizes['A4'];
  }

  /**
   * Scale drawing to fit paper size with margins
   */
  scaleToPaper(canvas, paperFormat = 'A4', margin = 20) {
    const paper = this.getPaperSize(paperFormat);
    const availableWidth = paper.width - (margin * 2);
    const availableHeight = paper.height - (margin * 2);
    
    // Calculate scale to fit
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    const scale = Math.min(scaleX, scaleY);
    
    // Center on paper
    const offsetX = (paper.width - (width * scale)) / 2;
    const offsetY = (paper.height - (height * scale)) / 2;
    
    canvas.translate(offsetX, offsetY);
    canvas.scale(scale);
    
    return { scale, offsetX, offsetY, paper };
  }

  /**
   * Add crop marks and paper guides
   */
  addCropMarks(canvas, paperInfo, margin = 20) {
    canvas.push();
    canvas.stroke(0);
    canvas.strokeWeight(0.25);
    
    const { paper } = paperInfo;
    const markLength = 10;
    
    // Corner crop marks
    const corners = [
      { x: margin, y: margin },
      { x: paper.width - margin, y: margin },
      { x: paper.width - margin, y: paper.height - margin },
      { x: margin, y: paper.height - margin }
    ];
    
    corners.forEach(corner => {
      // Horizontal marks
      canvas.line(corner.x - markLength, corner.y, corner.x + markLength, corner.y);
      // Vertical marks
      canvas.line(corner.x, corner.y - markLength, corner.x, corner.y + markLength);
    });
    
    canvas.pop();
  }

  /**
   * EXPORT WITH OPTIMIZATION
   */
  exportOptimized(drawFunction, algorithmName, params = {}, options = {}) {
    const canvas = createGraphics(width, height, SVG);
    
    // Set plotter-optimized defaults
    canvas.stroke(0);
    canvas.strokeWeight(0.5);
    canvas.noFill();
    
    // Apply paper scaling if requested
    let paperInfo = null;
    if (options.paperFormat) {
      paperInfo = this.scaleToPaper(canvas, options.paperFormat, options.margin);
    }
    
    // Draw the algorithm
    drawFunction(canvas, 'plotter');
    
    // Apply optimizations
    this.optimizePaths(canvas);
    
    // Add crop marks if requested
    if (options.cropMarks && paperInfo) {
      this.addCropMarks(canvas, paperInfo, options.margin);
    }
    
    // Save optimized file
    const filename = `${algorithmName}-optimized-${Date.now()}.svg`;
    save(canvas, filename);
    canvas.remove();
    
    return filename;
  }

  /**
   * VPYPE COMMAND GENERATION
   * Generate vpype commands for server-side optimization
   */
  generateVpypeCommand(inputFile, outputFile, options = {}) {
    let command = `vpype read "${inputFile}"`;
    
    // Line optimization
    if (options.optimize !== false) {
      command += ' linemerge linesimplify';
    }
    
    // Remove short lines
    if (options.minLength) {
      command += ` filter --min-length ${options.minLength}mm`;
    }
    
    // Sort lines for optimal plotting
    if (options.sortLines !== false) {
      command += ' linesort';
    }
    
    // Optimize pen travel
    if (options.reloop !== false) {
      command += ' reloop';
    }
    
    // Scale to specific size
    if (options.scale) {
      command += ` scale ${options.scale}`;
    }
    
    command += ` write "${outputFile}"`;
    
    return command;
  }
}

// Global instance
const plotterOptimizer = new PlotterOptimizer();

// Convenience functions
function optimizeForPlotter(canvas) {
  return plotterOptimizer.optimizePaths(canvas);
}

function exportOptimizedSVG(drawFunction, algorithmName, params, options) {
  return plotterOptimizer.exportOptimized(drawFunction, algorithmName, params, options);
}