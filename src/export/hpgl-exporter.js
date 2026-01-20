/**
 * HPGL Exporter for Vintage Pen Plotters
 * Exports paths to HPGL (Hewlett-Packard Graphics Language) format
 */

class HPGLExporter {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      // Plotter units (1016 units = 1 inch for most HP plotters)
      unitsPerInch: config.unitsPerInch || 1016,
      
      // Paper size in inches
      paperWidth: config.paperWidth || 8.5,    // Letter width
      paperHeight: config.paperHeight || 11,   // Letter height
      
      // Pen selection
      penNumber: config.penNumber || 1,
      
      // Speed (1-100, percentage of max)
      penSpeed: config.penSpeed || 50,
      
      // Origin mode: 'bottom-left' or 'center'
      originMode: config.originMode || 'bottom-left',
      
      // Line terminator
      lineTerminator: config.lineTerminator || ';',
      
      // Include initialization
      includeInit: config.includeInit !== false,
      
      // Scale factor for input coordinates
      scaleFactor: config.scaleFactor || 1
    };
  }

  /**
   * Export paths to HPGL format
   * @param {Array} paths - Array of path objects with points
   * @param {Object} options - Export options
   * @returns {string} HPGL command string
   */
  export(paths, options = {}) {
    const config = { ...this.config, ...options };
    const commands = [];
    
    // Initialize plotter
    if (config.includeInit) {
      commands.push(...this.generateInitialization(config));
    }
    
    // Process paths
    for (const path of paths) {
      commands.push(...this.generatePath(path, config));
    }
    
    // Finalize
    commands.push(...this.generateFinalization(config));
    
    return commands.join(config.lineTerminator) + config.lineTerminator;
  }

  /**
   * Generate HPGL initialization commands
   */
  generateInitialization(config) {
    const commands = [];
    
    // Initialize plotter
    commands.push('IN'); // Initialize
    
    // Set pen speed
    if (config.penSpeed) {
      commands.push(`VS${config.penSpeed}`);
    }
    
    // Select pen
    commands.push(`SP${config.penNumber}`);
    
    // Set origin if center mode
    if (config.originMode === 'center') {
      const centerX = Math.round(config.paperWidth * config.unitsPerInch / 2);
      const centerY = Math.round(config.paperHeight * config.unitsPerInch / 2);
      commands.push(`IP${centerX},${centerY}`);
    }
    
    return commands;
  }

  /**
   * Generate HPGL commands for a single path
   */
  generatePath(path, config) {
    const commands = [];
    
    if (!path.points || path.points.length === 0) {
      return commands;
    }
    
    // Convert first point and pen up move
    const firstPoint = this.transformPoint(path.points[0], config);
    commands.push(`PU${firstPoint.x},${firstPoint.y}`);
    
    // Pen down for drawing
    if (path.points.length > 1) {
      // Build coordinate string for all remaining points
      const coords = [];
      for (let i = 1; i < path.points.length; i++) {
        const point = this.transformPoint(path.points[i], config);
        coords.push(`${point.x},${point.y}`);
      }
      
      // HPGL supports multiple coordinates in one PD command
      commands.push(`PD${coords.join(',')}`);
    }
    
    // Pen up after path
    commands.push('PU');
    
    return commands;
  }

  /**
   * Generate HPGL finalization commands
   */
  generateFinalization(config) {
    const commands = [];
    
    // Return to origin
    commands.push('PU0,0');
    
    // Store pen
    commands.push('SP0');
    
    return commands;
  }

  /**
   * Transform point from input coordinates to HPGL plotter units
   */
  transformPoint(point, config) {
    // Apply scale factor
    let x = point.x * config.scaleFactor;
    let y = point.y * config.scaleFactor;
    
    // Convert to plotter units
    // Assuming input is in pixels and we want to fit to paper
    const inputWidth = 1000; // Adjust based on your coordinate system
    const inputHeight = 1000;
    
    const plotterWidth = config.paperWidth * config.unitsPerInch;
    const plotterHeight = config.paperHeight * config.unitsPerInch;
    
    x = Math.round((x / inputWidth) * plotterWidth);
    y = Math.round((y / inputHeight) * plotterHeight);
    
    // Apply origin mode
    if (config.originMode === 'center') {
      x -= Math.round(plotterWidth / 2);
      y -= Math.round(plotterHeight / 2);
    }
    
    return { x, y };
  }

  /**
   * Convert SVG path data to HPGL
   * @param {string} svgPath - SVG path data string
   * @param {Object} options - Export options
   * @returns {string} HPGL commands
   */
  exportSVGPath(svgPath, options = {}) {
    const paths = this.parseSVGPath(svgPath);
    return this.export(paths, options);
  }

  /**
   * Basic SVG path parser (handles M, L, and Z commands)
   */
  parseSVGPath(pathData) {
    const paths = [];
    let currentPath = null;
    let currentX = 0;
    let currentY = 0;
    
    // Simple regex-based parser
    const commands = pathData.match(/[MLZmlz][^MLZmlz]*/g) || [];
    
    for (const command of commands) {
      const type = command[0];
      const coords = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
      
      switch (type.toUpperCase()) {
        case 'M': // Move to
          if (currentPath && currentPath.points.length > 0) {
            paths.push(currentPath);
          }
          currentPath = { points: [] };
          if (type === 'M') {
            currentX = coords[0];
            currentY = coords[1];
          } else {
            currentX += coords[0];
            currentY += coords[1];
          }
          currentPath.points.push({ x: currentX, y: currentY });
          break;
          
        case 'L': // Line to
          if (!currentPath) {
            currentPath = { points: [] };
          }
          if (type === 'L') {
            currentX = coords[0];
            currentY = coords[1];
          } else {
            currentX += coords[0];
            currentY += coords[1];
          }
          currentPath.points.push({ x: currentX, y: currentY });
          break;
          
        case 'Z': // Close path
          if (currentPath && currentPath.points.length > 0) {
            // Add line back to start
            currentPath.points.push({ ...currentPath.points[0] });
            paths.push(currentPath);
            currentPath = null;
          }
          break;
      }
    }
    
    // Add any remaining path
    if (currentPath && currentPath.points.length > 0) {
      paths.push(currentPath);
    }
    
    return paths;
  }

  /**
   * Estimate plotting time based on pen speed and distance
   */
  estimateTime(paths) {
    let totalDistance = 0;
    let penMoves = 0;
    
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      
      // Pen move to start
      if (i > 0 && paths[i - 1].points.length > 0 && path.points.length > 0) {
        const prevEnd = paths[i - 1].points[paths[i - 1].points.length - 1];
        const currentStart = path.points[0];
        penMoves += this.distance(prevEnd, currentStart);
      }
      
      // Drawing distance
      for (let j = 1; j < path.points.length; j++) {
        totalDistance += this.distance(path.points[j - 1], path.points[j]);
      }
    }
    
    // Convert to plotter units
    const scale = this.config.unitsPerInch / 1000; // Adjust based on input scale
    totalDistance *= scale;
    penMoves *= scale;
    
    // Estimate time based on pen speed (this is approximate)
    const maxSpeed = 15; // inches per second at VS100
    const actualSpeed = maxSpeed * (this.config.penSpeed / 100);
    const drawTime = totalDistance / (actualSpeed * this.config.unitsPerInch);
    const moveTime = penMoves / (actualSpeed * this.config.unitsPerInch * 2); // Pen up moves are faster
    
    return {
      drawTime,
      moveTime,
      totalTime: drawTime + moveTime,
      totalDistance: totalDistance / this.config.unitsPerInch, // Convert to inches
      penMoves: penMoves / this.config.unitsPerInch,
      pathCount: paths.length
    };
  }

  /**
   * Calculate distance between two points
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate HPGL commands for common shapes
   */
  static shapes = {
    rectangle: (x, y, width, height) => {
      return [
        `PU${x},${y}`,
        `PD${x + width},${y},${x + width},${y + height},${x},${y + height},${x},${y}`,
        'PU'
      ];
    },
    
    circle: (cx, cy, radius, segments = 36) => {
      const commands = [`PU${cx + radius},${cy}`];
      const coords = [];
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.round(cx + radius * Math.cos(angle));
        const y = Math.round(cy + radius * Math.sin(angle));
        coords.push(`${x},${y}`);
      }
      
      commands.push(`PD${coords.join(',')}`);
      commands.push('PU');
      return commands;
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HPGLExporter;
}