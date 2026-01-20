/**
 * SVG exporter for cellular automata optimized for pen plotting
 */

// Export render style constants
export const RenderStyle = {
  SQUARES: 'squares',
  CIRCLES: 'circles',
  DOTS: 'dots',
  LINES: 'lines'
};

// Export line optimization settings
export const LineOptimization = {
  NONE: 'none',
  BASIC: 'basic',
  ADVANCED: 'advanced'
};

// Export plotter settings presets
export const PlotterSettings = {
  AXIDRAW_V3: {
    paperSize: 'A4',
    strokeWidth: 0.5,
    margin: 10,
    optimizePaths: true
  },
  GENERIC: {
    paperSize: 'A4', 
    strokeWidth: 1,
    margin: 20,
    optimizePaths: true
  }
};

export class CellularAutomataSVGExporter {
  /**
   * Initialize the SVG exporter
   * @param {Object} options - Export options
   */
  constructor(options = {}) {
    this.options = {
      cellSize: 10,
      margin: 20,
      strokeWidth: 1,
      strokeColor: '#000000',
      fillColor: 'none',
      renderStyle: RenderStyle.SQUARES,
      optimizePaths: true,
      optimization: LineOptimization.BASIC,
      paperSize: 'A4', // or custom {width, height} in mm
      ...options
    };

    // Define paper sizes in mm
    this.paperSizes = {
      'A4': { width: 210, height: 297 },
      'A3': { width: 297, height: 420 },
      'Letter': { width: 215.9, height: 279.4 },
      'Legal': { width: 215.9, height: 355.6 }
    };
  }

  /**
   * Export a grid to SVG
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @param {string} filename - Output filename
   * @returns {string} SVG content
   */
  export(grid, filename) {
    const height = grid.length;
    const width = grid[0]?.length || 0;

    if (width === 0 || height === 0) {
      throw new Error('Invalid grid dimensions');
    }

    // Calculate SVG dimensions
    const svgWidth = width * this.options.cellSize + 2 * this.options.margin;
    const svgHeight = height * this.options.cellSize + 2 * this.options.margin;

    // Get paper size
    const paperSize = this.getPaperSize();
    
    // Create SVG header
    let svg = this.createSVGHeader(svgWidth, svgHeight, paperSize);

    // Add grid content based on render style
    switch (this.options.renderStyle) {
      case 'circles':
        svg += this.renderCircles(grid);
        break;
      case 'dots':
        svg += this.renderDots(grid);
        break;
      case 'lines':
        svg += this.renderLines(grid);
        break;
      case 'squares':
      default:
        svg += this.renderSquares(grid);
        break;
    }

    // Close SVG
    svg += '</svg>';

    return svg;
  }

  /**
   * Get paper size in mm
   * @returns {Object} Paper dimensions {width, height}
   */
  getPaperSize() {
    if (typeof this.options.paperSize === 'string') {
      return this.paperSizes[this.options.paperSize] || this.paperSizes['A4'];
    }
    return this.options.paperSize;
  }

  /**
   * Create SVG header
   * @param {number} width - SVG width in pixels
   * @param {number} height - SVG height in pixels
   * @param {Object} paperSize - Paper size in mm
   * @returns {string} SVG header
   */
  createSVGHeader(width, height, paperSize) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" 
     viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg"
     data-paper-width="${paperSize.width}mm"
     data-paper-height="${paperSize.height}mm">
  <g stroke="${this.options.strokeColor}" 
     stroke-width="${this.options.strokeWidth}" 
     fill="${this.options.fillColor}">
`;
  }

  /**
   * Render grid as squares
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @returns {string} SVG path elements
   */
  renderSquares(grid) {
    let paths = [];
    const size = this.options.cellSize;
    const margin = this.options.margin;

    if (this.options.optimizePaths) {
      // Optimize by combining adjacent cells into longer paths
      paths = this.optimizeSquarePaths(grid);
    } else {
      // Simple rendering - one rect per living cell
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x] === 1) {
            const px = margin + x * size;
            const py = margin + y * size;
            paths.push(`    <rect x="${px}" y="${py}" width="${size}" height="${size}"/>`);
          }
        }
      }
    }

    return paths.join('\n') + '\n  </g>\n';
  }

  /**
   * Render grid as circles
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @returns {string} SVG circle elements
   */
  renderCircles(grid) {
    let paths = [];
    const size = this.options.cellSize;
    const margin = this.options.margin;
    const radius = size / 2 - 1;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 1) {
          const cx = margin + x * size + size / 2;
          const cy = margin + y * size + size / 2;
          paths.push(`    <circle cx="${cx}" cy="${cy}" r="${radius}"/>`);
        }
      }
    }

    return paths.join('\n') + '\n  </g>\n';
  }

  /**
   * Render grid as dots (small filled circles)
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @returns {string} SVG circle elements
   */
  renderDots(grid) {
    let paths = [];
    const size = this.options.cellSize;
    const margin = this.options.margin;
    const radius = Math.max(1, size / 6);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 1) {
          const cx = margin + x * size + size / 2;
          const cy = margin + y * size + size / 2;
          paths.push(`    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${this.options.strokeColor}"/>`);
        }
      }
    }

    return paths.join('\n') + '\n  </g>\n';
  }

  /**
   * Render grid as connected lines
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @returns {string} SVG path elements
   */
  renderLines(grid) {
    const paths = [];
    const size = this.options.cellSize;
    const margin = this.options.margin;

    // Horizontal lines
    for (let y = 0; y < grid.length; y++) {
      let lineStart = null;
      for (let x = 0; x <= grid[y].length; x++) {
        const isAlive = x < grid[y].length && grid[y][x] === 1;
        
        if (isAlive && lineStart === null) {
          lineStart = x;
        } else if (!isAlive && lineStart !== null) {
          // End of line segment
          const x1 = margin + lineStart * size + size / 2;
          const x2 = margin + (x - 1) * size + size / 2;
          const cy = margin + y * size + size / 2;
          paths.push(`    <line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"/>`);
          lineStart = null;
        }
      }
    }

    // Vertical lines
    for (let x = 0; x < grid[0].length; x++) {
      let lineStart = null;
      for (let y = 0; y <= grid.length; y++) {
        const isAlive = y < grid.length && grid[y][x] === 1;
        
        if (isAlive && lineStart === null) {
          lineStart = y;
        } else if (!isAlive && lineStart !== null) {
          // End of line segment
          const y1 = margin + lineStart * size + size / 2;
          const y2 = margin + (y - 1) * size + size / 2;
          const cx = margin + x * size + size / 2;
          paths.push(`    <line x1="${cx}" y1="${y1}" x2="${cx}" y2="${y2}"/>`);
          lineStart = null;
        }
      }
    }

    return paths.join('\n') + '\n  </g>\n';
  }

  /**
   * Optimize square paths by combining adjacent cells
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @returns {Array<string>} Optimized SVG path elements
   */
  optimizeSquarePaths(grid) {
    const paths = [];
    const size = this.options.cellSize;
    const margin = this.options.margin;
    const visited = Array(grid.length).fill().map(() => Array(grid[0].length).fill(false));

    // Find rectangles of living cells
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 1 && !visited[y][x]) {
          // Find the extent of this rectangle
          let width = 1;
          let height = 1;

          // Extend horizontally
          while (x + width < grid[y].length && grid[y][x + width] === 1 && !visited[y][x + width]) {
            width++;
          }

          // Check if we can extend vertically
          let canExtend = true;
          while (canExtend && y + height < grid.length) {
            for (let dx = 0; dx < width; dx++) {
              if (grid[y + height][x + dx] !== 1 || visited[y + height][x + dx]) {
                canExtend = false;
                break;
              }
            }
            if (canExtend) {
              height++;
            }
          }

          // Mark cells as visited
          for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
              visited[y + dy][x + dx] = true;
            }
          }

          // Create rectangle
          const px = margin + x * size;
          const py = margin + y * size;
          const rectWidth = width * size;
          const rectHeight = height * size;
          
          if (width === 1 && height === 1) {
            // Single cell - draw as simple square
            paths.push(`    <rect x="${px}" y="${py}" width="${size}" height="${size}"/>`);
          } else {
            // Multiple cells - draw as larger rectangle
            paths.push(`    <rect x="${px}" y="${py}" width="${rectWidth}" height="${rectHeight}"/>`);
          }
        }
      }
    }

    return paths;
  }

  /**
   * Generate a unique filename with timestamp
   * @param {string} prefix - Filename prefix
   * @returns {string} Filename with timestamp
   */
  generateFilename(prefix = 'cellular-automata') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.svg`;
  }

  /**
   * Save SVG content to file
   * @param {string} svgContent - SVG content to save
   * @param {string} filepath - Path to save file
   * @returns {Promise<void>}
   */
  async save(svgContent, filepath) {
    // Dynamic import for Node.js file system
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filepath, svgContent, 'utf8');
  }

  /**
   * Export grid and save to file
   * @param {Array<Array<number>>} grid - 2D array of cell states
   * @param {string} filepath - Path to save file
   * @returns {Promise<string>} SVG content
   */
  async exportToFile(grid, filepath) {
    const svgContent = this.export(grid, filepath);
    await this.save(svgContent, filepath);
    return svgContent;
  }
}