/**
 * Hatching and Texture Library for Pen Plotter Art
 * Provides various hatching patterns and textures optimized for pen plotting
 */

class HatchingLibrary {
  constructor() {
    this.patterns = {
      'parallel': this.parallelHatch,
      'crosshatch': this.crossHatch,
      'stipple': this.stipple,
      'scribble': this.scribble,
      'waves': this.waveHatch,
      'circular': this.circularHatch,
      'organic': this.organicHatch,
      'dots': this.dotPattern,
      'dashes': this.dashPattern,
      'zigzag': this.zigzagHatch,
      'gradient': this.gradientHatch,
      'noise': this.noiseHatch
    };
  }

  /**
   * Fill a shape with a hatching pattern
   * @param {Object} shape - Shape definition (polygon, circle, rect)
   * @param {string} pattern - Pattern name
   * @param {Object} options - Pattern options
   * @returns {Array} Array of line segments
   */
  fillShape(shape, pattern = 'parallel', options = {}) {
    if (!this.patterns[pattern]) {
      console.warn(`Pattern ${pattern} not found, using parallel`);
      pattern = 'parallel';
    }
    
    return this.patterns[pattern].call(this, shape, options);
  }

  /**
   * Parallel line hatching
   */
  parallelHatch(shape, options = {}) {
    const {
      spacing = 2,
      angle = 45,
      offset = 0,
      density = 1
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate line direction
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);
    
    // Calculate perpendicular direction for spacing
    const pdx = -dy;
    const pdy = dx;
    
    // Determine number of lines needed
    const diagonal = Math.sqrt(
      Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)
    );
    const numLines = Math.ceil(diagonal / (spacing / density));
    
    // Generate lines
    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      const lineOffset = i * spacing + offset;
      const startX = bounds.centerX + pdx * lineOffset - dx * diagonal / 2;
      const startY = bounds.centerY + pdy * lineOffset - dy * diagonal / 2;
      const endX = startX + dx * diagonal;
      const endY = startY + dy * diagonal;
      
      // Clip line to shape
      const clipped = this.clipLineToShape(
        { x: startX, y: startY },
        { x: endX, y: endY },
        shape
      );
      
      if (clipped) {
        lines.push(...clipped);
      }
    }
    
    return lines;
  }

  /**
   * Cross-hatching pattern
   */
  crossHatch(shape, options = {}) {
    const {
      spacing = 3,
      angle1 = 45,
      angle2 = -45,
      density = 1
    } = options;
    
    // Get two sets of parallel lines
    const lines1 = this.parallelHatch(shape, {
      spacing,
      angle: angle1,
      density
    });
    
    const lines2 = this.parallelHatch(shape, {
      spacing,
      angle: angle2,
      density
    });
    
    return [...lines1, ...lines2];
  }

  /**
   * Stipple pattern (dots)
   */
  stipple(shape, options = {}) {
    const {
      density = 0.1,
      minSize = 0.5,
      maxSize = 2,
      randomness = 0.8
    } = options;
    
    const points = [];
    const bounds = this.getShapeBounds(shape);
    const area = bounds.width * bounds.height;
    const numPoints = Math.floor(area * density);
    
    for (let i = 0; i < numPoints; i++) {
      let x, y;
      let attempts = 0;
      
      // Try to find a point inside the shape
      do {
        x = bounds.minX + Math.random() * bounds.width;
        y = bounds.minY + Math.random() * bounds.height;
        attempts++;
      } while (!this.isPointInShape({ x, y }, shape) && attempts < 100);
      
      if (attempts < 100) {
        const size = minSize + Math.random() * (maxSize - minSize);
        points.push({
          type: 'circle',
          x,
          y,
          radius: size / 2
        });
      }
    }
    
    return points;
  }

  /**
   * Scribble fill pattern
   */
  scribble(shape, options = {}) {
    const {
      density = 0.5,
      chaos = 0.3,
      strokeCount = 5
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    
    for (let i = 0; i < strokeCount; i++) {
      const path = [];
      let x = bounds.minX + Math.random() * bounds.width;
      let y = bounds.minY + Math.random() * bounds.height;
      
      // Find starting point inside shape
      while (!this.isPointInShape({ x, y }, shape)) {
        x = bounds.minX + Math.random() * bounds.width;
        y = bounds.minY + Math.random() * bounds.height;
      }
      
      path.push({ x, y });
      
      // Random walk
      const steps = 20 + Math.floor(Math.random() * 30);
      for (let j = 0; j < steps; j++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 10 * chaos;
        
        x += Math.cos(angle) * distance;
        y += Math.sin(angle) * distance;
        
        if (this.isPointInShape({ x, y }, shape)) {
          path.push({ x, y });
        } else {
          break;
        }
      }
      
      if (path.length > 1) {
        for (let j = 1; j < path.length; j++) {
          lines.push({
            start: path[j - 1],
            end: path[j]
          });
        }
      }
    }
    
    return lines;
  }

  /**
   * Wave hatching pattern
   */
  waveHatch(shape, options = {}) {
    const {
      spacing = 4,
      amplitude = 3,
      frequency = 0.1,
      angle = 0
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    const angleRad = (angle * Math.PI) / 180;
    
    // Generate wavy lines
    const numLines = Math.ceil(bounds.height / spacing);
    
    for (let i = 0; i < numLines; i++) {
      const y = bounds.minY + i * spacing;
      const points = [];
      
      // Generate wave points
      for (let x = bounds.minX; x <= bounds.maxX; x += 2) {
        const waveY = y + Math.sin(x * frequency) * amplitude;
        const point = { x, y: waveY };
        
        if (this.isPointInShape(point, shape)) {
          points.push(point);
        }
      }
      
      // Convert points to line segments
      for (let j = 1; j < points.length; j++) {
        lines.push({
          start: points[j - 1],
          end: points[j]
        });
      }
    }
    
    return lines;
  }

  /**
   * Circular/radial hatching
   */
  circularHatch(shape, options = {}) {
    const {
      center = null,
      spacing = 3,
      startRadius = 0,
      endRadius = null
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    const shapeCenter = center || {
      x: bounds.centerX,
      y: bounds.centerY
    };
    
    const maxRadius = endRadius || Math.sqrt(
      Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)
    ) / 2;
    
    // Generate concentric circles
    for (let r = startRadius; r <= maxRadius; r += spacing) {
      const points = [];
      const circumference = 2 * Math.PI * r;
      const steps = Math.max(8, Math.floor(circumference / 2));
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const x = shapeCenter.x + Math.cos(angle) * r;
        const y = shapeCenter.y + Math.sin(angle) * r;
        const point = { x, y };
        
        if (this.isPointInShape(point, shape)) {
          points.push(point);
        }
      }
      
      // Connect consecutive points that are both inside
      let inSegment = false;
      let segmentStart = null;
      
      for (let i = 0; i <= points.length; i++) {
        const curr = points[i % points.length];
        const next = points[(i + 1) % points.length];
        
        if (curr && next) {
          const dist = Math.sqrt(
            Math.pow(next.x - curr.x, 2) + 
            Math.pow(next.y - curr.y, 2)
          );
          
          // Check if points are adjacent (not across shape)
          if (dist < r * 0.3) {
            if (!inSegment) {
              segmentStart = i;
              inSegment = true;
            }
          } else if (inSegment) {
            // End segment
            for (let j = segmentStart; j < i; j++) {
              lines.push({
                start: points[j],
                end: points[j + 1]
              });
            }
            inSegment = false;
          }
        }
      }
    }
    
    return lines;
  }

  /**
   * Organic/natural hatching using Perlin noise
   */
  organicHatch(shape, options = {}) {
    const {
      spacing = 3,
      variance = 2,
      scale = 0.01,
      seed = Math.random() * 1000
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    
    // Use simplex noise for organic variation
    const noise = (x, y) => {
      // Simple noise approximation
      const a = Math.sin(x * scale + seed) * 43758.5453;
      const b = Math.sin(y * scale + seed * 1.1) * 43758.5453;
      return (Math.sin(a + b) + 1) / 2;
    };
    
    // Generate organic flow lines
    const numLines = Math.ceil(bounds.width / spacing);
    
    for (let i = 0; i < numLines; i++) {
      const startX = bounds.minX + i * spacing;
      const points = [];
      
      for (let y = bounds.minY; y <= bounds.maxY; y += 2) {
        const offset = (noise(startX, y) - 0.5) * variance * 2;
        const x = startX + offset;
        const point = { x, y };
        
        if (this.isPointInShape(point, shape)) {
          points.push(point);
        }
      }
      
      // Convert to line segments
      for (let j = 1; j < points.length; j++) {
        lines.push({
          start: points[j - 1],
          end: points[j]
        });
      }
    }
    
    return lines;
  }

  /**
   * Dot pattern fill
   */
  dotPattern(shape, options = {}) {
    const {
      spacing = 5,
      size = 1,
      offset = 0,
      stagger = true
    } = options;
    
    const dots = [];
    const bounds = this.getShapeBounds(shape);
    
    let row = 0;
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      const xOffset = stagger && row % 2 ? spacing / 2 : 0;
      
      for (let x = bounds.minX + xOffset; x <= bounds.maxX; x += spacing) {
        if (this.isPointInShape({ x, y }, shape)) {
          dots.push({
            type: 'circle',
            x,
            y,
            radius: size / 2
          });
        }
      }
      row++;
    }
    
    return dots;
  }

  /**
   * Dash pattern fill
   */
  dashPattern(shape, options = {}) {
    const {
      spacing = 3,
      dashLength = 5,
      gapLength = 3,
      angle = 0,
      offset = 0
    } = options;
    
    const lines = [];
    const allLines = this.parallelHatch(shape, { spacing, angle, offset });
    
    // Convert continuous lines to dashed lines
    allLines.forEach(line => {
      const length = Math.sqrt(
        Math.pow(line.end.x - line.start.x, 2) +
        Math.pow(line.end.y - line.start.y, 2)
      );
      
      const dx = (line.end.x - line.start.x) / length;
      const dy = (line.end.y - line.start.y) / length;
      
      let currentLength = 0;
      let drawing = true;
      
      while (currentLength < length) {
        if (drawing) {
          const segmentLength = Math.min(dashLength, length - currentLength);
          const start = {
            x: line.start.x + dx * currentLength,
            y: line.start.y + dy * currentLength
          };
          const end = {
            x: start.x + dx * segmentLength,
            y: start.y + dy * segmentLength
          };
          
          lines.push({ start, end });
          currentLength += segmentLength;
        } else {
          currentLength += gapLength;
        }
        
        drawing = !drawing;
      }
    });
    
    return lines;
  }

  /**
   * Zigzag hatching pattern
   */
  zigzagHatch(shape, options = {}) {
    const {
      spacing = 4,
      amplitude = 3,
      frequency = 10,
      angle = 0
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    
    // Generate zigzag lines
    const numLines = Math.ceil(bounds.height / spacing);
    
    for (let i = 0; i < numLines; i++) {
      const y = bounds.minY + i * spacing;
      const points = [];
      
      let direction = 1;
      for (let x = bounds.minX; x <= bounds.maxX; x += frequency) {
        const zigY = y + direction * amplitude;
        const point = { x, y: zigY };
        
        if (this.isPointInShape(point, shape)) {
          points.push(point);
        }
        
        direction *= -1;
      }
      
      // Convert to line segments
      for (let j = 1; j < points.length; j++) {
        lines.push({
          start: points[j - 1],
          end: points[j]
        });
      }
    }
    
    return lines;
  }

  /**
   * Gradient hatching with variable density
   */
  gradientHatch(shape, options = {}) {
    const {
      startDensity = 0.2,
      endDensity = 1,
      angle = 45,
      direction = 'horizontal' // horizontal, vertical, radial
    } = options;
    
    const lines = [];
    const bounds = this.getShapeBounds(shape);
    
    if (direction === 'horizontal' || direction === 'vertical') {
      const isHorizontal = direction === 'horizontal';
      const dimension = isHorizontal ? bounds.width : bounds.height;
      const baseSpacing = 2;
      
      let position = 0;
      while (position < dimension) {
        const t = position / dimension;
        const density = startDensity + (endDensity - startDensity) * t;
        const spacing = baseSpacing / density;
        
        const offset = isHorizontal ? position : 0;
        const lineOptions = {
          spacing,
          angle,
          offset: isHorizontal ? 0 : position
        };
        
        const newLines = this.parallelHatch(shape, lineOptions);
        lines.push(...newLines.slice(0, 1)); // Take one line at this position
        
        position += spacing;
      }
    } else if (direction === 'radial') {
      // Radial gradient
      const center = {
        x: bounds.centerX,
        y: bounds.centerY
      };
      const maxRadius = Math.sqrt(
        Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)
      ) / 2;
      
      let radius = 0;
      while (radius < maxRadius) {
        const t = radius / maxRadius;
        const density = startDensity + (endDensity - startDensity) * t;
        const spacing = 3 / density;
        
        const circleLines = this.circularHatch(shape, {
          center,
          spacing: 1,
          startRadius: radius,
          endRadius: radius + 1
        });
        
        lines.push(...circleLines);
        radius += spacing;
      }
    }
    
    return lines;
  }

  /**
   * Noise-based hatching
   */
  noiseHatch(shape, options = {}) {
    const {
      density = 0.5,
      scale = 0.02,
      threshold = 0.5,
      style = 'lines' // lines, dots, both
    } = options;
    
    const elements = [];
    const bounds = this.getShapeBounds(shape);
    const spacing = 3;
    
    // Simple noise function
    const noise = (x, y) => {
      const a = Math.sin(x * scale) * 43758.5453;
      const b = Math.sin(y * scale) * 43758.5453;
      return (Math.sin(a + b) + 1) / 2;
    };
    
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
        const point = { x, y };
        
        if (this.isPointInShape(point, shape)) {
          const noiseValue = noise(x, y);
          
          if (noiseValue > threshold) {
            const localDensity = noiseValue * density;
            
            if (style === 'lines' || style === 'both') {
              // Add short line
              const angle = noiseValue * Math.PI * 2;
              const length = 3 + noiseValue * 5;
              const end = {
                x: x + Math.cos(angle) * length,
                y: y + Math.sin(angle) * length
              };
              
              if (this.isPointInShape(end, shape)) {
                elements.push({
                  start: point,
                  end
                });
              }
            }
            
            if (style === 'dots' || style === 'both') {
              // Add dot
              elements.push({
                type: 'circle',
                x,
                y,
                radius: 0.5 + noiseValue * 1.5
              });
            }
          }
        }
      }
    }
    
    return elements;
  }

  /**
   * Helper: Get bounds of a shape
   */
  getShapeBounds(shape) {
    if (shape.type === 'polygon') {
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
    } else if (shape.type === 'circle') {
      return {
        minX: shape.x - shape.radius,
        maxX: shape.x + shape.radius,
        minY: shape.y - shape.radius,
        maxY: shape.y + shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
        centerX: shape.x,
        centerY: shape.y
      };
    } else if (shape.type === 'rect') {
      return {
        minX: shape.x,
        maxX: shape.x + shape.width,
        minY: shape.y,
        maxY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2
      };
    }
  }

  /**
   * Helper: Check if point is inside shape
   */
  isPointInShape(point, shape) {
    if (shape.type === 'polygon') {
      // Ray casting algorithm
      let inside = false;
      const { points } = shape;
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      
      return inside;
    } else if (shape.type === 'circle') {
      const dx = point.x - shape.x;
      const dy = point.y - shape.y;
      return dx * dx + dy * dy <= shape.radius * shape.radius;
    } else if (shape.type === 'rect') {
      return point.x >= shape.x &&
             point.x <= shape.x + shape.width &&
             point.y >= shape.y &&
             point.y <= shape.y + shape.height;
    }
    
    return false;
  }

  /**
   * Helper: Clip line to shape
   */
  clipLineToShape(start, end, shape) {
    // Simple implementation - can be optimized
    const segments = [];
    const steps = 100;
    let currentSegment = null;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      };
      
      const inside = this.isPointInShape(point, shape);
      
      if (inside && !currentSegment) {
        currentSegment = { start: point, end: null };
      } else if (!inside && currentSegment) {
        currentSegment.end = segments.length > 0 ? point : currentSegment.start;
        segments.push(currentSegment);
        currentSegment = null;
      } else if (inside && currentSegment) {
        currentSegment.end = point;
      }
    }
    
    if (currentSegment && currentSegment.end) {
      segments.push(currentSegment);
    }
    
    return segments;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HatchingLibrary;
} else if (typeof window !== 'undefined') {
  window.HatchingLibrary = HatchingLibrary;
}